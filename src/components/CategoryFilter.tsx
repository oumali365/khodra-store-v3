// ============================================================
// الملف: CategoryFilter.tsx – الإصدار 2.0
// تصفية الفئات – تصميم متناسق مع المتجر
// ============================================================
import React from 'react';
import { LayoutGrid, Sparkles } from 'lucide-react';
import { ProductCategory, Product } from '../types';
import { CATEGORIES_CONFIG } from '../data/mockProducts';

interface CategoryFilterProps {
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  products: Product[];
  className?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  products,
  className = '',
}) => {
  const getCategoryCount = (catId: ProductCategory) => {
    if (catId === 'all') return products.length;
    return products.filter((p) => p.category === catId).length;
  };

  // الفئات بدون "الكل" (لأننا سنستخدمها بشكل مختلف)
  const categories = CATEGORIES_CONFIG.filter((cat) => cat.id !== 'all');

  return (
    <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-8 ${className}`}>
      <div className="bg-white border border-[#E8E1D3] rounded-[24px] p-4 sm:p-6 shadow-sm">

        {/* ════════ الرأس ════════ */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* أيقونة */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#163920] to-[#0E2615] flex items-center justify-center shrink-0 shadow-sm">
              <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-[#F5D76E]" />
            </div>

            {/* العنوان */}
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-[#112616] leading-tight truncate">
                تسوق حسب الفئات
              </h2>
              <p className="text-[11px] sm:text-xs text-[#787163] font-bold mt-0.5 truncate">
                اختر الفئة التي تريد تصفحها
              </p>
            </div>
          </div>

          {/* عداد المنتجات */}
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

        {/* ════════ شبكة/شريط الفئات ════════ */}
        {/* على الهاتف: scroll أفقي | على سطح المكتب: grid 6 أعمدة */}
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
                {/* شريط التحديد السفلي */}
                {isSelected && (
                  <span className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-[#C25E12] via-[#F5D76E] to-[#C25E12] rounded-b-2xl" />
                )}

                {/* شارة "نشط" في الزاوية (اختياري) */}
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F5D76E] shadow-sm animate-pulse" />
                )}

                {/* الأيقونة */}
                <span
                  className={`text-2xl sm:text-3xl mb-1.5 transition-transform duration-300 ${
                    isSelected ? 'scale-110' : 'group-hover:scale-110'
                  }`}
                >
                  {cat.icon}
                </span>

                {/* الاسم */}
                <span
                  className={`text-[11px] sm:text-sm font-black text-center leading-tight ${
                    isSelected ? 'text-white' : 'text-[#112616]'
                  }`}
                >
                  {cat.name}
                </span>

                {/* العداد */}
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
      </div>
    </div>
  );
};