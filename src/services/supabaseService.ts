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
      // Fallback if table or active column doesn't match
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
      status: 'جديد',
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
