// ============================================================
// الملف: CategoryFilter.tsx – الإصدار 7.3
// تصميم موحد مع TrustBadges + أسهم تمرير مستقرة بدون تعارض
// حذف نقاط التنقل + الاعتماد على scrollTo مع offsetLeft
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Layers,
} from 'lucide-react';
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
      className={`category-fade-in-right group relative flex flex-col justify-end p-3 sm:p-3.5 rounded-2xl sm:rounded-[22px] border-2 transition-all duration-300 cursor-pointer touch-manipulation select-none active:scale-[0.97] shrink-0
        w-[130px] min-w-[130px]
        xs:w-[138px] xs:min-w-[138px]
        sm:w-[152px] sm:min-w-[152px]
        md:w-auto md:min-w-0
        min-h-[148px]
        xs:min-h-[158px]
        sm:min-h-[168px]
        md:min-h-[176px]
        lg:min-h-[188px]
        xl:min-h-[198px]
        ${isSelected
          ? 'border-[#2D6A3F] -translate-y-1 shadow-[0_8px_20px_rgba(45,106,63,0.25)] ring-2 ring-[#EAB308]/60'
          : 'border-[#2D6A3F]/20 hover:border-[#2D6A3F]/50 hover:-translate-y-0.5 shadow-sm hover:shadow-md'
        } ${
        !hasBackgroundImage
          ? isSelected
            ? 'bg-gradient-to-b from-[#2D6A3F] to-[#1A3D24] text-white'
            : 'bg-white hover:bg-[#FAF8F3] text-[#1A3D24]'
          : 'bg-[#1A3D24]'
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
                ? 'bg-gradient-to-t from-[#0B1C10]/85 via-[#0B1C10]/25 to-transparent'
                : 'bg-gradient-to-t from-[#0B1C10]/70 via-[#0B1C10]/15 to-transparent group-hover:from-[#0B1C10]/75 group-hover:via-[#0B1C10]/20'
            }`}
          />

          {isSelected && (
            <div className="absolute inset-0 bg-[#EAB308]/10 pointer-events-none" />
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
          className={`text-[14px] sm:text-[15px] lg:text-[16px] font-black leading-tight transition-colors duration-300 ${
            hasBackgroundImage
              ? isSelected
                ? 'text-[#FACC15] drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]'
                : 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]'
              : isSelected
              ? 'text-white'
              : 'text-[#1A3D24]'
          }`}
        >
          {category.name}
        </span>

        {isSelected ? (
          <span className="w-8 sm:w-9 h-1 rounded-full bg-[#EAB308] mt-1.5 shadow-xs" />
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

  // ─── تتبع حالة التمرير (لتحديد ظهور الأسهم) ───
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

  // ─── التمرير بواسطة الأسهم باستخدام scrollTo (مستقر ولا يتعارض) ───
  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    const target = el.scrollLeft + (dir === 'left' ? -amount : amount);
    el.scrollTo({ left: target, behavior: 'smooth' });
  };

  return (
    <div
      className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-2 sm:mt-4 mb-10 sm:my-14 ${className}`}
      dir="rtl"
    >
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

      {/* ════════ الحاوية الموحدة المتطابقة تماماً مع شارات الثقة ════════ */}
      <div className="relative bg-white border-2 border-[#2D6A3F]/15 rounded-3xl sm:rounded-[36px] shadow-[0_12px_36px_rgba(45,106,63,0.06)] p-5 sm:p-8 lg:p-10 overflow-hidden">

        {/* إضاءات محيطية ناعمة للهوية البصرية */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#EAB308]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#2D6A3F]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">

          {/* ═══════ 1. رأس القسم الموحد: عنوان متمركز وأدوات تصفية متناسقة ═══════ */}
          <div className="relative flex flex-col items-center text-center gap-4 pb-5 border-b border-[#2D6A3F]/10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A3D24] tracking-tight flex items-center justify-center gap-2">
                <span>تسوق حسب الفئات والأقسام</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] inline-block shrink-0" />
              </h2>

              <p className="text-sm sm:text-base text-[#3E4F43] font-bold leading-relaxed">
                خضار وفواكه طازجة، تمور، أجبان وألبان، وبقالة يومية مختارة بعناية فائقة من أسواق الجملة بفاس.
              </p>
            </div>

            {/* أدوات التصفية والفرز (متمركزة وتصميم موحد) */}
            <div className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-3 w-full mt-2">
              {isSearchMode && onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-[#EA580C] to-[#C25E12] hover:from-[#F97316] hover:to-[#EA580C] px-3.5 py-2 rounded-2xl transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <span className="max-w-[120px] truncate">
                    إلغاء البحث "{searchQuery}"
                  </span>
                  <span className="text-xs font-bold leading-none">✕</span>
                </button>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onOpenSort}
                  className="inline-flex items-center gap-1.5 bg-[#FAF8F3] hover:bg-white text-[#1A3D24] border border-[#2D6A3F]/20 px-3.5 py-2 rounded-2xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>{getSortLabel() || (onlyInStock ? 'المتوفر فقط' : 'مصفّى')}</span>
                </button>
              )}

              <button
                type="button"
                id="category-filter-sort-btn"
                onClick={onOpenSort}
                className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] hover:from-[#377A4C] hover:to-[#22502F] text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer border border-[#EAB308]/50"
                title="تصفية وترتيب المنتجات"
                aria-label="تصفية وترتيب المنتجات"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#F5D76E] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90" />
                <span>تصفية وترتيب</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-[#EA580C] border border-white animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onSelectCategory('all')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer active:scale-95 border ${
                  selectedCategory === 'all'
                    ? 'bg-[#1A3D24] text-[#F5D76E] border-[#EAB308]/70 shadow-sm'
                    : 'bg-white text-[#4A5D4F] hover:text-[#1A3D24] border-[#2D6A3F]/20 hover:border-[#2D6A3F]/40'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>جميع الأقسام</span>
              </button>
            </div>
          </div>

          {/* ═══════ 2. شريط وبطاقات الفئات (مع هوامش مريحة وأسهم فقط) ═══════ */}
          <div className="relative pt-8 pb-2">
            {/* أسهم التمرير (Desktop) */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollByAmount('right')}
                aria-label="تمرير لليمين"
                className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[#2D6A3F]/20 shadow-md text-[#2D6A3F] items-center justify-center hover:bg-[#2D6A3F] hover:text-[#EAB308] transition-all active:scale-90 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollByAmount('left')}
                aria-label="تمرير لليسار"
                className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[#2D6A3F]/20 shadow-md text-[#2D6A3F] items-center justify-center hover:bg-[#2D6A3F] hover:text-[#EAB308] transition-all active:scale-90 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* شبكة الفئات */}
            <div
              ref={scrollRef}
              className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 overflow-x-auto md:overflow-visible pb-2 px-1 overscroll-x-contain no-scrollbar items-stretch"
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

            {/* ═══════ أسهم التمرير للجوال (بدون نقاط) ═══════ */}
            <div className="flex md:hidden items-center justify-end pt-5 px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollByAmount('right')}
                  disabled={!canScrollRight}
                  className="w-11 h-11 rounded-xl bg-white border-2 border-[#2D6A3F]/25 text-[#1A3D24] hover:bg-[#F4FAF6] hover:border-[#2D6A3F]/50 shadow-sm flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  aria-label="السابق"
                >
                  <ChevronRight className="w-5 h-5 text-[#1A3D24]" strokeWidth={2.6} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByAmount('left')}
                  disabled={!canScrollLeft}
                  className="w-11 h-11 rounded-xl bg-white border-2 border-[#2D6A3F]/25 text-[#1A3D24] hover:bg-[#F4FAF6] hover:border-[#2D6A3F]/50 shadow-sm flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  aria-label="التالي"
                >
                  <ChevronLeft className="w-5 h-5 text-[#1A3D24]" strokeWidth={2.6} />
                </button>
              </div>
            </div>
          </div>

          {/* ═══════ 3. الشريط السفلي المدمج: التزام الجودة (مُوسَّط) ═══════ */}
          <div className="mt-6 pt-5 border-t-2 border-[#2D6A3F]/10 flex items-center justify-center gap-2 text-xs sm:text-sm text-[#1F2937] font-black text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
            <span>جميع المنتجات تخضع للمعاينة والفرز الدقيق قبل التجهيز والتوصيل لباب منزلك.</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;