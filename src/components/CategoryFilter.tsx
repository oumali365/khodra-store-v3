// ============================================================
// الملف: CategoryFilter.tsx – الإصدار 3.0 (المُدمج)
// يدمج: شبكة الفئات + شريط وصف الفئة النشطة
// ============================================================
import React from 'react';
import { LayoutGrid, Sparkles, ArrowDownWideNarrow } from 'lucide-react';
import { ProductCategory, Product } from '../types';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import { SortOption } from './SortFilterModal';

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

  // ─── خصائص الوصف المدمج (كانت في CategoryHeader) ───
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
    <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-8 ${className}`}>
      <div className="relative bg-white border border-[#E8E1D3] rounded-[24px] p-4 sm:p-5 shadow-sm overflow-hidden">

        {/* ─── زخرفة خلفية ─── */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F5D76E]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative">

          {/* ════════ 1. الرأس ════════ */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#163920] to-[#0E2615] flex items-center justify-center shrink-0 shadow-sm">
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-[#F5D76E]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-black text-[#112616] leading-tight truncate">
                  تسوق حسب الفئات
                </h2>
                <p className="text-[10px] sm:text-xs text-[#787163] font-bold mt-0.5 truncate">
                  اختر الفئة التي تريد تصفحها
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 bg-[#F7F4EC] border border-[#E8E1D3] px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3 text-[#C25E12]" />
              <span className="text-[11px] sm:text-xs font-black text-[#112616] tabular-nums">
                {products.length}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#787163]">
                منتج
              </span>
            </div>
          </div>

          {/* ════════ 2. شبكة/شريط الفئات ════════ */}
          <div
            className="flex md:grid md:grid-cols-6 gap-2.5 sm:gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-1 px-1 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth"
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
                  className={`relative flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden group touch-manipulation select-none active:scale-95 shrink-0 min-w-[100px] sm:min-w-0 snap-start ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#163920] to-[#0E2615] text-white border-[#163920] shadow-md -translate-y-0.5'
                      : 'bg-[#F7F4EC] hover:bg-white text-[#112616] border-[#E8E1D3] hover:border-[#C25E12] shadow-xs hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-[#C25E12] via-[#F5D76E] to-[#C25E12] rounded-b-2xl" />
                  )}

                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F5D76E] shadow-sm animate-pulse" />
                  )}

                  <span
                    className={`text-2xl sm:text-3xl mb-1.5 transition-transform duration-300 ${
                      isSelected ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                  >
                    {cat.icon}
                  </span>

                  <span
                    className={`text-[11px] sm:text-sm font-black text-center leading-tight ${
                      isSelected ? 'text-white' : 'text-[#112616]'
                    }`}
                  >
                    {cat.name}
                  </span>

                  <span
                    className={`text-[10px] sm:text-xs mt-1.5 px-2 py-0.5 rounded-full font-extrabold tabular-nums transition-colors ${
                      isSelected
                        ? 'bg-[#F5D76E] text-[#163920]'
                        : 'bg-[#EAE2D2] text-[#524B3E] group-hover:bg-[#C25E12] group-hover:text-white'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ─── مؤشر التمرير على الهاتف ─── */}
          <div className="flex md:hidden items-center justify-center gap-1.5 mt-3 pt-2 border-t border-[#F0E9DA]">
            <span className="text-[10px] font-bold text-[#787163]">
              اسحب لرؤية المزيد
            </span>
            <span className="text-[11px] text-[#C25E12] animate-pulse">←</span>
          </div>

          {/* ═══════════════════════════════════════════════════
              ─── 3. شريط وصف الفئة النشطة (مدمج) ───
              ═══════════════════════════════════════════════════ */}
          <div className="mt-3.5 pt-3.5 border-t-2 border-[#F0E9DA]">
            <div className="flex items-start gap-3">

              {/* أيقونة الفئة النشطة */}
              {categoryInfo.icon && (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#F7F4EC] to-[#EAE2D2] border-2 border-[#E8E1D3] flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-xl sm:text-2xl">{categoryInfo.icon}</span>
                </div>
              )}

              {/* المحتوى */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-[#112616] flex items-center gap-2">
                    <span>{categoryInfo.name}</span>
                    {isSearchMode && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-[#C25E12] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Sparkles className="w-3 h-3" />
                        <span>نتائج البحث</span>
                      </span>
                    )}
                  </h3>

                  {/* زر الفرز بجانب العنوان (على سطح المكتب) */}
                  <button
                    type="button"
                    id="sort-products-btn"
                    onClick={onOpenSort}
                    className="relative hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#C25E12] to-[#9C4505] hover:from-[#B85507] hover:to-[#8A3D04] text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                    title="فرز وتصفية المنتجات"
                    aria-label="فرز وتصفية المنتجات"
                  >
                    <ArrowDownWideNarrow className="w-4 h-4" />
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#F5D76E] border-2 border-white rounded-full shadow-sm animate-pulse" />
                    )}
                  </button>
                </div>

                <p className="text-[11px] sm:text-xs text-[#524B3E] font-medium leading-relaxed line-clamp-2 mb-2">
                  {categoryInfo.description}
                </p>

                {/* شارات التصفية النشطة */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {getSortLabel() && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#163920] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{getSortLabel()}</span>
                      </span>
                    )}
                    {onlyInStock && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#163920] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span>المتوفر فقط</span>
                      </span>
                    )}
                  </div>
                )}

                {/* ─── الأسفل: زر الفرز (هاتف) + إلغاء البحث ─── */}
                <div className="flex items-center justify-between gap-2 flex-wrap">

                  {/* زر الفرز على الهاتف */}
                  <button
                    type="button"
                    onClick={onOpenSort}
                    className="relative sm:hidden inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-[#C25E12] to-[#9C4505] text-white text-[11px] font-black shadow-sm active:scale-95 transition-all cursor-pointer"
                    title="فرز وتصفية المنتجات"
                  >
                    <ArrowDownWideNarrow className="w-3.5 h-3.5" />
                    <span>فرز وتصفية</span>
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#F5D76E] border-2 border-white rounded-full shadow-sm animate-pulse" />
                    )}
                  </button>

                  {/* زر إلغاء البحث */}
                  {isSearchMode && onClearSearch && (
                    <button
                      type="button"
                      onClick={onClearSearch}
                      className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black text-[#B85507] hover:text-[#9C4505] bg-[#FFF4EC] hover:bg-[#FFE8D6] px-2.5 py-1.5 rounded-lg border border-[#FDBA74] hover:border-[#EA580C] transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <span className="max-w-[140px] sm:max-w-none truncate">
                        إلغاء "{searchQuery}"
                      </span>
                      <span className="text-sm font-bold leading-none">✕</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};