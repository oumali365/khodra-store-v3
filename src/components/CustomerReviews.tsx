// ============================================================
// CustomerReviews.tsx – الإصدار 4.3
// هوية خضرة الموحّدة + الحفاظ الكامل على الوظائف الإدارية
// ============================================================
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Star,
  MapPin,
  MessageSquarePlus,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  ShieldCheck,
  KeyRound,
  ShoppingBag,
  Quote,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { STORE_CONFIG } from '../data/config';
import {
  fetchReviews,
  submitCustomerReview,
  deleteCustomerReview,
  getSupabase,
  getAdminPin,
  setCachedAdminPin,
  syncAdminPinFromRemote,
  updateAdminPinRemote,
} from '../services/supabaseService';
import { useNewOrdersNotifier } from '../hooks/useNewOrdersNotifier';
import {
  INITIAL_THREE_REVIEWS,
  type CustomerReview,
} from '../data/initialReviews';
import { AddReviewModal } from './AddReviewModal';
import {
  AdminNotificationToast,
  PinModal,
  ChangePinModal,
  DeleteReviewModal,
  AdminErrorBoundary,
  FinancePanel,
} from './admin';

export type { CustomerReview };

const AdminOrdersPanel = React.lazy(() =>
  import('./admin/AdminOrdersPanel').then((module) => ({ default: module.AdminOrdersPanel }))
);

const INITIAL_VISIBLE_COUNT = 3;
const FOCUS_PULSE_MS = 700;

// ═══════ زر Ripple ═══════
const RippleButton: React.FC<{
  onClick?: () => void;
  className: string;
  children: React.ReactNode;
  rippleColor?: string;
  ariaLabel?: string;
}> = ({ onClick, className, children, rippleColor = 'rgba(255,255,255,0.30)', ariaLabel }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'rev-ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.background = rippleColor;
      btn.appendChild(ripple);

      window.setTimeout(() => ripple.remove(), 650);
    }
    onClick?.();
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </button>
  );
};

