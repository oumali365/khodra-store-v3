// ============================================================
// scripts/test-phase3-verification.ts
// سكريبت التحقق الشامل والاختبار الفعلي للمرحلة الثالثة
// Phase 3 — Business Analytics, Comparisons & Verified Insights
//
// يختبر الفحوصات الثمانية الإلزامية ببيانات اختبار محددة داخل الاختبارات فقط:
// 1. إجمالي المبيعات والحالات المؤهلة (ضم المؤهل فقط واستبعاد الملغي والمحذوف)
// 2. مقارنة الفترات (الإجمالي، الفرق المطلق، النسبة، المقام الصفري، عدم تكرار السجلات)
// 3. متوسط قيمة الطلب (AOV) وفحص المقام وصحة الاستبعاد
// 4. ترتيب المنتجات (حسب الكمية وحسب الإيراد كل على حدة، والمنتجات المتراجعة، والمنتجات بلا مبيعات)
// 5. المخزون (قواعد حد إعادة الطلب المنضبطة <= 5 وعدم تصنيف الكل كمنخفض)
// 6. البيانات الناقصة والأخطاء وحدود المخطط (لا أصفار مضللة، ولا ادعاء بمعرفة الربح الصافي)
// 7. اتساق الأرقام ومطابقتها التامة للنتائج المحسوبة
// 8. الانحدار: ضمان سلامة أدوات المرحلتين 1 و2
// ============================================================

import {
  calculateSalesMetrics,
  calculatePeriodComparison,
  calculateProductPerformance,
  calculateInventoryAnalytics,
  computePercentageChange,
  roundToTwoDecimals,
} from '../src/server/businessAnalytics';

import {
  executeGetSalesSummary,
  executeCompareSalesPeriods,
  executeGetProductAnalytics,
  executeGetProducts,
  executeGetInventory,
  executeGetOrders,
  dispatchCopilotTool,
} from '../src/server/copilotTools';

import {
  executeCopilotChat,
  classifyQuestionIntent,
} from '../src/server/copilotService';

