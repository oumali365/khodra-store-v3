import React, { useState } from 'react';
import { Truck, X, CheckCircle2 } from 'lucide-react';
import { STORE_CONFIG } from '../data/config';

interface FreeDeliveryBannerProps {
  cartTotal?: number;
}

export const FreeDeliveryBanner: React.FC<FreeDeliveryBannerProps> = ({
  cartTotal = 0,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('khodra_free_delivery_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if (isDismissed) return null;

  const threshold = STORE_CONFIG.freeDeliveryThreshold; // 250 DH
  const remaining = Math.max(0, threshold - cartTotal);
  const isFreeUnlocked = cartTotal >= threshold;

  // تنسيق المبلغ بالشكل المطلوب: 250.00 DH
  const formatAmount = (value: number) => `${value.toFixed(2)} DH`;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      sessionStorage.setItem('khodra_free_delivery_banner_dismissed', 'true');
    } catch {
      // ignore
    }
    setIsDismissed(true);
  };

  return (
    <aside
      id="free-delivery-banner-khodra-theme"
      dir="rtl"
      aria-label="بانر التوصيل المجاني"
      className="w-full bg-gradient-to-l from-[#F5D76E] via-[#F7DE8A] to-[#F5D76E] text-[#112616] border-b border-[#E5C352] shadow-sm z-40 select-none transition-all duration-300 relative overflow-hidden"
    >
      {/* خط تزييني سفلي رفيع */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-l from-[#163920] via-[#1F4D2A] to-[#163920] opacity-80" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">

        {/* ─── اليمين: زر الإغلاق ✕ ─── */}
        <button
          type="button"
          id="free-delivery-banner-dismiss-btn"
          onClick={handleDismiss}
          className="group w-7 h-7 sm:w-8 sm:h-8 min-w-[28px] min-h-[28px] flex items-center justify-center text-[#163920]/70 hover:text-[#112616] rounded-full hover:bg-black/10 active:scale-90 transition-all cursor-pointer touch-manipulation shrink-0"
          aria-label="إغلاق البانر"
        >
          <X className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.4] group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* ─── المنتصف: العبارة الواضحة ─── */}
        <div className="min-w-0 flex-1 text-center">
          {isFreeUnlocked ? (
            <p className="text-[#112616] font-black text-sm sm:text-base md:text-[17px] leading-snug font-['Tajawal'] tracking-tight flex items-center justify-center gap-1.5">
              <span>مبروك! حصلت على توصيل مجاني لباب دارك 🎉</span>
            </p>
          ) : cartTotal > 0 ? (
            <p className="text-[#112616] font-black text-sm sm:text-base md:text-[17px] leading-snug font-['Tajawal'] tracking-tight">
              توصيل مجاني عند إكمال{' '}
              <span className="inline-block bg-[#163920] text-[#F5D76E] px-2 py-0.5 rounded-md font-black tabular-nums shadow-xs">
                {formatAmount(remaining)}
              </span>
            </p>
          ) : (
            <p className="text-[#112616] font-black text-sm sm:text-base md:text-[18px] leading-snug font-['Tajawal'] tracking-tight">
              توصيل مجاني عند إكمال{' '}
              <span className="inline-block bg-[#163920] text-[#F5D76E] px-2 py-0.5 rounded-md font-black tabular-nums shadow-xs">
                {formatAmount(threshold)}
              </span>
            </p>
          )}
        </div>

        {/* ─── اليسار: أيقونة الشاحنة ─── */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0 border border-[#E5C352] overflow-hidden p-0.5">
            <div className="w-full h-full rounded-[13px] bg-[#163920] flex items-center justify-center text-white">
              {isFreeUnlocked ? (
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5D76E] animate-bounce" />
              ) : (
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5D76E]" />
              )}
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};