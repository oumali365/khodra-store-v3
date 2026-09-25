// ============================================================
// CustomerReviews.tsx – الإصدار 4.2 (بزر اللوحة المالية)
// Soft Delete + مزامنة PIN + تصميم متناسق + Finance Panel
// ============================================================
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Star,
  MapPin,
  MessageSquarePlus,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Lock,
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

  // ─── Orders panel ───
  const [isOrdersPanelOpen, setIsOrdersPanelOpen] = useState(false);

  // ─── Finance panel ───
  const [isFinancePanelOpen, setIsFinancePanelOpen] = useState(false);

  // ─── التمرير الأفقي ───
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const reviewsScrollRef = React.useRef<HTMLDivElement>(null);
  const reviewsScrollRaf = React.useRef<number | null>(null);

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

      setActiveReviewIndex((prev) => (prev !== closestIdx ? closestIdx : prev));
    });
  };

  useEffect(() => {
    return () => {
      if (reviewsScrollRaf.current) cancelAnimationFrame(reviewsScrollRaf.current);
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
    window.addEventListener('khodra_orders_updated', handleUpdated);
    return () => window.removeEventListener('khodra_orders_updated', handleUpdated);
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

  // ─── ✅ إضافة تقييم جديد ───
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

    // إذا لم يتطابق مع المخزن محلياً، نتحقق مع Supabase store_settings أولاً
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

  // ─── ✅ تغيير PIN (مع مزامنة Supabase) ───
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

  // ─── ✅ حذف التعليق (Soft Delete) ───
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
        {/* ════════ إشعار إداري ════════ */}
        {adminNotification && (
          <div className="mb-5 max-w-2xl mx-auto py-3 px-4 rounded-2xl bg-gradient-to-l from-[#163920] to-[#0E2615] text-white text-xs sm:text-sm font-black shadow-md flex items-center justify-between gap-3 animate-in fade-in duration-200 text-right border-2 border-[#F5D76E]/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#F5D76E] shrink-0" />
              <span>{adminNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminNotification(null)}
              className="text-white/80 hover:text-white cursor-pointer p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ════════ شريط المدير ════════ */}
        {isAdmin && (
          <div className="mb-6 max-w-2xl mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 text-amber-950 flex flex-wrap items-center justify-between gap-2.5 text-xs font-black text-right shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#C25E12] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span>
                <strong>وضع المدير مفعّل:</strong> إدارة الطلبات + التنبيهات
              </span>
            </div>
            <div className="flex items-center gap-2 mr-auto flex-wrap">
              <button
                type="button"
                onClick={handleOpenOrders}
                className="relative px-3.5 py-2 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 border-2 border-[#0E2615]"
              >
                <ShoppingBag className="w-4 h-4 text-[#F5D76E]" />
                <span>إدارة الطلبات</span>
                {totalPending > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black border-2 border-white shadow-md animate-pulse">
                    {totalPending > 99 ? '99+' : totalPending}
                  </span>
                )}
              </button>

              {/* ═══ زر اللوحة المالية (جديد) ═══ */}
              <button
                type="button"
                onClick={handleOpenFinance}
                className="relative px-3.5 py-2 rounded-xl bg-gradient-to-l from-[#C25E12] to-[#9C4505] hover:from-[#9C4505] hover:to-[#7A3405] text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 border-2 border-[#9C4505]"
              >
                <BarChart3 className="w-4 h-4 text-[#F5D76E]" />
                <span>اللوحة المالية</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangePinModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-white border-2 border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                <span>الرمز السري</span>
              </button>

              <button
                type="button"
                onClick={handleLogoutAdmin}
                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border-2 border-red-200 text-xs font-black transition-colors cursor-pointer"
              >
                خروج
              </button>
            </div>
          </div>
        )}

        {/* ════════ 1. بطاقة العنوان والوصف ════════ */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 text-center max-w-md sm:max-w-xl mx-auto mb-8 sm:mb-10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#163920]/10 text-[#163920] font-black text-xs sm:text-sm mb-3">
            <Sparkles className="w-4 h-4 text-[#C25E12]" />
            <span>آراء وتجارب حقيقية</span>
            <Quote className="w-3.5 h-3.5 text-[#163920]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#112616] tracking-tight mb-2.5">
            آراء زبنائنا بمدينة فاس
          </h2>

          <p className="text-xs sm:text-sm text-[#524B3E] font-medium leading-relaxed mb-4">
            تجارب حية لعائلات تثق بخدمة وجودة متجر خُضرة يومياً
          </p>

          <div className="inline-flex items-center gap-2.5 bg-[#F7F4EC] px-4 py-2 rounded-full border border-[#E8E1D3] shadow-xs text-xs font-black text-[#112616] select-none">
            <span className="font-black text-[#C25E12] text-base tabular-nums">4.9</span>
            <div className="flex text-amber-500 text-sm gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[11px] text-[#787163] font-bold border-r border-[#E8E1D3] pr-2.5 mr-1">
              {reviews.length}+ تقييم معتمد
            </span>
          </div>

          <div className="flex md:hidden items-center justify-center gap-1.5 mt-4 pt-3 border-t border-stone-100 text-[#787163]">
            <span className="text-[11px] font-bold text-stone-500">مرر أفقياً لقراءة المزيد</span>
            <span className="text-xs text-[#163920] font-black">←</span>
          </div>
        </div>

        {/* ════════ 2. بطاقات التقييمات ════════ */}
        <div className="relative max-w-5xl mx-auto py-2 mb-8 sm:mb-10">
          <div
            ref={reviewsScrollRef}
            onScroll={handleReviewsScroll}
            className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 text-center overflow-x-auto md:overflow-x-visible py-5 px-[14vw] sm:px-12 md:px-0 snap-x snap-proximity overscroll-x-contain no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {displayedReviews.map((rev, idx) => {
              const isActive = idx === activeReviewIndex;

              return (
                <article
                  key={rev.id}
                  onClick={() => scrollToReview(idx)}
                  className={`w-[66vw] min-w-[210px] max-w-[245px] md:w-full md:max-w-none shrink-0 snap-center bg-white rounded-3xl border border-stone-200/90 shadow-[0_6px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.11)] hover:-translate-y-1.5 transition-all duration-300 px-5 py-7 text-center flex flex-col items-center justify-between min-h-[310px] sm:min-h-[330px] cursor-pointer group select-none ${
                    isAdmin
                      ? 'border-2 border-amber-300 ring-2 ring-amber-100 shadow-sm'
                      : isActive
                      ? 'ring-2 ring-[#163920]/35 ring-offset-2 ring-offset-[#FAF8F4] scale-[1.02]'
                      : 'opacity-90 hover:opacity-100 scale-[0.98]'
                  }`}
                >
                  <div className="w-full flex flex-col items-center text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F7F4EC] border border-[#E0D7C6] flex items-center justify-center shadow-xs mb-3.5 transition-transform duration-300 group-hover:scale-105">
                      <span className="text-xl sm:text-2xl font-black text-[#163920]">
                        {rev.author.trim().charAt(0) || 'خ'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-[#112616] leading-snug mb-1 text-center">
                      {rev.author}
                    </h3>

                    <p className="text-[11px] sm:text-xs text-[#787163] font-bold mb-3 flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3 text-[#C25E12] shrink-0" />
                      <span>{rev.neighborhood}</span>
                    </p>

                    <div
                      className="flex items-center justify-center gap-1 mb-4"
                      aria-label={`تقييم ${rev.rating} من 5 نجوم`}
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                            i < rev.rating
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.3)]'
                              : 'fill-stone-200 text-stone-200'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-xs sm:text-[13px] text-[#524B3E] font-medium leading-relaxed text-center">
                      "{rev.comment}"
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="w-full mt-4 pt-3 border-t-2 border-amber-200 flex items-center justify-between text-xs">
                      <span className="font-black text-amber-900 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#C25E12]" />
                        <span>إدارة</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmReview(rev);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-black transition-all cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>حذف</span>
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {displayedReviews.length > 1 && (
            <div className="flex md:hidden items-center justify-center gap-2 mt-4">
              {displayedReviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToReview(i)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    activeReviewIndex === i ? 'w-7 bg-[#163920]' : 'w-2 bg-stone-300'
                  }`}
                  aria-label={`الانتقال للتقييم رقم ${i + 1}`}
                />
              ))}
            </div>
          )}

          {reviews.length > INITIAL_VISIBLE_COUNT && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-white border-2 border-[#E8E1D3] hover:border-[#C25E12] hover:bg-[#F7F4EC] text-[#163920] text-xs font-black transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                {showAllReviews ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>عرض أقل</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>عرض باقي التقييمات ({reviews.length - INITIAL_VISIBLE_COUNT})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ════════ 3. بطاقة دعوة التقييم ════════ */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 max-w-md sm:max-w-xl mx-auto transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] text-center sm:text-right">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#163920] justify-center sm:justify-start">
                <MessageSquarePlus className="w-4 h-4 text-[#C25E12]" />
                <span>شاركنا تجربتك</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#112616] leading-snug">
                هل تسوقت من متجر خُضرة مؤخراً؟
              </h3>
              <p className="text-xs sm:text-[13px] text-[#524B3E] font-medium leading-relaxed">
                يسعدنا دائماً الاستماع إلى رأيك لمواصلة تقديم أفضل خدمة ومنتجات لك ولعائلتك.
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-2xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer border-2 border-[#0E2615]"
              >
                <MessageSquarePlus className="w-4 h-4 text-[#F5D76E]" />
                <span>إضافة تقييم</span>
                <Sparkles className="w-3.5 h-3.5 text-[#F5D76E]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ نافذة إضافة الرأي ════════ */}
      <AddReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReviewSubmit}
      />

      {/* ════════ PIN Modal ════════ */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handlePinLogin}
      />

      {/* ════════ Change PIN Modal ════════ */}
      <ChangePinModal
        isOpen={isChangePinModalOpen}
        onClose={() => setIsChangePinModalOpen(false)}
        onSubmit={handleChangePin}
      />

      {/* ════════ Delete Review Confirmation ════════ */}
      <DeleteReviewModal
        review={deleteConfirmReview}
        isDeleting={isDeleting}
        onClose={() => !isDeleting && setDeleteConfirmReview(null)}
        onConfirm={handleExecuteDelete}
      />

      {/* ════════ لوحة إدارة الطلبات ════════ */}
      {!onOpenOrdersPanel && isOrdersPanelOpen && (
        <AdminErrorBoundary onClose={handleCloseOrdersPanel}>
          <React.Suspense fallback={null}>
            <AdminOrdersPanel
              isOpen={isOrdersPanelOpen}
              onClose={handleCloseOrdersPanel}
              onOrdersChange={refreshOrders}
            />
          </React.Suspense>
        </AdminErrorBoundary>
      )}

      {/* ════════ 💰 اللوحة المالية ════════ */}
      <FinancePanel
        isOpen={isFinancePanelOpen}
        onClose={handleCloseFinance}
      />

      {/* ════════ 🔔 إشعار الطلبات الجديدة ════════ */}
      {isAdmin && (
        <AdminNotificationToast
          newCount={newCount}
          onOpenOrders={handleOpenOrders}
          onDismiss={markAsSeen}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}
    </>
  );
};