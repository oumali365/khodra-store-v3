// ============================================================
// components.tsx - مكونات واجهة أسطول التوصيل والمناطق
// ============================================================

import React from 'react';
import {
  Bike,
  Clock,
  Coins,
  TrendingUp,
  Navigation,
  MapPin,
  Eye,
  Send,
  Compass,
  CheckCircle2,
  Printer,
  Copy,
  Plus,
  RefreshCw,
  Car,
} from 'lucide-react';
import type {
  FleetStats,
  FezZoneId,
  DbOrder,
  StoreDriver,
  FastAppCourier,
  DriverStatus,
} from './types';
import { ZONE_STYLES, FLEET_ZONES } from './constants';
import { FEZ_DELIVERY_ZONES, DELIVERY_PROVIDERS, STORE_PICKUP_HUB } from '../../data/config';
import { calculateZoneCOD, getSortedDriversForZone } from './utils';
import { DriverCard, ProviderCard } from './cards';

/**
 * 4 بطاقات مؤشرات الأداء الرئيسية (KPIs)
 */
export const FleetKPIs: React.FC<{ stats: FleetStats }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      <div className="bg-white border-2 border-emerald-200 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
          <span>رحلات اليوم</span>
          <Bike className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-emerald-950 tabular-nums">
          {stats.totalTrips}
        </div>
        <p className="text-[11px] text-stone-500 mt-1">
          {stats.activeTrips} نشطة • {stats.deliveredTrips} مكتملة
        </p>
      </div>

      <div className="bg-white border-2 border-amber-200 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
          <span>وقت التوصيل المستهدف</span>
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-amber-950 tabular-nums">
          {stats.targetTime}
        </div>
        <p className="text-[11px] text-stone-500 mt-1">حسب المنطقة الجغرافية بفاس</p>
      </div>

      <div className="bg-white border-2 border-blue-200 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-blue-800 font-bold mb-1">
          <span>تكلفة أجور السائقين</span>
          <Coins className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-blue-950 tabular-nums">
          {stats.totalDriverCost.toFixed(0)} <span className="text-sm font-normal">د.م</span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1">أجرة محددة لكل طلب</p>
      </div>

      <div className="bg-white border-2 border-stone-200 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-stone-700 font-bold mb-1">
          <span>صافي التوصيل للمتجر</span>
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <div
          className={`text-xl sm:text-2xl font-black tabular-nums ${
            stats.netDeliveryProfit >= 0 ? 'text-emerald-700' : 'text-amber-700'
          }`}
        >
          {stats.netDeliveryProfit >= 0 ? '+' : ''}
          {stats.netDeliveryProfit.toFixed(0)} <span className="text-sm font-normal">د.م</span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1">عائد رسوم التوصيل المباشر</p>
      </div>
    </div>
  );
};

export interface ZoneColumnProps {
  zoneKey: FezZoneId;
  orders: DbOrder[];
  drivers: StoreDriver[];
  selectedDriverId: string;
  onSelectDriver: (zoneKey: FezZoneId, driverId: string) => void;
  onAssignDriverToTour?: (zoneKey: FezZoneId, driverId: string) => void;
  isAssigningDriver?: boolean;
  onViewCOD: (zoneKey: FezZoneId) => void;
  onSendWhatsApp: (zoneKey: FezZoneId) => void;
  onOpenGoogleMaps: (zoneKey: FezZoneId) => void;
  onCloseTour: (zoneKey: FezZoneId) => void;
  onOpenManifest: (zoneKey: FezZoneId) => void;
  onOpenCopyTemplates: (zoneKey: FezZoneId) => void;
}

/**
 * عمود منطقة توصيل جغرافية واحدة
 */
