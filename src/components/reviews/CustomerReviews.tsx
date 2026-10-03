// ============================================================
// CustomerReviews.tsx – الإصدار 4.4
// مزامنة كاملة مع TrustBadges + الحفاظ على الوظائف الإدارية
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
  ShieldCheck,
  Trash2,
  Quote,
  Sparkles,
} from 'lucide-react';
import { STORE_CONFIG } from '../../data/config';
import {
  fetchReviews,
  submitCustomerReview,
  deleteCustomerReview,
} from '../../services/supabaseService';
import {
  INITIAL_THREE_REVIEWS,
  type CustomerReview,
} from '../../data/initialReviews';
import { AddReviewModal } from './AddReviewModal';
import { DeleteReviewModal } from '../admin';

export type { CustomerReview };

const INITIAL_VISIBLE_COUNT = 3;
const FOCUS_PULSE_MS = 700;

// ═══════════════════════════════════════════════════════════
// ✅ RippleButton — نفس البنية المستخدمة في TrustBadges
// ═══════════════════════════════════════════════════════════
const RippleButton: React.FC<{
  onClick?: () => void;
  className: string;
  children: React.ReactNode;
  rippleColor?: string;
  ariaLabel?: string;
  animationDelay?: number;
}> = ({ onClick, className, children, rippleColor = 'rgba(45,106,63,0.22)', ariaLabel, animationDelay }) => {
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
      style={animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════
// ✅ RippleCard — عنصر article يمنع خطأ nested button في HTML
// ═══════════════════════════════════════════════════════════
const RippleCard: React.FC<{
  onClick?: () => void;
  className: string;
  children: React.ReactNode;
  rippleColor?: string;
  ariaLabel?: string;
  animationDelay?: number;
}> = ({ onClick, className, children, rippleColor = 'rgba(45,106,63,0.22)', ariaLabel, animationDelay }) => {
  const cardRef = useRef<HTMLElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    const card = cardRef.current;
    if (card) {
      const rect = card.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'rev-ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.background = rippleColor;
      card.appendChild(ripple);

      window.setTimeout(() => ripple.remove(), 650);
    }
    onClick?.();
  };

  return (
    <article
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (!(e.target as HTMLElement).closest('button')) {
            onClick?.();
          }
        }
      }}
      style={animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </article>
  );
};

