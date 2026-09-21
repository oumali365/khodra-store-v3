import React, { useState, useRef, useEffect } from 'react';
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

  const bannerRef = useRef<HTMLElement | null>(null);

  // ضبط متغير CSS بارتفاع البانر لاستخدامه في تعويض باقي الصفحة
  useEffect(() => {
    if (isDismissed) {
      document.documentElement.style.setProperty('--free-delivery-banner-h', '0px');
      return;
    }
    const el = bannerRef.current;
    if (!el) return;

    const setH = () => {
      document.documentElement.style.setProperty(
        '--free-delivery-banner-h',
        `${el.offsetHeight}px`
      );
    };
    setH();

    const ro = new ResizeObserver(setH);
    ro.observe(el);
    window.addEventListener('resize', setH);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setH);
    };
  }, [isDismissed]);

  if (isDismissed) return null;

  const threshold = STORE_CONFIG.freeDeliveryThreshold;
  const remaining = Math.max(0, threshold - cartTotal);
  const isFreeUnlocked = cartTotal >= threshold;
  const formatAmount = (v: number) => `${v.toFixed(2)} DH`;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      sessionStorage.setItem('khodra_free_delivery_banner_dismissed', 'true');
    } catch {}
    setIsDismissed(true);
  };

  return (
    <aside
      ref={bannerRef}
      id="free-delivery-banner-khodra-theme"
      dir="rtl"
      aria-label="بانر التوصيل المجاني"
      className="fixed top-0 left-0 right-0 w-full bg-gradient-to-l from-[#F5D76E] via-[#F7DE8A] to-[#F5D76E] text-[#112616] border-b border-[#E5C352] shadow-md z-[9999] select-none transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* زر الإغلاق يمين */}
        <button
          type="button"
          onClick={handleDismiss}
          className="group w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#163920]/70 hover:text-[#112616] rounded-full hover:bg-black/10 active:scale-90 transition-all shrink-0"
          aria-label="إغلاق البانر"
        >
          <X className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.4] group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* النص */}
        <div className="min-w-0 flex-1 text-center">
          {isFreeUnlocked ? (
            <p className="font-black text-sm sm:text-base md:text-[17px] font-['Tajawal'] flex items-center justify-center gap-1.5">
              مبروك! حصلت على توصيل مجاني لباب دارك 🎉
            </p>
          ) : cartTotal > 0 ? (
            <p className="font-black text-sm sm:text-base md:text-[17px] font-['Tajawal']">
              توصيل مجاني عند إكمال{' '}
              <span className="inline-block bg-[#163920] text-[#F5D76E] px-2 py-0.5 rounded-md font-black tabular-nums">
                {formatAmount(remaining)}
              </span>
            </p>
          ) : (
            <p className="font-black text-sm sm:text-base md:text-[18px] font-['Tajawal']">
              توصيل مجاني عند إكمال{' '}
              <span className="inline-block bg-[#163920] text-[#F5D76E] px-2 py-0.5 rounded-md font-black tabular-nums">
                {formatAmount(threshold)}
              </span>
            </p>
          )}
        </div>

        {/* الأيقونة يسار */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-[#E5C352] p-0.5 shrink-0">
          <div className="w-full h-full rounded-[13px] bg-[#163920] flex items-center justify-center text-white">
            {isFreeUnlocked ? (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5D76E] animate-bounce" />
            ) : (
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5D76E]" />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};