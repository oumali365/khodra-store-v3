// ============================================================
// الملف: Hero.tsx – الإصدار 3.0
// الواجهة الرئيسية – تصميم متناسق وتفاعلي
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  ShieldCheck,
  ArrowDown,
  Package,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from 'lucide-react';
import { STORE_CONFIG } from '../data/config';
import { ProductCategory } from '../types';

import heroBg1 from '../assets/images/fresh_vegetables_basket_1788941771901.jpg';
import heroBg2 from '../assets/images/fresh_fruits_harvest_1788941788583.jpg';
// ⚠️ استبدل هذا بـ صورة حقيقية للصناديق لاحقاً
import heroBg3 from '../assets/images/family_large_bundle.jpg';

interface HeroProps {
  onSelectCategory: (cat: ProductCategory) => void;
  onScrollToCatalog: () => void;
  onScrollToBundles?: () => void;
}

const HERO_SLIDES = [
  {
    image: heroBg1,
    badge: '🌿 طازج يومياً',
    title: 'خضار وفواكه طازجة،',
    highlight: 'مباشرة لباب دارك',
    description:
      'متبقاوش مقلقين من السوق! كنقطفو ليكم أطيب الخضر والفواكه الطازجة وأفضل السلع، طلبوا دابا بكل راحة وثقة.',
    primaryCTA: 'catalog',
  },
  {
    image: heroBg2,
    badge: '🍎 فيتامينات طبيعية',
    title: 'فواكه غنية بالنضارة،',
    highlight: 'حلوة ومختارة بعناية',
    description:
      'تشكيلة استثنائية من أشهى الفواكه الطازجة المغذية والغنية بالفيتامينات، تصلك نقية ومحفوظة بأعلى معايير الجودة.',
    primaryCTA: 'catalog',
  },
  {
    image: heroBg3,
    badge: '🧺 وفّر أكثر',
    title: 'صناديق عائلة خُضرة،',
    highlight: 'وفّر وقتك وفلوسك',
    description:
      'اختر الصندوق المناسب لحجم عائلتك، واستلم خضراً وفواكه طازجة أسبوعياً بسعر ثابت وجودة مضمونة — بدون ما تحتاج تسوق.',
    primaryCTA: 'bundles',
  },
];

export const Hero: React.FC<HeroProps> = ({
  onSelectCategory,
  onScrollToCatalog,
  onScrollToBundles,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number>(0);

  // ─── التبديل التلقائي ───
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
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
  const isBundleSlide = currentSlideData.primaryCTA === 'bundles';

  return (
    <section className="relative overflow-hidden pt-3 pb-6 sm:pt-6 sm:pb-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div
          className="relative rounded-[24px] sm:rounded-[36px] min-h-[460px] sm:min-h-[500px] p-5 sm:p-10 md:p-12 border border-[#D4C8B5] shadow-2xl text-center overflow-hidden flex flex-col justify-between select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* ════════ صور الخلفية ════════ */}
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                referrerPolicy="no-referrer"
                loading={index === 0 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}

          {/* ════════ طبقة تدرج ════════ */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1C10]/95 via-[#0B1C10]/70 to-[#0B1C10]/50" />

          {/* ════════ دوائر ضوئية ════════ */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#F5D76E]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#163920]/40 rounded-full blur-3xl pointer-events-none" />

          {/* ════════ أزرار التنقل الجانبية (سطح المكتب فقط) ════════ */}
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
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 max-w-3xl mx-auto py-4">

            {/* ─── شارة الشريحة الحالية ─── */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] sm:text-xs font-black text-white mb-4 shadow-sm animate-in fade-in duration-500">
              <Sparkles className="w-3 h-3 text-[#F5D76E]" />
              <span>{currentSlideData.badge}</span>
            </div>

            {/* ─── شارات الثقة ─── */}
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs font-black text-white shadow-xs">
                <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F5D76E]" />
                <span>توصيل مجاني فوق {STORE_CONFIG.freeDeliveryThreshold} {STORE_CONFIG.currency}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs font-black text-white shadow-xs">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F5D76E]" />
                <span>ضمان الجودة 100%</span>
              </span>
            </div>

            {/* ─── العنوان ─── */}
            <h1
              key={currentSlide}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4 drop-shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-700"
            >
              {currentSlideData.title}{' '}
              <span className="relative inline-block text-[#F5D76E]">
                {currentSlideData.highlight}
                <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#C25E12] to-transparent rounded-full opacity-90" />
              </span>
            </h1>

            {/* ─── الوصف ─── */}
            <p
              key={`desc-${currentSlide}`}
              className="text-sm sm:text-base md:text-lg text-[#EDE6D8] max-w-2xl mx-auto leading-relaxed mb-7 font-medium drop-shadow-sm animate-in fade-in duration-700"
            >
              {currentSlideData.description}
            </p>

            {/* ─── الأزرار ════════ */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* زر تسوق الآن */}
              <button
                type="button"
                id="hero-shop-now-btn"
                onClick={onScrollToCatalog}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl sm:rounded-full bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#EA580C] hover:to-[#C25E12] text-white font-black text-sm sm:text-base shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer group"
              >
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>تسوق الآن</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-200 animate-bounce stroke-[2.5]" />
              </button>

              {/* زر صناديق العائلة */}
              {onScrollToBundles && (
                <button
                  type="button"
                  onClick={onScrollToBundles}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl sm:rounded-full font-black text-sm sm:text-base shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer group border-2 ${
                    isBundleSlide
                      ? 'bg-gradient-to-r from-[#163920] to-[#0E2615] text-white border-[#F5D76E]'
                      : 'bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20'
                  }`}
                >
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#F5D76E]" />
                  <span>صناديق العائلة</span>
                  <Sparkles className="w-4 h-4 text-[#F5D76E] animate-pulse" />
                </button>
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
              <span>خدمة التوصيل نشطة اليوم في {STORE_CONFIG.city}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};