// ============================================================
// SortFilterModal.tsx – نافذة فرز وتصفية المنتجات الصغيرة
// ============================================================
import React from 'react';
import { X, ArrowDownWideNarrow, ArrowUpWideNarrow, PackageCheck, RotateCcw, Check } from 'lucide-react';

export type SortOption = 'default' | 'price-asc' | 'price-desc';

interface SortFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onlyInStock: boolean;
  onToggleOnlyInStock: () => void;
  onReset: () => void;
}

export const SortFilterModal: React.FC<SortFilterModalProps> = ({
  isOpen,
  onClose,
  sortBy,
  onSortChange,
  onlyInStock,
  onToggleOnlyInStock,
  onReset,
}) => {
  if (!isOpen) return null;

  const hasActiveFilters = sortBy !== 'default' || onlyInStock;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sort-modal-title"
    >
      {/* خلفية معتمة خفيفة */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* بطاقة النافذة الصغيرة */}
      <div className="relative w-full max-w-sm bg-white rounded-[24px] border border-[#D4C8B5] shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 text-right">
        {/* رأس النافذة */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE2D2] bg-[#FAF7F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C25E12] text-white flex items-center justify-center shadow-xs">
              <ArrowDownWideNarrow className="w-4 h-4 stroke-[2.3]" />
            </div>
            <h3 id="sort-modal-title" className="text-base font-black text-[#112616]">
              فرز وتصفية المنتجات
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#EAE2D2] border border-[#D4C8B5] text-[#2D271E] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* جسم النافذة: الثلاثة مفاتيح المطلوبة */}
        <div className="p-4 space-y-2.5">
          {/* المفتاح 1: الأقل سعراً */}
          <button
            type="button"
            id="sort-price-asc-key"
            onClick={() => {
              onSortChange(sortBy === 'price-asc' ? 'default' : 'price-asc');
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-right group ${
              sortBy === 'price-asc'
                ? 'bg-emerald-50/80 border-[#1E4327] shadow-xs'
                : 'bg-[#F7F4EC] hover:bg-white border-[#D4C8B5]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  sortBy === 'price-asc'
                    ? 'bg-[#1E4327] text-white'
                    : 'bg-white text-[#2D271E] border border-[#D4C8B5]'
                }`}
              >
                <ArrowDownWideNarrow className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-black text-[#112616]">
                  الأقل سعراً
                </span>
                <span className="block text-xs text-[#2D271E] font-medium">
                  ترتيب من الأرخص إلى الأعلى سعراً
                </span>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                sortBy === 'price-asc'
                  ? 'bg-[#1E4327] border-[#1E4327] text-white'
                  : 'border-[#D4C8B5] bg-white'
              }`}
            >
              {sortBy === 'price-asc' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* المفتاح 2: الأعلى سعراً */}
          <button
            type="button"
            id="sort-price-desc-key"
            onClick={() => {
              onSortChange(sortBy === 'price-desc' ? 'default' : 'price-desc');
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-right group ${
              sortBy === 'price-desc'
                ? 'bg-emerald-50/80 border-[#1E4327] shadow-xs'
                : 'bg-[#F7F4EC] hover:bg-white border-[#D4C8B5]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  sortBy === 'price-desc'
                    ? 'bg-[#1E4327] text-white'
                    : 'bg-white text-[#2D271E] border border-[#D4C8B5]'
                }`}
              >
                <ArrowUpWideNarrow className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-black text-[#112616]">
                  الأعلى سعراً
                </span>
                <span className="block text-xs text-[#2D271E] font-medium">
                  ترتيب من الأعلى إلى الأقل سعراً
                </span>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                sortBy === 'price-desc'
                  ? 'bg-[#1E4327] border-[#1E4327] text-white'
                  : 'border-[#D4C8B5] bg-white'
              }`}
            >
              {sortBy === 'price-desc' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          {/* المفتاح 3: المتوفر في المخزن فقط */}
          <div
            onClick={onToggleOnlyInStock}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleOnlyInStock();
              }
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-right ${
              onlyInStock
                ? 'bg-emerald-50/80 border-[#1E4327] shadow-xs'
                : 'bg-[#F7F4EC] hover:bg-white border-[#D4C8B5]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  onlyInStock
                    ? 'bg-[#1E4327] text-white'
                    : 'bg-white text-[#2D271E] border border-[#D4C8B5]'
                }`}
              >
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-black text-[#112616]">
                  المتوفر في المخزن فقط
                </span>
                <span className="block text-xs text-[#2D271E] font-medium">
                  إخفاء المنتجات التي نفد مخزونها
                </span>
              </div>
            </div>

            {/* مفتاح التبديل (Toggle Switch) */}
            <div
              className={`w-12 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                onlyInStock ? 'bg-[#1E4327]' : 'bg-[#D4C8B5]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  onlyInStock ? '-translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>

        {/* أسفل النافذة: أزرار التطبيق وإعادة الضبط */}
        <div className="px-4 py-3 bg-[#FAF7F0] border-t border-[#EAE2D2] flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#D4C8B5] bg-white hover:bg-red-50 text-red-700 text-xs font-black transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إلغاء الفرز</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#1E4327] hover:bg-[#112616] text-white font-black text-xs sm:text-sm shadow-xs transition-colors cursor-pointer text-center"
          >
            تطبيق
          </button>
        </div>
      </div>
    </div>
  );
};
