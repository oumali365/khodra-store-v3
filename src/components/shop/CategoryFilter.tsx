// ============================================================
// الملف: CategoryFilter.tsx – الإصدار 5.5
// تحسين مؤشر التمرير: هوامش + إبراز العبارة والأسهم
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SlidersHorizontal, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCategory, Product } from '../../types';
import { CATEGORIES_CONFIG } from '../../data/mockProducts';
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
      className={`category-fade-in-right group relative flex flex-col justify-end p-2.5 sm:p-3 rounded-2xl sm:rounded-[20px] border-2 transition-all duration-300 cursor-pointer touch-manipulation select-none active:scale-[0.97] shrink-0
        w-[116px] min-w-[116px]
        xs:w-[124px] xs:min-w-[124px]
        sm:w-[136px] sm:min-w-[136px]
        md:w-auto md:min-w-0
        min-h-[134px]
        xs:min-h-[142px]
        sm:min-h-[152px]
        md:min-h-[160px]
        lg:min-h-[170px]
        xl:min-h-[180px]
        ${isSelected
          ? 'border-[#2D6A3F] -translate-y-0.5 shadow-[0_6px_16px_rgba(45,106,63,0.18)] ring-2 ring-[#EAB308]/35'
          : 'border-[#2D6A3F]/20 hover:border-[#2D6A3F]/50 hover:-translate-y-0.5 shadow-xs hover:shadow-md'
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
      {currentSrc && !hasError && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-[14px] sm:rounded-[18px]">
          <img
            src={currentSrc}
            alt={category.name}
            className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108 ${
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
                ? 'bg-gradient-to-t from-[#0B1C10]/78 via-[#0B1C10]/20 to-transparent'
                : 'bg-gradient-to-t from-[#0B1C10]/70 via-[#0B1C10]/12 to-transparent group-hover:from-[#0B1C10]/75 group-hover:via-[#0B1C10]/20'
            }`}
          />

          {isSelected && (
            <div className="absolute inset-0 bg-[#EAB308]/8 pointer-events-none" />
          )}
        </div>
      )}

      {!hasBackgroundImage && (
        <div className="relative z-10 flex-1 flex items-center justify-center py-1.5">
          <span
            className={`text-4xl sm:text-5xl transition-all duration-300 ${
              isSelected ? 'scale-110' : 'group-hover:scale-110'
            }`}
          >
            {category.icon}
          </span>
        </div>
      )}

      <div className="relative z-10 w-full flex flex-col items-center text-center mt-auto pt-1.5">
        <span
          className={`text-[13px] sm:text-[14px] lg:text-[15px] font-black leading-tight transition-colors duration-300 ${
            hasBackgroundImage
              ? isSelected
                ? 'text-[#FACC15] drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]'
                : 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]'
              : isSelected
              ? 'text-[#EAB308]'
              : 'text-[#112616]'
          }`}
        >
          {category.name}
        </span>

        {isSelected ? (
          <span className="w-8 sm:w-9 h-1 rounded-full bg-[#EAB308] mt-1.5" />
        ) : (
          <span
            className={`h-0.5 rounded-full mt-1.5 transition-all duration-300 ${
              hasBackgroundImage
                ? 'w-5 bg-white/40 group-hover:w-8 group-hover:bg-[#FB923C]'
                : 'w-5 bg-[#2D6A3F]/25 group-hover:w-8 group-hover:bg-[#FB923C]'
            }`}
          />
        )}
      </div>

      {isPulsing && (
        <div
          className="category-focus-pulse absolute inset-0 rounded-[14px] sm:rounded-[18px] bg-[#EAB308]/20 pointer-events-none"
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

  const showScrollHint = canScrollLeft || canScrollRight;

  return (
    <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-2 sm:mt-3 lg:mt-4 mb-10 sm:mb-12 lg:mb-14 ${className}`}>
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

        /* ✅ سهام مؤشر التمرير — إبراز أقوى */
        @keyframes categoryScrollHintLeft {
          0%, 100% { transform: translateX(0)    scale(1);    opacity: 0.65; }
          50%      { transform: translateX(-5px) scale(1.08); opacity: 1; }
        }
        @keyframes categoryScrollHintRight {
          0%, 100% { transform: translateX(0)   scale(1);    opacity: 0.65; }
          50%      { transform: translateX(5px) scale(1.08); opacity: 1; }
        }
        .category-scroll-hint-left {
          animation: categoryScrollHintLeft 1.8s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .category-scroll-hint-right {
          animation: categoryScrollHintRight 1.8s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .category-fade-in-right,
          .category-focus-pulse,
          .category-ripple,
          .category-scroll-hint-left,
          .category-scroll-hint-right { animation: none; }
        }
      `}</style>

      <div className="relative bg-gradient-to-b from-[#FAF8F3] to-[#F5EFE3] border border-[#2D6A3F]/12 rounded-[22px] sm:rounded-[28px] p-4 sm:p-5 md:p-6 shadow-[0_2px_10px_rgba(45,106,63,0.05)] overflow-hidden">
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#EAB308]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-[#2D6A3F]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">

          {/* ═══════ 1. الرأس ═══════ */}
          <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4 pb-3 border-b border-[#2D6A3F]/10">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                type="button"
                id="category-filter-sort-btn"
                onClick={onOpenSort}
                className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#2D6A3F] to-[#1A3D24] hover:from-[#3A8152] hover:to-[#2D6A3F] active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-xs hover:shadow-md cursor-pointer border border-[#EAB308]/25 group focus:outline-none focus:ring-2 focus:ring-[#2D6A3F]/30"
                title="فرز وتصفية المنتجات"
                aria-label="فرز وتصفية المنتجات"
              >
                <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-[#EAB308] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FB923C] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EA580C] border-2 border-white shadow-xs" />
                  </span>
                )}
              </button>

              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-black text-[#112616] leading-tight truncate flex items-center gap-1.5">
                  تسوق حسب الفئات
                  <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#EAB308] shrink-0" />
                </h2>
                <p className="text-[11px] sm:text-xs text-[#5A6B5F] font-bold mt-0.5 truncate">
                  اختر الفئة المناسبة لتصفح المنتجات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isSearchMode && onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black text-white bg-gradient-to-r from-[#EA580C] to-[#C25E12] hover:from-[#F97316] hover:to-[#EA580C] px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
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
                  className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FACC15] to-[#EAB308] hover:from-[#EAB308] hover:to-[#CA8A04] text-[#1A3D24] border border-[#EAB308]/50 px-3 py-1.5 rounded-full text-xs font-black cursor-pointer transition-all active:scale-95 shadow-xs shrink-0"
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
                className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md border border-[#2D6A3F]/15 shadow-xs text-[#2D6A3F] items-center justify-center hover:bg-[#2D6A3F] hover:text-[#EAB308] transition-all active:scale-90 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollByAmount('left')}
                aria-label="تمرير لليسار"
                className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md border border-[#2D6A3F]/15 shadow-xs text-[#2D6A3F] items-center justify-center hover:bg-[#2D6A3F] hover:text-[#EAB308] transition-all active:scale-90 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div
              ref={scrollRef}
              className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 lg:gap-4 overflow-x-auto md:overflow-visible py-2 px-1.5 sm:px-2 md:px-0.5 overscroll-x-contain no-scrollbar items-stretch"
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
                  animationDelay={index * 60}
                />
              ))}
            </div>
          </div>

          {/* ═══════ 3. مؤشر التمرير (جوال) — متناسق وخفيف ═══════ */}
          {showScrollHint && (
            <div
              className="md:hidden flex flex-col items-center select-none pointer-events-none mt-2.5 mb-0.5"
              aria-hidden="true"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/75 backdrop-blur-xs border border-[#2D6A3F]/15 shadow-2xs">
                <span
                  className={`inline-flex transition-opacity duration-300 ${
                    canScrollLeft ? 'category-scroll-hint-left opacity-100' : 'opacity-25'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#2D6A3F]" strokeWidth={3} />
                </span>

                <span className="text-[11px] font-black text-[#1A3D24] tracking-wide whitespace-nowrap">
                  اسحب للتصفح
                </span>

                <span
                  className={`inline-flex transition-opacity duration-300 ${
                    canScrollRight ? 'category-scroll-hint-right opacity-100' : 'opacity-25'
                  }`}
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#2D6A3F]" strokeWidth={3} />
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};