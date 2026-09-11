// ============================================================
// الملف الثاني: CategoryFilter.tsx – محسّن مع توسيط العنوان
// ============================================================
import React from 'react';
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

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 ${className}`}>
      <div className="bg-white border border-[#D4C8B5] rounded-[28px] p-5 sm:p-7 shadow-sm">
        {/* ─── رأس القسم: عنوان + عداد المنتجات ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 text-center sm:text-right">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#112616] text-center sm:text-right">
              تسوق حسب الفئات
            </h2>
          </div>
          <span className="text-xs font-extrabold text-[#1A1814] bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#D4C8B5] w-fit mx-auto sm:mx-0 shadow-xs">
            {products.length} منتج متاح
          </span>
        </div>

        {/* ─── شبكة الفئات ─── */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3" role="tablist">
          {CATEGORIES_CONFIG.filter((cat) => cat.id !== 'all').map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = getCategoryCount(cat.id);

            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-[18px] border transition-all cursor-pointer relative overflow-hidden group touch-manipulation select-none active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#1E4327] to-[#112616] text-white border-[#112616] shadow-md -translate-y-1 scale-[1.02]'
                    : 'bg-[#F7F4EC] hover:bg-white text-[#112616] border-[#D4C8B5] hover:border-[#C25E12] shadow-xs'
                }`}
              >
                {/* شريط التحديد السفلي */}
                {isSelected && (
                  <span className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#C25E12] to-[#E5832E] rounded-b-[18px]" />
                )}

                <span className="text-2xl sm:text-3xl mb-1.5 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </span>

                <span className={`text-xs sm:text-sm font-black text-center ${isSelected ? 'text-white' : 'text-[#112616]'}`}>
                  {cat.name}
                </span>

                <span
                  className={`text-xs mt-1 px-2.5 py-0.5 rounded-full font-extrabold ${
                    isSelected
                      ? 'bg-white/25 text-white'
                      : 'bg-[#EAE2D2] text-[#2D271E]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};