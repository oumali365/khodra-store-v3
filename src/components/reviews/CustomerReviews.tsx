// ============================================================
// CustomerReviews.tsx – الإصدار 6.0
//  ============================================================
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Star,
  MapPin,
  MessageSquarePlus,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
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
const FOCUS_PULSE_MS = 600;

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

  // ─── التمرير الأفقي والوميض البصري ───
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [pulsingIndex, setPulsingIndex] = useState<number | null>(null);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);
  const scrollRaf = useRef<number | null>(null);
  const pulseTimer = useRef<number | null>(null);

  const displayedReviews = useMemo(() => {
    if (showAllReviews) return reviews;
    return reviews.slice(0, INITIAL_VISIBLE_COUNT);
  }, [reviews, showAllReviews]);

  const updateLayout = useCallback(() => {
    if (!reviewsScrollRef.current) return;
    const container = reviewsScrollRef.current;
    const cards = container.querySelectorAll('article');
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

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
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(updateLayout);
  }, [updateLayout]);

  useEffect(() => {
    return () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    };
  }, []);

  const scrollToReview = (idx: number) => {
    if (!reviewsScrollRef.current) return;
    const container = reviewsScrollRef.current;
    const cards = container.querySelectorAll('article');
    if (cards[idx]) {
      const card = cards[idx] as HTMLElement;
      const cardLeft = card.offsetLeft;
      const cardWidth = card.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollPosition = cardLeft - (containerWidth - cardWidth) / 2;

      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
      setActiveReviewIndex(idx);
      setPulsingIndex(idx);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
      pulseTimer.current = window.setTimeout(() => setPulsingIndex(null), FOCUS_PULSE_MS);
    }
  };

  const scrollNext = () => {
    const nextIdx = Math.min(displayedReviews.length - 1, activeReviewIndex + 1);
    scrollToReview(nextIdx);
  };

  const scrollPrev = () => {
    const prevIdx = Math.max(0, activeReviewIndex - 1);
    scrollToReview(prevIdx);
  };

  // ─── جلب التقييمات من Supabase ───
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
        setAdminNotification(`✅ ${res.message || 'تم حذف التعليق بنجاح'}`);
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
        className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-10 sm:my-14"
        id="customer-reviews-section"
        aria-label="آراء وتقييمات زبناء متجر خضرة"
        dir="rtl"
      >
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

        {/* ════════ الحاوية الرئيسية الموحدة ════════ */}
        <div className="relative bg-white border-2 border-[#2D6A3F]/15 rounded-3xl sm:rounded-[36px] shadow-[0_12px_36px_rgba(45,106,63,0.06)] p-4 sm:p-6 lg:p-8 overflow-hidden">
          {/* أنماط الوميض البصري والتأثيرات الحركية */}
          <style>{`
            @keyframes reviewSheenSwipe {
              0%   { transform: translateX(180%) skewX(-20deg); opacity: 0; }
              15%  { opacity: 0.8; }
              100% { transform: translateX(-180%) skewX(-20deg); opacity: 0; }
            }
            .review-sheen-sweep {
              position: absolute;
              inset: 0;
              background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.85) 50%, transparent 100%);
              transform: translateX(180%) skewX(-20deg);
              pointer-events: none;
              z-index: 10;
            }
            .group\\/rev:hover .review-sheen-sweep,
            .group\\/rev:active .review-sheen-sweep {
              animation: reviewSheenSwipe 0.75s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes reviewFocusPulse {
              0%   { opacity: 0.55; }
              100% { opacity: 0; }
            }
            .review-focus-pulse {
              animation: reviewFocusPulse ${FOCUS_PULSE_MS}ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            @media (prefers-reduced-motion: reduce) {
              .review-sheen-sweep,
              .review-focus-pulse { animation: none; }
            }
          `}</style>

          {/* إضاءات خلفية ناعمة */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#EAB308]/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#2D6A3F]/5 rounded-full blur-3xl pointer-events-none" />

          {/* ─── 1. رأس القسم الموحد (مُوسَّط مع النقطة الذهبية) ─── */}
          <div className="relative flex flex-col items-center text-center gap-4 pb-5 border-b border-[#2D6A3F]/10">

            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A3D24] tracking-tight flex items-center justify-center gap-2">
                <span>آراء زبنائنا بمدينة فاس</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] inline-block shrink-0" />
              </h2>

              <p className="text-sm sm:text-base text-[#3E4F43] font-bold leading-relaxed">
                تجارب حقيقية لعائلات تثق بجودة خضار وفواكه متجر خُضرة وتعتمد على التوصيل السريع يومياً.
              </p>
            </div>

            {/* شارة التقييم + زر المشاركة (مُوسَّط) */}
            <div className="flex items-center justify-center flex-wrap gap-3 shrink-0 w-full pt-1">

              <div className="inline-flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl border-2 border-[#2D6A3F]/20 shadow-xs">
                <span className="font-black text-[#EA580C] text-lg sm:text-xl tabular-nums leading-none">4.9</span>
                <div className="flex text-amber-400 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-[#3E4F43] font-black border-r border-[#2D6A3F]/20 pr-2.5 mr-0.5">
                  {reviews.length}+ تقييم معتمد
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="group inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] hover:from-[#377A4C] hover:to-[#22502F] text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer border-2 border-[#EAB308]/50"
              >
                <MessageSquarePlus className="w-4 h-4 text-[#F5D76E] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                <span>شاركنا تجربتك</span>
                <Sparkles className="w-3.5 h-3.5 text-[#F5D76E]/80" />
              </button>

            </div>

          </div>

          {/* ─── 2. شبكة وبطاقات التقييمات (مطابقة تماماً لحجم الصناديق) ─── */}
          <div className="relative pt-5">
            <div
              ref={reviewsScrollRef}
              onScroll={handleScroll}
              className="flex flex-row md:grid md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 px-1 md:px-0 snap-x snap-mandatory md:snap-none overscroll-x-contain no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {displayedReviews.map((rev, idx) => {
                const isActive = activeReviewIndex === idx;
                const isPulsing = pulsingIndex === idx;

                return (
                  <article
                    key={rev.id}
                    onClick={() => scrollToReview(idx)}
                    className={`group/rev relative w-[72vw] max-w-[260px] sm:w-[270px] md:w-auto md:max-w-none shrink-0 snap-center rounded-2xl border-2 transition-all duration-300 md:hover:-translate-y-1 p-4 sm:p-5 text-center flex flex-col justify-between overflow-hidden cursor-pointer active:scale-[0.98] ${
                      isActive
                        ? 'bg-white border-[#EAB308] shadow-[0_8px_24px_rgba(234,179,8,0.20)] md:hover:shadow-[0_12px_28px_rgba(234,179,8,0.25)]'
                        : 'bg-[#FAF6EE] border-[#EAB308]/30 hover:border-[#EAB308]/60 hover:bg-white shadow-xs md:hover:shadow-[0_10px_24px_rgba(234,179,8,0.14)]'
                    }`}
                  >
                    {/* شريط الوميض البصري عند المس والتحويم */}
                    <div className="review-sheen-sweep" />

                    <div className="w-full flex flex-col items-center relative z-10">
                      {/* الأفاتار بحجم متناسق */}
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#2D6A3F] to-[#1A3D24] border-2 border-[#EAB308]/50 text-[#F5D76E] font-black text-xl flex items-center justify-center shadow-md shrink-0 group-hover/rev:scale-105 transition-transform mb-2.5">
                        {rev.author.trim().charAt(0) || 'خ'}
                      </div>

                      {/* الاسم والتحقق */}
                      <div className="flex items-center justify-center gap-1.5 flex-wrap mb-1">
                        <h3 className="text-sm sm:text-base font-black text-[#1A3D24] leading-snug">
                          {rev.author}
                        </h3>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
                            <span>موثق</span>
                          </span>
                        )}
                      </div>

                      {/* الحي / الموقع */}
                      <p className="text-[11px] sm:text-xs text-[#3E4F43] font-bold flex items-center justify-center gap-1.5 mb-2.5">
                        <MapPin className="w-3.5 h-3.5 text-[#EA580C] shrink-0" strokeWidth={2.5} />
                        <span>{rev.neighborhood}</span>
                      </p>

                      {/* النجوم */}
                      <div className="flex text-amber-400 gap-0.5 shrink-0 mb-2.5" aria-label={`تقييم ${rev.rating} من 5 نجوم`}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                              i < rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-stone-200 text-stone-200'
                            }`}
                          />
                        ))}
                      </div>

                      {/* نص التعليق */}
                      <p className="text-xs sm:text-sm text-[#1F2937] font-semibold leading-relaxed text-center px-1">
                        "{rev.comment}"
                      </p>
                    </div>

                    {/* تذييل البطاقة (مُوسَّط) */}
                    <div className="w-full pt-3 mt-3 border-t-2 border-[#2D6A3F]/10 flex items-center justify-center text-xs text-stone-500 gap-2 font-bold relative z-10">
                      <span>{rev.date || 'مؤخراً'}</span>
                      <span className="text-stone-300">•</span>
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmReview(rev);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-200 text-xs font-black transition-all cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" strokeWidth={2.5} />
                          <span>حذف</span>
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-black text-[11px]">
                          طلب مؤكد بفاس ✓
                        </span>
                      )}
                    </div>

                    {/* تأثير الوميض البصري للمركز النشط */}
                    {isPulsing && (
                      <div
                        className="review-focus-pulse absolute inset-0 rounded-2xl bg-[#EAB308]/15 pointer-events-none z-10"
                        aria-hidden="true"
                      />
                    )}
                  </article>
                );
              })}
            </div>

            {/* ═══════ مؤشرات التنقل وأسهم التوجيه الموحدة المكبرة ═══════ */}
            {displayedReviews.length > 1 && (
              <div className="flex md:hidden items-center justify-between pt-4 px-1">
                {/* نقاط التنقل */}
                <div className="flex items-center gap-1.5">
                  {displayedReviews.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => scrollToReview(i)}
                      className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                        activeReviewIndex === i
                          ? 'w-7 bg-[#2D6A3F]'
                          : 'w-2 bg-[#2D6A3F]/25 hover:bg-[#2D6A3F]/50'
                      }`}
                      aria-label={`تقييم ${i + 1}`}
                    />
                  ))}
                </div>

                {/* أسهم التمرير المكبرة الموحدة */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={scrollPrev}
                    disabled={activeReviewIndex === 0}
                    className="w-11 h-11 rounded-xl bg-white border-2 border-[#2D6A3F]/25 text-[#1A3D24] hover:bg-[#FAF6EE] hover:border-[#2D6A3F]/50 shadow-sm flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    aria-label="السابق"
                  >
                    <ChevronRight className="w-5 h-5 text-[#1A3D24]" strokeWidth={2.6} />
                  </button>
                  <button
                    type="button"
                    onClick={scrollNext}
                    disabled={activeReviewIndex >= displayedReviews.length - 1}
                    className="w-11 h-11 rounded-xl bg-white border-2 border-[#2D6A3F]/25 text-[#1A3D24] hover:bg-[#FAF6EE] hover:border-[#2D6A3F]/50 shadow-sm flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    aria-label="التالي"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#1A3D24]" strokeWidth={2.6} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── 3. الشريط السفلي: زر عرض المزيد (مُوسَّط) ─── */}
          {reviews.length > INITIAL_VISIBLE_COUNT && (
            <div className="mt-6 pt-5 border-t-2 border-[#2D6A3F]/10 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F3] border-2 border-[#2D6A3F]/25 text-[#1A3D24] text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                {showAllReviews ? (
                  <>
                    <ChevronUp className="w-4 h-4 text-[#2D6A3F]" strokeWidth={2.5} />
                    <span>عرض أقل</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 text-[#2D6A3F]" strokeWidth={2.5} />
                    <span>عرض باقي التقييمات ({reviews.length - INITIAL_VISIBLE_COUNT})</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ════════ النوافذ المنبثقة ════════ */}
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

export default CustomerReviews;
