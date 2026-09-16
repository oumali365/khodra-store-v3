// ============================================================
// CustomerReviews.tsx – الإصدار 3.0
// قسم آراء وتقييمات العملاء – تصميم متناسق
// ============================================================
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Star,
  BadgeCheck,
  MapPin,
  MessageSquarePlus,
  CheckCircle2,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  Trash2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  Loader2,
  ShoppingBag,
  Quote,
  Sparkles,
} from 'lucide-react';
import { STORE_CONFIG } from '../data/config';
import {
  fetchReviews,
  submitCustomerReview,
  deleteCustomerReview,
} from '../services/supabaseService';
import { AdminOrdersPanel } from './AdminOrdersPanel';
import { AdminNotificationToast } from './AdminNotificationToast';
import { useNewOrdersNotifier } from '../hooks/useNewOrdersNotifier';

export interface CustomerReview {
  id: string;
  author: string;
  neighborhood: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

const INITIAL_THREE_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    author: 'فاطمة الزهراء ب.',
    neighborhood: 'طريق إيموزار، فاس',
    rating: 5,
    date: 'منذ يومين',
    comment: 'تبارك الله السلعة نقية وطازجة بحال إلا مشيتي للسوق نقيتيها بيدك، والتوصيل ديما فالموعد.',
    verified: true,
  },
  {
    id: 'rev-2',
    author: 'أمين التازي',
    neighborhood: 'طريق عين الشقف، فاس',
    rating: 5,
    date: 'منذ 3 أيام',
    comment: 'خدمة في المستوى وكتوفر بزاف ديال الوقت، الخضرة كتوصل مقادة ومغسولة بعناية. برافو عليكم.',
    verified: true,
  },
  {
    id: 'rev-3',
    author: 'نادية بنجلون',
    neighborhood: 'حي الأطلس، فاس',
    rating: 5,
    date: 'منذ 5 أيام',
    comment: 'تعامل راقي وثقة كبيرة، الفواكه حلوة والخضر طرية بزاف. أول تجربة وأكيد ماشي الأخيرة.',
    verified: true,
  },
];

const INITIAL_VISIBLE_COUNT = 3;

