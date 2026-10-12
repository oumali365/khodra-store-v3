// ============================================================
// src/server/copilotTools.ts
// الأدوات التشغيلية الحقيقية لـ Khodra AI Copilot v2
// ترتبط حصرياً بقاعدة بيانات Supabase الحقيقية (وضع القراءة فقط الصارم Read-Only)
// تلتزم بالنزاهة التامة: لا fallbacks وهمية، فصل واضح بين النجاح/الجدول الفارغ/الفشل
// ============================================================

import { FunctionDeclaration, Type } from '@google/genai';
import { getServerSupabase } from './supabaseServerClient';
import { STORE_CONFIG } from '../data/config';
import { FEZ_DELIVERY_ZONES } from '../data/deliveryZones';
import {
  calculateSalesMetrics,
  calculatePeriodComparison,
  calculateProductPerformance,
  roundToTwoDecimals,
  computePercentageChange,
} from './businessAnalytics';

export interface ToolExecutionResult {
  toolName: string;
  source: 'supabase_live' | 'store_config' | 'unavailable' | 'error';
  status: 'success' | 'empty' | 'connection_error' | 'query_error' | 'not_configured';
  data: any;
  timestamp: string;
  isRealData: boolean;
  summary: string;
  errorMessage?: string;
}

// ────────────────────────────────────────────────────────────
// دالة مساعدة لحجب أرقام الهواتف لحماية الخصوصية
// ────────────────────────────────────────────────────────────
function maskPhone(phone?: string | null): string {
  if (!phone) return 'غير متوفر';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 8) return clean;
  return clean.slice(0, 3) + '****' + clean.slice(-3);
}

// ────────────────────────────────────────────────────────────
// دالة مساعدة لحساب بداية ونهاية الفترات الزمنية
// ────────────────────────────────────────────────────────────
export function getDateRange(
  period?: string,
  customStart?: string,
  customEnd?: string
): {
  startDate?: string;
  endDate?: string;
  label: string;
  durationHours?: number;
  isComplete?: boolean;
} {
  if (customStart || customEnd) {
    const startMs = customStart ? new Date(customStart).getTime() : 0;
    const endMs = customEnd ? new Date(customEnd).getTime() : Date.now();
    const durationHours = startMs && endMs ? Math.round((endMs - startMs) / (1000 * 60 * 60)) : undefined;
    return {
      startDate: customStart,
      endDate: customEnd,
      label: `فترة مخصصة (${customStart ? customStart.slice(0, 10) : 'البداية'} إلى ${customEnd ? customEnd.slice(0, 10) : 'الآن'})`,
      durationHours,
      isComplete: Boolean(customEnd),
    };
  }

  const now = new Date();

  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const durationHours = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60));
    return { startDate: start.toISOString(), label: 'اليوم', durationHours, isComplete: false };
  }

  if (period === 'yesterday') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString(), label: 'أمس', durationHours: 24, isComplete: true };
  }

  if (period === 'last_7_days') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { startDate: start.toISOString(), label: 'آخر 7 أيام', durationHours: 168, isComplete: true };
  }

  if (period === 'previous_7_days') {
    const start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { startDate: start.toISOString(), endDate: end.toISOString(), label: 'الـ 7 أيام السابقة', durationHours: 168, isComplete: true };
  }

  if (period === 'this_week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    const start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
    const durationHours = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60));
    return { startDate: start.toISOString(), label: 'هذا الأسبوع', durationHours, isComplete: false };
  }

  if (period === 'last_week' || period === 'previous_week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
    const start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    return { startDate: start.toISOString(), endDate: end.toISOString(), label: 'الأسبوع الماضي', durationHours: 168, isComplete: true };
  }

  if (period === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const durationHours = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60));
    return { startDate: start.toISOString(), label: 'هذا الشهر', durationHours, isComplete: false };
  }

  if (period === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const durationHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    return { startDate: start.toISOString(), endDate: end.toISOString(), label: 'الشهر الماضي', durationHours, isComplete: true };
  }

  return { label: 'جميع الفترات' };
}

