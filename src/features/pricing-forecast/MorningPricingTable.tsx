// ============================================================
// src/features/pricing-forecast/MorningPricingTable.tsx
// جدول أسعار السوق الصباحي (تعديل مباشر وحساب تلقائي للهامش)
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Save,
  CheckCircle2,
  RefreshCw,
  Building2,
  Filter,
  DollarSign,
  TrendingUp,
  Percent,
  Sparkles,
} from 'lucide-react';
import type { ProductPriceRow, Supplier, PriceTrend } from './types';
import { calculateSellingPrice, determineTrend } from './pricingService';
import type { ProductCategory } from '../../types';

interface MorningPricingTableProps {
  rows: ProductPriceRow[];
  suppliers: Supplier[];
  onSaveBatch: (updates: { productId: number; purchasePrice: number; marginPercentage: number; supplierId: string }[]) => Promise<void>;
  onOpenSuppliersModal: () => void;
  onRefresh: () => void;
  isSaving: boolean;
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  all: 'الكل (120+)',
  veg: 'خضار وورقيات',
  fruit: 'فواكه موسمية',
  dairy: 'ألبان وأجبان',
  grocery: 'بقالة ومونة',
  drinks: 'عصائر ومشروبات',
  cleaning: 'نظافة وعناية',
};

