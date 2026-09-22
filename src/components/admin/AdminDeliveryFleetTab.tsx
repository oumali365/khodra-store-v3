// ============================================================
// AdminDeliveryFleetTab.tsx
// تبويب أسطول التوصيل الفوري ومسارات فاس الذكية
// ============================================================
import React, { useState } from 'react';
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
} from 'lucide-react';
import { DbOrder } from '../../services/supabaseService';
import {
  DELIVERY_PROVIDERS,
  FEZ_DELIVERY_ZONES,
  STORE_PICKUP_HUB,
} from '../../data/config';
import { FezZoneId } from '../../data/deliveryZones';

interface AdminDeliveryFleetTabProps {
  orders: DbOrder[];
  onSelectOrderForBordereau: (order: DbOrder) => void;
  onOpenOrderInvoice: (order: DbOrder) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export const AdminDeliveryFleetTab: React.FC<AdminDeliveryFleetTabProps> = ({
  orders,
  showToast,
}) => {
  const [copiedBatchZone, setCopiedBatchZone] = useState<string | null>(null);

  // ─── KPIs ───
  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
  const activeDeliveryOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'prepared'
  );
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  const totalDriverCost = nonCancelledOrders.reduce(
    (sum, o) => sum + (o.delivery_dispatch?.deliveryCost ?? 25),
    0
  );
  const totalDeliveryRevenue = nonCancelledOrders.reduce(
    (sum, o) => sum + o.delivery_fee,
    0
  );
  const netDeliveryProfit = totalDeliveryRevenue - totalDriverCost;

  // ─── تجميع حسب المناطق الأربعة ───
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

  // ─── ألوان المناطق ───
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

  // ─── نسخ جولة مجمعة ───
  const handleCopyBatchRoute = async (
    zoneKey: FezZoneId,
    zoneName: string
  ) => {
    const zoneOrders = zoneGroups[zoneKey];
    if (zoneOrders.length === 0) {
      showToast('error', `لا توجد طلبات حالية في ${zoneName}`);
      return;
    }

    let msg = `السلام عليكم 🚴\n`;
    msg += `جولة توصيل - ${zoneName} (${zoneOrders.length} محطات) لمتجر خُضرة 🌿\n\n`;
    msg += `📍 نقطة الانطلاق:\n${STORE_PICKUP_HUB.name}\n${STORE_PICKUP_HUB.address}\n\n`;
    msg += `📦 المحطات:\n`;

    zoneOrders.forEach((o, idx) => {
      msg += `\n───────────────\n`;
      msg += `محطة #${idx + 1} (${o.order_code}):\n`;
      msg += `👤 ${o.customer_name}\n`;
      msg += `📞 ${o.phone}\n`;
      msg += `🏠 ${o.address}\n`;
      if (o.maps_link) msg += `🗺️ ${o.maps_link}\n`;
      msg += `💵 COD: ${o.total.toFixed(2)} درهم\n`;
    });

    const totalCOD = zoneOrders.reduce((sum, o) => sum + o.total, 0);
    msg += `\n───────────────\n`;
    msg += `💰 إجمالي COD للجولة: ${totalCOD.toFixed(2)} درهم\n`;
    msg += `⚠️ يرجى تسليم الصناديق بعناية وتسوية المبالغ.`;

    try {
      await navigator.clipboard.writeText(msg);
      setCopiedBatchZone(zoneKey);
      showToast('success', `تم نسخ مسار ${zoneName}`);
      setTimeout(() => setCopiedBatchZone(null), 3000);
    } catch {
      showToast('error', 'تعذر النسخ');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-right">
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
          <p className="text-[11px] text-stone-500 mt-1">20-30 د.م عبر inDrive</p>
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

      {/* ═══════════ مسارات فاس الذكية ═══════════ */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-3 border-b border-stone-200">
          <div>
            <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-700" />
              <span>مناطق فاس ومسارات التجميع الذكية</span>
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              تجميع 3-4 طلبات بالمنطقة في جولة واحدة • تخفيض التكلفة إلى 20-25 د.م للجولة
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{STORE_PICKUP_HUB.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {zones.map((zoneKey) => {
            const info = FEZ_DELIVERY_ZONES[zoneKey];
            const styles = zoneStyles[zoneKey];
            const count = zoneGroups[zoneKey].length;
            const isCopied = copiedBatchZone === zoneKey;

            return (
              <div
                key={zoneKey}
                className={`border-2 ${styles.border} rounded-xl p-3.5 ${styles.bg} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${styles.badge}`}>
                      {info.name}
                    </span>
                    <span className="text-[11px] font-bold text-stone-700">
                      {info.targetTime}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 font-semibold mb-2">
                    {info.neighborhoods.slice(0, 4).join(' • ')}
                  </p>
                  <div className="bg-white border border-stone-200 rounded-lg p-2.5 mb-3 text-xs">
                    <div className="flex justify-between font-bold text-stone-800 mb-1">
                      <span>جاهز للتوصيل:</span>
                      <span className="font-black tabular-nums">{count} طلبات</span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {info.description}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyBatchRoute(zoneKey, info.name)}
                  className={`w-full py-2 px-3 rounded-lg ${styles.btn} text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98`}
                >
                  {isCopied ? (
                    <>
                      <Check className={`w-4 h-4 ${styles.icon}`} />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ جولة inDrive</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════ شركات التوصيل ═══════════ */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h3 className="font-black text-base text-stone-900 mb-1 flex items-center gap-2">
          <Bike className="w-5 h-5 text-emerald-600" />
          <span>شركات التوصيل الشريكة بفاس</span>
        </h3>
        <p className="text-xs text-stone-500 mb-3">
          inDrive أساسي للتفاوض • DONE أو Yassir وقت الذروة
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                  فريق داخلي 🛵
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ سير العمل اليومي ═══════════ */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800">
          <div>
            <h3 className="font-black text-base text-emerald-400 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>سير العمل اليومي بفاس</span>
            </h3>
            <p className="text-xs text-stone-300 mt-0.5">
              من بنسودة إلى زبائن فاس
            </p>
          </div>
          <span className="text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full">
            خطة 90 يوم
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <PhaseCard time="🌅 05:30 - 08:00" title="التموين" color="text-emerald-400">
            شراء من بنسودة وتجميع شحنات اليوم.
          </PhaseCard>
          <PhaseCard time="☀️ 08:00 - 09:00" title="التجهيز" color="text-amber-400">
            تعبئة الصناديق وطباعة ملصقات الشحن.
          </PhaseCard>
          <PhaseCard time="📦 09:00 - 13:00" title="الجولة الصباحية" color="text-blue-400">
            استدعاء inDrive وتحصيل COD.
          </PhaseCard>
          <PhaseCard time="🌆 14:00 - 16:00" title="تموين طارئ" color="text-purple-400">
            تموين استكمالي ودفعة ثانية.
          </PhaseCard>
          <PhaseCard time="🌙 16:00 - 21:00" title="الجولة المسائية" color="text-rose-400">
            توصيل + تسوية COD + تحديث اللوحة.
          </PhaseCard>
        </div>
      </div>
    </div>
  );
};

// ─── مكوّن صغير لبطاقة مرحلة واحدة ───
const PhaseCard: React.FC<{
  time: string;
  title: string;
  color: string;
  children: React.ReactNode;
}> = ({ time, title, color, children }) => (
  <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-3">
    <span className={`${color} font-black block mb-1`}>{time}</span>
    <h4 className="font-bold text-white mb-1">{title}</h4>
    <p className="text-stone-300 text-[11px] leading-relaxed">{children}</p>
  </div>
);