export const ZoneColumn: React.FC<ZoneColumnProps> = ({
  zoneKey,
  orders,
  drivers,
  selectedDriverId,
  onSelectDriver,
  onAssignDriverToTour,
  isAssigningDriver,
  onViewCOD,
  onSendWhatsApp,
  onOpenGoogleMaps,
  onCloseTour,
  onOpenManifest,
  onOpenCopyTemplates,
}) => {
  const info = FEZ_DELIVERY_ZONES[zoneKey];
  const styles = ZONE_STYLES[zoneKey];
  const { totalCOD, ordersCount, paidOrdersCount, unpaidOrdersCount } = calculateZoneCOD(orders);
  const sortedDrivers = getSortedDriversForZone(zoneKey, drivers);

  return (
    <div
      className={`border-2 ${styles.border} rounded-2xl p-4 ${styles.bg} flex flex-col justify-between shadow-xs transition-all`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${styles.badge}`}>
            {info.name}
          </span>
          <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-stone-200">
            <Clock className="w-3 h-3 text-stone-500" />
            <span>{info.targetTime}</span>
          </span>
        </div>

        <p className="text-xs text-stone-700 font-semibold mb-3 line-clamp-2 min-h-[32px]">
          {info.neighborhoods.slice(0, 4).join(' • ')}
        </p>

        {/* صندوق تفاصيل الطلبات والتحصيل النقدي */}
        <div className="bg-white border border-stone-200 rounded-xl p-3 mb-3 text-xs space-y-2.5 shadow-2xs">
          <div className="flex justify-between items-center font-bold text-stone-800">
            <span>الطلبات الجاهزة للتوصيل:</span>
            <span className="font-black tabular-nums text-sm px-2 py-0.5 rounded-md bg-stone-100 text-stone-900 border border-stone-200">
              {ordersCount} طلبات
            </span>
          </div>

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
                onClick={() => onViewCOD(zoneKey)}
                className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center gap-0.5 border border-stone-300 transition-colors cursor-pointer disabled:opacity-40"
                title="عرض تفاصيل التحصيل لكل طلب لتجنب الأخطاء المحاسبية"
              >
                <Eye className="w-3 h-3 text-stone-600" />
                <span>عرض التفاصيل</span>
              </button>
            </div>
          </div>

          {paidOrdersCount && paidOrdersCount > 0 ? (
            <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center justify-between">
              <span>طلب مسدد مسبقاً (غير مطلوب نقداً):</span>
              <span className="font-mono">{paidOrdersCount} طلب</span>
            </div>
          ) : null}

          {/* القائمة المنسدلة لتعيين السائق */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-black text-stone-700">
                تعيين سائق الجولة:
              </label>
              {selectedDriverId && (
                <span className="text-[10px] font-bold text-purple-700">
                  {drivers.find((d) => d.id === selectedDriverId)?.name}
                </span>
              )}
            </div>
            <select
              value={selectedDriverId}
              onChange={(e) => onSelectDriver(zoneKey, e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white font-bold text-stone-800 focus:outline-emerald-600"
            >
              <option value="">-- اختر سائقاً من الفريق --</option>
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
                    ? ` ⛔ [غير متاح - ${disabledReason}]`
                    : ` ✅ [متاح - ${driver.commissionPerOrder} د.م]`}
                </option>
              ))}
            </select>

            {onAssignDriverToTour && selectedDriverId && ordersCount > 0 && (
              <button
                type="button"
                disabled={isAssigningDriver}
                onClick={() => onAssignDriverToTour(zoneKey, selectedDriverId)}
                className="mt-2 w-full py-1.5 px-2.5 rounded-lg bg-purple-700 hover:bg-purple-800 disabled:bg-purple-500/70 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                title="اعتماد الجولة وتعيين هذا السائق لجميع طلبات المنطقة ومزامنتها فوراً في لوحة الطلبات وقاعدة البيانات"
              >
                {isAssigningDriver ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bike className="w-3.5 h-3.5 text-purple-200" />
                )}
                <span>اعتماد الجولة وتعيين السائق للطلبات ({ordersCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={ordersCount === 0}
            onClick={() => onSendWhatsApp(zoneKey)}
            className="py-2 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
            title="إرسال تفاصيل الجولة والمحطات للسائق عبر واتساب"
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">إرسال (WhatsApp)</span>
          </button>

          <button
            type="button"
            disabled={ordersCount === 0}
            onClick={() => onOpenGoogleMaps(zoneKey)}
            className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="فتح مسار الملاحة متعدد المحطات في خرائط Google"
          >
            <Compass className="w-3.5 h-3.5 shrink-0 text-amber-200" />
            <span className="truncate">مسار خرائط Google</span>
          </button>
        </div>

        <button
          type="button"
          disabled={ordersCount === 0}
          onClick={() => onCloseTour(zoneKey)}
          className="w-full py-2 px-3 rounded-xl border-2 border-stone-300 hover:border-emerald-600 bg-stone-100 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          title="تأكيد تسليم طلبات هذه الجولة وتحديثها إلى 'تم التسليم' ونقلها للأرشيف"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>إغلاق الجولة وتأكيد التسليم</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            type="button"
            disabled={ordersCount === 0}
            onClick={() => onOpenManifest(zoneKey)}
            className="py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
            title="طباعة بوليصة ومانيفست A4 رسمي للتسليم"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-300" />
            <span>مانيفست A4</span>
          </button>

          <button
            type="button"
            disabled={ordersCount === 0}
            onClick={() => onOpenCopyTemplates(zoneKey)}
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
};

export interface ZoneGridProps {
  ordersByZone: Record<FezZoneId, DbOrder[]>;
  drivers: StoreDriver[];
  selectedDrivers: Record<FezZoneId, string>;
  onSelectDriver: (zoneKey: FezZoneId, driverId: string) => void;
  onAssignDriverToTour?: (zoneKey: FezZoneId, driverId: string) => void;
  assigningZone?: FezZoneId | null;
  filterMode?: 'active' | 'all' | 'prepared' | 'delivered';
  onFilterModeChange?: (mode: 'active' | 'all' | 'prepared' | 'delivered') => void;
  onViewCOD: (zoneKey: FezZoneId) => void;
  onSendWhatsApp: (zoneKey: FezZoneId) => void;
  onOpenGoogleMaps: (zoneKey: FezZoneId) => void;
  onCloseTour: (zoneKey: FezZoneId) => void;
  onOpenManifest: (zoneKey: FezZoneId) => void;
  onOpenCopyTemplates: (zoneKey: FezZoneId) => void;
}

/**
 * شبكة مناطق التوصيل الأربعة
 */
export const ZoneGrid: React.FC<ZoneGridProps> = ({
  ordersByZone,
  drivers,
  selectedDrivers,
  onSelectDriver,
  onAssignDriverToTour,
  assigningZone,
  filterMode = 'active',
  onFilterModeChange,
  onViewCOD,
  onSendWhatsApp,
  onOpenGoogleMaps,
  onCloseTour,
  onOpenManifest,
  onOpenCopyTemplates,
}) => {
  return (
    <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-3 border-b border-stone-200">
        <div>
          <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-700" />
            <span>إدارة مسارات التوصيل والجولات • مدينة فاس</span>
          </h3>
          <p className="text-[11px] text-stone-500 mt-0.5">
            4 مناطق جغرافية (الشرقية، الوسطى، الجنوبية، الشمالية) • تعيين السائقين الذكي • حساب COD • إغلاق الجولات للأرشيف
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>نقطة الانطلاق: {STORE_PICKUP_HUB.name}</span>
        </div>
      </div>

      {/* شريط تبديل تصفية الجولات (النشطة للتوصيل vs الأرشيف) */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4 p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs">
        <span className="font-bold text-stone-700">تصفية جولات المسارات:</span>
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-stone-200">
          {(
            [
              { id: 'active', label: 'الجولات النشطة للتوصيل 🛵' },
              { id: 'prepared', label: 'المجهزة فقط 📦' },
              { id: 'delivered', label: 'أرشيف المسلّمة ✅' },
              { id: 'all', label: 'كافة الطلبات 📋' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onFilterModeChange?.(t.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                filterMode === t.id
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FLEET_ZONES.map((zoneKey) => (
          <ZoneColumn
            key={zoneKey}
            zoneKey={zoneKey}
            orders={ordersByZone[zoneKey] || []}
            drivers={drivers}
            selectedDriverId={selectedDrivers[zoneKey] || ''}
            onSelectDriver={onSelectDriver}
            onAssignDriverToTour={onAssignDriverToTour}
            isAssigningDriver={assigningZone === zoneKey}
            onViewCOD={onViewCOD}
            onSendWhatsApp={onSendWhatsApp}
            onOpenGoogleMaps={onOpenGoogleMaps}
            onCloseTour={onCloseTour}
            onOpenManifest={onOpenManifest}
            onOpenCopyTemplates={onOpenCopyTemplates}
          />
        ))}
      </div>
    </div>
  );
};

export interface InternalDriversGridProps {
  drivers: StoreDriver[];
  isLoading: boolean;
  isSynced: boolean;
  isSyncing: boolean;
  onSync: () => void;
  onAdd: () => void;
  onEdit: (driver: StoreDriver) => void;
  onDelete: (driver: StoreDriver) => void;
  onStatusChange: (driver: StoreDriver, status: DriverStatus) => void;
}

/**
 * شبكة فريق سائقي المتجر الداخلي
 */
export const InternalDriversGrid: React.FC<InternalDriversGridProps> = ({
  drivers,
  isLoading,
  isSynced,
  isSyncing,
  onSync,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  return (
    <div className="bg-white border-2 border-[#163920]/20 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
              <span>أسطول سائقي خُضرة بفاس</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {drivers.length} سائقين
              </span>
            </h3>
            <p className="text-[11px] text-stone-500">
              إدارة السائقين، مناطق العمل المفضلة، تفاصيل المركبة، والتواصل الفوري
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isSynced
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="مزامنة مع السيرفر السحابي"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSynced ? 'متزامن سحابياً' : 'مزامنة مع السيرفر'}</span>
          </button>

          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#163920] hover:bg-[#0E2615] text-white text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سائق جديد</span>
          </button>
        </div>
      </div>

      {isLoading ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-3.5">
          {drivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              variant="internal"
              onEdit={onEdit as (d: StoreDriver | FastAppCourier) => void}
              onDelete={onDelete as (d: StoreDriver | FastAppCourier) => void}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export interface FastCouriersGridProps {
  couriers: FastAppCourier[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (courier: FastAppCourier) => void;
  onDelete: (courier: FastAppCourier) => void;
}

/**
 * شبكة كباتن تطبيقات التوصيل السريع (inDrive, Glovo, Yassir) - تصميم عصري ومختصر
 */
export const FastCouriersGrid: React.FC<FastCouriersGridProps> = ({
  couriers,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between flex-wrap gap-2.5 pb-2.5 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-stone-900">
                تطبيقات التوصيل السريعة
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200/60">
                {couriers.length} مسجل
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              إدارة والتواصل السريع مع كباتن التطبيقات (inDrive • Glovo • Yassir)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>أضف سائق جديد</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-stone-500">
          <RefreshCw className="w-4 h-4 animate-spin mx-auto text-amber-600 mb-1.5" />
          <span>جاري التحميل...</span>
        </div>
      ) : couriers.length === 0 ? (
        <div className="py-6 text-center text-xs text-stone-500 bg-stone-50/60 rounded-xl border border-stone-200/60">
          <Car className="w-6 h-6 mx-auto mb-1 text-stone-300" />
          <p className="font-bold text-stone-700 text-xs">لا يوجد كباتن تطبيقات مسجلين حالياً</p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            أضف كباتن خارجيين للتواصل المباشر معهم عند الحاجة
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {couriers.map((courier) => (
            <DriverCard
              key={courier.id}
              driver={courier}
              variant="fast"
              onEdit={onEdit as (d: StoreDriver | FastAppCourier) => void}
              onDelete={onDelete as (d: StoreDriver | FastAppCourier) => void}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * شبكة شركات وتطبيقات التوصيل الخارجي
 */
export const ProviderCards: React.FC = () => {
  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
      <h3 className="font-black text-sm sm:text-base text-stone-900 mb-2.5 flex items-center gap-2">
        <Bike className="w-4 h-4 text-emerald-600" />
        <span>تطبيقات التوصيل السريع بفاس</span>
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {DELIVERY_PROVIDERS.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
  );
};