export const MorningPricingTable: React.FC<MorningPricingTableProps> = ({
  rows: initialRows,
  suppliers,
  onSaveBatch,
  onOpenSuppliersModal,
  onRefresh,
  isSaving,
}) => {
  // Local state for live inline editing
  const [tableData, setTableData] = useState<ProductPriceRow[]>(initialRows);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [savingRowId, setSavingRowId] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync if initialRows updates
  React.useEffect(() => {
    setTableData(initialRows);
  }, [initialRows]);

  // Handle live inline editing of purchase price or margin
  const handleCellChange = (
    productId: number,
    field: 'purchase_price' | 'margin_percentage' | 'supplier_id',
    value: number | string
  ) => {
    setTableData((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;

        let newPurchase = item.purchase_price;
        let newMargin = item.margin_percentage;
        let newSupplierId = item.supplier_id;
        let newSupplierName = item.supplier_name;

        if (field === 'purchase_price') {
          newPurchase = typeof value === 'number' ? Math.max(0, value) : Number(value) || 0;
        } else if (field === 'margin_percentage') {
          newMargin = typeof value === 'number' ? value : Number(value) || 0;
        } else if (field === 'supplier_id') {
          newSupplierId = String(value);
          const found = suppliers.find((s) => s.id === newSupplierId);
          if (found) newSupplierName = found.name;
        }

        const newSelling = calculateSellingPrice(newPurchase, newMargin);
        const newTrend = determineTrend(newPurchase, item.yesterday_price);

        return {
          ...item,
          purchase_price: newPurchase,
          margin_percentage: newMargin,
          selling_price: newSelling,
          trend: newTrend,
          supplier_id: newSupplierId,
          supplier_name: newSupplierName,
          is_modified: true,
        };
      })
    );
  };

  // Quick save for single row
  const handleSaveSingleRow = async (row: ProductPriceRow) => {
    setSavingRowId(row.id);
    try {
      await onSaveBatch([
        {
          productId: row.id,
          purchasePrice: row.purchase_price,
          marginPercentage: row.margin_percentage,
          supplierId: row.supplier_id,
        },
      ]);
      setTableData((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, is_modified: false } : item))
      );
      setSuccessToast(`✅ تم تحديث سعر "${row.name}" بنجاح (${row.selling_price} د.م)`);
      setTimeout(() => setSuccessToast(null), 3000);
    } finally {
      setSavingRowId(null);
    }
  };

  // Save all modified rows
  const modifiedRows = useMemo(() => tableData.filter((r) => r.is_modified), [tableData]);

  const handleSaveAllModified = async () => {
    if (modifiedRows.length === 0) return;
    const payload = modifiedRows.map((r) => ({
      productId: r.id,
      purchasePrice: r.purchase_price,
      marginPercentage: r.margin_percentage,
      supplierId: r.supplier_id,
    }));
    await onSaveBatch(payload);
    setTableData((prev) => prev.map((r) => ({ ...r, is_modified: false })));
    setSuccessToast(`✅ تم حفظ أسعار ${modifiedRows.length} منتجات في سجل السوق الصباحي!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Filter products by search and category
  const filteredData = useMemo(() => {
    return tableData.filter((row) => {
      const matchCat = selectedCategory === 'all' || row.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.supplier_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [tableData, selectedCategory, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = tableData.length;
    const avgMargin = Math.round(
      tableData.reduce((acc, r) => acc + r.margin_percentage, 0) / (totalCount || 1)
    );
    const modifiedCount = tableData.filter((r) => r.is_modified).length;
    const upCount = tableData.filter((r) => r.trend === 'up').length;
    const downCount = tableData.filter((r) => r.trend === 'down').length;

    return { totalCount, avgMargin, modifiedCount, upCount, downCount };
  }, [tableData]);

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* ═══════ شريط الإحصائيات الذكية العلوية ═══════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] text-stone-500 font-bold block">إجمالي المنتجات</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 tabular-nums">{stats.totalCount}</span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">سوق بنسودة فاس</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
            🥬
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] text-stone-500 font-bold block">متوسط هامش الربح</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-800 tabular-nums">%{stats.avgMargin}</span>
            <span className="text-[10px] text-stone-400 block mt-0.5">محسوب تلقائياً</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] text-stone-500 font-bold block">مؤشرات السوق اليوم</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-black text-red-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {stats.upCount} ارتفع
              </span>
              <span className="text-xs font-black text-emerald-600 flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {stats.downCount} انخفض
              </span>
            </div>
            <span className="text-[10px] text-stone-400 block mt-0.5">مقارنة بالأمس</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] text-stone-500 font-bold block">تعديلات قيد الحفظ</span>
            <span className="text-xl sm:text-2xl font-black text-[#EA580C] tabular-nums">{stats.modifiedCount}</span>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              {stats.modifiedCount > 0 ? 'جاهزة للحفظ السحابي' : 'جميعها متزامنة'}
            </span>
          </div>
          <button
            type="button"
            disabled={stats.modifiedCount === 0 || isSaving}
            onClick={handleSaveAllModified}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              stats.modifiedCount > 0
                ? 'bg-[#163920] hover:bg-[#0E2615] text-[#FEF08A] shadow-md animate-bounce'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
            title="حفظ كافة التعديلات"
          >
            <Save className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ═══════ إشعار نجاح الحفظ ═══════ */}
      {successToast && (
        <div className="p-3 bg-emerald-700 text-white text-xs sm:text-sm font-black rounded-2xl border border-emerald-500 shadow-md flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FEF08A]" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-white/80 hover:text-white cursor-pointer px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ═══════ أدوات التحكم: البحث، الفئات، وزر إدارة الموردين ═══════ */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* حقل البحث */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المنتج (بطاطس، طماطم...) أو اسم المورد..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:outline-emerald-600 bg-stone-50/50"
            />
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
          </div>

          {/* أزرار الإجراءات السريعة */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenSuppliersModal}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-black text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>إدارة الموردين ({suppliers.length})</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-600 text-xs font-bold transition-colors cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {modifiedRows.length > 0 && (
              <button
                type="button"
                onClick={handleSaveAllModified}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-gradient-to-l from-emerald-700 to-green-800 hover:from-emerald-800 hover:to-green-900 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#F5D76E]" />
                <span>حفظ التعديلات ({modifiedRows.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* فئات المنتجات */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#163920] text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ جدول الأسعار المباشر (> 120 منتج) ═══════ */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-black">
                <th className="py-3 px-3 sm:px-4 w-12 text-center">#</th>
                <th className="py-3 px-3 sm:px-4 min-w-[170px]">اسم المنتج</th>
                <th className="py-3 px-3 sm:px-4 min-w-[170px]">المورد (سوق بنسودة)</th>
                <th className="py-3 px-3 sm:px-4 min-w-[125px]">
                  <span>سعر الشراء</span>
                  <span className="text-[10px] text-stone-500 font-normal block">(د.م / {filteredData[0]?.unit_label || 'kg'})</span>
                </th>
                <th className="py-3 px-3 sm:px-4 min-w-[115px]">
                  <span>هامش الربح</span>
                  <span className="text-[10px] text-stone-500 font-normal block">(نسبة مئوية %)</span>
                </th>
                <th className="py-3 px-3 sm:px-4 min-w-[125px]">
                  <span className="text-emerald-800">سعر البيع</span>
                  <span className="text-[10px] text-emerald-600 font-normal block">(محسوب تلقائياً)</span>
                </th>
                <th className="py-3 px-3 sm:px-4 min-w-[110px] text-center">مؤشر الاتجاه</th>
                <th className="py-3 px-3 sm:px-4 w-20 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    لم نتمكن من العثور على أي منتج مطابق لمعايير البحث.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isRowSaving = savingRowId === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-amber-50/30 transition-colors ${
                        row.is_modified ? 'bg-amber-50/50 font-bold' : ''
                      }`}
                    >
                      {/* الرقم الترتيبي */}
                      <td className="py-2.5 px-3 sm:px-4 text-center text-stone-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* اسم المنتج والصورة */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                            {row.icon}
                          </span>
                          <div>
                            <div className="font-black text-stone-900 text-xs sm:text-sm">{row.name}</div>
                            <span className="text-[10px] text-stone-400 font-normal">
                              {row.unit_label} • {CATEGORY_LABELS[row.category]}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* قائمة الموردين */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <select
                          value={row.supplier_id}
                          onChange={(e) => handleCellChange(row.id, 'supplier_id', e.target.value)}
                          className="w-full py-1.5 px-2 rounded-xl border border-stone-200 bg-white text-stone-800 text-[11px] font-bold focus:outline-emerald-600 truncate"
                        >
                          {suppliers.map((sup) => (
                            <option key={sup.id} value={sup.id}>
                              {sup.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* سعر الشراء (تعديل مباشر) */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={row.purchase_price}
                            onChange={(e) =>
                              handleCellChange(row.id, 'purchase_price', parseFloat(e.target.value) || 0)
                            }
                            className="w-full py-1 px-2 pr-6 rounded-xl border border-stone-300 bg-white text-stone-900 font-mono font-black text-xs focus:outline-emerald-600 focus:border-emerald-600 tabular-nums"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-stone-400 font-bold pointer-events-none">
                            د.م
                          </span>
                        </div>
                      </td>

                      {/* هامش الربح % (تعديل مباشر) */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="150"
                            value={row.margin_percentage}
                            onChange={(e) =>
                              handleCellChange(row.id, 'margin_percentage', parseFloat(e.target.value) || 0)
                            }
                            className="w-full py-1 px-2 pr-6 rounded-xl border border-stone-300 bg-white text-stone-900 font-mono font-black text-xs focus:outline-emerald-600 focus:border-emerald-600 tabular-nums text-center"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-stone-400 font-bold pointer-events-none">
                            %
                          </span>
                        </div>
                      </td>

                      {/* سعر البيع (محسوب تلقائياً) */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <div className="py-1 px-2.5 rounded-xl bg-emerald-50 border border-emerald-300/80 text-emerald-900 font-mono font-black text-xs sm:text-sm text-center tabular-nums">
                          {row.selling_price.toFixed(2)} د.م
                        </div>
                      </td>

                      {/* مؤشر الاتجاه */}
                      <td className="py-2.5 px-3 sm:px-4 text-center">
                        {row.trend === 'up' && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200">
                            <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
                            <span>ارتفع ({row.yesterday_price} د.م)</span>
                          </span>
                        )}
                        {row.trend === 'down' && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                            <span>انخفض ({row.yesterday_price} د.م)</span>
                          </span>
                        )}
                        {row.trend === 'stable' && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                            <Minus className="w-3 h-3 text-stone-400" />
                            <span>مستقر</span>
                          </span>
                        )}
                      </td>

                      {/* زر الحفظ السريع */}
                      <td className="py-2.5 px-3 sm:px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleSaveSingleRow(row)}
                          disabled={isRowSaving}
                          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                            row.is_modified
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                              : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                          }`}
                          title={row.is_modified ? 'حفظ هذا التعديل' : 'السعر محفوظ'}
                        >
                          {isRowSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* تذييل الجدول */}
        <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-stone-600 font-bold">
            عرض {filteredData.length} منتجاً من أصل {tableData.length} منتجاً متاحاً في المتجر
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-500">
              المعادلة التلقائية: <strong>سعر البيع = سعر الشراء × (1 + هامش الربح / 100)</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
