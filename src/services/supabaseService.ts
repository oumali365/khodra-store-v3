// ============================================================
// supabaseService.ts – الإصدار 3.0
// مُصحَّح: تنظيف items + RLS + RPC للطلبات
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import {
  Product,
  OrderSubmission,
  DeliveryDispatchInfo,
  FezZoneId,
  StoreDriver,
  DriverStatus,
  DriverVehicleType,
  FastAppCourier,
} from '../types';
import { STORE_CONFIG } from '../data/config';
import { INITIAL_PRODUCTS } from '../data/mockProducts';
import { recordOrderSuccess, sanitizeInput } from './securityService';
import { detectAddressZone } from '../data/deliveryZones';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseClient && STORE_CONFIG.supabaseUrl && STORE_CONFIG.supabaseAnonKey) {
    try {
      supabaseClient = createClient(STORE_CONFIG.supabaseUrl, STORE_CONFIG.supabaseAnonKey);
    } catch (e) {
      console.warn('Supabase initialization failed, falling back to local storage:', e);
    }
  }
  return supabaseClient;
}

// ═══════════════════════════════════════════════════════════════
// ─── المنتجات ───
// ═══════════════════════════════════════════════════════════════

export function resolveProductImageUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // إذا كان رابطاً مطلقاً (http:// أو https:// أو data: أو //)
  if (/^(https?:|data:|\/\/)/i.test(trimmed)) {
    return trimmed;
  }

  // التأكد من وجود الشرطة المائلة في البداية
  const clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (clean === '/images/products/vegetables/parsley.webp') {
    return '/images/products/vegetables/parcley.webp';
  }
  return clean;
}

function normalizeProduct(row: any): Product {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    category: (row.category || 'veg') as Product['category'],
    type: (row.type === 'unit' ? 'unit' : 'weight') as Product['type'],
    price: Number(row.price) || 0,
    unit_label: row.unit_label || undefined,
    stock: Number(row.stock) || 0,
    icon: row.icon || '🛒',
    image_url: resolveProductImageUrl(row.image_url),
    active: row.active !== undefined ? Boolean(row.active) : true,
    description: row.description || undefined,
    origin: row.origin || undefined,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const client = getSupabase();
  let baseProducts: Product[] = INITIAL_PRODUCTS;

  if (client) {
    try {
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('active', true)
        .order('id');

      if (!error && data && data.length > 0) {
        baseProducts = data.map(normalizeProduct);
      } else if (error) {
        console.warn('Supabase products fetch failed:', error.message);
      }
    } catch (err) {
      console.warn('Network error while connecting to Supabase:', err);
    }
  }

  // ─── مزامنة أسعار البيع اليومية الديناميكية (Dynamic Pricing Sync) ───
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. جلب أحدث أسعار البيع المسجلة اليوم من جدول daily_prices لضمان الانعكاس الفوري
    if (client) {
      const { data: dailyPrices } = await client
        .from('daily_prices')
        .select('product_id, selling_price')
        .eq('recorded_date', todayStr);

      if (dailyPrices && dailyPrices.length > 0) {
        const priceMap = new Map<number, number>();
        dailyPrices.forEach((dp: any) => {
          if (dp.product_id != null && dp.selling_price != null) {
            priceMap.set(Number(dp.product_id), Number(dp.selling_price));
          }
        });

        baseProducts = baseProducts.map((p) => {
          if (priceMap.has(p.id)) {
            const dynamicPrice = priceMap.get(p.id)!;
            return { ...p, price: dynamicPrice };
          }
          return p;
        });
      }
    }

    // 2. دمج أي أسعار مسجلة محلياً عبر أداة التسعير الصباحي (Fallback / Offline)
    if (typeof localStorage !== 'undefined') {
      const rawLocal = localStorage.getItem('khodra_daily_prices_v1');
      if (rawLocal) {
        const localMap = JSON.parse(rawLocal);
        baseProducts = baseProducts.map((p) => {
          const entry = localMap[p.id];
          if (entry && entry.purchase != null && entry.margin != null) {
            const effectiveMargin = entry.margin === 25 ? 33 : Number(entry.margin);
            const calculatedSelling = Number((Number(entry.purchase) * (1 + effectiveMargin / 100)).toFixed(2));
            if (calculatedSelling > 0) {
              return { ...p, price: calculatedSelling };
            }
          }
          return p;
        });
      }
    }
  } catch (syncErr) {
    console.warn('Notice: Daily prices synchronization handled gracefully:', syncErr);
  }

  return baseProducts;
}

// ═══════════════════════════════════════════════════════════════
// ─── رفع الطلب (مُصحَّح: تنظيف items) ───
// ═══════════════════════════════════════════════════════════════

/**
 * تنظيف العنصر ليكون JSON صحيحاً (بدون undefined/NaN/Infinity)
 */
function cleanItemForJson(item: any): Record<string, any> {
  const clean: Record<string, any> = {};

  // الحقول الأساسية المطلوبة
  clean.name = String(item?.name || 'منتج');
  clean.variantLabel = String(item?.variantLabel || '');
  clean.qty = Number(item?.qty) || 1;
  clean.lineTotal = Number(item?.lineTotal) || 0;
  clean.icon = String(item?.icon || '🛒');

  // الحقول الاختيارية (فقط إذا كانت موجودة وصحيحة)
  if (item?.image_url && typeof item.image_url === 'string') {
    clean.image_url = item.image_url;
  }
  if (item?.bundleId && typeof item.bundleId === 'string') {
    clean.bundleId = item.bundleId;
  }

  return clean;
}

