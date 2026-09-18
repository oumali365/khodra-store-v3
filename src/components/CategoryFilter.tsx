// ============================================================
// الملف: CategoryFilter.tsx – الإصدار 4.0
// تصميم متناسق مع Hero + خلفية وصف داكنة + مؤشر تمرير ذكي
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCategory, Product } from '../types';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import { SortOption } from './SortFilterModal';

// ─── مسارات صور الأقسام المجهزة للتحميل في public/images/categories ───
const CATEGORY_IMAGES: Record<string, string> = {
  all: '/images/categories/all.webp',
  veg: '/images/categories/vegetables.webp',
  fruit: '/images/categories/fruits.webp',
  dairy: '/images/categories/dairy.webp',
  grocery: '/images/categories/grocery.webp',
  drinks: '/images/categories/drinks.webp',
  cleaning: '/images/categories/cleaning.webp',
};

// ─── مكون عرض صورة الفئة: تصميم احترافي متجاوب ───
const CategoryThumbnail: React.FC<{
  catId: string;
  name: string;
  icon: string;
  isSelected: boolean;
}> = ({ catId, name, icon, isSelected }) => {
  const [imgError, setImgError] = useState(false);
  const imageUrl = CATEGORY_IMAGES[catId];

  if (imgError || !imageUrl) {
    return (
      <span
        className={`text-3xl sm:text-4xl mb-2.5 transition-transform duration-300 drop-shadow-sm ${
          isSelected ? 'scale-110' : 'group-hover:scale-110'
        }`}
      >
        {icon}
      </span>
    );
  }

  return (
    <div
      className={`relative w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] mb-2.5 rounded-2xl overflow-hidden transition-all duration-300 shrink-0 bg-stone-100 ${
        isSelected
          ? 'border-2 border-[#F5D76E] shadow-lg scale-105 ring-2 ring-[#F5D76E]/30'
          : 'border border-stone-200/90 group-hover:border-[#F5D76E]/60 shadow-sm group-hover:shadow-lg group-hover:scale-105'
      }`}
    >
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
        decoding="async"
        width="84"
        height="84"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
      {/* تدرّج خفيف أسفل الصورة لمزيد من العمق */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
      {isSelected && (
        <div className="absolute inset-0 bg-[#163920]/15 pointer-events-none" />
      )}
    </div>
  );
};

export interface CategoryHeaderInfo {
  id?: string;
  name: string;
  icon?: string;
  description: string;
}

interface CategoryFilterProps {
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  products: Product[];
  className?: string;

  categoryInfo: CategoryHeaderInfo;
  sortBy: SortOption;
  onlyInStock: boolean;
  onOpenSort: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  products,
  className = '',
  categoryInfo,
  sortBy,
  onlyInStock,
  onOpenSort,
  searchQuery = '',
  onClearSearch,
}) => {
  const categories = CATEGORIES_CONFIG.filter((cat) => cat.id !== 'all');

  const hasActiveFilters = sortBy !== 'default' || onlyInStock;
  const isSearchMode = searchQuery.trim().length > 0;

  const getSortLabel = () => {
    if (sortBy === 'price-asc') return 'الأقل سعراً';
    if (sortBy === 'price-desc') return 'الأعلى سعراً';
    return '';
  };

  // ─── مؤشر التمرير الذكي ───
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [categories.length]);

  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-6 sm:my-8 ${className}`}>
      {/* ════ الحاوية الرئيسية بنفس هوية Hero ════ */}
      <div className="relative bg-white border border-[#D4C8B5] rounded-[24px] sm:rounded-[36px] p-5 sm:p-7 md:p-8 shadow-2xl overflow-hidden">
        {/* دوائر ضوئية خفيفة للتناسق مع Hero */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#F5D76E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#163920]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">

          {/* ════════ 1. الرأس ════════ */}
          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F0E9DA]">
            <div className="flex items-center gap-3 min-w-0">
              {/* زر التصفية والفرز */}
              <button
                type="button"
                id="category-filter-sort-btn"
                onClick={onOpenSort}
                className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#163920] to-[#0E2615] hover:from-[#1E4D2B] hover:to-[#12331C] active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-md hover:shadow-xl cursor-pointer border border-[#F5D76E]/25 group focus:outline-none focus:ring-2 focus:ring-[#163920]/40"
                title="فرز وتصفية المنتجات"
                aria-label="فرز وتصفية المنتجات"
              >
                <SlidersHorizontal className="w-5 h-5 text-[#F5D76E] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C25E12] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C25E12] border-2 border-white shadow-xs" />
                  </span>
                )}
              </button>

              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-black text-[#112616] leading-tight truncate">
                  تسوق حسب الفئات
                </h2>
                <p className="text-xs sm:text-sm text-[#787163] font-bold mt-0.5 truncate">
                  اختر الفئة المناسبة لتصفح المنتجات
                </p>
              </div>
            </div>

            {/* شارة التصفية النشطة */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onOpenSort}
                className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FFF4EC] to-[#FFE8D4] hover:from-[#FFE8D4] hover:to-[#FFD9B8] text-[#C25E12] border border-[#FDBA74] px-3.5 py-2 rounded-full text-xs font-black cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
                title="تعديل خيارات التصفية"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{getSortLabel() || (onlyInStock ? 'المتوفر فقط' : 'مصفّى')}</span>
              </button>
            )}
          </div>

          {/* ════════ 2. شبكة/شريط الفئات ════════ */}
          <div className="relative">
            {/* زر التمرير لليسار (يمين الشاشة بصرياً في RTL) */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollByAmount('right')}
                aria-label="تمرير لليمين"
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md border border-[#D4C8B5] shadow-lg text-[#163920] items-center justify-center hover:bg-[#163920] hover:text-white transition-all active:scale-90 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* زر التمرير لليمين (يسار الشاشة بصرياً في RTL) */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollByAmount('left')}
                aria-label="تمرير لليسار"
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md border border-[#D4C8B5] shadow-lg text-[#163920] items-center justify-center hover:bg-[#163920] hover:text-white transition-all active:scale-90 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div
              ref={scrollRef}
              className="flex md:grid md:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto md:overflow-visible py-2 px-1 -mx-1 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              role="tablist"
              aria-label="فئات المنتجات"
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`relative flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden group touch-manipulation select-none active:scale-95 shrink-0 min-w-[116px] sm:min-w-0 snap-start ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#163920] to-[#0E2615] text-white border-[#163920] shadow-xl -translate-y-1'
                        : 'bg-[#FAF8F3] hover:bg-white text-[#112616] border-[#E8E1D3] hover:border-[#F5D76E]/70 shadow-sm hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                  >
                    <CategoryThumbnail
                      catId={cat.id}
                      name={cat.name}
                      icon={cat.icon}
                      isSelected={isSelected}
                    />

                    <span
                      className={`text-xs sm:text-sm font-black text-center leading-tight mt-0.5 ${
                        isSelected ? 'text-white' : 'text-[#112616]'
                      }`}
                    >
                      {cat.name}
                    </span>

                    {/* خط سفلي ذهبي عند التحديد */}
                    {isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-[#F5D76E]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ─── مؤشر التمرير الذكي (تدرّج + سهم متحرك) على الهاتف فقط ─── */}
            <div
              className={`md:hidden pointer-events-none absolute top-0 bottom-0 right-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent transition-opacity duration-300 ${
                canScrollRight ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              className={`md:hidden pointer-events-none absolute top-0 bottom-0 left-0 w-10 bg-gradient-to-r from-white via-white/80 to-transparent transition-opacity duration-300 ${
                canScrollLeft ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* سهم صغير متحرك يشير لوجود المزيد */}
            <div
              className={`md:hidden pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-[#163920] text-[#F5D76E] shadow-lg border border-[#F5D76E]/30 transition-opacity duration-300 ${
                canScrollRight ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </div>

          {/* ════════ 3. الوصف بخلفية داكنة متناسقة مع Hero ════════ */}
          {categoryInfo.description && (
            <div className="mt-5 pt-4 border-t border-[#F0E9DA]">
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#163920]/20 bg-gradient-to-br from-[#163920] via-[#0E2615] to-[#0B1C10] shadow-lg">
                {/* دوائر ضوئية داخلية */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#F5D76E]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#C25E12]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  {/* نص الوصف */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-1.5 h-8 sm:h-9 rounded-full bg-gradient-to-b from-[#F5D76E] to-[#C25E12] shrink-0 shadow-sm" />
                    <p className="text-[13px] sm:text-sm text-[#EDE6D8] font-semibold leading-relaxed">
                      {categoryInfo.description}
                    </p>
                  </div>

                  {/* شارات الفلاتر النشطة أو زر إلغاء البحث */}
                  {(hasActiveFilters || isSearchMode) && (
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {getSortLabel() && (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#0B1C10] bg-[#F5D76E] px-2.5 py-1 rounded-full shadow-sm">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{getSortLabel()}</span>
                        </span>
                      )}
                      {onlyInStock && (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#0B1C10] bg-[#F5D76E] px-2.5 py-1 rounded-full shadow-sm">
                          <span>المتوفر فقط</span>
                        </span>
                      )}
                      {isSearchMode && onClearSearch && (
                        <button
                          type="button"
                          onClick={onClearSearch}
                          className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-white bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#EA580C] hover:to-[#C25E12] px-2.5 py-1 rounded-full border border-[#F5D76E]/40 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <span className="max-w-[120px] sm:max-w-none truncate">
                            إلغاء البحث "{searchQuery}"
                          </span>
                          <span className="text-xs font-bold leading-none">✕</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};