// ============================================================
// الملف: Hero.tsx – الإصدار 4.5
// بطاقات الهيرو مع تمرير يدوي أفقي
// تحسينات: Parallax خفيف + Fade at Focus + أداء محسّن
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowDown,
  Package,
  Leaf,
} from 'lucide-react';
import { STORE_CONFIG } from '../data/config';
import { ProductCategory } from '../types';

export const HERO_PUBLIC_IMAGES: Record<string, { primary: string; fallback: string }> = {
  slide1: {
    primary: '/images/hero-images/hero-1.webp',
    fallback: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&auto=format&fit=crop&q=80',
  },
  slide2: {
    primary: '/images/hero-images/hero-2.webp',
    fallback: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=1400&auto=format&fit=crop&q=80',
  },
};

const HeroImageDisplay: React.FC<{
  primarySrc: string;
  fallbackSrc: string;
  alt: string;
  eager?: boolean;
  parallaxOffset?: number; // ✅ إزاحة Parallax (px)
}> = ({ primarySrc, fallbackSrc, alt, eager = false, parallaxOffset = 0 }) => {
  const [src, setSrc] = useState(primarySrc);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (src !== fallbackSrc && fallbackSrc) {
      setSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#163920] to-[#0A180E]" />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={eager ? 'eager' : 'lazy'}
      decoding={eager ? 'sync' : 'async'}
      {...(eager ? ({ fetchPriority: 'high' } as any) : {})}
      onError={handleError}
      style={{
        transform: `translateX(${parallaxOffset}px) scale(1.12)`,
        transition: 'transform 0.15s ease-out',
        willChange: 'transform',
      }}
      className="w-full h-full object-cover object-center"
    />
  );
};

interface HeroProps {
  onSelectCategory: (cat: ProductCategory) => void;
  onScrollToCatalog: () => void;
  onScrollToBundles?: () => void;
}

const HERO_SLIDES = [
  {
    id: 'catalog-slide',
    image: HERO_PUBLIC_IMAGES.slide1.primary,
    fallbackImage: HERO_PUBLIC_IMAGES.slide1.fallback,
    badge: 'طراوة يومية مضمونة',
    title: 'خضار وفواكه طازجة،',
    highlight: 'مباشرة لباب دارك',
    description:
      'خضر وفواكه تُقطف يومياً وتوصل مباشرة لباب دارك، بجودة مضمونة وثقة كاملة.',
    primaryCTA: 'catalog' as const,
  },
  {
    id: 'bundles-slide',
    image: HERO_PUBLIC_IMAGES.slide2.primary,
    fallbackImage: HERO_PUBLIC_IMAGES.slide2.fallback,
    badge: 'باقات التوفير الأسبوعية',
    title: 'صناديق عائلة خُضرة،',
    highlight: 'وفّر وقتك وفلوسك',
    description:
      'اختر صندوقك الأسبوعي المناسب لعائلتك، واستلم خضراً طازجة بسعر ثابت وجودة مضمونة.',
    primaryCTA: 'bundles' as const,
  },
];

// ✅ أقصى إزاحة Parallax (px) — قيمة صغيرة تعطي عمقاً دون إزعاج
const PARALLAX_MAX = 22;
// ✅ مدة نبضة التركيز (ms) — متطابقة مع CSS
const FOCUS_PULSE_MS = 700;

