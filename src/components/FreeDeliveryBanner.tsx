import React, { useState, useEffect, useMemo } from 'react';
import { Truck, X, CheckCircle2, Sparkles } from 'lucide-react';
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

  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const threshold = STORE_CONFIG.freeDeliveryThreshold;
  const remaining = Math.max(0, threshold - cartTotal);
  const isFreeUnlocked = cartTotal >= threshold;

  // حساب نسبة التقدم
  const progressPercent = useMemo(() => {
    if (threshold <= 0) return 100;
    return Math.min(100, (cartTotal / threshold) * 100);
  }, [cartTotal, threshold]);

  // تأثير الظهور التدريجي عند التحميل
  useEffect(() => {
    if (!isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 150);
      return () => clearTimeout(timer);
    }
  }, [isDismissed]);

  // تحريك شريط التقدم بسلاسة
  useEffect(() => {
    const timer = setTimeout(() => setProgress(progressPercent), 300);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  // تأثير الاحتفال عند فتح التوصيل المجاني
  useEffect(() => {
    if (isFreeUnlocked) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isFreeUnlocked]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => {
      try {
        sessionStorage.setItem('khodra_free_delivery_banner_dismissed', 'true');
      } catch {
        // ignore
      }
      setIsDismissed(true);
    }, 300);
  };

  if (isDismissed) return null;

  return (
    <>
      {/* أنماط مخصصة للحركات */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 215, 110, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(245, 215, 110, 0); }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(1.5); }
        }
        @keyframes sparkleRotate {
          0%, 100% { transform: rotate(0deg) scale(1); opacity: 1; }
          50% { transform: rotate(180deg) scale(1.2); opacity: 0.7; }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      <aside
        id="free-delivery-banner-khodra-theme"
        dir="rtl"
        aria-label="بانر التوصيل المجاني"
        className={`
          w-full relative z-40 select-none overflow-hidden
          transition-all duration-500 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}
        `}
        style={{
          background: isFreeUnlocked
            ? 'linear-gradient(135deg, #F5D76E 0%, #E8C547 50%, #F5D76E 100%)'
            : 'linear-gradient(135deg, #F5D76E 0%, #F0D060 100%)',
          backgroundSize: '200% 200%',
          animation: isFreeUnlocked ? 'gradientShift 3s ease infinite' : 'none',
          boxShadow: '0 4px 20px -4px rgba(22, 57, 32, 0.15), 0 1px 0 0 rgba(255,255,255,0.3) inset',
        }}
      >
        {/* خط علوي متدرج */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #163920, #F5D76E, #163920, transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite',
          }}
        />

        {/* شريط التقدم في الأسفل */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#163920]/10">
          <div
            className="h-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{
              width: `${progress}%`,
              background: isFreeUnlocked
                ? 'linear-gradient(90deg, #163920, #2D5A3D, #163920)'
                : 'linear-gradient(90deg, #163920, #3D7A4D)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                animation: 'shimmer 2s linear infinite',
              }}
            />
          </div>
        </div>

        {/* تأثير التوهج عند الاحتفال */}
        {isFreeUnlocked && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}
          />
        )}

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4 relative">

          {/* ─── اليمين: الأيقونة + النص ─── */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">

            {/* أيقونة الشاحنة مع تأثيرات */}
            <div className="relative shrink-0">
              {/* هالة خارجية */}
              <div
                className={`
                  absolute inset-0 rounded-2xl
                  ${isFreeUnlocked ? 'bg-[#163920]/20' : 'bg-white/40'}
                  blur-md
                `}
              />

              <div
                className={`
                  relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl
                  flex items-center justify-center
                  transition-all duration-500
                  ${isFreeUnlocked
                    ? 'bg-[#163920] scale-105'
                    : 'bg-white border-2 border-[#163920]/20'
                  }
                  shadow-lg
                `}
              >
                <div
                  className={`
                    w-full h-full rounded-[14px] flex items-center justify-center
                    transition-all duration-500
                    ${isFreeUnlocked ? 'bg-[#163920]' : 'bg-[#163920]'}
                  `}
                >
                  {isFreeUnlocked ? (
                    <CheckCircle2
                      className="w-6 h-6 sm:w-7 sm:h-7 text-[#F5D76E] animate-bounce drop-shadow-lg"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <Truck
                      className="w-6 h-6 sm:w-7 sm:h-7 text-[#F5D76E] transition-transform duration-300 group-hover:scale-110"
                      strokeWidth={2.2}
                    />
                  )}
                </div>

                {/* شرارة متحركة */}
                {!isFreeUnlocked && (
                  <Sparkles
                    className="absolute -top-1 -left-1 w-3.5 h-3.5 text-[#163920]"
                    style={{ animation: 'sparkleRotate 2s ease-in-out infinite' }}
                  />
                )}
              </div>
            </div>

            {/* النص */}
            <div className="min-w-0 flex-1">
              {isFreeUnlocked ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[#112616] font-black text-sm sm:text-base md:text-[17px] leading-snug font-['Tajawal'] tracking-tight">
                    مبروك! حصلت على توصيل مجاني لباب دارك
                  </p>
                  <span className="text-lg sm:text-xl animate-bounce inline-block">🎉</span>

                  {/* تأثير الجسيمات */}
                  {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[...Array(6)].map((_, i) => (
                        <span
                          key={i}
                          className="absolute text-sm"
                          style={{
                            left: `${15 + i * 14}%`,
                            top: '50%',
                            animation: `floatUp ${1 + i * 0.15}s ease-out forwards`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        >
                          {['✨', '⭐', '💫', '🌟', '✨', '⭐'][i]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : cartTotal > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[#112616] font-black text-sm sm:text-base md:text-[17px] leading-snug font-['Tajawal'] tracking-tight">
                    توصيل مجاني عند إكمال
                  </p>
                  <span
                    className="
                      inline-flex items-center px-2.5 py-1 rounded-lg
                      bg-[#163920] text-[#F5D76E]
                      font-black text-sm sm:text-base
                      shadow-md
                      transition-all duration-300
                      hover:scale-105
                    "
                  >
                    {remaining.toFixed(2)} DH
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[#112616] font-black text-sm sm:text-base md:text-[18px] leading-snug font-['Tajawal'] tracking-tight">
                    🚚 توصيل مجاني عند إكمال
                  </p>
                  <span
                    className="
                      inline-flex items-center px-2.5 py-1 rounded-lg
                      bg-[#163920] text-[#F5D76E]
                      font-black text-sm sm:text-base
                      shadow-md
                    "
                  >
                    {threshold.toFixed(2)} DH
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ─── اليسار: زر الإغلاق ─── */}
          <button
            type="button"
            id="free-delivery-banner-dismiss-btn"
            onClick={handleDismiss}
            className="
              group relative
              w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px]
              flex items-center justify-center
              text-[#163920]/70 hover:text-[#112616]
              rounded-full
              hover:bg-[#163920]/10
              active:scale-90
              transition-all duration-200
              cursor-pointer touch-manipulation shrink-0
              hover:rotate-90
            "
            aria-label="إغلاق البانر"
          >
            <X className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.5]" />
          </button>

        </div>
      </aside>
    </>
  );
};