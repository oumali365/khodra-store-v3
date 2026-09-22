// ============================================================
// AdminDeliveryFleetTab.tsx
// تبويب أسطول التوصيل الفوري ومسارات فاس الذكية
// استناداً لاستراتيجية متجر خُضرة (inDrive, DONE, Yassir, Glovo)
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
  Layers,
  Phone,
  Copy,
  Check,
  Package,
  Calendar,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { DbOrder } from '../../services/supabaseService';
import {
  DELIVERY_PROVIDERS,
  FEZ_DELIVERY_ZONES,
  STORE_PICKUP_HUB,
  STORE_CONFIG,
} from '../../data/config';

interface AdminDeliveryFleetTabProps {
  orders: DbOrder[];
  onSelectOrderForBordereau: (order: DbOrder) => void;
  onOpenOrderInvoice: (order: DbOrder) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export const AdminDeliveryFleetTab: React.FC<AdminDeliveryFleetTabProps> = ({
  orders,
  onSelectOrderForBordereau,
  onOpenOrderInvoice,
  showToast,
}) => {
  const [copiedBatchZone, setCopiedBatchZone] = useState<string | null>(null);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');

  // حساب مؤشرات الأداء الحية (KPIs)
  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
  const activeDeliveryOrders = orders.filter((o) => o.status === 'pending' || o.status === 'prepared');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  const totalDriverCost = nonCancelledOrders.reduce((sum, o) => {
    return sum + (o.delivery_dispatch?.deliveryCost ?? 25);
  }, 0);

  const totalDeliveryRevenue = nonCancelledOrders.reduce((sum, o) => {
    return sum + o.delivery_fee;
  }, 0);

  const netDeliveryProfit = totalDeliveryRevenue - totalDriverCost;

  // تجميع الطلبات حسب مناطق فاس الذكية (Smart Zones)
  const zoneGroups = {
    north: nonCancelledOrders.filter((o) => (o.delivery_dispatch?.zone || 'other') === 'north'),
    central: nonCancelledOrders.filter((o) => (o.delivery_dispatch?.zone || 'other') === 'central'),
    south: nonCancelledOrders.filter((o) => (o.delivery_dispatch?.zone || 'other') === 'south'),
    other: nonCancelledOrders.filter((o) => (o.delivery_dispatch?.zone || 'other') === 'other'),
  };

  // نسخ بيان الجولة المجمعة لسائق inDrive
  const handleCopyBatchRoute = async (zoneKey: keyof typeof zoneGroups, zoneName: string) => {
    const zoneOrders = zoneGroups[zoneKey];
    if (zoneOrders.length === 0) {
      showToast('error', `لا توجد طلبات حالية في ${zoneName}`);
      return;
    }

    let msg = `السلام عليكم 🚴\n`;
    msg += `جولة توصيل مجمعة - ${zoneName} (${zoneOrders.length} محطات) لمتجر خُضرة فاس 🌿\n\n`;
    msg += `📍 نقطة الانطلاق (Hub):\n${STORE_PICKUP_HUB.name}\n${STORE_PICKUP_HUB.address}\n\n`;
    msg += `📦 تفاصيل محطات التوصيل:\n`;

    zoneOrders.forEach((o, idx) => {
      msg += `\n───────────────\n`;
      msg += `محطة #${idx + 1} (طلب ${o.order_code}):\n`;
      msg += `👤 الزبون: ${o.customer_name}\n`;
      msg += `📞 الهاتف: ${o.phone}\n`;
      msg += `🏠 العنوان: ${o.address}\n`;
      if (o.maps_link) msg += `🗺️ الخريطة: ${o.maps_link}\n`;
      msg += `💵 تحصيل COD: ${o.total.toFixed(2)} درهم (نقداً)\n`;
    });

    const totalCOD = zoneOrders.reduce((sum, o) => sum + o.total, 0);
    msg += `\n───────────────\n`;
    msg += `💰 إجمالي مبالغ التحصيل للجولة كاملة: ${totalCOD.toFixed(2)} درهم\n`;
    msg += `⚠️ يرجى تسليم الصناديق بعناية وتسوية المبالغ بعد اكتمال الجولة.`;

    try {
      await navigator.clipboard.writeText(msg);
      setCopiedBatchZone(zoneKey);
      showToast('success', `تم نسخ مسار الجولة المجمعة (${zoneName}) بنجاح`);
      setTimeout(() => setCopiedBatchZone(null), 3000);
    } catch {
      showToast('error', 'تعذر النسخ، يرجى المحاولة ثانية');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-right">
      {/* ─── بطاقات مؤشرات الأداء الحية (Delivery KPIs) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
            <span>رحلات التوصيل اليوم</span>
            <Bike className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 tabular-nums">
            {nonCancelledOrders.length}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {activeDeliveryOrders.length} قيد التجهيز/التوصيل • {deliveredOrders.length} اكتملت
          </p>
        </div>

        <div className="bg-white border-2 border-amber-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
            <span>متوسط وقت التوصيل</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950 tabular-nums">
            35 - 45 <span className="text-sm font-normal">دقيقة</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">الهدف الاستراتيجي: أقل من 60 دقيقة ⚡</p>
        </div>

        <div className="bg-white border-2 border-blue-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-blue-800 font-bold mb-1">
            <span>تكلفة السائقين التقديرية</span>
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-950 tabular-nums">
            {totalDriverCost.toFixed(0)} <span className="text-sm font-normal">درهم</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">بمتوسط 20-30 د.م عبر تفاوض inDrive</p>
        </div>

        <div className="bg-white border-2 border-stone-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-700 font-bold mb-1">
            <span>صافي توازن رسوم التوصيل</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black tabular-nums ${
              netDeliveryProfit >= 0 ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {netDeliveryProfit >= 0 ? `+${netDeliveryProfit.toFixed(0)}` : netDeliveryProfit.toFixed(0)}{' '}
            <span className="text-sm font-normal">درهم</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">يُعوّض عبر زيادة متوسط قيمة السلة</p>
        </div>
      </div>

      {/* ─── مسارات فاس الذكية والتجميع (Smart Route Batching) ─── */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-3 border-b border-stone-200">
          <div>
            <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-700" />
              <span>تقسيم مناطق فاس ومسارات التجميع الذكية (Batching)</span>
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              تجميع 3-4 طلبات بالمنطقة نفسها في جولة دراجة واحدة لتخفيض التكلفة إلى 20-25 د.م للجولة
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>نقطة الانطلاق: {STORE_PICKUP_HUB.name}</span>
          </div>
        </div>

        {/* شبكة المناطق الثلاث */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* المنطقة الشمالية */}
          <div className="border-2 border-emerald-200 rounded-xl p-3.5 bg-emerald-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  {FEZ_DELIVERY_ZONES.north.name}
                </span>
                <span className="text-[11px] font-bold text-emerald-800">
                  {FEZ_DELIVERY_ZONES.north.targetTime}
                </span>
              </div>
              <p className="text-xs text-stone-700 font-semibold mb-2">
                الأحياء: {FEZ_DELIVERY_ZONES.north.neighborhoods.slice(0, 4).join(' • ')}
              </p>
              <div className="bg-white border border-emerald-200 rounded-lg p-2.5 mb-3 text-xs">
                <div className="flex justify-between font-bold text-stone-800 mb-1">
                  <span>الطلبات الجاهزة للتوصيل:</span>
                  <span className="font-black text-emerald-800 tabular-nums">
                    {zoneGroups.north.length} طلبات
                  </span>
                </div>
                <div className="text-[11px] text-stone-500">
                  {FEZ_DELIVERY_ZONES.north.description}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyBatchRoute('north', FEZ_DELIVERY_ZONES.north.name)}
              className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
            >
              {copiedBatchZone === 'north' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>تم نسخ مسار الجولة!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ جولة المنطقة لسائق inDrive</span>
                </>
              )}
            </button>
          </div>

          {/* المنطقة الوسطى */}
          <div className="border-2 border-amber-200 rounded-xl p-3.5 bg-amber-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  {FEZ_DELIVERY_ZONES.central.name}
                </span>
                <span className="text-[11px] font-bold text-amber-800">
                  {FEZ_DELIVERY_ZONES.central.targetTime}
                </span>
              </div>
              <p className="text-xs text-stone-700 font-semibold mb-2">
                الأحياء: {FEZ_DELIVERY_ZONES.central.neighborhoods.slice(0, 4).join(' • ')}
              </p>
              <div className="bg-white border border-amber-200 rounded-lg p-2.5 mb-3 text-xs">
                <div className="flex justify-between font-bold text-stone-800 mb-1">
                  <span>الطلبات الجاهزة للتوصيل:</span>
                  <span className="font-black text-amber-800 tabular-nums">
                    {zoneGroups.central.length} طلبات
                  </span>
                </div>
                <div className="text-[11px] text-stone-500">
                  {FEZ_DELIVERY_ZONES.central.description}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyBatchRoute('central', FEZ_DELIVERY_ZONES.central.name)}
              className="w-full py-2 px-3 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
            >
              {copiedBatchZone === 'central' ? (
                <>
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>تم نسخ مسار الجولة!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ جولة المنطقة لسائق inDrive</span>
                </>
              )}
            </button>
          </div>

          {/* المنطقة الجنوبية */}
          <div className="border-2 border-orange-200 rounded-xl p-3.5 bg-orange-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-orange-200 text-orange-900">
                  {FEZ_DELIVERY_ZONES.south.name}
                </span>
                <span className="text-[11px] font-bold text-orange-800">
                  {FEZ_DELIVERY_ZONES.south.targetTime}
                </span>
              </div>
              <p className="text-xs text-stone-700 font-semibold mb-2">
                الأحياء: {FEZ_DELIVERY_ZONES.south.neighborhoods.slice(0, 4).join(' • ')}
              </p>
              <div className="bg-white border border-orange-200 rounded-lg p-2.5 mb-3 text-xs">
                <div className="flex justify-between font-bold text-stone-800 mb-1">
                  <span>الطلبات الجاهزة للتوصيل:</span>
                  <span className="font-black text-orange-800 tabular-nums">
                    {zoneGroups.south.length} طلبات
                  </span>
                </div>
                <div className="text-[11px] text-stone-500">
                  {FEZ_DELIVERY_ZONES.south.description}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyBatchRoute('south', FEZ_DELIVERY_ZONES.south.name)}
              className="w-full py-2 px-3 rounded-lg bg-orange-700 hover:bg-orange-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
            >
              {copiedBatchZone === 'south' ? (
                <>
                  <Check className="w-4 h-4 text-orange-300" />
                  <span>تم نسخ مسار الجولة!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ جولة المنطقة لسائق inDrive</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── بوابات الربط السريع مع تطبيقات التوصيل الفوري بفاس ─── */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h3 className="font-black text-base text-stone-900 mb-1 flex items-center gap-2">
          <Bike className="w-5 h-5 text-emerald-600" />
          <span>شركات وتطبيقات التوصيل الفوري الشريكة بفاس</span>
        </h3>
        <p className="text-xs text-stone-500 mb-3">
          وفقاً لخطة التوصيل الهجين: inDrive هو الخيار الأساسي للتفاوض، مع إمكانية استخدام DONE أو Yassir وقت الذروة
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
                      موصى به (90%)
                    </span>
                  )}
                </div>
                <h4 className="font-black text-sm text-stone-900">{provider.name}</h4>
                <p className="text-[11px] text-stone-600 leading-snug mt-1 mb-2">{provider.tagline}</p>
                <div className="text-[11px] text-stone-700 font-bold bg-white p-2 rounded border border-stone-200 mb-3">
                  التكلفة المتوقعة: <span className="text-emerald-700">{provider.avgCost}</span>
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
                  <span>فتح تطبيق {provider.name.split(' ')[0]}</span>
                </a>
              ) : (
                <div className="text-center py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-100/60 rounded-lg">
                  فريق التوصيل الداخلي 🛵
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── خريطة سير العمل اليومي للتموين والتوصيل (Daily Workflow) ─── */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800">
          <div>
            <h3 className="font-black text-base text-emerald-400 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>خريطة سير العمل اليومي للتموين والتوصيل بفاس</span>
            </h3>
            <p className="text-xs text-stone-300 mt-0.5">
              جدول الفترات المعتمد من الاستراتيجية: من سوق الجملة بنسودة إلى زبائن فاس
            </p>
          </div>
          <span className="text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full">
            خطة 90 يوماً
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-3">
            <span className="text-emerald-400 font-black block mb-1">🌅 05:30 - 08:00</span>
            <h4 className="font-bold text-white mb-1">التموين من بنسودة</h4>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              شراء الخضر والفواكه الطازجة بالجملة وتجميع شحنات اليوم بمقر خُضرة.
            </p>
          </div>

          <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-3">
            <span className="text-amber-400 font-black block mb-1">☀️ 08:00 - 09:00</span>
            <h4 className="font-bold text-white mb-1">الفرز والتجهيز</h4>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              تعبئة الصناديق العازلة، تهوية الورقيات، وطباعة ملصقات الشحن (Bordereau).
            </p>
          </div>

          <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-3">
            <span className="text-blue-400 font-black block mb-1">📦 09:00 - 13:00</span>
            <h4 className="font-bold text-white mb-1">الجولة الصباحية</h4>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              استدعاء سائق inDrive، تسليم الطرود، وتتبع الوصول وتحصيل COD.
            </p>
          </div>

          <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-3">
            <span className="text-purple-400 font-black block mb-1">🌆 14:00 - 16:00</span>
            <h4 className="font-bold text-white mb-1">تموين سريع طارئ</h4>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              تموين استكمالي للطلبات الجديدة وتجهيز الدفعة الثانية.
            </p>
          </div>

          <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-3">
            <span className="text-rose-400 font-black block mb-1">🌙 16:00 - 21:00</span>
            <h4 className="font-bold text-white mb-1">الجولة المسائية والتسوية</h4>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              توصيل طلبات الأسر بعد العمل، تسوية مبالغ النقد COD وتحديث لوحة الإدارة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
