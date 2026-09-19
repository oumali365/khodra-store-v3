// ============================================================
// الملف: CategoryFilter.tsx – الإصدار 4.4
// تقليل طفيف للهوامش الداخلية والخارجية للفئات
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SlidersHorizontal, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCategory, Product } from '../types';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import { SortOption } from './SortFilterModal';

const CATEGORY_IMAGES: Record<string, string> = {
  all: '/images/categories/all.webp',
  veg: '/images/categories/vegetables.webp',
  fruit: '/images/categories/fruits.webp',
  dairy: '/images/categories/dairy.webp',
  grocery: '/images/categories/grocery.webp',
  drinks: '/images/categories/drinks.webp',
  cleaning: '/images/categories/cleaning.webp',
};

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
        className={`text-5xl sm:text-6xl mb-3 transition-transform duration-300 drop-shadow-sm ${
          isSelected ? 'scale-110' : 'group-hover:scale-110'
        }`}
      >
        {icon}
      </span>
    );
  }

  return (
    <div
      className={`relative w-[96px] h-[96px] sm:w-[112px] sm:h-[112px] lg:w-[124px] lg:h-[124px] mb-3 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 shrink-0 bg-stone-100 ${
        isSelected
          ? 'border-2 border-[#F5D76E] shadow-xl scale-105 ring-2 ring-[#F5D76E]/30'
          : 'border border-stone-200/90 group-hover:border-[#F5D76E]/70 shadow-sm group-hover:shadow-xl group-hover:scale-105'
      }`}
    >
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
        decoding="async"
        width="124"
        height="124"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRaf = useRef<number | null>(null);

  const updateScrollState = useCallback(() => {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll <= 6) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }
      const absLeft = Math.abs(scrollLeft);
      const hasMoreLeft = absLeft < maxScroll - 8;
      const hasMoreRight = absLeft > 8;

      setCanScrollLeft((prev) => (prev !== hasMoreLeft ? hasMoreLeft : prev));
      setCanScrollRight((prev) => (prev !== hasMoreRight ? hasMoreRight : prev));
    });
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });
    return () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [categories.length, updateScrollState]);

  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-6 sm:my-8 ${className}`}>
      <div className="relative bg-white border border-[#D4C8B5] rounded-[24px] sm:rounded-[36px] p-5 sm:p-7 md:p-8 shadow-2xl overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#F5D76E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#163920]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">

          {/* ════════ 1. الرأس ════════ */}
          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F0E9DA]">
            <div className="flex items-center gap-3 min-w-0">
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
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollByAmount('right')}
                aria-label="تمرير لليمين"
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[#D4C8B5] shadow-lg text-[#163920] items-center justify-center hover:bg-[#163920] hover:text-white transition-all active:scale-90 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollByAmount('left')}
                aria-label="تمرير لليسار"
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[#D4C8B5] shadow-lg text-[#163920] items-center justify-center hover:bg-[#163920] hover:text-white transition-all active:scale-90 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* حاوية التمرير: تمرير انسيابي بدون تقطيع أو حجب للبطاقات */}
            <div
              ref={scrollRef}
              className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 overflow-x-auto md:overflow-visible py-2 px-3 sm:px-4 md:px-0 overscroll-x-contain no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
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
                    className={`relative flex flex-col items-center justify-center px-3.5 py-4 sm:px-4 sm:py-5 md:px-3.5 md:py-5 lg:px-4 lg:py-6 rounded-2xl sm:rounded-3xl border-2 transition-colors duration-150 cursor-pointer overflow-hidden group touch-manipulation select-none active:scale-[0.98] shrink-0 min-w-[136px] sm:min-w-[150px] md:min-w-0 min-h-[178px] sm:min-h-[195px] md:min-h-[194px] lg:min-h-[212px] ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#163920] to-[#0E2615] text-white border-[#163920] shadow-xl'
                        : 'bg-[#FAF8F3] hover:bg-white text-[#112616] border-[#E8E1D3] hover:border-[#F5D76E]/70 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <CategoryThumbnail
                      catId={cat.id}
                      name={cat.name}
                      icon={cat.icon}
                      isSelected={isSelected}
                    />

                    <span
                      className={`text-sm sm:text-base font-black text-center leading-tight mt-0.5 ${
                        isSelected ? 'text-white' : 'text-[#112616]'
                      }`}
                    >
                      {cat.name}
                    </span>

                    {isSelected && (
                      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-[#F5D76E]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ════════ 3. الوصف ════════ */}
          {categoryInfo.description && (
            <div className="mt-5 pt-4 border-t border-[#F0E9DA]">
              <div className="rounded-2xl bg-[#FAF8F3] border border-[#E8E1D3] px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-1.5 h-9 sm:h-10 rounded-full bg-gradient-to-b from-[#F5D76E] to-[#C25E12] shrink-0 shadow-sm" />
                  <p className="text-[13px] sm:text-sm text-[#423C32] font-semibold leading-relaxed">
                    {categoryInfo.description}
                  </p>
                </div>

                {(hasActiveFilters || isSearchMode) && (
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {getSortLabel() && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#C25E12] bg-white px-2.5 py-1 rounded-full border border-[#FDBA74] shadow-sm">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{getSortLabel()}</span>
                      </span>
                    )}
                    {onlyInStock && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#C25E12] bg-white px-2.5 py-1 rounded-full border border-[#FDBA74] shadow-sm">
                        <span>المتوفر فقط</span>
                      </span>
                    )}
                    {isSearchMode && onClearSearch && (
                      <button
                        type="button"
                        onClick={onClearSearch}
                        className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-white bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#EA580C] hover:to-[#C25E12] px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
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
          )}

        </div>
      </div>
    </div>
  );
};