// ============================================================
// src/server/businessAnalytics.ts
// محرك الحسابات والمؤشرات التجارية الموثوقة — خُضرة فاس (Khodra Fès)
// Phase 3 — Business Analytics, Comparisons & Verified Insights
//
// المبادئ الأساسية:
// 1. فصل تام بين الحساب الرياضي الدقيق (TypeScript) وصياغة الذكاء الاصطناعي (Gemini).
// 2. الحسابات الصارمة: التقريب لكسرين عشريين، استبعاد الطلبات الملغاة من الإيرادات، معالجة المقام الصفري.
// 3. كل مؤشر قابل للتتبع لمصدره الأصلي، عدد سجلاته، وصيغته الرياضية.
// 4. لا افتراض لأي بيانات تكاليف غير موجودة في المخطط (Zero Cost Speculation).
// ============================================================

export interface VerifiedMetric<T = number> {
  name: string;
  nameArabic: string;
  value: T;
  formattedValue: string;
  source: 'orders_table' | 'products_table' | 'inventory_ledger' | 'derived_calculation';
  formula: string;
  recordsCount: number;
  currency?: string;
  timestamp: string;
  status: 'verified' | 'insufficient_data' | 'zero_baseline' | 'error';
  limitations?: string[];
}

export interface SalesMetrics {
  periodLabel: string;
  totalOrdersCount: VerifiedMetric<number>;
  qualifyingOrdersCount: VerifiedMetric<number>; // الطلبات المسلمة المؤهلة للإيراد المؤكد
  pendingOrdersCount: VerifiedMetric<number>;
  preparedOrdersCount: VerifiedMetric<number>;
  cancelledOrdersCount: VerifiedMetric<number>;
  
  // الإيرادات
  deliveredRevenueDh: VerifiedMetric<number>; // الإيراد المؤكد الفعلي
  subtotalRevenueDh: VerifiedMetric<number>;  // إجمالي السلع بدون توصيل
  deliveryFeesRevenueDh: VerifiedMetric<number>; // رسوم التوصيل المحصلة
  pendingPotentialRevenueDh: VerifiedMetric<number>; // إيراد محتمل للطلبات قيد الإنجاز
  
  // متوسط قيمة الطلب (AOV)
  averageOrderValueDh: VerifiedMetric<number>;
  
  // التوزيع الجغرافي للطلبات
  zoneDistribution: Record<string, number>;
  
  // التحقق والنزاهة
  isRealData: boolean;
  computedAt: string;
  limitations: string[];
}

export interface ComparisonMetric {
  metricName: string;
  metricArabic: string;
  currentValue: number;
  previousValue: number;
  absoluteDifference: number; // current - previous
  percentageChange: number | null; // ((current - previous) / previous) * 100 or null if previous == 0
  isZeroDenominator: boolean;
  changeDirection: 'growth' | 'decline' | 'stable' | 'undefined';
  summaryArabic: string;
}

export interface PeriodComparisonResult {
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  comparisonBasis: string;
  isEqualDuration: boolean;
  durationNotice?: string;
  
  revenueComparison: ComparisonMetric;
  ordersComparison: ComparisonMetric;
  aovComparison: ComparisonMetric;
  
  topGrowingCategory?: string;
  overallVerdict: string;
  provenance: {
    currentOrdersCount: number;
    previousOrdersCount: number;
    currentQualifyingCount: number;
    previousQualifyingCount: number;
    formulaUsed: string;
    computedAt: string;
  };
  limitations: string[];
}

export interface RankedProductItem {
  name: string;
  category?: string;
  quantitySold: number;
  unit: string;
  revenueContributedDh: number;
  ordersCount: number;
  currentStock?: number;
  stockStatus?: 'healthy' | 'low_stock' | 'out_of_stock' | 'unknown';
}

export interface ProductPerformanceResult {
  periodLabel: string;
  totalProductsWithSales: number;
  totalCatalogProductsCount: number;
  catalogCoveragePercentage: number;
  
  topByQuantity: RankedProductItem[];
  topByRevenue: RankedProductItem[];
  decliningProducts: {
    name: string;
    previousQuantity: number;
    currentQuantity: number;
    declineAbsolute: number;
    declinePercentage: number;
  }[];
  zeroSalesProductsSample: string[];
  zeroSalesCount: number;
  
