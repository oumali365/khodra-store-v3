// ============================================================
// src/features/pricing-forecast/PricingForecastPanel.tsx
// اللوحة المتكاملة للتسعير الديناميكي وإدارة الموردين وتوقع الطلب
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import type { ProductPriceRow, Supplier, TopProductSalesHistory, DemandForecastSummary } from './types';
import {
  getProductPricingRows,
  saveProductPrices,
  getSuppliers,
  saveSupplier,
  deleteSupplier,
  getDemandForecastData,
  getTop10ProductsSalesHistory,
} from './pricingService';
import { MorningPricingTable } from './MorningPricingTable';
import { SupplierModal } from './SupplierModal';
import { DemandForecastView } from './DemandForecastView';

export interface PricingForecastPanelProps {
  standalone?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const PricingForecastPanel: React.FC<PricingForecastPanelProps> = ({
  standalone = true,
  isOpen = true,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'pricing' | 'forecast'>('pricing');
  const [rows, setRows] = useState<ProductPriceRow[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [historyData, setHistoryData] = useState<TopProductSalesHistory[]>([]);
  const [forecastSummary, setForecastSummary] = useState<DemandForecastSummary | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pricingRes, historyRes, forecastRes] = await Promise.all([
        getProductPricingRows(),
        getTop10ProductsSalesHistory(),
        getDemandForecastData(),
      ]);

      setRows(pricingRes.rows);
      setSuppliers(pricingRes.suppliers);
      setHistoryData(historyRes);
      setForecastSummary(forecastRes);
    } catch {
      setNotice('تعذر تحميل أحدث بيانات الأسعار، تم الاعتماد على النسخة المحلية المعتمدة');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // حفظ الأسعار دفعة واحدة
  const handleSaveBatch = async (
    updates: { productId: number; purchasePrice: number; marginPercentage: number; supplierId: string }[]
  ) => {
    setIsSaving(true);
    try {
      const success = await saveProductPrices(updates);
      if (success) {
        setNotice('✅ تم حفظ وتحديث أسعار المنتجات في قاعدة البيانات بنجاح!');
        setTimeout(() => setNotice(null), 3500);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // حفظ مورد
  const handleSaveSupplier = async (supData: Partial<Supplier> & { name: string }) => {
    const saved = await saveSupplier(supData);
    setSuppliers((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    setNotice(`✅ تم حفظ المورد "${saved.name}" بنجاح!`);
    setTimeout(() => setNotice(null), 3000);
  };

  // حذف مورد
  const handleDeleteSupplier = async (id: string) => {
    await deleteSupplier(id);
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setNotice('تم حذف المورد بنجاح');
    setTimeout(() => setNotice(null), 2500);
  };

  if (!isOpen && !standalone) return null;

  return (
    <div className={`space-y-4 sm:space-y-6 text-right ${standalone ? 'p-2 sm:p-4 max-w-7xl mx-auto' : ''}`} dir="rtl">
      {/* ═══════ الترويسة الرئيسية والتبويبات ═══════ */}
      <div className="bg-gradient-to-l from-[#163920] via-[#1E4D2B] to-[#0E2615] rounded-3xl p-5 sm:p-6 text-white border-2 border-emerald-500/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-[#FEF08A] border border-emerald-400/30 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نظام التموين المسبق (Just-In-Time) • سوق بنسودة فاس</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-['Almarai'] text-white">
              التسعير الديناميكي وتوقع الطلب
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-2xl leading-relaxed">
              تعديل أسعار الشراء الصباحية لحظياً، حساب هوامش الربح تلقائياً لأكثر من 120 منتجاً، والتنبؤ باحتياجات التخزين قبل فتح السوق.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#FEF08A]" />
              <span>الموردون ({suppliers.length})</span>
            </button>

            {!standalone && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* شريط التبويبات الرئيسية */}
        <div className="mt-5 pt-4 border-t border-emerald-500/30 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pricing'
                ? 'bg-white text-[#163920] shadow-md'
                : 'bg-black/30 hover:bg-black/50 text-white/90 border border-white/10'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <span>جدول أسعار السوق الصباحي (120+ منتج)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('forecast')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'forecast'
                ? 'bg-white text-[#163920] shadow-md'
                : 'bg-black/30 hover:bg-black/50 text-white/90 border border-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-[#EA580C]" />
            <span>لوحة توقع الطلب والتموين (JIT)</span>
          </button>
        </div>
      </div>

      {/* ═══════ إشعار تنبيهي عام ═══════ */}
      {notice && (
        <div className="p-3 bg-emerald-800 text-white text-xs sm:text-sm font-black rounded-2xl border border-emerald-600 shadow-md flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FEF08A]" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-white/80 hover:text-white cursor-pointer px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ═══════ محتوى التبويبات ═══════ */}
      {isLoading ? (
        <div className="py-16 text-center text-stone-500 bg-white rounded-3xl border border-stone-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
          <p className="font-bold text-xs text-stone-700">جاري جلب أسعار السوق ومؤشرات التوقع...</p>
        </div>
      ) : activeTab === 'pricing' ? (
        <MorningPricingTable
          rows={rows}
          suppliers={suppliers}
          onSaveBatch={handleSaveBatch}
          onOpenSuppliersModal={() => setIsSupplierModalOpen(true)}
          onRefresh={loadData}
          isSaving={isSaving}
        />
      ) : (
        forecastSummary && (
          <DemandForecastView
            historyData={historyData}
            forecastSummary={forecastSummary}
          />
        )
      )}

      {/* نافذة إدارة الموردين */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        suppliers={suppliers}
        onSaveSupplier={handleSaveSupplier}
        onDeleteSupplier={handleDeleteSupplier}
      />
    </div>
  );
};
