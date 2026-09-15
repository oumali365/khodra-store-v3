// ============================================================
// الملف: Hero.tsx – الإصدار 2.0 (يدعم صناديق العائلة)
// ============================================================
import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, ArrowDown, Package, Sparkles } from 'lucide-react';
import { STORE_CONFIG } from '../data/config';
import { ProductCategory } from '../types';

import heroBg1 from '../assets/images/fresh_vegetables_basket_1788941771901.jpg';
import heroBg2 from '../assets/images/fresh_fruits_harvest_1788941788583.jpg';
// ⚠️ أضف صورة ثالثة للصناديق (اختياري):
// import heroBg3 from '../assets/images/family_bundle_hero.jpg';

interface HeroProps {
  onSelectCategory: (cat: ProductCategory) => void;
  onScrollToCatalog: () => void;
  onScrollToBundles?: () => void;  // ← جديد: للتمرير إلى قسم الصناديق
}

const HERO_SLIDES = [
  {
    image: heroBg1,
    title: 'خضار وفواكه طازجة،',
    highlight: 'مباشرة لباب دارك',
    description: 'متبقاوش مقلقين من السوق! كنقطفو ليكم أطيب الخضر والفواكه الطازجة وأفضل السلع، طلبوا دابا بكل راحة وثقة.',
  },
  {
    image: heroBg2,
    title: 'فواكه غنية بالنضارة،',
    highlight: 'حلوة ومختارة بعناية',
    description: 'تشكيلة استثنائية من أشهى الفواكه الطازجة المغذية والغنية بالفيتامينات، تصلك نقية ومحفوظة بأعلى معايير الجودة.',
  },
  // ─── 🧺 Slide جديد لصناديق العائلة ───
  {
    image: heroBg1,  // ← استبدلها بـ heroBg3 إذا أضفت صورة
    title: 'صناديق عائلة خُضرة،',
    highlight: 'وفّر وقتك وفلوسك',
    description: 'اختر الصندوق المناسب لحجم عائلتك، واستلم خضراً وفواكه طازجة أسبوعياً بسعر ثابت وجودة مضمونة — بدون ما تحتاج تسوق.',
  },
];

export const Hero: React.FC<HeroProps> = ({
  onSelectCategory,
  onScrollToCatalog,
  onScrollToBundles,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const isBundleSlide = currentSlide === 2;

  return (
    <section className="relative overflow-hidden pt-4 pb-6 sm:pt-6 sm:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div
          className="relative rounded-[28px] sm:rounded-[36px] min-h-[440px] sm:min-h-[480px] p-6 sm:p-10 md:p-12 border border-[#D4C8B5] shadow-xl text-center overflow-hidden flex flex-col justify-between"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* ─── صور الخلفية ─── */}
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
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

          {/* ─── طبقة تدرج ─── */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1C10]/95 via-[#0B1C10]/75 to-[#0B1C10]/55" />

          {/* دوائر ضوئية ناعمة */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#E5832E]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#1E4327]/30 rounded-full blur-3xl pointer-events-none" />

          {/* ─── المحتوى ─── */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 max-w-3xl mx-auto">
            {/* ─── شارات الثقة ─── */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs font-black text-white shadow-xs transition-colors">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>توصيل مجاني فوق {STORE_CONFIG.freeDeliveryThreshold} {STORE_CONFIG.currency}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs font-black text-white shadow-xs transition-colors">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>ضمان الجودة 100%</span>
              </span>
            </div>

            {/* ─── العنوان ─── */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4 drop-shadow-md">
              {HERO_SLIDES[currentSlide].title}{' '}
              <span className="relative inline-block text-[#FDBA74]">
                {HERO_SLIDES[currentSlide].highlight}
                <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#E5832E] to-transparent rounded-full opacity-90" />
              </span>
            </h1>

            {/* ─── الوصف ─── */}
            <p className="text-sm sm:text-base md:text-lg text-[#EDE6D8] max-w-2xl mx-auto leading-relaxed mb-8 font-medium drop-shadow-xs">
              {HERO_SLIDES[currentSlide].description}
            </p>

            {/* ─── الأزرار ─── */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {/* زر تسوق الآن */}
              <button
                type="button"
                id="hero-shop-now-btn"
                onClick={onScrollToCatalog}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-[#EA580C] via-[#C25E12] to-[#9C4505] hover:from-[#F97316] hover:to-[#C25E12] text-white font-black text-base shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer group"
              >
                <span>تسوق الآن</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-200 animate-bounce stroke-[2.5]" />
              </button>

              {/* ─── 🧺 زر صناديق العائلة ─── */}
              {onScrollToBundles && (
                <button
                  type="button"
                  onClick={onScrollToBundles}
                  className={`inline-flex items-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-full font-black text-base shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer group border-2 ${
                    isBundleSlide
                      ? 'bg-gradient-to-r from-[#1E4327] to-[#112616] text-white border-emerald-400'
                      : 'bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20'
                  }`}
                >
                  <Package className="w-4 h-4 text-[#FDBA74]" />
                  <span>صناديق العائلة</span>
                  <Sparkles className="w-4 h-4 text-[#FDBA74] animate-pulse" />
                </button>
              )}
            </div>
          </div>

          {/* ─── الأسفل ─── */}
          <div className="relative z-10 mt-6 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* النقاط */}
            <div className="flex items-center gap-2.5 py-1" role="tablist" aria-label="خلفيات الهيرو">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-label={`الصورة ${i + 1}`}
                  aria-selected={i === currentSlide}
                  onClick={() => setCurrentSlide(i)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    i === currentSlide
                      ? 'w-7 h-2.5 bg-[#EA580C] shadow-xs'
                      : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>

            {/* حالة التوصيل */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#EDE6D8]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-xs" />
              <span>خدمة التوصيل نشطة اليوم في {STORE_CONFIG.city} وضواحيها</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};