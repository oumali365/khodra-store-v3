// ============================================================
// src/features/pricing-forecast/MorningPricingTable.tsx
// جدول أسعار السوق الصباحي - تصميم عصري ومريح لمتجر "خُضرة"
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
  Percent,
  TrendingUp,
  ShieldCheck,
  Check,
  Layers,
  Sparkles,
  PackageCheck,
  PackageX,
  AlertCircle,
} from 'lucide-react';
import type { ProductPriceRow, Supplier } from './types';
import { DEFAULT_PROFIT_MARGIN } from './types';
import {
  calculateSellingPrice,
  determineTrend,
  updateProductAvailability,
  updateProductStock,
} from './pricingService';
import type { ProductCategory } from '../../types';

interface MorningPricingTableProps {
  rows: ProductPriceRow[];
  suppliers: Supplier[];
  onSaveBatch: (
    updates: { productId: number; purchasePrice: number; marginPercentage: number; supplierId: string }[]
  ) => Promise<void>;
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
  const [tableData, setTableData] = useState<ProductPriceRow[]>(initialRows);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [savingRowId, setSavingRowId] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  React.useEffect(() => {
    setTableData(initialRows);
  }, [initialRows]);

  // تعديل مباشر لسعر الشراء أو الهامش أو المورد
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

