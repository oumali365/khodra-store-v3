// ============================================================
// src/features/pricing-forecast/DemandForecastView.tsx
// لوحة توقع الطلب والتموين المسبق (JIT) ومخطط مبيعات 30 يوماً
// تصميم مخفف ونظيف (أعمدة بيضاء هادئة وتلميحات تفاعلية عند التمرير)
// ============================================================

import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Calendar,
  Package,
  Layers,
  ArrowUpRight,
  Info,
  CheckCircle2,
  BarChart2,
  Clock,
  ShoppingBag,
} from 'lucide-react';
import type { TopProductSalesHistory, DemandForecastSummary } from './types';

interface DemandForecastViewProps {
  historyData: TopProductSalesHistory[];
  forecastSummary: DemandForecastSummary;
}

export const DemandForecastView: React.FC<DemandForecastViewProps> = ({
  historyData,
  forecastSummary,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<number>(historyData[0]?.productId || 1);
  const [hoveredDayName, setHoveredDayName] = useState<string | null>(null);

  const selectedProduct = historyData.find((p) => p.productId === selectedProductId) || historyData[0];

  // أقصى حجم مبيعات لحساب ارتفاع الأعمدة البيانية بدقة
  const maxVolume = Math.max(
    ...(selectedProduct?.dailyDistribution.map((d) => d.volumeKg) || [100])
  );

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* ═══════ 1. بطاقة الاقتراح الذكي وتنبيه الذكاء الاصطناعي ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* بطاقة الاقتراح الذكي للتموين المسبق (JIT Recommendation) */}
        <div className="lg:col-span-2 bg-[#163920] rounded-2xl p-4 sm:p-5 text-white border border-emerald-600/40 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-[#FEF08A] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>نموذج التموين المسبق (Just-In-Time) • فاس</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-300 font-medium bg-black/20 px-2.5 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>يوم: {forecastSummary.currentDayName}</span>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              بطاقة الاقتراح الذكي للمشتريات الصباحية
            </h3>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal bg-black/20 p-3 rounded-xl border border-white/10">
              💡 {forecastSummary.smartSuggestionText}
            </p>
          </div>

          {/* الكميات المقترحة لأهم 4 منتجات */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-emerald-600/30">
            {forecastSummary.recommendedTopItems.slice(0, 4).map((item) => (
              <div
                key={item.productId}
                className="bg-white/10 p-2.5 rounded-xl border border-white/10 text-center"
              >
                <span className="text-xl block mb-0.5">{item.icon}</span>
                <span className="text-xs font-bold text-white block truncate">{item.name}</span>
                <span className="text-sm font-black text-[#FEF08A] tabular-nums block mt-0.5">
                  {item.quantityKg} كجم
                </span>
                <span className="text-[10px] text-emerald-300 font-medium block mt-0.5">
                  {item.trendNote}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* شارة وتنبيه الذكاء الاصطناعي (AI Spike Alert) */}
        <div className="bg-[#7C2D12] rounded-2xl p-4 sm:p-5 text-white border border-orange-500/40 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-bold mb-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F5D76E]" />
              <span>تنبيه الذكاء الاصطناعي (طلب مفاجئ)</span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-white mb-2">
              {forecastSummary.aiSpikeAlerts[0]?.title || 'رصد ذروة تسوق قادمة'}
            </h4>

            <p className="text-xs text-amber-100/90 leading-relaxed font-normal bg-black/25 p-3 rounded-xl border border-white/10">
              {forecastSummary.aiSpikeAlerts[0]?.message}
            </p>
          </div>

          <div className="mt-3.5 p-2.5 bg-white/10 rounded-xl border border-white/15 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-200 block font-medium">الزيادة المقترحة في المخزون:</span>
              <span className="text-base font-black text-white">
                +{forecastSummary.aiSpikeAlerts[0]?.suggestedIncreasePercent || 20}% غداً
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-stone-900 font-black flex items-center justify-center text-xs shadow-xs">
              JIT
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ 2. مخطط المبيعات التاريخية لآخر 30 يوماً ═══════ */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        {/* الترويسة العلوية للمخطط */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-stone-900">
                مخطط المبيعات التاريخية (أفضل 10 منتجات خلال آخر 30 يوماً)
              </h3>
            </div>
            <p className="text-[11px] text-stone-500 font-normal mt-0.5">
              توزيع حجم المبيعات الإجمالي بالكيلوغرام مجمّعاً حسب أيام الأسبوع في مدينة فاس
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-500">المنتج:</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="py-1.5 px-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-xs text-stone-900 focus:outline-emerald-600"
            >
              {historyData.map((prod) => (
                <option key={prod.productId} value={prod.productId}>
                  {prod.icon} {prod.productName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* أزرار سريعة للتنقل بين المنتجات */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {historyData.map((item) => {
            const isSelected = item.productId === selectedProductId;
            return (
              <button
                key={item.productId}
                type="button"
                onClick={() => setSelectedProductId(item.productId)}
                className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#163920] text-white border-[#163920] shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200/90'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.productName}</span>
              </button>
            );
          })}
        </div>

        {/* ═══════ بطاقة منفصلة أنيقة أعلى المخطط لعرض إجمالي المبيعات والمؤشرات ═══════ */}
        {selectedProduct && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* بطاقة إجمالي مبيعات 30 يوماً المنفصلة */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <span className="text-[10px] text-stone-500 font-medium block">إجمالي مبيعات 30 يوماً</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-xl font-black text-stone-900 tabular-nums">
                    {selectedProduct.totalVolume30Days}
                  </span>
                  <span className="text-[10px] text-stone-500">كجم</span>
                </div>
              </div>

              {/* بطاقة متوسط يوم الإثنين */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <span className="text-[10px] text-stone-500 font-medium block">متوسط استهلاك الإثنين</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-xl font-black text-stone-900 tabular-nums">
                    {selectedProduct.averagePerMonday}
                  </span>
                  <span className="text-[10px] text-stone-500">كجم / أسبوع</span>
                </div>
              </div>

              {/* بطاقة مخزون الأمان الموصى به */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <span className="text-[10px] text-stone-500 font-medium block">مخزون الأمان (JIT)</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-xl font-black text-emerald-800 tabular-nums">
                    {selectedProduct.currentStockRecommendation}
                  </span>
                  <span className="text-[10px] text-emerald-700">كجم</span>
                </div>
              </div>

              {/* بطاقة مؤشر الذروة والطلب */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <span className="text-[10px] text-stone-500 font-medium block">مؤشر نمو الطلب</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-xl font-black text-orange-700 tabular-nums">
                    +{selectedProduct.spikePercentage}%
                  </span>
                  <span className="text-[10px] text-orange-600">هذا الشهر</span>
                </div>
              </div>
            </div>

            {/* ═══════ المخطط البياني بالأعمدة المحسّن (أعمدة أنحف وأرقام تظهر عند التمرير) ═══════ */}
            <div className="bg-stone-50/50 p-4 sm:p-5 rounded-2xl border border-stone-200/80">
              {/* دليل الألوان المقتضب */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedProduct.icon}</span>
                  <span className="font-bold text-stone-900 text-xs sm:text-sm">
                    حركة استهلاك "{selectedProduct.productName}" أسبوعياً
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-stone-500 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#163920]" />
                    أيام عادية
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-600" />
                    ذروة (الجمعة/السبت)
                  </span>
                </div>
              </div>

              {/* منطقة الأعمدة مع مساحات بيضاء واسعة وأعمدة أنحف */}
              <div className="grid grid-cols-7 gap-3 sm:gap-6 h-52 pt-8 pb-2 items-end">
                {selectedProduct.dailyDistribution.map((day) => {
                  const heightPercent = Math.max(12, Math.round((day.volumeKg / maxVolume) * 100));
                  const isPeak = day.dayName === 'الجمعة' || day.dayName === 'السبت';
                  const isHovered = hoveredDayName === day.dayName;

                  return (
                    <div
                      key={day.dayName}
                      onMouseEnter={() => setHoveredDayName(day.dayName)}
                      onMouseLeave={() => setHoveredDayName(null)}
                      className="flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    >
                      {/* تلميح رقمي عائم أنيق يظهر فقط عند التمرير (Hover/Tap) لمنع الازدحام البصري */}
                      <div
                        className={`absolute -top-7 transition-all duration-200 pointer-events-none z-10 ${
                          isHovered
                            ? 'opacity-100 scale-100 translate-y-0'
                            : 'opacity-0 scale-95 translate-y-1'
                        }`}
                      >
                        <div className="bg-stone-900 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap">
                          {day.volumeKg} كجم ({day.orderCount} طلب)
                        </div>
                      </div>

                      {/* العمود البياني الأنحف (max-w-[28px]) مع زوايا ناعمة */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[24px] sm:max-w-[28px] rounded-t-xl transition-all duration-300 relative ${
                          isPeak
                            ? 'bg-gradient-to-t from-orange-600 to-orange-400'
                            : 'bg-gradient-to-t from-[#163920] to-[#2D6A3F]'
                        } ${isHovered ? 'scale-105 shadow-sm brightness-110' : 'opacity-90'}`}
                      />

                      {/* اسم اليوم أسفل العمود بخط هادئ ومريح */}
                      <div className="mt-2 text-center">
                        <span className="block text-[11px] sm:text-xs font-bold text-stone-700">
                          {day.dayName}
                        </span>
                        <span className="block text-[10px] text-stone-400 font-mono">
                          {day.orderCount} ط
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
