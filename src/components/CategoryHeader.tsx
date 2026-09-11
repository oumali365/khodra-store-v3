// ============================================================
// CategoryHeader.tsx – قسم تعريف الفئة المحددة مع زر التصفية
// ============================================================
import React from 'react';
import { ArrowDownWideNarrow, Sparkles } from 'lucide-react';
import { SortOption } from './SortFilterModal';

export interface CategoryHeaderInfo {
  id?: string;
  name: string;
  icon?: string;
  description: string;
}

interface CategoryHeaderProps {
  categoryInfo: CategoryHeaderInfo;
  sortBy: SortOption;
  onlyInStock: boolean;
  onOpenSort: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  categoryInfo,
  sortBy,
  onlyInStock,
  onOpenSort,
  searchQuery = '',
  onClearSearch,
  className = '',
}) => {
  const hasActiveFilters = sortBy !== 'default' || onlyInStock;

  return (
    <div
      id="category-header-card"
      className={`bg-gradient-to-b from-white to-[#FDFBF7] border border-[#D4C8B5] rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-6 shadow-xs flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
        {/* ─── سطر العنوان وزر التصفية قبله مباشرة مع التوسيط ─── */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap">
          {/* أيقونة وزر فرز وتصفية المنتجات مصغرة بشكل طفيف وبخلفية برتقالية قبل العنوان */}
          <button
            type="button"
            id="sort-products-btn"
            onClick={onOpenSort}
            className="relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#C25E12] text-white shadow-sm shadow-[#EA580C]/25 hover:shadow-md hover:from-[#F97316] hover:to-[#EA580C] active:scale-90 transition-all duration-150 cursor-pointer shrink-0 select-none touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#EA580C]/50 focus:ring-offset-1"
            title="فرز وتصفية المنتجات"
            aria-label="فرز وتصفية المنتجات"
          >
            <ArrowDownWideNarrow className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.3] text-white" />

            {/* نقطة مضيئة عند تفعيل أي تصفية */}
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-300 border-2 border-white rounded-full shadow-xs animate-pulse" />
            )}
          </button>

          {/* عنوان الفئة */}
          <h2 className="text-xl sm:text-2xl font-black text-[#112616] tracking-tight">
            {categoryInfo.name}
          </h2>

          {/* شارة التصفية النشطة إن وجدت */}
          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#1E4327] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs select-none">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              <span>
                {sortBy === 'price-asc'
                  ? 'الأقل سعراً'
                  : sortBy === 'price-desc'
                  ? 'الأعلى سعراً'
                  : ''}
              </span>
              <span>
                {onlyInStock
                  ? sortBy !== 'default'
                    ? ' • المتوفر فقط'
                    : 'المتوفر في المخزن فقط'
                  : ''}
              </span>
            </span>
          )}
        </div>

        {/* وصف الفئة موسّط */}
        <p className="text-xs sm:text-sm text-[#4A4237] mt-2 font-medium leading-relaxed max-w-xl mx-auto text-center">
          {categoryInfo.description}
        </p>

        {/* زر إلغاء تصفية البحث إن وجد */}
        {searchQuery && onClearSearch && (
          <div className="flex items-center justify-center gap-2 flex-wrap pt-3 mt-2 border-t border-[#EFE8DC] w-full">
            <button
              type="button"
              onClick={onClearSearch}
              className="text-xs sm:text-sm font-black text-[#B85507] hover:text-[#9C4505] bg-[#FFF4EC] hover:bg-[#FFE8D6] px-3.5 py-2 rounded-xl border border-[#FDBA74] shrink-0 cursor-pointer transition-all duration-150 active:scale-95 shadow-2xs select-none touch-manipulation flex items-center gap-1.5"
            >
              <span>إلغاء تصفية البحث ({searchQuery})</span>
              <span className="text-base font-bold leading-none">✕</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
