// ============================================================
// الملف: CategoryHeader.tsx – الإصدار 2.0
// رأس الفئة – تصميم متناسق مع المتجر
// ============================================================
import React from 'react';
import { ArrowDownWideNarrow, Sparkles, Search, X, Package } from 'lucide-react';
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
  const isSearchMode = searchQuery.trim().length > 0;

  // ─── نص التصفية النشطة ───
  const getSortLabel = () => {
    if (sortBy === 'price-asc') return 'الأقل سعراً';
    if (sortBy === 'price-desc') return 'الأعلى سعراً';
    return '';
  };

  return (
    <div
      id="category-header-card"
      className={`relative bg-white border border-[#E8E1D3] rounded-[24px] p-4 sm:p-5 mb-6 shadow-sm overflow-hidden ${className}`}
    >
      {/* ─── زخرفة خلفية خفيفة ─── */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F5D76E]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-[#163920]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col items-center text-center gap-3">

        {/* ════════ السطر الأول: زر الفرز + العنوان ════════ */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap w-full">

          {/* زر الفرز والتصفية */}
          <button
            type="button"
            id="sort-products-btn"
            onClick={onOpenSort}
            className="relative inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#C25E12] to-[#9C4505] hover:from-[#B85507] hover:to-[#8A3D04] text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 touch-manipulation select-none focus:outline-none focus:ring-2 focus:ring-[#C25E12]/40"
            title="فرز وتصفية المنتجات"
            aria-label="فرز وتصفية المنتجات"
          >
            <ArrowDownWideNarrow className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.3]" />

            {/* نقطة نشطة */}
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F5D76E] border-2 border-white rounded-full shadow-sm animate-pulse" />
            )}
          </button>

          {/* أيقونة الفئة (إن وجدت) */}
          {categoryInfo.icon && (
            <span className="text-2xl sm:text-3xl shrink-0">
              {categoryInfo.icon}
            </span>
          )}

          {/* عنوان الفئة */}
          <h2 className="text-xl sm:text-2xl font-black text-[#112616] tracking-tight leading-tight">
            {categoryInfo.name}
          </h2>
        </div>

        {/* ════════ السطر الثاني: الوصف ════════ */}
        {categoryInfo.description && (
          <p className="text-xs sm:text-sm text-[#524B3E] font-medium leading-relaxed max-w-xl mx-auto">
            {categoryInfo.description}
          </p>
        )}

        {/* ════════ السطر الثالث: شارات التصفية النشطة ════════ */}
        {hasActiveFilters && (
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            {/* شارة الترتيب */}
            {getSortLabel() && (
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#163920] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 shadow-xs select-none">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{getSortLabel()}</span>
              </span>
            )}

            {/* شارة المتوفر فقط */}
            {onlyInStock && (
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#163920] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 shadow-xs select-none">
                <Package className="w-3 h-3 text-emerald-600" />
                <span>المتوفر فقط</span>
              </span>
            )}
          </div>
        )}

        {/* ════════ السطر الرابع: زر إلغاء البحث ════════ */}
        {isSearchMode && onClearSearch && (
          <div className="w-full pt-3 mt-1 border-t border-[#F0E9DA]">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {/* شارة نتائج البحث */}
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#C25E12] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300 shadow-xs select-none">
                <Search className="w-3 h-3" />
                <span>نتائج البحث</span>
              </span>

              {/* زر إلغاء البحث */}
              <button
                type="button"
                onClick={onClearSearch}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#B85507] hover:text-[#9C4505] bg-[#FFF4EC] hover:bg-[#FFE8D6] px-3.5 py-2 rounded-xl border border-[#FDBA74] hover:border-[#EA580C] shrink-0 cursor-pointer transition-all duration-150 active:scale-95 shadow-xs touch-manipulation select-none"
              >
                <span className="max-w-[180px] sm:max-w-none truncate">
                  إلغاء البحث "{searchQuery}"
                </span>
                <X className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};