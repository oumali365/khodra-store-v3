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
  Bike,
  DollarSign,
  Package,
} from 'lucide-react';
import { useNewOrdersNotifier } from '../../../hooks/useNewOrdersNotifier';
import { clearCachedAdminPin, updateAdminPassword, fetchProducts } from '../../../services/supabaseService';
import { ChangePinModal } from '../modals/AdminReviewModals';
import { AdminErrorBoundary } from './AdminErrorBoundary';
import { AdminNotificationToast } from './AdminNotificationToast';
import { playOrderAlertSound } from '../../../utils/audioAlert';

export type AdminRoute = 'orders' | 'inventory' | 'marketing' | 'fleet' | 'finance' | 'documents' | 'pricing';

interface AdminBottomDashboardProps {
  isAdmin: boolean;
  onLogout: () => void;
  onNavigateAdmin?: (route: AdminRoute) => void;
  onChangePinSuccess?: (msg: string) => void;
}

export const AdminBottomDashboard: React.FC<AdminBottomDashboardProps> = ({
  isAdmin,
  onLogout,
  onNavigateAdmin,
}) => {
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [dashboardNotice, setDashboardNotice] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('khodra_notification_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const { totalPending, newCount, markAsSeen, refresh: refreshOrders } = useNewOrdersNotifier({
    enabled: isAdmin,
    pollIntervalMs: 30000,
  });

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('khodra_notification_sound', String(next));
      } catch {}
      if (next) {
        playOrderAlertSound(true);
      }
      setDashboardNotice(next ? '🔔 تم تفعيل التنبيهات الصوتية' : '🔇 تم كتم التنبيهات الصوتية');
      setTimeout(() => setDashboardNotice(null), 3000);
      return next;
    });
  }, []);

  const handleNavigate = (e: React.MouseEvent, route: AdminRoute) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      if (route === 'orders') markAsSeen();
      if (onNavigateAdmin) {
        onNavigateAdmin(route);
      } else {
        window.history.pushState({ admin: route }, '', `/admin/${route}`);
        window.dispatchEvent(new CustomEvent('khodra_admin_route_changed', { detail: route }));
      }
    }
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
                    إدارة المتجر 
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    En ligne
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

        {/* ═══════ شبكة بطاقات أدوات الإدارة بروابط HTML مخصصة ═══════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">

          {/* ─── البطاقة 1: إدارة الطلبات والتجهيز ─── */}
          <a
            href="/admin/orders"
            onClick={(e) => handleNavigate(e, 'orders')}
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
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-snug font-medium">
                متابعة وتجهيز الطلبات، وطباعة بوليصة الشحن (Bordereau 80mm).
              </p>
            </div>
          </a>

          {/* ─── البطاقة 2: المنتجات والمخزون الحي ─── */}
          <a
            href="/admin/inventory"
            onClick={(e) => handleNavigate(e, 'inventory')}
            className="group relative bg-gradient-to-br from-[#1b3d22] to-[#0d2113] hover:from-[#23502c] hover:to-[#1b3d22] border-2 border-emerald-600/50 hover:border-[#F5D76E]/70 rounded-2xl p-3.5 sm:p-5 text-right transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(16,185,129,0.3)] active:scale-[0.98] flex flex-col justify-between min-h-[160px] sm:min-h-[175px]"
          >
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-700 to-green-800 border border-[#F5D76E]/40 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5D76E]" strokeWidth={2.5} />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                مخزون حي
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                  المنتجات والمخزون
                </h3>
                <span className="text-[10px] sm:text-[11px] text-stone-400 font-mono">
                  Stock
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-snug font-medium">
                تحديث الكميات اللحظي، إضافة السلع، وحظر الترويج عند النفاد.
              </p>
            </div>
          </a>

          {/* ─── البطاقة 3: مسارات التوصيل والفريق (مستقلة) ─── */}
          <a
            href="/admin/fleet"
            onClick={(e) => handleNavigate(e, 'fleet')}
            className="group relative bg-gradient-to-br from-[#122A26] to-[#091715] hover:from-[#183832] hover:to-[#122A26] border-2 border-teal-600/50 hover:border-[#F5D76E]/70 rounded-2xl p-3.5 sm:p-5 text-right transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(20,184,166,0.3)] active:scale-[0.98] flex flex-col justify-between min-h-[160px] sm:min-h-[175px]"
          >
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 border border-[#F5D76E]/40 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Bike className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5D76E]" strokeWidth={2.5} />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                4 مناطق
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                  مسارات التوصيل والفريق
                </h3>
                <span className="text-[10px] sm:text-[11px] text-stone-400 font-mono">
                  Flotte
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-snug font-medium">
                جولات التوصيل، سائقو الفريق، وكباتن التطبيقات السريعة بفاس.
              </p>
            </div>
          </a>

          {/* ─── البطاقة 2: اللوحة المالية والتوقعات ─── */}
          <a
            href="/admin/finance"
            onClick={(e) => handleNavigate(e, 'finance')}
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
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-snug font-medium">
                CA, Seuil de rentabilité et prévisions de trésorerie sur 12 mois.
              </p>
            </div>
          </a>

          {/* ─── البطاقة 3: وثائق وعقود المشروع (SARL) ─── */}
          <a
            href="/admin/documents"
            onClick={(e) => handleNavigate(e, 'documents')}
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
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-snug font-medium">
                ملف التمويل، Pitch Deck، وعقود السائق والتوريد والشراكة.
              </p>
            </div>
          </a>

          {/* ─── البطاقة 5: النشر والتسويق الاجتماعي ─── */}
          <a
            href="/admin/marketing"
            onClick={(e) => handleNavigate(e, 'marketing')}
            className="group relative bg-gradient-to-br from-[#0C2D48] to-[#071E30] hover:from-[#113B5E] hover:to-[#0C2D48] border-2 border-[#0284C7]/40 hover:border-[#F5D76E]/70 rounded-2xl p-3.5 sm:p-5 text-right transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(2,132,199,0.30)] active:scale-[0.98] flex flex-col justify-between min-h-[160px] sm:min-h-[175px]"
          >
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#FEF08A]" strokeWidth={2.5} />
              </div>
              <span dir="ltr" className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
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
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-snug font-medium">
                توليد وإرسال عروض اليوم آلياً إلى واتساب وشبكات التواصل.
              </p>
            </div>
          </a>

          {/* ─── البطاقة 6: التسعير الديناميكي وتوقع الطلب (JIT) ─── */}
          <a
            href="/admin/pricing"
            onClick={(e) => handleNavigate(e, 'pricing')}
            className="group relative bg-gradient-to-br from-[#1C3A27] to-[#0A1A0F] hover:from-[#244C33] hover:to-[#1C3A27] border-2 border-emerald-500/40 hover:border-[#FEF08A]/70 rounded-2xl p-3.5 sm:p-5 text-right transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(16,185,129,0.30)] active:scale-[0.98] flex flex-col justify-between min-h-[160px] sm:min-h-[175px]"
          >
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 border border-[#FEF08A]/30 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#FEF08A]" strokeWidth={2.5} />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                120+ منتج
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                  التسعير وتوقع الطلب
                </h3>
                <span className="text-[10px] sm:text-[11px] text-stone-400 font-mono">
                  Tarification JIT
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-snug font-medium">
                أسعار سوق بنسودة اليومية، هوامش الربح، وتوقعات الشراء الذكية.
              </p>
            </div>
          </a>

        </div>

      </div>

      {/* ═══════ نافذة تغيير الرمز السري ═══════ */}
      {isChangePinOpen && (
        <ChangePinModal
          isOpen={isChangePinOpen}
          onClose={() => setIsChangePinOpen(false)}
          onSubmit={handleChangePinSubmit}
        />
      )}

      {/* ═══════ إشعار طافٍ للطلبات الجديدة ═══════ */}
      <AdminNotificationToast
        newCount={newCount}
        onOpenOrders={() => {
          markAsSeen();
          if (onNavigateAdmin) {
            onNavigateAdmin('orders');
          } else {
            window.history.pushState({ admin: 'orders' }, '', '/admin/orders');
            window.dispatchEvent(new CustomEvent('khodra_admin_route_changed', { detail: 'orders' }));
          }
        }}
        onDismiss={() => {
          markAsSeen();
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
    </section>
  );
};
