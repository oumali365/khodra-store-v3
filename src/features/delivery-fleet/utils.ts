// ============================================================
// utils.ts - دوال الحسابات وصياغة الرسائل ومسارات الخرائط
// ============================================================

import type {
  FezZoneId,
  StoreDriver,
  DbOrder,
  SortedDriver,
  ZoneCODCalculation,
  FezZoneConfig,
} from './types';
import { STORE_PICKUP_HUB } from '../../data/config';

/**
 * تنظيف وتنسيق رقم الهاتف ليتناسب مع روابط واتساب المباشرة للمغرب
 */
export function cleanPhoneForWhatsApp(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('212')) return digits;
  if (digits.startsWith('0')) return '212' + digits.slice(1);
  return digits;
}

/**
 * فرز السائقين الذكي: الأولوية للمنطقة المفضلة ثم المتاحين ثم بالترتيب الأبجدي
 */
export function getSortedDriversForZone(zoneKey: FezZoneId, drivers: StoreDriver[]): SortedDriver[] {
  return [...drivers]
    .sort((a, b) => {
      // مطابقة المنطقة المفضلة
      const aMatchesZone = a.zonePreference === zoneKey ? 2 : a.zonePreference === 'all' ? 1 : 0;
      const bMatchesZone = b.zonePreference === zoneKey ? 2 : b.zonePreference === 'all' ? 1 : 0;
      if (aMatchesZone !== bMatchesZone) {
        return bMatchesZone - aMatchesZone;
      }
      // فرز المتاح أولاً
      const aAvailable = a.status === 'available' ? 1 : 0;
      const bAvailable = b.status === 'available' ? 1 : 0;
      if (aAvailable !== bAvailable) {
        return bAvailable - aAvailable;
      }
      return a.name.localeCompare(b.name, 'ar');
    })
    .map((driver) => {
      const isPreferred = driver.zonePreference === zoneKey;
      const isDisabled = driver.status === 'on_delivery' || driver.status === 'off_duty';
      const disabledReason =
        driver.status === 'on_delivery'
          ? 'في جولة حالياً'
          : driver.status === 'off_duty'
          ? 'خارج الخدمة'
          : undefined;

      return {
        driver,
        isPreferred,
        isDisabled,
        disabledReason,
      };
    });
}

/**
 * حساب مبالغ التحصيل النقدي (COD) ورسوم التوصيل والمجموع لطلبات المنطقة
 */
export function calculateZoneCOD(zoneOrders: DbOrder[]): ZoneCODCalculation {
  const activeOrders = zoneOrders.filter((o) => o.status !== 'cancelled');
  const totalCOD = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalDeliveryFees = activeOrders.reduce((sum, o) => sum + (Number(o.delivery_fee) || 0), 0);
  const totalSubtotal = activeOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);

  return {
    totalCOD,
    totalDeliveryFees,
    totalSubtotal,
    ordersCount: activeOrders.length,
    orders: activeOrders,
  };
}

/**
 * إنشاء رابط ملاحة متعدد المحطات على خرائط Google من نقطة التموين إلى جميع الزبائن
 */
export function generateGoogleMapsMultiStopUrl(zoneOrders: DbOrder[]): string {
  if (zoneOrders.length === 0) return '';
  const origin = encodeURIComponent(`${STORE_PICKUP_HUB.name}, ${STORE_PICKUP_HUB.address}`);
  const destination = encodeURIComponent(`${zoneOrders[zoneOrders.length - 1].address}, فاس`);

  if (zoneOrders.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  }

  const waypoints = zoneOrders
    .slice(0, zoneOrders.length - 1)
    .map((o) => encodeURIComponent(`${o.address}, فاس`))
    .join('|');

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
}

/**
 * بناء رسالة تفاصيل الجولة والمحطات للسائق الداخلي عبر واتساب
 */