  provenance: {
    ordersAnalyzedCount: number;
    catalogProductsCount: number;
    computedAt: string;
  };
  limitations: string[];
}

export interface InventoryAnalyticsResult {
  totalProducts: number;
  healthyCount: number; // stock > 5
  lowStockCount: number; // 0 < stock <= 5
  outOfStockCount: number; // stock <= 0 or unavailable
  inventoryHealthPercentage: number;
  
  reorderRequiredItems: {
    id: number | string;
    name: string;
    stock: number;
    unit: string;
    urgency: 'critical_out_of_stock' | 'urgent_low_stock';
    action: string;
  }[];
  
  recentMovementsSummary?: {
    totalMovements: number;
    totalDeductionsCount: number;
    totalRestoresCount: number;
    totalStockInsCount: number;
  };
  
  limitations: string[];
  computedAt: string;
}

// ────────────────────────────────────────────────────────────
// دوال الحساب الرياضي الدقيق (Pure Computation Functions)
// ────────────────────────────────────────────────────────────

/**
 * تقريب نقدي دقيق لكسرين عشريين لتفادي تراكم أخطاء Floating Point
 */
export function roundToTwoDecimals(num: number): number {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * حساب النسبة المئوية للتغير مع معالجة المقام الصفري بدقة محاسبية
 */
export function computePercentageChange(
  current: number,
  previous: number
): {
  percentage: number | null;
  isZeroDenominator: boolean;
  formatted: string;
  direction: 'growth' | 'decline' | 'stable' | 'undefined';
} {
  const currentClean = roundToTwoDecimals(current);
  const previousClean = roundToTwoDecimals(previous);

  if (previousClean === 0) {
    if (currentClean === 0) {
      return {
        percentage: 0,
        isZeroDenominator: false,
        formatted: '0.00%',
        direction: 'stable',
      };
    }
    // المقام صفري والقيمة الحالية موجبة: نسبة مئوية غير معرّفة رياضياً
    return {
      percentage: null,
      isZeroDenominator: true,
      formatted: `نمو من الصفر إلى ${currentClean} (المقام صفر: نسبة غير معرفة)`,
      direction: 'growth',
    };
  }

  const rawChange = ((currentClean - previousClean) / previousClean) * 100;
  const roundedChange = roundToTwoDecimals(rawChange);

  let direction: 'growth' | 'decline' | 'stable' = 'stable';
  if (roundedChange > 0) direction = 'growth';
  else if (roundedChange < 0) direction = 'decline';

  const sign = roundedChange > 0 ? '+' : '';
  return {
    percentage: roundedChange,
    isZeroDenominator: false,
    formatted: `${sign}${roundedChange}%`,
    direction,
  };
}

/**
 * 1️⃣ حساب مؤشرات المبيعات والطلبات لفترة معينة
 * يلتزم الصرامة:
 * - استبعاد الطلبات الملغاة والمحذوفة
 * - فصل الإيراد المسلّم المؤكد عن الإيراد المعلق
 * - حساب AOV على الطلبات المؤهلة فقط
 */
export function calculateSalesMetrics(
  rawOrders: any[],
  periodLabel: string = 'الفترة المحددة'
): SalesMetrics {
  const now = new Date().toISOString();
  const validOrders = (rawOrders || []).filter((o) => !o.is_deleted);

  const totalCount = validOrders.length;
  const deliveredOrders = validOrders.filter((o) => o.status === 'delivered');
  const pendingOrders = validOrders.filter((o) => o.status === 'pending');
  const preparedOrders = validOrders.filter((o) => o.status === 'prepared');
  const cancelledOrders = validOrders.filter((o) => o.status === 'cancelled');

  // حساب الإيرادات الدقيقة
  let deliveredTotal = 0;
  let deliveredSubtotal = 0;
  let deliveredDeliveryFees = 0;

  for (const o of deliveredOrders) {
    deliveredTotal += Number(o.total) || 0;
    deliveredSubtotal += Number(o.subtotal) || 0;
    deliveredDeliveryFees += Number(o.delivery_fee) || 0;
  }

  deliveredTotal = roundToTwoDecimals(deliveredTotal);
  deliveredSubtotal = roundToTwoDecimals(deliveredSubtotal);
  deliveredDeliveryFees = roundToTwoDecimals(deliveredDeliveryFees);

  // إيراد محتمل للطلبات قيد الإنجاز (pending + prepared)
  let pendingPotential = 0;
  for (const o of [...pendingOrders, ...preparedOrders]) {
    pendingPotential += Number(o.total) || 0;
  }
  pendingPotential = roundToTwoDecimals(pendingPotential);

  // حساب متوسط قيمة الطلب (AOV)
  const qualifyingCount = deliveredOrders.length;
  const aov = qualifyingCount > 0 ? roundToTwoDecimals(deliveredTotal / qualifyingCount) : 0;

  // توزيع المناطق
  const zoneDistribution: Record<string, number> = {
    north: 0,
    central: 0,
    south: 0,
    east: 0,
  };
  for (const o of validOrders) {
    if (o.status === 'cancelled') continue;
    const z = o.delivery_zone || 'central';
    zoneDistribution[z] = (zoneDistribution[z] || 0) + 1;
  }

  const limitations = [
    'الإيرادات المؤكدة تشمل حصراً الطلبات بحالة "تم التوصيل" (delivered) لاستبعاد الإلغاءات والمردودات.',
    'تم استبعاد الطلبات الملغاة (cancelled) والطلبات المحذوفة (is_deleted=true) من كافة حسابات المبيعات.',
    'قاعدة البيانات الحالية لا تسجل تكلفة شراء الخضر من سوق الجملة (COGS) أو مصاريف التوصيل، لذا يتعذر احتساب صافي الربح.',
  ];

  return {
    periodLabel,
    totalOrdersCount: {
      name: 'total_orders_count',
      nameArabic: 'إجمالي عدد الطلبات المسجلة',
      value: totalCount,
      formattedValue: `${totalCount} طلب`,
      source: 'orders_table',
      formula: 'COUNT(orders WHERE is_deleted = false)',
      recordsCount: totalCount,
      timestamp: now,
      status: 'verified',
    },
    qualifyingOrdersCount: {
      name: 'qualifying_orders_count',
      nameArabic: 'الطلبات المؤهلة للإيراد (المسلمة)',
      value: qualifyingCount,
      formattedValue: `${qualifyingCount} طلب مسلّم`,
      source: 'orders_table',
      formula: 'COUNT(orders WHERE status = "delivered" AND is_deleted = false)',
      recordsCount: qualifyingCount,
      timestamp: now,
      status: 'verified',
    },
    pendingOrdersCount: {
      name: 'pending_orders_count',
      nameArabic: 'طلبات قيد الانتظار (جديدة)',
      value: pendingOrders.length,
      formattedValue: `${pendingOrders.length} طلب جديد`,
      source: 'orders_table',
      formula: 'COUNT(orders WHERE status = "pending")',
      recordsCount: pendingOrders.length,
      timestamp: now,
      status: 'verified',
    },
    preparedOrdersCount: {
      name: 'prepared_orders_count',
      nameArabic: 'طلبات تم تجهيزها بالمستودع',
      value: preparedOrders.length,
      formattedValue: `${preparedOrders.length} طلب مجهز`,
      source: 'orders_table',
      formula: 'COUNT(orders WHERE status = "prepared")',
      recordsCount: preparedOrders.length,
      timestamp: now,
      status: 'verified',
    },
    cancelledOrdersCount: {
      name: 'cancelled_orders_count',
      nameArabic: 'طلبات ملغية',
      value: cancelledOrders.length,
      formattedValue: `${cancelledOrders.length} طلب ملغي`,
      source: 'orders_table',
      formula: 'COUNT(orders WHERE status = "cancelled")',
      recordsCount: cancelledOrders.length,
      timestamp: now,
      status: 'verified',
    },
    deliveredRevenueDh: {
      name: 'delivered_revenue_dh',
      nameArabic: 'إجمالي قيمة المبيعات المؤكدة (الطلبات المسلمة)',
      value: deliveredTotal,
      formattedValue: `${deliveredTotal} درهم`,
      source: 'orders_table',
      formula: 'SUM(total WHERE status = "delivered" AND is_deleted = false)',
      recordsCount: qualifyingCount,
      currency: 'DH',
      timestamp: now,
      status: qualifyingCount > 0 ? 'verified' : 'insufficient_data',
      limitations: ['يمثل الإيراد الإجمالي المدفوع شاملاً التوصيل، ولا يمثل صافي الربح.'],
    },
    subtotalRevenueDh: {
      name: 'subtotal_revenue_dh',
      nameArabic: 'قيمة مبيعات المنتجات الخالصة (دون رسوم التوصيل)',
      value: deliveredSubtotal,
      formattedValue: `${deliveredSubtotal} درهم`,
      source: 'orders_table',
      formula: 'SUM(subtotal WHERE status = "delivered")',
      recordsCount: qualifyingCount,
      currency: 'DH',
      timestamp: now,
      status: 'verified',
    },
    deliveryFeesRevenueDh: {
      name: 'delivery_fees_revenue_dh',
      nameArabic: 'رسوم التوصيل المحصلة من الزبائن',
      value: deliveredDeliveryFees,
      formattedValue: `${deliveredDeliveryFees} درهم`,
      source: 'orders_table',
      formula: 'SUM(delivery_fee WHERE status = "delivered")',
      recordsCount: qualifyingCount,
      currency: 'DH',
      timestamp: now,
      status: 'verified',
    },
    pendingPotentialRevenueDh: {
      name: 'pending_potential_revenue_dh',
      nameArabic: 'الإيرادات المحتملة للطلبات قيد الإنجاز',
      value: pendingPotential,
      formattedValue: `${pendingPotential} درهم`,
      source: 'orders_table',
      formula: 'SUM(total WHERE status IN ("pending", "prepared"))',
      recordsCount: pendingOrders.length + preparedOrders.length,
      currency: 'DH',
      timestamp: now,
      status: 'verified',
    },
    averageOrderValueDh: {
      name: 'average_order_value_dh',
      nameArabic: 'متوسط قيمة الطلب المؤهل (AOV)',
      value: aov,
      formattedValue: `${aov} درهم/طلب`,
      source: 'derived_calculation',
      formula: 'delivered_revenue / qualifying_orders_count (المقام = الطلبات المسلمة فقط)',
      recordsCount: qualifyingCount,
      currency: 'DH',
      timestamp: now,
      status: qualifyingCount > 0 ? 'verified' : 'insufficient_data',
    },
    zoneDistribution,
    isRealData: totalCount > 0,
    computedAt: now,
    limitations,
  };
}

/**
 * 2️⃣ المقارنة الصارمة بين فترتين زمنيتين (Period-over-Period)
 * - تعالج المقام الصفري
 * - تحسب الفروق المطلقة والنسب المئوية
 * - توضح أي اختلاف في أطوال الفترات
 */
export function calculatePeriodComparison(
  currentOrders: any[],
  previousOrders: any[],
  currentPeriodLabel: string,
  previousPeriodLabel: string,
  options?: {
    isEqualDuration?: boolean;
    durationNotice?: string;
  }
): PeriodComparisonResult {
  const currentMetrics = calculateSalesMetrics(currentOrders, currentPeriodLabel);
  const previousMetrics = calculateSalesMetrics(previousOrders, previousPeriodLabel);

  const curRev = currentMetrics.deliveredRevenueDh.value;
  const prevRev = previousMetrics.deliveredRevenueDh.value;
  const absRevDiff = roundToTwoDecimals(curRev - prevRev);
  const revPct = computePercentageChange(curRev, prevRev);

  const curOrd = currentMetrics.qualifyingOrdersCount.value;
  const prevOrd = previousMetrics.qualifyingOrdersCount.value;
  const absOrdDiff = curOrd - prevOrd;
  const ordPct = computePercentageChange(curOrd, prevOrd);

  const curAov = currentMetrics.averageOrderValueDh.value;
  const prevAov = previousMetrics.averageOrderValueDh.value;
  const absAovDiff = roundToTwoDecimals(curAov - prevAov);
  const aovPct = computePercentageChange(curAov, prevAov);

  // إعداد ملخص نصي دقيق لكل مؤشر
  const revSummary = revPct.isZeroDenominator
    ? `الفترة السابقة كانت 0 DH، وارتفع الإيراد إلى ${curRev} DH (نمو جديد لا يقبل القسمة على صفر).`
    : `${absRevDiff >= 0 ? '+' : ''}${absRevDiff} DH (${revPct.formatted})`;

  const ordSummary = ordPct.isZeroDenominator
    ? `الفترة السابقة لم تسجل طلبات مسلّمة، وسجلت الفترة الحالية ${curOrd} طلب.`
    : `${absOrdDiff >= 0 ? '+' : ''}${absOrdDiff} طلب (${ordPct.formatted})`;

  const aovSummary = aovPct.isZeroDenominator
    ? `متوسط السلة الحالي ${curAov} DH مقابل 0 في الفترة السابقة.`
    : `${absAovDiff >= 0 ? '+' : ''}${absAovDiff} DH (${aovPct.formatted})`;

  let overallVerdict = 'استقرار نسبي في النشاط بين الفترتين';
  if (absRevDiff > 0 && absOrdDiff >= 0) {
    overallVerdict = `ارتفاع ملحوظ في المبيعات بنسبة ${revPct.formatted} وزيادة ${absOrdDiff} طلب مسلّم`;
  } else if (absRevDiff < 0) {
    overallVerdict = `تراجع في الإيرادات المسلمة بنسبة ${revPct.formatted} (انخفاض ${Math.abs(absRevDiff)} DH)`;
  }

  const limitations = [
    'المقارنة تقارن الطلبات بحالة "تم التوصيل" (delivered) فقط لضمان دقة الإيراد النقدي الفعلي.',
    'تم احتساب الفارق النسبي بالصيغة: ((الحالية − السابقة) / السابقة) × 100.',
    options?.durationNotice || 'تمت مقارنة الفترتين بالاعتماد على التواريخ المسجلة في حقل created_at.',
  ];

  return {
    currentPeriodLabel,
    previousPeriodLabel,
    comparisonBasis: 'Delivered Orders Revenue & Volume',
    isEqualDuration: options?.isEqualDuration !== false,
    durationNotice: options?.durationNotice,
    revenueComparison: {
      metricName: 'delivered_revenue',
      metricArabic: 'إيرادات المبيعات المؤكدة',
      currentValue: curRev,
      previousValue: prevRev,
      absoluteDifference: absRevDiff,
      percentageChange: revPct.percentage,
      isZeroDenominator: revPct.isZeroDenominator,
      changeDirection: revPct.direction,
      summaryArabic: revSummary,
    },
    ordersComparison: {
      metricName: 'qualifying_orders_count',
      metricArabic: 'عدد الطلبات المسلمة',
      currentValue: curOrd,
      previousValue: prevOrd,
      absoluteDifference: absOrdDiff,
      percentageChange: ordPct.percentage,
      isZeroDenominator: ordPct.isZeroDenominator,
      changeDirection: ordPct.direction,
      summaryArabic: ordSummary,
    },
    aovComparison: {
      metricName: 'average_order_value',
      metricArabic: 'متوسط قيمة الطلب (AOV)',
      currentValue: curAov,
      previousValue: prevAov,
      absoluteDifference: absAovDiff,
      percentageChange: aovPct.percentage,
      isZeroDenominator: aovPct.isZeroDenominator,
      changeDirection: aovPct.direction,
      summaryArabic: aovSummary,
    },
    overallVerdict,
    provenance: {
      currentOrdersCount: currentMetrics.totalOrdersCount.value,
      previousOrdersCount: previousMetrics.totalOrdersCount.value,
      currentQualifyingCount: curOrd,
      previousQualifyingCount: prevOrd,
      formulaUsed: 'Absolute: (Current - Previous) | Relative: ((Current - Previous) / Previous) * 100',
      computedAt: new Date().toISOString(),
    },
    limitations,
  };
}

/**
 * 3️⃣ أداء المنتجات المتقدم:
 * - الأكثر مبيعاً بالكمية
 * - الأعلى مساهمة في الإيراد (Quantity * Unit Price)
 * - المنتجات المتراجعة بين فترتين
 * - المنتجات بدون مبيعات في الكتالوج
 */
export function calculateProductPerformance(
  orders: any[],
  catalogProducts: any[] = [],
  previousOrders: any[] = [],
  periodLabel: string = 'الفترة المحددة'
): ProductPerformanceResult {
  const itemAggregation: Record<
    string,
    {
      name: string;
      category?: string;
      quantity: number;
      revenue: number;
      unit: string;
      ordersCount: number;
    }
  > = {};

  const validOrders = (orders || []).filter((o) => !o.is_deleted && o.status !== 'cancelled');

  for (const order of validOrders) {
    if (Array.isArray(order.items)) {
      for (const it of order.items) {
        const name = (it.name || 'منتج غير مسمى').trim();
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        const lineTotal = Number(it.line_total) || roundToTwoDecimals(qty * price);
        const unit = it.unit_label || 'كجم';
        const category = it.category;

        if (!itemAggregation[name]) {
          itemAggregation[name] = {
            name,
            category,
            quantity: 0,
            revenue: 0,
            unit,
            ordersCount: 0,
          };
        }

        itemAggregation[name].quantity += qty;
        itemAggregation[name].revenue += lineTotal;
        itemAggregation[name].ordersCount += 1;
      }
    }
  }

  // خريطة مخزون الكتالوج للربط مع المنتجات
  const stockMap: Record<string, { stock: number; isAvailable: boolean }> = {};
  catalogProducts.forEach((p) => {
    stockMap[p.name.trim()] = {
      stock: Number(p.stock) || 0,
      isAvailable: Boolean(p.is_available && p.active !== false && Number(p.stock) > 0),
    };
  });

  // تحويل التجميع إلى عناصر مفصلة مع ربط المخزون
  const allSoldItems: RankedProductItem[] = Object.values(itemAggregation).map((item) => {
    const stockInfo = stockMap[item.name];
    let stockStatus: RankedProductItem['stockStatus'] = 'unknown';

    if (stockInfo) {
      if (stockInfo.stock <= 0 || !stockInfo.isAvailable) stockStatus = 'out_of_stock';
      else if (stockInfo.stock <= 5) stockStatus = 'low_stock';
      else stockStatus = 'healthy';
    }

    return {
      name: item.name,
      category: item.category,
      quantitySold: roundToTwoDecimals(item.quantity),
      unit: item.unit,
      revenueContributedDh: roundToTwoDecimals(item.revenue),
      ordersCount: item.ordersCount,
      currentStock: stockInfo ? stockInfo.stock : undefined,
      stockStatus,
    };
  });

  // الترتيب حسب الكمية المباعة
  const topByQuantity = [...allSoldItems].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 8);

  // الترتيب حسب الإيراد المساهم به
  const topByRevenue = [...allSoldItems].sort((a, b) => b.revenueContributedDh - a.revenueContributedDh).slice(0, 8);

  // رصد المنتجات المتراجعة إذا وُجدت طلبات سابقة
  const decliningProducts: ProductPerformanceResult['decliningProducts'] = [];
  if (previousOrders.length > 0) {
    const prevItemQty: Record<string, number> = {};
    const validPrev = previousOrders.filter((o) => !o.is_deleted && o.status !== 'cancelled');
    for (const order of validPrev) {
      if (Array.isArray(order.items)) {
        for (const it of order.items) {
          const name = (it.name || '').trim();
          const qty = Number(it.quantity) || 0;
          prevItemQty[name] = (prevItemQty[name] || 0) + qty;
        }
      }
    }

    for (const [name, prevQty] of Object.entries(prevItemQty)) {
      const curQty = itemAggregation[name]?.quantity || 0;
      if (curQty < prevQty && prevQty > 0) {
        const declineAbs = roundToTwoDecimals(prevQty - curQty);
        const declinePct = roundToTwoDecimals((declineAbs / prevQty) * 100);
        decliningProducts.push({
          name,
          previousQuantity: roundToTwoDecimals(prevQty),
          currentQuantity: roundToTwoDecimals(curQty),
          declineAbsolute: declineAbs,
          declinePercentage: declinePct,
        });
      }
    }
    decliningProducts.sort((a, b) => b.declineAbsolute - a.declineAbsolute);
  }

  // المنتجات التي لم تسجل مبيعات في الفترة
  const soldNamesSet = new Set(Object.keys(itemAggregation));
  const zeroSalesProducts = catalogProducts
    .filter((p) => !soldNamesSet.has(p.name.trim()))
    .map((p) => p.name);

  const totalCatalog = catalogProducts.length;
  const coveragePct =
    totalCatalog > 0 ? roundToTwoDecimals((allSoldItems.length / totalCatalog) * 100) : 0;

  const limitations = [
    'تم تجميع الأصناف من مصفوفة items المسجلة في الطلبات المؤهلة غير الملغاة.',
    'عدم تسجيل مبيعات لمنتج ما لا يعني بالضرورة ضعف الإقبال، بل قد يعود لنفاد مخزونه أو عدم إدراجه في العروض.',
    'قاعدة البيانات لا تتضمن تكلفة الشراء، وبالتالي فإن "الأعلى مساهمة في الإيراد" لا يعني بالضرورة "الأعلى ربحاً".',
  ];

  return {
    periodLabel,
    totalProductsWithSales: allSoldItems.length,
    totalCatalogProductsCount: totalCatalog,
    catalogCoveragePercentage: coveragePct,
    topByQuantity,
    topByRevenue,
    decliningProducts: decliningProducts.slice(0, 5),
    zeroSalesProductsSample: zeroSalesProducts.slice(0, 10),
    zeroSalesCount: zeroSalesProducts.length,
    provenance: {
      ordersAnalyzedCount: validOrders.length,
      catalogProductsCount: totalCatalog,
      computedAt: new Date().toISOString(),
    },
    limitations,
  };
}

