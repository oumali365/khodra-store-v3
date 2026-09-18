// ============================================================
// supabaseService.ts – الإصدار 3.0
// مُصحَّح: تنظيف items + RLS + RPC للطلبات
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, OrderSubmission } from '../types';
import { STORE_CONFIG } from '../data/config';
import { INITIAL_PRODUCTS } from '../data/mockProducts';

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
    image_url: row.image_url || undefined,
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
        name: String(item?.name || 'منتج'),
        variantLabel: String(item?.variantLabel || ''),
        qty: Number(item?.qty) || 1,
        lineTotal: Number(item?.lineTotal) || 0,
        icon: String(item?.icon || '🛒'),
      };
      if (item?.image_url && typeof item.image_url === 'string') {
        clean.image_url = item.image_url;
      }
      if (item?.bundleId && typeof item.bundleId === 'string') {
        clean.bundleId = item.bundleId;
      }
      return clean;
    });

    // ─── بيانات الطلب ───
    const orderData: Record<string, any> = {
      order_code: String(order.orderCode || `#${Date.now()}`),
      customer_name: String(order.customerName || 'عميل'),
      phone: String(order.phone || ''),
      address: String(order.address || ''),
      items: cleanItems,
      subtotal: Number(order.subtotal) || 0,
      delivery_fee: Number(order.deliveryFee) || 0,
      total: Number(order.total) || 0,
      status: 'pending',
      note: noteParts.join(' | ') || null,
      maps_link: order.mapsLink ? String(order.mapsLink) : null,
      created_at: new Date().toISOString(),
    };

    console.log('📤 إرسال الطلب:', JSON.stringify(orderData, null, 2));

    // ─── ✅ الإدراج بدون .select() ───
    const { error } = await client
      .from('orders')
      .insert([orderData]);

    if (error) {
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

    console.log('✅ تم حفظ الطلب بنجاح');
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

  if (!client) {
    return { success: false, message: 'لا يوجد اتصال بقاعدة البيانات' };
  }

  try {
    const newRecord = {
      author: String(review.author || 'زبون'),
      neighborhood: String(review.neighborhood || 'فاس'),
      rating: Number(review.rating) || 5,
      comment: String(review.comment || ''),
      category: String(review.category || 'quality'),
      verified: review.verified !== undefined ? Boolean(review.verified) : true,
      created_at: new Date().toISOString(),
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
      author: data?.author || review.author,
      neighborhood: data?.neighborhood || review.neighborhood,
      rating: data?.rating || review.rating,
      date: 'الآن',
      comment: data?.comment || review.comment,
      verified: data?.verified !== undefined ? Boolean(data?.verified) : true,
      category: data?.category || (review.category as any),
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
    return { success: false, message: 'لا يوجد اتصال بقاعدة البيانات' };
  }

  const pin = getAdminPin();

  try {
    const { error } = await client.rpc('delete_review_secure', {
      p_review_id: reviewId,
      p_admin_pin: pin,
    });

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
}

function normalizeOrderStatus(raw: string | null | undefined): OrderStatus {
  const s = (raw || '').trim().toLowerCase();
  if (!s) return 'pending';
  if (s === 'prepared' || s.includes('تجهيز') || s.includes('جاهز')) return 'prepared';
  if (s === 'delivered' || s.includes('تسليم') || s.includes('توصيل') || s.includes('موصل')) return 'delivered';
  if (s === 'cancelled' || s.includes('لغا') || s.includes('لغي')) return 'cancelled';
  return 'pending';
}

function getAdminPin(): string {
  try {
    return localStorage.getItem('khodra_admin_pin') || '1234';
  } catch {
    return '1234';
  }
}

function mapRowToOrder(row: any): DbOrder {
  return {
    id: row.id,
    order_code: row.order_code || row.orderCode || `#${row.id}`,
    customer_name: row.customer_name || row.customerName || '-',
    phone: String(row.phone || '-'),
    address: row.address || '-',
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
  };
}

function readLocalOrders(): DbOrder[] {
  try {
    const local = JSON.parse(localStorage.getItem('khodra_recent_orders') || '[]');
    return local.map((o: any, idx: number): DbOrder => ({
      id: `local-${idx}`,
      order_code: o.orderCode || `#${idx}`,
      customer_name: o.customerName || '-',
      phone: o.phone || '-',
      address: o.address || '-',
      items: o.items || [],
      subtotal: Number(o.subtotal) || 0,
      delivery_fee: Number(o.deliveryFee) || 0,
      total: Number(o.total) || 0,
      status: 'pending',
      note: o.deliverySlot || '',
      maps_link: o.mapsLink || '',
      created_at: o.created_at || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function fetchOrders(): Promise<DbOrder[]> {
  const client = getSupabase();
  if (!client) return readLocalOrders();

  try {
    const { data, error } = await client.rpc('get_orders_secure', {
      p_admin_pin: getAdminPin(),
    });

    if (error) {
      console.error('❌ fetchOrders RPC error:', error.message);
      return readLocalOrders();
    }

    return (data || []).map(mapRowToOrder);
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

  try {
    const { error } = await client.rpc('update_order_status_secure', {
      p_order_id: orderId,
      p_new_status: status,
      p_admin_pin: getAdminPin(),
    });

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
  if (String(orderId).startsWith('local-')) {
    try {
      const local = JSON.parse(localStorage.getItem('khodra_recent_orders') || '[]');
      const idx = Number(String(orderId).replace('local-', ''));
      if (!isNaN(idx)) {
        local.splice(idx, 1);
        localStorage.setItem('khodra_recent_orders', JSON.stringify(local));
      }
    } catch { /* ignore */ }
    return { success: true, message: 'تم حذف الطلب المحلي' };
  }

  const client = getSupabase();
  if (!client) return { success: false, message: 'لا يوجد اتصال' };

  try {
    const { error } = await client.rpc('delete_order_secure', {
      p_order_id: orderId,
      p_admin_pin: getAdminPin(),
    });

    if (error) {
      console.warn('deleteOrder RPC error:', error.message);
      return { success: false, message: error.message };
    }
    return { success: true, message: 'تم حذف الطلب نهائياً' };
  } catch (err) {
    console.warn('Network error while deleting order:', err);
    return { success: false, message: 'تعذّر الاتصال' };
  }
}

export async function fetchPendingOrdersCount(): Promise<number> {
  const client = getSupabase();

  if (!client) {
    return readLocalOrders().filter((o) => o.status === 'pending').length;
  }

  try {
    const { data, error } = await client.rpc('get_orders_secure', {
      p_admin_pin: getAdminPin(),
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