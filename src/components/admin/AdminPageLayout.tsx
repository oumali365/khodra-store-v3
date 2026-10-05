// ============================================================
// AdminPageLayout.tsx – هيكل وتصميم صفحات الإدارة المخصصة
// يوفر شريط تنقل متطور لوضع الحاسوب وشريط لمس مخصص للهاتف
// مع حماية الرمز السري والانتقال السلس بين أدوات الإدارة الأربعة
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
  Home,
  CheckCircle2,
} from 'lucide-react';
import { useNewOrdersNotifier } from '../../hooks/useNewOrdersNotifier';
import { updateAdminPassword } from '../../services/supabaseService';
import { ChangePinModal } from './AdminReviewModals';

export type AdminRoute = 'orders' | 'finance' | 'documents' | 'marketing';

interface AdminPageLayoutProps {
  currentRoute: AdminRoute;
  isAdmin: boolean;
  onLoginSuccess?: () => void;
  onLogout?: () => void;
  onNavigate: (route: AdminRoute) => void;
  onReturnToStore: () => void;
  onExitToDashboard?: () => void;
  children: React.ReactNode;
}

interface NavItem {
  id: AdminRoute;
  href: string;
  label: string;
  sublabel: string;
  Icon: React.FC<{ className?: string }>;
  accentColor: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'orders',
    href: '/admin/orders',
    label: 'إدارة الطلبات',
    sublabel: 'Commandes',
    Icon: ShoppingBag,
    accentColor: 'text-[#EAB308]',
  },
  {
    id: 'finance',
    href: '/admin/finance',
    label: 'اللوحة المالية',
    sublabel: 'Finance',
    Icon: BarChart3,
    accentColor: 'text-[#EA580C]',
  },
  {
    id: 'marketing',
    href: '/admin/marketing',
    label: 'النشر والتسويق',
    sublabel: 'Marketing',
    Icon: Share2,
    accentColor: 'text-[#0284C7]',
  },
  {
    id: 'documents',
    href: '/admin/documents',
    label: 'وثائق المشروع',
    sublabel: 'Contrats',
    Icon: FileText,
    accentColor: 'text-[#10B981]',
  },
];