export const CustomerReviews: React.FC = () => {
  const getDeletedIds = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('khodra_deleted_review_ids') || '[]');
    } catch {
      return [];
    }
  };

  const [reviews, setReviews] = useState<CustomerReview[]>(() => {
    const deleted = getDeletedIds();
    return INITIAL_THREE_REVIEWS.filter((r) => !deleted.includes(r.id));
  });

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSuccessAlert, setIsSuccessAlert] = useState(false);

  // ─── Admin mode ───
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('khodra_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [changePinSuccess, setChangePinSuccess] = useState(false);

  const [deleteConfirmReview, setDeleteConfirmReview] = useState<CustomerReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  // ─── Orders panel ───
  const [isOrdersPanelOpen, setIsOrdersPanelOpen] = useState(false);

  // ─── التمرير الأفقي ───
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const reviewsScrollRef = React.useRef<HTMLDivElement>(null);

  const handleReviewsScroll = () => {
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

    setActiveReviewIndex(closestIdx);
  };

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

  const getAdminPin = (): string => {
    try {
      return localStorage.getItem('khodra_admin_pin') || STORE_CONFIG.adminPin || '1234';
    } catch {
      return '1234';
    }
  };

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
    setIsOrdersPanelOpen(true);
    markAsSeen();
  }, [markAsSeen]);

  const handleCloseOrdersPanel = useCallback(() => {
    setIsOrdersPanelOpen(false);
    refreshOrders();
  }, [refreshOrders]);

  // ─── جلب التقييمات ───
  useEffect(() => {
    let isMounted = true;
    async function loadSupabaseReviews() {
      try {
        const dbReviews = await fetchReviews();
        const deleted = getDeletedIds();

        if (isMounted && dbReviews && dbReviews.length > 0) {
          const formatted: CustomerReview[] = dbReviews
            .filter((r) => !deleted.includes(r.id))
            .map((r) => ({
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
                !deleted.includes(init.id) &&
                !formatted.some((f) => f.id === init.id || f.author === init.author)
            ),
          ];
          setReviews(merged);
        }
      } catch (e) {
        console.warn('Could not load reviews from Supabase:', e);
      }
    }
    loadSupabaseReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedReviews = useMemo(() => {
    if (showAllReviews) return reviews;
    return reviews.slice(0, INITIAL_VISIBLE_COUNT);
  }, [reviews, showAllReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newComment.trim()) return;

    setIsSubmitting(true);
    const newRevData = {
      author: newName.trim(),
      neighborhood: newNeighborhood.trim() || 'فاس',
      rating: newRating,
      comment: newComment.trim(),
      category: 'general',
      verified: true,
    };

    try {
      const result = await submitCustomerReview(newRevData);

      const newReviewItem: CustomerReview = {
        id: result.data?.id || `rev-local-${Date.now()}`,
        author: newRevData.author,
        neighborhood: newRevData.neighborhood,
        rating: newRevData.rating,
        date: 'الآن',
        comment: newRevData.comment,
        verified: true,
      };

      setReviews((prev) => [newReviewItem, ...prev]);
      setIsSuccessAlert(true);

      setTimeout(() => {
        setIsSuccessAlert(false);
        setIsModalOpen(false);
        setNewName('');
        setNewNeighborhood('');
        setNewComment('');
        setNewRating(5);
        setIsSubmitting(false);
      }, 1400);
    } catch (err) {
      console.warn('Failed to submit review to Supabase:', err);
      setIsSubmitting(false);
    }
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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getAdminPin();

    if (pinInput.trim() === correctPin.trim()) {
      setIsAdmin(true);
      try {
        sessionStorage.setItem('khodra_admin_auth', 'true');
      } catch {}
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(null);
      setAdminNotification('مرحباً بك! تم تفعيل وضع المدير مع التنبيهات الصوتية.');
      setTimeout(() => setAdminNotification(null), 4000);

      setTimeout(() => {
        const el = document.getElementById('customer-reviews-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    } else {
      setPinError('الرمز السري غير صحيح، يرجى التأكد والمحاولة مجدداً.');
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    try {
      sessionStorage.removeItem('khodra_admin_auth');
    } catch {}
    setAdminNotification('تم تسجيل الخروج من وضع المدير.');
    setTimeout(() => setAdminNotification(null), 3000);
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinInput.trim() || newPinInput.trim().length < 4) return;
    try {
      localStorage.setItem('khodra_admin_pin', newPinInput.trim());
      setChangePinSuccess(true);
      setTimeout(() => {
        setChangePinSuccess(false);
        setIsChangePinModalOpen(false);
        setNewPinInput('');
        setAdminNotification('تم تحديث الرمز السري للمدير بنجاح.');
        setTimeout(() => setAdminNotification(null), 3500);
      }, 1200);
    } catch {}
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmReview) return;
    setIsDeleting(true);

    try {
      await deleteCustomerReview(deleteConfirmReview.id);
      setReviews((prev) => prev.filter((r) => r.id !== deleteConfirmReview.id));
      setAdminNotification(`تم حذف تعليق "${deleteConfirmReview.author}" بنجاح.`);
      setTimeout(() => setAdminNotification(null), 3500);
    } catch (err) {
      console.warn('Error deleting review:', err);
      setAdminNotification('حدث خطأ أثناء الحذف، تم إخفاء التعليق محلياً.');
      setTimeout(() => setAdminNotification(null), 3500);
    } finally {
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

        {/* ════════ 1. بطاقة العنوان والوصف المستقلة (الجزء الأول) ════════ */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 text-center max-w-md sm:max-w-xl mx-auto mb-8 sm:mb-10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          {/* شارة علوية */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#163920]/10 text-[#163920] font-black text-xs sm:text-sm mb-3">
            <Sparkles className="w-4 h-4 text-[#C25E12]" />
            <span>آراء وتجارب حقيقية</span>
            <Quote className="w-3.5 h-3.5 text-[#163920]" />
          </div>

          {/* العنوان */}
          <h2 className="text-2xl sm:text-3xl font-black text-[#112616] tracking-tight mb-2.5">
            آراء زبنائنا بمدينة فاس
          </h2>

          <p className="text-xs sm:text-sm text-[#524B3E] font-medium leading-relaxed mb-4">
            تجارب حية لعائلات تثق بخدمة وجودة متجر خُضرة يومياً
          </p>

          {/* التقييم الإجمالي */}
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

          {/* مؤشر التمرير على الهاتف */}
          <div className="flex md:hidden items-center justify-center gap-1.5 mt-4 pt-3 border-t border-stone-100 text-[#787163]">
            <span className="text-[11px] font-bold text-stone-500">مرر أفقياً لقراءة المزيد</span>
            <span className="text-xs text-[#163920] font-black">←</span>
          </div>
        </div>

        {/* ════════ 2. بطاقات التقييمات المستقلة بالعرض الأفقي (الجزء الثاني) ════════ */}
        <div className="relative max-w-5xl mx-auto py-2 mb-8 sm:mb-10">
          <div
            ref={reviewsScrollRef}
            onScroll={handleReviewsScroll}
            className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 text-center overflow-x-auto md:overflow-x-visible py-5 px-[14vw] sm:px-12 md:px-0 snap-x snap-mandatory overscroll-x-contain scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayedReviews.map((rev, idx) => {
              const isActive = idx === activeReviewIndex;

              return (
                <article
                  key={rev.id}
                  onClick={() => scrollToReview(idx)}
                  className={`w-[66vw] min-w-[210px] max-w-[245px] md:w-full md:max-w-none shrink-0 snap-center snap-always bg-white rounded-3xl border border-stone-200/90 shadow-[0_6px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.11)] hover:-translate-y-1.5 transition-all duration-300 px-5 py-7 text-center flex flex-col items-center justify-between min-h-[310px] sm:min-h-[330px] cursor-pointer group select-none ${
                    isAdmin
                      ? 'border-2 border-amber-300 ring-2 ring-amber-100 shadow-sm'
                      : isActive
                      ? 'ring-2 ring-[#163920]/35 ring-offset-2 ring-offset-[#FAF8F4] scale-[1.02]'
                      : 'opacity-90 hover:opacity-100 scale-[0.98]'
                  }`}
                >
                  <div className="w-full flex flex-col items-center text-center">
                    {/* 1. أيقونة الأفاتار الرمزية الدائرية */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F7F4EC] border border-[#E0D7C6] flex items-center justify-center shadow-xs mb-3.5 transition-transform duration-300 group-hover:scale-105">
                      <span className="text-xl sm:text-2xl font-black text-[#163920]">
                        {rev.author.trim().charAt(0) || 'خ'}
                      </span>
                    </div>

                    {/* 2. اسم صاحب التقييم */}
                    <h3 className="text-base sm:text-lg font-black text-[#112616] leading-snug mb-1 text-center">
                      {rev.author}
                    </h3>

                    {/* الحي / فاس */}
                    <p className="text-[11px] sm:text-xs text-[#787163] font-bold mb-3 flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3 text-[#C25E12] shrink-0" />
                      <span>{rev.neighborhood}</span>
                    </p>

                    {/* نجوم التقييم ممركزة وواضحة */}
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

                    {/* 3. نص التعليق واضح ومريح */}
                    <p className="text-xs sm:text-[13px] text-[#524B3E] font-medium leading-relaxed text-center">
                      "{rev.comment}"
                    </p>
                  </div>

                  {/* لوحة تحكم المدير عند التفعيل */}
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

          {/* نقاط التمرير التفاعلية (Dots) */}
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

          {/* زر عرض المزيد */}
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

        {/* ════════ 3. بطاقة دعوة التقييم المستقلة (الجزء الثالث - رسالة واضحة وتصميم متميز) ════════ */}
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
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)} />

            <div className="relative bg-white border border-[#E8E1D3] rounded-[24px] w-full max-w-md shadow-2xl z-50 overflow-hidden p-5 text-right animate-in zoom-in-95 duration-200 my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E9DA] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#163920] to-[#0E2615] flex items-center justify-center">
                    <MessageSquarePlus className="w-4 h-4 text-[#F5D76E]" />
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-[#112616]">
                    مشاركة تجربتك
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] flex items-center justify-center transition-colors active:scale-90 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isSuccessAlert ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                  </div>
                  <h4 className="text-base font-black text-[#112616]">شكراً على تقييمك القيّم!</h4>
                  <p className="text-xs text-[#524B3E]">تم حفظ تقييمك بنجاح.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-black text-[#112616] mb-1.5">
                      الاسم الكامل <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="مثال: سارة الإدريسي"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D3] text-sm bg-[#F7F4EC] focus:bg-white focus:outline-none focus:border-[#163920] focus:ring-2 focus:ring-[#163920]/15 transition-all text-[#112616]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#112616] mb-1.5">
                      الحي بمدينة فاس
                    </label>
                    <input
                      type="text"
                      value={newNeighborhood}
                      onChange={(e) => setNewNeighborhood(e.target.value)}
                      placeholder="مثال: طريق إيموزار، الأطلس..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D3] text-sm bg-[#F7F4EC] focus:bg-white focus:outline-none focus:border-[#163920] focus:ring-2 focus:ring-[#163920]/15 transition-all text-[#112616]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#112616] mb-1.5">
                      التقييم
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= newRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-black text-[#524B3E] mr-2">
                        ({newRating}/5)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#112616] mb-1.5">
                      تعليقك <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="شاركنا رأيك في طراوة المنتجات، التوصيل، أو طريقة التعامل..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D3] text-sm bg-[#F7F4EC] focus:bg-white focus:outline-none focus:border-[#163920] focus:ring-2 focus:ring-[#163920]/15 transition-all text-[#112616] resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-4 min-h-[46px] rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white font-black text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-[#F5D76E]" />
                      <span>{isSubmitting ? 'جاري النشر...' : 'نشر التقييم'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsModalOpen(false)}
                      className="py-3 px-4 min-h-[46px] rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] font-black text-sm transition-colors cursor-pointer active:scale-95"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ════════ PIN Modal ════════ */}
        {isPinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsPinModalOpen(false)} />

            <div className="relative bg-white border border-amber-300 rounded-[24px] w-full max-w-sm shadow-2xl z-50 overflow-hidden p-6 text-right animate-in zoom-in-95 duration-200 my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E9DA] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-[#C25E12] flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-[#112616]">
                      إدارة المتجر
                    </h3>
                    <p className="text-[11px] text-[#787163] font-bold">خاص بالمدير فقط</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-[#112616] mb-2">
                    أدخل الرمز السري (PIN)
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError(null);
                    }}
                    placeholder="••••"
                    className="w-full text-center text-xl font-black tracking-widest px-4 py-3 rounded-xl border border-[#E8E1D3] bg-[#F7F4EC] focus:bg-white focus:outline-none focus:border-[#C25E12] focus:ring-2 focus:ring-[#C25E12]/20 transition-all"
                  />
                  {pinError && (
                    <p className="text-red-600 text-xs font-black mt-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{pinError}</span>
                    </p>
                  )}
                </div>

                <div className="pt-1 flex items-center gap-2.5">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    تأكيد الدخول
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(false)}
                    className="py-3 px-4 rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] font-black text-sm cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════ Change PIN Modal ════════ */}
        {isChangePinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsChangePinModalOpen(false)} />

            <div className="relative bg-white border border-[#E8E1D3] rounded-[24px] w-full max-w-sm shadow-2xl z-50 overflow-hidden p-6 text-right animate-in zoom-in-95 duration-200 my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E9DA] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-[#C25E12] flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-[#112616]">
                    تغيير الرمز السري
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangePinModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {changePinSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <p className="text-sm font-black text-emerald-800">تم حفظ الرمز الجديد بنجاح!</p>
                </div>
              ) : (
                <form onSubmit={handleChangePinSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-[#112616] mb-2">
                      الرمز الجديد (4 أرقام أو أكثر)
                    </label>
                    <input
                      type="password"
                      autoFocus
                      required
                      minLength={4}
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      placeholder="مثال: 5678"
                      className="w-full text-center text-xl font-black tracking-widest px-4 py-3 rounded-xl border border-[#E8E1D3] bg-[#F7F4EC] focus:bg-white focus:outline-none focus:border-[#C25E12] focus:ring-2 focus:ring-[#C25E12]/20 transition-all"
                    />
                  </div>

                  <div className="pt-1 flex items-center gap-2.5">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-l from-[#C25E12] to-[#9C4505] hover:from-[#B85507] hover:to-[#8A3D04] text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      حفظ الرمز الجديد
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangePinModalOpen(false)}
                      className="py-3 px-4 rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] font-black text-sm cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ════════ Delete Review Confirmation ════════ */}
        {deleteConfirmReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteConfirmReview(null)} />

            <div className="relative bg-white border border-red-300 rounded-[24px] w-full max-w-sm shadow-2xl z-50 overflow-hidden p-6 text-right animate-in zoom-in-95 duration-200 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7" />
              </div>

              <h3 className="font-black text-base text-[#112616] text-center mb-2">
                تأكيد حذف التعليق
              </h3>
              <p className="text-xs text-[#787163] text-center mb-4 leading-relaxed">
                هل أنت متأكد من حذف تعليق{' '}
                <strong className="text-[#112616]">"{deleteConfirmReview.author}"</strong> نهائياً؟
              </p>

              <div className="bg-[#F7F4EC] p-3 rounded-xl border border-[#E8E1D3] mb-4 text-xs text-[#524B3E] italic text-center">
                "{deleteConfirmReview.comment}"
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleExecuteDelete}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>نعم، حذف</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmReview(null)}
                  className="py-3 px-4 rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] font-black text-sm cursor-pointer active:scale-95 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════ لوحة إدارة الطلبات ════════ */}
        <AdminOrdersPanel
          isOpen={isOrdersPanelOpen}
          onClose={handleCloseOrdersPanel}
          onOrdersChange={() => refreshOrders()}
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