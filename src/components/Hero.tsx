// ============================================================
// الملف: Hero.tsx – الإصدار 6.0
// الواجهة الرئيسية – زر موحّد + وصف أوضح + توسيط مثالي
// ============================================================
import React, { useState, useRef } from 'react';
import {
  ArrowDown,
  Package,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from 'lucide-react';
import { STORE_CONFIG } from '../data/config';
import { ProductCategory } from '../types';

interface HeroProps {
  onSelectCategory: (cat: ProductCategory) => void;
  onScrollToCatalog: () => void;
  onScrollToBundles?: () => void;
}

const HERO_SLIDES = [
  {
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&auto=format&fit=crop&q=80',
    title: 'خضار وفواكه طازجة،',
    highlight: 'مباشرة لباب دارك',
    description:
      'متبقاوش مقلقين من السوق! كنقطفو ليكم أطيب الخضر والفواكه الطازجة وأفضل السلع، طلبوا دابا بكل راحة وثقة.',
    primaryCTA: 'catalog',
  },
  {
    image:
      'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=1400&auto=format&fit=crop&q=80',
    title: 'صناديق عائلة خُضرة،',
    highlight: 'وفّر وقتك وفلوسك',
    description:
      'اختر الصندوق المناسب لحجم عائلتك، واستلم خضراً وفواكه طازجة أسبوعياً بسعر ثابت وجودة مضمونة',
    primaryCTA: 'bundles',
  },
];

export const Hero: React.FC<HeroProps> = ({
  onSelectCategory: _onSelectCategory,
  onScrollToCatalog,
  onScrollToBundles,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number>(0);

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const goToPrev = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
    );
  };

  // ─── Swipe على الهاتف ───
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  const currentSlideData = HERO_SLIDES[currentSlide];

  return (
    <section className="relative overflow-hidden pt-3 pb-6 sm:pt-6 sm:pb-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div
          className="relative rounded-[24px] sm:rounded-[36px] min-h-[460px] sm:min-h-[520px] p-5 sm:p-10 md:p-12 border border-[#D4C8B5] shadow-2xl text-center overflow-hidden flex flex-col justify-between select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* ════════ صور الخلفية ════════ */}
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                referrerPolicy="no-referrer"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding={index === 0 ? 'sync' : 'async'}
                {...(index === 0
                  ? ({ fetchPriority: 'high' } as any)
                  : {})}
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}

          {/* ════════ طبقة تدرج ════════ */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1C10]/95 via-[#0B1C10]/70 to-[#0B1C10]/50" />

          {/* ════════ دوائر ضوئية ════════ */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#F5D76E]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#163920]/40 rounded-full blur-3xl pointer-events-none" />

          {/* ════════ أزرار التنقل الجانبية (سطح المكتب) ════════ */}
          <button
            type="button"
            onClick={goToPrev}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white items-center justify-center transition-all active:scale-90 cursor-pointer"
            aria-label="الصورة السابقة"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={goToNext}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white items-center justify-center transition-all active:scale-90 cursor-pointer"
            aria-label="الصورة التالية"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* ════════ المحتوى ════════ */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 max-w-3xl mx-auto py-6 text-center">
            {/* ─── العنوان ─── */}
            <h1
              key={currentSlide}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.2] tracking-tight mb-6 drop-shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-700"
            >
              {currentSlideData.title}{' '}
              <span className="relative inline-block text-[#F5D76E]">
                {currentSlideData.highlight}
                <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#C25E12] to-transparent rounded-full opacity-90" />
              </span>
            </h1>

            {/* ─── الوصف (أكبر وأوضح) ─── */}
            <p
              key={`desc-${currentSlide}`}
              className="text-base sm:text-lg md:text-xl text-[#F5EFE3] max-w-2xl mx-auto leading-[1.9] mb-9 font-semibold drop-shadow-md animate-in fade-in duration-700"
            >
              {currentSlideData.description}
            </p>

            {/* ─── زر واحد لكل شريحة (تصميم موحّد برتقالي) ════════ */}
            <div className="flex items-center justify-center w-full sm:w-auto">
              {currentSlideData.primaryCTA === 'catalog' ? (
                <button
                  type="button"
                  id="hero-shop-now-btn"
                  onClick={onScrollToCatalog}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 sm:px-9 sm:py-4 rounded-2xl sm:rounded-full bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#EA580C] hover:to-[#C25E12] text-white font-black text-base sm:text-lg shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer group"
                >
                  <Leaf className="w-5 h-5" />
                  <span>تسوق الآن</span>
                  <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-200 animate-bounce stroke-[2.5]" />
                </button>
              ) : (
                onScrollToBundles && (
                  <button
                    type="button"
                    onClick={onScrollToBundles}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 sm:px-9 sm:py-4 rounded-2xl sm:rounded-full bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#EA580C] hover:to-[#C25E12] text-white font-black text-base sm:text-lg shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer group"
                  >
                    <Package className="w-5 h-5" />
                    <span>اكتشف الآن</span>
                    <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-200 animate-bounce stroke-[2.5]" />
                  </button>
                )
              )}
            </div>
          </div>

          {/* ════════ الأسفل ════════ */}
          <div className="relative z-10 mt-6 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* النقاط */}
            <div
              className="flex items-center gap-2 sm:gap-2.5 py-1"
              role="tablist"
              aria-label="خلفيات الهيرو"
            >
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-label={`الصورة ${i + 1}`}
                  aria-selected={i === currentSlide}
                  onClick={() => setCurrentSlide(i)}
                  className={`transition-all duration-500 rounded-full cursor-pointer ${
                    i === currentSlide
                      ? 'w-8 h-2.5 bg-[#F5D76E] shadow-sm'
                      : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>

            {/* حالة التوصيل */}
            <div className="flex items-center gap-2 text-[11px] sm:text-sm font-extrabold text-[#EDE6D8] bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
              <span>
                خدمة التوصيل نشطة اليوم في {STORE_CONFIG.city}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};