// ============================================================
// supabaseService.ts – الإصدار 3.0
// مُصحَّح: تنظيف items + RLS + RPC للطلبات
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, OrderSubmission, DeliveryDispatchInfo, FezZoneId } from '../types';
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
  if (!client) return INITIAL_PRODUCTS;

  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('active', true)
      .order('id');

    if (error) {
      console.warn('Supabase products fetch failed:', error.message);
      return INITIAL_PRODUCTS;
    }

    if (data && data.length > 0) {
      return data.map(normalizeProduct);
    }
  } catch (err) {
    console.warn('Network error while connecting to Supabase:', err);
  }

  return INITIAL_PRODUCTS;
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
    });
    if (error && error.message?.includes('schema cache')) {
      const retry = await client.rpc('delete_review_secure', {
        p_review_id: reviewId,
        p_pin: pin,
      });
      error = retry.error;
    }

    if (error) {
      console.error('❌ فشل حذف التعليق:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'تم حذف التعليق ' };
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
}

// ─── كشف مسار فاس تلقائياً من العنوان للتجميع الذكي (4 مسارات ذكية) ───
export function detectFezZone(address: string = ''): FezZoneId {
  const result = detectAddressZone(address);
  if (result.zoneId) {
    return result.zoneId;
  }
  return 'north';
}

function getStoredDispatch(orderCode: string, id?: string | number): DeliveryDispatchInfo | undefined {
  try {
    const raw = localStorage.getItem('khodra_order_dispatches');
    if (!raw) return undefined;
    const map = JSON.parse(raw);
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
  const s = (raw || '').trim().toLowerCase();
  if (!s) return 'pending';
  if (s === 'prepared' || s.includes('تجهيز') || s.includes('جاهز')) return 'prepared';
  if (s === 'delivered' || s.includes('تسليم') || s.includes('توصيل') || s.includes('موصل')) return 'delivered';
  if (s === 'cancelled' || s.includes('لغا') || s.includes('لغي')) return 'cancelled';
  return 'pending';
}

let cachedAdminPin: string | null = null;
const ADMIN_PIN_SESSION_KEY = 'khodra_admin_pin_session';

export function getAdminPin(): string {
  if (cachedAdminPin) return cachedAdminPin;
  try {
    const val = sessionStorage.getItem(ADMIN_PIN_SESSION_KEY);
    if (val && val.trim()) {
      cachedAdminPin = val.trim();
      return cachedAdminPin;
    }
  } catch {
    // ignore
  }
  return STORE_CONFIG.adminPin || '';
}

export function setCachedAdminPin(newPin: string): void {
  cachedAdminPin = newPin.trim();
  try {
    sessionStorage.setItem(ADMIN_PIN_SESSION_KEY, cachedAdminPin);
    localStorage.removeItem('khodra_admin_pin'); // تنظيف أي أثر قديم في localStorage الدائم
  } catch {
    // ignore
  }
}

export function clearCachedAdminPin(): void {
  cachedAdminPin = null;
  try {
    sessionStorage.removeItem(ADMIN_PIN_SESSION_KEY);
    localStorage.removeItem('khodra_admin_pin');
  } catch {
    // ignore
  }
}

/**
 * التحقق الآمن من رمز المدير (PIN) على الخادم عبر RPC محمي ضد التخمين (Brute-Force)
 */
export async function verifyAdminPinRemote(
  pinInput: string
): Promise<{ valid: boolean; message?: string }> {
  const trimmed = (pinInput || '').trim();
  if (!trimmed || trimmed.length < 4) {
    return { valid: false, message: 'يرجى إدخال رمز سري مكون من 4 أرقام على الأقل' };
  }

  const client = getSupabase();
  if (!client) {
    const fallbackPin = getAdminPin() || '090909';
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
      console.warn('verify_admin_pin RPC error:', error.message);
      return { valid: false, message: 'فشل التحقق من الرمز السري' };
    }

    if (data === true) {
      setCachedAdminPin(trimmed);
      return { valid: true };
    }

    return { valid: false, message: 'الرمز السري غير صحيح' };
  } catch (err) {
    console.warn('Network error during verifyAdminPinRemote:', err);
    return { valid: false, message: 'تعذّر الاتصال بالخادم للتحقق من الرمز' };
  }
}

/**
 * تحديث الرمز السري (PIN) في Supabase عبر الدالة المحمية update_store_setting_secure
 */
export async function updateAdminPinRemote(
  newPin: string
): Promise<{ success: boolean; message?: string }> {
  const trimmed = newPin.trim();
  if (!trimmed || trimmed.length < 4) {
    return { success: false, message: 'الرمز السري يجب ألا يقل عن 4 أرقام' };
  }

  const client = getSupabase();
  const currentPin = getAdminPin();

  if (!client) {
    setCachedAdminPin(trimmed);
    return { success: true, message: 'تم حفظ الرمز السري محلياً (لا يوجد اتصال)' };
  }

  try {
    let rpcRes = await client.rpc('update_store_setting_secure', {
      p_key: 'admin_pin',
      p_value: trimmed,
      p_admin_pin: currentPin,
    });
    if (rpcRes.error && rpcRes.error.message?.includes('schema cache')) {
      rpcRes = await client.rpc('update_store_setting_secure', {
        p_key: 'admin_pin',
        p_value: trimmed,
        p_pin: currentPin,
      });
    }

    if (!rpcRes.error) {
      setCachedAdminPin(trimmed);
      return { success: true, message: 'تم تحديث الرمز السري ومزامنته مع السيرفر بنجاح' };
    }

    return {
      success: false,
      message: 'تعذر تحديث الرمز السري في الخادم: ' + (rpcRes.error.message || 'غير مصرح'),
    };
  } catch (err: any) {
    console.warn('updateAdminPinRemote network error:', err);
    return { success: false, message: 'تعذّر الاتصال بالخادم لتحديث الرمز السري' };
  }
}

function mapRowToOrder(row: any): DbOrder {
  const orderCode = row.order_code || row.orderCode || `#${row.id}`;
  const address = row.address || '-';
  const autoZone = detectFezZone(address);
  const rowZone = row.delivery_zone || (row.security_flags?.delivery_zone);
  const validZones: FezZoneId[] = ['north', 'central', 'south', 'east'];
  const finalZone: FezZoneId = (rowZone && validZones.includes(rowZone)) ? rowZone : autoZone;
  const storedDispatch = getStoredDispatch(orderCode, row.id);
  const rowDispatch = row.delivery_dispatch || (row.security_flags?.delivery_dispatch);

  const finalDispatch: DeliveryDispatchInfo = {
    provider: storedDispatch?.provider || rowDispatch?.provider || 'indrive',
    driverName: storedDispatch?.driverName || rowDispatch?.driverName || '',
    driverPhone: storedDispatch?.driverPhone || rowDispatch?.driverPhone || '',
    deliveryCost: storedDispatch?.deliveryCost ?? rowDispatch?.deliveryCost ?? 25,
    trackingCode: storedDispatch?.trackingCode || rowDispatch?.trackingCode || '',
    dispatchStatus: storedDispatch?.dispatchStatus || rowDispatch?.dispatchStatus || 'waiting_driver',
    dispatchedAt: storedDispatch?.dispatchedAt || rowDispatch?.dispatchedAt || '',
    zone: storedDispatch?.zone || rowDispatch?.zone || finalZone,
    notes: storedDispatch?.notes || rowDispatch?.notes || '',
  };

  return {
    id: row.id,
    order_code: orderCode,
    customer_name: row.customer_name || row.customerName || '-',
    phone: String(row.phone || '-'),
    address: address,
    delivery_zone: finalZone,
    items: (() => {
      if (Array.isArray(row.items)) return row.items;
      if (typeof row.items === 'string') {
        try { return JSON.parse(row.items); } catch { return []; }
      }
      return [];
    })(),
    subtotal: Number(row.subtotal) || 0,
    delivery_fee: Number(row.delivery_fee ?? row.deliveryFee) || 0,
    total: Number(row.total) || 0,
    status: normalizeOrderStatus(row.status),
    note: row.note || '',
    maps_link: row.maps_link || '',
    created_at: row.created_at || new Date().toISOString(),
    idempotency_key: row.idempotency_key || undefined,
    client_id: row.client_id || undefined,
    device_fingerprint: row.device_fingerprint || undefined,
    ip_address: row.ip_address || undefined,
    security_flags: row.security_flags || undefined,
    delivery_dispatch: finalDispatch,
  };
}

function cleanupLocalOrder(orderId: string | number): void {
  try {
    const strId = String(orderId);
    const local = JSON.parse(localStorage.getItem('khodra_recent_orders') || '[]');
    const filtered = local.filter((o: any, idx: number) => {
      if (`local-${idx}` === strId) return false;
      if (o.id && String(o.id) === strId) return false;
      if (o.orderCode && (String(o.orderCode) === strId || String(o.orderCode) === `#${strId}`)) return false;
      if (o.order_code && (String(o.order_code) === strId || String(o.order_code) === `#${strId}`)) return false;
      return true;
    });
    localStorage.setItem('khodra_recent_orders', JSON.stringify(filtered));

    // تنظيف بيانات التوصيل المرتبطة
    const dispatches = JSON.parse(localStorage.getItem('khodra_order_dispatches') || '{}');
    delete dispatches[strId];
    localStorage.setItem('khodra_order_dispatches', JSON.stringify(dispatches));
  } catch {
    // ignore
  }
}

function readLocalOrders(): DbOrder[] {
  try {
    const local = JSON.parse(localStorage.getItem('khodra_recent_orders') || '[]');
    return local
      .filter((o: any) => !o.is_deleted && !o.deleted_at)
      .map((o: any, idx: number): DbOrder => {
      const orderCode = o.orderCode || `#${idx}`;
      const address = o.address || '-';
      const autoZone = detectFezZone(address);
      const validZones: FezZoneId[] = ['north', 'central', 'south', 'east'];
      const localZone: FezZoneId = (o.delivery_zone && validZones.includes(o.delivery_zone)) ? o.delivery_zone : autoZone;
      const storedDispatch = getStoredDispatch(orderCode, `local-${idx}`);
      const oDispatch = o.delivery_dispatch;

      const finalDispatch: DeliveryDispatchInfo = {
        provider: storedDispatch?.provider || oDispatch?.provider || 'indrive',
        driverName: storedDispatch?.driverName || oDispatch?.driverName || '',
        driverPhone: storedDispatch?.driverPhone || oDispatch?.driverPhone || '',
        deliveryCost: storedDispatch?.deliveryCost ?? oDispatch?.deliveryCost ?? 25,
        trackingCode: storedDispatch?.trackingCode || oDispatch?.trackingCode || '',
        dispatchStatus: storedDispatch?.dispatchStatus || oDispatch?.dispatchStatus || 'waiting_driver',
        dispatchedAt: storedDispatch?.dispatchedAt || oDispatch?.dispatchedAt || '',
        zone: storedDispatch?.zone || oDispatch?.zone || localZone,
        notes: storedDispatch?.notes || oDispatch?.notes || '',
      };

      return {
        id: `local-${idx}`,
        order_code: orderCode,
        customer_name: o.customerName || '-',
        phone: o.phone || '-',
        address: address,
        delivery_zone: localZone,
        items: o.items || [],
        subtotal: Number(o.subtotal) || 0,
        delivery_fee: Number(o.deliveryFee) || 0,
        total: Number(o.total) || 0,
        status: 'pending',
        note: o.deliverySlot || '',
        maps_link: o.mapsLink || '',
        created_at: o.created_at || new Date().toISOString(),
        delivery_dispatch: finalDispatch,
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

    if (error) {
      console.error('❌ fetchOrders RPC error:', error.message);
      return readLocalOrders();
    }

    // استبعاد تام للطلبات الموسومة كمحذوفة (Soft Delete)
    return (data || [])
      .filter((row: any) => !row.is_deleted && !row.deleted_at)
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
      if (!isNaN(idx) && local[idx]) {
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
    let { error } = await client.rpc('delete_order_secure', {
      p_order_id: String(orderId),
      p_admin_pin: pin,
    });
    if (error && error.message?.includes('schema cache')) {
      const retry = await client.rpc('delete_order_secure', {
        p_order_id: String(orderId),
        p_pin: pin,
      });
      error = retry.error;
    }

    if (error) {
      console.warn('deleteOrder RPC error:', error.message);
      return { success: false, message: error.message };
    }
    return { success: true, message: 'تم حذف الطلب بنجاح' };
  } catch (err) {
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
    let updatedLocal = false;
    for (let i = 0; i < local.length; i++) {
      if (local[i].orderCode === orderCode || `local-${i}` === String(orderId)) {
        local[i].delivery_dispatch = dispatch;
        updatedLocal = true;
      }
    }
    if (updatedLocal) {
      localStorage.setItem('khodra_recent_orders', JSON.stringify(local));
    }
  } catch {
    // ignore
  }

  // تحديث Supabase عبر الدالة المحمية update_order_dispatch_secure
  const client = getSupabase();
  if (client && !String(orderId).startsWith('local-')) {
    try {
      const pin = getAdminPin();
      const { error } = await client.rpc('update_order_dispatch_secure', {
        p_order_id: String(orderId),
        p_dispatch: dispatch,
        p_admin_pin: pin,
      });
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
    const { data, error } = await client.rpc('get_orders_secure', {
      p_admin_pin: pin,
    });

    if (error) {
      console.warn('fetchPendingOrdersCount error:', error.message);
      return 0;
    }

    return (data || []).filter((o: any) => normalizeOrderStatus(o.status) === 'pending').length;
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
    const channel = client
      .channel('orders-realtime-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          callback(payload);
        }
      )
      .subscribe((status) => {
        if (onStatusChange) onStatusChange(status);
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