// ============================================================
// src/features/pricing-forecast/DemandForecastView.tsx
// لوحة توقع الطلب والتموين (JIT) - تصميم عصري لمتجر "خُضرة"
// ============================================================

import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Calendar,
  BarChart2,
  TrendingUp,
  Lightbulb,
  ArrowUpRight,
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

  const maxVolume = Math.max(
    ...(selectedProduct?.dailyDistribution.map((d) => d.volumeKg) || [100])
  );

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* ═══════ 1. بطاقات الاقتراح والتنبيه ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* بطاقة الاقتراح الذكي: خلفية متدرجة خفيفة مع أيقونة 💡 */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#163920] to-[#245432] rounded-3xl p-5 sm:p-6 text-white shadow-2xs border border-emerald-900/40 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#F5D76E] border border-white/15 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>نموذج التموين المسبق (Just-In-Time) • فاس</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100/80 font-medium bg-black/20 px-3 py-1 rounded-2xl">
                <Calendar className="w-3.5 h-3.5 text-[#F5D76E]" />
                <span>يوم: {forecastSummary.currentDayName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#F5D76E]/20 text-[#F5D76E] flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-black font-['Almarai'] text-white">
                الاقتراح الذكي للمشتريات الصباحية
              </h3>
            </div>

            <div className="bg-black/20 p-3.5 sm:p-4 rounded-2xl border border-white/10 mt-2">
              <p className="text-xs sm:text-sm text-emerald-50/90 leading-relaxed font-medium">
                💡 {forecastSummary.smartSuggestionText}
              </p>
            </div>
          </div>

          {/* الكميات المقترحة لأهم المنتجات */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-white/10">
            {forecastSummary.recommendedTopItems.slice(0, 4).map((item) => (
              <div
                key={item.productId}
                className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center"
              >
                <span className="text-2xl block mb-1">{item.icon}</span>
                <span className="text-xs font-bold text-white block truncate">{item.name}</span>
                <span className="text-sm sm:text-base font-black text-[#F5D76E] tabular-nums block mt-0.5">
                  {item.quantityKg} كجم
                </span>
                <span className="text-[10px] text-emerald-200/90 font-medium block mt-0.5 truncate">
                  {item.trendNote}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* بطاقة التنبيه: خلفية برتقالية دافئة (bg-orange-50) */}
        <div className="bg-orange-50 rounded-3xl p-5 sm:p-6 text-stone-900 border border-orange-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-xs font-bold mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
              <span>تنبيه الذكاء الاصطناعي (طلب مفاجئ)</span>
            </div>

            <h4 className="text-sm sm:text-base font-black text-stone-900 mb-2">
              {forecastSummary.aiSpikeAlerts[0]?.title || 'رصد ذروة تسوق قادمة'}
            </h4>

            <div className="p-3.5 bg-white/80 rounded-2xl border border-orange-200/60 mt-1">
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                {forecastSummary.aiSpikeAlerts[0]?.message}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded-2xl border border-orange-200/70 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] text-stone-500 block font-medium">الزيادة المقترحة صباح الغد:</span>
              <span className="text-base font-black text-orange-800 tabular-nums">
                +{forecastSummary.aiSpikeAlerts[0]?.suggestedIncreasePercent || 20}% في سوق بنسودة
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-900 font-black flex items-center justify-center text-xs">
              JIT
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ 2. مخطط المبيعات التاريخية لآخر 30 يوماً ═══════ */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        {/* الترويسة العلوية للمخطط */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-stone-100 text-[#163920] flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm sm:text-base text-stone-900">
                مخطط المبيعات التاريخية (أفضل 10 منتجات خلال آخر 30 يوماً)
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 font-medium mt-1">
              توزيع حجم المبيعات الإجمالي بالكيلوغرام مجمّعاً حسب أيام الأسبوع في مدينة فاس
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-500">اختر المنتج:</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="min-h-[40px] py-1.5 px-3 rounded-2xl border border-stone-200 bg-stone-50 font-bold text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#163920]"
            >
              {historyData.map((prod) => (
                <option key={prod.productId} value={prod.productId}>
                  {prod.icon} {prod.productName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* أزرار سريعة لاختيار المنتج بنمط أزرار Pill */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {historyData.map((item) => {
            const isSelected = item.productId === selectedProductId;
            return (
              <button
                key={item.productId}
                type="button"
                onClick={() => setSelectedProductId(item.productId)}
                className={`min-h-[40px] py-1.5 px-3 rounded-2xl border text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#163920] text-white border-[#163920] shadow-2xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200/90'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.productName}</span>
              </button>
            );
          })}
        </div>

        {/* بطاقات الإحصائيات الخاصة بالمنتج المحدد */}
        {selectedProduct && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#FAFAF9] p-3.5 rounded-2xl border border-stone-200/80">
                <span className="text-[11px] text-stone-500 font-bold block">إجمالي مبيعات 30 يوماً</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl sm:text-2xl font-black text-stone-900 tabular-nums">
                    {selectedProduct.totalVolume30Days}
                  </span>
                  <span className="text-xs text-stone-500 font-bold">كجم</span>
                </div>
              </div>

              <div className="bg-[#FAFAF9] p-3.5 rounded-2xl border border-stone-200/80">
                <span className="text-[11px] text-stone-500 font-bold block">متوسط استهلاك الإثنين</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl sm:text-2xl font-black text-stone-900 tabular-nums">
                    {selectedProduct.averagePerMonday}
                  </span>
                  <span className="text-xs text-stone-500 font-bold">كجم / أسبوع</span>
                </div>
              </div>

              <div className="bg-[#FAFAF9] p-3.5 rounded-2xl border border-stone-200/80">
                <span className="text-[11px] text-stone-500 font-bold block">الشراء الصباحي المقترح (JIT)</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl sm:text-2xl font-black text-[#163920] tabular-nums">
                    {selectedProduct.suggestedPurchaseQuantityKg || selectedProduct.currentStockRecommendation}
                  </span>
                  <span className="text-xs text-emerald-800 font-bold">كجم</span>
                </div>
              </div>

              <div className="bg-[#FAFAF9] p-3.5 rounded-2xl border border-stone-200/80">
                <span className="text-[11px] text-stone-500 font-bold block">مؤشر نمو الطلب</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl sm:text-2xl font-black text-orange-700 tabular-nums">
                    +{selectedProduct.spikePercentage}%
                  </span>
                  <span className="text-xs text-orange-600 font-bold">هذا الشهر</span>
                </div>
              </div>
            </div>

            {/* منطقة المخطط: أعمدة أنحف + تلميحات تظهر عند Hover فقط */}
            <div className="bg-[#FAFAF9] p-4 sm:p-5 rounded-3xl border border-stone-200/80">
              <div className="flex items-center justify-between mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedProduct.icon}</span>
                  <span className="font-bold text-stone-900 text-xs sm:text-sm">
                    توزيع استهلاك "{selectedProduct.productName}" على مدار الأسبوع
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-stone-500 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#163920]" />
                    أيام اعتيادية
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-600" />
                    ذروة التسوق (الجمعة/السبت)
                  </span>
                </div>
              </div>

              {/* الأعمدة البيانية الأنحف مع Tooltip يظهر فقط عند Hover */}
              <div className="grid grid-cols-7 gap-2 sm:gap-6 h-56 pt-8 pb-3 items-end">
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
                      {/* تلميح رقمي يظهر فقط عند Hover لمنع الازدحام */}
                      <div
                        className={`absolute -top-8 transition-all duration-200 pointer-events-none z-20 ${
                          isHovered
                            ? 'opacity-100 scale-100 translate-y-0'
                            : 'opacity-0 scale-95 translate-y-1'
                        }`}
                      >
                        <div className="bg-[#163920] text-[#F5D76E] text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl shadow-md whitespace-nowrap border border-white/20">
                          {day.volumeKg} كجم ({day.orderCount} طلب)
                        </div>
                      </div>

                      {/* العمود الأنحف (max-w-[20px] إلى max-w-[24px]) */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[20px] sm:max-w-[24px] rounded-t-xl transition-all duration-300 relative ${
                          isPeak
                            ? 'bg-gradient-to-t from-orange-600 to-orange-400'
                            : 'bg-gradient-to-t from-[#163920] to-[#2D6A3F]'
                        } ${isHovered ? 'scale-105 brightness-110 shadow-sm' : 'opacity-90'}`}
                      />

                      {/* اسم اليوم */}
                      <div className="mt-2.5 text-center">
                        <span className="block text-[11px] sm:text-xs font-bold text-stone-800">
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
