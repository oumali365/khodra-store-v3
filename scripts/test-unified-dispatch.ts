// ============================================================
// scripts/test-unified-dispatch.ts
// اختبارات تكامل مركز الإسناد الموحد وأسطول التوصيل لمتجر خُضرة فاس
// ============================================================

import { calculateZoneCOD, generateGoogleMapsMultiStopUrl, buildDriverWhatsAppMessage, getSortedDriversForZone } from '../src/features/delivery-fleet/utils';
import { FEZ_DELIVERY_ZONES } from '../src/data/deliveryZones';
import { INITIAL_STORE_DRIVERS } from '../src/services/supabaseService';
import type { DbOrder } from '../src/features/delivery-fleet/types';

function runUnifiedDispatchTests() {
  console.log('======================================================================');
  console.log('🚚 بدء اختبارات تكامل مركز الإسناد الموحد وأسطول التوصيل لمتجر خُضرة فاس');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1️⃣ اختبار حساب مجموع التحصيل النقدي (COD) والطلبات
  console.log('▶ [اختبار 1] حساب مبالغ التحصيل النقدي (COD):');
  const mockOrders: DbOrder[] = [
    {
      id: 1,
      order_code: '#ORD-201',
      customer_name: 'ياسين بناني',
      phone: '0661234567',
      address: 'حي الأطلس، فاس',
      items: [{ name: 'طماطم طازجة', qty: 2, lineTotal: 20, icon: '🍅' }],
      subtotal: 20,
      delivery_fee: 15,
      total: 35,
      status: 'prepared',
      created_at: new Date().toISOString(),
      delivery_zone: 'north',
      is_paid: false,
    },
    {
      id: 2,
      order_code: '#ORD-202',
      customer_name: 'كريمة الوسي',
      phone: '0669876543',
      address: 'حي النرجس، فاس',
      items: [{ name: 'بطاطس', qty: 3, lineTotal: 30, icon: '🥔' }],
      subtotal: 30,
      delivery_fee: 15,
      total: 45,
      status: 'prepared',
      created_at: new Date().toISOString(),
      delivery_zone: 'north',
      is_paid: false,
    },
  ];

  const codCalc = calculateZoneCOD(mockOrders);
  if (codCalc.totalCOD === 80 && codCalc.ordersCount === 2) {
    console.log(`   ✓ تم حساب إجمالي COD بنجاح: ${codCalc.totalCOD} د.م لـ ${codCalc.ordersCount} طلبات.`);
    passed++;
  } else {
    console.error(`   ❌ فشل في حساب COD الصحيح. النتيجة: ${codCalc.totalCOD}`);
    failed++;
  }

  // 2️⃣ اختبار توليد رابط خرائط Google المتتابع
  console.log('\n▶ [اختبار 2] توليد رابط خرائط Google المتتابع (Multi-stop):');
  const mapsUrl = generateGoogleMapsMultiStopUrl(mockOrders);
  if (mapsUrl.includes('google.com/maps/dir/?api=1') && mapsUrl.includes('waypoints=')) {
    console.log(`   ✓ تم توليد رابط خرائط Google المتتابع بنجاح.`);
    passed++;
  } else {
    console.error(`   ❌ فشل في توليد رابط الخرائط.`);
    failed++;
  }

  // 3️⃣ اختبار صياغة رسالة واتساب الرسمية للسائق
  console.log('\n▶ [اختبار 3] صياغة رسالة WhatsApp الرسمية للسائق:');
  const driver = INITIAL_STORE_DRIVERS[0];
  const whatsappMsg = buildDriverWhatsAppMessage('north', mockOrders, driver, FEZ_DELIVERY_ZONES.north);
  if (whatsappMsg.includes(driver.name) && whatsappMsg.includes('#ORD-201') && whatsappMsg.includes('80.00 د.م')) {
    console.log(`   ✓ تم صياغة رسالة واتساب متكاملة وتحتوي على بيانات السائق والمبالغ بنجاح.`);
    passed++;
  } else {
    console.error(`   ❌ فشل في صياغة رسالة واتساب.`);
    failed++;
  }

  // 4️⃣ اختبار فرز السائقين حسب تفضيل المنطقة والحالة
  console.log('\n▶ [اختبار 4] فرز السائقين الذكي حسب المنطقة المفضلة:');
  const sortedDrivers = getSortedDriversForZone('north', INITIAL_STORE_DRIVERS);
  if (sortedDrivers.length > 0 && sortedDrivers[0].isPreferred) {
    console.log(`   ✓ تم إعطاء الأولوية للسائق المفضل للمنطقة الشمالية بنجاح (${sortedDrivers[0].driver.name}).`);
    passed++;
  } else {
    console.error(`   ❌ فشل في فرز السائقين.`);
    failed++;
  }

  console.log('======================================================================');
  console.log(`📊 نتيجة اختبارات مركز الإسناد الموحد: نجح ${passed} من أصل ${passed + failed}`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runUnifiedDispatchTests();
