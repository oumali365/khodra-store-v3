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

export async function fetchProducts(): Promise<Product[]> {
  const client = getSupabase();
  if (!client) {
    return INITIAL_PRODUCTS;
  }

  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('active', true)
      .order('id');

    if (error) {
      console.warn('Supabase products fetch failed, using built-in catalog:', error.message);
      return INITIAL_PRODUCTS;
    }

    if (data && data.length > 0) {
      return data as Product[];
    }
  } catch (err) {
    console.warn('Network error while connecting to Supabase:', err);
  }

  return INITIAL_PRODUCTS;
}

export async function submitOrder(order: OrderSubmission): Promise<{ success: boolean; message?: string }> {
  const client = getSupabase();

  // Save to localStorage as backup
  try {
    const existingOrders = JSON.parse(localStorage.getItem('khodra_recent_orders') || '[]');
    existingOrders.unshift(order);
    localStorage.setItem('khodra_recent_orders', JSON.stringify(existingOrders.slice(0, 20)));
  } catch {
    // ignore local storage errors
  }

  if (!client) {
    return { success: true, message: 'تم حفظ الطلب محلياً بنجاح' };
  }

  try {
    const orderData: Record<string, any> = {
      order_code: order.orderCode,
      customer_name: order.customerName,
      phone: order.phone,
      address: order.address,
      items: order.items,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      total: order.total,
      status: 'pending',
      note: `وقت التسليم: ${order.deliverySlot} | طريقة الدفع: ${order.paymentMethod === 'bank' ? 'تحويل بنكي' : 'الدفع عند الاستلام'}${order.bankId ? ` (${order.bankId})` : ''}${order.mapsLink ? ` | رابط خرائط Google: ${order.mapsLink}` : ''}${order.receiptFileName ? ` | الوصل: ${order.receiptFileName}` : ''}${order.notes ? ` | ملاحظات: ${order.notes}` : ''}`,
      created_at: new Date().toISOString()
    };

    if (order.mapsLink) {
      orderData.maps_link = order.mapsLink;
    }

    const { error } = await client
      .from('orders')
      .insert([orderData]);

    if (error) {
      console.warn('Supabase order insert warning:', error.message);
      return { success: true, message: 'تم استلام الطلب وتجهيز رسالة الواتساب' };
    }

    return { success: true };
  } catch (err) {
    console.warn('Error saving order to Supabase:', err);
    return { success: true, message: 'سيتم استكمال الطلب عبر واتساب' };
  }
}

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
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from('reviews')
      .select('*')
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
    console.warn('Network error while fetching reviews from Supabase:', err);
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

  // Save to local storage as fallback/cache
  try {
    const cached = JSON.parse(localStorage.getItem('khodra_customer_reviews') || '[]');
    const localReview = {
      id: `local-${Date.now()}`,
      ...review,
      date: 'الآن',
      created_at: new Date().toISOString(),
      verified: true,
    };
    localStorage.setItem('khodra_customer_reviews', JSON.stringify([localReview, ...cached].slice(0, 30)));
  } catch {
    // Ignore local storage quota errors
  }

  if (!client) {
    return { success: true, message: 'تم حفظ الرأي محلياً' };
  }

  try {
    const newRecord = {
      author: review.author,
      neighborhood: review.neighborhood || 'فاس',
      rating: review.rating,
      comment: review.comment,
      category: review.category,
      verified: review.verified !== undefined ? review.verified : true,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('reviews')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      console.warn('Supabase review insert warning:', error.message);
      return { success: true, message: 'تم استلام التقييم بنجاح' };
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
    console.warn('Error saving review to Supabase:', err);
    return { success: true, message: 'تم استلام التقييم' };
  }
}

export async function deleteCustomerReview(reviewId: string): Promise<{ success: boolean; message?: string }> {
  const client = getSupabase();

  // Save to list of deleted review IDs in localStorage to persist deletion across reloads
  try {
    const deletedIds: string[] = JSON.parse(localStorage.getItem('khodra_deleted_review_ids') || '[]');
    if (!deletedIds.includes(String(reviewId))) {
      deletedIds.push(String(reviewId));
      localStorage.setItem('khodra_deleted_review_ids', JSON.stringify(deletedIds));
    }

    // Also remove from cached reviews
    const cached = JSON.parse(localStorage.getItem('khodra_customer_reviews') || '[]');
    const updated = cached.filter((item: any) => String(item.id) !== String(reviewId));
    localStorage.setItem('khodra_customer_reviews', JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }

  if (!client) {
    return { success: true, message: 'تم حذف التقييم محلياً' };
  }

  try {
    const { error } = await client
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.warn('Supabase delete review notice:', error.message);
      return { success: true, message: 'تم حذف التقييم وإخفاؤه من المتجر' };
    }

    return { success: true, message: 'تم حذف التقييم بنجاح' };
  } catch (err) {
    console.warn('Network error while deleting review:', err);
    return { success: true, message: 'تم حذف التقييم' };
  }
}

// ═══════════════════════════════════════════════════════════════
// ─── إدارة الطلبات (Order Management) ───
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

// توحيد الحالات القديمة (نصوص عربية) والجديدة (رموز إنجليزية)
function normalizeOrderStatus(raw: string | null | undefined): OrderStatus {
  const s = (raw || '').trim().toLowerCase();
  if (!s) return 'pending';
  if (s === 'prepared' || s.includes('تجهيز') || s.includes('جاهز')) return 'prepared';
  if (s === 'delivered' || s.includes('تسليم') || s.includes('توصيل') || s.includes('موصل')) return 'delivered';
  if (s === 'cancelled' || s.includes('لغا') || s.includes('لغي')) return 'cancelled';
  return 'pending';
}

export async function fetchOrders(): Promise<DbOrder[]> {
  const client = getSupabase();

  // Fallback محلي
  if (!client) {
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

  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('fetchOrders warning:', error.message);
      return [];
    }

    return (data || []).map((row: any): DbOrder => ({
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
    }));
  } catch (err) {
    console.warn('Network error while fetching orders:', err);
    return [];
  }
}

export async function updateOrderStatus(
  orderId: string | number,
  status: OrderStatus
): Promise<{ success: boolean; message?: string }> {
  const client = getSupabase();

  // Fallback محلي
  if (!client) {
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

  // لا نحدّث الطلبات المحلية في Supabase
  if (String(orderId).startsWith('local-')) {
    return { success: true, message: 'طلب محلي (غير موجود في Supabase)' };
  }

  try {
    const { error } = await client
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.warn('updateOrderStatus error:', error.message);
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (err) {
    console.warn('Network error while updating order status:', err);
    return { success: false, message: 'تعذّر الاتصال بالخادم' };
  }
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الإنشاء',
  prepared: 'تم التجهيز',
  delivered: 'تم التسليم',
  cancelled: 'ملغى',
};