export const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
  currentRoute,
  isAdmin,
  onLoginSuccess,
  onLogout,
  onNavigate,
  onReturnToStore,
  onExitToDashboard,
  children,
}) => {
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // الخروج والعودة التلقائية إلى لوحة الإدارة السفلية
  const handleExit = useCallback(() => {
    if (onExitToDashboard) {
      onExitToDashboard();
    } else {
      onReturnToStore();
    }
  }, [onExitToDashboard, onReturnToStore]);

  // ─── حماية زر الرجوع في الهاتف لمنع إغلاق التطبيق والتوجيه تلقائياً للوحة الإدارة السفلية ───
  useEffect(() => {
    window.history.pushState({ page: 'admin_layout' }, '', window.location.pathname);

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      handleExit();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleExit]);

  // حالة الصوت
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('khodra_notification_sound') !== 'false';
    } catch {
      return true;
    }
  });

  // إشعار الطلبات الجديدة
  const { totalPending } = useNewOrdersNotifier({
    enabled: isAdmin,
    pollIntervalMs: 40000,
  });

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('khodra_notification_sound', String(next));
      } catch {}
      setNotice(next ? '🔔 تم تفعيل التنبيهات الصوتية للطلبات' : '🔇 تم كتم التنبيهات الصوتية');
      setTimeout(() => setNotice(null), 3000);
      return next;
    });
  }, []);

  const handleChangePinSubmit = async (newPin: string) => {
    const res = await updateAdminPassword(newPin);
    if (res.success) {
      setNotice('✅ تم تحديث الرمز السري للمدير بنجاح');
      setTimeout(() => setNotice(null), 3500);
      setIsChangePinOpen(false);
      return { success: true };
    }
    return { success: false, message: res.message || 'فشل تحديث الرمز السري' };
  };

  const handleNavClick = (e: React.MouseEvent, route: AdminRoute) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      onNavigate(route);
    }
  };

  const handleReturnClick = (e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      handleExit();
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      handleExit();
    }
  }, [isAdmin, handleExit]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#1A1814] flex flex-col selection:bg-[#EAB308]/30" dir="rtl">
      {/* ══════════════════════════════════════════════════════════
          1. الشريط العلوي الرئيسي (Desktop & Mobile Top Header)
          ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-[#0E1B11] text-white border-b-2 border-[#EAB308]/40 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">

            {/* المنطقة 1: الشعار والاسم وحالة الاتصال ورابط المتجر */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <a
                href="/"
                onClick={handleReturnClick}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-[#EAB308]/50 flex items-center justify-center hover:scale-105 transition-transform shadow-xs"
                title="الرجوع إلى المتجر الرئيسي"
              >
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#EAB308]" />
              </a>

              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-sm sm:text-base text-white tracking-tight font-['Almarai']">
                    خُضرة الإدارة
                  </span>
                  <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    مباشر
                  </span>
                </div>
                <a
                  href="/"
                  onClick={handleReturnClick}
                  className="text-[10px] sm:text-[11px] text-zinc-400 hover:text-[#F5D76E] transition-colors flex items-center gap-1 font-medium"
                >
                  <Home className="w-2.5 h-2.5" />
                  <span>العودة للمتجر</span>
                </a>
              </div>
            </div>

            {/* المنطقة 2: روابط الأدوات الأربعة (ظاهرة في الشاشات المتوسطة والكبيرة) */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = currentRoute === item.id;
                const { Icon } = item;
                const isOrders = item.id === 'orders';

                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.id)}
                    className={`relative px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800 text-white border border-[#EAB308]/60 shadow-sm ring-1 ring-[#EAB308]/20'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? item.accentColor : 'opacity-70'}`} />
                    <span>{item.label}</span>
                    <span className="text-[10px] text-zinc-400 font-mono hidden lg:inline">
                      ({item.sublabel})
                    </span>

                    {/* شارة الطلبات المعلقة */}
                    {isOrders && totalPending > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#EA580C] text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                        {totalPending}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>

            {/* المنطقة 3: أزرار العمليات والإعدادات السريعة */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* زر التنبيه الصوتي */}
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  soundEnabled
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
                title={soundEnabled ? 'التنبيهات الصوتية مفعّلة' : 'التنبيهات الصوتية مكتومة'}
              >
                {soundEnabled ? (
                  <Bell className="w-4 h-4 text-emerald-400" />
                ) : (
                  <BellOff className="w-4 h-4 text-zinc-500" />
                )}
              </button>

              {/* زر تغيير الرمز السري */}
              <button
                type="button"
                onClick={() => setIsChangePinOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                title="تغيير الرمز السري"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#F5D76E]" />
                <span className="hidden lg:inline">الرمز السري</span>
              </button>

              {/* زر العودة للمتجر الرئيسي */}
              <a
                href="/"
                onClick={handleReturnClick}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1A3D24] hover:bg-[#235331] border border-emerald-500/40 text-emerald-200 text-xs font-black transition-all shadow-xs"
              >
                <Home className="w-3.5 h-3.5" />
                <span>المتجر</span>
              </a>

              {/* زر الخروج الأحمر -> توجه تلقائي لـ admin bottom dashboard */}
              <button
                type="button"
                onClick={handleExit}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
                title="الخروج إلى لوحة تحكم المتجر السفلية"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span className="hidden md:inline">خروج</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          2. إشعار عائم في حال وجود تنبيه
          ══════════════════════════════════════════════════════════ */}
      {notice && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 py-2.5 px-5 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-700 text-white text-xs sm:text-sm font-black border border-emerald-400/50 shadow-xl flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#F5D76E]" />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-white/80 hover:text-white cursor-pointer mr-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          3. جسم الصفحة والمحتوى المخصص
          ══════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* ══════════════════════════════════════════════════════════
          4. شريط التنقل السفلي المخصص لشاشات الهواتف (Mobile Bottom Bar)
          ══════════════════════════════════════════════════════════ */}
      <nav
        aria-label="التنقل بين أدوات الإدارة"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E1B11]/95 backdrop-blur-md border-t-2 border-[#EAB308]/40 px-2 py-1.5 shadow-2xl flex items-center justify-around"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = currentRoute === item.id;
          const { Icon } = item;
          const isOrders = item.id === 'orders';

          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[64px] ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-xs font-black'
                  : 'text-zinc-400 hover:text-zinc-200 font-bold'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? item.accentColor : 'opacity-70'}`} />
                {isOrders && totalPending > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#EA580C] text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {totalPending}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 leading-tight">
                {item.label.replace('إدارة ', '').replace('وثائق ', '')}
              </span>
            </a>
          );
        })}
      </nav>

      {/* ══════════════════════════════════════════════════════════
          5. مودال تغيير الرمز السري
          ══════════════════════════════════════════════════════════ */}
      {isChangePinOpen && (
        <ChangePinModal
          isOpen={isChangePinOpen}
          onClose={() => setIsChangePinOpen(false)}
          onSubmit={handleChangePinSubmit}
        />
      )}
    </div>
  );
};
