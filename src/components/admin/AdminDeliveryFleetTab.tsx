// ============================================================
// AdminDeliveryFleetTab.tsx – الإصدار 6.0
// أداة مسارات التوصيل وفريق السائقين الذكية لمتجر خُضرة - فاس
// 1. الهيكل العام: 4 أعمدة بالمناطق (الشرقية، الوسطى، الجنوبية، الشمالية)
// 2. بطاقة الجولة: تفاصيل، أزرار واتساب وخرائط جوجل، وإغلاق الجولة
// 3. بطاقة السائق: الاسم، الحالة، الهاتف، الأجرة، المنطقة، اللوحة، العنوان، و4 أزرار
// 4. منطق تعيين السائقين: فرز المفضلة أولاً، وتعطيل المشغولين وخارج الخدمة
// 5. حساب مبالغ التحصيل (COD) ومودال تفاصيل المحاسبة
// 6. قوالب النسخ الذكي (سائق داخلي، inDrive، إشعار الزبائن)
// 7. إغلاق الجولة وتأكيد التسليم ونقل الطلبات لحالة تم التسليم مباشرة
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
  Compass,
  ShieldCheck,
  Car,
  Truck,
  X,
  Sparkles,
  Calculator,
  Eye,
  Archive,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  DbOrder,
  fetchStoreDrivers,
  saveStoreDrivers,
  addStoreDriver,
  updateStoreDriver,
  deleteStoreDriver,
  fetchInDriveDrivers,
  saveInDriveDrivers,
  addInDriveDriver,
  updateInDriveDriver,
  deleteInDriveDriver,
  closeAndDeliverZoneTour,
  updateOrderDispatch,
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
  onSelectOrderForBordereau?: (order: DbOrder) => void;
  onOpenOrderInvoice?: (order: DbOrder) => void;
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