  // حفظ صف مفرد
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
      setSuccessToast(`تم تحديث سعر "${row.name}" بنجاح (${row.selling_price} د.م)`);
      setTimeout(() => setSuccessToast(null), 3000);
    } finally {
      setSavingRowId(null);
    }
  };

  // تبديل حالة التوفر فورياً مع تعديل كمية المخزون (0 = غير متوفر، 10 = متوفر)
  const handleToggleAvailability = async (productId: number, currentStatus: boolean, currentStock?: number) => {
    const nextStatus = !currentStatus;
    const nextStock = nextStatus ? (currentStock && currentStock > 0 ? currentStock : 10) : 0;

    setTableData((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, is_available: nextStatus, stock: nextStock } : item
      )
    );

    await updateProductAvailability(productId, nextStatus, nextStock);

    setSuccessToast(
      nextStatus
        ? `🟢 تم تعيين "${tableData.find((p) => p.id === productId)?.name || 'المنتج'}" كـ "متوفر" (مخزون: ${nextStock})`
        : `🔴 تم تفريغ المخزون وتعيين المنتج كـ "غير متوفر" في المتجر (مخزون: 0)`
    );
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // تعديل كمية المخزون يدوياً (0 = غير متوفر، 1-5 = كمية محدودة، >5 = متوفر)
  const handleStockQuantityChange = async (productId: number, rawValue: string) => {
    const num = Math.max(0, parseInt(rawValue, 10) || 0);
    const isAvail = num > 0;

    setTableData((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, stock: num, is_available: isAvail } : item
      )
    );

    await updateProductStock(productId, num);

    let statusText = 'متوفر في المتجر';
    if (num === 0) statusText = 'غير متوفر (تم تفريغ المخزون)';
    else if (num >= 1 && num <= 5) statusText = `كمية محدودة (${num})`;

    setSuccessToast(`تم تحديث مخزون المنتج إلى ${num} • الحالة: ${statusText}`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // حفظ جميع التعديلات دفعة واحدة
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
    setSuccessToast(`تم حفظ أسعار ${modifiedRows.length} منتجات في قاعدة البيانات بنجاح!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // تطبيق هامش 33% على جميع المنتجات دفعة واحدة
  const handleApplyGlobal33Percent = async () => {
    const updated = tableData.map((item) => {
      const newMargin = DEFAULT_PROFIT_MARGIN;
      const newSelling = calculateSellingPrice(item.purchase_price, newMargin);
      return {
        ...item,
        margin_percentage: newMargin,
        selling_price: newSelling,
        is_modified: true,
      };
    });
    setTableData(updated);

    const payload = updated.map((r) => ({
      productId: r.id,
      purchasePrice: r.purchase_price,
      marginPercentage: DEFAULT_PROFIT_MARGIN,
      supplierId: r.supplier_id,
    }));

    await onSaveBatch(payload);
    setTableData((prev) => prev.map((r) => ({ ...r, is_modified: false })));
    setSuccessToast(
      `🛡️ تم اعتماد هامش 33% لجميع المنتجات لضمان تغطية مصاريف النقل واللوجستيك والإتلاف ومزامنتها فوراً مع المتجر!`
    );
    setTimeout(() => setSuccessToast(null), 4500);
  };

  // تصفية المنتجات بالبحث والفئة
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

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const totalCount = tableData.length;
    const avgMargin = Math.round(
      tableData.reduce((acc, r) => acc + r.margin_percentage, 0) / (totalCount || 1)
    );
    const modifiedCount = tableData.filter((r) => r.is_modified).length;
    const upCount = tableData.filter((r) => r.trend === 'up').length;
    const downCount = tableData.filter((r) => r.trend === 'down').length;
    const outOfStockCount = tableData.filter((r) => (r.stock ?? 10) === 0).length;
    const limitedStockCount = tableData.filter((r) => (r.stock ?? 10) >= 1 && (r.stock ?? 10) <= 5).length;

    return { totalCount, avgMargin, modifiedCount, upCount, downCount, outOfStockCount, limitedStockCount };
  }, [tableData]);

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* ═══════ بطاقات الإحصائيات (grid-cols-4 مع أرقام كبيرة وعناوين صغيرة) ═══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* بطاقة إجمالي المنتجات */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-stone-500">إجمالي المنتجات</span>
            <span className="text-xl">🥬</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black font-['Almarai'] text-stone-900 tabular-nums">
              {stats.totalCount}
            </span>
            <p className="text-[11px] text-emerald-800 font-bold mt-1">سوق الجملة بنسودة فاس</p>
          </div>
        </div>

        {/* بطاقة متوسط هامش الربح */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-stone-500">متوسط هامش الربح</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-['Almarai'] text-[#163920] tabular-nums">
                %{stats.avgMargin}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#F5D76E]/30 text-stone-800 border border-[#F5D76E]/50">
                المعتمد 33%
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium mt-1">تغطية مصاريف اللوجستيك والإتلاف</p>
          </div>
        </div>

        {/* بطاقة حالة المخزون والتوفر */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-stone-500">حالة التوفر بالمخزن</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xs font-bold">
              JIT
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-black text-rose-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                {stats.outOfStockCount} نافد (0)
              </span>
              <span className="text-sm font-black text-amber-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                {stats.limitedStockCount} محدود (1-5)
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium mt-1">تفريغ المخزون = غير متوفر بالمتجر</p>
          </div>
        </div>

        {/* بطاقة التعديلات قيد الحفظ */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-stone-500">تعديلات غير محفوظة</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <Save className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-black font-['Almarai'] text-[#D9762B] tabular-nums">
                {stats.modifiedCount}
              </span>
              <p className="text-[11px] text-stone-400 font-medium mt-1">
                {stats.modifiedCount > 0 ? 'جاهزة للحفظ السحابي' : 'جميع الأسعار متزامنة'}
              </p>
            </div>
            {stats.modifiedCount > 0 && (
              <button
                type="button"
                onClick={handleSaveAllModified}
                disabled={isSaving}
                className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-[#163920] hover:bg-[#0E2615] text-[#F5D76E] text-xs font-black shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الآن</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ إشعار تنبيهي سريع ═══════ */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 text-[#163920] text-xs sm:text-sm font-bold rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ═══════ شريط الأدوات: البحث، الفئات، والإجراءات ═══════ */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* حقل البحث بالاسم والمورد */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المنتج (بطاطس، طماطم...) أو اسم المورد..."
              className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-2xl border border-stone-200 text-xs sm:text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#163920] focus:border-[#163920] bg-stone-50/60 placeholder:text-stone-400 transition-all"
            />
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>

          {/* أزرار الإجراءات السريعة */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleApplyGlobal33Percent}
              disabled={isSaving}
              className="min-h-[44px] px-4 py-2 rounded-2xl bg-amber-50/80 hover:bg-amber-100 border border-amber-200 text-amber-900 font-black text-xs inline-flex items-center gap-2 shadow-2xs cursor-pointer active:scale-97 transition-all"
              title="توحيد هامش الربح لكافة المنتجات إلى 33% لضمان تغطية مصاريف التشغيل والنقل واللوجستيك"
            >
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>رفع الكل إلى 33% (أمان الخزينة)</span>
            </button>

            <button
              type="button"
              onClick={onOpenSuppliersModal}
              className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-xs inline-flex items-center gap-2 shadow-2xs cursor-pointer active:scale-97 transition-all"
            >
              <Building2 className="w-4 h-4 text-[#163920]" />
              <span>الموردون ({suppliers.length})</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="min-h-[44px] min-w-[44px] rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {modifiedRows.length > 0 && (
              <button
                type="button"
                onClick={handleSaveAllModified}
                disabled={isSaving}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-gradient-to-l from-[#163920] to-[#2D6A3F] text-white font-black text-xs inline-flex items-center gap-2 shadow-sm active:scale-97 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4 text-[#F5D76E]" />
                <span>حفظ التعديلات ({modifiedRows.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* فئات المنتجات بنمط أزرار Pill */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#163920] text-white shadow-2xs'
                  : 'bg-stone-100/80 hover:bg-stone-200/80 text-stone-700'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ جدول الأسعار المريح ═══════ */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-stone-200/80 text-stone-600 font-bold">
                <th className="py-4 px-3 sm:px-4 w-12 text-center">#</th>
                <th className="py-4 px-3 sm:px-4 min-w-[190px] sticky right-0 bg-[#FAFAF9] z-10 shadow-xs">
                  اسم المنتج
                </th>
                <th className="py-4 px-3 sm:px-4 min-w-[170px]">المورد (سوق بنسودة)</th>
                <th className="py-4 px-3 sm:px-4 min-w-[130px]">
                  <span>سعر الشراء</span>
                  <span className="text-[10px] text-stone-400 font-normal block">(د.م / {filteredData[0]?.unit_label || 'kg'})</span>
                </th>
                <th className="py-4 px-3 sm:px-4 min-w-[125px]">
                  <span>هامش الربح</span>
                  <span className="text-[10px] text-stone-400 font-normal block">(نسبة مئوية %)</span>
                </th>
                <th className="py-4 px-3 sm:px-4 min-w-[130px]">
                  <span className="text-emerald-900 font-black">سعر البيع</span>
                  <span className="text-[10px] text-emerald-700 font-normal block">(محسوب تلقائياً)</span>
                </th>
                <th className="py-4 px-3 sm:px-4 min-w-[110px] text-center">مؤشر الاتجاه</th>
                <th className="py-4 px-3 sm:px-4 min-w-[175px] text-center">
                  <span>حالة التوفر والمخزون</span>
                  <span className="text-[10px] text-stone-400 font-normal block">(0 = غير متوفر | 1-5 = محدود)</span>
                </th>
                <th className="py-4 px-3 sm:px-4 w-20 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-stone-500">
                    لم نتمكن من العثور على أي منتج يطابق معايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isRowSaving = savingRowId === row.id;
                  const currentStock = row.stock !== undefined ? row.stock : (row.is_available ? 10 : 0);
                  const isOutOfStock = currentStock === 0 || !row.is_available;
                  const isLimitedStock = currentStock >= 1 && currentStock <= 5;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-amber-50/20 transition-colors ${
                        row.is_modified
                          ? 'bg-amber-50/40 border-r-4 border-r-amber-400 font-bold'
                          : ''
                      }`}
                    >
                      {/* الرقم */}
                      <td className="py-4 px-3 sm:px-4 text-center text-stone-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* اسم المنتج (Sticky Column) */}
                      <td
                        className={`py-4 px-3 sm:px-4 sticky right-0 z-10 transition-colors ${
                          row.is_modified ? 'bg-amber-50/70' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                            {row.icon}
                          </span>
                          <div>
                            <div className="font-bold text-stone-900 text-xs sm:text-sm">{row.name}</div>
                            <span className="text-[10px] text-stone-400 font-normal">
                              {row.unit_label} • {CATEGORY_LABELS[row.category]}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* المورد */}
                      <td className="py-4 px-3 sm:px-4">
                        <select
                          value={row.supplier_id}
                          onChange={(e) => handleCellChange(row.id, 'supplier_id', e.target.value)}
                          className="w-full py-2 px-2.5 rounded-2xl border border-stone-200 bg-white text-stone-800 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[#163920] focus:border-[#163920] truncate transition-all"
                        >
                          {suppliers.map((sup) => (
                            <option key={sup.id} value={sup.id}>
                              {sup.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* سعر الشراء (حقل إدخال Minimal مع Focus Ring أخضر) */}
                      <td className="py-4 px-3 sm:px-4">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={row.purchase_price}
                            onChange={(e) =>
                              handleCellChange(row.id, 'purchase_price', parseFloat(e.target.value) || 0)
                            }
                            className="w-full py-1.5 px-2.5 pr-7 rounded-2xl border border-stone-200 bg-white text-stone-900 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#163920] focus:border-[#163920] tabular-nums transition-all"
                          />
                          <span className="absolute right-2.5 top-2.5 text-[10px] text-stone-400 font-bold pointer-events-none">
                            د.م
                          </span>
                        </div>
                      </td>

                      {/* هامش الربح % */}
                      <td className="py-4 px-3 sm:px-4">
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="150"
                            value={row.margin_percentage}
                            onChange={(e) =>
                              handleCellChange(row.margin_percentage, 'margin_percentage', parseFloat(e.target.value) || 0)
                            }
                            className={`w-full py-1.5 px-2.5 pr-7 rounded-2xl border font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#163920] focus:border-[#163920] tabular-nums text-center transition-all ${
                              row.margin_percentage < 33
                                ? 'border-amber-300 bg-amber-50/60 text-amber-900'
                                : 'border-stone-200 bg-white text-stone-900'
                            }`}
                          />
                          <span className="absolute right-2.5 top-2.5 text-[10px] text-stone-400 font-bold pointer-events-none">
                            %
                          </span>
                        </div>
                        {row.margin_percentage < 33 ? (
                          <button
                            type="button"
                            onClick={() => handleCellChange(row.id, 'margin_percentage', 33)}
                            className="text-[9px] font-black text-amber-800 hover:text-amber-950 underline block mt-1 mx-auto cursor-pointer"
                          >
                            رفع إلى 33% 🛡️
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-800 block mt-1 text-center">
                            هامش آمن ✓
                          </span>
                        )}
                      </td>

                      {/* سعر البيع (محسوب تلقائياً) */}
                      <td className="py-4 px-3 sm:px-4">
                        <div className="py-1.5 px-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-[#163920] font-mono font-black text-xs sm:text-sm text-center tabular-nums shadow-2xs">
                          {row.selling_price.toFixed(2)} د.م
                        </div>
                      </td>

                      {/* مؤشر الاتجاه */}
                      <td className="py-4 px-3 sm:px-4 text-center">
                        {row.trend === 'up' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>ارتفع ({row.yesterday_price} د.م)</span>
                          </span>
                        )}
                        {row.trend === 'down' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <span>انخفض ({row.yesterday_price} د.م)</span>
                          </span>
                        )}
                        {row.trend === 'stable' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                            <Minus className="w-3 h-3 text-stone-400" />
                            <span>مستقر</span>
                          </span>
                        )}
                      </td>

                      {/* ─── زر التوفر: Toggle صغير مع نقطة ملونة + تحكم المخزون ─── */}
                      <td className="py-4 px-3 sm:px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center justify-center gap-2">
                            {/* Toggle Switch العصري مع نقطة ملونة */}
                            <button
                              type="button"
                              onClick={() => handleToggleAvailability(row.id, !isOutOfStock, currentStock)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#163920] focus:ring-offset-1 ${
                                !isOutOfStock ? 'bg-[#163920]' : 'bg-stone-300'
                              }`}
                              title={
                                !isOutOfStock
                                  ? 'المنتج متوفر حالياً • اضغط لتفريغ المخزون وجعله غير متوفر'
                                  : 'المنتج غير متوفر • اضغط لتوفيره في المتجر'
                              }
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  !isOutOfStock ? '-translate-x-5' : 'translate-x-0'
                                } flex items-center justify-center`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    !isOutOfStock ? 'bg-emerald-600' : 'bg-rose-500'
                                  }`}
                                />
                              </span>
                            </button>

                            {/* شارة التوفر الحالية */}
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                isOutOfStock
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : isLimitedStock
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {isOutOfStock ? 'غير متوفر' : isLimitedStock ? `محدود (${currentStock})` : 'متوفر'}
                            </span>
                          </div>

                          {/* حقل ضبط كمية المخزون بدقة (0 = غير متوفر، 1-5 = محدود، >5 = متوفر) */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-stone-400">مخزون:</span>
                            <input
                              type="number"
                              min="0"
                              max="999"
                              value={currentStock}
                              onChange={(e) => handleStockQuantityChange(row.id, e.target.value)}
                              className="w-14 py-0.5 px-1.5 rounded-xl border border-stone-200 text-center font-mono font-bold text-[11px] text-stone-800 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#163920]"
                              title="0: غير متوفر بالمتجر | 1-5: كمية محدودة | أكثر من 5: متوفر"
                            />
                            <span className="text-[10px] text-stone-400">{row.unit_label || 'كجم'}</span>
                          </div>
                        </div>
                      </td>

                      {/* زر الحفظ الفردي */}
                      <td className="py-4 px-3 sm:px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleSaveSingleRow(row)}
                          disabled={isRowSaving}
                          className={`min-h-[38px] min-w-[38px] rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                            row.is_modified
                              ? 'bg-[#163920] hover:bg-[#0E2615] text-[#F5D76E] shadow-2xs active:scale-95'
                              : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                          }`}
                          title={row.is_modified ? 'حفظ تعديل هذا المنتج' : 'السعر محفوظ'}
                        >
                          {isRowSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-[#163920]" />
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
        <div className="p-4 sm:p-5 bg-[#FAFAF9] border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-stone-600 font-bold">
            عرض {filteredData.length} منتجاً من أصل {tableData.length} منتجاً مسجلاً في متجر خُضرة
          </span>
          <div className="flex items-center gap-2 text-stone-500 font-medium text-[11px]">
            <span>معادلة التسعير: <strong>سعر البيع = سعر الشراء × (1 + هامش الربح / 100)</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
