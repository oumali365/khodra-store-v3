// ============================================================
// AdminDeliveryFleetTab.tsx – الإصدار 5.0
// إدارة أسطول التوصيل الداخلي + المسارات الذكية وأتمتة جولات فاس
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  Bike,
  Navigation,
  Clock,
  Coins,
  TrendingUp,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  FileText,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Phone,
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Send,
  Share2,
  Compass,
  ShieldCheck,
  Car,
  Truck,
  UserCheck,
  UserX,
  X,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  DbOrder,
  fetchStoreDrivers,
  saveStoreDrivers,
  addStoreDriver,
  updateStoreDriver,
  deleteStoreDriver,
  batchAssignZoneOrders,
  detectFezZone,
} from '../../services/supabaseService';
import {
  DELIVERY_PROVIDERS,
  FEZ_DELIVERY_ZONES,
  STORE_PICKUP_HUB,
  STORE_CONFIG,
} from '../../data/config';
import {
  FezZoneId,
  StoreDriver,
  DriverVehicleType,
  DriverStatus,
} from '../../types';
import { TourManifestModal } from './TourManifestModal';

interface AdminDeliveryFleetTabProps {
  orders: DbOrder[];
  onSelectOrderForBordereau: (order: DbOrder) => void;
  onOpenOrderInvoice: (order: DbOrder) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
  onRefreshOrders?: () => void;
}

const VEHICLE_CONFIG: Record<
  DriverVehicleType,
  { label: string; icon: string; iconComponent: React.FC<{ className?: string }> }
> = {
  moto: { label: 'دراجة نارية', icon: '🏍️', iconComponent: Bike },
  car: { label: 'سيارة', icon: '🚗', iconComponent: Car },
  van: { label: 'فان / شاحنة', icon: '🚐', iconComponent: Truck },
  scooter: { label: 'سكوتر', icon: '🛵', iconComponent: Bike },
  bicycle: { label: 'دراجة هوائية', icon: '🚲', iconComponent: Bike },
};

const STATUS_CONFIG: Record<
  DriverStatus,
  { label: string; badge: string; dot: string }
> = {
  available: {
    label: 'متاح وجاهز',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  on_delivery: {
    label: 'في جولة توصيل',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    dot: 'bg-amber-500',
  },
  off_duty: {
    label: 'خارج الخدمة',
    badge: 'bg-stone-100 text-stone-700 border-stone-300',
    dot: 'bg-stone-400',
  },
};

function cleanPhoneForWhatsApp(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('212')) return digits;
  if (digits.startsWith('0')) return '212' + digits.slice(1);
  return digits;
}

