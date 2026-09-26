// ============================================================
// الملف: CategoryFilter.tsx – الإصدار 5.3
// ارتفاع متجاوب لجميع الشاشات (من 320px إلى 4K)
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

const FOCUS_PULSE_MS = 700;

const RippleButton: React.FC<{
  onClick?: () => void;
  className: string;
  children: React.ReactNode;
  rippleColor?: string;
  ariaLabel?: string;
  role?: string;
  dataCategoryId?: string;
  ariaSelected?: boolean;
}> = ({
  onClick,
  className,
  children,
  rippleColor = 'rgba(234,179,8,0.35)',
  ariaLabel,
  role,
  dataCategoryId,
  ariaSelected,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'category-ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.background = rippleColor;
      btn.appendChild(ripple);

      window.setTimeout(() => ripple.remove(), 650);
    }
    onClick?.();
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      role={role}
      aria-label={ariaLabel}
      aria-selected={ariaSelected}
      data-category-id={dataCategoryId}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </button>
  );
};

const CategoryCardButton: React.FC<{
  category: { id: ProductCategory; name: string; icon: string };
  isSelected: boolean;
  onSelect: () => void;
  animationDelay?: number;
}> = ({ category, isSelected, onSelect, animationDelay = 0 }) => {
  const imageConfig = CATEGORY_IMAGES[category.id];
  const [currentSrc, setCurrentSrc] = useState<string | null>(imageConfig?.primary || null);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const handleImgError = () => {
    if (currentSrc === imageConfig?.primary && imageConfig?.fallback && currentSrc !== imageConfig.fallback) {
      setCurrentSrc(imageConfig.fallback);
    } else {
      setHasError(true);
    }
  };

  const hasBackgroundImage = Boolean(currentSrc && !hasError);

  useEffect(() => {
    if (isSelected) {
      setIsPulsing(true);
      const t = window.setTimeout(() => setIsPulsing(false), FOCUS_PULSE_MS);
      return () => window.clearTimeout(t);
    }
    setIsPulsing(false);
  }, [isSelected]);

  return (
    <RippleButton
      role="tab"
      dataCategoryId={category.id}
      ariaSelected={isSelected}
      onClick={onSelect}
      rippleColor={hasBackgroundImage ? 'rgba(234,179,8,0.40)' : 'rgba(45,106,63,0.28)'}
      // ✅ ارتفاع متجاوب على 8 نقاط توقف
      // 📱 جوال: 200px  |  📱 جوال كبير: 216px  |  💊 تابلت صغير: 232px
      // 💻 تابلت: 248px | 💻 لابتوب: 280px | 🖥️ ديسكتوب: 310px
      // 🖥️ ديسكتوب كبير: 340px | 🖥️ 4K: 380px
      className={`category-fade-in-right group relative flex flex-col justify-end p-4 rounded-3xl border-2 transition-all duration-300 cursor-pointer touch-manipulation select-none active:scale-[0.98] shrink-0 min-w-[158px] sm:min-w-[174px] md:min-w-0
        min-h-[200px]
        xs:min-h-[216px]
        sm:min-h-[232px]
        md:min-h-[248px]
        lg:min-h-[280px]
        xl:min-h-[310px]
        2xl:min-h-[340px]
        [@media(min-width:1920px)]:min-h-[380px]
        md:max-h-[420px]
        ${isSelected
          ? 'border-[#2D6A3F] scale-[1.02] shadow-[0_4px_14px_rgba(45,106,63,0.20)]'
          : 'border-[#2D6A3F]/20 hover:border-[#2D6A3F]/50 shadow-sm'
        } ${
        !hasBackgroundImage
          ? isSelected
            ? 'bg-gradient-to-b from-[#163920] to-[#0E2615] text-white'
            : 'bg-[#FAF8F3] hover:bg-white text-[#112616]'
          : 'bg-[#163920]'
      }`}
      // @ts-ignore
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* ═══ خلفية الصورة ═══ */}
      {currentSrc && !hasError && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-[22px]">
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

          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              isSelected
                ? 'bg-gradient-to-t from-[#0B1C10]/80 via-[#0B1C10]/20 to-transparent'
                : 'bg-gradient-to-t from-[#0B1C10]/75 via-[#0B1C10]/15 to-transparent group-hover:from-[#0B1C10]/80 group-hover:via-[#0B1C10]/25'
            }`}
          />

          {isSelected && (
            <div className="absolute inset-0 bg-[#EAB308]/8 pointer-events-none" />
          )}
        </div>
      )}

      {/* ═══ لا توجد صورة: عرض الأيقونة ═══ */}
      {!hasBackgroundImage && (
        <div className="relative z-10 flex-1 flex items-center justify-center py-2">
          <span
            className={`text-5xl sm:text-6xl transition-all duration-300 ${
              isSelected ? 'scale-110' : 'group-hover:scale-110'
            }`}
          >
            {category.icon}
          </span>
        </div>
      )}

      {/* ═══ العنوان + المؤشر ═══ */}
      <div className="relative z-10 w-full flex flex-col items-center text-center mt-auto pt-2">
        <span
          className={`text-[15px] sm:text-[17px] font-black leading-tight transition-colors duration-300 ${
            hasBackgroundImage
              ? isSelected
                ? 'text-[#EAB308] drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]'
                : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]'
              : isSelected
              ? 'text-[#EAB308]'
              : 'text-[#112616]'
          }`}
        >
          {category.name}
        </span>

        {isSelected ? (
          <span className="w-12 h-1.5 rounded-full bg-[#EAB308] mt-2" />
        ) : (
          <span
            className={`h-0.5 rounded-full mt-2 transition-all duration-300 ${
              hasBackgroundImage
                ? 'w-7 bg-white/35 group-hover:w-11 group-hover:bg-[#FB923C]'
                : 'w-7 bg-[#2D6A3F]/25 group-hover:w-11 group-hover:bg-[#FB923C]'
            }`}
          />
        )}
      </div>

      {/* ✨ نبضة التركيز */}
      {isPulsing && (
        <div
          className="category-focus-pulse absolute inset-0 rounded-[22px] bg-[#EAB308]/20 pointer-events-none"
          aria-hidden="true"
        />
      )}
    </RippleButton>
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
    <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-2 sm:mt-3 lg:mt-4 mb-6 sm:mb-8 ${className}`}>
      <style>{`
        @keyframes categoryFadeInRight {
          0%   { opacity: 0; transform: translateX(40px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .category-fade-in-right {
          animation: categoryFadeInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
          will-change: opacity, transform;
        }

        @keyframes categoryFocusPulse {
          0%   { opacity: 0.5; }
          100% { opacity: 0; }
        }
        .category-focus-pulse {
          animation: categoryFocusPulse ${FOCUS_PULSE_MS}ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes categoryRippleExpand {
          0%   { transform: scale(0); opacity: 0.55; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .category-ripple {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          transform: scale(0);
          animation: categoryRippleExpand 0.65s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .category-fade-in-right,
          .category-focus-pulse,
          .category-ripple { animation: none; }
        }
      `}</style>

      <div className="relative bg-gradient-to-b from-[#FAF8F3] to-[#F5EFE3] border border-[#2D6A3F]/12 rounded-[24px] sm:rounded-[36px] p-5 sm:p-7 md:p-8 shadow-[0_2px_10px_rgba(45,106,63,0.05)] overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#EAB308]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#2D6A3F]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">

          {/* ═══════ 1. الرأس ═══════ */}
          <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[#2D6A3F]/10">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                id="category-filter-sort-btn"
                onClick={onOpenSort}
                className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#2D6A3F] to-[#1A3D24] hover:from-[#3A8152] hover:to-[#2D6A3F] active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-sm hover:shadow-md cursor-pointer border border-[#EAB308]/25 group focus:outline-none focus:ring-2 focus:ring-[#2D6A3F]/30"
                title="فرز وتصفية المنتجات"
                aria-label="فرز وتصفية المنتجات"
              >
                <SlidersHorizontal className="w-5 h-5 text-[#EAB308] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FB923C] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EA580C] border-2 border-white shadow-xs" />
                  </span>
                )}
              </button>

              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-black text-[#112616] leading-tight truncate flex items-center gap-2">
                  تسوق حسب الفئات
                  <span className="inline-block w-2 h-2 rounded-full bg-[#EAB308] shrink-0" />
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B5F] font-bold mt-0.5 truncate">
                  اختر الفئة المناسبة لتصفح المنتجات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isSearchMode && onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black text-white bg-gradient-to-r from-[#EA580C] to-[#C25E12] hover:from-[#F97316] hover:to-[#EA580C] px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
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
                  className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FACC15] to-[#EAB308] hover:from-[#EAB308] hover:to-[#CA8A04] text-[#1A3D24] border border-[#EAB308]/50 px-3.5 py-2 rounded-full text-xs font-black cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
                  title="تعديل خيارات التصفية"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{getSortLabel() || (onlyInStock ? 'المتوفر فقط' : 'مصفّى')}</span>
                </button>
              )}
            </div>
          </div>

          {/* ═══════ 2. شريط الفئات ═══════ */}
          <div className="relative">
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollByAmount('right')}
                aria-label="تمرير لليمين"
                className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[#2D6A3F]/15 shadow-sm text-[#2D6A3F] items-center justify-center hover:bg-[#2D6A3F] hover:text-[#EAB308] transition-all active:scale-90 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollByAmount('left')}
                aria-label="تمرير لليسار"
                className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[#2D6A3F]/15 shadow-sm text-[#2D6A3F] items-center justify-center hover:bg-[#2D6A3F] hover:text-[#EAB308] transition-all active:scale-90 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div
              ref={scrollRef}
              className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto md:overflow-visible py-3 px-3 sm:px-4 md:px-1 overscroll-x-contain no-scrollbar items-stretch"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              role="tablist"
              aria-label="فئات المنتجات"
            >
              {categories.map((cat, index) => (
                <CategoryCardButton
                  key={cat.id}
                  category={cat}
                  isSelected={selectedCategory === cat.id}
                  onSelect={() => onSelectCategory(cat.id)}
                  animationDelay={index * 70}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};