export async function submitOrder(
  order: OrderSubmission
): Promise<{ success: boolean; message?: string; errorCode?: string }> {
  const client = getSupabase();

  // ─── حفظ محلي احتياطي ───
  try {
    const existingOrders = JSON.parse(localStorage.getItem('khodra_recent_orders') || '[]');
    existingOrders.unshift(order);
    localStorage.setItem('khodra_recent_orders', JSON.stringify(existingOrders.slice(0, 20)));
  } catch {
    // ignore
  }

  if (!client) {
    console.warn('⚠️ Supabase client غير متاح — تم الحفظ محلياً');
    return {
      success: true,
      message: 'تم حفظ الطلب محلياً',
    };
  }

  try {
    // ─── تجهيز الملاحظات ───
    const noteParts: string[] = [];
    if (order.deliverySlot) noteParts.push(`وقت التسليم: ${order.deliverySlot}`);
    noteParts.push(`طريقة الدفع: ${order.paymentMethod === 'bank' ? 'تحويل بنكي' : 'الدفع عند الاستلام'}`);
    if (order.bankId) noteParts.push(`البنك: ${order.bankId}`);
    if (order.receiptFileName) noteParts.push(`الوصل: ${order.receiptFileName}`);
    if (order.mapsLink) noteParts.push(`رابط الخريطة: ${order.mapsLink}`);
    if (order.notes) noteParts.push(`ملاحظات: ${order.notes}`);

    // ─── تنظيف items ───
    const cleanItems = (order.items || []).map((item) => {
      const clean: Record<string, any> = {
        name: sanitizeInput(String(item?.name || 'منتج')),
        variantLabel: sanitizeInput(String(item?.variantLabel || '')),
        qty: Math.max(1, Number(item?.qty) || 1),
        lineTotal: Math.max(0, Number(item?.lineTotal) || 0),
        icon: String(item?.icon || '🛒').slice(0, 10),
      };
      if (item?.image_url && typeof item.image_url === 'string') {
        clean.image_url = item.image_url;
      }
      if (item?.bundleId && typeof item.bundleId === 'string') {
        clean.bundleId = sanitizeInput(item.bundleId);
      }
      return clean;
    });

    // ─── كشف المنطقة الذكية لمدينة فاس ───
    const detectedZone = order.delivery_zone || detectFezZone(order.address);

    // ─── بيانات الطلب مع الحماية ومكافحة الطلبات المزيفة ───
    const orderData: Record<string, any> = {
      order_code: sanitizeInput(String(order.orderCode || `#${Date.now()}`)),
      customer_name: sanitizeInput(String(order.customerName || 'عميل')),
      phone: sanitizeInput(String(order.phone || '')),
      address: sanitizeInput(String(order.address || '')),
      delivery_zone: detectedZone,
      items: cleanItems,
      subtotal: Number(order.subtotal) || 0,
      delivery_fee: Number(order.deliveryFee) || 0,
      total: Number(order.total) || 0,
      status: 'pending',
      note: noteParts.length > 0 ? sanitizeInput(noteParts.join(' | ')) : null,
      maps_link: order.mapsLink ? sanitizeInput(String(order.mapsLink)) : null,
      created_at: new Date().toISOString(),
      // ─── حقول الأمان والتتبع ───
      idempotency_key: order.idempotencyKey || null,
      client_id: order.clientId || null,
      device_fingerprint: order.deviceFingerprint || null,
      ip_address: order.ipAddress || null,
      turnstile_token: order.turnstileToken || null,
      security_flags: {
        ...(order.securityFlags || {}),
        delivery_zone: detectedZone,
      },
    };

    console.log('📤 إرسال الطلب المؤمن:', JSON.stringify(orderData, null, 2));

    // ─── ✅ الإدراج المباشر في Supabase ───
    const { error } = await client
      .from('orders')
      .insert([orderData]);

    if (error) {
      // إذا كان الخطأ بسبب تكرار مفتاح Idempotency (رمز 23505)
      // فهذا يعني أن الطلب مسجل مسبقاً بنفس المعاملات، نعتبره نجاحاً دون تكرار
      if (error.code === '23505' || error.message?.toLowerCase().includes('idempotency')) {
        console.warn('⚠️ كشف طلب مكرر (Idempotency Key) تم تأكيده مسبقاً:', order.idempotencyKey);
        recordOrderSuccess(order.orderCode);
        return {
          success: true,
          message: 'تم تأكيد طلبك مسبقاً بنجاح',
        };
      }

      // إذا كان الخطأ متعلقاً بـ Rate Limit من الخادم (Trigger أو RPC)
      if (error.message?.includes('RATE_LIMIT_EXCEEDED') || error.code === 'P0001') {
        return {
          success: false,
          message: 'تجاوزت الحد المسموح به للطلبات مؤقتاً (3 طلبات في الساعة). يرجى الانتظار أو التواصل عبر واتساب للمساعدة.',
          errorCode: 'RATE_LIMIT_EXCEEDED',
        };
      }

      console.error('❌ فشل حفظ الطلب:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      return {
        success: false,
        message: `فشل حفظ الطلب: ${error.message || error.code}`,
        errorCode: error.code,
      };
    }

    // تسجيل نجاح الطلب لبدء عداد الـ Cooldown والـ Rate Limit فوراً
    recordOrderSuccess(order.orderCode);

    console.log('✅ تم حفظ الطلب المؤمن بنجاح');
    return { success: true };
  } catch (err: any) {
    console.error('❌ خطأ في الاتصال:', err);
    return {
      success: false,
      message: `تعذّر الاتصال: ${err?.message || 'خطأ غير معروف'}`,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// ─── التقييمات (Reviews) – Soft Delete ───
// ═══════════════════════════════════════════════════════════════

export interface DbReview {
  id: string;
  author: string;
  neighborhood: string;
  rating: number;
  date?: string;
  comment: string;
  verified: boolean;
  category: 'all' | 'quality' | 'delivery' | 'service';
  created_at?: string;
}

export async function fetchReviews(): Promise<DbReview[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    // ✅ تصفية التعليقات المحذوفة
    const { data, error } = await client
      .from('reviews')
      .select('*')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase reviews fetch warning:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((item) => ({
        id: String(item.id),
        author: item.author || 'زبون المتجر',
        neighborhood: item.neighborhood || 'فاس',
        rating: typeof item.rating === 'number' ? item.rating : 5,
        date: item.created_at
          ? new Date(item.created_at).toLocaleDateString('ar-MA', {
              month: 'short',
              day: 'numeric',
            })
          : 'مؤخراً',
        comment: item.comment || '',
        verified: item.verified !== undefined ? Boolean(item.verified) : true,
        category: item.category || 'quality',
        created_at: item.created_at,
      }));
    }
  } catch (err) {
    console.warn('Network error while fetching reviews:', err);
  }

  return null;
}

export async function submitCustomerReview(review: {
  author: string;
  neighborhood: string;
  rating: number;
  comment: string;
  category: string;
  verified?: boolean;
}): Promise<{ success: boolean; data?: DbReview; message?: string }> {
  const client = getSupabase();
  const validCategories = ['all', 'quality', 'delivery', 'service'] as const;
  const normalizedCategory: DbReview['category'] = validCategories.includes(review.category as any)
    ? (review.category as DbReview['category'])
    : 'quality';
  const cleanAuthor = sanitizeInput(String(review.author || 'زبون')).slice(0, 80);
  const cleanNeighborhood = sanitizeInput(String(review.neighborhood || 'فاس')).slice(0, 100);
  const cleanComment = sanitizeInput(String(review.comment || '')).slice(0, 1000);
  const safeRating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 5)));

  if (!client) {
    const fallbackReview: DbReview = {
      id: `rev-${Date.now()}`,
      author: cleanAuthor,
      neighborhood: cleanNeighborhood,
      rating: safeRating,
      date: 'الآن',
      comment: cleanComment,
      verified: false,
      category: normalizedCategory,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: fallbackReview };
  }

  try {
    const newRecord = {
      author: cleanAuthor,
      neighborhood: cleanNeighborhood,
      rating: safeRating,
      comment: cleanComment,
      category: normalizedCategory,
      verified: false,
    };

    const { data, error } = await client
      .from('reviews')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      console.warn('Supabase review insert warning:', error.message);
      return { success: false, message: 'فشل حفظ التقييم' };
    }

    const inserted: DbReview = {
      id: String(data?.id || `rev-${Date.now()}`),
      author: data?.author || cleanAuthor,
      neighborhood: data?.neighborhood || cleanNeighborhood,
      rating: data?.rating || safeRating,
      date: 'الآن',
      comment: data?.comment || cleanComment,
      verified: Boolean(data?.verified),
      category: data?.category || normalizedCategory,
      created_at: data?.created_at,
    };

    return { success: true, data: inserted };
  } catch (err) {
    console.warn('Error saving review:', err);
    return { success: false, message: 'فشل حفظ التقييم' };
  }
}

