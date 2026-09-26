// ============================================================
// الملف: Hero.tsx – الإصدار 7.0
// بطاقات الهيرو المفصولة مع تمرير يدوي أفقي (نموذج مشابه لـ Family Boxes)
// وصور منظمة داخل مجلد /images/hero-images/
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

const HERO_SLIDES = [
  {
    id: 'catalog-slide',
    image: HERO_PUBLIC_IMAGES.slide1.primary,
    fallbackImage: HERO_PUBLIC_IMAGES.slide1.fallback,
    badge: 'طراوة يومية مضمونة',
    title: 'خضار وفواكه طازجة،',
    highlight: 'مباشرة لباب دارك',
    description:
      'متبقاوش مقلقين من السوق! كنقطفو ليكم أطيب الخضر والفواكه الطازجة وأفضل السلع، طلبوا دابا بكل راحة وثقة.',
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
      'اختر الصندوق المناسب لحجم عائلتك، واستلم خضراً وفواكه طازجة أسبوعياً بسعر ثابت وجودة مضمونة.',
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
      <div className="max-w-7xl mx-auto">
        {/* ─── حاوية البطاقات المفصولة مع التمرير اليدوي الأفقي (نموذج مشابه لـ Family Boxes) ─── */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-row md:grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-7 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 pt-1 px-1 sm:px-0 snap-x snap-mandatory overscroll-x-contain no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {HERO_SLIDES.map((slide, index) => {
            const isActive = activeSlideIndex === index;

            return (
              <article
                key={slide.id}
                className={`group relative w-[86vw] max-w-[390px] sm:w-[460px] md:w-auto md:max-w-none shrink-0 snap-center rounded-[24px] sm:rounded-[32px] min-h-[420px] sm:min-h-[460px] p-5 sm:p-8 md:p-9 border-2 shadow-xl text-center overflow-hidden flex flex-col justify-between select-none transition-colors duration-200 ${
                  isActive ? 'border-[#008A4B]' : 'border-[#D4C8B5]'
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
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#F5D76E]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#163920]/40 rounded-full blur-3xl pointer-events-none" />

                {/* ════════ شارة علوية ════════ */}
                <div className="relative z-10 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F5D76E] text-xs font-black tracking-wide shadow-sm">
                    <span>{slide.badge}</span>
                  </span>
                </div>

                {/* ════════ المحتوى ════════ */}
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 max-w-xl mx-auto py-5 text-center">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-[1.25] tracking-tight mb-4 drop-shadow-lg">
                    {slide.title}{' '}
                    <span className="relative inline-block text-[#F5D76E]">
                      {slide.highlight}
                      <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#C25E12] to-transparent rounded-full opacity-90" />
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-[#F5EFE3] max-w-md mx-auto leading-[1.85] mb-7 font-semibold drop-shadow-md">
                    {slide.description}
                  </p>

                  <div className="flex items-center justify-center w-full sm:w-auto">
                    {slide.primaryCTA === 'catalog' ? (
                      <button
                        type="button"
                        id="hero-shop-now-btn"
                        onClick={onScrollToCatalog}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl sm:rounded-full bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#EA580C] hover:to-[#C25E12] text-white font-black text-sm sm:text-base shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer group/btn"
                      >
                        <Leaf className="w-5 h-5" />
                        <span>تسوق الآن</span>
                        <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-y-1 transition-transform duration-200 animate-bounce stroke-[2.5]" />
                      </button>
                    ) : (
                      onScrollToBundles && (
                        <button
                          type="button"
                          onClick={onScrollToBundles}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl sm:rounded-full bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#EA580C] hover:to-[#C25E12] text-white font-black text-sm sm:text-base shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer group/btn"
                        >
                          <Package className="w-5 h-5" />
                          <span>اكتشف الآن</span>
                          <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-y-1 transition-transform duration-200 animate-bounce stroke-[2.5]" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* ════════ الأسفل: حالة التوصيل ════════ */}
                <div className="relative z-10 pt-3.5 border-t border-white/15 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs font-extrabold text-[#EDE6D8] bg-white/5 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/10">
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

        {/* ─── نقاط التمرير اليدوي (مماثل لقسم Family Boxes) ─── */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-3">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToSlide(i)}
              className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                activeSlideIndex === i ? 'w-6 bg-[#008A4B]' : 'w-2 bg-stone-300'
              }`}
              aria-label={`الانتقال إلى البطاقة ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