export const AdminDeliveryFleetTab: React.FC<AdminDeliveryFleetTabProps> = ({
  orders,
  showToast,
  onRefreshOrders,
}) => {
  // ─── سائقو الفريق الداخلي ───
  const [drivers, setDrivers] = useState<StoreDriver[]>([]);
  const [isDriversLoading, setIsDriversLoading] = useState(true);
  const [isDriversSynced, setIsDriversSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ─── مودالات إدارة السائقين ───
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<StoreDriver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<StoreDriver | null>(null);

  // ─── بيانات نموذج السائق الجديد / المعدل ───
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    vehicleType: 'moto' as DriverVehicleType,
    zonePreference: 'all' as FezZoneId | 'all',
    status: 'available' as DriverStatus,
    commissionPerOrder: 25,
    vehiclePlate: '',
    notes: '',
  });

  // ─── أتمتة المسارات والنسخ والجولات ───
  const [copiedBatchZone, setCopiedBatchZone] = useState<string | null>(null);
  const [manifestZone, setManifestZone] = useState<FezZoneId | null>(null);
  const [selectedDriverForManifest, setSelectedDriverForManifest] = useState<StoreDriver | null>(null);

  // أتمتة إرسال الجولة للسائق أو الاعتماد السريع
  const [tourActionZone, setTourActionZone] = useState<FezZoneId | null>(null);
  const [selectedDriverForZone, setSelectedDriverForZone] = useState<Record<FezZoneId, string>>({
    north: '',
    central: '',
    south: '',
    east: '',
  });
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);
  const [copyFormatModalZone, setCopyFormatModalZone] = useState<FezZoneId | null>(null);

  // ─── جلب السائقين ومزامنتهم عند التحميل ───
  const loadDrivers = async () => {
    setIsDriversLoading(true);
    try {
      const res = await fetchStoreDrivers();
      setDrivers(res.drivers);
      setIsDriversSynced(res.synced);
    } catch {
      showToast('error', 'تعذر تحميل بيانات السائقين');
    } finally {
      setIsDriversLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await saveStoreDrivers(drivers);
      setIsDriversSynced(res.synced);
      showToast(res.synced ? 'success' : 'error', res.message || 'تمت المزامنة');
    } catch {
      showToast('error', 'فشلت المزامنة');
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── إضافة سائق جديد ───
  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name.trim() || !driverForm.phone.trim()) {
      showToast('error', 'يرجى إدخال اسم السائق ورقم الهاتف');
      return;
    }

    if (editingDriver) {
      // تعديل
      const res = await updateStoreDriver(editingDriver.id, driverForm);
      if (res.success && res.driver) {
        setDrivers((prev) => prev.map((d) => (d.id === editingDriver.id ? res.driver! : d)));
        setIsDriversSynced(res.synced);
        showToast('success', 'تم تعديل بيانات السائق بنجاح');
      } else {
        showToast('error', res.message || 'فشل التعديل');
      }
      setEditingDriver(null);
    } else {
      // إضافة
      const res = await addStoreDriver(driverForm);
      if (res.success && res.driver) {
        setDrivers((prev) => [res.driver, ...prev]);
        setIsDriversSynced(res.synced);
        showToast('success', `تمت إضافة السائق ${res.driver.name} بنجاح`);
      } else {
        showToast('error', res.message || 'فشلت الإضافة');
      }
      setIsAddDriverOpen(false);
    }

    // إعادة تعيين النموذج
    setDriverForm({
      name: '',
      phone: '',
      vehicleType: 'moto',
      zonePreference: 'all',
      status: 'available',
      commissionPerOrder: 25,
      vehiclePlate: '',
      notes: '',
    });
  };

  const handleStartEditDriver = (driver: StoreDriver) => {
    setEditingDriver(driver);
    setDriverForm({
      name: driver.name,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      zonePreference: driver.zonePreference,
      status: driver.status,
      commissionPerOrder: driver.commissionPerOrder,
      vehiclePlate: driver.vehiclePlate || '',
      notes: driver.notes || '',
    });
  };

  const handleDeleteDriver = async () => {
    if (!deletingDriver) return;
    const res = await deleteStoreDriver(deletingDriver.id);
    if (res.success) {
      setDrivers((prev) => prev.filter((d) => d.id !== deletingDriver.id));
      setIsDriversSynced(res.synced);
      showToast('success', `تم حذف السائق ${deletingDriver.name}`);
    } else {
      showToast('error', res.message || 'فشل الحذف');
    }
    setDeletingDriver(null);
  };

  const handleToggleDriverStatus = async (driver: StoreDriver, newStatus: DriverStatus) => {
    const res = await updateStoreDriver(driver.id, { status: newStatus });
    if (res.success) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === driver.id ? { ...d, status: newStatus } : d))
      );
      showToast('success', `تم تحديث حالة ${driver.name} إلى: ${STATUS_CONFIG[newStatus].label}`);
    }
  };

  // ─── KPIs والطلبات ───
  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
  const activeDeliveryOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'prepared'
  );
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const totalDriverCost = nonCancelledOrders.reduce(
    (sum, o) => sum + (o.delivery_dispatch?.deliveryCost ?? 25),
    0
  );
  const totalDeliveryRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.delivery_fee, 0);
  const netDeliveryProfit = totalDeliveryRevenue - totalDriverCost;

  // ─── تجميع الطلبات حسب مناطق فاس الذكية ───
  const zoneGroups: Record<FezZoneId, DbOrder[]> = {
    north: nonCancelledOrders.filter(
      (o) => (o.delivery_zone || o.delivery_dispatch?.zone || 'north') === 'north'
    ),
    central: nonCancelledOrders.filter(
      (o) => (o.delivery_zone || o.delivery_dispatch?.zone) === 'central'
    ),
    south: nonCancelledOrders.filter(
      (o) => (o.delivery_zone || o.delivery_dispatch?.zone) === 'south'
    ),
    east: nonCancelledOrders.filter(
      (o) => (o.delivery_zone || o.delivery_dispatch?.zone) === 'east'
    ),
  };

  const zones: FezZoneId[] = ['north', 'central', 'south', 'east'];

  const zoneStyles: Record<
    FezZoneId,
    { border: string; bg: string; badge: string; btn: string; icon: string }
  > = {
    north: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/40',
      badge: 'bg-emerald-200 text-emerald-900',
      btn: 'bg-emerald-700 hover:bg-emerald-800',
      icon: 'text-emerald-300',
    },
    central: {
      border: 'border-amber-200',
      bg: 'bg-amber-50/40',
      badge: 'bg-amber-200 text-amber-900',
      btn: 'bg-amber-700 hover:bg-amber-800',
      icon: 'text-amber-300',
    },
    south: {
      border: 'border-orange-200',
      bg: 'bg-orange-50/40',
      badge: 'bg-orange-200 text-orange-900',
      btn: 'bg-orange-700 hover:bg-orange-800',
      icon: 'text-orange-300',
    },
    east: {
      border: 'border-purple-200',
      bg: 'bg-purple-50/40',
      badge: 'bg-purple-200 text-purple-900',
      btn: 'bg-purple-700 hover:bg-purple-800',
      icon: 'text-purple-300',
    },
  };

  // ─── توليد رابط خرائط جوجل متعدد المحطات (Multi-Stop Google Maps Route) ───
  const generateGoogleMapsMultiStopUrl = (zoneOrders: DbOrder[]): string => {
    if (zoneOrders.length === 0) return '';
    const origin = encodeURIComponent(
      `${STORE_PICKUP_HUB.name}, ${STORE_PICKUP_HUB.address}`
    );
    const destination = encodeURIComponent(
      `${zoneOrders[zoneOrders.length - 1].address}, فاس`
    );

    if (zoneOrders.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    }

    // باقي المحطات كـ waypoints
    const waypoints = zoneOrders
      .slice(0, zoneOrders.length - 1)
      .map((o) => encodeURIComponent(`${o.address}, فاس`))
      .join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
  };

  // ─── إنشاء نصوص الجولة حسب القالب ───
  const buildTourMessage = (
    zoneKey: FezZoneId,
    format: 'indrive' | 'driver_whatsapp' | 'customers_sms',
    driver?: StoreDriver
  ): string => {
    const zoneOrders = zoneGroups[zoneKey];
    const zoneInfo = FEZ_DELIVERY_ZONES[zoneKey];
    const totalCOD = zoneOrders.reduce((sum, o) => sum + o.total, 0);
    const mapsRoute = generateGoogleMapsMultiStopUrl(zoneOrders);

    if (format === 'indrive') {
      let msg = `السلام عليكم 🚴\n`;
      msg += `جولة توصيل - ${zoneInfo.name} (${zoneOrders.length} محطات) لمتجر خُضرة 🌿\n\n`;
      msg += `📍 نقطة الانطلاق:\n${STORE_PICKUP_HUB.name}\n${STORE_PICKUP_HUB.address}\n\n`;
      msg += `📦 المحطات:\n`;
      zoneOrders.forEach((o, idx) => {
        msg += `\n───────────────\n`;
        msg += `محطة #${idx + 1} (${o.order_code}):\n`;
        msg += `👤 ${o.customer_name}\n📞 ${o.phone}\n🏠 ${o.address}\n`;
        if (o.maps_link) msg += `🗺️ ${o.maps_link}\n`;
        msg += `💵 COD: ${o.total.toFixed(2)} درهم\n`;
      });
      msg += `\n───────────────\n💰 إجمالي COD للجولة: ${totalCOD.toFixed(2)} درهم`;
      return msg;
    }

    if (format === 'driver_whatsapp') {
      const driverName = driver ? driver.name : 'كابتن التوصيل';
      let msg = `السلام عليكم كابتن *${driverName}* 🛵\n`;
      msg += `🌿 *جولة توصيل جديدة - متجر خُضرة*\n`;
      msg += `🧭 *المنطقة:* ${zoneInfo.name} (${zoneInfo.targetTime})\n`;
      msg += `📦 *عدد الطلبات:* ${zoneOrders.length} طلبيات مجهزة\n`;
      msg += `📍 *نقطة الانطلاق والتموين:* ${STORE_PICKUP_HUB.name} (${STORE_PICKUP_HUB.address})\n`;
      if (mapsRoute) {
        msg += `🗺️ *رابط المسار الكامل على خرائط Google:*\n${mapsRoute}\n`;
      }
      msg += `\n════════════════════\n`;
      msg += `📋 *تفاصيل المحطات والزبائن:*\n`;

      zoneOrders.forEach((o, idx) => {
        msg += `\n*محطة ${idx + 1} | طلب ${o.order_code}*\n`;
        msg += `👤 الزبون: ${o.customer_name}\n`;
        msg += `📞 الهاتف: ${o.phone}\n`;
        msg += `🏠 العنوان: ${o.address}\n`;
        if (o.maps_link) msg += `📍 موقع GPS: ${o.maps_link}\n`;
        msg += `💵 المبلغ للتحصيل (COD): *${o.total.toFixed(2)} درهم*\n`;
        msg += `📦 المحتويات: ${o.items.length} أصناف (${o.items.map((i) => i.name).slice(0, 3).join('، ')}${o.items.length > 3 ? '...' : ''})\n`;
      });

      msg += `\n════════════════════\n`;
      msg += `💰 *إجمالي المبلغ المطلوب تحصيله (COD):* *${totalCOD.toFixed(2)} درهم*\n`;
      if (driver?.commissionPerOrder) {
        const wage = zoneOrders.length * driver.commissionPerOrder;
        msg += `🛵 *أجرة الجولة المستحقة لك:* ${wage.toFixed(2)} درهم\n`;
        msg += `🏦 *الصافي للتوريد لصندوق المتجر:* ${(totalCOD - wage).toFixed(2)} درهم\n`;
      }
      msg += `\nطريق السلامة والتوفيق! 🌟🌿`;
      return msg;
    }

    // format === 'customers_sms'
    let msg = `📢 *إشعار خروج الجولة لزبائن ${zoneInfo.name}:*\n`;
    zoneOrders.forEach((o) => {
      msg += `\n• زبون: ${o.customer_name} (${o.order_code}) - الهاتف: ${o.phone}\n`;
      msg += `  الرسالة: مرحباً بك، طلبك من خُضرة خرج الآن في جولة التوصيل مع مندوبنا وسيكون عندك خلال 30-45 دقيقة. المبلغ المطلوب: ${o.total.toFixed(2)} درهم.\n`;
    });
    return msg;
  };

  // ─── نسخ النص ───
  const handleCopyText = async (text: string, zoneKey: FezZoneId, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBatchZone(zoneKey);
      showToast('success', `تم نسخ ${label} بنجاح`);
      setTimeout(() => setCopiedBatchZone(null), 3000);
    } catch {
      showToast('error', 'تعذر النسخ');
    }
  };

  // ─── أتمتة 1: إرسال الجولة المباشر للسائق عبر واتساب ───
  const handleSendToDriverWhatsApp = (zoneKey: FezZoneId) => {
    const driverId = selectedDriverForZone[zoneKey];
    const driver = drivers.find((d) => d.id === driverId) || drivers[0];
    const zoneOrders = zoneGroups[zoneKey];

    if (zoneOrders.length === 0) {
      showToast('error', 'لا توجد طلبات في هذه المنطقة');
      return;
    }

    const message = buildTourMessage(zoneKey, 'driver_whatsapp', driver);
    const targetPhone = driver ? cleanPhoneForWhatsApp(driver.phone) : '';

    if (!targetPhone) {
      // فتح واتساب مع الرسالة دون رقم محدد
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(
        `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`,
        '_blank'
      );
    }
    showToast('success', `تم فتح واتساب لإرسال الجولة إلى ${driver?.name || 'السائق'}`);
  };

  // ─── أتمتة 2: فتح مسار Google Maps المجمّع ───
  const handleOpenGoogleMapsRoute = (zoneKey: FezZoneId) => {
    const zoneOrders = zoneGroups[zoneKey];
    if (zoneOrders.length === 0) {
      showToast('error', 'لا توجد طلبات لتوليد المسار');
      return;
    }
    const url = generateGoogleMapsMultiStopUrl(zoneOrders);
    window.open(url, '_blank');
    showToast('success', `تم فتح مسار الملاحة المتعدد (${zoneOrders.length} محطات)`);
  };

  // ─── أتمتة 3: اعتماد الجولة ونقل الطلبات للتوصيل دفعة واحدة ───
  const handleBatchAssignOrders = async (zoneKey: FezZoneId) => {
    const zoneOrders = zoneGroups[zoneKey];
    if (zoneOrders.length === 0) {
      showToast('error', 'لا توجد طلبات في هذه المنطقة للاعتماد');
      return;
    }

    const driverId = selectedDriverForZone[zoneKey];
    const driver = drivers.find((d) => d.id === driverId) || drivers[0];

    if (!driver) {
      showToast('error', 'يرجى اختيار سائق للجولة أولاً من القائمة');
      return;
    }

    setIsBatchAssigning(true);
    try {
      const res = await batchAssignZoneOrders({
        orders: zoneOrders,
        driver,
        newStatus: 'prepared',
      });

      if (res.success) {
        showToast('success', res.message || 'تم اعتماد الجولة وتعيين السائق بنجاح!');
        if (onRefreshOrders) onRefreshOrders();
        // تحديث حالة السائق محلياً
        setDrivers((prev) =>
          prev.map((d) =>
            d.id === driver.id
              ? {
                  ...d,
                  status: 'on_delivery',
                  activeOrdersCount: (d.activeOrdersCount || 0) + zoneOrders.length,
                }
              : d
          )
        );
      } else {
        showToast('error', res.message || 'فشل اعتماد الجولة');
      }
    } catch {
      showToast('error', 'حدث خطأ أثناء اعتماد الجولة');
    } finally {
      setIsBatchAssigning(false);
      setTourActionZone(null);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* ═══════════ KPIs ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
            <span>رحلات اليوم</span>
            <Bike className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 tabular-nums">
            {nonCancelledOrders.length}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {activeDeliveryOrders.length} نشطة • {deliveredOrders.length} مكتملة
          </p>
        </div>

        <div className="bg-white border-2 border-amber-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
            <span>وقت التوصيل</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950 tabular-nums">
            35 - 45 <span className="text-sm font-normal">د</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">الهدف: أقل من 60 دقيقة</p>
        </div>

        <div className="bg-white border-2 border-blue-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-blue-800 font-bold mb-1">
            <span>تكلفة السائقين</span>
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-950 tabular-nums">
            {totalDriverCost.toFixed(0)} <span className="text-sm font-normal">د.م</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">حسب كل طلب</p>
        </div>

        <div className="bg-white border-2 border-stone-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-700 font-bold mb-1">
            <span>صافي التوصيل</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black tabular-nums ${
              netDeliveryProfit >= 0 ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {netDeliveryProfit >= 0 ? '+' : ''}
            {netDeliveryProfit.toFixed(0)} <span className="text-sm font-normal">د.م</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">يُعوّض عبر قيمة السلة</p>
        </div>
      </div>

      {/* ═══════════ فريق التوصيل الداخلي للمتجر ═══════════ */}
      <div className="bg-white border-2 border-[#163920]/20 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                  <span>فريق التوصيل الداخلي لمتجر خُضرة</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {drivers.length} سائقين
                  </span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  إدارة السائقين، تعيين الجولات، وحساب المستحقات مع مزامنة لحظية
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* حالة المزامنة */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isDriversSynced
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title="مزامنة مع السيرفر السحابي"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isDriversSynced ? 'متزامن سحابياً' : 'مزامنة مع السيرفر'}</span>
            </button>

            {/* زر إضافة سائق */}
            <button
              type="button"
              onClick={() => {
                setEditingDriver(null);
                setDriverForm({
                  name: '',
                  phone: '',
                  vehicleType: 'moto',
                  zonePreference: 'all',
                  status: 'available',
                  commissionPerOrder: 25,
                  vehiclePlate: '',
                  notes: '',
                });
                setIsAddDriverOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#163920] hover:bg-[#0E2615] text-white text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة سائق جديد</span>
            </button>
          </div>
        </div>

        {/* بطاقات السائقين */}
        {isDriversLoading ? (
          <div className="py-8 text-center text-xs text-stone-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>جاري تحميل فريق السائقين...</span>
          </div>
        ) : drivers.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl my-3">
            <p className="font-bold text-stone-700">لم يتم إضافة أي سائقين في الفريق الداخلي بعد.</p>
            <p className="text-[11px] text-stone-500 mt-1">
              انقر على زر "إضافة سائق جديد" لتسجيل أول مندوب توصيل.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            {drivers.map((driver) => {
              const vehicle = VEHICLE_CONFIG[driver.vehicleType] || VEHICLE_CONFIG.moto;
              const status = STATUS_CONFIG[driver.status] || STATUS_CONFIG.available;
              const cleanPhone = cleanPhoneForWhatsApp(driver.phone);

              return (
                <div
                  key={driver.id}
                  className="border-2 border-stone-200 hover:border-emerald-300 rounded-xl p-3.5 bg-stone-50/60 hover:bg-white transition-all flex flex-col justify-between shadow-xs"
                >
                  <div>
                    {/* الترويسة والحالة */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl" title={vehicle.label}>
                          {vehicle.icon}
                        </span>
                        <span className="text-xs font-black text-stone-900">{driver.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span>{status.label}</span>
                      </span>
                    </div>

                    {/* معلومات التواصل والتفاصيل */}
                    <div className="space-y-1 text-xs text-stone-600 mb-3 bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="flex items-center justify-between font-mono" dir="ltr">
                        <span className="text-[11px] font-bold text-stone-800">{driver.phone}</span>
                        <span className="text-[10px] text-stone-500 font-sans">هاتف / واتساب</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>أجرة الطلب:</span>
                        <strong className="text-emerald-800 tabular-nums">
                          {driver.commissionPerOrder} د.م
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>المنطقة المفضلة:</span>
                        <span className="font-bold text-stone-800">
                          {driver.zonePreference === 'all'
                            ? 'جميع أحياء فاس'
                            : FEZ_DELIVERY_ZONES[driver.zonePreference]?.name || 'عام'}
                        </span>
                      </div>
                      {driver.vehiclePlate && (
                        <div className="flex items-center justify-between text-[10px] text-stone-500">
                          <span>اللوحة:</span>
                          <span className="font-mono">{driver.vehiclePlate}</span>
                        </div>
                      )}
                      {driver.notes && (
                        <p className="text-[10px] text-stone-500 italic mt-1 line-clamp-1 border-t border-stone-100 pt-1">
                          {driver.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* إجراءات السائق */}
                  <div className="space-y-2 pt-1 border-t border-stone-200">
                    {/* تغيير الحالة بنقرة سريعة */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleToggleDriverStatus(driver, 'available')}
                        className={`flex-1 py-1 rounded text-center font-bold transition-colors ${
                          driver.status === 'available'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200 text-stone-700 hover:bg-emerald-100'
                        }`}
                      >
                        متاح
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDriverStatus(driver, 'on_delivery')}
                        className={`flex-1 py-1 rounded text-center font-bold transition-colors ${
                          driver.status === 'on_delivery'
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-200 text-stone-700 hover:bg-amber-100'
                        }`}
                      >
                        في جولة
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDriverStatus(driver, 'off_duty')}
                        className={`flex-1 py-1 rounded text-center font-bold transition-colors ${
                          driver.status === 'off_duty'
                            ? 'bg-stone-700 text-white'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                      >
                        خارج
                      </button>
                    </div>

                    {/* اتصال وواتساب وتعديل وحذف */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {cleanPhone && (
                        <>
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                            title="محادثة واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${driver.phone}`}
                            className="p-1.5 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            title="اتصال هاتفي"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartEditDriver(driver)}
                        className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors cursor-pointer mr-auto"
                        title="تعديل بيانات السائق"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingDriver(driver)}
                        className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer"
                        title="حذف السائق"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════ مناطق فاس والمسارات الذكية وأتمتة الجولات ═══════════ */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-3 border-b border-stone-200">
          <div>
            <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-700" />
              <span>المسارات الذكية وأتمتة جولات فاس</span>
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              إرسال مباشر عبر واتساب للسائقين • خرائط جوجل المجمعة • مانيفست ورقي • اعتماد فوري بنقرة واحدة
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>مقر خُضرة / سوق الجملة بنسودة</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {zones.map((zoneKey) => {
            const info = FEZ_DELIVERY_ZONES[zoneKey];
            const styles = zoneStyles[zoneKey];
            const zoneOrders = zoneGroups[zoneKey];
            const count = zoneOrders.length;
            const isCopied = copiedBatchZone === zoneKey;
            const totalCOD = zoneOrders.reduce((sum, o) => sum + o.total, 0);

            return (
              <div
                key={zoneKey}
                className={`border-2 ${styles.border} rounded-2xl p-3.5 ${styles.bg} flex flex-col justify-between shadow-xs transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${styles.badge}`}>
                      {info.name}
                    </span>
                    <span className="text-[11px] font-bold text-stone-700">{info.targetTime}</span>
                  </div>

                  <p className="text-xs text-stone-700 font-semibold mb-2 line-clamp-2">
                    {info.neighborhoods.slice(0, 4).join(' • ')}
                  </p>

                  <div className="bg-white border border-stone-200 rounded-xl p-2.5 mb-3 text-xs space-y-1.5">
                    <div className="flex justify-between font-bold text-stone-800">
                      <span>جاهز للتوصيل:</span>
                      <span className="font-black tabular-nums text-emerald-800">
                        {count} طلبات
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-600">
                      <span>مجموع التحصيل (COD):</span>
                      <strong className="text-stone-900 tabular-nums">
                        {totalCOD.toFixed(2)} د.م
                      </strong>
                    </div>

                    {/* قائمة منسدلة لاختيار سائق الجولة */}
                    <div className="pt-1.5 border-t border-stone-100">
                      <label className="block text-[10px] font-black text-stone-500 mb-1">
                        تعيين سائق الجولة:
                      </label>
                      <select
                        value={selectedDriverForZone[zoneKey] || ''}
                        onChange={(e) =>
                          setSelectedDriverForZone((prev) => ({
                            ...prev,
                            [zoneKey]: e.target.value,
                          }))
                        }
                        className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white font-bold text-stone-800 focus:outline-emerald-600"
                      >
                        <option value="">-- اختر سائقاً من الفريق --</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({VEHICLE_CONFIG[d.vehicleType]?.icon} {STATUS_CONFIG[d.status]?.label})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ─── أزرار الأتمتة والنسخ والطباعة ─── */}
                <div className="space-y-1.5 pt-1">
                  {/* زر أتمتة 1: إرسال للسائق عبر واتساب مباشرة بنقرة واحدة */}
                  <button
                    type="button"
                    disabled={count === 0}
                    onClick={() => handleSendToDriverWhatsApp(zoneKey)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال الجولة للسائق (WhatsApp)</span>
                  </button>

                  {/* زر أتمتة 2: فتح مسار خرائط جوجل المجمّع */}
                  <button
                    type="button"
                    disabled={count === 0}
                    onClick={() => handleOpenGoogleMapsRoute(zoneKey)}
                    className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="فتح مسار الملاحة الكامل المتعدد في خرائط Google"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-200" />
                    <span>مسار خرائط Google 🗺️</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* زر أتمتة 3: اعتماد الجولة وتحويل الحالات */}
                    <button
                      type="button"
                      disabled={count === 0 || isBatchAssigning}
                      onClick={() => handleBatchAssignOrders(zoneKey)}
                      className="py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                      title="تعيين السائق وتحويل جميع طلبات الجولة لحالة جاهزة للتوصيل"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>اعتماد الجولة 🚀</span>
                    </button>

                    {/* زر أتمتة 4: طباعة المانيفست */}
                    <button
                      type="button"
                      disabled={count === 0}
                      onClick={() => {
                        const driverId = selectedDriverForZone[zoneKey];
                        const driver = drivers.find((d) => d.id === driverId) || null;
                        setSelectedDriverForManifest(driver);
                        setManifestZone(zoneKey);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                      title="طباعة ورقة تسليم رسمية لجميع محطات الجولة"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-300" />
                      <span>مانيفست A4</span>
                    </button>
                  </div>

                  {/* زر خيارات النسخ المتعددة */}
                  <button
                    type="button"
                    disabled={count === 0}
                    onClick={() => setCopyFormatModalZone(zoneKey)}
                    className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-black">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-600" />
                        <span>خيارات النسخ الذكي 📋</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════ شركات وتطبيقات التوصيل ═══════════ */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h3 className="font-black text-base text-stone-900 mb-1 flex items-center gap-2">
          <Bike className="w-5 h-5 text-emerald-600" />
          <span>شركات وتطبيقات التوصيل الخارجي بفاس</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {DELIVERY_PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className={`border-2 rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                provider.recommended
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-stone-200 bg-stone-50 hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">{provider.icon}</span>
                  {provider.recommended && (
                    <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      موصى به
                    </span>
                  )}
                </div>
                <h4 className="font-black text-sm text-stone-900">{provider.name}</h4>
                <p className="text-[11px] text-stone-600 leading-snug mt-1 mb-2">
                  {provider.tagline}
                </p>
                <div className="text-[11px] text-stone-700 font-bold bg-white p-2 rounded border border-stone-200 mb-3">
                  التكلفة: <span className="text-emerald-700">{provider.avgCost}</span>
                </div>
              </div>
              {provider.appUrl ? (
                <a
                  href={provider.appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح التطبيق</span>
                </a>
              ) : (
                <div className="text-center py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-100/60 rounded-lg">
                  فريق خُضرة الداخلي 🛵
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ مودال إضافة / تعديل سائق ═══════════ */}
      {(isAddDriverOpen || editingDriver) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-right">
            <div className="p-4 bg-gradient-to-l from-[#163920] to-[#0E2615] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-[#F5D76E]" />
                <h3 className="font-black text-base">
                  {editingDriver ? `تعديل بيانات: ${editingDriver.name}` : 'إضافة سائق جديد للفريق'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddDriverOpen(false);
                  setEditingDriver(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-stone-700 mb-1">
                    اسم السائق الكامل: *
                  </label>
                  <input
                    type="text"
                    required
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    placeholder="مثال: يوسف العلمي"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-700 mb-1">
                    رقم الهاتف / الواتساب: *
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    placeholder="0661234567"
                    dir="ltr"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-emerald-600 font-mono text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-stone-700 mb-1">
                    وسيلة النقل:
                  </label>
                  <select
                    value={driverForm.vehicleType}
                    onChange={(e) =>
                      setDriverForm({
                        ...driverForm,
                        vehicleType: e.target.value as DriverVehicleType,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 font-bold focus:outline-emerald-600 bg-white"
                  >
                    <option value="moto">🏍️ دراجة نارية</option>
                    <option value="car">🚗 سيارة</option>
                    <option value="van">🚐 فان / شاحنة</option>
                    <option value="scooter">🛵 سكوتر</option>
                    <option value="bicycle">🚲 دراجة هوائية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-700 mb-1">
                    المنطقة المفضلة بفاس:
                  </label>
                  <select
                    value={driverForm.zonePreference}
                    onChange={(e) =>
                      setDriverForm({
                        ...driverForm,
                        zonePreference: e.target.value as FezZoneId | 'all',
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 font-bold focus:outline-emerald-600 bg-white"
                  >
                    <option value="all">🌟 جميع أحياء فاس</option>
                    <option value="north">شمال فاس (طريق مكناس)</option>
                    <option value="central">وسط فاس (الأطلس/المدينة)</option>
                    <option value="south">جنوب فاس (عين الشقف/إيموزار)</option>
                    <option value="east">شرق فاس (الزهور/المرينيين)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-700 mb-1">
                    أجرة التوصيل (د.م/طلب):
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={driverForm.commissionPerOrder}
                    onChange={(e) =>
                      setDriverForm({
                        ...driverForm,
                        commissionPerOrder: Number(e.target.value) || 25,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 font-black focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-stone-700 mb-1">
                    الحالة الحالية:
                  </label>
                  <select
                    value={driverForm.status}
                    onChange={(e) =>
                      setDriverForm({ ...driverForm, status: e.target.value as DriverStatus })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 font-bold focus:outline-emerald-600 bg-white"
                  >
                    <option value="available">🟢 متاح وجاهز للتوصيل</option>
                    <option value="on_delivery">🟡 في جولة توصيل حالياً</option>
                    <option value="off_duty">⚪ خارج الخدمة / إجازة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-700 mb-1">
                    رقم اللوحة / تفاصيل المركبة:
                  </label>
                  <input
                    type="text"
                    value={driverForm.vehiclePlate}
                    onChange={(e) => setDriverForm({ ...driverForm, vehiclePlate: e.target.value })}
                    placeholder="مثال: 12-أ-3456"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-emerald-600 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-stone-700 mb-1">
                  ملاحظات إضافية عن السائق:
                </label>
                <textarea
                  rows={2}
                  value={driverForm.notes}
                  onChange={(e) => setDriverForm({ ...driverForm, notes: e.target.value })}
                  placeholder="مثال: متفرغ في الفترة الصباحية، يملك صندوقاً عازلاً كبيراً..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-emerald-600 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddDriverOpen(false);
                    setEditingDriver(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingDriver ? 'حفظ التعديلات' : 'إضافة السائق'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ تأكيد حذف سائق ═══════════ */}
      {deletingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 text-center space-y-4 border border-stone-200 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-base text-stone-900">حذف السائق من الفريق؟</h4>
              <p className="text-xs text-stone-600 mt-1">
                هل أنت متأكد من حذف السائق <strong>{deletingDriver.name}</strong>؟ سيتم مسحه من قائمة
                الفريق الداخلي.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDriver(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-xs cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleDeleteDriver}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-md"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ مودال خيارات النسخ الذكي المتعددة ═══════════ */}
      {copyFormatModalZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-5 border border-stone-200 shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-emerald-700" />
                <h4 className="font-black text-sm text-stone-900">
                  قوالب النسخ الذكية • {FEZ_DELIVERY_ZONES[copyFormatModalZone]?.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setCopyFormatModalZone(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              اختر صيغة النص المناسبة لطريقة الإرسال:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const txt = buildTourMessage(copyFormatModalZone, 'driver_whatsapp');
                  handleCopyText(txt, copyFormatModalZone, 'قالب السائق الداخلي');
                  setCopyFormatModalZone(null);
                }}
                className="w-full p-3 rounded-xl border-2 border-emerald-200 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-right transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <strong className="text-xs font-black text-emerald-950 block">
                    قالب السائق الداخلي (WhatsApp مفصل)
                  </strong>
                  <span className="text-[11px] text-stone-600">
                    يشمل أسماء الزبائن، الهواتف، العناوين، رابط GPS، ومبالغ COD
                  </span>
                </div>
                <Copy className="w-4 h-4 text-emerald-700 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const txt = buildTourMessage(copyFormatModalZone, 'indrive');
                  handleCopyText(txt, copyFormatModalZone, 'قالب inDrive / Careem');
                  setCopyFormatModalZone(null);
                }}
                className="w-full p-3 rounded-xl border-2 border-amber-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 text-right transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <strong className="text-xs font-black text-amber-950 block">
                    قالب inDrive / تطبيقات النقل
                  </strong>
                  <span className="text-[11px] text-stone-600">
                    مختصر ومهيأ لنقطة الانطلاق والمحطات المتتابعة
                  </span>
                </div>
                <Copy className="w-4 h-4 text-amber-700 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const txt = buildTourMessage(copyFormatModalZone, 'customers_sms');
                  handleCopyText(txt, copyFormatModalZone, 'رسائل إشعار الزبائن');
                  setCopyFormatModalZone(null);
                }}
                className="w-full p-3 rounded-xl border-2 border-blue-200 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-right transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <strong className="text-xs font-black text-blue-950 block">
                    قالب إشعار الزبائن بخروج الجولة
                  </strong>
                  <span className="text-[11px] text-stone-600">
                    رسائل جاهزة لإرسالها للزبائن لإعلامهم بوصول السائق قريباً
                  </span>
                </div>
                <Copy className="w-4 h-4 text-blue-700 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ مودال مانيفست الجولة A4 ═══════════ */}
      {manifestZone && (
        <TourManifestModal
          isOpen={Boolean(manifestZone)}
          onClose={() => setManifestZone(null)}
          zoneKey={manifestZone}
          orders={zoneGroups[manifestZone]}
          selectedDriver={selectedDriverForManifest}
        />
      )}
    </div>
  );
};