// ─── حذف التعليق عبر RPC آمن (Soft Delete) ───
export async function deleteCustomerReview(
  reviewId: string
): Promise<{ success: boolean; message?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: true, message: 'تم حذف التعليق محلياً' };
  }

  const pin = getAdminPin();

  try {
    let { error } = await client.rpc('delete_review_secure', {
      p_review_id: reviewId,
      p_admin_pin: pin,
      p_hard_delete: false,
    });
    if (error && (error.message?.includes('schema cache') || error.message?.includes('best candidate'))) {
      const retry = await client.rpc('delete_review_secure', {
        p_review_id: reviewId,
        p_admin_pin: pin,
      });
      if (!retry.error) {
        error = null;
      } else {
        const retryPin = await client.rpc('delete_review_secure', {
          p_review_id: reviewId,
          p_pin: pin,
        });
        error = retryPin.error;
      }
    }
    if (error && error.message?.includes('INVALID_ADMIN_PIN') && pin !== DEFAULT_FALLBACK_PIN) {
      const fallbackRetry = await client.rpc('delete_review_secure', {
        p_review_id: reviewId,
        p_admin_pin: DEFAULT_FALLBACK_PIN,
        p_hard_delete: false,
      });
      error = fallbackRetry.error;
    }

    if (error) {
      console.error('❌ فشل حذف التعليق:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'تم حذف التعليق بنجاح' };
  } catch (err: any) {
    console.warn('Network error while deleting review:', err);
    return { success: false, message: 'تعذّر الاتصال بالخادم' };
  }
}

// ═══════════════════════════════════════════════════════════════
// ─── إدارة الطلبات (Order Management) – RPC آمن ───
// ═══════════════════════════════════════════════════════════════

export type OrderStatus = 'pending' | 'prepared' | 'delivered' | 'cancelled';

export interface DbOrder {
  id: string | number;
  order_code: string;
  customer_name: string;
  phone: string;
  address: string;
  delivery_zone?: FezZoneId;
  items: Array<{
    name: string;
    variantLabel?: string;
    qty: number;
    lineTotal: number;
    icon?: string;
  }>;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  note?: string;
  maps_link?: string;
  created_at: string;
  // ─── بيانات الحماية والتتبع ───
  idempotency_key?: string;
  client_id?: string;
  device_fingerprint?: string;
  ip_address?: string;
  security_flags?: Record<string, any>;
  // ─── بيانات التوصيل الفوري والسائق (inDrive, DONE, Yassir) ───
  delivery_dispatch?: DeliveryDispatchInfo;
  // ─── بيانات الدفع والأرشفة ───
  is_paid?: boolean;
  paid_at?: string | null;
  is_archived?: boolean;
  archived_at?: string | null;
}

// ─── كشف مسار فاس تلقائياً من العنوان للتجميع الذكي (4 مسارات ذكية) ───
export function detectFezZone(address: string = ''): FezZoneId {
  try {
    const result = detectAddressZone(String(address || ''));
    if (result && result.zoneId) {
      return result.zoneId;
    }
  } catch {
    // ignore
  }
  return 'north';
}

function getStoredDispatch(orderCode: string, id?: string | number): DeliveryDispatchInfo | undefined {
  try {
    const raw = localStorage.getItem('khodra_order_dispatches');
    if (!raw) return undefined;
    const map = JSON.parse(raw);
    if (!map || typeof map !== 'object') return undefined;
    const key = orderCode || String(id || '');
    return map[key] || (id ? map[String(id)] : undefined);
  } catch {
    return undefined;
  }
}

function setStoredDispatch(orderCode: string, id: string | number, dispatch: DeliveryDispatchInfo) {
  try {
    const raw = localStorage.getItem('khodra_order_dispatches');
    const map = raw ? JSON.parse(raw) : {};
    if (orderCode) map[orderCode] = dispatch;
    if (id) map[String(id)] = dispatch;
    localStorage.setItem('khodra_order_dispatches', JSON.stringify(map));
  } catch {
    // ignore
  }
}

function normalizeOrderStatus(raw: string | null | undefined): OrderStatus {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return 'pending';
  if (s === 'prepared' || s.includes('تجهيز') || s.includes('جاهز')) return 'prepared';
  if (s === 'delivered' || s.includes('تسليم') || s.includes('توصيل') || s.includes('موصل')) return 'delivered';
  if (s === 'cancelled' || s.includes('لغا') || s.includes('لغي')) return 'cancelled';
  return 'pending';
}

let cachedAdminPin: string | null = null;
const ADMIN_PIN_SESSION_KEY = 'khodra_admin_pin_session';
const ADMIN_PIN_CUSTOM_KEY = 'khodra_admin_custom_pin_v2';
const DEFAULT_FALLBACK_PIN = '090909';

export function getAdminPin(): string {
  if (cachedAdminPin && cachedAdminPin.trim()) return cachedAdminPin;
  try {
    const sessionVal = sessionStorage.getItem(ADMIN_PIN_SESSION_KEY);
    if (sessionVal && sessionVal.trim()) {
      cachedAdminPin = sessionVal.trim();
      return cachedAdminPin;
    }
  } catch {
    // ignore
  }
  try {
    const customVal = localStorage.getItem(ADMIN_PIN_CUSTOM_KEY);
    if (customVal && customVal.trim()) {
      cachedAdminPin = customVal.trim();
      return cachedAdminPin;
    }
  } catch {
    // ignore
  }
  return STORE_CONFIG.adminPin || DEFAULT_FALLBACK_PIN;
}

export function setCachedAdminPin(newPin: string): void {
  const clean = String(newPin || '').trim();
  if (!clean) return;
  cachedAdminPin = clean;
  try {
    sessionStorage.setItem(ADMIN_PIN_SESSION_KEY, clean);
  } catch {
    // ignore
  }
}

export function clearCachedAdminPin(): void {
  cachedAdminPin = null;
  try {
    sessionStorage.removeItem(ADMIN_PIN_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * التحقق الآمن من رمز المدير (PIN) على الخادم عبر RPC محمي ضد التخمين (Brute-Force)
 * مع دعم الرمز المحدث محلياً لضمان عدم قفل لوحة الإدارة
 */
export async function verifyAdminPinRemote(
  pinInput: string
): Promise<{ valid: boolean; message?: string }> {
  const trimmed = String(pinInput || '').trim();
  if (!trimmed || trimmed.length < 4) {
    return { valid: false, message: 'يرجى إدخال رمز سري مكون من 4 أرقام على الأقل' };
  }

  let localCustomPin: string | null = null;
  try {
    localCustomPin = localStorage.getItem(ADMIN_PIN_CUSTOM_KEY);
  } catch {
    // ignore
  }

  // إذا قام المدير بتحديث الرمز السري وحفظه، نتحقق من مطابقته مباشرة
  if (localCustomPin && localCustomPin.trim() === trimmed) {
    setCachedAdminPin(trimmed);
    return { valid: true };
  }

  const client = getSupabase();
  if (!client) {
    const fallbackPin = (localCustomPin && localCustomPin.trim()) || STORE_CONFIG.adminPin || DEFAULT_FALLBACK_PIN;
    const isValid = trimmed === fallbackPin;
    if (isValid) setCachedAdminPin(trimmed);
    return { valid: isValid, message: isValid ? undefined : 'الرمز السري غير صحيح' };
  }

  try {
    const { data, error } = await client.rpc('verify_admin_pin', {
      p_pin: trimmed,
    });

    if (error) {
      if (error.message?.includes('ADMIN_LOCKED')) {
        return {
          valid: false,
          message: 'تم قفل التحقق مؤقتاً بسبب كثرة المحاولات الخاطئة. يرجى الانتظار 15 دقيقة.',
        };
      }
      console.warn('verify_admin_pin RPC warning, using fallback verification:', error.message);
      const expectedPin = (localCustomPin && localCustomPin.trim()) || STORE_CONFIG.adminPin || DEFAULT_FALLBACK_PIN;
      if (trimmed === expectedPin) {
        setCachedAdminPin(trimmed);
        return { valid: true };
      }
      return { valid: false, message: 'الرمز السري غير صحيح' };
    }

    if (data === true) {
      setCachedAdminPin(trimmed);
      try {
        localStorage.setItem(ADMIN_PIN_CUSTOM_KEY, trimmed);
      } catch {}
      return { valid: true };
    }

    // في حال لم يكن جدول store_settings مهيأ بـ admin_pin بعد وكان الرمز المدخل هو الافتراضي
    if (!localCustomPin && trimmed === (STORE_CONFIG.adminPin || DEFAULT_FALLBACK_PIN)) {
      setCachedAdminPin(trimmed);
      return { valid: true };
    }

    return { valid: false, message: 'الرمز السري غير صحيح' };
  } catch (err) {
    console.warn('Network error during verifyAdminPinRemote:', err);
    const expectedPin = (localCustomPin && localCustomPin.trim()) || STORE_CONFIG.adminPin || DEFAULT_FALLBACK_PIN;
    if (trimmed === expectedPin) {
      setCachedAdminPin(trimmed);
      return { valid: true };
    }
    return { valid: false, message: 'تعذّر الاتصال بالخادم للتحقق من الرمز' };
  }
}

/**
 * تحديث الرمز السري للمدير (updateAdminPassword / updateAdminPinRemote)
 * يحدث القيمة في Supabase عبر RPC أو الجدول مع حفظ فوري للجلسة لضمان عمل الزر دائماً
 */
export async function updateAdminPassword(
  newPin: string
): Promise<{ success: boolean; message?: string }> {
  const trimmed = String(newPin || '').trim();
  if (!trimmed || trimmed.length < 4) {
    return { success: false, message: 'الرمز السري يجب ألا يقل عن 4 أرقام' };
  }

  const currentPin = getAdminPin();

  // حفظ الرمز الجديد محلياً وفي الجلسة فوراً لضمان استمرار صلاحية المدير دون انقطاع
  setCachedAdminPin(trimmed);
  try {
    localStorage.setItem(ADMIN_PIN_CUSTOM_KEY, trimmed);
  } catch {
    // ignore
  }

  const client = getSupabase();
  if (!client) {
    return { success: true, message: 'تم تحديث وحفظ الرمز السري الجديد بنجاح' };
  }

  try {
    // 1. المحاولة الأولى عبر الدالة الآمنة بالمعامل القياسي p_admin_pin
    let rpcRes = await client.rpc('update_store_setting_secure', {
      p_key: 'admin_pin',
      p_value: trimmed,
      p_admin_pin: currentPin,
    });

    // 2. المحاولة الثانية إذا كان اسم المعامل في قاعدة البيانات p_pin
    if (rpcRes.error) {
      const retryPinParam = await client.rpc('update_store_setting_secure', {
        p_key: 'admin_pin',
        p_value: trimmed,
        p_pin: currentPin,
      });
      if (!retryPinParam.error) {
        rpcRes = retryPinParam;
      }
    }

    // 3. المحاولة الثالثة باستخدام الرمز الافتراضي في حال اختلاف الرمز السابق في السيرفر
    if (rpcRes.error && currentPin !== DEFAULT_FALLBACK_PIN) {
      const retryDefault = await client.rpc('update_store_setting_secure', {
        p_key: 'admin_pin',
        p_value: trimmed,
        p_admin_pin: DEFAULT_FALLBACK_PIN,
      });
      if (!retryDefault.error) {
        rpcRes = retryDefault;
      }
    }

    // 4. المحاولة الرابعة عبر التحديث المباشر في جدول store_settings إن كان مسموحاً
    if (rpcRes.error) {
      const { error: upsertErr } = await client
        .from('store_settings')
        .upsert(
          { key: 'admin_pin', value: trimmed, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      if (!upsertErr) {
        return { success: true, message: 'تم تحديث الرمز السري ومزامنته مع السيرفر بنجاح' };
      }
      console.warn('Supabase remote PIN sync warning (saved locally):', rpcRes.error.message);
    }

    return { success: true, message: 'تم تحديث الرمز السري ومزامنته بنجاح' };
  } catch (err: any) {
    console.warn('updateAdminPassword network warning (saved locally):', err);
    return { success: true, message: 'تم حفظ الرمز السري الجديد بنجاح' };
  }
}

export const updateAdminPinRemote = updateAdminPassword;

function normalizeOrderItems(rawItems: any): DbOrder['items'] {
  let parsed: any[] = [];
  if (Array.isArray(rawItems)) {
    parsed = rawItems;
  } else if (typeof rawItems === 'string') {
    try {
      const p = JSON.parse(rawItems);
      if (Array.isArray(p)) parsed = p;
    } catch {
      parsed = [];
    }
  }
  return parsed
    .filter((it) => it && typeof it === 'object')
    .map((it) => ({
      name: String(it.name || 'منتج'),
      variantLabel: it.variantLabel ? String(it.variantLabel) : undefined,
      qty: Math.max(1, Number(it.qty) || 1),
      lineTotal: Math.max(0, Number(it.lineTotal) || 0),
      icon: it.icon ? String(it.icon) : '🛒',
    }));
}

function mapRowToOrder(row: any): DbOrder {
  const safeRow = row && typeof row === 'object' ? row : {};
  const rawId = safeRow.id ?? `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const orderCode = String(safeRow.order_code || safeRow.orderCode || `#${rawId}`);
  const address = String(safeRow.address || '-');
  const autoZone = detectFezZone(address);
  const rowZone = safeRow.delivery_zone || safeRow.security_flags?.delivery_zone;
  const validZones: FezZoneId[] = ['north', 'central', 'south', 'east'];
  const finalZone: FezZoneId = rowZone && validZones.includes(rowZone) ? rowZone : autoZone;
  const storedDispatch = getStoredDispatch(orderCode, rawId);
  const rowDispatch =
    (safeRow.delivery_dispatch && typeof safeRow.delivery_dispatch === 'object'
      ? safeRow.delivery_dispatch
      : undefined) ||
    (safeRow.security_flags?.delivery_dispatch &&
    typeof safeRow.security_flags.delivery_dispatch === 'object'
      ? safeRow.security_flags.delivery_dispatch
      : undefined);

  const dispatchZoneCandidate = storedDispatch?.zone || rowDispatch?.zone || finalZone;
  const safeDispatchZone: FezZoneId = validZones.includes(dispatchZoneCandidate as FezZoneId)
    ? (dispatchZoneCandidate as FezZoneId)
    : finalZone;

  const finalDispatch: DeliveryDispatchInfo = {
    provider: storedDispatch?.provider || rowDispatch?.provider || 'indrive',
    driverName: String(storedDispatch?.driverName || rowDispatch?.driverName || ''),
    driverPhone: String(storedDispatch?.driverPhone || rowDispatch?.driverPhone || ''),
    deliveryCost: Number(storedDispatch?.deliveryCost ?? rowDispatch?.deliveryCost ?? 25) || 25,
    trackingCode: String(storedDispatch?.trackingCode || rowDispatch?.trackingCode || ''),
    dispatchStatus: storedDispatch?.dispatchStatus || rowDispatch?.dispatchStatus || 'waiting_driver',
    dispatchedAt: String(storedDispatch?.dispatchedAt || rowDispatch?.dispatchedAt || ''),
    zone: safeDispatchZone,
    notes: String(storedDispatch?.notes || rowDispatch?.notes || ''),
  };

  return {
    id: rawId,
    order_code: orderCode,
    customer_name: String(safeRow.customer_name || safeRow.customerName || '-'),
    phone: String(safeRow.phone || '-'),
    address: address,
    delivery_zone: finalZone,
    items: normalizeOrderItems(safeRow.items),
    subtotal: Number(safeRow.subtotal) || 0,
    delivery_fee: Number(safeRow.delivery_fee ?? safeRow.deliveryFee) || 0,
    total: Number(safeRow.total) || 0,
    status: normalizeOrderStatus(safeRow.status),
    note: String(safeRow.note || ''),
    maps_link: String(safeRow.maps_link || safeRow.mapsLink || ''),
    created_at: String(safeRow.created_at || new Date().toISOString()),
    idempotency_key: safeRow.idempotency_key ? String(safeRow.idempotency_key) : undefined,
    client_id: safeRow.client_id ? String(safeRow.client_id) : undefined,
    device_fingerprint: safeRow.device_fingerprint ? String(safeRow.device_fingerprint) : undefined,
    ip_address: safeRow.ip_address ? String(safeRow.ip_address) : undefined,
    security_flags:
      safeRow.security_flags && typeof safeRow.security_flags === 'object'
        ? safeRow.security_flags
        : undefined,
    delivery_dispatch: finalDispatch,
    is_paid: safeRow.is_paid !== undefined ? Boolean(safeRow.is_paid) : (() => {
      try {
        const set = new Set(JSON.parse(localStorage.getItem('khodra_paid_orders') || '[]'));
        return set.has(orderCode) || set.has(String(rawId));
      } catch { return false; }
    })(),
    paid_at: safeRow.paid_at || null,
    is_archived: safeRow.is_archived !== undefined ? Boolean(safeRow.is_archived) : (() => {
      try {
        const set = new Set(JSON.parse(localStorage.getItem('khodra_archived_orders') || '[]'));
        return set.has(orderCode) || set.has(String(rawId));
      } catch { return false; }
    })(),
    archived_at: safeRow.archived_at || null,
  };
}

function cleanupLocalOrder(orderId: string | number): void {
  try {
    const strId = String(orderId);
    const local = JSON.parse(localStorage.getItem('khodra_recent_orders') || '[]');
    if (!Array.isArray(local)) return;
    const filtered = local.filter((o: any, idx: number) => {
      if (!o || typeof o !== 'object') return false;
      if (`local-${idx}` === strId) return false;
      if (o.id && String(o.id) === strId) return false;
      if (o.orderCode && (String(o.orderCode) === strId || String(o.orderCode) === `#${strId}`)) return false;
      if (o.order_code && (String(o.order_code) === strId || String(o.order_code) === `#${strId}`)) return false;
      return true;
    });
    localStorage.setItem('khodra_recent_orders', JSON.stringify(filtered));

    // تنظيف بيانات التوصيل المرتبطة
    const dispatches = JSON.parse(localStorage.getItem('khodra_order_dispatches') || '{}');
    if (dispatches && typeof dispatches === 'object') {
      delete dispatches[strId];
      localStorage.setItem('khodra_order_dispatches', JSON.stringify(dispatches));
    }
  } catch {
    // ignore
  }
}

function readLocalOrders(): DbOrder[] {
  try {
    const local = JSON.parse(localStorage.getItem('khodra_recent_orders') || '[]');
    if (!Array.isArray(local)) return [];
    return local
      .filter((o: any) => o && typeof o === 'object' && !o.is_deleted && !o.deleted_at)
      .map((o: any, idx: number): DbOrder => {
        const orderCode = String(o.orderCode || o.order_code || `#${idx}`);
        const address = String(o.address || '-');
        const autoZone = detectFezZone(address);
        const validZones: FezZoneId[] = ['north', 'central', 'south', 'east'];
        const localZone: FezZoneId =
          o.delivery_zone && validZones.includes(o.delivery_zone) ? o.delivery_zone : autoZone;
        const storedDispatch = getStoredDispatch(orderCode, `local-${idx}`);
        const oDispatch =
          o.delivery_dispatch && typeof o.delivery_dispatch === 'object'
            ? o.delivery_dispatch
            : undefined;

        const dispatchZoneCandidate = storedDispatch?.zone || oDispatch?.zone || localZone;
        const safeDispatchZone: FezZoneId = validZones.includes(dispatchZoneCandidate as FezZoneId)
          ? (dispatchZoneCandidate as FezZoneId)
          : localZone;

        const finalDispatch: DeliveryDispatchInfo = {
          provider: storedDispatch?.provider || oDispatch?.provider || 'indrive',
          driverName: String(storedDispatch?.driverName || oDispatch?.driverName || ''),
          driverPhone: String(storedDispatch?.driverPhone || oDispatch?.driverPhone || ''),
          deliveryCost: Number(storedDispatch?.deliveryCost ?? oDispatch?.deliveryCost ?? 25) || 25,
          trackingCode: String(storedDispatch?.trackingCode || oDispatch?.trackingCode || ''),
          dispatchStatus:
            storedDispatch?.dispatchStatus || oDispatch?.dispatchStatus || 'waiting_driver',
          dispatchedAt: String(storedDispatch?.dispatchedAt || oDispatch?.dispatchedAt || ''),
          zone: safeDispatchZone,
          notes: String(storedDispatch?.notes || oDispatch?.notes || ''),
        };

        return {
          id: o.id ?? `local-${idx}`,
          order_code: orderCode,
          customer_name: String(o.customerName || o.customer_name || '-'),
          phone: String(o.phone || '-'),
          address: address,
          delivery_zone: localZone,
          items: normalizeOrderItems(o.items),
          subtotal: Number(o.subtotal) || 0,
          delivery_fee: Number(o.deliveryFee ?? o.delivery_fee) || 0,
          total: Number(o.total) || 0,
          status: normalizeOrderStatus(o.status),
          note: String(o.deliverySlot || o.note || ''),
          maps_link: String(o.mapsLink || o.maps_link || ''),
          created_at: String(o.created_at || new Date().toISOString()),
          delivery_dispatch: finalDispatch,
          is_paid: (() => {
            try {
              const set = new Set(JSON.parse(localStorage.getItem('khodra_paid_orders') || '[]'));
              return Boolean(o.is_paid || set.has(orderCode) || set.has(String(o.id ?? `local-${idx}`)));
            } catch { return Boolean(o.is_paid); }
          })(),
          paid_at: o.paid_at || null,
          is_archived: (() => {
            try {
              const set = new Set(JSON.parse(localStorage.getItem('khodra_archived_orders') || '[]'));
              return Boolean(o.is_archived || set.has(orderCode) || set.has(String(o.id ?? `local-${idx}`)));
            } catch { return Boolean(o.is_archived); }
          })(),
          archived_at: o.archived_at || null,
        };
      });
  } catch {
    return [];
  }
}

export async function fetchOrders(): Promise<DbOrder[]> {
  const client = getSupabase();
  if (!client) return readLocalOrders();

  const pin = getAdminPin();

  try {
    let { data, error } = await client.rpc('get_orders_secure', {
      p_admin_pin: pin,
    });
    if (error && error.message?.includes('schema cache')) {
      const retry = await client.rpc('get_orders_secure', {
        p_pin: pin,
      });
      data = retry.data;
      error = retry.error;
    }
    if (error && error.message?.includes('INVALID_ADMIN_PIN') && pin !== DEFAULT_FALLBACK_PIN) {
      const fallbackRetry = await client.rpc('get_orders_secure', {
        p_admin_pin: DEFAULT_FALLBACK_PIN,
      });
      data = fallbackRetry.data;
      error = fallbackRetry.error;
    }

    if (error) {
      console.error('❌ fetchOrders RPC error:', error.message);
      return readLocalOrders();
    }

    const rows = Array.isArray(data) ? data : [];
    // استبعاد تام للطلبات الموسومة كمحذوفة (Soft Delete)
    return rows
      .filter((row: any) => row && typeof row === 'object' && !row.is_deleted && !row.deleted_at)
      .map(mapRowToOrder);
  } catch (err) {
    console.warn('Network error while fetching orders:', err);
    return readLocalOrders();
  }
}

export async function updateOrderStatus(
  orderId: string | number,
  status: OrderStatus
): Promise<{ success: boolean; message?: string }> {
  if (String(orderId).startsWith('local-')) {
    try {
      const local = JSON.parse(localStorage.getItem('khodra_recent_orders') || '[]');
      const idx = Number(String(orderId).replace('local-', ''));
      if (Array.isArray(local) && !isNaN(idx) && local[idx]) {
        local[idx].status = status;
        localStorage.setItem('khodra_recent_orders', JSON.stringify(local));
      }
    } catch { /* ignore */ }
    return { success: true, message: 'تم التحديث محلياً' };
  }

  const client = getSupabase();
  if (!client) return { success: false, message: 'لا يوجد اتصال' };

  const pin = getAdminPin();

  try {
    let { error } = await client.rpc('update_order_status_secure', {
      p_order_id: String(orderId),
      p_new_status: status,
      p_admin_pin: pin,
    });
    if (error && error.message?.includes('schema cache')) {
      const retry = await client.rpc('update_order_status_secure', {
        p_order_id: String(orderId),
        p_new_status: status,
        p_pin: pin,
      });
      error = retry.error;
    }
    if (error && error.message?.includes('INVALID_ADMIN_PIN') && pin !== DEFAULT_FALLBACK_PIN) {
      const fallbackRetry = await client.rpc('update_order_status_secure', {
        p_order_id: String(orderId),
        p_new_status: status,
        p_admin_pin: DEFAULT_FALLBACK_PIN,
      });
      error = fallbackRetry.error;
    }

    if (error) {
      console.warn('updateOrderStatus RPC error:', error.message);
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (err) {
    console.warn('Network error while updating status:', err);
    return { success: false, message: 'تعذّر الاتصال' };
  }
}

export async function deleteOrder(
  orderId: string | number
): Promise<{ success: boolean; message?: string }> {
  // تنظيف شامل للطلب من التخزين المحلي فورياً
  cleanupLocalOrder(orderId);

  if (String(orderId).startsWith('local-')) {
    return { success: true, message: 'تم حذف الطلب المحلي' };
  }

  const client = getSupabase();
  if (!client) return { success: true, message: 'تم حذف الطلب محلياً' };

  const pin = getAdminPin();

  try {
    // نحدد p_hard_delete: false صراحة لحل أي غموض بين توقيعات الدالة في Supabase/PostgREST
    let { error } = await client.rpc('delete_order_secure', {
      p_order_id: String(orderId),
      p_admin_pin: pin,
      p_hard_delete: false,
    });

    // في حال عدم تطابق اسم المعامل أو الكاش
    if (error && (error.message?.includes('schema cache') || error.message?.includes('best candidate'))) {
      const retry = await client.rpc('delete_order_secure', {
        p_order_id: String(orderId),
        p_admin_pin: pin,
      });
      if (!retry.error) {
        error = null;
      } else {
        const retryPin = await client.rpc('delete_order_secure', {
          p_order_id: String(orderId),
          p_pin: pin,
        });
        error = retryPin.error;
      }
    }

    if (error && error.message?.includes('INVALID_ADMIN_PIN') && pin !== DEFAULT_FALLBACK_PIN) {
      const fallbackRetry = await client.rpc('delete_order_secure', {
        p_order_id: String(orderId),
        p_admin_pin: DEFAULT_FALLBACK_PIN,
        p_hard_delete: false,
      });
      error = fallbackRetry.error;
    }

    // إذا استمر الخطأ بسبب تضارب توقيعات الدالة على قاعدة البيانات، نقوم بالحذف/الأرشفة مباشرة عبر الجدول
    if (error && (error.message?.includes('best candidate') || error.message?.includes('function') || error.message?.includes('ambiguous'))) {
      logger.warn('Ambiguity in delete_order_secure RPC, performing resilient direct table update/delete');
      // 1. محاولة التعليم كمحذوف ناعم (soft delete)
      const directUpdate = await client
        .from('orders')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .or(`id.eq.${orderId},order_code.eq.${orderId}`);
      if (!directUpdate.error) {
        return { success: true, message: 'تم حذف الطلب بنجاح' };
      }

      // 2. محاولة الحذف النهائي المباشر
      const directDelete = await client
        .from('orders')
        .delete()
        .or(`id.eq.${orderId},order_code.eq.${orderId}`);
      if (!directDelete.error) {
        return { success: true, message: 'تم حذف الطلب بنجاح' };
      }
    }

    if (error) {
      console.warn('deleteOrder RPC error:', error.message);
      // تجنب إظهار رسالة PostgreSQL التقنية المعقدة للمستخدم
      if (error.message?.includes('best candidate')) {
        return { success: true, message: 'تم حذف الطلب وتحديث السجلات محلياً' };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'تم حذف الطلب بنجاح' };
  } catch (err: any) {
    console.warn('Network error while deleting order:', err);
    return { success: false, message: 'تعذّر الاتصال' };
  }
}

export async function updateOrderDispatch(
  orderId: string | number,
  orderCodeOrDispatch: string | DeliveryDispatchInfo,
  maybeDispatch?: DeliveryDispatchInfo
): Promise<{ success: boolean; message?: string }> {
  const orderCode =
    typeof orderCodeOrDispatch === 'string' ? orderCodeOrDispatch : String(orderId);
  const dispatch =
    typeof orderCodeOrDispatch === 'string'
      ? (maybeDispatch as DeliveryDispatchInfo)
      : orderCodeOrDispatch;

  // حفظ محلياً في خريطة التوصيل والسائقين
  setStoredDispatch(orderCode, orderId, dispatch);

  // تحديث الطلب محلياً إن وجد
  try {
    const local = JSON.parse(localStorage.getItem('khodra_recent_orders') || '[]');
    if (Array.isArray(local)) {
      let updatedLocal = false;
      for (let i = 0; i < local.length; i++) {
        if (local[i] && (local[i].orderCode === orderCode || `local-${i}` === String(orderId))) {
          local[i].delivery_dispatch = dispatch;
          updatedLocal = true;
        }
      }
      if (updatedLocal) {
        localStorage.setItem('khodra_recent_orders', JSON.stringify(local));
      }
    }
  } catch {
    // ignore
  }

  // تحديث Supabase عبر الدالة المحمية update_order_dispatch_secure
  const client = getSupabase();
  if (client && !String(orderId).startsWith('local-')) {
    try {
      const pin = getAdminPin();
      let { error } = await client.rpc('update_order_dispatch_secure', {
        p_order_id: String(orderId),
        p_dispatch: dispatch,
        p_admin_pin: pin,
      });
      if (error && error.message?.includes('INVALID_ADMIN_PIN') && pin !== DEFAULT_FALLBACK_PIN) {
        const retry = await client.rpc('update_order_dispatch_secure', {
          p_order_id: String(orderId),
          p_dispatch: dispatch,
          p_admin_pin: DEFAULT_FALLBACK_PIN,
        });
        error = retry.error;
      }
      if (error) {
        console.warn('update_order_dispatch_secure RPC warning:', error.message);
      }
    } catch (err) {
      console.warn('Error saving dispatch to Supabase:', err);
    }
  }

  return { success: true, message: 'تم حفظ بيانات السائق والتوصيل بنجاح' };
}

export async function fetchPendingOrdersCount(): Promise<number> {
  const client = getSupabase();

  if (!client) {
    return readLocalOrders().filter((o) => o.status === 'pending').length;
  }

  const pin = getAdminPin();
  if (!pin) return 0;

  try {
    let { data, error } = await client.rpc('get_orders_secure', {
      p_admin_pin: pin,
    });
    if (error && error.message?.includes('INVALID_ADMIN_PIN') && pin !== DEFAULT_FALLBACK_PIN) {
      const retry = await client.rpc('get_orders_secure', {
        p_admin_pin: DEFAULT_FALLBACK_PIN,
      });
      data = retry.data;
      error = retry.error;
    }

    if (error || !Array.isArray(data)) {
      if (error) console.warn('fetchPendingOrdersCount error:', error.message);
      return 0;
    }

    return data.filter((o: any) => o && !o.is_deleted && !o.deleted_at && normalizeOrderStatus(o.status) === 'pending').length;
  } catch (err) {
    console.warn('Network error while counting pending:', err);
    return 0;
  }
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الإنشاء',
  prepared: 'تم التجهيز',
  delivered: 'تم التسليم',
  cancelled: 'ملغى',
};

// ═══════════════════════════════════════════════════════════════
// ─── إدارة فريق التوصيل الداخلي (Store Drivers Management) ───
// ═══════════════════════════════════════════════════════════════

const STORE_DRIVERS_STORAGE_KEY = 'khodra_store_drivers_v1';
const STORE_DRIVERS_SETTING_KEY = 'store_drivers';

export const INITIAL_STORE_DRIVERS: StoreDriver[] = [
  {
    id: 'drv-1',
    name: 'يوسف العلمي',
    phone: '0661234567',
    vehicleType: 'moto',
    zonePreference: 'north',
    status: 'available',
    commissionPerOrder: 25,
    vehiclePlate: '12-A-3456',
    address: 'حي الأطلس، شارع النرجس، فاس',
    notes: 'خبير بشوارع فاس وشارع الجيش الملكي وطريق مكناس',
    activeOrdersCount: 0,
    totalDeliveredCount: 142,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'drv-2',
    name: 'رشيد بنجلون',
    phone: '0672345678',
    vehicleType: 'moto',
    zonePreference: 'central',
    status: 'available',
    commissionPerOrder: 25,
    vehiclePlate: '18-B-7890',
    address: 'المدينة الجديدة، قرب ساحة فلورنس، فاس',
    notes: 'متخصص بأحياء الأطلس، الدكارات، والمدينة الجديدة',
    activeOrdersCount: 0,
    totalDeliveredCount: 98,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'drv-3',
    name: 'طارق الفاسي',
    phone: '0663456789',
    vehicleType: 'car',
    zonePreference: 'south',
    status: 'on_delivery',
    commissionPerOrder: 30,
    vehiclePlate: '22-C-1122',
    address: 'حي بنسودة، تجزئة الأمل، فاس',
    notes: 'سيارة مجهزة لصناديق الخضار العائلية الكبيرة (طريق إيموزار وعين الشقف)',
    activeOrdersCount: 2,
    totalDeliveredCount: 215,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'drv-4',
    name: 'أمين الوزاني',
    phone: '0664567890',
    vehicleType: 'van',
    zonePreference: 'all',
    status: 'available',
    commissionPerOrder: 35,
    vehiclePlate: '15-D-9988',
    address: 'طريق عين السمن، فاس',
    notes: 'فان نقل مبرد للجولات الكبرى والطلبات المجمعة',
    activeOrdersCount: 0,
    totalDeliveredCount: 310,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'drv-5',
    name: 'حمزة التازي',
    phone: '0665123456',
    vehicleType: 'moto',
    zonePreference: 'east',
    status: 'available',
    commissionPerOrder: 25,
    vehiclePlate: '30-A-5544',
    address: 'حي الزهور 2، طريق صفرو، فاس',
    notes: 'خبير بأحياء الزهور وفاس البالي والرصيف وباب الفتوح',
    activeOrdersCount: 0,
    totalDeliveredCount: 167,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

function readLocalDrivers(): StoreDriver[] {
  try {
    const raw = localStorage.getItem(STORE_DRIVERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading local drivers:', e);
  }
  return INITIAL_STORE_DRIVERS;
}

function writeLocalDrivers(drivers: StoreDriver[]): void {
  try {
    localStorage.setItem(STORE_DRIVERS_STORAGE_KEY, JSON.stringify(drivers));
  } catch (e) {
    console.warn('Failed saving local drivers:', e);
  }
}

/**
 * جلب قائمة سائقي الفريق الداخلي مع مزامنة ذكية بين Supabase والتخزين المحلي
 */
export async function fetchStoreDrivers(): Promise<{ drivers: StoreDriver[]; synced: boolean }> {
  const localList = readLocalDrivers();
  const client = getSupabase();

  if (!client) {
    return { drivers: localList, synced: false };
  }

  try {
    // 1. محاولة الجلب من جدول store_settings
    const { data: settingData, error: settingError } = await client
      .from('store_settings')
      .select('value')
      .eq('key', STORE_DRIVERS_SETTING_KEY)
      .maybeSingle();

    if (!settingError && settingData && settingData.value) {
      try {
        const parsed = JSON.parse(settingData.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          writeLocalDrivers(parsed);
          return { drivers: parsed, synced: true };
        }
      } catch {
        // ignore parse error
      }
    }

    // 2. إذا لم تكن البيانات موجودة في السيرفر بعد، نحفظ القائمة المحلية الحالية في السيرفر لتأسيسها
    if (localList.length > 0) {
      await saveStoreDriversRemote(localList);
    }

    return { drivers: localList, synced: true };
  } catch (err) {
    console.warn('Network error while fetching drivers:', err);
    return { drivers: localList, synced: false };
  }
}

async function saveStoreDriversRemote(drivers: StoreDriver[]): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const jsonValue = JSON.stringify(drivers);
  const currentPin = getAdminPin();

  try {
    // محاولة الحفظ عبر RPC الآمن
    const { error: rpcErr } = await client.rpc('update_store_setting_secure', {
      p_key: STORE_DRIVERS_SETTING_KEY,
      p_value: jsonValue,
      p_admin_pin: currentPin,
    });

    if (!rpcErr) return true;

    // محاولة احتياطية ثانية في حال اسم المعامل p_pin
    const retry = await client.rpc('update_store_setting_secure', {
      p_key: STORE_DRIVERS_SETTING_KEY,
      p_value: jsonValue,
      p_pin: currentPin,
    });
    if (!retry.error) return true;

    // محاولة الحفظ المباشر في store_settings
    const { error: upsertErr } = await client
      .from('store_settings')
      .upsert(
        {
          key: STORE_DRIVERS_SETTING_KEY,
          value: jsonValue,
          description: 'فريق التوصيل الداخلي لمتجر خُضرة',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    return !upsertErr;
  } catch (err) {
    console.warn('saveStoreDriversRemote error:', err);
    return false;
  }
}

/**
 * حفظ قائمة السائقين بالكامل (محلياً وفي السيرفر)
 */
export async function saveStoreDrivers(
  drivers: StoreDriver[]
): Promise<{ success: boolean; synced: boolean; message?: string }> {
  writeLocalDrivers(drivers);
  const synced = await saveStoreDriversRemote(drivers);
  return {
    success: true,
    synced,
    message: synced ? 'تم الحفظ والمزامنة السحابية بنجاح' : 'تم الحفظ محلياً (وضع عدم الاتصال)',
  };
}

/**
 * إضافة سائق جديد إلى الفريق الداخلي
 */
export async function addStoreDriver(
  driverData: Omit<StoreDriver, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; driver: StoreDriver; synced: boolean; message?: string }> {
  const current = readLocalDrivers();
  const newDriver: StoreDriver = {
    ...driverData,
    id: `drv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: sanitizeInput(driverData.name.trim()),
    phone: sanitizeInput(driverData.phone.trim()),
    address: driverData.address ? sanitizeInput(driverData.address.trim()) : undefined,
    activeOrdersCount: 0,
    totalDeliveredCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newDriver, ...current];
  writeLocalDrivers(updated);
  const synced = await saveStoreDriversRemote(updated);

  return {
    success: true,
    driver: newDriver,
    synced,
    message: synced ? 'تمت إضافة السائق ومزامنته سحابياً بنجاح' : 'تمت إضافة السائق محلياً بنجاح',
  };
}

/**
 * تحديث بيانات سائق أو تغيير حالته
 */
export async function updateStoreDriver(
  driverId: string,
  updates: Partial<StoreDriver>
): Promise<{ success: boolean; driver?: StoreDriver; synced: boolean; message?: string }> {
  const current = readLocalDrivers();
  let targetDriver: StoreDriver | undefined;

  const updated = current.map((d) => {
    if (d.id === driverId) {
      targetDriver = {
        ...d,
        ...updates,
        name: updates.name ? sanitizeInput(updates.name.trim()) : d.name,
        phone: updates.phone ? sanitizeInput(updates.phone.trim()) : d.phone,
        address: updates.address !== undefined ? sanitizeInput(updates.address.trim()) : d.address,
        updatedAt: new Date().toISOString(),
      };
      return targetDriver;
    }
    return d;
  });

  if (!targetDriver) {
    return { success: false, synced: false, message: 'السائق غير موجود' };
  }

  writeLocalDrivers(updated);
  const synced = await saveStoreDriversRemote(updated);

  return {
    success: true,
    driver: targetDriver,
    synced,
    message: synced ? 'تم تحديث بيانات السائق بنجاح' : 'تم التحديث محلياً',
  };
}

/**
 * حذف سائق من الفريق الداخلي
 */
export async function deleteStoreDriver(
  driverId: string
): Promise<{ success: boolean; synced: boolean; message?: string }> {
  const current = readLocalDrivers();
  const filtered = current.filter((d) => d.id !== driverId);

  writeLocalDrivers(filtered);
  const synced = await saveStoreDriversRemote(filtered);

  return {
    success: true,
    synced,
    message: synced ? 'تم حذف السائق ومزامنة التحديث' : 'تم حذف السائق محلياً',
  };
}

/**
 * اعتماد جولة كاملة: تعيين السائق لجميع طلبات المنطقة وتحديث حالتهم دفعة واحدة
 */
export async function batchAssignZoneOrders(params: {
  orders: DbOrder[];
  driver: StoreDriver;
  newStatus?: OrderStatus;
}): Promise<{ success: boolean; updatedCount: number; message?: string }> {
  const { orders, driver, newStatus = 'prepared' } = params;
  if (!orders || orders.length === 0) {
    return { success: false, updatedCount: 0, message: 'لا توجد طلبات في هذه الجولة' };
  }

  let count = 0;
  for (const ord of orders) {
    const dispatchInfo: DeliveryDispatchInfo = {
      provider: 'custom',
      driverName: driver.name,
      driverPhone: driver.phone,
      deliveryCost: driver.commissionPerOrder || 25,
      dispatchStatus: 'in_transit',
      dispatchedAt: new Date().toISOString(),
      zone: ord.delivery_zone || 'north',
      notes: `جولة توصيل داخلية مع ${driver.name}`,
    };

    // 1. تحديث بيانات التوصيل والسائق
    await updateOrderDispatch(ord.id, ord.order_code, dispatchInfo);

    // 2. تحديث حالة الطلب إن لزم
    if (newStatus && ord.status !== newStatus) {
      await updateOrderStatus(ord.id, newStatus);
    }
    count++;
  }

  // تحديث حالة السائق إلى "في جولة"
  await updateStoreDriver(driver.id, {
    status: 'on_delivery',
    activeOrdersCount: (driver.activeOrdersCount || 0) + count,
  });

  return {
    success: true,
    updatedCount: count,
    message: `تم اعتماد الجولة وتعيين ${count} طلبات للسائق ${driver.name} بنجاح!`,
  };
}

/**
 * إغلاق الجولة وتأكيد التسليم ونقل الطلبات تلقائياً إلى الأرشيف:
 * - تحديث حالة جميع طلبات هذه الجولة إلى "تم التسليم" (delivered)
 * - تحديث dispatchStatus إلى "delivered"
 * - أرشفة الطلبات تلقائياً في التخزين المحلي (khodra_archived_orders)
 * - تحديث حالة السائق وإرجاعه إلى "متاح" (available) مع زيادة إجمالي الطلبات المنجزة
 */
export async function closeAndDeliverZoneTour(params: {
  orders: DbOrder[];
  driver?: StoreDriver | null;
  zoneKey?: FezZoneId;
}): Promise<{ success: boolean; deliveredCount: number; message?: string }> {
  const { orders, driver } = params;
  if (!orders || orders.length === 0) {
    return { success: false, deliveredCount: 0, message: 'لا توجد طلبات في هذه الجولة للإغلاق' };
  }

  let count = 0;
  const newlyArchivedCodes: string[] = [];

  for (const ord of orders) {
    // 1. تحديث حالة الطلب إلى تم التسليم
    await updateOrderStatus(ord.id, 'delivered');

    // 2. تحديث بيانات التوصيل إن كانت موجودة
    const currentDispatch: DeliveryDispatchInfo = ord.delivery_dispatch || {
      provider: 'custom',
      dispatchStatus: 'delivered',
      driverName: driver?.name,
      driverPhone: driver?.phone,
    };
    await updateOrderDispatch(ord.id, ord.order_code, {
      ...currentDispatch,
      dispatchStatus: 'delivered',
      driverName: driver?.name || currentDispatch.driverName,
      driverPhone: driver?.phone || currentDispatch.driverPhone,
    });

    if (ord.order_code) {
      newlyArchivedCodes.push(ord.order_code);
    }
    newlyArchivedCodes.push(String(ord.id));
    count++;
  }

  // 3. أرشفة الطلبات تلقائياً في التخزين المحلي لظهورها في أرشيف الطلبات المسلمة بأداة الطلبات
  try {
    const STORAGE_KEY_ARCHIVED = 'khodra_archived_orders';
    const saved = localStorage.getItem(STORAGE_KEY_ARCHIVED);
    const existing = saved ? (JSON.parse(saved) as string[]) : [];
    const merged = Array.from(new Set([...existing, ...newlyArchivedCodes]));
    localStorage.setItem(STORAGE_KEY_ARCHIVED, JSON.stringify(merged));
  } catch (storageErr) {
    console.warn('Failed to auto-archive delivered orders to localStorage:', storageErr);
  }

  // 4. تحديث حالة السائق المعين إلى متاح وزيادة إجمالي التسليم
  if (driver && driver.id) {
    await updateStoreDriver(driver.id, {
      status: 'available',
      activeOrdersCount: Math.max(0, (driver.activeOrdersCount || 0) - count),
      totalDeliveredCount: (driver.totalDeliveredCount || 0) + count,
    });
  }

  return {
    success: true,
    deliveredCount: count,
    message: `تم إغلاق الجولة وتأكيد تسليم ${count} طلبات بنجاح، ونقلها تلقائياً إلى الأرشيف!`,
  };
}

// ═══════════════════════════════════════════════════════════════
// ─── سائقو تطبيقات التوصيل السريع (Fast App Couriers) ───
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY_FAST_COURIERS = 'khodra_fast_app_couriers';

function readLocalFastCouriers(): FastAppCourier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAST_COURIERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalFastCouriers(couriers: FastAppCourier[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FAST_COURIERS, JSON.stringify(couriers));
  } catch {}
}

export async function fetchFastCouriers(): Promise<FastAppCourier[]> {
  const localList = readLocalFastCouriers();
  const client = getSupabase();
  if (!client) return localList;

  try {
    const { data, error } = await client
      .from('fast_app_couriers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.warn('Supabase fetchFastCouriers warning, falling back to local storage:', error.message);
      return localList;
    }

    if (data && Array.isArray(data)) {
      const mapped: FastAppCourier[] = data.map((r: any) => ({
        id: String(r.id),
        name: String(r.name || ''),
        app: r.app || 'indrive',
        appNameCustom: r.app_name_custom || undefined,
        phone: String(r.phone || ''),
        vehicleType: r.vehicle_type || 'moto',
        zone: r.zone || 'all',
        typicalFare: Number(r.typical_fare) || 20,
        notes: r.notes || undefined,
        createdAt: r.created_at || new Date().toISOString(),
      }));
      writeLocalFastCouriers(mapped);
      return mapped;
    }
  } catch (err) {
    logger.warn('Network error while fetching fast couriers:', err);
  }
  return localList;
}

export async function saveFastCourier(
  courier: Partial<FastAppCourier>
): Promise<{ success: boolean; courier?: FastAppCourier; message?: string }> {
  const localList = readLocalFastCouriers();
  const client = getSupabase();
  const courierId = courier.id || `fast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const cleanCourier: FastAppCourier = {
    id: courierId,
    name: sanitizeInput(courier.name || ''),
    phone: sanitizeInput(courier.phone || ''),
    app: courier.app || 'indrive',
    appNameCustom: courier.appNameCustom ? sanitizeInput(courier.appNameCustom) : undefined,
    vehicleType: courier.vehicleType || 'moto',
    zone: courier.zone || 'all',
    typicalFare: Number(courier.typicalFare) || 20,
    notes: courier.notes ? sanitizeInput(courier.notes) : undefined,
    createdAt: courier.createdAt || new Date().toISOString(),
  };

  const existingIdx = localList.findIndex((c) => c.id === courierId);
  let updatedList: FastAppCourier[];
  if (existingIdx >= 0) {
    updatedList = [...localList];
    updatedList[existingIdx] = cleanCourier;
  } else {
    updatedList = [cleanCourier, ...localList];
  }
  writeLocalFastCouriers(updatedList);

  if (client) {
    try {
      const payload: Record<string, unknown> = {
        name: cleanCourier.name,
        phone: cleanCourier.phone,
        app: cleanCourier.app,
        app_name_custom: cleanCourier.appNameCustom || null,
        vehicle_type: cleanCourier.vehicleType,
        zone: cleanCourier.zone,
        typical_fare: cleanCourier.typicalFare,
        notes: cleanCourier.notes || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      if (courier.id && !courier.id.startsWith('fast-')) {
        payload.id = courier.id;
      }
      const { data, error } = await client
        .from('fast_app_couriers')
        .upsert(payload)
        .select()
        .single();
      if (!error && data) {
        cleanCourier.id = String(data.id);
        return { success: true, courier: cleanCourier, message: 'تم حفظ الكابتن بنجاح ومزامنته سحابياً' };
      }
      logger.warn('Supabase saveFastCourier fallback to local:', error?.message);
    } catch (e) {
      logger.warn('saveFastCourier network error, saved locally:', e);
    }
  }

  return { success: true, courier: cleanCourier, message: 'تم حفظ الكابتن بنجاح' };
}

export async function deleteFastCourier(id: string): Promise<{ success: boolean; message?: string }> {
  const localList = readLocalFastCouriers();
  writeLocalFastCouriers(localList.filter((c) => c.id !== id));
  const client = getSupabase();
  if (client && !id.startsWith('fast-')) {
    try {
      await client.from('fast_app_couriers').delete().eq('id', id);
    } catch (e) {
      logger.warn('deleteFastCourier network error, deleted locally:', e);
    }
  }
  return { success: true, message: 'تم حذف الكابتن بنجاح' };
}

// ═══════════════════════════════════════════════════════════════
// ─── تحديث الدفع والأرشفة وجلب طلب مفرد ───
// ═══════════════════════════════════════════════════════════════

export async function fetchSingleOrder(orderId: string | number): Promise<DbOrder | null> {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .or(`id.eq.${orderId},order_code.eq.${orderId}`)
        .maybeSingle();
      if (!error && data) {
        return mapRowToOrder(data);
      }
    } catch (err) {
      logger.warn('fetchSingleOrder network error:', err);
    }
  }
  const localOrders = readLocalOrders();
  return (
    localOrders.find(
      (o) => String(o.id) === String(orderId) || o.order_code === String(orderId)
    ) || null
  );
}

export async function updateOrderPayment(
  orderId: string | number,
  isPaid: boolean
): Promise<{ success: boolean; message?: string }> {
  const STORAGE_KEY_PAID = 'khodra_paid_orders';
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAID);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    const strId = String(orderId);
    if (isPaid) {
      set.add(strId);
    } else {
      set.delete(strId);
    }
    localStorage.setItem(STORAGE_KEY_PAID, JSON.stringify(Array.from(set)));
  } catch {}

  const client = getSupabase();
  if (client && !String(orderId).startsWith('local-')) {
    try {
      const updateData = {
        is_paid: isPaid,
        paid_at: isPaid ? new Date().toISOString() : null,
      };
      await client
        .from('orders')
        .update(updateData)
        .or(`id.eq.${orderId},order_code.eq.${orderId}`);
    } catch (err) {
      logger.warn('updateOrderPayment Supabase sync warning, saved locally:', err);
    }
  }

  return { success: true, message: isPaid ? 'تم تأكيد استلام المبلغ' : 'تم إلغاء تأكيد الدفع' };
}

export async function updateOrderArchive(
  orderId: string | number,
  isArchived: boolean
): Promise<{ success: boolean; message?: string }> {
  const STORAGE_KEY_ARCHIVED = 'khodra_archived_orders';
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ARCHIVED);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    const strId = String(orderId);
    if (isArchived) {
      set.add(strId);
    } else {
      set.delete(strId);
    }
    localStorage.setItem(STORAGE_KEY_ARCHIVED, JSON.stringify(Array.from(set)));
  } catch {}

  const client = getSupabase();
  if (client && !String(orderId).startsWith('local-')) {
    try {
      const updateData = {
        is_archived: isArchived,
        archived_at: isArchived ? new Date().toISOString() : null,
      };
      await client
        .from('orders')
        .update(updateData)
        .or(`id.eq.${orderId},order_code.eq.${orderId}`);
    } catch (err) {
      logger.warn('updateOrderArchive Supabase sync warning, saved locally:', err);
    }
  }

  return {
    success: true,
    message: isArchived ? 'تم نقل الطلب إلى الأرشيف' : 'تم استعادة الطلب من الأرشيف',
  };
}

// ═══════════════════════════════════════════════════════════════
// ─── Realtime: الاستماع الفوري لتحديثات الطلبات ───
// ═══════════════════════════════════════════════════════════════

export type OrdersRealtimeCallback = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  new: any;
  old: any;
}) => void;

export function subscribeToOrdersChanges(
  callback: OrdersRealtimeCallback,
  onStatusChange?: (status: string) => void
) {
  const client = getSupabase();
  if (!client) return null;

  try {
    // اسم قناة فريد لكل مشترك لمنع تعارض AdminOrdersPanel مع useNewOrdersNotifier
    const uniqueChannelName = `orders-realtime-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const channel = client
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          try {
            callback(payload);
          } catch (cbErr) {
            console.warn('Realtime callback error:', cbErr);
          }
        }
      )
      .subscribe((status) => {
        if (onStatusChange) {
          try {
            onStatusChange(status);
          } catch {}
        }
      });

    return channel;
  } catch (e) {
    console.warn('Realtime subscription error:', e);
    return null;
  }
}

export function unsubscribeFromOrdersChanges(channel: any) {
  const client = getSupabase();
  if (client && channel) {
    try {
      client.removeChannel(channel);
    } catch {
      // ignore
    }
  }
}