export function buildDriverWhatsAppMessage(
  zoneKey: FezZoneId,
  orders: DbOrder[],
  driver: StoreDriver | null | undefined,
  zoneInfo: FezZoneConfig,
  hub: typeof STORE_PICKUP_HUB = STORE_PICKUP_HUB
): string {
  const { totalCOD } = calculateZoneCOD(orders);
  const mapsRoute = generateGoogleMapsMultiStopUrl(orders);
  const driverName = driver ? driver.name : 'كابتن التوصيل';

  let msg = `السلام عليكم كابتن *${driverName}* 🛵\n`;
  msg += `🌿 *جولة توصيل جديدة - متجر خُضرة*\n`;
  msg += `🧭 *المنطقة:* ${zoneInfo.name} (${zoneInfo.targetTime})\n`;
  msg += `📦 *عدد الطلبات:* ${orders.length} طلبيات مجهزة\n`;
  msg += `📍 *نقطة الانطلاق والتموين:* ${hub.name} (${hub.address})\n`;
  if (mapsRoute) {
    msg += `🗺️ *رابط المسار الكامل على خرائط Google:*\n${mapsRoute}\n`;
  }
  msg += `\n════════════════════\n`;
  msg += `📋 *تفاصيل المحطات والزبائن:*\n`;

  orders.forEach((o, idx) => {
    msg += `\n*محطة #${idx + 1} | طلب ${o.order_code}*\n`;
    msg += `👤 الزبون: ${o.customer_name}\n`;
    msg += `📞 الهاتف: ${o.phone}\n`;
    msg += `🏠 العنوان: ${o.address}\n`;
    if (o.maps_link) msg += `📍 موقع GPS: ${o.maps_link}\n`;
    msg += `💵 المبلغ للتحصيل (COD): *${o.total.toFixed(2)} د.م*\n`;
    msg += `📦 المحتويات: ${o.items.length} أصناف (${o.items
      .map((i) => i.name)
      .slice(0, 3)
      .join('، ')}${o.items.length > 3 ? '...' : ''})\n`;
  });

  msg += `\n════════════════════\n`;
  msg += `💰 *إجمالي مبلغ التحصيل (COD):* *${totalCOD.toFixed(2)} د.م*\n`;
  if (driver?.commissionPerOrder) {
    const wage = orders.length * driver.commissionPerOrder;
    msg += `🛵 *أجرة الجولة المستحقة لك:* ${wage.toFixed(2)} د.م\n`;
    msg += `🏦 *الصافي لتوريده لصندوق المتجر:* ${(totalCOD - wage).toFixed(2)} د.م\n`;
  }
  msg += `\nطريق السلامة والتوفيق! 🌟🌿`;
  return msg;
}

/**
 * بناء رسالة طلب استدعاء سائق inDrive أو تطبيقات التوصيل الفوري
 */
export function buildInDriveMessage(
  zoneKey: FezZoneId,
  orders: DbOrder[],
  zoneInfo: FezZoneConfig,
  hub: typeof STORE_PICKUP_HUB = STORE_PICKUP_HUB
): string {
  const { totalCOD } = calculateZoneCOD(orders);
  let msg = `السلام عليكم 🚴\n`;
  msg += `جولة توصيل - ${zoneInfo.name} (${orders.length} محطات) لمتجر خُضرة 🌿\n\n`;
  msg += `📍 نقطة الانطلاق:\n${hub.name}\n${hub.address}\n\n`;
  msg += `📦 المحطات المتتابعة:\n`;
  orders.forEach((o, idx) => {
    msg += `\n───────────────\n`;
    msg += `محطة #${idx + 1} (${o.order_code}):\n`;
    msg += `👤 ${o.customer_name}\n📞 ${o.phone}\n🏠 ${o.address}\n`;
    if (o.maps_link) msg += `🗺️ GPS: ${o.maps_link}\n`;
    msg += `💵 COD: ${o.total.toFixed(2)} د.م\n`;
  });
  msg += `\n───────────────\n💰 إجمالي COD للجولة: ${totalCOD.toFixed(2)} د.م`;
  return msg;
}

/**
 * بناء رسائل إشعار الزبائن بخروج الجولة في منطقتهم
 */
export function buildCustomersNotificationMessage(
  zoneKey: FezZoneId,
  orders: DbOrder[],
  zoneInfo: FezZoneConfig
): string {
  let msg = `📢 *إشعار خروج الجولة لزبائن ${zoneInfo.name}:*\n`;
  orders.forEach((o, idx) => {
    msg += `\n${idx + 1}. الزبون: ${o.customer_name} (${o.order_code})\n`;
    msg += `   📞 الهاتف: ${o.phone}\n`;
    msg += `   💬 الرسالة:\n`;
    msg += `   "مرحباً بك، طلبك من خُضرة (${o.order_code}) خرج الآن في جولة التوصيل وسيكون عندك خلال ${zoneInfo.targetTime}. المبلغ المطلوب عند الاستلام: ${o.total.toFixed(2)} د.م. شكراً لثقتك بنا 🌿"\n`;
  });
  return msg;
}
