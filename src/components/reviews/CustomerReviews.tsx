// ============================================================
// CustomerReviews.tsx – الإصدار 5.2
// تصميم موحد ومتكامل: توسيط مثالي للبطاقات + وضوح أعلى
// ============================================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
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

  // ─── التمرير الأفقي على الشاشات الصغيرة ───
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!reviewsScrollRef.current) return;
    const container = reviewsScrollRef.current;
    const scrollLeft = Math.abs(container.scrollLeft);
    const cardWidth = container.firstElementChild ? (container.firstElementChild as HTMLElement).clientWidth + 16 : 280;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveReviewIndex(index);
  };

  const scrollToReview = (idx: number) => {
    if (!reviewsScrollRef.current) return;
    const container = reviewsScrollRef.current;
    const card = container.children[idx] as HTMLElement;
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      setActiveReviewIndex(idx);
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
        <div className="relative bg-white border-2 border-[#2D6A3F]/15 rounded-3xl sm:rounded-[36px] shadow-[0_12px_36px_rgba(45,106,63,0.06)] p-5 sm:p-8 lg:p-10 overflow-hidden">

          {/* إضاءات خلفية ناعمة */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#EAB308]/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#2D6A3F]/5 rounded-full blur-3xl pointer-events-none" />

          {/* ─── 1. رأس القسم الموحد (مُوسَّط تماماً) ─── */}
          <div className="relative flex flex-col items-center text-center gap-5 pb-6 border-b border-[#2D6A3F]/10">

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
            <div className="flex items-center justify-center flex-wrap gap-3 shrink-0 w-full">

              <div className="inline-flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-2xl border-2 border-[#2D6A3F]/20 shadow-sm">
                <span className="font-black text-[#EA580C] text-xl tabular-nums leading-none">4.9</span>
                <div className="flex text-amber-400 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-[#3E4F43] font-black border-r border-[#2D6A3F]/20 pr-2.5 mr-0.5">
                  {reviews.length}+ تقييم معتمد
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] hover:from-[#377A4C] hover:to-[#22502F] text-white font-black text-sm shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer border-2 border-[#EAB308]/50"
              >
                <MessageSquarePlus className="w-4 h-4 text-[#F5D76E] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                <span>شاركنا تجربتك</span>
                <Sparkles className="w-3.5 h-3.5 text-[#F5D76E]/80" />
              </button>

            </div>

          </div>

          {/* ─── 2. شبكة عرض التقييمات (مُوسَّطة تماماً) ─── */}

          {/* على الشاشات المتوسطة والكبيرة (sm وأعلى): شبكة 3 أعمدة */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 pt-6">
            {displayedReviews.map((rev) => (
              <div
                key={rev.id}
                className="relative bg-white rounded-2xl border-2 border-[#2D6A3F]/15 hover:border-[#2D6A3F]/45 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between items-center text-center group"
              >
                <div className="w-full flex flex-col items-center">
                  {/* الأفاتار */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2D6A3F] to-[#1A3D24] border-2 border-[#EAB308]/50 text-[#F5D76E] font-black text-xl flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform mb-3">
                    {rev.author.trim().charAt(0) || 'خ'}
                  </div>

                  {/* الاسم والتحقق */}
                  <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-black text-[#1A3D24] leading-snug">
                      {rev.author}
                    </h3>
                    {rev.verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border-2 border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
                        <span>موثق</span>
                      </span>
                    )}
                  </div>

                  {/* الموقع */}
                  <p className="text-xs text-[#3E4F43] font-bold flex items-center justify-center gap-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[#EA580C] shrink-0" strokeWidth={2.5} />
                    <span>{rev.neighborhood}</span>
                  </p>

                  {/* النجوم */}
                  <div className="flex text-amber-400 gap-0.5 shrink-0 mb-3" aria-label={`تقييم ${rev.rating} من 5 نجوم`}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-stone-200 text-stone-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* نص التعليق */}
                  <p className="text-sm text-[#1F2937] font-semibold leading-relaxed text-center pt-2 pb-2 px-1">
                    "{rev.comment}"
                  </p>
                </div>

                {/* تذييل البطاقة (مُوسَّط) */}
                <div className="w-full pt-3 mt-2 border-t-2 border-stone-100 flex items-center justify-center text-xs text-stone-500 gap-2 font-bold">
                  <span>{rev.date || 'منذ يومين'}</span>
                  <span className="text-stone-300">•</span>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmReview(rev)}
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
              </div>
            ))}
          </div>

          {/* على شاشات الهاتف المحمول (< sm): شريط أفقي انسيابي */}
          <div className="sm:hidden pt-5">
            <div
              ref={reviewsScrollRef}
              onScroll={handleScroll}
              className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory no-scrollbar"
              style={{ scrollbarWidth: 'none' }}
            >
              {displayedReviews.map((rev, idx) => (
                <div
                  key={rev.id}
                  className="w-[85vw] max-w-[320px] shrink-0 snap-center bg-white rounded-2xl border-2 border-[#2D6A3F]/15 p-5 shadow-sm flex flex-col justify-between items-center text-center"
                >
                  <div className="w-full flex flex-col items-center">
                    {/* الأفاتار */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2D6A3F] to-[#1A3D24] text-[#F5D76E] font-black text-lg flex items-center justify-center shrink-0 border-2 border-[#EAB308]/50 mb-2.5">
                      {rev.author.trim().charAt(0) || 'خ'}
                    </div>

                    {/* الاسم والتحقق */}
                    <div className="flex items-center justify-center gap-1.5 flex-wrap mb-1">
                      <h3 className="text-sm font-black text-[#1A3D24] leading-snug">
                        {rev.author}
                      </h3>
                      {rev.verified && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
                      )}
                    </div>

                    {/* الموقع */}
                    <p className="text-[11px] text-[#3E4F43] font-bold flex items-center justify-center gap-1 mb-2.5">
                      <MapPin className="w-3 h-3 text-[#EA580C] shrink-0" strokeWidth={2.5} />
                      <span>{rev.neighborhood}</span>
                    </p>

                    {/* النجوم */}
                    <div className="flex text-amber-400 gap-0.5 mb-2.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* نص التعليق */}
                    <p className="text-xs text-[#1F2937] font-semibold leading-relaxed text-center py-1.5 px-1">
                      "{rev.comment}"
                    </p>
                  </div>

                  {/* تذييل البطاقة */}
                  <div className="w-full pt-3 mt-2 border-t-2 border-stone-100 flex items-center justify-center text-[11px] text-stone-500 gap-1.5 font-bold">
                    <span>{rev.date || 'مؤخراً'}</span>
                    <span className="text-stone-300">•</span>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmReview(rev)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 font-black border-2 border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" strokeWidth={2.5} />
                        <span>حذف</span>
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-black text-[10px]">طلب معتمد بفاس ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* نقاط التنقل وأسهم التوجيه */}
            {displayedReviews.length > 1 && (
              <div className="flex items-center justify-between pt-2 px-1">
                <div className="flex items-center gap-1.5">
                  {displayedReviews.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => scrollToReview(i)}
                      className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                        activeReviewIndex === i
                          ? 'w-6 bg-[#2D6A3F]'
                          : 'w-2 bg-[#2D6A3F]/25 hover:bg-[#2D6A3F]/50'
                      }`}
                      aria-label={`تقييم ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={scrollPrev}
                    disabled={activeReviewIndex === 0}
                    className="p-2 rounded-lg bg-white border-2 border-[#2D6A3F]/20 text-[#1A3D24] disabled:opacity-40 cursor-pointer"
                    aria-label="السابق"
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={scrollNext}
                    disabled={activeReviewIndex >= displayedReviews.length - 1}
                    className="p-2 rounded-lg bg-white border-2 border-[#2D6A3F]/20 text-[#1A3D24] disabled:opacity-40 cursor-pointer"
                    aria-label="التالي"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F3] border-2 border-[#2D6A3F]/25 text-[#1A3D24] text-sm font-black transition-all cursor-pointer active:scale-95 shadow-sm"
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