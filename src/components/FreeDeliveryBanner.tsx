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
      className="w-full bg-[#F5D76E] text-[#112616] border-b border-[#E5C352] shadow-xs z-40 select-none transition-all duration-300 relative"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* ─── اليمين: أيقونة الشاحنة + العبارة الواضحة الاحترافية ─── */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          {/* أيقونة التوصيل بالشاحنة متطابقة مع حجم وتصميم أيقونة المتجر */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white flex items-center justify-center shadow-xs shrink-0 border border-[#E5C352] overflow-hidden p-0.5">
            <div className="w-full h-full rounded-[13px] bg-[#163920] flex items-center justify-center text-white">
              {isFreeUnlocked ? (
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5D76E] animate-bounce" />
              ) : (
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5D76E]" />
              )}
            </div>
          </div>

          {/* العبارة الواضحة والبارزة بحجم متوازن واحترافي */}
          <div className="min-w-0 flex-1">
            {isFreeUnlocked ? (
              <p className="text-[#112616] font-black text-sm sm:text-base md:text-[17px] leading-snug font-['Tajawal'] tracking-tight flex items-center gap-1.5">
                <span>مبروك! حصلت على توصيل مجاني لباب دارك 🎉</span>
              </p>
            ) : cartTotal > 0 ? (
              <p className="text-[#112616] font-black text-sm sm:text-base md:text-[17px] leading-snug font-['Tajawal'] tracking-tight">
               توصيل مجاني عند إكمال <span className="underline decoration-2 decoration-[#163920] font-black">{remaining.toFixed(2)} DH</span> 
              </p>
            ) : (
              <p className="text-[#112616] font-black text-sm sm:text-base md:text-[18px] leading-snug font-['Tajawal'] tracking-tight">
                توصيل مجاني عند إكمال {threshold.toFixed(2)} DH
              </p>
            )}
          </div>
        </div>

        {/* ─── اليسار: زر الإغلاق ✕ ─── */}
        <button
          type="button"
          id="free-delivery-banner-dismiss-btn"
          onClick={handleDismiss}
          className="w-7 h-7 sm:w-8 sm:h-8 min-w-[28px] min-h-[28px] flex items-center justify-center text-[#163920]/80 hover:text-[#112616] rounded-full hover:bg-black/10 active:scale-90 transition-all cursor-pointer touch-manipulation shrink-0"
          aria-label="إغلاق البانر"
        >
          <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.4]" />
        </button>

      </div>
    </aside>
  );
};
