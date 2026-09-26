// ============================================================
// الملف: CategoryFilter.tsx – الإصدار 5.0
// تكبير بطاقات الفئات بنسبة 10% + تمرير أوتوماتيكي للفئة المحددة وإبرازها + حذف تعريف الفئات
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SlidersHorizontal, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCategory, Product } from '../types';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import { SortOption } from './SortFilterModal';

const CATEGORY_IMAGES: Record<string, { primary: string; fallback?: string }> = {
  all: { primary: '/images/categories/all.jpg', fallback: '/images/categories/all.jpg' },
  veg: { primary: '/images/categories/vegetables.jpg', fallback: '/images/categories/vegetables.jpg' },
  fruit: { primary: '/images/categories/fruits.jpg', fallback: '/images/categories/fruits.jpg' },
  dairy: { primary: '/images/categories/dairy.jpg', fallback: '/images/categories/dairy.jpg' },
  grocery: { primary: '/images/categories/grocery.jpg', fallback: '/images/categories/grocery.webp' },
  drinks: { primary: '/images/categories/drinks.jpg', fallback: '/images/categories/drinks.jpg' },
  cleaning: { primary: '/images/categories/cleaning.jpg', fallback: '/images/categories/cleaning.jpg' },
};

const CategoryCardButton: React.FC<{
  category: { id: ProductCategory; name: string; icon: string };
  isSelected: boolean;
  onSelect: () => void;
}> = ({ category, isSelected, onSelect }) => {
  const imageConfig = CATEGORY_IMAGES[category.id];
  const [currentSrc, setCurrentSrc] = useState<string | null>(imageConfig?.primary || null);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleImgError = () => {
    if (currentSrc === imageConfig?.primary && imageConfig?.fallback && currentSrc !== imageConfig.fallback) {
      setCurrentSrc(imageConfig.fallback);
    } else {
      setHasError(true);
    }
  };

  const hasBackgroundImage = Boolean(currentSrc && !hasError);

  return (
    <button
      type="button"
      role="tab"
      data-category-id={category.id}
      aria-selected={isSelected}
      onClick={onSelect}
      className={`relative flex flex-col justify-end p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 cursor-pointer overflow-hidden group touch-manipulation select-none active:scale-[0.98] shrink-0 min-w-[150px] sm:min-w-[165px] md:min-w-0 min-h-[196px] sm:min-h-[215px] md:min-h-[214px] lg:min-h-[233px] shadow-sm hover:shadow-xl ${
        isSelected
          ? 'border-[#F5D76E] shadow-xl ring-4 ring-[#F5D76E]/50 scale-[1.03]'
          : 'border-[#E8E1D3] hover:border-[#F5D76E]/70'
      } ${
        !hasBackgroundImage
          ? isSelected
            ? 'bg-gradient-to-b from-[#163920] to-[#0E2615] text-white'
            : 'bg-[#FAF8F3] hover:bg-white text-[#112616]'
          : 'bg-[#163920]'
      }`}
    >
      {/* 1. خلفية الصورة الممتدة بكامل مساحة بطاقة الفئة */}
      {currentSrc && !hasError && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src={currentSrc}
            alt={category.name}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoaded(true)}
            onError={handleImgError}
          />

          {/* طبقة التدرج الداكن لحماية قراءة اسم الفئة وضمان تباين فائق */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              isSelected
                ? 'bg-gradient-to-t from-[#0E2615]/95 via-[#163920]/65 to-black/20'
                : 'bg-gradient-to-t from-black/85 via-black/40 to-black/15 group-hover:from-black/90 group-hover:via-black/50'
            }`}
          />

          {isSelected && (
            <div className="absolute inset-0 bg-[#F5D76E]/15 pointer-events-none" />
          )}
        </div>
      )}

      {/* في حال عدم توفر الصورة: إظهار الأيقونة بحجم تعبيري مميز */}
      {!hasBackgroundImage && (
        <div className="relative z-10 flex-1 flex items-center justify-center py-2">
          <span
            className={`text-5xl sm:text-6xl transition-transform duration-300 drop-shadow-sm ${
              isSelected ? 'scale-110' : 'group-hover:scale-110'
            }`}
          >
            {category.icon}
          </span>
        </div>
      )}

      {/* 2. عنوان الفئة ومؤشر التحديد */}
      <div className="relative z-10 w-full flex flex-col items-center text-center mt-auto pt-2">
        <span
          className={`text-[15px] sm:text-[17px] font-black leading-tight drop-shadow-sm transition-colors ${
            hasBackgroundImage
              ? isSelected
                ? 'text-[#F5D76E]'
                : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]'
              : isSelected
              ? 'text-white'
              : 'text-[#112616]'
          }`}
        >
          {category.name}
        </span>

        {isSelected ? (
          <span className="w-12 h-1.5 rounded-full bg-[#F5D76E] mt-2 shadow-sm" />
        ) : (
          <span
            className={`h-0.5 rounded-full mt-2 transition-all duration-300 ${
              hasBackgroundImage
                ? 'w-7 bg-white/40 group-hover:w-11 group-hover:bg-[#F5D76E]'
                : 'w-7 bg-[#C25E12]/30 group-hover:w-11 group-hover:bg-[#C25E12]'
            }`}
          />
        )}
      </div>
    </button>
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

  categoryInfo?: CategoryHeaderInfo;
  sortBy: SortOption;
  onlyInStock: boolean;
  onOpenSort: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  className = '',
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

  // ─── تمرير أوتوماتيكي أفقي للفئة المحددة وإبرازها عند اختيارها من القائمة أو الشريط ───
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (selectedCategory === 'all') {
      container.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }

    const targetCard = container.querySelector<HTMLElement>(
      `[data-category-id="${selectedCategory}"]`
    );
    if (targetCard) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = targetCard.getBoundingClientRect();
      const deltaX =
        cardRect.left + cardRect.width / 2 - (containerRect.left + containerRect.width / 2);

      if (Math.abs(deltaX) > 4) {
        container.scrollBy({ left: deltaX, behavior: 'smooth' });
      }
    }
  }, [selectedCategory]);

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

            <div className="flex items-center gap-2 shrink-0">
              {isSearchMode && onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black text-white bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#EA580C] hover:to-[#C25E12] px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <span className="max-w-[110px] sm:max-w-none truncate">
                    إلغاء البحث "{searchQuery}"
                  </span>
                  <span className="text-xs font-bold leading-none">✕</span>
                </button>
              )}

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
          </div>

          {/* ════════ 2. شبكة/شريط الفئات (مكبّرة بنسبة 10% وبدون تعريف الفئات) ════════ */}
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

            <div
              ref={scrollRef}
              className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto md:overflow-visible py-2.5 px-3 sm:px-4 md:px-0 overscroll-x-contain no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              role="tablist"
              aria-label="فئات المنتجات"
            >
              {categories.map((cat) => (
                <CategoryCardButton
                  key={cat.id}
                  category={cat}
                  isSelected={selectedCategory === cat.id}
                  onSelect={() => onSelectCategory(cat.id)}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
