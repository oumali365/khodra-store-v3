// ============================================================
// FinancePanel.tsx – اللوحة والمركز المالي لمتجر خُضرة — فاس
// مصدر الحقيقة: بيانات Supabase الحقيقية للطلبات (Real Financial Dashboard)
// مع محاكي مالي منفصل لدراسة الجدوى والتوقعات (Business Plan Simulator)
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchOrders,
  subscribeToOrdersChanges,
  unsubscribeFromOrdersChanges,
  type DbOrder,
} from '../../services/supabaseService';
import { RealFinanceTab } from './RealFinanceTab';
import { ProjectionSimulatorTab } from './ProjectionSimulatorTab';

export interface FinancePanelProps {
  isOpen?: boolean;
  standalone?: boolean;
  onClose?: () => void;
}

export type FinanceLang = 'fr' | 'ar' | 'en';
export type FinanceTabMode = 'real' | 'simulator';

export const FinancePanel: React.FC<FinancePanelProps> = ({
  isOpen = false,
  standalone = false,
  onClose,
}) => {
  const [lang, setLang] = useState<FinanceLang>('ar');
  const [tabMode, setTabMode] = useState<FinanceTabMode>('real'); // 🟢 الافتراضي دائماً هو الأداء الحقيقي
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // ─── مزامنة الطلبات الحقيقية من Supabase في الوقت الفعلي ───
  useEffect(() => {
    let mounted = true;
    setIsSyncing(true);

    fetchOrders()
      .then((data) => {
        if (mounted) {
          setOrders(data || []);
          setIsSyncing(false);
        }
      })
      .catch((err) => {
        console.warn('FinancePanel fetch orders error:', err);
        if (mounted) setIsSyncing(false);
      });

    const channel = subscribeToOrdersChanges(() => {
      fetchOrders().then((data) => {
        if (mounted) setOrders(data || []);
      });
    });

    return () => {
      mounted = false;
      if (channel) unsubscribeFromOrdersChanges(channel);
    };
  }, []);

  // ⚠️ قفل تمرير الصفحة فقط في وضع النافذة المنبثقة وليس في الصفحة المستقلة
  useEffect(() => {
    if (isOpen && !standalone) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen, standalone]);

  useEffect(() => {
    if (!isOpen || standalone) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, standalone, onClose]);

  if (!isOpen && !standalone) return null;

  const panelBody = (
    <div
      lang={lang}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`relative bg-[#FAF8F4] w-full ${
        standalone
          ? 'max-w-7xl mx-auto shadow-md rounded-3xl'
          : 'sm:max-w-6xl shadow-2xl sm:rounded-3xl max-h-screen sm:max-h-[95vh] flex flex-col overflow-hidden'
      } text-right border border-[#E8E1D3]`}
    >
      {/* ═══════ الترويسة الرئيسية ═══════ */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#163920] to-[#0E2615] text-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-md">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-black text-base sm:text-lg flex items-center gap-2">
              <span>{lang === 'ar' ? 'المركز واللوحة المالية' : 'Tableau de Bord Financier'}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {orders.length} {lang === 'ar' ? 'طلب مسجل' : 'commandes'}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-300 font-medium">
              {lang === 'ar'
                ? 'إدارة الأرباح التشغيلية، الإيرادات الحقيقية، ومحاكاة خطة العمل'
                : 'Gestion des flux financiers réels et simulation prévisionnelle'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
          {/* مبدل اللغة */}
          <div className="flex items-center bg-black/30 rounded-xl border border-white/20 p-0.5">
            {(['fr', 'ar', 'en'] as FinanceLang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-2 py-1 text-[10px] font-black rounded-lg transition-colors cursor-pointer ${
                  lang === l ? 'bg-white text-[#163920]' : 'text-white/70 hover:text-white'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {!standalone && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ═══════ أزرار التبديل الصريحة بين الأداء الحقيقي والمحاكي ═══════ */}
      <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setTabMode('real')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              tabMode === 'real'
                ? 'bg-emerald-700 text-white font-black shadow-xs'
                : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{lang === 'ar' ? '🟢 الأداء المالي الحقيقي (Supabase Live)' : '🟢 Données Réelles (Supabase)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setTabMode('simulator')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              tabMode === 'simulator'
                ? 'bg-stone-900 text-white font-black shadow-xs'
                : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? '📊 محاكي دراسة الجدوى (12 شهراً)' : '📊 Simulateur Prévisionnel'}</span>
          </button>
        </div>

        <div className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>{lang === 'ar' ? 'معتمد وفق ميثاق خُضرة المحاسبي' : 'Conforme au modèle Khodra'}</span>
        </div>
      </div>

      {/* ═══════ المحتوى الرئيسي ═══════ */}
      <div className={`${standalone ? 'p-4 sm:p-6' : 'flex-1 overflow-y-auto p-4 sm:p-6'}`}>
        {tabMode === 'real' ? (
          <RealFinanceTab
            orders={orders}
            lang={lang}
            isSyncing={isSyncing}
          />
        ) : (
          <ProjectionSimulatorTab lang={lang} />
        )}
      </div>
    </div>
  );

  if (standalone) {
    return <div className="w-full space-y-4">{panelBody}</div>;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      {panelBody}
    </div>
  );
};

export default FinancePanel;