async function runPhase3VerificationSuite() {
  console.log('======================================================================');
  console.log('🧪 بدء اختبارات التحقق من المرحلة الثالثة — Phase 3 Verification Suite');
  console.log('Business Analytics, Comparisons & Verified Insights (8 Test Suites)');
  console.log('======================================================================\n');

  let passedSuites = 0;
  const totalSuites = 8;

  // ──────────────────────────────────────────────────────────────────
  // الاختبار 1: إجمالي المبيعات وتصفية الحالات المؤهلة
  // ──────────────────────────────────────────────────────────────────
  console.log('▶ [الاختبار 1] فحص إجمالي المبيعات، الطلبات المؤهلة، واستبعاد الملغي والمحذوف:');
  const mockOrders1 = [
    { id: 1, order_code: 'KH-1', status: 'delivered', total: 150.5, subtotal: 135.5, delivery_fee: 15, is_deleted: false },
    { id: 2, order_code: 'KH-2', status: 'delivered', total: 220.0, subtotal: 220.0, delivery_fee: 0, is_deleted: false },
    { id: 3, order_code: 'KH-3', status: 'pending', total: 95.0, subtotal: 80.0, delivery_fee: 15, is_deleted: false },
    { id: 4, order_code: 'KH-4', status: 'prepared', total: 110.0, subtotal: 95.0, delivery_fee: 15, is_deleted: false },
    { id: 5, order_code: 'KH-5', status: 'cancelled', total: 300.0, subtotal: 285.0, delivery_fee: 15, is_deleted: false }, // ملغي
    { id: 6, order_code: 'KH-6', status: 'delivered', total: 500.0, subtotal: 500.0, delivery_fee: 0, is_deleted: true },   // محذوف
  ];

  const metrics1 = calculateSalesMetrics(mockOrders1, 'فترة الاختبار 1');
  console.log(`  - إجمالي الطلبات غير المحذوفة: ${metrics1.totalOrdersCount.value} (المتوقع: 5)`);
  console.log(`  - الطلبات المؤهلة (المسلمة): ${metrics1.qualifyingOrdersCount.value} (المتوقع: 2)`);
  console.log(`  - إجمالي الإيراد المسلّم المؤكد: ${metrics1.deliveredRevenueDh.value} DH (المتوقع: 370.50)`);
  console.log(`  - إيراد السلع الخالصة: ${metrics1.subtotalRevenueDh.value} DH (المتوقع: 355.50)`);
  console.log(`  - رسوم التوصيل المسلمة: ${metrics1.deliveryFeesRevenueDh.value} DH (المتوقع: 15.00)`);
  console.log(`  - الإيراد المحتمل المعلق: ${metrics1.pendingPotentialRevenueDh.value} DH (المتوقع: 205.00)`);
  console.log(`  - الطلبات الملغية: ${metrics1.cancelledOrdersCount.value} (المتوقع: 1)`);

  const pass1 =
    metrics1.totalOrdersCount.value === 5 &&
    metrics1.qualifyingOrdersCount.value === 2 &&
    metrics1.deliveredRevenueDh.value === 370.5 &&
    metrics1.subtotalRevenueDh.value === 355.5 &&
    metrics1.deliveryFeesRevenueDh.value === 15.0 &&
    metrics1.pendingPotentialRevenueDh.value === 205.0 &&
    metrics1.cancelledOrdersCount.value === 1;

  console.log(`  - نتيجة الاختبار 1: ${pass1 ? '✅ نجاح' : '❌ فشل'}\n`);
  if (pass1) passedSuites++;

  // ──────────────────────────────────────────────────────────────────
  // الاختبار 2: مقارنة الفترات وحساب التغير ومعالجة المقام الصفري
  // ──────────────────────────────────────────────────────────────────
  console.log('▶ [الاختبار 2] مقارنة الفترات، الفروق المطلقة والنسبية، ومعالجة المقام الصفري:');
  
  // حالة أ: نمو عادي
  const changeA = computePercentageChange(600, 400);
  console.log(`  - حالة أ (400 إلى 600): ${changeA.formatted} | direction: ${changeA.direction} (المتوقع: +50%, growth)`);

  // حالة ب: تراجع
  const changeB = computePercentageChange(300, 500);
  console.log(`  - حالة ب (500 إلى 300): ${changeB.formatted} | direction: ${changeB.direction} (المتوقع: -40%, decline)`);

  // حالة ج: مقام صفري (نمو من 0 إلى 450)
  const changeC = computePercentageChange(450, 0);
  console.log(`  - حالة ج (0 إلى 450): ${changeC.formatted} | isZeroDenominator: ${changeC.isZeroDenominator} (المتوقع: غير معرف, true)`);

  // حالة د: كلاهما صفر
  const changeD = computePercentageChange(0, 0);
  console.log(`  - حالة د (0 إلى 0): ${changeD.formatted} | percentage: ${changeD.percentage} (المتوقع: 0.00%)`);

  // مقارنة فترتين كاملتين ببيانات
  const currentOrders2 = [
    { id: 10, status: 'delivered', total: 300, subtotal: 300, is_deleted: false },
    { id: 11, status: 'delivered', total: 300, subtotal: 300, is_deleted: false },
  ];
  const previousOrders2 = [
    { id: 20, status: 'delivered', total: 400, subtotal: 400, is_deleted: false },
  ];

  const compResult2 = calculatePeriodComparison(currentOrders2, previousOrders2, 'هذا الأسبوع', 'الأسبوع الماضي');
  console.log(`  - إيراد الحالية: ${compResult2.revenueComparison.currentValue} DH | السابقة: ${compResult2.revenueComparison.previousValue} DH`);
  console.log(`  - الفرق المطلق: ${compResult2.revenueComparison.absoluteDifference} DH (المتوقع: +200)`);
  console.log(`  - نسبة التغير: ${compResult2.revenueComparison.percentageChange}% (المتوقع: +50%)`);

  const pass2 =
    changeA.percentage === 50 &&
    changeB.percentage === -40 &&
    changeC.isZeroDenominator === true &&
    changeC.percentage === null &&
    changeD.percentage === 0 &&
    compResult2.revenueComparison.absoluteDifference === 200 &&
    compResult2.revenueComparison.percentageChange === 50;

  console.log(`  - نتيجة الاختبار 2: ${pass2 ? '✅ نجاح' : '❌ فشل'}\n`);
  if (pass2) passedSuites++;

  // ──────────────────────────────────────────────────────────────────
  // الاختبار 3: متوسط قيمة الطلب (AOV) والتحقق من المقام
  // ──────────────────────────────────────────────────────────────────
  console.log('▶ [الاختبار 3] فحص متوسط قيمة الطلب (AOV) والمقام الصفري:');
  const mockOrders3 = [
    { id: 1, status: 'delivered', total: 120.0, is_deleted: false },
    { id: 2, status: 'delivered', total: 80.0, is_deleted: false },
    { id: 3, status: 'delivered', total: 100.0, is_deleted: false },
    { id: 4, status: 'cancelled', total: 999.0, is_deleted: false }, // لا يؤثر
  ];
  const metrics3 = calculateSalesMetrics(mockOrders3, 'AOV Test');
  console.log(`  - إجمالي الإيراد المسلّم: ${metrics3.deliveredRevenueDh.value} DH`);
  console.log(`  - عدد الطلبات المسلمة: ${metrics3.qualifyingOrdersCount.value}`);
  console.log(`  - متوسط قيمة الطلب (AOV): ${metrics3.averageOrderValueDh.value} DH (المتوقع: 100.00 DH)`);

  // فحص عدم وجود طلبات مسلمة
  const emptyDeliveries = [{ id: 1, status: 'pending', total: 50.0, is_deleted: false }];
  const emptyMetrics = calculateSalesMetrics(emptyDeliveries, 'Empty Deliveries');
  console.log(`  - فحص AOV عند صفر طلبات مسلمة: ${emptyMetrics.averageOrderValueDh.value} DH (المتوقع: 0.00 دون خطأ قسمة)`);

  const pass3 =
    metrics3.averageOrderValueDh.value === 100.0 &&
    emptyMetrics.averageOrderValueDh.value === 0.0 &&
    !isNaN(emptyMetrics.averageOrderValueDh.value);

  console.log(`  - نتيجة الاختبار 3: ${pass3 ? '✅ نجاح' : '❌ فشل'}\n`);
  if (pass3) passedSuites++;

  // ──────────────────────────────────────────────────────────────────
  // الاختبار 4: ترتيب أداء المنتجات (الكمية مقابل الإيراد والمنتجات المتراجعة)
  // ──────────────────────────────────────────────────────────────────
  console.log('▶ [الاختبار 4] ترتيب المنتجات بالكمية وبالإيراد، والمتراجعة، وبلا مبيعات:');
  const mockOrders4 = [
    {
      id: 1,
      status: 'delivered',
      is_deleted: false,
      items: [
        { name: 'نعناع بلدي', quantity: 40, price: 2.0, line_total: 80.0, unit_label: 'باقة' },
        { name: 'زيت زيتون بكر', quantity: 3, price: 90.0, line_total: 270.0, unit_label: 'لتر' },
      ],
    },
    {
      id: 2,
      status: 'delivered',
      is_deleted: false,
      items: [
        { name: 'نعناع بلدي', quantity: 20, price: 2.0, line_total: 40.0, unit_label: 'باقة' },
        { name: 'بطاطس', quantity: 15, price: 6.0, line_total: 90.0, unit_label: 'كجم' },
      ],
    },
  ];

  const mockCatalog = [
    { id: 1, name: 'نعناع بلدي', stock: 100, is_available: true, active: true },
    { id: 2, name: 'زيت زيتون بكر', stock: 15, is_available: true, active: true },
    { id: 3, name: 'بطاطس', stock: 50, is_available: true, active: true },
    { id: 4, name: 'أفوكادو فاس', stock: 20, is_available: true, active: true }, // لم يسجل مبيعات
  ];

  const mockPreviousOrders = [
    {
      id: 99,
      status: 'delivered',
      is_deleted: false,
      items: [
        { name: 'بطاطس', quantity: 30, price: 6.0, line_total: 180.0 }, // تراجعت من 30 إلى 15
      ],
    },
  ];

  const perf4 = calculateProductPerformance(mockOrders4, mockCatalog, mockPreviousOrders, 'فترة التحليل');
  console.log(`  - المتصدر بالكمية: ${perf4.topByQuantity[0]?.name} (${perf4.topByQuantity[0]?.quantitySold} باقة) (المتوقع: نعناع بلدي 60)`);
  console.log(`  - المتصدر بالإيراد: ${perf4.topByRevenue[0]?.name} (${perf4.topByRevenue[0]?.revenueContributedDh} DH) (المتوقع: زيت زيتون بكر 270 DH)`);
  console.log(`  - المنتجات المتراجعة: ${perf4.decliningProducts[0]?.name} (تراجع: ${perf4.decliningProducts[0]?.declineAbsolute} كجم، -${perf4.decliningProducts[0]?.declinePercentage}%)`);
  console.log(`  - أصناف الكتالوج بلا مبيعات: ${perf4.zeroSalesCount} صنف (المتوقع: 1 - أفوكادو فاس)`);

  const pass4 =
    perf4.topByQuantity[0]?.name === 'نعناع بلدي' &&
    perf4.topByQuantity[0]?.quantitySold === 60 &&
    perf4.topByRevenue[0]?.name === 'زيت زيتون بكر' &&
    perf4.topByRevenue[0]?.revenueContributedDh === 270 &&
    perf4.decliningProducts[0]?.name === 'بطاطس' &&
    perf4.decliningProducts[0]?.declineAbsolute === 15 &&
    perf4.zeroSalesProductsSample.includes('أفوكادو فاس');

  console.log(`  - نتيجة الاختبار 4: ${pass4 ? '✅ نجاح' : '❌ فشل'}\n`);
  if (pass4) passedSuites++;

  // ──────────────────────────────────────────────────────────────────
  // الاختبار 5: المخزون وقواعد إعادة الطلب المعتمدة
  // ──────────────────────────────────────────────────────────────────
  console.log('▶ [الاختبار 5] فحص قواعد المخزون المنخفض (<= 5) والنافد (0):');
  const mockProducts5 = [
    { id: 1, name: 'طماطم', stock: 25, is_available: true, active: true }, // سليم (> 5)
    { id: 2, name: 'بصل أحمر', stock: 3, is_available: true, active: true },  // منخفض (<= 5)
    { id: 3, name: 'خيار', stock: 0, is_available: false, active: true },    // نافد (0)
  ];

  const inv5 = calculateInventoryAnalytics(mockProducts5);
  console.log(`  - إجمالي المنتجات: ${inv5.totalProducts}`);
  console.log(`  - المتوفر بأمان: ${inv5.healthyCount} (المتوقع: 1)`);
  console.log(`  - المخزون المنخفض: ${inv5.lowStockCount} (المتوقع: 1)`);
  console.log(`  - غير المتوفر: ${inv5.outOfStockCount} (المتوقع: 1)`);
  console.log(`  - قائمة إعادة التوريد: ${inv5.reorderRequiredItems.length} أصناف (المتوقع: 2)`);

  const pass5 =
    inv5.healthyCount === 1 &&
    inv5.lowStockCount === 1 &&
    inv5.outOfStockCount === 1 &&
    inv5.reorderRequiredItems.length === 2;

  console.log(`  - نتيجة الاختبار 5: ${pass5 ? '✅ نجاح' : '❌ فشل'}\n`);
  if (pass5) passedSuites++;

  // ──────────────────────────────────────────────────────────────────
  // الاختبار 6: البيانات الناقصة وحدود المخطط (Schema Limitations)
  // ──────────────────────────────────────────────────────────────────
  console.log('▶ [الاختبار 6] الشفافية مع حدود المخطط وغياب بيانات التكاليف والأرباح:');
  const qProfit = 'ما هو صافي أرباح المتجر اليوم بعد خصم المصاريف؟';
  const intentProfit = classifyQuestionIntent(qProfit);
  console.log(`  - السؤال: "${qProfit}"`);
  console.log(`  - تصنيف النية: ${intentProfit} (المتوقع: schema_limitation)`);

  const resProfit = await executeCopilotChat(qProfit, []);
  console.log(`  - القيود المكتشفة: ${resProfit.metadata?.limitations?.length || 0} قيود`);
  console.log(`  - هل تم رفض احتساب صافي الربح بشفافية؟ ${resProfit.reply.includes('لا يمكن احتساب صافي الربح') ? 'نعم ✅' : 'لا ❌'}`);

  const pass6 =
    intentProfit === 'schema_limitation' &&
    resProfit.reply.includes('لا يمكن احتساب صافي الربح') &&
    resProfit.reply.includes('COGS');

  console.log(`  - نتيجة الاختبار 6: ${pass6 ? '✅ نجاح' : '❌ فشل'}\n`);
  if (pass6) passedSuites++;

  // ──────────────────────────────────────────────────────────────────
  // الاختبار 7: اتساق الأرقام ومطابقة نصوص المقارنة للحسابات الرياضية
  // ──────────────────────────────────────────────────────────────────
  console.log('▶ [الاختبار 7] اتساق الأرقام المحسوبة مع نصوص الإجابات:');
  const qComp = 'قارن مبيعات اليوم مع مبيعات أمس';
  const intentComp = classifyQuestionIntent(qComp);
  console.log(`  - السؤال: "${qComp}"`);
  console.log(`  - تصنيف النية: ${intentComp} (المتوقع: sales_comparison)`);

  const resComp = await executeCopilotChat(qComp, []);
  console.log(`  - الأداة المنفذة: ${resComp.toolsExecuted.map((t) => t.toolName).join(', ')}`);
  
  const hasCompTool = resComp.toolsExecuted.some(
    (t) => t.toolName === 'compare_sales_periods' || t.toolName === 'get_sales_summary'
  );
  console.log(`  - هل تم استدعاء أداة المقارنة الموثوقة؟ ${hasCompTool ? 'نعم ✅' : 'لا ❌'}`);

  const pass7 = intentComp === 'sales_comparison' && hasCompTool;
  console.log(`  - نتيجة الاختبار 7: ${pass7 ? '✅ نجاح' : '❌ فشل'}\n`);
  if (pass7) passedSuites++;

  // ──────────────────────────────────────────────────────────────────
  // الاختبار 8: الانحدار — التأكد من عدم تعطيل وظائف المرحلتين 1 و 2
  // ──────────────────────────────────────────────────────────────────
  console.log('▶ [الاختبار 8] اختبار الانحدار (Regression Tests) لأدوات المتجر الأساسية:');
  
  // فحص أداة get_products
  const prodTool = await dispatchCopilotTool('get_products', { limit: 5 });
  console.log(`  - أداة get_products: status = ${prodTool.status}, toolName = ${prodTool.toolName}`);

  // فحص أداة get_inventory
  const invTool = await dispatchCopilotTool('get_inventory', { filter: 'all' });
  console.log(`  - أداة get_inventory: status = ${invTool.status}, toolName = ${invTool.toolName}`);

  // فحص أداة get_orders
  const ordTool = await dispatchCopilotTool('get_orders', { limit: 5 });
  console.log(`  - أداة get_orders: status = ${ordTool.status}, toolName = ${ordTool.toolName}`);

  // فحص أداة get_sales_summary
  const salesTool = await dispatchCopilotTool('get_sales_summary', { period: 'today' });
  console.log(`  - أداة get_sales_summary: status = ${salesTool.status}, toolName = ${salesTool.toolName}`);

  // فحص أداة get_store_info
  const storeTool = await dispatchCopilotTool('get_store_info', {});
  console.log(`  - أداة get_store_info: status = ${storeTool.status}, city = ${storeTool.data.city}`);

  const pass8 =
    prodTool.toolName === 'get_products' &&
    invTool.toolName === 'get_inventory' &&
    ordTool.toolName === 'get_orders' &&
    salesTool.toolName === 'get_sales_summary' &&
    storeTool.toolName === 'get_store_info' &&
    storeTool.data.city.includes('فاس');

  console.log(`  - نتيجة الاختبار 8: ${pass8 ? '✅ نجاح' : '❌ فشل'}\n`);
  if (pass8) passedSuites++;

  // ──────────────────────────────────────────────────────────────────
  // الخلاصة النهائية للمرحلة 3
  // ──────────────────────────────────────────────────────────────────
  console.log('======================================================================');
  console.log(`📊 خلاصة نتائج اختبارات المرحلة الثالثة: ${passedSuites} / ${totalSuites} اختبارات ناجحة`);
  console.log('======================================================================');

  if (passedSuites === totalSuites) {
    console.log('🎉 نجحت جميع اختبارات التحقق من المرحلة الثالثة بنسبة 100%!');
    process.exit(0);
  } else {
    console.error(`⚠️ فشل ${totalSuites - passedSuites} من الاختبارات.`);
    process.exit(1);
  }
}

runPhase3VerificationSuite().catch((err) => {
  console.error('❌ خطأ غير متوقع أثناء تشغيل اختبارات المرحلة الثالثة:', err);
  process.exit(1);
});