interface CustomerReviewsProps {
  onOpenOrdersPanel?: () => void;
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ onOpenOrdersPanel }) => {
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_THREE_REVIEWS);

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── Admin mode ───
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('khodra_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [deleteConfirmReview, setDeleteConfirmReview] = useState<CustomerReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  const [isOrdersPanelOpen, setIsOrdersPanelOpen] = useState(false);
  const [isFinancePanelOpen, setIsFinancePanelOpen] = useState(false);

  // ─── التمرير الأفقي ───
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [pulsingIndex, setPulsingIndex] = useState<number | null>(null);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);
  const reviewsScrollRaf = useRef<number | null>(null);
  const pulseTimer = useRef<number | null>(null);

  const handleReviewsScroll = () => {
    if (reviewsScrollRaf.current) cancelAnimationFrame(reviewsScrollRaf.current);
    reviewsScrollRaf.current = requestAnimationFrame(() => {
      if (!reviewsScrollRef.current) return;
      const container = reviewsScrollRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const cards = container.querySelectorAll('article');
      let closestIdx = 0;
      let minDiff = Infinity;

      cards.forEach((card, idx) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const diff = Math.abs(cardCenter - containerCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      setActiveReviewIndex((prev) => {
        if (prev !== closestIdx) {
          setPulsingIndex(closestIdx);
          if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
          pulseTimer.current = window.setTimeout(() => setPulsingIndex(null), FOCUS_PULSE_MS);
          return closestIdx;
        }
        return prev;
      });
    });
  };

  useEffect(() => {
    return () => {
      if (reviewsScrollRaf.current) cancelAnimationFrame(reviewsScrollRaf.current);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    };
  }, []);

  const scrollToReview = (index: number) => {
    if (!reviewsScrollRef.current) return;
    const cards = reviewsScrollRef.current.querySelectorAll('article');
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      setActiveReviewIndex(index);
    }
  };

  // ─── 🔔 الإشعارات الصوتية ───
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('khodra_notification_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const {
    newCount,
    totalPending,
    markAsSeen,
    refresh: refreshOrders,
  } = useNewOrdersNotifier({
    enabled: isAdmin,
    pollIntervalMs: 45000,
  });

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('khodra_notification_sound', String(next));
      } catch {}
      setAdminNotification(next ? '🔔 تم تفعيل التنبيهات الصوتية' : '🔇 تم كتم التنبيهات الصوتية');
      setTimeout(() => setAdminNotification(null), 2500);
      return next;
    });
  }, []);

  const handleOpenOrders = useCallback(() => {
    markAsSeen();
    if (onOpenOrdersPanel) {
      onOpenOrdersPanel();
    } else {
      setIsOrdersPanelOpen(true);
      window.dispatchEvent(new CustomEvent('khodra_open_admin_orders'));
    }
  }, [markAsSeen, onOpenOrdersPanel]);

  const handleCloseOrdersPanel = useCallback(() => {
    setIsOrdersPanelOpen(false);
    try {
      refreshOrders();
    } catch {}
  }, [refreshOrders]);

  const handleOpenFinance = useCallback(() => {
    setIsFinancePanelOpen(true);
  }, []);

  const handleCloseFinance = useCallback(() => {
    setIsFinancePanelOpen(false);
  }, []);

  useEffect(() => {
    const handleUpdated = () => {
      try {
        refreshOrders();
      } catch {}
    };
    const handleOpenFinanceEvent = () => setIsFinancePanelOpen(true);
    window.addEventListener('khodra_orders_updated', handleUpdated);
    window.addEventListener('khodra_open_finance_panel', handleOpenFinanceEvent);
    return () => {
      window.removeEventListener('khodra_orders_updated', handleUpdated);
      window.removeEventListener('khodra_open_finance_panel', handleOpenFinanceEvent);
    };
  }, [refreshOrders]);

  // ─── ✅ جلب التقييمات ───
  useEffect(() => {
    let isMounted = true;
    async function loadSupabaseReviews() {
      try {
        const dbReviews = await fetchReviews();

        if (isMounted && dbReviews && dbReviews.length > 0) {
          const formatted: CustomerReview[] = dbReviews.map((r) => ({
            id: r.id,
            author: r.author,
            neighborhood: r.neighborhood,
            rating: r.rating,
            date: r.date || 'مؤخراً',
            comment: r.comment,
            verified: r.verified,
          }));

          const merged = [
            ...formatted,
            ...INITIAL_THREE_REVIEWS.filter(
              (init) =>
                !formatted.some((f) => f.id === init.id || f.author === init.author)
            ),
          ];
          setReviews(merged);
        }
      } catch (e) {
        console.warn('Could not load reviews from Supabase:', e);
      }
    }

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => {
        loadSupabaseReviews();
      }, { timeout: 2000 });
      return () => {
        isMounted = false;
        (window as any).cancelIdleCallback(handle);
      };
    } else {
      const timer = setTimeout(() => {
        loadSupabaseReviews();
      }, 500);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, []);

  const displayedReviews = useMemo(() => {
    if (showAllReviews) return reviews;
    return reviews.slice(0, INITIAL_VISIBLE_COUNT);
  }, [reviews, showAllReviews]);

  const handleReviewSubmit = async (newRev: {
    author: string;
    neighborhood: string;
    rating: number;
    comment: string;
  }) => {
    const result = await submitCustomerReview({
      ...newRev,
      category: 'general',
      verified: true,
    });

    if (!result.success || !result.data) {
      setAdminNotification('❌ فشل حفظ التقييم، حاول مرة أخرى');
      setTimeout(() => setAdminNotification(null), 3500);
      throw new Error('Submit failed');
    }

    const newReviewItem: CustomerReview = {
      id: result.data.id,
      author: result.data.author,
      neighborhood: result.data.neighborhood,
      rating: result.data.rating,
      date: 'الآن',
      comment: result.data.comment,
      verified: true,
    };

    setReviews((prev) => [newReviewItem, ...prev]);
  };

  useEffect(() => {
    const handleTrigger = () => {
      if (isAdmin) {
        const el = document.getElementById('customer-reviews-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setIsPinModalOpen(true);
      }
    };

    window.addEventListener('khodra_trigger_admin_modal', handleTrigger);
    return () => {
      window.removeEventListener('khodra_trigger_admin_modal', handleTrigger);
    };
  }, [isAdmin]);

  const handlePinLogin = async (pin: string): Promise<boolean> => {
    let correctPin = getAdminPin();
    const inputPin = pin.trim();

    if (inputPin !== correctPin.trim()) {
      const remotePin = await syncAdminPinFromRemote();
      if (remotePin) {
        correctPin = remotePin;
      }
    }

    if (inputPin === correctPin.trim()) {
      setCachedAdminPin(inputPin);
      setIsAdmin(true);
      try {
        sessionStorage.setItem('khodra_admin_auth', 'true');
      } catch {}
      setAdminNotification('مرحباً بك! تم تفعيل وضع المدير مع التنبيهات الصوتية.');
      setTimeout(() => setAdminNotification(null), 4000);

      setTimeout(() => {
        const el = document.getElementById('customer-reviews-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      return true;
    }
    return false;
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    try {
      sessionStorage.removeItem('khodra_admin_auth');
    } catch {}
    setAdminNotification('تم تسجيل الخروج من وضع المدير.');
    setTimeout(() => setAdminNotification(null), 3000);
  };

  const handleChangePin = async (newPin: string): Promise<boolean> => {
    try {
      const res = await updateAdminPinRemote(newPin);
      if (res.success) {
        setAdminNotification('✅ تم تحديث الرمز السري ومزامنته بنجاح.');
        setTimeout(() => setAdminNotification(null), 4000);
        return true;
      } else {
        setAdminNotification(`❌ فشل التحديث: ${res.message || 'خطأ غير معروف'}`);
        setTimeout(() => setAdminNotification(null), 4000);
        return false;
      }
    } catch (err: any) {
      console.error('❌ خطأ في تحديث PIN:', err);
      setAdminNotification(`❌ خطأ: ${err?.message || 'غير معروف'}`);
      setTimeout(() => setAdminNotification(null), 4000);
      return false;
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmReview) return;
    setIsDeleting(true);

    try {
      const res = await deleteCustomerReview(deleteConfirmReview.id);

      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== deleteConfirmReview.id));
        setAdminNotification(`✅ ${res.message || 'تم حذف التعليق على جميع الأجهزة'}`);
      } else {
        setAdminNotification(`❌ فشل الحذف: ${res.message || 'خطأ غير معروف'}`);
      }
    } catch (err) {
      console.warn('Error deleting review:', err);
      setAdminNotification('❌ حدث خطأ أثناء الحذف');
    } finally {
      setTimeout(() => setAdminNotification(null), 3500);
      setIsDeleting(false);
      setDeleteConfirmReview(null);
    }
  };

  return (
    <>
      <section
        className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-10 sm:my-16"
        id="customer-reviews-section"
        aria-label="آراء وتقييمات زبناء متجر خضرة"
      >
        {/* ═══════ الأنماط الحركية ═══════ */}
        <style>{`
          @keyframes revRippleExpand {
            0%   { transform: scale(0); opacity: 0.55; }
            100% { transform: scale(2.6); opacity: 0; }
          }
          .rev-ripple {
            position: absolute;
            border-radius: 9999px;
            pointer-events: none;
            transform: scale(0);
            animation: revRippleExpand 0.65s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform, opacity;
          }

          @keyframes revFadeInRight {
            0%   { opacity: 0; transform: translateX(40px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          .rev-fade-in-right {
            animation: revFadeInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
            will-change: opacity, transform;
          }

          @keyframes revFocusPulse {
            0%   { opacity: 0.5; }
            100% { opacity: 0; }
          }
          .rev-focus-pulse {
            animation: revFocusPulse ${FOCUS_PULSE_MS}ms cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* ✅ Spacer ذكي للجوال */
          .rev-spacer {
            flex-shrink: 0;
            width: calc(50% - 33vw - 0.5rem);
          }
          @media (min-width: 640px) {
            .rev-spacer {
              width: calc(50% - 122px - 0.75rem);
            }
          }
          @media (min-width: 768px) {
            .rev-spacer { display: none; }
          }

          @media (prefers-reduced-motion: reduce) {
            .rev-ripple,
            .rev-fade-in-right,
            .rev-focus-pulse { animation: none; }
          }
        `}</style>

        {/* ════════ إشعار إداري ════════ */}
        {adminNotification && (
          <div className="mb-5 max-w-2xl mx-auto py-3 px-4 rounded-2xl bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] text-white text-xs sm:text-sm font-black shadow-[0_4px_14px_rgba(45,106,63,0.30)] flex items-center justify-between gap-3 animate-in fade-in duration-200 text-right border-2 border-[#EAB308]/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#EAB308] shrink-0" strokeWidth={2.5} />
              <span>{adminNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminNotification(null)}
              className="text-white/80 hover:text-white cursor-pointer p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* ════════ شريط المدير ════════ */}
        {isAdmin && (
          <div className="mb-6 max-w-2xl mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-[#FEF3C7]/70 via-[#FED7AA]/70 to-[#FEF3C7]/70 border-2 border-[#EAB308]/40 text-[#1A3D24] flex flex-wrap items-center justify-between gap-2.5 text-xs font-black text-right shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#2D6A3F] flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#EAB308]" strokeWidth={2.5} />
              </div>
              <span>
                <strong>وضع المدير مفعّل:</strong> إدارة الطلبات + التنبيهات
              </span>
            </div>
            <div className="flex items-center gap-2 mr-auto flex-wrap">
              {/* زر إدارة الطلبات */}
              <RippleButton
                onClick={handleOpenOrders}
                rippleColor="rgba(255,255,255,0.30)"
                className="relative px-3.5 py-2 rounded-xl bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] hover:from-[#3A8152] hover:to-[#2D6A3F] text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_4px_14px_rgba(45,106,63,0.30)] active:scale-95 border border-[#EAB308]/25"
              >
                <ShoppingBag className="w-4 h-4 text-[#EAB308] relative z-10" strokeWidth={2.5} />
                <span className="relative z-10">إدارة الطلبات</span>
                {totalPending > 0 && (
                  <span className="relative z-10 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#EA580C] text-white text-[10px] font-black border-2 border-white shadow-md animate-pulse">
                    {totalPending > 99 ? '99+' : totalPending}
                  </span>
                )}
              </RippleButton>

              {/* زر اللوحة المالية */}
              <RippleButton
                onClick={handleOpenFinance}
                rippleColor="rgba(255,255,255,0.30)"
                className="relative px-3.5 py-2 rounded-xl bg-gradient-to-l from-[#EA580C] to-[#C25E12] hover:from-[#F97316] hover:to-[#EA580C] text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_4px_14px_rgba(234,88,12,0.30)] active:scale-95 border border-[#EAB308]/25"
              >
                <BarChart3 className="w-4 h-4 text-[#EAB308] relative z-10" strokeWidth={2.5} />
                <span className="relative z-10">اللوحة المالية</span>
              </RippleButton>

              {/* زر تغيير PIN */}
              <button
                type="button"
                onClick={() => setIsChangePinModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-white border-2 border-[#EAB308]/50 hover:bg-[#FEF3C7] text-[#1A3D24] text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#2D6A3F]" strokeWidth={2.5} />
                <span>الرمز السري</span>
              </button>

              {/* زر الخروج */}
              <button
                type="button"
                onClick={handleLogoutAdmin}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-200 text-xs font-black transition-colors cursor-pointer active:scale-95"
              >
                خروج
              </button>
            </div>
          </div>
        )}

        {/* ════════ 1. بطاقة العنوان ════════ */}
        <div className="relative bg-gradient-to-b from-[#FAF8F3] to-[#F5EFE3] border border-[#2D6A3F]/12 rounded-[24px] sm:rounded-3xl shadow-[0_2px_10px_rgba(45,106,63,0.06)] p-6 sm:p-8 text-center max-w-md sm:max-w-xl mx-auto mb-8 sm:mb-10 overflow-hidden">
          {/* دوائر ضوئية */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#EAB308]/12 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#2D6A3F]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            {/* شارة ذهبية */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FACC15] to-[#EAB308] border border-[#EAB308]/50 text-[#1A3D24] font-black text-xs sm:text-sm mb-4 shadow-[0_3px_12px_rgba(234,179,8,0.30)]">
              <Sparkles className="w-4 h-4" strokeWidth={2.5} />
              <span>آراء وتجارب حقيقية</span>
              <Quote className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A3D24] tracking-tight mb-3 flex items-center justify-center gap-2 flex-wrap">
              آراء زبنائنا بمدينة فاس
              <span className="inline-block w-2 h-2 rounded-full bg-[#EAB308]" />
            </h2>

            <p className="text-xs sm:text-sm text-[#5A6B5F] font-bold leading-relaxed mb-5">
              تجارب حية لعائلات تثق بخدمة وجودة متجر خُضرة يومياً
            </p>

            {/* ملخص التقييم */}
            <div className="inline-flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-2.5 rounded-full border border-[#2D6A3F]/20 shadow-sm text-xs font-black text-[#1A3D24] select-none">
              <span className="font-black text-[#EA580C] text-lg tabular-nums">4.9</span>
              <div className="flex text-amber-400 text-sm gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[11px] text-[#5A6B5F] font-bold border-r border-[#2D6A3F]/15 pr-3 mr-1">
                {reviews.length}+ تقييم معتمد
              </span>
            </div>

            <div className="flex md:hidden items-center justify-center gap-2 mt-5 pt-4 border-t border-[#2D6A3F]/10">
              <span className="text-[11px] font-black text-[#1A3D24]">اسحب أفقياً لقراءة المزيد</span>
              <span className="text-xs text-[#2D6A3F]">←</span>
            </div>
          </div>
        </div>

        {/* ════════ 2. بطاقات التقييمات ════════ */}
        <div className="relative max-w-5xl mx-auto py-2 mb-8 sm:mb-10">
          <div
            ref={reviewsScrollRef}
            onScroll={handleReviewsScroll}
            className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 text-center overflow-x-auto md:overflow-x-visible py-5 snap-x snap-mandatory md:snap-none overscroll-x-contain no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {/* Spacer أيسر (جوال) */}
            <div className="rev-spacer md:hidden" aria-hidden="true" />

            {displayedReviews.map((rev, idx) => {
              const isActive = idx === activeReviewIndex;
              const isPulsing = pulsingIndex === idx;

              return (
                <article
                  key={rev.id}
                  onClick={() => scrollToReview(idx)}
                  style={{ animationDelay: `${idx * 90}ms` }}
                  className={`rev-fade-in-right group relative w-[66vw] min-w-[210px] max-w-[245px] md:w-full md:max-w-none shrink-0 snap-center bg-white rounded-3xl border-2 transition-all duration-300 px-5 py-7 text-center flex flex-col items-center justify-between min-h-[310px] sm:min-h-[330px] cursor-pointer select-none ${
                    isAdmin
                      ? 'border-[#EAB308]/50 ring-2 ring-[#EAB308]/15 shadow-[0_4px_14px_rgba(234,179,8,0.20)]'
                      : isActive
                      ? 'border-[#2D6A3F] shadow-[0_8px_24px_rgba(45,106,63,0.20)] scale-[1.02]'
                      : 'border-[#2D6A3F]/20 shadow-sm opacity-90 hover:opacity-100 hover:border-[#2D6A3F]/45'
                  }`}
                >
                  <div className="w-full flex flex-col items-center text-center relative z-10">
                    {/* الأفاتار */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#2D6A3F]/10 to-[#EAB308]/10 border-2 border-[#2D6A3F]/15 flex items-center justify-center shadow-sm mb-3.5 transition-transform duration-300 group-hover:scale-105">
                      <span className="text-xl sm:text-2xl font-black text-[#2D6A3F]">
                        {rev.author.trim().charAt(0) || 'خ'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-[#1A3D24] leading-snug mb-1 text-center">
                      {rev.author}
                    </h3>

                    <p className="text-[11px] sm:text-xs text-[#5A6B5F] font-bold mb-3 flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3 text-[#EA580C] shrink-0" strokeWidth={2.5} />
                      <span>{rev.neighborhood}</span>
                    </p>

                    <div
                      className="flex items-center justify-center gap-1 mb-4"
                      aria-label={`تقييم ${rev.rating} من 5 نجوم`}
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${
                            i < rev.rating
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.35)]'
                              : 'fill-stone-200 text-stone-200'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-xs sm:text-[13px] text-[#5A6B5F] font-semibold leading-relaxed text-center">
                      "{rev.comment}"
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="w-full mt-4 pt-3 border-t-2 border-[#EAB308]/30 flex items-center justify-between text-xs relative z-10">
                      <span className="font-black text-[#1A3D24] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A3F]" strokeWidth={2.5} />
                        <span>إدارة</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmReview(rev);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition-all cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" strokeWidth={2.5} />
                        <span>حذف</span>
                      </button>
                    </div>
                  )}

                  {/* نبضة التركيز */}
                  {isPulsing && (
                    <div
                      className="rev-focus-pulse absolute inset-0 rounded-3xl bg-[#EAB308]/12 pointer-events-none"
                      aria-hidden="true"
                    />
                  )}
                </article>
              );
            })}

            {/* Spacer أيمن (جوال) */}
            <div className="rev-spacer md:hidden" aria-hidden="true" />
          </div>

          {/* نقاط التنقل */}
          {displayedReviews.length > 1 && (
            <div className="flex md:hidden items-center justify-center gap-2 mt-4">
              {displayedReviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToReview(i)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    activeReviewIndex === i
                      ? 'w-7 bg-[#2D6A3F] shadow-xs'
                      : 'w-2.5 bg-[#2D6A3F]/30 hover:bg-[#2D6A3F]/55'
                  }`}
                  aria-label={`الانتقال للتقييم رقم ${i + 1}`}
                />
              ))}
            </div>
          )}

          {reviews.length > INITIAL_VISIBLE_COUNT && (
            <div className="mt-5 text-center">
              <RippleButton
                onClick={() => setShowAllReviews(!showAllReviews)}
                rippleColor="rgba(45,106,63,0.20)"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-white border-2 border-[#2D6A3F]/20 hover:border-[#2D6A3F]/50 hover:bg-[#FAF8F3] text-[#1A3D24] text-xs font-black transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                {showAllReviews ? (
                  <>
                    <ChevronUp className="w-4 h-4 relative z-10" strokeWidth={2.5} />
                    <span className="relative z-10">عرض أقل</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 relative z-10" strokeWidth={2.5} />
                    <span className="relative z-10">عرض باقي التقييمات ({reviews.length - INITIAL_VISIBLE_COUNT})</span>
                  </>
                )}
              </RippleButton>
            </div>
          )}
        </div>

        {/* ════════ 3. بطاقة دعوة التقييم ════════ */}
        <div className="relative bg-gradient-to-b from-[#FAF8F3] to-[#F5EFE3] border border-[#2D6A3F]/12 rounded-[24px] sm:rounded-3xl shadow-[0_2px_10px_rgba(45,106,63,0.