export const Hero: React.FC<HeroProps> = ({
  onSelectCategory: _onSelectCategory,
  onScrollToCatalog,
  onScrollToBundles,
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [offsets, setOffsets] = useState<number[]>(() => HERO_SLIDES.map(() => 0));
  const [pulsingIndex, setPulsingIndex] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRaf = useRef<number | null>(null);
  const pulseTimer = useRef<number | null>(null);
  const prevActiveRef = useRef(0);

  // ✅ حساب موضع كل بطاقة + إزاحة Parallax المقابلة
  const updateLayout = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cards = container.querySelectorAll('article');
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestIdx = 0;
    let minDiff = Infinity;
    const newOffsets: number[] = [];

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const diff = cardCenter - containerCenter;

      // Parallax: كلما ابتعدت البطاقة عن المركز، تحركت الصورة عكسياً
      const ratio = Math.max(-1, Math.min(1, diff / containerRect.width));
      newOffsets[idx] = -ratio * PARALLAX_MAX;

      const absDiff = Math.abs(diff);
      if (absDiff < minDiff) {
        minDiff = absDiff;
        closestIdx = idx;
      }
    });

    setOffsets(newOffsets);
    setActiveSlideIndex((prev) => (prev !== closestIdx ? closestIdx : prev));
  };

  const handleScroll = () => {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(updateLayout);
  };

  // ✅ تشغيل نبضة التركيز عند تغيير البطاقة النشطة
  useEffect(() => {
    if (prevActiveRef.current === activeSlideIndex) return;
    prevActiveRef.current = activeSlideIndex;
    setPulsingIndex(activeSlideIndex);

    if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => {
      setPulsingIndex(null);
    }, FOCUS_PULSE_MS);
  }, [activeSlideIndex]);

  // ✅ حساب أولي بعد التركيب (لضبط الإزاحات)
  useEffect(() => {
    updateLayout();
    return () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToSlide = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cards = container.querySelectorAll('article');
    if (cards[index]) {
      const card = cards[index] as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const deltaX = (cardRect.left + cardRect.width / 2) - (containerRect.left + containerRect.width / 2);

      container.scrollBy({
        left: deltaX,
        behavior: 'smooth',
      });
      setActiveSlideIndex(index);
    }
  };

  return (
    <section
      className="relative overflow-hidden pt-3 pb-5 sm:pt-6 sm:pb-8 px-3 sm:px-6 lg:px-8"
      aria-label="الواجهة الرئيسية للمتجر"
    >
      {/* ════════ الأنماط الحركية ════════ */}
      <style>{`
        /* دخول البطاقات من اليمين عند التحميل */
        @keyframes heroFadeInRight {
          0%   { opacity: 0; transform: translateX(60px) scale(0.97); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        .hero-fade-in-right {
          animation: heroFadeInRight 0.85s cubic-bezier(0.16, 1, 0.3, 1) backwards;
          will-change: opacity, transform;
        }

        /* ✅ نبضة التركيز عند تنشيط بطاقة أثناء التمرير */
        @keyframes heroFocusPulse {
          0%   { opacity: 1; }
          35%  { opacity: 0.88; }
          100% { opacity: 1; }
        }
        .hero-focus-pulse {
          animation: heroFocusPulse ${FOCUS_PULSE_MS}ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ✅ احترام تفضيل الحركة المُقلّلة */
        @media (prefers-reduced-motion: reduce) {
          .hero-fade-in-right,
          .hero-focus-pulse { animation: none; }
        }
      `}</style>

      <div className="relative max-w-3xl mx-auto">
        {/* ─── حاوية البطاقات مع التمرير اليدوي الأفقي ─── */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-row md:grid md:grid-cols-2 gap-4 sm:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 pt-2 px-2 sm:px-0 snap-x snap-proximity overscroll-x-contain no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {HERO_SLIDES.map((slide, index) => {
            const isActive = activeSlideIndex === index;
            const isPulsing = pulsingIndex === index;

            return (
              <article
                key={slide.id}
                style={{ animationDelay: `${index * 180}ms` }}
                className={`hero-fade-in-right group relative w-[88vw] max-w-[360px] sm:w-[380px] md:w-auto md:max-w-none shrink-0 snap-center rounded-3xl min-h-[440px] sm:min-h-[500px] lg:min-h-[520px] p-5 sm:p-6 lg:p-7 border-2 text-center overflow-hidden flex flex-col justify-between select-none transition-all duration-300 ${
                  isActive
                    ? 'border-[#2D6A3F] shadow-[0_12px_38px_rgba(45,106,63,0.42)]'
                    : 'border-[#2D6A3F]/45 shadow-lg'
                }`}
              >
                {/* ════════ صورة الخلفية (مع Parallax) ════════ */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <HeroImageDisplay
                    primarySrc={slide.image}
                    fallbackSrc={slide.fallbackImage}
                    alt={slide.title}
                    eager={index === 0}
                    parallaxOffset={offsets[index] ?? 0}
                  />
                </div>

                {/* ════════ طبقة تدرج ════════ */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1C10]/95 via-[#0B1C10]/70 to-[#0B1C10]/45 pointer-events-none" />

                {/* ════════ دوائر ضوئية ════════ */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#EAB308]/12 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#2D6A3F]/45 rounded-full blur-3xl pointer-events-none" />

                {/* ════════ شارة علوية (برتقالية) ════════ */}
                <div className="relative z-10 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#C25E12] to-[#9C4505] backdrop-blur-md border border-[#EAB308]/40 text-white text-[11px] sm:text-xs font-black tracking-wide shadow-lg shadow-[#C25E12]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308] animate-pulse" />
                    <span>{slide.badge}</span>
                  </span>
                </div>

                {/* ════════ المحتوى ════════ */}
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 mx-auto py-4 text-center">
                  <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-black text-white leading-[1.25] tracking-tight mb-4 drop-shadow-lg">
                    {slide.title}{' '}
                    <span className="relative inline-block text-[#EAB308]">
                      {slide.highlight}
                      <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#EAB308]/70 rounded-full" />
                    </span>
                  </h1>

                  <p className="text-[13px] sm:text-sm text-[#FAFAF7] leading-[1.85] mb-5 font-semibold drop-shadow-md max-w-[95%]">
                    {slide.description}
                  </p>

                  <div className="flex items-center justify-center w-full">
                    {slide.primaryCTA === 'catalog' ? (
                      <button
                        type="button"
                        id="hero-shop-now-btn"
                        onClick={onScrollToCatalog}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 rounded-2xl bg-white/95 backdrop-blur-sm text-[#2D6A3F] font-black text-sm sm:text-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:shadow-[0_6px_22px_rgba(45,106,63,0.32)] hover:bg-white hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 cursor-pointer group/btn border border-white/40"
                      >
                        <Leaf className="w-4 h-4 text-[#2D6A3F]" />
                        <span>تسوق الآن</span>
                        <ArrowDown className="w-4 h-4 text-[#2D6A3F] group-hover/btn:translate-y-1 transition-transform duration-200 animate-bounce stroke-[2.5]" />
                      </button>
                    ) : (
                      onScrollToBundles && (
                        <button
                          type="button"
                          onClick={onScrollToBundles}
                          className="w-full inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 rounded-2xl bg-white/95 backdrop-blur-sm text-[#2D6A3F] font-black text-sm sm:text-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:shadow-[0_6px_22px_rgba(45,106,63,0.32)] hover:bg-white hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 cursor-pointer group/btn border border-white/40"
                        >
                          <Package className="w-4 h-4 text-[#2D6A3F]" />
                          <span>اكتشف الآن</span>
                          <ArrowDown className="w-4 h-4 text-[#2D6A3F] group-hover/btn:translate-y-1 transition-transform duration-200 animate-bounce stroke-[2.5]" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* ════════ الأسفل: حالة التوصيل ════════ */}
                <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#FAFAF7] bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                    <span>
                      خدمة التوصيل نشطة اليوم في {STORE_CONFIG.city}
                    </span>
                  </div>
                </div>

                {/* ✅ طبقة نبضة التركيز (فوق كل شيء، لا تعترض اللمس) */}
                {isPulsing && (
                  <div className="hero-focus-pulse absolute inset-0 rounded-3xl bg-white/8 pointer-events-none" />
                )}
              </article>
            );
          })}
        </div>

        {/* ─── نقاط التنقل ─── */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-3">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToSlide(i)}
              className={`h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                activeSlideIndex === i
                  ? 'w-7 bg-[#2D6A3F] shadow-xs'
                  : 'w-2.5 bg-[#2D6A3F]/30 hover:bg-[#2D6A3F]/55'
              }`}
              aria-label={`الانتقال إلى البطاقة ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};