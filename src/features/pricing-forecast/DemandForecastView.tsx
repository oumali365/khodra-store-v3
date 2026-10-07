// ============================================================
// src/features/pricing-forecast/DemandForecastView.tsx
// لوحة توقع الطلب والتموين المسبق (JIT) ومخطط مبيعات 30 يوماً
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

  const selectedProduct = historyData.find((p) => p.productId === selectedProductId) || historyData[0];

  // أقصى حجم مبيعات لحساب ارتفاع الأعمدة البيانية
  const maxVolume = Math.max(
    ...(selectedProduct?.dailyDistribution.map((d) => d.volumeKg) || [100])
  );

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* ═══════ 1. بطاقة الاقتراح الذكي وتنبيه الذكاء الاصطناعي ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* بطاقة الاقتراح الذكي (JIT Recommendation) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#163920] to-[#0E2615] rounded-3xl p-5 sm:p-6 text-white border-2 border-[#2D6A3F]/60 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-[#FEF08A] border border-emerald-400/30 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>نموذج التموين المسبق (Just-In-Time) • فاس</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-300 font-bold bg-black/30 px-3 py-1 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>يوم: {forecastSummary.currentDayName}</span>
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white font-['Almarai'] mb-2">
              بطاقة الاقتراح الذكي للمشتريات الصباحية
            </h3>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium bg-black/20 p-3.5 rounded-2xl border border-white/10">
              💡 {forecastSummary.smartSuggestionText}
            </p>
          </div>

          {/* الكميات المقترحة لأهم 4 منتجات */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-emerald-600/30">
            {forecastSummary.recommendedTopItems.slice(0, 4).map((item) => (
              <div
                key={item.productId}
                className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 text-center"
              >
                <span className="text-2xl block mb-1">{item.icon}</span>
                <span className="text-xs font-black text-white block truncate">{item.name}</span>
                <span className="text-base font-black text-[#FEF08A] tabular-nums block">
                  {item.quantityKg} كجم
                </span>
                <span className="text-[10px] text-emerald-300 font-bold block mt-0.5">
                  {item.trendNote}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* شارة وتنبيه الذكاء الاصطناعي (AI Spike Alert) */}
        <div className="bg-gradient-to-br from-[#7C2D12] via-[#9A3412] to-[#431407] rounded-3xl p-5 sm:p-6 text-white border-2 border-orange-500/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-52 h-52 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-black mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F5D76E]" />
              <span>تنبيه الذكاء الاصطناعي (طلب مفاجئ)</span>
            </div>

            <h4 className="text-base sm:text-lg font-black text-white font-['Almarai'] mb-2">
              {forecastSummary.aiSpikeAlerts[0]?.title || 'رصد ذروة تسوق قادمة'}
            </h4>

            <p className="text-xs text-amber-100/90 leading-relaxed font-medium bg-black/25 p-3 rounded-2xl border border-white/10">
              {forecastSummary.aiSpikeAlerts[0]?.message}
            </p>
          </div>

          <div className="mt-4 p-3 bg-white/10 rounded-2xl border border-white/15 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-200 block font-bold">الزيادة المقترحة في المخزون:</span>
              <span className="text-lg font-black text-white">
                +{forecastSummary.aiSpikeAlerts[0]?.suggestedIncreasePercent || 20}% غداً
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-900 font-black flex items-center justify-center text-sm shadow-md">
              JIT
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ 2. مخطط المبيعات التاريخية لآخر 30 يوماً ═══════ */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h3 className="font-black text-base sm:text-lg text-stone-900">
                مخطط المبيعات التاريخية (أفضل 10 منتجات خلال آخر 30 يوماً)
              </h3>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-1">
              توزيع حجم المبيعات الإجمالي (بالكيلوغرام) مجمّعاً حسب أيام الأسبوع لرصد أنماط استهلاك أهل فاس
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-500">اختر المنتج للتحليل:</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="py-1.5 px-3 rounded-xl border border-stone-300 bg-stone-50 font-black text-xs text-stone-900 focus:outline-emerald-600"
            >
              {historyData.map((prod) => (
                <option key={prod.productId} value={prod.productId}>
                  {prod.icon} {prod.productName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* أزرار سريعة للتنقل بين أفضل 10 منتجات */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {historyData.map((item) => {
            const isSelected = item.productId === selectedProductId;
            return (
              <button
                key={item.productId}
                type="button"
                onClick={() => setSelectedProductId(item.productId)}
                className={`py-2 px-3 rounded-2xl border text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#163920] text-white border-[#163920] shadow-sm'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.productName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-[#FEF08A]' : 'bg-stone-200 text-stone-600'}`}>
                  {item.totalVolume30Days} كجم
                </span>
              </button>
            );
          })}
        </div>

        {/* المخطط البياني التفاعلي بالأعمدة (Bar Chart) */}
        {selectedProduct && (
          <div className="bg-stone-50/70 p-4 sm:p-6 rounded-3xl border border-stone-200/80">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedProduct.icon}</span>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-stone-900">
                    توزيع مبيعات "{selectedProduct.productName}" على مدار الأسبوع
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    إجمالي مبيعات آخر 30 يوماً: <strong className="text-emerald-800">{selectedProduct.totalVolume30Days} كجم</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-stone-600">
                  <span className="w-3 h-3 rounded-md bg-emerald-600" />
                  مبيعات الأيام العادية
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-stone-600">
                  <span className="w-3 h-3 rounded-md bg-[#EA580C]" />
                  أيام الذروة (الجمعة والسبت)
                </span>
              </div>
            </div>

            {/* أعمدة المخطط البياني */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 h-56 pt-6 pb-2 items-end">
              {selectedProduct.dailyDistribution.map((day) => {
                const heightPercent = Math.max(15, Math.round((day.volumeKg / maxVolume) * 100));
                const isPeak = day.dayName === 'الجمعة' || day.dayName === 'السبت';

                return (
                  <div key={day.dayName} className="flex flex-col items-center h-full justify-end group">
                    {/* تلميح القيمة */}
                    <span className="text-[11px] sm:text-xs font-black text-stone-700 tabular-nums mb-1 group-hover:text-emerald-700 transition-colors">
                      {day.volumeKg} <span className="text-[9px] text-stone-400">كجم</span>
                    </span>

                    {/* العمود التفاعلي */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[48px] rounded-2xl transition-all duration-300 relative group-hover:scale-105 shadow-xs ${
                        isPeak
                          ? 'bg-gradient-to-t from-[#C2410C] to-[#FB923C]'
                          : 'bg-gradient-to-t from-[#163920] to-[#2D6A3F]'
                      }`}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    </div>

                    {/* اسم اليوم وعدد الطلبات */}
                    <div className="mt-2 text-center">
                      <span className="block text-xs font-black text-stone-800">{day.dayName}</span>
                      <span className="block text-[10px] text-stone-400 font-mono">
                        {day.orderCount} طلب
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* بطاقة التحليل السفلي للمنتج */}
            <div className="mt-6 pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-stone-200">
                <span className="text-stone-500 font-bold block text-[11px]">متوسط الإثنين (سوق بنسودة):</span>
                <span className="text-sm font-black text-stone-900 tabular-nums">
                  {selectedProduct.averagePerMonday} كجم / أسبوع
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-stone-200">
                <span className="text-stone-500 font-bold block text-[11px]">مخزون الأمان الموصى به:</span>
                <span className="text-sm font-black text-emerald-800 tabular-nums">
                  {selectedProduct.currentStockRecommendation} كجم
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-stone-200">
                <span className="text-stone-500 font-bold block text-[11px]">تغير الطلب (مؤشر الذروة):</span>
                <span className="text-sm font-black text-orange-700 tabular-nums">
                  +{selectedProduct.spikePercentage}% هذا الشهر
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
