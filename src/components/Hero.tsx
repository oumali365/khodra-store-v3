// ============================================================
// الملف: Hero.tsx – الإصدار 4.3
// بطاقات الهيرو مع تمرير يدوي أفقي
// تحسينات: لوحة لونية موحّدة (3 ألوان)، ارتفاع متدرج، 
//          وصف مختصر، شارة عالية التباين، ظل أخضر للأزرار
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
}> = ({ primarySrc, fallbackSrc, alt, eager = false }) => {
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
      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
    />
  );
};

interface HeroProps {
  onSelectCategory: (cat: ProductCategory) => void;
  onScrollToCatalog: () => void;
  onScrollToBundles?: () => void;
}

// 🎨 اللوحة اللونية الموحّدة:
//   أخضر داكن  → #2D6A3F  (أساسي: الإطار، الشارة، الأيقونات)
//   أصفر محايد → #EAB308  (ثانوي: التسطير، العنوان الفرعي)
//   كريمي      → #FAFAF7  (محايد: النصوص الفاتحة، خلفية الأزرار)

const HERO_SLIDES = [
  {
    id: 'catalog-slide',
    image: HERO_PUBLIC_IMAGES.slide1.primary,
    fallbackImage: HERO_PUBLIC_IMAGES.slide1.fallback,
    badge: 'طراوة يومية مضمونة',
    title: 'خضار وفواكه طازجة،',
    highlight: 'مباشرة لباب دارك',
    // ✅ وصف في سطر واحد
    description: 'طازج يومياً، لباب دارك مباشرة.',
    primaryCTA: 'catalog' as const,
  },
  {
    id: 'bundles-slide',
    image: HERO_PUBLIC_IMAGES.slide2.primary,
    fallbackImage: HERO_PUBLIC_IMAGES.slide2.fallback,
    badge: 'باقات التوفير الأسبوعية',
    title: 'صناديق عائلة خُضرة،',
    highlight: 'وفّر وقتك وفلوسك',
    // ✅ وصف في سطر واحد
    description: 'صندوقك الأسبوعي بجودة ثابتة وسعر مضمون.',
    primaryCTA: 'bundles' as const,
  },
];

export const Hero: React.FC<HeroProps> = ({
  onSelectCategory: _onSelectCategory,
  onScrollToCatalog,
  onScrollToBundles,
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRaf = useRef<number | null>(null);

  const handleScroll = () => {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(() => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const cards = container.querySelectorAll('article');
      const containerCenter = container.getBoundingClientRect().left + container.offsetWidth / 2;

      let closestIdx = 0;
      let minDiff = Infinity;

      cards.forEach((card, idx) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const diff = Math.abs(cardCenter - containerCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      setActiveSlideIndex((prev) => (prev !== closestIdx ? closestIdx : prev));
    });
  };

  useEffect(() => {
    return () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    };
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
      <div className="relative max-w-3xl mx-auto">
        {/* ─── حاوية البطاقات مع التمرير اليدوي الأفقي ─── */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-row md:grid md:grid-cols-2 gap-4 sm:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 pt-1 px-2 sm:px-0 snap-x snap-proximity overscroll-x-contain no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {HERO_SLIDES.map((slide, index) => {
            const isActive = activeSlideIndex === index;

            return (
              <article
                key={slide.id}
                className={`group relative w-[86vw] max-w-[340px] sm:w-[335px] md:w-auto md:max-w-none shrink-0 snap-center rounded-3xl min-h-[400px] sm:min-h-[440px] lg:min-h-[460px] p-4 sm:p-5 lg:p-6 border-2 text-center overflow-hidden flex flex-col justify-between select-none transition-all duration-300 ${
                  // 🟢 إطار أخضر موحّد (3 ألوان فقط)
                  isActive
                    ? 'border-[#2D6A3F] shadow-[0_10px_32px_rgba(45,106,63,0.38)]'
                    : 'border-[#2D6A3F]/45 shadow-lg'
                }`}
              >
                {/* ════════ صورة الخلفية ════════ */}
                <div className="absolute inset-0 pointer-events-none">
                  <HeroImageDisplay
                    primarySrc={slide.image}
                    fallbackSrc={slide.fallbackImage}
                    alt={slide.title}
                    eager={index === 0}
                  />
                </div>

                {/* ════════ طبقة تدرج ════════ */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1C10]/95 via-[#0B1C10]/70 to-[#0B1C10]/45 pointer-events-none" />

                {/* ════════ دوائر ضوئية ════════ */}
                <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#EAB308]/12 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-[#2D6A3F]/45 rounded-full blur-3xl pointer-events-none" />

                {/* ════════ شارة علوية (خضراء داكنة عالية التباين) ════════ */}
                <div className="relative z-10 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2D6A3F]/90 backdrop-blur-md border border-[#4A9B5E]/60 text-[#FAFAF7] text-[11px] sm:text-xs font-black tracking-wide shadow-md">
                    <span>{slide.badge}</span>
                  </span>
                </div>

                {/* ════════ المحتوى ════════ */}
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 mx-auto py-3 text-center">
                  {/* ✅ عنوان بأحجام متدرجة أوضح */}
                  <h1 className="text-[22px] sm:text-[26px] lg:text-[28px] font-black text-white leading-[1.25] tracking-tight mb-3 drop-shadow-lg">
                    {slide.title}{' '}
                    <span className="relative inline-block text-[#EAB308]">
                      {slide.highlight}
                      {/* 🟡 تسطير أصفر محايد بسيط */}
                      <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#EAB308]/70 rounded-full" />
                    </span>
                  </h1>

                  {/* ✅ وصف في سطر واحد */}
                  <p className="text-[13px] sm:text-sm text-[#FAFAF7] leading-[1.7] mb-4 font-semibold drop-shadow-md max-w-[95%]">
                    {slide.description}
                  </p>

                  <div className="flex items-center justify-center w-full">
                    {slide.primaryCTA === 'catalog' ? (
                      <button
                        type="button"
                        id="hero-shop-now-btn"
                        onClick={onScrollToCatalog}
                        // ⚪ زر أبيض + ظل أخضر عضوي
                        className="w-full inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-white/95 backdrop-blur-sm text-[#2D6A3F] font-black text-sm shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:shadow-[0_6px_22px_rgba(45,106,63,0.32)] hover:bg-white hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 cursor-pointer group/btn border border-white/40"
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
                          // ⚪ زر أبيض + ظل أخضر عضوي
                          className="w-full inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-white/95 backdrop-blur-sm text-[#2D6A3F] font-black text-sm shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:shadow-[0_6px_22px_rgba(45,106,63,0.32)] hover:bg-white hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 cursor-pointer group/btn border border-white/40"
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
              </article>
            );
          })}
        </div>

        {/* ─── نقاط التنقل (أخضر موحّد) ─── */}
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