interface CustomerReviewsProps {
  onOpenOrdersPanel?: () => void;
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ onOpenOrdersPanel }) => {
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_THREE_REVIEWS);

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── Admin mode (متزامن مع اللوحة الرئيسية أسفل الفوتر) ───
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('khodra_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [deleteConfirmReview, setDeleteConfirmReview] = useState<CustomerReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthChanged = () => {
      try {
        setIsAdmin(sessionStorage.getItem('khodra_admin_auth') === 'true');
      } catch {}
    };
    window.addEventListener('khodra_admin_auth_changed', handleAuthChanged);
    return () => {
      window.removeEventListener('khodra_admin_auth_changed', handleAuthChanged);
    };
  }, []);

  // ─── التمرير الأفقي ───
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [pulsingIndex, setPulsingIndex] = useState<number | null>(null);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);
  const reviewsScrollRaf = useRef<number | null>(null);
  const pulseTimer = useRef<number | null>(null);
  const prevActiveRef = useRef(0);

  // ✅ نفس منطق TrustBadges: تحديث مباشر عبر RAF
  const updateLayout = useCallback(() => {
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
  }, []);

  const handleReviewsScroll = () => {
    if (reviewsScrollRaf.current) cancelAnimationFrame(reviewsScrollRaf.current);
    reviewsScrollRaf.current = requestAnimationFrame(updateLayout);
  };

  // ✅ نفس منطق TrustBadges: نبضة التركيز عند تغيير البطاقة
  useEffect(() => {
    if (prevActiveRef.current === activeReviewIndex) return;
    prevActiveRef.current = activeReviewIndex;
    setPulsingIndex(activeReviewIndex);

    if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setPulsingIndex(null), FOCUS_PULSE_MS);
  }, [activeReviewIndex]);

  useEffect(() => {
    return () => {
      if (reviewsScrollRaf.current) cancelAnimationFrame(reviewsScrollRaf.current);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    };
  }, []);

  // ✅ نفس منطق TrustBadges: scrollBy بدل scrollIntoView
  const scrollToReview = (index: number) => {
    if (!reviewsScrollRef.current) return;
    const container = reviewsScrollRef.current;
    const cards = container.querySelectorAll('article');
    if (cards[index]) {
      const card = cards[index] as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const deltaX = (cardRect.left + cardRect.width / 2) - (containerRect.left + containerRect.width / 2);

      container.scrollBy({ left: deltaX, behavior: 'smooth' });
      setActiveReviewIndex(index);
    }
  };

  // ─── جلب التقييمات ───
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
      category: 'quality',
      verified: false,
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
      verified: Boolean(result.data.verified),
    };

    setReviews((prev) => [newReviewItem, ...prev]);
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
        {/* ═══════ الأنماط الحركية — مطابقة تماماً لـ TrustBadges ═══════ */}
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

          /* ✅ نفس Spacer TrustBadges حرفياً */
          .rev-spacer {
            flex-shrink: 0;
            width: calc(50% - 33vw - 0.5rem);
          }
          @media (min-width: 640px) {
            .rev-spacer {
              width: calc(50% - 115px - 0.75rem);
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

        {/* ════════ 1. بطاقة العنوان — مطابقة لـ TrustBadges ════════ */}
        <div className="relative bg-gradient-to-b from-white via-[#FEFEFC] to-[#FAF8F3] border border-[#2D6A3F]/12 rounded-[24px] sm:rounded-3xl shadow-[0_2px_12px_rgba(45,106,63,0.06)] p-6 sm:p-8 text-center max-w-md sm:max-w-xl mx-auto mb-8 sm:mb-10 overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#EAB308]/12 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#2D6A3F]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
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

        {/* ════════ 2. بطاقات التقييمات — مزامنة كاملة مع TrustBadges ════════ */}
        <div className="relative max-w-5xl mx-auto py-2 mb-8 sm:mb-10">
          <div
            ref={reviewsScrollRef}
            onScroll={handleReviewsScroll}
            // ✅ نفس كلاسات TrustBadges: snap-x snap-mandatory + gap-4 sm:gap-6
            className="flex flex-row gap-4 sm:gap-6 overflow-x-auto py-5 snap-x snap-mandatory overscroll-x-contain no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {/* Spacer أيسر */}
            <div className="rev-spacer" aria-hidden="true" />

            {displayedReviews.map((rev, idx) => {
              const isActive = idx === activeReviewIndex;
              const isPulsing = pulsingIndex === idx;

              return (
                <RippleCard
                  key={rev.id}
                  onClick={() => scrollToReview(idx)}
                  ariaLabel={`تقييم من ${rev.author}`}
                  rippleColor="rgba(45,106,63,0.22)"
                  animationDelay={idx * 80}
                  className={`rev-fade-in-right group w-[66vw] min-w-[210px] max-w-[245px] sm:w-[230px] md:w-[245px] shrink-0 snap-center bg-white rounded-3xl border-2 transition-all duration-300 md:hover:-translate-y-1 px-5 py-7 text-center flex flex-col items-center justify-center min-h-[290px] sm:min-h-[310px] cursor-pointer select-none ${
                    isAdmin
                      ? 'border-[#EAB308]/50 ring-2 ring-[#EAB308]/15 shadow-[0_4px_14px_rgba(234,179,8,0.18)]'
                      : isActive
                      ? 'border-[#2D6A3F] shadow-[0_6px_20px_rgba(45,106,63,0.14)] scale-[1.01]'
                      : 'border-[#2D6A3F]/20 hover:border-[#2D6A3F]/45 shadow-xs hover:shadow-[0_10px_24px_rgba(45,106,63,0.12)]'
                  }`}
                >
                  <div className="w-full flex flex-col items-center text-center relative z-10">
                    {/* الأفاتار */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#2D6A3F]/10 to-[#EAB308]/10 border-2 border-[#2D6A3F]/15 flex items-center justify-center shadow-2xs mb-3.5 transition-transform duration-300 ease-out group-hover:scale-108 group-hover:-rotate-2">
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

                  {/* ✅ نبضة التركيز — مطابقة لـ TrustBadges */}
                  {isPulsing && (
                    <div
                      className="rev-focus-pulse absolute inset-0 rounded-3xl bg-[#EAB308]/12 pointer-events-none"
                      aria-hidden="true"
                    />
                  )}
                </RippleCard>
              );
            })}

            {/* Spacer أيمن */}
            <div className="rev-spacer" aria-hidden="true" />
          </div>

          {/* نقاط التنقل — مطابقة لـ TrustBadges */}
          {displayedReviews.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
              {displayedReviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToReview(i)}
                  className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
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

        {/* ════════ 3. بطاقة دعوة التقييم — مطابقة لـ TrustBadges ════════ */}
        <div className="relative bg-gradient-to-b from-[#FAF8F3] to-[#F5EFE3] border border-[#2D6A3F]/12 rounded-[24px] sm:rounded-3xl shadow-[0_2px_10px_rgba(45,106,63,0.06)] p-6 sm:p-8 max-w-md sm:max-w-xl mx-auto overflow-hidden text-center sm:text-right">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#EAB308]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#2D6A3F]/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#1A3D24] justify-center sm:justify-start">
                <MessageSquarePlus className="w-4 h-4 text-[#EA580C]" strokeWidth={2.5} />
                <span>شاركنا تجربتك</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#1A3D24] leading-snug">
                هل تسوقت من متجر خُضرة مؤخراً؟
              </h3>
              <p className="text-xs sm:text-[13px] text-[#5A6B5F] font-semibold leading-relaxed">
                يسعدنا دائماً الاستماع إلى رأيك لمواصلة تقديم أفضل خدمة ومنتجات لك ولعائلتك.
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <RippleButton
                onClick={() => setIsModalOpen(true)}
                rippleColor="rgba(255,255,255,0.30)"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-2xl bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] hover:from-[#3A8152] hover:to-[#2D6A3F] text-white font-black text-xs sm:text-sm shadow-[0_4px_14px_rgba(45,106,63,0.30)] hover:shadow-[0_6px_22px_rgba(45,106,63,0.42)] active:scale-95 transition-all cursor-pointer border border-[#EAB308]/25"
              >
                <MessageSquarePlus className="w-4 h-4 text-[#EAB308] relative z-10" strokeWidth={2.5} />
                <span className="relative z-10">إضافة تقييم</span>
                <Sparkles className="w-3.5 h-3.5 text-[#EAB308] relative z-10" strokeWidth={2.5} />
              </RippleButton>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ النوافذ المنبثقة (بدون تغيير) ════════ */}
      <AddReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReviewSubmit}
      />

      <DeleteReviewModal
        review={deleteConfirmReview}
        isDeleting={isDeleting}
        onClose={() => !isDeleting && setDeleteConfirmReview(null)}
        onConfirm={handleExecuteDelete}
      />
    </>
  );
};