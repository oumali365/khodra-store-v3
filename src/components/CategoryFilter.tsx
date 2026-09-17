// ============================================================
// الملف: CategoryFilter.tsx – الإصدار 3.1
// يدمج: شبكة الفئات + شريط وصف الفئة المحسّن + زر التصفية بالأيقونة الخضراء
// ============================================================
import React, { useState } from 'react';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { ProductCategory, Product } from '../types';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import { SortOption } from './SortFilterModal';

// ─── صور احترافية عالية الجودة للأقسام مخزنة محلياً في public/images/categories ───
const CATEGORY_IMAGES: Record<string, string> = {
  all: '/images/categories/all.jpg',
  veg: '/images/categories/vegetables.jpg',
  fruit: '/images/categories/fruits.jpg',
  dairy: '/images/categories/dairy.jpg',
  grocery: '/images/categories/grocery.jpg',
  drinks: '/images/categories/drinks.jpg',
  cleaning: '/images/categories/cleaning.jpg',
};

// ─── روابط احتياطية سريعة عبر CDN في حال عدم توفر المسار المحلي ───
const FALLBACK_CDN_IMAGES: Record<string, string> = {
  all: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&auto=format&fit=crop&q=80',
  veg: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=200&h=200&auto=format&fit=crop&q=80',
  fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&h=200&auto=format&fit=crop&q=80',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200&h=200&auto=format&fit=crop&q=80',
  grocery: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&auto=format&fit=crop&q=80',
  drinks: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200&h=200&auto=format&fit=crop&q=80',
  cleaning: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&auto=format&fit=crop&q=80',
};