// ═══════════════════════════════════════════════════════════════
// ─── السؤال 4: منطق تصفية وفرز السائقين الذكي (Driver Assignment Logic) ───
// ═══════════════════════════════════════════════════════════════
export function getSortedDriversForZone(zoneKey: FezZoneId, drivers: StoreDriver[]) {
  return [...drivers]
    .sort((a, b) => {
      // السائق الذي منطقته المفضلة تطابق منطقة الجولة يأتي أولاً
      const aMatchesZone = a.zonePreference === zoneKey ? 2 : a.zonePreference === 'all' ? 1 : 0;
      const bMatchesZone = b.zonePreference === zoneKey ? 2 : b.zonePreference === 'all' ? 1 : 0;
      if (aMatchesZone !== bMatchesZone) {
        return bMatchesZone - aMatchesZone;
      }
      // ثم فرز المتاحين قبل غير المتاحين
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

// ═══════════════════════════════════════════════════════════════
// ─── السؤال 5: حساب مبالغ التحصيل النقدي (COD Calculation) ───
// ═══════════════════════════════════════════════════════════════
export function calculateZoneCOD(zoneOrders: DbOrder[]) {
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
 * حساب تكلفة التوصيل المقدرة بناءً على تسعيرة خُضرة وفاس:
 * - سائق فريق المتجر (داخلي): 9 إلى 13 درهم للطلب الواحد
 * - سائقو تطبيقات النقل / inDrive: 20 إلى 25 درهم للطلب الواحد
 * - تجميع 3 طلبيات إرسال دفعة واحدة:
 *   - داخل نظام خضرة: 30 إلى 35 درهم
 *   - خارج النظام (inDrive): 45 إلى 60 درهم
 */
export function calculateDeliveryBatchPricing(ordersCount: number) {
  if (ordersCount <= 0) {
    return {
      internalMin: 0,
      internalMax: 0,
      indriveMin: 0,
      indriveMax: 0,
      summaryText: 'لا توجد طلبات حالياً',
    };
  }

  const batches = Math.floor(ordersCount / 3);
  const remainder = ordersCount % 3;

  const internalMin = batches * 30 + remainder * 9;
  const internalMax = batches * 35 + remainder * 13;

  const indriveMin = batches * 45 + remainder * 20;
  const indriveMax = batches * 60 + remainder * 25;

  let summaryText = '';
  if (ordersCount === 3) {
    summaryText = `دفعة 3 طلبيات: خضرة (30-35 د.م) • inDrive (45-60 د.م)`;
  } else if (ordersCount === 1) {
    summaryText = `طلب فردي: خضرة (9-13 د.م) • inDrive (20-25 د.م)`;
  } else if (ordersCount === 2) {
    summaryText = `طلبيتان: خضرة (18-26 د.م) • inDrive (40-50 د.م)`;
  } else {
    summaryText = `${ordersCount} طلبات: خضرة (${internalMin}-${internalMax} د.م) • inDrive (${indriveMin}-${indriveMax} د.م)`;
  }

  return {
    internalMin,
    internalMax,
    indriveMin,
    indriveMax,
    summaryText,
  };
}

export const AdminDeliveryFleetTab: React.FC<AdminDeliveryFleetTabProps> = ({
  orders,
  showToast,
  onRefreshOrders,
}) => {
  // ─── تبويب إدارة الأسطول (فريق المتجر الداخلي أم أسطول inDrive) ───
  const [activeFleetTab, setActiveFleetTab] = useState<'internal' | 'indrive'>('internal');

  // ─── سائقو الفريق الداخلي ───
  const [drivers, setDrivers] = useState<StoreDriver[]>([]);
  const [isDriversLoading, setIsDriversLoading] = useState(true);
  const [isDriversSynced, setIsDriversSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ─── أسطول سائقي تطبيقات التوصيل السريعة (inDrive) ───
  const [inDriveDrivers, setInDriveDrivers] = useState<StoreDriver[]>([]);
  const [isInDriveLoading, setIsInDriveLoading] = useState(true);
  const [isInDriveSynced, setIsInDriveSynced] = useState(false);
  const [isInDriveSyncing, setIsInDriveSyncing] = useState(false);

  // ─── مودالات إدارة السائقين ───
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<StoreDriver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<StoreDriver | null>(null);

  // ─── بيانات نموذج السائق الجديد / المعدل (تشمل حقل العنوان - السؤال 3) ───
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    vehicleType: 'moto' as DriverVehicleType,
    zonePreference: 'all' as FezZoneId | 'all',
    status: 'available' as DriverStatus,
    commissionPerOrder: 11, // السعر المقدر المعتمد: 9 إلى 13 د.م للطلب
    vehiclePlate: '',
    address: '', // حقل العنوان
    notes: '',
  });

  // ─── أتمتة المسارات والنسخ والجولات ───
  const [copiedTemplateName, setCopiedTemplateName] = useState<string | null>(null);
  const [manifestZone, setManifestZone] = useState<FezZoneId | null>(null);
  const [selectedDriverForManifest, setSelectedDriverForManifest] = useState<StoreDriver | null>(null);

  // السائق المختار لكل منطقة من القائمة المنسدلة (المستوى الأول - الفريق الداخلي)
  const [selectedDriverForZone, setSelectedDriverForZone] = useState<Record<FezZoneId, string>>({
    east: '',
    central: '',
    south: '',
    north: '',
  });

  // الحل المطلوب 1: تعيين سائق الجولة من inDrive (اختر سائقاً من inDrive)
  const [selectedInDriveDriverForZone, setSelectedInDriveDriverForZone] = useState<Record<FezZoneId, string>>({
    east: '',
    central: '',
    south: '',
    north: '',
  });

  // مودالات الأسئلة 5 و 6 و 7
  const [codDetailsZone, setCodDetailsZone] = useState<FezZoneId | null>(null);
  const [copyFormatModalZone, setCopyFormatModalZone] = useState<FezZoneId | null>(null);
  const [closeTourZone, setCloseTourZone] = useState<FezZoneId | null>(null);
  const [isClosingTour, setIsClosingTour] = useState(false);

  // ─── جلب السائقين ومزامنتهم عند التحميل ───
  const loadDrivers = async () => {
    setIsDriversLoading(true);
    setIsInDriveLoading(true);
    try {
      const [storeRes, indriveRes] = await Promise.all([
        fetchStoreDrivers(),
        fetchInDriveDrivers(),
      ]);
      setDrivers(storeRes.drivers);
      setIsDriversSynced(storeRes.synced);
      setInDriveDrivers(indriveRes.drivers);
      setIsInDriveSynced(indriveRes.synced);
    } catch {
      showToast('error', 'تعذر تحميل بيانات السائقين');
    } finally {
      setIsDriversLoading(false);
      setIsInDriveLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleManualSync = async () => {
    if (activeFleetTab === 'indrive') {
      setIsInDriveSyncing(true);
      try {
        const res = await saveInDriveDrivers(inDriveDrivers);
        setIsInDriveSynced(res.synced);
        showToast(res.synced ? 'success' : 'error', res.message || 'تمت مزامنة أسطول inDrive سحابياً');
      } catch {
        showToast('error', 'فشلت المزامنة');
      } finally {
        setIsInDriveSyncing(false);
      }
    } else {
      setIsSyncing(true);
      try {
        const res = await saveStoreDrivers(drivers);
        setIsDriversSynced(res.synced);
        showToast(res.synced ? 'success' : 'error', res.message || 'تمت مزامنة الفريق الداخلي سحابياً');
      } catch {
        showToast('error', 'فشلت المزامنة');
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // ─── إضافة / تعديل سائق ───
  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name.trim() || !driverForm.phone.trim()) {
      showToast('error', 'يرجى إدخال اسم السائق ورقم الهاتف');
      return;
    }

    if (activeFleetTab === 'indrive') {
      if (editingDriver) {
        const res = await updateInDriveDriver(editingDriver.id, driverForm);
        if (res.success && res.driver) {
          setInDriveDrivers((prev) => prev.map((d) => (d.id === editingDriver.id ? res.driver! : d)));
          setIsInDriveSynced(res.synced);
          showToast('success', 'تم تعديل بيانات كابتن inDrive بنجاح');
        } else {
          showToast('error', res.message || 'فشل التعديل');
        }
        setEditingDriver(null);
      } else {
        const res = await addInDriveDriver(driverForm);
        if (res.success && res.driver) {
          setInDriveDrivers((prev) => [res.driver, ...prev]);
          setIsInDriveSynced(res.synced);
          showToast('success', `تمت إضافة كابتن inDrive ${res.driver.name} بنجاح`);
        } else {
          showToast('error', res.message || 'فشلت الإضافة');
        }
        setIsAddDriverOpen(false);
      }
    } else {
      if (editingDriver) {
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
    }

    setDriverForm({
      name: '',
      phone: '',
      vehicleType: activeFleetTab === 'indrive' ? 'car' : 'moto',
      zonePreference: 'all',
      status: 'available',
      commissionPerOrder: activeFleetTab === 'indrive' ? 22 : 11,
      vehiclePlate: '',
      address: '',
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
      address: driver.address || '',
      notes: driver.notes || '',
    });
  };

  const handleDeleteDriver = async () => {
    if (!deletingDriver) return;
    const isIndrive = inDriveDrivers.some((d) => d.id === deletingDriver.id) || deletingDriver.id.startsWith('indrive');
    if (isIndrive) {
      const res = await deleteInDriveDriver(deletingDriver.id);
      if (res.success) {
        setInDriveDrivers((prev) => prev.filter((d) => d.id !== deletingDriver.id));
        setIsInDriveSynced(res.synced);
        showToast('success', `تم حذف كابتن inDrive ${deletingDriver.name}`);
      } else {
        showToast('error', res.message || 'فشل الحذف');
      }
    } else {
      const res = await deleteStoreDriver(deletingDriver.id);
      if (res.success) {
        setDrivers((prev) => prev.filter((d) => d.id !== deletingDriver.id));
        setIsDriversSynced(res.synced);
        showToast('success', `تم حذف السائق ${deletingDriver.name}`);
      } else {
        showToast('error', res.message || 'فشل الحذف');
      }
    }
    setDeletingDriver(null);
  };

  const handleToggleDriverStatus = async (driver: StoreDriver, newStatus: DriverStatus) => {
    const isIndrive = inDriveDrivers.some((d) => d.id === driver.id) || driver.id.startsWith('indrive');
    if (isIndrive) {
      const res = await updateInDriveDriver(driver.id, { status: newStatus });
      if (res.success) {
        setInDriveDrivers((prev) =>
          prev.map((d) => (d.id === driver.id ? { ...d, status: newStatus } : d))
        );
        showToast('success', `تم تحديث حالة كابتن inDrive ${driver.name} إلى: ${STATUS_CONFIG[newStatus].label}`);
      }
    } else {
      const res = await updateStoreDriver(driver.id, { status: newStatus });
      if (res.success) {
        setDrivers((prev) =>
          prev.map((d) => (d.id === driver.id ? { ...d, status: newStatus } : d))
        );
        showToast('success', `تم تحديث حالة ${driver.name} إلى: ${STATUS_CONFIG[newStatus].label}`);
      }
    }
  };

  // ─── تجميع الطلبات غير الملغاة حسب مناطق فاس ───
  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
  const activeDeliveryOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'prepared'
  );
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const totalDriverCost = nonCancelledOrders.reduce(
    (sum, o) => sum + (o.delivery_dispatch?.deliveryCost ?? 11),
    0
  );
  const totalDeliveryRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.delivery_fee, 0);
  const netDeliveryProfit = totalDeliveryRevenue - totalDriverCost;

  // ═══════════════════════════════════════════════════════════════
  // ─── السؤال 1: الهيكل العام للمناطق (4 أعمدة: الشرقية، الوسطى، الجنوبية، الشمالية) ───
  // ═══════════════════════════════════════════════════════════════
  const zones: FezZoneId[] = ['east', 'central', 'south', 'north'];

  const zoneGroups: Record<FezZoneId, DbOrder[]> = {
    east: nonCancelledOrders.filter(
      (o) => (o.delivery_zone || o.delivery_dispatch?.zone) === 'east'
    ),
    central: nonCancelledOrders.filter(
      (o) => (o.delivery_zone || o.delivery_dispatch?.zone) === 'central'
    ),
    south: nonCancelledOrders.filter(
      (o) => (o.delivery_zone || o.delivery_dispatch?.zone) === 'south'
    ),
    north: nonCancelledOrders.filter(
      (o) => (o.delivery_zone || o.delivery_dispatch?.zone || 'north') === 'north'
    ),
  };

  // ألوان مميزة لكل منطقة (بنفسجي، أصفر/كهرماني، برتقالي، أخضر)
  const zoneStyles: Record<
    FezZoneId,
    {
      border: string;
      bg: string;
      badge: string;
      headerBg: string;
      accentText: string;
      tagColor: string;
    }
  > = {
    east: {
      border: 'border-purple-300 hover:border-purple-500',
      bg: 'bg-purple-50/60',
      badge: 'bg-purple-100 text-purple-900 border-purple-300',
      headerBg: 'bg-purple-600',
      accentText: 'text-purple-800',
      tagColor: 'text-purple-600',
    },
    central: {
      border: 'border-amber-300 hover:border-amber-500',
      bg: 'bg-amber-50/60',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      headerBg: 'bg-amber-600',
      accentText: 'text-amber-800',
      tagColor: 'text-amber-600',
    },
    south: {
      border: 'border-orange-300 hover:border-orange-500',
      bg: 'bg-orange-50/60',
      badge: 'bg-orange-100 text-orange-900 border-orange-300',
      headerBg: 'bg-orange-600',
      accentText: 'text-orange-800',
      tagColor: 'text-orange-600',
    },
    north: {
      border: 'border-emerald-300 hover:border-emerald-500',
      bg: 'bg-emerald-50/60',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      headerBg: 'bg-emerald-600',
      accentText: 'text-emerald-800',
      tagColor: 'text-emerald-600',
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

    const waypoints = zoneOrders
      .slice(0, zoneOrders.length - 1)
      .map((o) => encodeURIComponent(`${o.address}, فاس`))
      .join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
  };

  // ═══════════════════════════════════════════════════════════════
  // ─── السؤال 6: بناء قوالب النسخ الذكي (3 قوالب ديناميكية) ───
  // ═══════════════════════════════════════════════════════════════
  const buildTourMessage = (
    zoneKey: FezZoneId,
    format: 'driver_whatsapp' | 'indrive' | 'customers_sms',
    driver?: StoreDriver
  ): string => {
    const zoneOrders = zoneGroups[zoneKey];
    const zoneInfo = FEZ_DELIVERY_ZONES[zoneKey];
    const { totalCOD } = calculateZoneCOD(zoneOrders);
    const mapsRoute = generateGoogleMapsMultiStopUrl(zoneOrders);

    // 1. قالب السائق الداخلي (WhatsApp)
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
        const wage = zoneOrders.length * driver.commissionPerOrder;
        msg += `🛵 *أجرة الجولة المستحقة لك:* ${wage.toFixed(2)} د.م\n`;
        msg += `🏦 *الصافي لتوريده لصندوق المتجر:* ${(totalCOD - wage).toFixed(2)} د.م\n`;
      }
      msg += `\nطريق السلامة والتوفيق! 🌟🌿`;
      return msg;
    }

    // 2. قالب InDrive / تطبيقات النقل (المستوى الثاني - احتياطي)
    if (format === 'indrive') {
      const pricing = calculateDeliveryBatchPricing(zoneOrders.length);
      const captainName = driver?.name || 'كابتن inDrive';
      let msg = `السلام عليكم ${captainName} 🚗🌿\n`;
      msg += `طلب جولة توصيل متجر خُضرة بفاس (${zoneOrders.length} محطات)\n`;
      msg += `🧭 المنطقة: ${zoneInfo.name}\n`;
      msg += `💰 السعر المقترح للجولة: ${pricing.indriveMin} إلى ${pricing.indriveMax} درهم\n\n`;
      msg += `📍 نقطة الانطلاق (استلام الصناديق):\n`;
      msg += `🏪 ${STORE_PICKUP_HUB.name}\n`;
      msg += `🏠 ${STORE_PICKUP_HUB.address}\n\n`;
      msg += `📦 محطات التسليم المتتالية:\n`;
      zoneOrders.forEach((o, idx) => {
        msg += `\n───────────────\n`;
        msg += `محطة #${idx + 1} (${o.order_code}):\n`;
        msg += `👤 الزبون: ${o.customer_name}\n`;
        msg += `📞 الهاتف: ${o.phone}\n`;
        msg += `🏠 العنوان: ${o.address}\n`;
        if (o.maps_link) msg += `🗺️ رابط GPS: ${o.maps_link}\n`;
        msg += `💵 تحصيل COD: ${Number(o.total ?? 0).toFixed(2)} د.م\n`;
      });
      msg += `\n───────────────\n`;
      msg += `💰 إجمالي مبالغ التحصيل (COD): ${totalCOD.toFixed(2)} د.م\n`;
      msg += `يرجى التواصل للتأكيد والانطلاق الفوري. شكراً لك! 🌿`;
      return msg;
    }

    // 3. قالب إشعار الزبائن
    let msg = `📢 *إشعار خروج الجولة لزبائن ${zoneInfo.name}:*\n`;
    zoneOrders.forEach((o, idx) => {
      msg += `\n${idx + 1}. الزبون: ${o.customer_name} (${o.order_code})\n`;
      msg += `   📞 الهاتف: ${o.phone}\n`;
      msg += `   💬 الرسالة:\n`;
      msg += `   "مرحباً بك، طلبك من خُضرة (${o.order_code}) خرج الآن في جولة التوصيل وسيكون عندك خلال ${zoneInfo.targetTime}. المبلغ المطلوب عند الاستلام: ${o.total.toFixed(2)} د.م. شكراً لثقتك بنا 🌿"\n`;
    });
    return msg;
  };

  // ─── نسخ النص إلى الحافظة مع رسالة "تم النسخ بنجاح" ───
  const handleCopyTemplate = async (text: string, templateKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTemplateName(templateKey);
      showToast('success', 'تم النسخ بنجاح');
      setTimeout(() => setCopiedTemplateName(null), 2500);
    } catch {
      showToast('error', 'تعذر النسخ، يرجى المحاولة يدوياً');
    }
  };

  // ─── إرسال الجولة للسائق المحدد (الداخلي أو inDrive) عبر WhatsApp ───
  const handleSendToDriverWhatsApp = (zoneKey: FezZoneId) => {
    const internalDriverId = selectedDriverForZone[zoneKey];
    const internalDriver = drivers.find((d) => d.id === internalDriverId);

    const indriveDriverId = selectedInDriveDriverForZone[zoneKey];
    const indriveDriver = inDriveDrivers.find((d) => d.id === indriveDriverId);

    const zoneOrders = zoneGroups[zoneKey];
    if (zoneOrders.length === 0) {
      showToast('error', 'لا توجد طلبات في هذه المنطقة لإرسالها');
      return;
    }

    // إذا تم تعيين كابتن inDrive فقط
    if (indriveDriver && !internalDriver) {
      const message = buildTourMessage(zoneKey, 'indrive', indriveDriver);
      const targetPhone = cleanPhoneForWhatsApp(indriveDriver.phone);
      if (targetPhone) {
        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank');
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      }
      showToast('success', `تم فتح واتساب لإرسال الجولة لكابتن inDrive (${indriveDriver.name})`);
      return;
    }

    // إذا تم تعيين سائق داخلي (أو الخيار الافتراضي)
    const driver = internalDriver || indriveDriver;
    const isIndrive = Boolean(!internalDriver && indriveDriver);
    const format = isIndrive ? 'indrive' : 'driver_whatsapp';
    const message = buildTourMessage(zoneKey, format, driver);
    const targetPhone = driver ? cleanPhoneForWhatsApp(driver.phone) : '';

    if (!targetPhone) {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank');
    }
    showToast('success', `تم فتح واتساب لإرسال الجولة إلى ${driver?.name || 'السائق'}`);
  };

  // ─── الحل المطلوب 1: تعيين كابتن inDrive للجولة وحساب الأجور في الخفاء وربط الأحداث ───
  const handleSelectInDriveDriverForZone = async (zoneKey: FezZoneId, driverId: string) => {
    setSelectedInDriveDriverForZone((prev) => ({ ...prev, [zoneKey]: driverId }));
    const driver = inDriveDrivers.find((d) => d.id === driverId);
    if (!driver) return;

    const zoneOrders = zoneGroups[zoneKey];
    if (zoneOrders.length === 0) return;

    // حساب الأجور التقديرية في الخفاء بناءً على حجم الجولة (بدون إظهار معادلات في الواجهة)
    const pricing = calculateDeliveryBatchPricing(zoneOrders.length);
    const costPerOrder = Math.round((pricing.indriveMin + pricing.indriveMax) / (zoneOrders.length * 2));

    try {
      for (const ord of zoneOrders) {
        const currentDispatch = ord.delivery_dispatch || {
          provider: 'indrive',
          dispatchStatus: 'in_transit',
        };
        await updateOrderDispatch(ord.id, ord.order_code, {
          ...currentDispatch,
          provider: 'indrive',
          dispatchStatus: 'in_transit',
          driverName: driver.name,
          driverPhone: driver.phone,
          deliveryCost: costPerOrder,
          zone: zoneKey,
        });
      }
      if (onRefreshOrders) {
        onRefreshOrders();
      }
      showToast('success', `تم تعيين كابتن inDrive ${driver.name} لجولة ${FEZ_DELIVERY_ZONES[zoneKey].name} بنجاح`);
    } catch (err) {
      console.warn('Failed to update dispatch for inDrive assignment:', err);
    }
  };

  // ─── تعيين السائق الداخلي للطلبات وربط الأحداث مع إدارة الطلبات ───
  const handleSelectStoreDriverForZone = async (zoneKey: FezZoneId, driverId: string) => {
    setSelectedDriverForZone((prev) => ({ ...prev, [zoneKey]: driverId }));
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) return;

    const zoneOrders = zoneGroups[zoneKey];
    if (zoneOrders.length === 0) return;

    try {
      for (const ord of zoneOrders) {
        const currentDispatch = ord.delivery_dispatch || {
          provider: 'custom',
          dispatchStatus: 'in_transit',
        };
        await updateOrderDispatch(ord.id, ord.order_code, {
          ...currentDispatch,
          provider: 'custom',
          dispatchStatus: 'in_transit',
          driverName: driver.name,
          driverPhone: driver.phone,
          deliveryCost: driver.commissionPerOrder || 11,
          zone: zoneKey,
        });
      }
      if (onRefreshOrders) {
        onRefreshOrders();
      }
      showToast('success', `تم تعيين السائق ${driver.name} لجولة ${FEZ_DELIVERY_ZONES[zoneKey].name} بنجاح`);
    } catch (err) {
      console.warn('Failed to dispatch internal driver to zone orders:', err);
    }
  };

  // ─── فتح مسار خرائط جوجل ───
  const handleOpenGoogleMapsRoute = (zoneKey: FezZoneId) => {
    const zoneOrders = zoneGroups[zoneKey];
    if (zoneOrders.length === 0) {
      showToast('error', 'لا توجد طلبات لتوليد المسار');
      return;
    }
    const url = generateGoogleMapsMultiStopUrl(zoneOrders);
    window.open(url, '_blank');
    showToast('success', `تم فتح مسار خرائط Google (${zoneOrders.length} محطات)`);
  };

  // ═══════════════════════════════════════════════════════════════
  // ─── السؤال 7: تنفيذ إغلاق الجولة وتأكيد التسليم ونقل الطلبات ───
  // ═══════════════════════════════════════════════════════════════
  const handleConfirmCloseTour = async () => {
    if (!closeTourZone) return;
    const zoneKey = closeTourZone;
    const zoneOrders = zoneGroups[zoneKey];
    const driverId = selectedDriverForZone[zoneKey];
    const driver = drivers.find((d) => d.id === driverId) || null;

    if (zoneOrders.length === 0) {
      showToast('error', 'لا توجد طلبات في هذه المنطقة لإغلاقها');
      setCloseTourZone(null);
      return;
    }

    setIsClosingTour(true);
    try {
      const res = await closeAndDeliverZoneTour({
        orders: zoneOrders,
        driver,
        zoneKey,
      });

      if (res.success) {
        showToast('success', 'تم إغلاق الجولة وتأكيد تسليم الطلبات بنجاح!');
        // تحديث حالة السائق محلياً
        if (driver) {
          setDrivers((prev) =>
            prev.map((d) =>
              d.id === driver.id
                ? {
                    ...d,
                    status: 'available',
                    totalDeliveredCount: (d.totalDeliveredCount || 0) + zoneOrders.length,
                    activeOrdersCount: 0,
                  }
                : d
            )
          );
        }
        // تحديث الطلبات في أداة إدارة الطلبات
        if (onRefreshOrders) {
          onRefreshOrders();
        }
      } else {
        showToast('error', res.message || 'فشل إغلاق الجولة');
      }
    } catch (err: any) {
      showToast('error', 'حدث خطأ أثناء إغلاق الجولة');
    } finally {
      setIsClosingTour(false);
      setCloseTourZone(null);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* ═══════════ مؤشرات الأداء (KPIs) ═══════════ */}
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
            <span>وقت التوصيل المستهدف</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950 tabular-nums">
            20 - 40 <span className="text-sm font-normal">دقيقة</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">حسب المنطقة الجغرافية بفاس</p>
        </div>

        <div className="bg-white border-2 border-blue-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-blue-800 font-bold mb-1">
            <span>تكلفة أجور السائقين</span>
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-950 tabular-nums">
            {totalDriverCost.toFixed(0)} <span className="text-sm font-normal">د.م</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            داخلي: 9-13 د.م • تطبيقات: 20-25 د.م
          </p>
        </div>

        <div className="bg-white border-2 border-stone-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-700 font-bold mb-1">
            <span>صافي التوصيل للمتجر</span>
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
          <p className="text-[11px] text-stone-500 mt-1">عائد رسوم التوصيل المباشر</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          السؤال 1 & السؤال 2: الهيكل العام للمناطق (4 أعمدة Grid Layout)
          + بطاقة الجولة (Route Card)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-3 border-b border-stone-200">
          <div>
            <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-700" />
              <span>إدارة مسارات التوصيل والجولات • مدينة فاس</span>
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              4 مناطق جغرافية (الشرقية، الوسطى، الجنوبية، الشمالية) • تعيين السائقين الذكي • حساب COD • تسليم الطلبات الفوري
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>نقطة الانطلاق: مقر خُضرة / سوق الجملة بنسودة</span>
          </div>
        </div>

        {/* ─── شبكة الـ 4 أعمدة المتجاوبة (Responsive Grid Layout) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zoneKey) => {
            const info = FEZ_DELIVERY_ZONES[zoneKey];
            const styles = zoneStyles[zoneKey];
            const zoneOrders = zoneGroups[zoneKey];
            const { totalCOD, ordersCount } = calculateZoneCOD(zoneOrders);

            // تطبيق دالة تصفية وفرز السائقين (السؤال 4)
            const sortedDrivers = getSortedDriversForZone(zoneKey, drivers);
            const sortedInDriveDrivers = getSortedDriversForZone(zoneKey, inDriveDrivers);

            return (
              <div
                key={zoneKey}
                className={`border-2 ${styles.border} rounded-2xl p-4 ${styles.bg} flex flex-col justify-between shadow-xs transition-all`}
              >
                <div>
                  {/* ترويسة البطاقة: اسم المنطقة والوقت المتوقع */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${styles.badge}`}>
                      {info.name}
                    </span>
                    <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-stone-200">
                      <Clock className="w-3 h-3 text-stone-500" />
                      <span>{info.targetTime}</span>
                    </span>
                  </div>

                  {/* أحياء المنطقة */}
                  <p className="text-xs text-stone-700 font-semibold mb-3 line-clamp-2 min-h-[32px]">
                    {info.neighborhoods.slice(0, 4).join(' • ')}
                  </p>

                  {/* صندوق الإحصائيات: الطلبات الجاهزة و COD والقوائم المنسدلة */}
                  <div className="bg-white border border-stone-200 rounded-xl p-3 mb-3 text-xs space-y-2.5 shadow-2xs">
                    {/* عدد الطلبات الجاهزة */}
                    <div className="flex justify-between items-center font-bold text-stone-800">
                      <span>الطلبات الجاهزة للتوصيل:</span>
                      <span className="font-black tabular-nums text-sm px-2 py-0.5 rounded-md bg-stone-100 text-stone-900 border border-stone-200">
                        {ordersCount} طلبات
                      </span>
                    </div>

                    {/* السؤال 5: مجموع التحصيل (COD) مع زر "عرض التفاصيل" */}
                    <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                      <div className="flex items-center gap-1 text-[11px] text-stone-600">
                        <span>مجموع التحصيل (COD):</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-stone-900 text-sm font-black tabular-nums">
                          {totalCOD.toFixed(2)} د.م
                        </strong>
                        <button
                          type="button"
                          disabled={ordersCount === 0}
                          onClick={() => setCodDetailsZone(zoneKey)}
                          className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center gap-0.5 border border-stone-300 transition-colors cursor-pointer disabled:opacity-40"
                          title="عرض تفاصيل التحصيل لكل طلب لتجنب الأخطاء المحاسبية"
                        >
                          <Eye className="w-3 h-3 text-stone-600" />
                          <span>عرض التفاصيل</span>
                        </button>
                      </div>
                    </div>

                    {/* السؤال 4: قائمة منسدلة لاختيار سائق من الفريق */}
                    <div className="pt-2 border-t border-stone-100">
                      <label className="block text-[11px] font-black text-stone-700 mb-1">
                        تعيين سائق الجولة (فريق المتجر الداخلي):
                      </label>
                      <select
                        value={selectedDriverForZone[zoneKey] || ''}
                        onChange={(e) => handleSelectStoreDriverForZone(zoneKey, e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white font-bold text-stone-800 focus:outline-emerald-600"
                      >
                        <option value="">-- اختر سائقاً من الفريق الداخلي --</option>
                        {sortedDrivers.map(({ driver, isPreferred, isDisabled, disabledReason }) => (
                          <option
                            key={driver.id}
                            value={driver.id}
                            disabled={isDisabled}
                            className={
                              isDisabled
                                ? 'text-stone-400 bg-stone-100'
                                : isPreferred
                                ? 'font-black text-purple-900 bg-purple-50'
                                : 'text-stone-800'
                            }
                          >
                            {isPreferred ? '⭐ ' : ''}
                            {driver.name}
                            {isPreferred ? ` (المفضلة: ${info.name})` : ''}
                            {isDisabled
                              ? ` ⛔ غير متاح (${disabledReason})`
                              : ` متاح (${driver.commissionPerOrder} د.م)`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ─── الحل المطلوب 1: تعيين سائق الجولة ( inDrive ) ─── */}
                    <div className="pt-2 border-t border-amber-200">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-black text-amber-950 flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-amber-700" />
                          <span>تعيين سائق الجولة ( inDrive ):</span>
                        </label>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          احتياطي
                        </span>
                      </div>
                      <select
                        value={selectedInDriveDriverForZone[zoneKey] || ''}
                        onChange={(e) => handleSelectInDriveDriverForZone(zoneKey, e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-amber-300 bg-amber-50/40 font-bold text-stone-800 focus:outline-amber-600"
                      >
                        <option value="">-- اختر سائقاً من inDrive --</option>
                        {sortedInDriveDrivers.map(({ driver, isPreferred, isDisabled, disabledReason }) => (
                          <option
                            key={driver.id}
                            value={driver.id}
                            disabled={isDisabled}
                            className={
                              isDisabled
                                ? 'text-stone-400 bg-stone-100'
                                : isPreferred
                                ? 'font-black text-amber-950 bg-amber-100'
                                : 'text-stone-800'
                            }
                          >
                            {isPreferred ? '⭐ ' : ''}
                            {driver.name}
                            {isPreferred ? ` (المفضلة: ${info.name})` : ''}
                            {isDisabled
                              ? ` ⛔ غير متاح (${disabledReason})`
                              : ` متاح (${driver.vehiclePlate || 'سيارة'})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ─── أزرار بطاقة الجولة (Question 2) ─── */}
                <div className="space-y-2 pt-1">
                  {/* أزرار في الأسفل (Grid cols 2): واتساب وخرائط جوجل */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={ordersCount === 0}
                      onClick={() => handleSendToDriverWhatsApp(zoneKey)}
                      className="py-2 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
                      title="إرسال تفاصيل الجولة والمحطات للسائق الداخلي عبر واتساب"
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">إرسال (WhatsApp)</span>
                    </button>

                    <button
                      type="button"
                      disabled={ordersCount === 0}
                      onClick={() => handleOpenGoogleMapsRoute(zoneKey)}
                      className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="فتح مسار الملاحة متعدد المحطات في خرائط Google"
                    >
                      <Compass className="w-3.5 h-3.5 shrink-0 text-amber-200" />
                      <span className="truncate">مسار خرائط Google</span>
                    </button>
                  </div>

                  {/* ملاحظة السؤال 2: إلغاء زر اعتماد الجولة واستبداله بزر: "إغلاق الجولة وتأكيد التسليم" بتصميم ثانوي */}
                  <button
                    type="button"
                    disabled={ordersCount === 0}
                    onClick={() => setCloseTourZone(zoneKey)}
                    className="w-full py-2 px-3 rounded-xl border-2 border-stone-300 hover:border-emerald-600 bg-stone-100 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    title="تأكيد تسليم طلبات هذه الجولة وتحديثها إلى 'تم التسليم'"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>إغلاق الجولة وتأكيد التسليم</span>
                  </button>

                  {/* أزرار مساعدة إضافية: مانيفست A4 وقوالب النسخ الذكي */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      disabled={ordersCount === 0}
                      onClick={() => {
                        const driverId = selectedDriverForZone[zoneKey];
                        const driver = drivers.find((d) => d.id === driverId) || null;
                        setSelectedDriverForManifest(driver);
                        setManifestZone(zoneKey);
                      }}
                      className="py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                      title="طباعة بوليصة ومانيفست A4 رسمي للتسليم"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-300" />
                      <span>مانيفست A4</span>
                    </button>

                    <button
                      type="button"
                      disabled={ordersCount === 0}
                      onClick={() => setCopyFormatModalZone(zoneKey)}
                      className="py-1.5 px-2 rounded-lg bg-white hover:bg-stone-100 disabled:opacity-40 border border-stone-300 text-stone-800 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                      title="فتح القوالب الذكية الثلاثة الجاهزة للنسخ"
                    >
                      <Copy className="w-3.5 h-3.5 text-stone-600" />
                      <span>قوالب النسخ 📋</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          السؤال 3 & الحل المطلوب 2: أسطول سائقي التوصيل (الداخلي + inDrive)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-2 border-[#163920]/20 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              activeFleetTab === 'indrive' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {activeFleetTab === 'indrive' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                <span>{activeFleetTab === 'indrive' ? 'أسطول سائقي تطبيقات التوصيل السريعة (inDrive)' : 'فريق التوصيل الداخلي لمتجر خُضرة'}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeFleetTab === 'indrive' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {activeFleetTab === 'indrive' ? `${inDriveDrivers.length} كباتن inDrive` : `${drivers.length} سائقين`}
                </span>
              </h3>
              <p className="text-[11px] text-stone-500">
                {activeFleetTab === 'indrive'
                  ? 'إدارة كباتن التطبيقات السريعة، أرقام اللوحات، التوصيل الاحتياطي والمزامنة الفورية'
                  : 'إدارة السائقين التابعين للمتجر، مناطق العمل المفضلة، تفاصيل المركبة، والتواصل الفوري'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={activeFleetTab === 'indrive' ? isInDriveSyncing : isSyncing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                (activeFleetTab === 'indrive' ? isInDriveSynced : isDriversSynced)
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title="مزامنة فورية مع السيرفر السحابي والتخزين المحلي"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(activeFleetTab === 'indrive' ? isInDriveSyncing : isSyncing) ? 'animate-spin' : ''}`} />
              <span>
                {(activeFleetTab === 'indrive' ? isInDriveSynced : isDriversSynced)
                  ? 'متزامن سحابياً'
                  : 'مزامنة فورية'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingDriver(null);
                setDriverForm({
                  name: '',
                  phone: '',
                  vehicleType: activeFleetTab === 'indrive' ? 'car' : 'moto',
                  zonePreference: 'all',
                  status: 'available',
                  commissionPerOrder: activeFleetTab === 'indrive' ? 22 : 11,
                  vehiclePlate: '',
                  address: '',
                  notes: '',
                });
                setIsAddDriverOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer ${
                activeFleetTab === 'indrive'
                  ? 'bg-stone-900 hover:bg-black text-[#F5D76E]'
                  : 'bg-[#163920] hover:bg-[#0E2615]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{activeFleetTab === 'indrive' ? 'إضافة كابتن inDrive جديد' : 'إضافة سائق جديد'}</span>
            </button>
          </div>
        </div>

        {/* ─── تبويب التبديل بين الأسطولين ─── */}
        <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200 mt-3">
          <button
            type="button"
            onClick={() => setActiveFleetTab('internal')}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeFleetTab === 'internal'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-300'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bike className="w-4 h-4 text-emerald-600" />
            <span>فريق المتجر الداخلي (الأساسي)</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
              {drivers.length} سائقين
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFleetTab('indrive')}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeFleetTab === 'indrive'
                ? 'bg-white text-amber-950 shadow-sm border border-amber-300'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Car className="w-4 h-4 text-amber-600" />
            <span>أسطول سائقي تطبيقات التوصيل السريعة (inDrive)</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px]">
              {inDriveDrivers.length} كباتن
            </span>
          </button>
        </div>

        {/* شبكة بطاقات السائقين (Driver Cards) */}
        {(activeFleetTab === 'internal' ? isDriversLoading : isInDriveLoading) ? (
          <div className="py-8 text-center text-xs text-stone-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>جاري تحميل بيانات السائقين...</span>
          </div>
        ) : (activeFleetTab === 'internal' ? drivers : inDriveDrivers).length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl my-3">
            <p className="font-bold text-stone-700">
              {activeFleetTab === 'internal'
                ? 'لم يتم إضافة أي سائقين في الفريق الداخلي بعد.'
                : 'لم يتم إضافة أي كباتن في أسطول inDrive بعد.'}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              انقر على زر "إضافة {activeFleetTab === 'indrive' ? 'كابتن inDrive جديد' : 'سائق جديد'}" لتسجيل أول مندوب توصيل.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-3.5">
            {(activeFleetTab === 'internal' ? drivers : inDriveDrivers).map((driver) => {
              const vehicle = VEHICLE_CONFIG[driver.vehicleType] || VEHICLE_CONFIG.moto;
              const status = STATUS_CONFIG[driver.status] || STATUS_CONFIG.available;
              const cleanPhone = cleanPhoneForWhatsApp(driver.phone);
              const isIndriveCaptain = activeFleetTab === 'indrive';

              return (
                <div
                  key={driver.id}
                  className={`border-2 rounded-xl p-3.5 transition-all flex flex-col justify-between shadow-xs ${
                    isIndriveCaptain
                      ? 'border-amber-200 hover:border-amber-400 bg-amber-50/40 hover:bg-white'
                      : 'border-stone-200 hover:border-emerald-300 bg-stone-50/70 hover:bg-white'
                  }`}
                >
                  <div>
                    {/* ترويسة بطاقة السائق: الاسم والحالة */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl" title={vehicle.label}>
                          {vehicle.icon}
                        </span>
                        <div>
                          <span className="text-xs font-black text-stone-900 block leading-tight">{driver.name}</span>
                          {isIndriveCaptain && (
                            <span className="text-[9px] font-bold text-amber-800">كابتن inDrive</span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span>{status.label}</span>
                      </span>
                    </div>

                    {/* تفاصيل بطاقة السائق المطلوبة في السؤال 3:
                        الاسم، الحالة، رقم الهاتف، أجرة الطلب، المنطقة المفضلة، رقم اللوحة، والعنوان */}
                    <div className="space-y-1.5 text-xs text-stone-600 mb-3 bg-white p-2.5 rounded-lg border border-stone-200">
                      {/* رقم الهاتف */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-stone-500">رقم الهاتف:</span>
                        <span className="font-mono font-bold text-stone-900 text-left" dir="ltr">
                          {driver.phone}
                        </span>
                      </div>

                      {/* أجرة الطلب */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">أجرة الطلب:</span>
                        <strong className="text-emerald-800 tabular-nums">
                          {driver.commissionPerOrder} د.م
                        </strong>
                      </div>

                      {/* المنطقة المفضلة */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">المنطقة المفضلة:</span>
                        <span className="font-bold text-stone-900">
                          {driver.zonePreference === 'all'
                            ? 'جميع أحياء فاس'
                            : FEZ_DELIVERY_ZONES[driver.zonePreference]?.name || 'عام'}
                        </span>
                      </div>

                      {/* رقم اللوحة */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">رقم اللوحة:</span>
                        <span className="font-mono font-bold text-stone-800" dir="ltr">
                          {driver.vehiclePlate || 'غير محدد'}
                        </span>
                      </div>

                      {/* العنوان ومكان الإقامة بفاس */}
                      <div className="flex items-start justify-between text-[11px] pt-1 border-t border-stone-100">
                        <span className="text-stone-500 shrink-0">العنوان:</span>
                        <span className="font-bold text-stone-800 text-left line-clamp-1 pr-1">
                          {driver.address || 'فاس'}
                        </span>
                      </div>

                      {driver.notes && (
                        <p className="text-[10px] text-stone-500 italic mt-1 line-clamp-1 border-t border-stone-100 pt-1">
                          {driver.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* إجراءات السائق */}
                  <div className="space-y-2 pt-1 border-t border-stone-200">
                    {/* مفاتيح الحالة السريعة */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleToggleDriverStatus(driver, 'available')}
                        className={`flex-1 py-1 rounded text-center font-bold transition-colors cursor-pointer ${
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
                        className={`flex-1 py-1 rounded text-center font-bold transition-colors cursor-pointer ${
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
                        className={`flex-1 py-1 rounded text-center font-bold transition-colors cursor-pointer ${
                          driver.status === 'off_duty'
                            ? 'bg-stone-700 text-white'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                      >
                        خارج
                      </button>
                    </div>

                    {/* السؤال 3: 4 أزرار صغيرة في الأسفل (Grid cols 4): اتصال، واتساب، تعديل، حذف */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {/* 1. اتصال */}
                      <a
                        href={`tel:${driver.phone}`}
                        className="py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 transition-colors flex items-center justify-center font-bold text-[11px]"
                        title="اتصال هاتفي بالسائق"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      {/* 2. واتساب */}
                      <a
                        href={cleanPhone ? `https://wa.me/${cleanPhone}` : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors flex items-center justify-center font-bold text-[11px]"
                        title="محادثة واتساب مباشرة"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>

                      {/* 3. تعديل */}
                      <button
                        type="button"
                        onClick={() => handleStartEditDriver(driver)}
                        className="py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 transition-colors flex items-center justify-center font-bold text-[11px] cursor-pointer"
                        title="تعديل بيانات السائق"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* 4. حذف */}
                      <button
                        type="button"
                        onClick={() => setDeletingDriver(driver)}
                        className="py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors flex items-center justify-center font-bold text-[11px] cursor-pointer"
                        title="حذف السائق من الفريق"
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

      {/* ═══════════ شركات وتطبيقات التوصيل الخارجي بفاس ═══════════ */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h3 className="font-black text-base text-stone-900 mb-1 flex items-center gap-2">
          <Bike className="w-5 h-5 text-emerald-600" />
          <span>خيارات النقل والتوصيل السريع بفاس (inDrive + DONE + Yassir + Glovo)</span>
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

      {/* ═══════════════════════════════════════════════════════════════
          السؤال 5: نافذة منبثقة لتفاصيل التحصيل النقدي (COD Details Modal)
      ═══════════════════════════════════════════════════════════════ */}
      {codDetailsZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-right">
            <div className="p-4 bg-gradient-to-l from-emerald-800 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-black text-base">
                    تفاصيل مبالغ التحصيل النقدي (COD) • {FEZ_DELIVERY_ZONES[codDetailsZone]?.name}
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    كشف محاسبي دقيق لكل طلب على حدة لمنع أي خطأ مالي أثناء التسليم
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCodDetailsZone(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {(() => {
                const zoneOrders = zoneGroups[codDetailsZone];
                const { totalCOD, totalDeliveryFees, totalSubtotal, ordersCount } =
                  calculateZoneCOD(zoneOrders);

                if (ordersCount === 0) {
                  return (
                    <div className="py-8 text-center text-stone-500 bg-stone-50 rounded-xl">
                      لا توجد طلبات في هذه المنطقة حالياً.
                    </div>
                  );
                }

                return (
                  <>
                    <div className="overflow-x-auto border border-stone-200 rounded-xl">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                          <tr>
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">رقم الطلب</th>
                            <th className="p-2.5">الزبون</th>
                            <th className="p-2.5">العنوان / الحي</th>
                            <th className="p-2.5">طريقة الدفع</th>
                            <th className="p-2.5 text-left">مبلغ COD</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                          {zoneOrders.map((ord, idx) => (
                            <tr key={ord.id} className="hover:bg-emerald-50/40">
                              <td className="p-2.5 font-mono text-stone-400">{idx + 1}</td>
                              <td className="p-2.5 font-mono font-bold text-stone-900">
                                {ord.order_code}
                              </td>
                              <td className="p-2.5">
                                <div className="font-bold text-stone-900">{ord.customer_name}</div>
                                <div className="font-mono text-[10px] text-stone-500" dir="ltr">
                                  {ord.phone}
                                </div>
                              </td>
                              <td className="p-2.5 max-w-[160px] truncate" title={ord.address}>
                                {ord.address}
                              </td>
                              <td className="p-2.5">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  دفع عند الاستلام
                                </span>
                              </td>
                              <td className="p-2.5 text-left font-black text-emerald-800 tabular-nums">
                                {ord.total.toFixed(2)} د.م
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* الملخص المحاسبي الإجمالي */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>إجمالي قيمة المنتجات (Subtotal):</span>
                        <span className="font-bold tabular-nums">{totalSubtotal.toFixed(2)} د.م</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>إجمالي رسوم التوصيل:</span>
                        <span className="font-bold tabular-nums">
                          {totalDeliveryFees.toFixed(2)} د.م
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-stone-200 font-black text-sm text-stone-900">
                        <span>مجموع التحصيل النقدي المطلوب من السائق (COD):</span>
                        <span className="text-base text-emerald-800 tabular-nums">
                          {totalCOD.toFixed(2)} د.م
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setCodDetailsZone(null)}
                className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          السؤال 6: نافذة منبثقة لقوالب النسخ الذكي (3 قوالب)
      ═══════════════════════════════════════════════════════════════ */}
      {copyFormatModalZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 border border-stone-200 shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-emerald-700" />
                <h4 className="font-black text-base text-stone-900">
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
              اختر القالب المطلوب وانسخه بنقرة واحدة للحافظة مع إشعار فوري:
            </p>

            <div className="space-y-3">
              {/* 1. قالب السائق الداخلي */}
              <div className="border-2 border-emerald-200 rounded-xl p-3.5 bg-emerald-50/50 hover:bg-emerald-50 transition-all flex flex-col justify-between gap-2">
                <div>
                  <strong className="text-xs font-black text-emerald-950 block">
                    1. قالب السائق الداخلي (WhatsApp)
                  </strong>
                  <span className="text-[11px] text-stone-600 block mt-0.5">
                    يشمل أسماء الزبائن، الهواتف، العناوين، رابط GPS، ومبالغ COD والإجمالي.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const driverId = selectedDriverForZone[copyFormatModalZone];
                    const driver = drivers.find((d) => d.id === driverId);
                    const txt = buildTourMessage(copyFormatModalZone, 'driver_whatsapp', driver);
                    handleCopyTemplate(txt, 'driver_whatsapp');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedTemplateName === 'driver_whatsapp' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>تم النسخ بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ قالب السائق الداخلي</span>
                    </>
                  )}
                </button>
              </div>

              {/* 2. قالب InDrive / تطبيقات النقل */}
              <div className="border-2 border-amber-200 rounded-xl p-3.5 bg-amber-50/50 hover:bg-amber-50 transition-all flex flex-col justify-between gap-2">
                <div>
                  <strong className="text-xs font-black text-amber-950 block">
                    2. قالب InDrive / تطبيقات النقل
                  </strong>
                  <span className="text-[11px] text-stone-600 block mt-0.5">
                    مختصر لنقطة الانطلاق (سوق الجملة بنسودة) والمحطات المتتابعة ومجموع المبالغ.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const txt = buildTourMessage(copyFormatModalZone, 'indrive');
                    handleCopyTemplate(txt, 'indrive');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedTemplateName === 'indrive' ? (
                    <>
                      <Check className="w-4 h-4 text-amber-200" />
                      <span>تم النسخ بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ قالب inDrive</span>
                    </>
                  )}
                </button>
              </div>

              {/* 3. قالب إشعار الزبائن */}
              <div className="border-2 border-blue-200 rounded-xl p-3.5 bg-blue-50/50 hover:bg-blue-50 transition-all flex flex-col justify-between gap-2">
                <div>
                  <strong className="text-xs font-black text-blue-950 block">
                    3. قالب إشعار الزبائن بخروج الجولة
                  </strong>
                  <span className="text-[11px] text-stone-600 block mt-0.5">
                    رسائل جاهزة لإعلام الزبائن بخروج الجولة مع المبلغ والتوقيت المتوقع.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const txt = buildTourMessage(copyFormatModalZone, 'customers_sms');
                    handleCopyTemplate(txt, 'customers_sms');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedTemplateName === 'customers_sms' ? (
                    <>
                      <Check className="w-4 h-4 text-blue-200" />
                      <span>تم النسخ بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ رسائل إشعار الزبائن</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          السؤال 7: مودال تأكيد إغلاق الجولة وإتمام تسليم الطلبات
      ═══════════════════════════════════════════════════════════════ */}
      {closeTourZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 text-right space-y-4 border border-stone-200 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h4 className="font-black text-base text-stone-900">
                إغلاق جولة {FEZ_DELIVERY_ZONES[closeTourZone]?.name} وتأكيد التسليم؟
              </h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                سيتم تحديث جميع الطلبات المرتبطة بهذه الجولة ({zoneGroups[closeTourZone].length} طلبات)
                إلى حالة <strong>"تم التسليم"</strong> في أداة إدارة الطلبات لتأكيد الدفع ومراسلة الزبائن للتقييم.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>المنطقة:</span>
                <span className="font-bold text-stone-900">
                  {FEZ_DELIVERY_ZONES[closeTourZone]?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>عدد الطلبات:</span>
                <span className="font-bold text-stone-900">
                  {zoneGroups[closeTourZone].length} طلبات
                </span>
              </div>
              <div className="flex justify-between">
                <span>مجموع التحصيل (COD):</span>
                <strong className="text-emerald-800 tabular-nums">
                  {calculateZoneCOD(zoneGroups[closeTourZone]).totalCOD.toFixed(2)} د.م
                </strong>
              </div>
              <div className="flex justify-between">
                <span>السائق المعين:</span>
                <span className="font-bold text-stone-900">
                  {drivers.find((d) => d.id === selectedDriverForZone[closeTourZone])?.name ||
                    inDriveDrivers.find((d) => d.id === selectedInDriveDriverForZone[closeTourZone])?.name ||
                    'فريق خُضرة / inDrive'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={isClosingTour}
                onClick={() => setCloseTourZone(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-xs cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                disabled={isClosingTour}
                onClick={handleConfirmCloseTour}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {isClosingTour ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري تأكيد التسليم وإغلاق الجولة...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تأكيد إغلاق الجولة وإتمام التسليم</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ مودال إضافة / تعديل سائق (يشمل حقل العنوان) ═══════════ */}
      {(isAddDriverOpen || editingDriver) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-right">
            <div className={`p-4 text-white flex items-center justify-between ${
              activeFleetTab === 'indrive'
                ? 'bg-gradient-to-l from-amber-800 to-stone-900'
                : 'bg-gradient-to-l from-[#163920] to-[#0E2615]'
            }`}>
              <div className="flex items-center gap-2">
                {activeFleetTab === 'indrive' ? (
                  <Car className="w-5 h-5 text-amber-400" />
                ) : (
                  <Bike className="w-5 h-5 text-[#F5D76E]" />
                )}
                <h3 className="font-black text-base">
                  {editingDriver
                    ? `تعديل بيانات: ${editingDriver.name}`
                    : activeFleetTab === 'indrive'
                    ? 'إضافة كابتن inDrive جديد (أسطول التطبيقات)'
                    : 'إضافة سائق جديد للفريق'}
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
                    <option value="east">🟣 المنطقة الشرقية (الزهور/فاس البالي)</option>
                    <option value="central">🟡 المنطقة الوسطى (الأطلس/فلورنس)</option>
                    <option value="south">🟠 المنطقة الجنوبية (بنسودة/زواغة)</option>
                    <option value="north">🟢 المنطقة الشمالية (سايس/النرجس)</option>
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

              {/* السؤال 3: حقل العنوان */}
              <div>
                <label className="block text-[11px] font-black text-stone-700 mb-1">
                  عنوان السائق / الحي المقيم به في فاس:
                </label>
                <input
                  type="text"
                  value={driverForm.address}
                  onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                  placeholder="مثال: حي الأطلس، قرب ساحة العلويين، فاس"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-emerald-600 font-bold"
                />
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
              <h4 className="font-black text-base text-stone-900">
                {deletingDriver.id.startsWith('indrive') || inDriveDrivers.some((d) => d.id === deletingDriver.id)
                  ? 'حذف كابتن inDrive من الأسطول؟'
                  : 'حذف السائق من الفريق؟'}
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                هل أنت متأكد من حذف <strong>{deletingDriver.name}</strong>؟ سيتم مسح بياناته ومزامنة التحديث فورياً.
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