// ════════════════════════════════════════════════════════════
// 1️⃣ أداة استعلام المنتجات: get_products
// ════════════════════════════════════════════════════════════
export async function executeGetProducts(args: {
  category?: string;
  search?: string;
  is_available?: boolean;
  limit?: number;
}): Promise<ToolExecutionResult> {
  const supabase = getServerSupabase();
  const limit = Math.min(100, Math.max(1, args.limit || 30));

  if (!supabase) {
    return {
      toolName: 'get_products',
      source: 'unavailable',
      status: 'not_configured',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: 'قاعدة بيانات Supabase غير مهيأة على الخادم. تعذر جلب قائمة المنتجات الحقيقية للمتجر.',
      data: {
        error: 'SUPABASE_NOT_CONFIGURED',
        message: 'متغيرات الاتصال بـ Supabase غير مهيأة على الخادم.',
        total_returned: 0,
        products: [],
      },
      errorMessage: 'Supabase credentials not configured in environment',
    };
  }

  try {
    let query = supabase
      .from('products')
      .select('id, name, category, type, price, unit_label, stock, icon, active, is_available, description, origin, updated_at')
      .order('id', { ascending: true })
      .limit(limit);

    if (args.category && args.category !== 'all') {
      query = query.eq('category', args.category);
    }
    if (args.is_available !== undefined) {
      query = query.eq('is_available', args.is_available);
    }
    if (args.search && args.search.trim()) {
      query = query.ilike('name', `%${args.search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[executeGetProducts] Supabase error:', error.message);
      return {
        toolName: 'get_products',
        source: 'error',
        status: 'query_error',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: `تعذر جلب المنتجات بسبب خطأ في استعلام قاعدة البيانات: ${error.message}`,
        data: {
          error: error.message,
          total_returned: 0,
          products: [],
        },
        errorMessage: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        toolName: 'get_products',
        source: 'supabase_live',
        status: 'empty',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: 'تم الاتصال بقاعدة البيانات بنجاح: لا توجد منتجات مسجلة تطابق شروط البحث.',
        data: {
          total_returned: 0,
          category_filter: args.category || 'all',
          search_query: args.search || null,
          products: [],
        },
      };
    }

    const products = data.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: Number(p.price) || 0,
      unit: p.unit_label || (p.type === 'unit' ? 'وحدة' : 'كجم'),
      stock: Number(p.stock) || 0,
      is_available: Boolean(p.is_available && p.active !== false && Number(p.stock) > 0),
      origin: p.origin || 'المغرب',
      icon: p.icon || '🛒',
    }));

    const availableCount = products.filter((p) => p.is_available).length;
    const outOfStockCount = products.length - availableCount;

    return {
      toolName: 'get_products',
      source: 'supabase_live',
      status: 'success',
      isRealData: true,
      timestamp: new Date().toISOString(),
      summary: `تم جلب ${products.length} منتج مباشرة من جدول products في Supabase (المتوفر: ${availableCount}، غير المتوفر: ${outOfStockCount}).`,
      data: {
        total_returned: products.length,
        total_available_in_batch: availableCount,
        total_out_of_stock_in_batch: outOfStockCount,
        category_filter: args.category || 'all',
        search_query: args.search || null,
        products,
      },
    };
  } catch (err: any) {
    console.warn('[executeGetProducts] Exception:', err?.message || err);
    return {
      toolName: 'get_products',
      source: 'error',
      status: 'connection_error',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: `حدث خطأ غير متوقع أثناء استعلام المنتجات: ${err?.message || 'خطأ غير معروف'}`,
      data: {
        error: err?.message || 'Unknown network error',
        total_returned: 0,
        products: [],
      },
      errorMessage: err?.message,
    };
  }
}

// ════════════════════════════════════════════════════════════
// 2️⃣ أداة تحليل المخزون: get_inventory
// ════════════════════════════════════════════════════════════
export async function executeGetInventory(args: {
  filter?: 'all' | 'low_stock' | 'out_of_stock' | 'healthy';
  category?: string;
}): Promise<ToolExecutionResult> {
  const supabase = getServerSupabase();

  if (!supabase) {
    return {
      toolName: 'get_inventory',
      source: 'unavailable',
      status: 'not_configured',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: 'قاعدة بيانات Supabase غير مهيأة على الخادم. تعذر فحص المخزون اللحظي للمتجر.',
      data: {
        error: 'SUPABASE_NOT_CONFIGURED',
        message: 'متغيرات الاتصال بـ Supabase غير متوفرة على الخادم.',
      },
      errorMessage: 'Supabase credentials not configured in environment',
    };
  }

  try {
    let query = supabase
      .from('products')
      .select('id, name, category, price, unit_label, stock, is_available, active')
      .order('stock', { ascending: true });

    if (args.category && args.category !== 'all') {
      query = query.eq('category', args.category);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[executeGetInventory] error:', error.message);
      return {
        toolName: 'get_inventory',
        source: 'error',
        status: 'query_error',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: `تعذر فحص المخزون بسبب خطأ في قاعدة البيانات: ${error.message}`,
        data: { error: error.message },
        errorMessage: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        toolName: 'get_inventory',
        source: 'supabase_live',
        status: 'empty',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: 'تم الاتصال بقاعدة البيانات بنجاح: لا توجد منتجات مسجلة في جدول products لحساب مخزونها.',
        data: {
          total_products: 0,
          available_healthy_count: 0,
          low_stock_count: 0,
          out_of_stock_count: 0,
          inventory_health_percentage: 100,
          critical_warnings: [],
          low_stock_list: [],
          out_of_stock_list: [],
          healthy_sample: [],
        },
      };
    }

    const items = data.map((p) => {
      const stock = Number(p.stock) || 0;
      const isAvail = Boolean(p.is_available && p.active !== false && stock > 0);
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        stock,
        unit: p.unit_label || 'كجم',
        price: Number(p.price) || 0,
        is_available: isAvail,
        status: stock <= 0 || !isAvail ? 'out_of_stock' : stock <= 5 ? 'low_stock' : 'healthy',
      };
    });

    const outOfStock = items.filter((i) => i.status === 'out_of_stock');
    const lowStock = items.filter((i) => i.status === 'low_stock');
    const healthy = items.filter((i) => i.status === 'healthy');

    const healthPercentage = items.length > 0 ? Math.round(((items.length - outOfStock.length) / items.length) * 100) : 100;

    return {
      toolName: 'get_inventory',
      source: 'supabase_live',
      status: 'success',
      isRealData: true,
      timestamp: new Date().toISOString(),
      summary: `المخزون الحي: ${items.length} منتج. المتوفر بأمان: ${healthy.length}، منخفض: ${lowStock.length}، غير متوفر: ${outOfStock.length}. صحة المخزون: ${healthPercentage}%.`,
      data: {
        total_products: items.length,
        available_healthy_count: healthy.length,
        low_stock_count: lowStock.length,
        out_of_stock_count: outOfStock.length,
        inventory_health_percentage: healthPercentage,
        needs_reorder_count: outOfStock.length + lowStock.length,
        critical_warnings: [
          ...lowStock.map((i) => `⚠️ ${i.name}: كمية محدودة (${i.stock} ${i.unit}) - يوصى بالحذر عند الترويج`),
          ...outOfStock.map((i) => `❌ ${i.name}: غير متوفر حالياً (${i.stock} ${i.unit})`),
        ],
        reorder_recommendations: [
          ...outOfStock.map((i) => ({
            id: i.id,
            name: i.name,
            stock: i.stock,
            unit: i.unit,
            priority: 'عاجل جداً (نافد 0 كجم)',
            action: `برمجة شراء فوري فجر الغد من سوق بنسودة (${i.name})`,
          })),
          ...lowStock.map((i) => ({
            id: i.id,
            name: i.name,
            stock: i.stock,
            unit: i.unit,
            priority: 'مرتفع (مخزون منخفض <= 5 كجم)',
            action: `إعادة التزويد لتفادي العجز (${i.name} - متبقي ${i.stock} ${i.unit})`,
          })),
        ],
        low_stock_list: lowStock.slice(0, 15),
        out_of_stock_list: outOfStock.slice(0, 15),
        healthy_sample: healthy.slice(0, 10),
      },
    };
  } catch (err: any) {
    console.warn('[executeGetInventory] Exception:', err?.message || err);
    return {
      toolName: 'get_inventory',
      source: 'error',
      status: 'connection_error',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: `حدث خطأ أثناء فحص المخزون: ${err?.message || 'خطأ غير معروف'}`,
      data: { error: err?.message },
      errorMessage: err?.message,
    };
  }
}

// ════════════════════════════════════════════════════════════
// 3️⃣ أداة استعلام الطلبات: get_orders
// ════════════════════════════════════════════════════════════
export async function executeGetOrders(args: {
  status?: 'pending' | 'prepared' | 'delivered' | 'cancelled' | 'all';
  period?: 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'all';
  delivery_zone?: string;
  search_code?: string;
  limit?: number;
}): Promise<ToolExecutionResult> {
  const supabase = getServerSupabase();
  const limit = Math.min(50, Math.max(1, args.limit || 20));
  const range = getDateRange(args.period);

  if (!supabase) {
    return {
      toolName: 'get_orders',
      source: 'unavailable',
      status: 'not_configured',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: 'قاعدة بيانات Supabase غير مهيأة على الخادم. تعذر جلب بيانات الطلبات الحقيقية.',
      data: {
        error: 'SUPABASE_NOT_CONFIGURED',
        period_label: range.label,
        total_orders_found: 0,
        counts_by_status: { pending: 0, prepared: 0, delivered: 0, cancelled: 0 },
        needs_action_count: 0,
        orders: [],
        note: 'تنبيه: قاعدة البيانات غير متصلة، لا توجد بيانات للطلبات.',
      },
      errorMessage: 'Supabase credentials not configured in environment',
    };
  }

  try {
    let query = supabase
      .from('orders')
      .select('id, order_code, customer_name, phone, address, delivery_zone, items, subtotal, delivery_fee, total, status, note, created_at, updated_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (args.status && args.status !== 'all') {
      query = query.eq('status', args.status);
    }
    if (args.delivery_zone && args.delivery_zone !== 'all') {
      query = query.eq('delivery_zone', args.delivery_zone);
    }
    if (args.search_code && args.search_code.trim()) {
      query = query.ilike('order_code', `%${args.search_code.trim()}%`);
    }
    if (range.startDate) {
      query = query.gte('created_at', range.startDate);
    }
    if (range.endDate) {
      query = query.lte('created_at', range.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[executeGetOrders] Supabase query error:', error.message);
      return {
        toolName: 'get_orders',
        source: 'error',
        status: 'query_error',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: `تعذر استعلام الطلبات من قاعدة البيانات: ${error.message}`,
        data: {
          period_label: range.label,
          total_orders_found: 0,
          counts_by_status: { pending: 0, prepared: 0, delivered: 0, cancelled: 0 },
          needs_action_count: 0,
          orders: [],
          error: error.message,
        },
        errorMessage: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        toolName: 'get_orders',
        source: 'supabase_live',
        status: 'empty',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: `تم الاتصال بقاعدة البيانات بنجاح: لا توجد طلبات مسجلة (${range.label}).`,
        data: {
          period_label: range.label,
          total_orders_found: 0,
          counts_by_status: { pending: 0, prepared: 0, delivered: 0, cancelled: 0 },
          needs_action_count: 0,
          orders: [],
        },
      };
    }

    const sanitizedOrders = data.map((o) => {
      const itemsArr = Array.isArray(o.items) ? o.items : [];
      const itemSummary = itemsArr
        .map((it: any) => `${it.name || 'منتج'} (${it.quantity || 1} ${it.unit_label || 'كجم'})`)
        .join('، ');

      return {
        id: o.id,
        order_code: o.order_code,
        customer_name: o.customer_name || 'عميل',
        phone_masked: maskPhone(o.phone),
        address: o.address,
        delivery_zone: o.delivery_zone,
        total_dh: Number(o.total) || 0,
        subtotal_dh: Number(o.subtotal) || 0,
        delivery_fee_dh: Number(o.delivery_fee) || 0,
        status: o.status,
        status_arabic:
          o.status === 'pending'
            ? 'قيد الانتظار (جديد)'
            : o.status === 'prepared'
            ? 'تم التجهيز'
            : o.status === 'delivered'
            ? 'تم التوصيل'
            : 'ملغي',
        items_count: itemsArr.length,
        items_summary: itemSummary || 'لا توجد تفاصيل',
        created_at: o.created_at,
      };
    });

    const pendingCount = sanitizedOrders.filter((o) => o.status === 'pending').length;
    const preparedCount = sanitizedOrders.filter((o) => o.status === 'prepared').length;
    const deliveredCount = sanitizedOrders.filter((o) => o.status === 'delivered').length;
    const cancelledCount = sanitizedOrders.filter((o) => o.status === 'cancelled').length;

    return {
      toolName: 'get_orders',
      source: 'supabase_live',
      status: 'success',
      isRealData: true,
      timestamp: new Date().toISOString(),
      summary: `تم العثور على ${sanitizedOrders.length} طلب (${range.label}). قيد الانتظار: ${pendingCount}، مجهز: ${preparedCount}، تم التوصيل: ${deliveredCount}، ملغي: ${cancelledCount}.`,
      data: {
        period_label: range.label,
        total_orders_found: sanitizedOrders.length,
        counts_by_status: {
          pending: pendingCount,
          prepared: preparedCount,
          delivered: deliveredCount,
          cancelled: cancelledCount,
        },
        needs_action_count: pendingCount,
        orders: sanitizedOrders,
      },
    };
  } catch (err: any) {
    console.warn('[executeGetOrders] Exception:', err?.message || err);
    return {
      toolName: 'get_orders',
      source: 'error',
      status: 'connection_error',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: `حدث خطأ أثناء استعلام الطلبات: ${err?.message || 'خطأ غير معروف'}`,
      data: { error: err?.message, orders: [] },
      errorMessage: err?.message,
    };
  }
}

// ════════════════════════════════════════════════════════════
// 4️⃣ أداة تحليل المبيعات والإحصائيات: get_sales_summary
// ════════════════════════════════════════════════════════════
export async function executeGetSalesSummary(args: {
  period?: 'today' | 'yesterday' | 'last_7_days' | 'previous_7_days' | 'this_month' | 'last_month' | 'all_time';
  start_date?: string;
  end_date?: string;
}): Promise<ToolExecutionResult> {
  const supabase = getServerSupabase();
  const range = getDateRange(args.period || 'today', args.start_date, args.end_date);

  if (!supabase) {
    return {
      toolName: 'get_sales_summary',
      source: 'unavailable',
      status: 'not_configured',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: `قاعدة بيانات Supabase غير مهيأة على الخادم. تعذر حساب تقرير المبيعات الحقيقي (${range.label}).`,
      data: {
        error: 'SUPABASE_NOT_CONFIGURED',
        period: range.label,
        total_orders: 0,
        delivered_orders_count: 0,
        delivered_revenue_dh: 0,
        pending_orders_count: 0,
        pending_potential_revenue_dh: 0,
        cancelled_orders_count: 0,
        average_order_value_dh: 0,
        currency: 'درهم مغربي (DH)',
        top_selling_items: [],
      },
      errorMessage: 'Supabase credentials not configured in environment',
    };
  }

  try {
    let query = supabase
      .from('orders')
      .select('id, total, subtotal, delivery_fee, status, items, delivery_zone, created_at')
      .eq('is_deleted', false);

    if (range.startDate) {
      query = query.gte('created_at', range.startDate);
    }
    if (range.endDate) {
      query = query.lte('created_at', range.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[executeGetSalesSummary] Supabase error:', error.message);
      return {
        toolName: 'get_sales_summary',
        source: 'error',
        status: 'query_error',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: `تعذر حساب تقرير المبيعات بسبب خطأ في قاعدة البيانات: ${error.message}`,
        data: {
          period: range.label,
          total_orders: 0,
          delivered_orders_count: 0,
          delivered_revenue_dh: 0,
          pending_orders_count: 0,
          pending_potential_revenue_dh: 0,
          cancelled_orders_count: 0,
          average_order_value_dh: 0,
          currency: 'درهم مغربي (DH)',
          top_selling_items: [],
          error: error.message,
        },
        errorMessage: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        toolName: 'get_sales_summary',
        source: 'supabase_live',
        status: 'empty',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: `تم الاتصال بقاعدة البيانات بنجاح: لا توجد طلبات مسجلة في هذه الفترة (${range.label}) لحساب المبيعات.`,
        data: {
          period: range.label,
          total_orders: 0,
          delivered_orders_count: 0,
          delivered_revenue_dh: 0,
          pending_orders_count: 0,
          pending_potential_revenue_dh: 0,
          cancelled_orders_count: 0,
          total_active_revenue_dh: 0,
          average_order_value_dh: 0,
          currency: 'درهم مغربي (DH)',
          top_selling_items: [],
          zone_distribution: { north: 0, central: 0, south: 0, east: 0 },
        },
      };
    }

    const metrics = calculateSalesMetrics(data, range.label);
    const prodPerf = calculateProductPerformance(data, [], [], range.label);

    const totalOrders = metrics.totalOrdersCount.value;
    const deliveredOrdersCount = metrics.qualifyingOrdersCount.value;
    const deliveredRevenue = metrics.deliveredRevenueDh.value;
    const pendingOrdersCount = metrics.pendingOrdersCount.value + metrics.preparedOrdersCount.value;
    const pendingRevenue = metrics.pendingPotentialRevenueDh.value;
    const cancelledOrdersCount = metrics.cancelledOrdersCount.value;
    const totalActiveRevenue = roundToTwoDecimals(deliveredRevenue + pendingRevenue);
    const averageOrderValue = metrics.averageOrderValueDh.value;

    const topSellingProducts = prodPerf.topByQuantity.slice(0, 5).map((i) => ({
      name: i.name,
      total_quantity: i.quantitySold,
      unit: i.unit,
      in_orders_count: i.ordersCount,
      revenue_dh: i.revenueContributedDh,
    }));

    return {
      toolName: 'get_sales_summary',
      source: 'supabase_live',
      status: 'success',
      isRealData: true,
      timestamp: new Date().toISOString(),
      summary: `تقرير مبيعات (${range.label}): ${totalOrders} طلب. إيرادات التوصيل الناجحة: ${deliveredRevenue} درهم. طلبات قيد الإنجاز: ${pendingOrdersCount} بقيمة ${pendingRevenue} درهم. متوسط السلة: ${averageOrderValue} درهم.`,
      data: {
        period: range.label,
        total_orders: totalOrders,
        delivered_orders_count: deliveredOrdersCount,
        delivered_revenue_dh: deliveredRevenue,
        pending_orders_count: pendingOrdersCount,
        pending_potential_revenue_dh: pendingRevenue,
        cancelled_orders_count: cancelledOrdersCount,
        total_active_revenue_dh: totalActiveRevenue,
        average_order_value_dh: averageOrderValue,
        subtotal_revenue_dh: metrics.subtotalRevenueDh.value,
        delivery_fees_revenue_dh: metrics.deliveryFeesRevenueDh.value,
        qualifying_orders_count: deliveredOrdersCount,
        currency: 'درهم مغربي (DH)',
        top_selling_items: topSellingProducts,
        top_by_revenue: prodPerf.topByRevenue.slice(0, 5),
        zone_distribution: metrics.zoneDistribution,
        metrics,
        provenance: {
          sourceTable: 'orders',
          ordersAnalyzed: data.length,
          qualifyingDeliveredOrders: deliveredOrdersCount,
          computedAt: metrics.computedAt,
          formulaAov: 'delivered_revenue_dh / delivered_orders_count',
        },
        limitations: metrics.limitations,
      },
    };
  } catch (err: any) {
    console.warn('[executeGetSalesSummary] Exception:', err?.message || err);
    return {
      toolName: 'get_sales_summary',
      source: 'error',
      status: 'connection_error',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: `حدث خطأ أثناء حساب تقرير المبيعات: ${err?.message || 'خطأ غير معروف'}`,
      data: { error: err?.message },
      errorMessage: err?.message,
    };
  }
}

// ════════════════════════════════════════════════════════════
// 4️⃣-ب أداة مقارنة المبيعات بين فترتين: compare_sales_periods
// ════════════════════════════════════════════════════════════
export async function executeCompareSalesPeriods(args: {
  current_period?: string;
  previous_period?: string;
  current_start?: string;
  current_end?: string;
  previous_start?: string;
  previous_end?: string;
}): Promise<ToolExecutionResult> {
  const supabase = getServerSupabase();

  let curPeriodKey = args.current_period || 'today';
  let prevPeriodKey = args.previous_period;
  if (!prevPeriodKey) {
    if (curPeriodKey === 'today') prevPeriodKey = 'yesterday';
    else if (curPeriodKey === 'last_7_days' || curPeriodKey === 'this_week') prevPeriodKey = 'previous_7_days';
    else if (curPeriodKey === 'this_month') prevPeriodKey = 'last_month';
    else prevPeriodKey = 'yesterday';
  }

  const rangeCur = getDateRange(curPeriodKey, args.current_start, args.current_end);
  const rangePrev = getDateRange(prevPeriodKey, args.previous_start, args.previous_end);

  if (!supabase) {
    return {
      toolName: 'compare_sales_periods',
      source: 'unavailable',
      status: 'not_configured',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: 'قاعدة بيانات Supabase غير مهيأة على الخادم. تعذر إجراء المقارنة الزمنية للمبيعات.',
      data: {
        error: 'SUPABASE_NOT_CONFIGURED',
        current_period: rangeCur.label,
        previous_period: rangePrev.label,
      },
      errorMessage: 'Supabase credentials not configured in environment',
    };
  }

  try {
    let qCur = supabase
      .from('orders')
      .select('id, total, subtotal, delivery_fee, status, items, delivery_zone, created_at')
      .eq('is_deleted', false);
    if (rangeCur.startDate) qCur = qCur.gte('created_at', rangeCur.startDate);
    if (rangeCur.endDate) qCur = qCur.lte('created_at', rangeCur.endDate);

    let qPrev = supabase
      .from('orders')
      .select('id, total, subtotal, delivery_fee, status, items, delivery_zone, created_at')
      .eq('is_deleted', false);
    if (rangePrev.startDate) qPrev = qPrev.gte('created_at', rangePrev.startDate);
    if (rangePrev.endDate) qPrev = qPrev.lte('created_at', rangePrev.endDate);

    const [resCur, resPrev] = await Promise.all([qCur, qPrev]);

    if (resCur.error || resPrev.error) {
      const errMsg = resCur.error?.message || resPrev.error?.message;
      return {
        toolName: 'compare_sales_periods',
        source: 'error',
        status: 'query_error',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: `تعذر استعلام بيانات المقارنة بسبب خطأ في قاعدة البيانات: ${errMsg}`,
        data: { error: errMsg },
        errorMessage: errMsg,
      };
    }

    const curOrders = resCur.data || [];
    const prevOrders = resPrev.data || [];

    const durationNotice =
      rangeCur.durationHours && rangePrev.durationHours && rangeCur.durationHours !== rangePrev.durationHours
        ? `تنبيه مدة المقارنة: الفترة الحالية تمتد لـ ${rangeCur.durationHours} ساعة بينما الفترة المرجعية تمتد لـ ${rangePrev.durationHours} ساعة.`
        : undefined;

    const comparison = calculatePeriodComparison(
      curOrders,
      prevOrders,
      rangeCur.label,
      rangePrev.label,
      {
        isEqualDuration: rangeCur.durationHours === rangePrev.durationHours,
        durationNotice,
      }
    );

    const summaryText = `مقارنة المبيعات (${rangeCur.label} مقابل ${rangePrev.label}): إيراد الحالية ${comparison.revenueComparison.currentValue} DH (${comparison.revenueComparison.summaryArabic}) | الطلبات المسلمة: ${comparison.ordersComparison.currentValue} طلب (${comparison.ordersComparison.summaryArabic}).`;

    return {
      toolName: 'compare_sales_periods',
      source: 'supabase_live',
      status: 'success',
      isRealData: curOrders.length > 0 || prevOrders.length > 0,
      timestamp: new Date().toISOString(),
      summary: summaryText,
      data: {
        current_period: rangeCur.label,
        previous_period: rangePrev.label,
        comparison,
        durationNotice,
      },
    };
  } catch (err: any) {
    return {
      toolName: 'compare_sales_periods',
      source: 'error',
      status: 'connection_error',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: `حدث خطأ أثناء مقارنة الفترات: ${err?.message}`,
      data: { error: err?.message },
      errorMessage: err?.message,
    };
  }
}

// ════════════════════════════════════════════════════════════
// 4️⃣-ج أداة تحليل أداء المنتجات المتقدم: get_product_analytics
// ════════════════════════════════════════════════════════════
export async function executeGetProductAnalytics(args: {
  period?: string;
  compare_with_previous?: boolean;
}): Promise<ToolExecutionResult> {
  const supabase = getServerSupabase();
  const range = getDateRange(args.period || 'all_time');

  if (!supabase) {
    return {
      toolName: 'get_product_analytics',
      source: 'unavailable',
      status: 'not_configured',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: 'قاعدة بيانات Supabase غير مهيأة على الخادم. تعذر فحص أداء المنتجات.',
      data: { error: 'SUPABASE_NOT_CONFIGURED' },
      errorMessage: 'Supabase credentials not configured',
    };
  }

  try {
    let qOrders = supabase
      .from('orders')
      .select('id, items, status, is_deleted, created_at')
      .eq('is_deleted', false);
    if (range.startDate) qOrders = qOrders.gte('created_at', range.startDate);
    if (range.endDate) qOrders = qOrders.lte('created_at', range.endDate);

    const qProducts = supabase
      .from('products')
      .select('id, name, category, price, stock, is_available, active');

    const [ordersRes, prodsRes] = await Promise.all([qOrders, qProducts]);

    if (ordersRes.error || prodsRes.error) {
      const errMsg = ordersRes.error?.message || prodsRes.error?.message;
      return {
        toolName: 'get_product_analytics',
        source: 'error',
        status: 'query_error',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: `تعذر تحليل أداء المنتجات: ${errMsg}`,
        data: { error: errMsg },
        errorMessage: errMsg,
      };
    }

    const perf = calculateProductPerformance(
      ordersRes.data || [],
      prodsRes.data || [],
      [],
      range.label
    );

    const topQtyName = perf.topByQuantity[0]?.name || 'لا يوجد';
    const topRevName = perf.topByRevenue[0]?.name || 'لا يوجد';

    return {
      toolName: 'get_product_analytics',
      source: 'supabase_live',
      status: 'success',
      isRealData: (ordersRes.data || []).length > 0 || (prodsRes.data || []).length > 0,
      timestamp: new Date().toISOString(),
      summary: `أداء المنتجات (${range.label}): تم تحليل ${(ordersRes.data || []).length} طلب. الأكثر كمية: ${topQtyName}. الأعلى مساهمة في القيمة: ${topRevName}. أصناف بدون مبيعات: ${perf.zeroSalesCount}.`,
      data: {
        period: range.label,
        analytics: perf,
      },
    };
  } catch (err: any) {
    return {
      toolName: 'get_product_analytics',
      source: 'error',
      status: 'connection_error',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: `خطأ استعلام أداء المنتجات: ${err?.message}`,
      data: { error: err?.message },
      errorMessage: err?.message,
    };
  }
}

// ════════════════════════════════════════════════════════════
// 5️⃣ أداة تتبع حركات المخزون: get_inventory_movements
// ════════════════════════════════════════════════════════════
export async function executeGetInventoryMovements(args: {
  product_id?: number;
  movement_type?: string;
  limit?: number;
}): Promise<ToolExecutionResult> {
  const supabase = getServerSupabase();
  const limit = Math.min(50, Math.max(1, args.limit || 15));

  if (!supabase) {
    return {
      toolName: 'get_inventory_movements',
      source: 'unavailable',
      status: 'not_configured',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: 'قاعدة بيانات Supabase غير مهيأة على الخادم. تعذر جلب سجل حركات وتدقيق المخزون.',
      data: {
        error: 'SUPABASE_NOT_CONFIGURED',
        total_movements: 0,
        movements: [],
      },
      errorMessage: 'Supabase credentials not configured in environment',
    };
  }

  try {
    let query = supabase
      .from('inventory_ledger')
      .select(`
        id,
        product_id,
        order_id,
        quantity_delta,
        movement_type,
        stock_before,
        stock_after,
        reason,
        created_by,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (args.product_id) {
      query = query.eq('product_id', args.product_id);
    }
    if (args.movement_type && args.movement_type !== 'all') {
      query = query.eq('movement_type', args.movement_type);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[executeGetInventoryMovements] Supabase error:', error.message);
      return {
        toolName: 'get_inventory_movements',
        source: 'error',
        status: 'query_error',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: `تعذر استعلام سجل حركات المخزون: ${error.message}`,
        data: {
          total_movements: 0,
          movements: [],
          error: error.message,
        },
        errorMessage: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        toolName: 'get_inventory_movements',
        source: 'supabase_live',
        status: 'empty',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: 'سجل حركات وتدقيق المخزون (inventory_ledger) خالٍ حالياً في قاعدة البيانات.',
        data: {
          total_movements: 0,
          movements: [],
        },
      };
    }

    // جلب أسماء المنتجات لربطها بالحركات
    const productIds = Array.from(new Set(data.map((m) => m.product_id)));
    let productNamesMap: Record<number, string> = {};

    if (productIds.length > 0) {
      const { data: prodData } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);
      if (prodData) {
        prodData.forEach((p) => {
          productNamesMap[p.id] = p.name;
        });
      }
    }

    const movements = data.map((m) => {
      const prodName = productNamesMap[m.product_id] || `منتج #${m.product_id}`;
      const delta = Number(m.quantity_delta);
      const typeLabel =
        m.movement_type === 'order_deduct'
          ? 'خصم تلقائي لطلب'
          : m.movement_type === 'order_restore'
          ? 'استرجاع كمية لطلب ملغي'
          : m.movement_type === 'morning_stockin'
          ? 'تزويد صباحي من سوق بنسودة'
          : 'تعديل يدوي للمخزون';

      return {
        id: m.id,
        product_id: m.product_id,
        product_name: prodName,
        delta_formatted: delta > 0 ? `+${delta}` : `${delta}`,
        movement_type: m.movement_type,
        movement_type_arabic: typeLabel,
        stock_before: Number(m.stock_before),
        stock_after: Number(m.stock_after),
        reason: m.reason || 'بدون سبب مسجل',
        created_by: m.created_by || 'system',
        created_at: m.created_at,
      };
    });

    return {
      toolName: 'get_inventory_movements',
      source: 'supabase_live',
      status: 'success',
      isRealData: true,
      timestamp: new Date().toISOString(),
      summary: `تم العثور على ${movements.length} حركة مخزون مسجلة في سجل inventory_ledger.`,
      data: {
        total_movements: movements.length,
        movements,
      },
    };
  } catch (err: any) {
    console.warn('[executeGetInventoryMovements] Exception:', err?.message || err);
    return {
      toolName: 'get_inventory_movements',
      source: 'error',
      status: 'connection_error',
      isRealData: false,
      timestamp: new Date().toISOString(),
      summary: `حدث خطأ أثناء استعلام حركات المخزون: ${err?.message || 'خطأ غير معروف'}`,
      data: { error: err?.message, movements: [] },
      errorMessage: err?.message,
    };
  }
}

// ════════════════════════════════════════════════════════════
// 6️⃣ أداة معلومات المتجر وسياسات التوصيل: get_store_info
// ════════════════════════════════════════════════════════════
export function executeGetStoreInfo(): ToolExecutionResult {
  return {
    toolName: 'get_store_info',
    source: 'store_config',
    status: 'success',
    isRealData: false,
    timestamp: new Date().toISOString(),
    summary: 'معلومات وتشغيل متجر خُضرة فاس، مناطق التوصيل، والسياسات المعتمدة.',
    data: {
      store_name: STORE_CONFIG.storeName,
      tagline: STORE_CONFIG.tagline,
      city: STORE_CONFIG.city,
      wholesale_source: 'سوق الجملة للخضر والفواكه بنسودة — فاس',
      delivery_zones: Object.values(FEZ_DELIVERY_ZONES).map((z) => ({
        id: z.id,
        name_ar: z.name,
        neighborhoods: z.neighborhoods,
        target_time: z.targetTime,
        description: z.description,
      })),
      pricing_rules: {
        currency: STORE_CONFIG.currency,
        standard_delivery_fee: STORE_CONFIG.standardDeliveryFee,
        free_delivery_threshold: STORE_CONFIG.freeDeliveryThreshold,
        minimum_order_amount: STORE_CONFIG.minOrderAmount,
      },
      payment_methods: [
        'الدفع عند الاستلام نقداً (Cash on Delivery - COD) بعد المعاينة',
        'التحويل البنكي الفوري (Barid Bank, Banque Populaire, CIH, Attijariwafa Bank)',
      ],
      whatsapp_support: STORE_CONFIG.whatsappNumber,
      operating_hours: 'استلام الطلبات 24/7، التوصيل يبدأ من 09:00 صباحاً حتى 20:00 مساءً يومياً',
    },
  };
}

// ════════════════════════════════════════════════════════════
// تعريفات الأدوات لـ Gemini Function Calling (@google/genai)
// ════════════════════════════════════════════════════════════
export const COPILOT_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'get_products',
    description: 'استعلام قائمة المنتجات الحالية من قاعدة البيانات، مع إمكانية التصفية حسب الفئة أو الاسم أو حالة التوفر.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: 'فئة المنتج: veg (خضار), fruit (فواكه), dairy (ألبان), grocery (بقالة), drinks (مشروبات), cleaning (نظافة)',
        },
        search: {
          type: Type.STRING,
          description: 'نص للبحث في اسم المنتج مثل "بطاطس" أو "طماطم" أو "برتقال"',
        },
        is_available: {
          type: Type.BOOLEAN,
          description: 'تحديد ما إذا كنت تريد المنتجات المتوفرة فقط (true) أو غير المتوفرة (false)',
        },
        limit: {
          type: Type.INTEGER,
          description: 'عدد المنتجات الأقصى المطلوب إرجاعه (افتراضياً 25)',
        },
      },
    },
  },
  {
    name: 'get_inventory',
    description: 'تحليل دقيق ومباشر لحالة المخزون، المنتجات الناقصة، المنتجات غير المتوفرة، ونسبة صحة المخزون بالمتجر.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filter: {
          type: Type.STRING,
          description: 'نوع التصفية: all (الكل), low_stock (المخزون المنخفض <= 5), out_of_stock (النافد 0), healthy (المتوفر بأمان > 5)',
        },
        category: {
          type: Type.STRING,
          description: 'تصفية حسب فئة معينة: veg, fruit, dairy, grocery, drinks, cleaning',
        },
      },
    },
  },
  {
    name: 'get_orders',
    description: 'استعلام قائمة الطلبات الحقيقية من المتجر، مع التصفية حسب الحالة (قيد الانتظار، مجهز، تم التوصيل) أو الفترة الزمنية أو المنطقة.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: 'حالة الطلب: pending (قيد الانتظار/جديد), prepared (مجهز), delivered (تم التوصيل), cancelled (ملغي), all (الكل)',
        },
        period: {
          type: Type.STRING,
          description: 'الفترة الزمنية: today (اليوم), yesterday (أمس), last_7_days (آخر 7 أيام), this_month (هذا الشهر), all (الكل)',
        },
        delivery_zone: {
          type: Type.STRING,
          description: 'منطقة التوصيل بفاس: north, central, south, east, all',
        },
        search_code: {
          type: Type.STRING,
          description: 'كود طلب محدد مثل KH-1234',
        },
        limit: {
          type: Type.INTEGER,
          description: 'الحد الأقصى للطلبات (افتراضياً 20)',
        },
      },
    },
  },
  {
    name: 'get_sales_summary',
    description: 'تقديم تقرير وإحصائيات مبيعات مالية دقيقة لفترة محددة: إجمالي الإيرادات، عدد الطلبات، متوسط السلة، والمنتجات الأكثر طلباً.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        period: {
          type: Type.STRING,
          description: 'الفترة المطلوبة: today (اليوم), yesterday (أمس), last_7_days (آخر 7 أيام), previous_7_days (الـ 7 أيام السابقة للمقارنة), this_month (هذا الشهر), last_month (الشهر الماضي للمقارنة), all_time (كامل الفترة)',
        },
      },
    },
  },
  {
    name: 'compare_sales_periods',
    description: 'إجراء مقارنة تحليلية صارمة بين فترتين زمنيتين (مثل اليوم مقارنة بأمس، هذا الأسبوع مقارنة بالسابق، هذا الشهر مقارنة بالماضي)، مع حساب الفوارق المطلقة والنسب المئوية الدقيقة ومعالجة المقام الصفري.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        current_period: {
          type: Type.STRING,
          description: 'الفترة الحالية المراد تقييمها: today, yesterday, last_7_days, this_week, this_month',
        },
        previous_period: {
          type: Type.STRING,
          description: 'الفترة المرجعية للمقارنة: yesterday, previous_7_days, last_week, last_month',
        },
        current_start: {
          type: Type.STRING,
          description: 'تاريخ بداية مخصص للفترة الحالية (ISO)',
        },
        current_end: {
          type: Type.STRING,
          description: 'تاريخ نهاية مخصص للفترة الحالية (ISO)',
        },
        previous_start: {
          type: Type.STRING,
          description: 'تاريخ بداية مخصص للفترة المرجعية (ISO)',
        },
        previous_end: {
          type: Type.STRING,
          description: 'تاريخ نهاية مخصص للفترة المرجعية (ISO)',
        },
      },
    },
  },
  {
    name: 'get_product_analytics',
    description: 'تحليل أداء المنتجات المتقدم: الأكثر طلباً بالكمية، الأعلى مساهمة في الإيراد (Quantity * Price)، المنتجات المتراجعة بين فترتين، والأصناف التي لم تسجل مبيعات.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        period: {
          type: Type.STRING,
          description: 'الفترة الزمنية للتحليل: today, yesterday, last_7_days, this_month, all_time',
        },
        compare_with_previous: {
          type: Type.BOOLEAN,
          description: 'ما إذا كان يجب مقارنة الكميات مع الفترة السابقة لرصد المنتجات المتراجعة (true/false)',
        },
      },
    },
  },
  {
    name: 'get_inventory_movements',
    description: 'استعلام سجل حركات وتدقيق المخزون (inventory_ledger) لتتبع الخصم عند الطلبات أو الاسترجاع أو التعديلات اليدوية.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        product_id: {
          type: Type.INTEGER,
          description: 'معرف منتج معين لتتبع حركاته الحصرية',
        },
        movement_type: {
          type: Type.STRING,
          description: 'نوع الحركة: order_deduct (خصم طلب), order_restore (استرجاع), morning_stockin (تزويد صباحي), manual_adjustment (تعديل يدوي)',
        },
        limit: {
          type: Type.INTEGER,
          description: 'عدد الحركات المراد جلبها (افتراضياً 15)',
        },
      },
    },
  },
  {
    name: 'get_store_info',
    description: 'استعلام معلومات متجر خُضرة فاس: مناطق التوصيل الأربعة، الحد الأدنى للطلب، عتبة التوصيل المجاني، أوقات العمل، وسياسات الدفع.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

// ────────────────────────────────────────────────────────────
// موزع تنفيذ الأدوات حسب الاسم (Tool Dispatcher)
// ────────────────────────────────────────────────────────────
export async function dispatchCopilotTool(toolName: string, args: any): Promise<ToolExecutionResult> {
  const safeArgs = args || {};
  switch (toolName) {
    case 'get_products':
      return await executeGetProducts(safeArgs);
    case 'get_inventory':
      return await executeGetInventory(safeArgs);
    case 'get_orders':
      return await executeGetOrders(safeArgs);
    case 'get_sales_summary':
      return await executeGetSalesSummary(safeArgs);
    case 'compare_sales_periods':
      return await executeCompareSalesPeriods(safeArgs);
    case 'get_product_analytics':
      return await executeGetProductAnalytics(safeArgs);
    case 'get_inventory_movements':
      return await executeGetInventoryMovements(safeArgs);
    case 'get_store_info':
      return executeGetStoreInfo();
    default:
      return {
        toolName,
        source: 'unavailable',
        status: 'not_configured',
        isRealData: false,
        timestamp: new Date().toISOString(),
        summary: `أداة غير معروفة: ${toolName}`,
        data: { error: `الأداة ${toolName} غير مدعومة.` },
        errorMessage: `Unknown tool ${toolName}`,
      };
  }
}
