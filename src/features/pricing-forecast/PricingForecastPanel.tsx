// ============================================================
// src/features/pricing-forecast/PricingForecastPanel.tsx
// اللوحة المتكاملة للتسعير الديناميكي وإدارة الموردين وتوقع الطلب
// تصميم حديث واحترافي لمتجر "خُضرة"
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Building2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  X,
  ChevronLeft,
  Store,
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
import { useBackHandler } from '../../utils/backNavigation';

export interface PricingForecastPanelProps {
  standalone?: boolean;
  isOpen?: boolean;
  targetProductId?: number | null;
  onClose?: () => void;
  onNavigateToInventory?: (productId: number) => void;
}

export const PricingForecastPanel: React.FC<PricingForecastPanelProps> = ({
  standalone = true,
  isOpen = true,
  targetProductId = null,
  onClose,
  onNavigateToInventory,
}) => {
  const [activeTab, setActiveTab] = useState<'pricing' | 'forecast'>('pricing');
  const [currentFocusedProductId, setCurrentFocusedProductId] = useState<number | null>(targetProductId);
  const [rows, setRows] = useState<ProductPriceRow[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [historyData, setHistoryData] = useState<TopProductSalesHistory[]>([]);
  const [forecastSummary, setForecastSummary] = useState<DemandForecastSummary | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // 🛡️ معالجة زر الرجوع في الهاتف لإغلاق نافذة الموردين
  useBackHandler('pricing-supplier-modal', isSupplierModalOpen, () => setIsSupplierModalOpen(false), 25);

  useEffect(() => {
    if (targetProductId != null) {
      setCurrentFocusedProductId(targetProductId);
      setActiveTab('pricing');
    }
  }, [targetProductId]);

  useEffect(() => {
    const handleOpenPricing = (e: any) => {
      const pid = e?.detail?.productId;
      if (pid != null) {
        setCurrentFocusedProductId(Number(pid));
        setActiveTab('pricing');
      }
    };
    window.addEventListener('khodra_open_pricing_for_product', handleOpenPricing);
    return () => window.removeEventListener('khodra_open_pricing_for_product', handleOpenPricing);
  }, []);

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
        setNotice('تم حفظ وتحديث أسعار المنتجات في قاعدة البيانات بنجاح!');
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
    setNotice(`تم حفظ بيانات المورد "${saved.name}" بنجاح!`);
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
    <div
      className={`space-y-4 sm:space-y-6 text-right font-['Tajawal'] antialiased bg-[#FAFAF9] rounded-3xl ${
        standalone ? 'p-3 sm:p-6 max-w-7xl mx-auto' : 'p-2 sm:p-4'
      }`}
      dir="rtl"
    >
      {/* ═══════ الترويسة الأنيقة المتدرجة ═══════ */}
      <header className="relative overflow-hidden bg-gradient-to-l from-[#163920] via-[#1A4527] to-[#122F1B] rounded-3xl p-5 sm:p-7 text-white shadow-2xs border border-emerald-900/40">
        {/* توهج هادئ خفيف في الخلفية */}
        <div
          className="absolute -top-16 -left-16 w-64 h-64 bg-[#F5D76E]/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* اليمين: الشعار وهوية متجر خُضرة */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🥬
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5D76E]/20 text-[#F5D76E] border border-[#F5D76E]/30 text-[11px] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>نموذج التموين المسبق (JIT) • فاس</span>
              </div>
              <h2 className="text-xs text-emerald-200/80 font-medium mt-0.5">
                سوق الجملة بنسودة ومزارع سايس
              </h2>
            </div>
          </div>

          {/* الوسط: العنوان والوصف الإرشادي */}
          <div className="text-center md:text-center flex-1 max-w-xl mx-auto space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-['Almarai'] text-white tracking-tight">
              التسعير الديناميكي وتوقع الطلب
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/85 font-medium leading-relaxed">
              تحديد أسعار الشراء الصباحية، حساب هوامش الأمان تلقائياً، والتحكم الذكي في التوفر والمخزون
            </p>
          </div>

          {/* اليسار: أزرار التحكم والإجراءات */}
          <div className="flex items-center justify-end gap-2.5 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(true)}
              className="min-h-[44px] px-4 py-2 rounded-2xl bg-white/12 hover:bg-white/20 border border-white/25 text-white font-bold text-xs inline-flex items-center gap-2 transition-all shadow-2xs hover:shadow-xs active:scale-97 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#F5D76E]" />
              <span>الموردون ({suppliers.length})</span>
            </button>

            {!standalone && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white cursor-pointer transition-all active:scale-95"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ═══════ التبويبات بنمط أزرار Pill مع مؤشر سفلي أنيق ═══════ */}
        <div className="mt-5 pt-3.5 border-t border-white/15 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="inline-flex p-1 rounded-2xl bg-black/25 backdrop-blur-xs border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`min-h-[38px] px-3.5 sm:px-5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer relative whitespace-nowrap ${
                activeTab === 'pricing'
                  ? 'bg-white text-[#163920] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign className={`w-4 h-4 ${activeTab === 'pricing' ? 'text-[#163920]' : 'text-emerald-300'}`} />
              <span>جدول أسعار السوق</span>
              {activeTab === 'pricing' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#163920] inline-block mr-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('forecast')}
              className={`min-h-[38px] px-3.5 sm:px-5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer relative whitespace-nowrap ${
                activeTab === 'forecast'
                  ? 'bg-white text-[#163920] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className={`w-4 h-4 ${activeTab === 'forecast' ? 'text-[#163920]' : 'text-[#F5D76E]'}`} />
              <span>توقع الطلب والتموين</span>
              {activeTab === 'forecast' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#163920] inline-block mr-0.5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════ شريط توضيح المسؤوليات والربط المباشر بالمخزون ═══════ */}
      <div className="bg-purple-900/5 border border-purple-200/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 text-purple-950 font-medium">
          <Sparkles className="w-5 h-5 text-purple-700 shrink-0" />
          <span>
            <strong className="font-black text-purple-900">الطبقة التحليلية الذكية:</strong> تقرأ بيانات الأصناف والمخزون لحظياً من المصدر الأساسي (إدارة المنتجات والمخزون)، وتقدم توصيات التسعير وتوقع الطلب وكميات التموين JIT دون تكرار للبيانات.
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onNavigateToInventory) {
              onNavigateToInventory(0);
            } else {
              window.dispatchEvent(new CustomEvent('khodra_admin_route_changed', { detail: 'inventory' }));
            }
          }}
          className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <span>📦 إدارة المنتجات والمخزون (المصدر الأساسي)</span>
        </button>
      </div>

      {/* ═══════ إشعار تنبيهي لطيف عند نجاح الإجراءات ═══════ */}
      {notice && (
        <div className="p-3.5 bg-emerald-50 text-[#163920] text-xs sm:text-sm font-bold rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ═══════ محتوى التبويب النشط ═══════ */}
      {isLoading ? (
        <div className="py-20 text-center text-stone-500 bg-white rounded-3xl border border-stone-200/80 shadow-2xs">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-[#163920] mb-3" />
          <p className="font-bold text-sm text-stone-800">جاري جلب أسعار السوق ومؤشرات التوقع وسجلات المخزون...</p>
          <span className="text-xs text-stone-400 mt-1 block">يرجى الانتظار بضع لحظات</span>
        </div>
      ) : activeTab === 'pricing' ? (
        <MorningPricingTable
          rows={rows}
          suppliers={suppliers}
          targetProductId={currentFocusedProductId}
          onSaveBatch={handleSaveBatch}
          onOpenSuppliersModal={() => setIsSupplierModalOpen(true)}
          onRefresh={loadData}
          onNavigateToInventory={onNavigateToInventory}
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

      {/* ═══════ نافذة إدارة الموردين العصرية ═══════ */}
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