// ─── مكون عرض صورة الفئة مع حماية بديلة للأيقونة ───
const CategoryThumbnail: React.FC<{
  catId: string;
  name: string;
  icon: string;
  isSelected: boolean;
}> = ({ catId, name, icon, isSelected }) => {
  const [imgSrc, setImgSrc] = useState<string>(CATEGORY_IMAGES[catId] || '');
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (imgSrc !== FALLBACK_CDN_IMAGES[catId] && FALLBACK_CDN_IMAGES[catId]) {
      setImgSrc(FALLBACK_CDN_IMAGES[catId]);
    } else {
      setHasError(true);
    }
  };

  if (!imgSrc || hasError) {
    return (
      <span
        className={`text-2xl sm:text-3xl mb-2 transition-transform duration-300 ${
          isSelected ? 'scale-110' : 'group-hover:scale-110'
        }`}
      >
        {icon}
      </span>
    );
  }

  return (
    <div
      className={`relative w-16 h-16 sm:w-20 sm:h-20 mb-2.5 rounded-2xl overflow-hidden transition-all duration-300 shrink-0 ${
        isSelected
          ? 'border-2 border-white/95 shadow-md scale-105 ring-1 ring-black/10'
          : 'border border-stone-200/90 group-hover:border-stone-300 shadow-2xs group-hover:shadow-md group-hover:scale-105'
      }`}
    >
      <img
        src={imgSrc}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 rounded-2xl"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={handleImageError}
      />
      {isSelected && (
        <div className="absolute inset-0 bg-black/10 pointer-events-none rounded-2xl" />
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

  // ─── خصائص الوصف المدمج ───
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
  const getCategoryCount = (catId: ProductCategory) => {
    if (catId === 'all') return products.length;
    return products.filter((p) => p.category === catId).length;
  };

  const categories = CATEGORIES_CONFIG.filter((cat) => cat.id !== 'all');

  const hasActiveFilters = sortBy !== 'default' || onlyInStock;
  const isSearchMode = searchQuery.trim().length > 0;

  const getSortLabel = () => {
    if (sortBy === 'price-asc') return 'الأقل سعراً';
    if (sortBy === 'price-desc') return 'الأعلى سعراً';
    return '';
  };

  return (
    <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-6 sm:my-8 ${className}`}>
      <div className="relative bg-white border border-[#E8E1D3] rounded-[28px] p-5 sm:p-7 shadow-sm overflow-hidden">
        <div className="relative">

          {/* ════════ 1. الرأس ════════ */}
          <div className="flex items-center justify-between gap-3 mb-6 pb-2 border-b border-[#F0E9DA]/70">
            <div className="flex items-center gap-3 min-w-0">
              {/* الأيقونة الخضراء تحولت إلى زر التصفية والفرز */}
              <button
                type="button"
                id="category-filter-sort-btn"
                onClick={onOpenSort}
                className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#163920] to-[#0E2615] hover:from-[#1E4D2B] hover:to-[#12331C] active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-sm hover:shadow-md cursor-pointer border border-[#F5D76E]/20 group focus:outline-none focus:ring-2 focus:ring-[#163920]/40"
                title="فرز وتصفية المنتجات"
                aria-label="فرز وتصفية المنتجات"
              >
                <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-[#F5D76E] transition-transform duration-300 group-hover:scale-110" />

                {/* مؤشر وجود تصفيات نشطة */}
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
                  اختر الفئة أو اضغط على الأيقونة للتصفية السريعة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* شارة التصفية السريعة عند التفعيل */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onOpenSort}
                  className="hidden sm:inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-[#C25E12] border border-amber-200 px-3 py-1.5 rounded-full text-xs font-black cursor-pointer transition-all active:scale-95 shadow-2xs"
                  title="تعديل خيارات التصفية"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{getSortLabel() || (onlyInStock ? 'المتوفر فقط' : 'مصفّى')}</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 bg-[#F7F4EC] border border-[#E8E1D3] px-3.5 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-[#C25E12]" />
                <span className="text-xs sm:text-sm font-black text-[#112616] tabular-nums">
                  {products.length}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-[#787163]">
                  منتج
                </span>
              </div>
            </div>
          </div>

          {/* ════════ 2. شبكة/شريط الفئات مع مسافات مريحة وتصميم بارز ════════ */}
          <div
            className="flex md:grid md:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto md:overflow-visible py-2 px-1 -mx-1 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            role="tablist"
            aria-label="فئات المنتجات"
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = getCategoryCount(cat.id);

              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`relative flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden group touch-manipulation select-none active:scale-95 shrink-0 min-w-[112px] sm:min-w-0 snap-start ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#163920] to-[#0E2615] text-white border-[#163920] shadow-lg -translate-y-1'
                      : 'bg-[#FAF8F3] hover:bg-white text-[#112616] border-[#E8E1D3] hover:border-stone-300 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
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

                  <span
                    className={`text-[11px] sm:text-xs mt-2 px-2.5 py-0.5 rounded-full font-extrabold tabular-nums transition-colors ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#EAE2D2] text-[#524B3E] group-hover:bg-[#163920] group-hover:text-white'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ─── مؤشر التمرير على الهاتف ─── */}
          <div className="flex md:hidden items-center justify-center gap-1.5 mt-3 pt-2.5 border-t border-[#F0E9DA]">
            <span className="text-[11px] font-bold text-[#787163]">
              اسحب أفقياً لرؤية باقي الأقسام
            </span>
            <span className="text-xs text-[#C25E12] animate-pulse">←</span>
          </div>

          {/* ═══════════════════════════════════════════════════
              ─── 3. الوصف الخاص بالفئة تحت شريط التمريرات بتصميم راقٍ ومبسّط ───
              ═══════════════════════════════════════════════════ */}
          {categoryInfo.description && (
            <div className="mt-4 sm:mt-5 pt-3.5 border-t border-[#F0E9DA]">
              <div className="bg-gradient-to-r from-[#FBF9F4] via-[#F6F2E9] to-[#FBF9F4] border border-[#E8E1D3] rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap shadow-2xs">
                
                {/* نص الوصف */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-2 h-2 rounded-full bg-[#163920] shrink-0 opacity-80" />
                  <p className="text-xs sm:text-[13px] text-[#423C32] font-semibold leading-relaxed">
                    {categoryInfo.description}
                  </p>
                </div>

                {/* شارات الفلاتر النشطة أو زر إلغاء البحث */}
                {(hasActiveFilters || isSearchMode) && (
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {getSortLabel() && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#163920] bg-white px-2.5 py-1 rounded-full border border-[#D5CEBF] shadow-2xs">
                        <Sparkles className="w-2.5 h-2.5 text-[#C25E12]" />
                        <span>{getSortLabel()}</span>
                      </span>
                    )}
                    {onlyInStock && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#163920] bg-white px-2.5 py-1 rounded-full border border-[#D5CEBF] shadow-2xs">
                        <span>المتوفر فقط</span>
                      </span>
                    )}
                    {isSearchMode && onClearSearch && (
                      <button
                        type="button"
                        onClick={onClearSearch}
                        className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-[#B85507] hover:text-[#9C4505] bg-white hover:bg-[#FFF4EC] px-2.5 py-1 rounded-full border border-[#FDBA74] hover:border-[#EA580C] transition-all cursor-pointer shadow-2xs active:scale-95"
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