/**
 * 4️⃣ مؤشرات المخزون وحركاته الموثقة
 */
export function calculateInventoryAnalytics(
  products: any[],
  ledgerMovements: any[] = []
): InventoryAnalyticsResult {
  const cleanProducts = products || [];
  const total = cleanProducts.length;

  let healthy = 0;
  let lowStock = 0;
  let outOfStock = 0;

  const reorderList: InventoryAnalyticsResult['reorderRequiredItems'] = [];

  for (const p of cleanProducts) {
    const stock = Number(p.stock) || 0;
    const isAvail = Boolean(p.is_available && p.active !== false && stock > 0);

    if (stock <= 0 || !isAvail) {
      outOfStock++;
      reorderList.push({
        id: p.id,
        name: p.name,
        stock,
        unit: p.unit_label || 'كجم',
        urgency: 'critical_out_of_stock',
        action: `شراء وتوريد فوري فجر الغد من سوق بنسودة (${p.name} - نافد)`,
      });
    } else if (stock <= 5) {
      lowStock++;
      reorderList.push({
        id: p.id,
        name: p.name,
        stock,
        unit: p.unit_label || 'كجم',
        urgency: 'urgent_low_stock',
        action: `إعادة التزويد لتفادي العجز (${p.name} - متبقي ${stock} ${p.unit_label || 'كجم'})`,
      });
    } else {
      healthy++;
    }
  }

  const healthPct = total > 0 ? Math.round(((total - outOfStock) / total) * 100) : 100;

  let movementsSummary: InventoryAnalyticsResult['recentMovementsSummary'] | undefined;
  if (ledgerMovements && ledgerMovements.length > 0) {
    const deductions = ledgerMovements.filter((m) => m.movement_type === 'order_deduct').length;
    const restores = ledgerMovements.filter((m) => m.movement_type === 'order_restore').length;
    const stockIns = ledgerMovements.filter((m) => m.movement_type === 'morning_stockin').length;

    movementsSummary = {
      totalMovements: ledgerMovements.length,
      totalDeductionsCount: deductions,
      totalRestoresCount: restores,
      totalStockInsCount: stockIns,
    };
  }

  const limitations = [
    'حد المخزون المنخفض معتمد بدقة على: المخزون <= 5 كجم/وحدة.',
    'جميع مؤشرات المخزون مستخرجة في وضع القراءة فقط الصارم (Read-Only).',
    'لا يمكن التنبؤ بموعد دقيق لنفاد المخزون دون وجود سلاسل زمنية كافية لمعدل الاستهلاك اليومي.',
  ];

  return {
    totalProducts: total,
    healthyCount: healthy,
    lowStockCount: lowStock,
    outOfStockCount: outOfStock,
    inventoryHealthPercentage: healthPct,
    reorderRequiredItems: reorderList,
    recentMovementsSummary: movementsSummary,
    limitations,
    computedAt: new Date().toISOString(),
  };
}
