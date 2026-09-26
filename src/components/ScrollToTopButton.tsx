// ============================================================
// ScrollToTopButton.tsx – الإصدار 1.0
// زر "العودة للأعلى" — الشكل الأمثل لمتجر خُضرة
// دائري + دائرة تقدم ذهبية + إزاحة فوق StickyBottomBar
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  /** المسافة بالبكسل قبل ظهور الزر (افتراضي: 400) */
  threshold?: number;
  /** إزاحة سفلية إضافية (افتراضي: 80 لتجنب StickyBottomBar) */
  bottomOffset?: number;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  threshold = 400,
  bottomOffset = 80,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const updateScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;

        setIsVisible(scrollTop > threshold);
        setScrollProgress(progress);
      });
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, [threshold]);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        @keyframes scrollTopFadeIn {
          0%   { opacity: 0; transform: translateY(20px) scale(0.8); }
          100% { opacity: 1; transform: translateY(0)    scale(1);   }
        }
        .scroll-top-enter {
          animation: scrollTopFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes scrollTopArrowBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-2px); }
        }
        .scroll-top-arrow-bounce {
          animation: scrollTopArrowBounce 2.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-top-enter,
          .scroll-top-arrow-bounce { animation: none; }
        }
      `}</style>

      {isVisible && (
        <button
          type="button"
          onClick={handleScrollToTop}
          aria-label="العودة إلى أعلى الصفحة"
          title="العودة للأعلى"
          style={{
            bottom: `calc(1rem + ${bottomOffset}px + env(safe-area-inset-bottom))`,
          }}
          className={`scroll-top-enter fixed right-4 z-40
            w-12 h-12 sm:w-13 sm:h-13
            rounded-full
            bg-gradient-to-br from-[#2D6A3F] to-[#1A3D24]
            hover:from-[#3A8152] hover:to-[#2D6A3F]
            text-white
            shadow-[0_6px_22px_rgba(45,106,63,0.38)]
            hover:shadow-[0_8px_28px_rgba(45,106,63,0.48)]
            border-2 border-[#EAB308]/50
            flex items-center justify-center
            cursor-pointer active:scale-90
            transition-all duration-200
            group`}
        >
          {/* ═══ دائرة التقدم ═══ */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            {/* الخلفية */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(234, 179, 8, 0.15)"
              strokeWidth="3.5"
            />
            {/* التقدم */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#EAB308"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - scrollProgress / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.15s linear' }}
            />
          </svg>

          {/* ═══ السهم ═══ */}
          <ChevronUp
            className="w-5 h-5 sm:w-6 sm:h-6 text-[#EAB308] relative z-10
              scroll-top-arrow-bounce
              group-hover:scale-110 group-hover:-translate-y-0.5
              transition-transform duration-200"
            strokeWidth={2.5}
          />
        </button>
      )}
    </>
  );
};