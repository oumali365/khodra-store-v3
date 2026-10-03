// ============================================================
// AdminBottomDashboard.tsx – قسم المدير أسفل الفوتر (بطاقات 2×2)
// تصميم عصري ومدمج يجمع أدوات الإدارة الأربعة في شبكة 2×2
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShoppingBag,
  BarChart3,
  FileText,
  Share2,
  KeyRound,
  LogOut,
  Bell,
  BellOff,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useNewOrdersNotifier } from '../../hooks/useNewOrdersNotifier';
import { clearCachedAdminPin, updateAdminPassword } from '../../services/supabaseService';
import {
  AdminOrdersPanel,
  FinancePanel,
  AdminDocumentsModal,
  AdminSocialPublisherModal,
  ChangePinModal,
  AdminErrorBoundary,
} from './index';

interface AdminBottomDashboardProps {
  isAdmin: boolean;
  onLogout: () => void;
  onChangePinSuccess?: (msg: string) => void;
}

export const AdminBottomDashboard: React.FC<AdminBottomDashboardProps> = ({
  isAdmin,
  onLogout,
}) => {
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [dashboardNotice, setDashboardNotice] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('khodra_notification_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const { totalPending, markAsSeen, refresh: refreshOrders } = useNewOrdersNotifier({
    enabled: isAdmin,
    pollIntervalMs: 45000,
  });

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('khodra_notification_sound', String(next));
      } catch {}
      setDashboardNotice(next ? '🔔 تم تفعيل التنبيهات الصوتية للطلبات' : '🔇 تم كتم التنبيهات الصوتية');
      setTimeout(() => setDashboardNotice(null), 3000);
      return next;
    });
  }, []);

  const handleOpenOrders = () => {
    markAsSeen();
    setIsOrdersOpen(true);
  };

  const handleCloseOrders = () => {
    setIsOrdersOpen(false);
    try {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.pointerEvents = '';
    } catch {}
    try {
      refreshOrders();
    } catch {}
  };

  const handleChangePinSubmit = async (newPin: string) => {
    const res = await updateAdminPassword(newPin);
    if (res.success) {
      setDashboardNotice('✅ تم تحديث الرمز السري للمدير بنجاح');
      setTimeout(() => setDashboardNotice(null), 3500);
      setIsChangePinOpen(false);
      return { success: true };
    }
    return { success: false, message: res.message || 'فشل تحديث الرمز السري' };
  };

  // الاستماع للأحداث الخارجية
  useEffect(() => {
    const handleOpenFinanceEvent = () => setIsFinanceOpen(true);
    const handleOpenOrdersEvent = () => {
      markAsSeen();
      setIsOrdersOpen(true);
    };
    window.addEventListener('khodra_open_finance_panel', handleOpenFinanceEvent);
    window.addEventListener('khodra_open_admin_orders', handleOpenOrdersEvent);
    return () => {
      window.removeEventListener('khodra_open_finance_panel', handleOpenFinanceEvent);
      window.removeEventListener('khodra_open_admin_orders', handleOpenOrdersEvent);
    };
  }, [markAsSeen]);

  if (!isAdmin) return null;

  return (
    <section
      id="admin-dashboard-section"
      className="relative bg-[#09090b] text-white border-t-4 border-[#EAB308] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-hidden select-none"
      dir="rtl"
    >
      {/* إضاءات محيطية ناعمة في الخلفية الداكنة */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#EAB308]/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto space-y-6">

        {/* ═══════ الرأس العلوي لقسم المدير ═══════ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-zinc-800 text-center sm:text-right">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-[#EAB308]/50 flex items-center justify-center shadow-[0_4px_16px_rgba(234,179,8,0.20)] shrink-0">
              <ShieldCheck className="w-7 h-7 text-[#EAB308]" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  لوحة تحكم وإدارة متجر خُضرة
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  مفعّل • En ligne
                </span>
              </div>
            </div>
          </div>

          {/* أزرار سريعة في الشريط */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs active:scale-95 ${
                soundEnabled
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/90'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title={soundEnabled ? 'التنبيهات الصوتية مفعّلة' : 'التنبيهات الصوتية مكتومة'}
            >
              {soundEnabled ? (
                <>
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تنبيهات صوتية</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5 text-zinc-500" />
                  <span>صوت مكتوم</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsChangePinOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-400/50 text-zinc-100 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#F5D76E]" />
              <span>الرمز السري</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* ═══════ إشعار نجاح أو تنبيه للوحة المدير ═══════ */}
        {dashboardNotice && (
          <div className="py-2.5 px-4 rounded-xl bg-gradient-to-l from-emerald-600/90 to-teal-700/90 text-white text-xs sm:text-sm font-black border border-emerald-400/40 shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <span>{dashboardNotice}</span>
            <button
              type="button"
              onClick={() => setDashboardNotice(null)}
              className="text-white/80 hover:text-white cursor-pointer p-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* ═══════ شبكة البطاقات 2×2 (المطلوبة بالتحديد) ═══════ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5">

          {/* ─── البطاقة 1: إدارة الطلبات والتجهيز ─── */}
          <button
            type="button"
            onClick={handleOpenOrders}
            className="group relative bg-gradient-to-br from-[#163920] to-[#0E2615] hover:from-[#1E4D2B] hover:to-[#163920] border-2 border-[#2D6A3F]/50 hover:border-[#EAB308]/70 rounded-2xl p-3.5 sm:p-5 text-right transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(45,106,63,0.35)] active:scale-[0.98] flex flex-col justify-between min-h-[160px] sm:min-h-[175px]"
          >
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#2D6A3F] to-[#1A3D24] border border-[#EAB308]/30 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#EAB308]" strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-1">
                {totalPending > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-[#EA580C] text-white border border-white/30 shadow-md animate-pulse">
                    <span>{totalPending}</span>
                    <span className="hidden xs:inline">جديد</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-white/10 text-emerald-300 border border-white/15">
                    محدّثة
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                  إدارة الطلبات
                </h3>
                <span className="text-[10px] sm:text-[11px] text-stone-400 font-mono">
                  Commandes
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-snug line-clamp-2 sm:line-clamp-none font-medium">
                متابعة الحالات، تجميع مسارات فاس الأربعة، وطباعة بوليصة الشحن الحرارية (Bordereau 80mm).
              </p>
            </div>
          </button>

          {/* ─── البطاقة 2: اللوحة المالية والتوقعات ─── */}
          <button
            type="button"
            onClick={() => setIsFinanceOpen(true)}
            className="group relative bg-gradient-to-br from-[#2a1708] to-[#120a03] hover:from-[#3a200b] hover:to-[#2a1708] border-2 border-amber-600/40 hover:border-[#F5D76E]/70 rounded-2xl p-3.5 sm:p-5 text-right transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(234,88,12,0.25)] active:scale-[0.98] flex flex-col justify-between min-h-[160px] sm:min-h-[175px]"
          >
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#C25E12] border border-[#F5D76E]/30 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5D76E]" strokeWidth={2.5} />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Français
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                  اللوحة المالية
                </h3>
                <span className="text-[10px] sm:text-[11px] text-stone-400 font-mono">
                  Tableau Financier
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-snug line-clamp-2 sm:line-clamp-none font-medium">
                Chiffre d'Affaires, Seuil de rentabilité, Cash-Flow sur 12 mois et export Excel / CSV.
              </p>
            </div>
          </button>

          {/* ─── البطاقة 3: وثائق وعقود المشروع (SARL) ─── */}
          <button
            type="button"
            onClick={() => setIsDocsOpen(true)}
            className="group relative bg-gradient-to-br from-[#122A1A] to-[#0A1A0F] hover:from-[#1A3D24] hover:to-[#122A1A] border-2 border-emerald-600/40 hover:border-[#EAB308]/70 rounded-2xl p-3.5 sm:p-5 text-right transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(16,185,129,0.25)] active:scale-[0.98] flex flex-col justify-between min-h-[160px] sm:min-h-[175px]"
          >
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#1A3D24] to-[#0E2615] border border-[#EAB308]/40 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#EAB308]" strokeWidth={2.5} />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                A4 PDF
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                  وثائق وعقود المشروع
                </h3>
                <span className="text-[10px] sm:text-[11px] text-stone-400 font-mono">
                  Contrats SARL
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-snug line-clamp-2 sm:line-clamp-none font-medium">
                Pitch Deck، دراسة تقنية MVP، ميزانية التمويل (100K)، وعقود السائق والتوريد B2B.
              </p>
            </div>
          </button>

          {/* ─── البطاقة 4: النشر والتسويق الاجتماعي ─── */}
          <button
            type="button"
            onClick={() => setIsSocialOpen(true)}
            className="group relative bg-gradient-to-br from-[#0C2D48] to-[#071E30] hover:from-[#113B5E] hover:to-[#0C2D48] border-2 border-[#0284C7]/40 hover:border-[#F5D76E]/70 rounded-2xl p-3.5 sm:p-5 text-right transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(2,132,199,0.30)] active:scale-[0.98] flex flex-col justify-between min-h-[160px] sm:min-h-[175px]"
          >
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#FEF08A]" strokeWidth={2.5} />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                1-Click
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                  النشر والتسويق
                </h3>
                <span className="text-[10px] sm:text-[11px] text-stone-400 font-mono">
                  Marketing
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-snug line-clamp-2 sm:line-clamp-none font-medium">
                توليد وإرسال عروض اليوم آلياً إلى واتساب، فيسبوك، تليغرام، وإنستغرام بضغطة زر.
              </p>
            </div>
          </button>

        </div>

      </div>

      {/* ═══════ النوافذ المنبثقة المرتبطة بالقسم ═══════ */}
      {isOrdersOpen && (
        <AdminErrorBoundary onClose={handleCloseOrders}>
          <AdminOrdersPanel
            isOpen={isOrdersOpen}
            onClose={handleCloseOrders}
            onOrdersChange={refreshOrders}
          />
        </AdminErrorBoundary>
      )}

      <FinancePanel
        isOpen={isFinanceOpen}
        onClose={() => setIsFinanceOpen(false)}
      />

      <AdminDocumentsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      <AdminSocialPublisherModal
        isOpen={isSocialOpen}
        onClose={() => setIsSocialOpen(false)}
      />

      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        onSubmit={handleChangePinSubmit}
      />
    </section>
  );
};
