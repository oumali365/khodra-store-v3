import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Star, 
  BadgeCheck, 
  MapPin, 
  MessageSquarePlus, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Send,
  ChevronDown,
  ChevronUp,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  Loader2,
  Package,
  ShoppingBag
} from 'lucide-react';
import { STORE_CONFIG } from '../data/config';
import {
  fetchReviews,
  submitCustomerReview,
  deleteCustomerReview,
  fetchPendingOrdersCount,
} from '../services/supabaseService';
import { AdminOrdersPanel } from './AdminOrdersPanel';

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

  // ─── Orders panel + badge count ───
  const [isOrdersPanelOpen, setIsOrdersPanelOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  const getAdminPin = (): string => {
    try {
      return localStorage.getItem('khodra_admin_pin') || STORE_CONFIG.adminPin || '1234';
    } catch {
      return '1234';
    }
  };

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await fetchPendingOrdersCount();
      setPendingOrdersCount(count);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setPendingOrdersCount(0);
      return;
    }

    refreshPendingCount();

    const interval = setInterval(() => {
      refreshPendingCount();
    }, 60000);

    return () => clearInterval(interval);
  }, [isAdmin, refreshPendingCount]);

  const handleCloseOrdersPanel = useCallback(() => {
    setIsOrdersPanelOpen(false);
    refreshPendingCount();
  }, [refreshPendingCount]);

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
              (init) => !deleted.includes(init.id) && !formatted.some((f) => f.id === init.id || f.author === init.author)
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
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
      } catch {
        // Ignore
      }
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(null);
      setAdminNotification('مرحباً بك! تم تفعيل وضع المدير. يمكنك الآن حذف التعليقات أو إدارة الطلبات.');
      setTimeout(() => setAdminNotification(null), 4000);

      setTimeout(() => {
        const el = document.getElementById('customer-reviews-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    } else {
      setPinError('الرمز السري غير صحيح، يرجى التأكد والمحاولة مجدداً.');
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    setPendingOrdersCount(0);
    try {
      sessionStorage.removeItem('khodra_admin_auth');
    } catch {
      // Ignore
    }
    setAdminNotification('تم تسجيل الخروج من وضع المدير.');
    setTimeout(() => setAdminNotification(null), 3000);
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinInput.trim() || newPinInput.trim().length < 4) {
      return;
    }
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
    } catch {
      // Ignore
    }
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-12" id="customer-reviews-section">
      <div className="bg-[#FAF8F4] border border-[#D4C8B5] rounded-3xl p-4 sm:p-8 shadow-sm text-center relative">

        {/* إشعار إداري */}
        {adminNotification && (
          <div className="mb-6 py-3 px-5 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-between gap-3 animate-in fade-in duration-200 text-right max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{adminNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminNotification(null)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── شريط المدير ─── */}
        {isAdmin && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-right shadow-sm max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C25E12] shrink-0" />
              <span>
                <strong>وضع المدير مفعّل:</strong> يمكنك إدارة الطلبات وحذف أي تعليق غير لائق.
              </span>
            </div>
            <div className="flex items-center gap-2 mr-auto flex-wrap">
              <button
                type="button"
                onClick={() => setIsOrdersPanelOpen(true)}
                className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-[#1E4327] to-[#2E5336] hover:from-[#112616] hover:to-[#1E4327] text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 text-[#F5D76E]" />
                <span>إدارة الطلبات</span>

                {pendingOrdersCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black border-2 border-white shadow-md animate-pulse">
                    {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsChangePinModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                <span>تغيير الرمز السري</span>
              </button>
              <button
                type="button"
                onClick={handleLogoutAdmin}
                className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
              >
                خروج من الإدارة
              </button>
            </div>
          </div>
        )}

        {/* ─── الرأس ─── */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-[#1E4327] text-xs font-black mb-3 shadow-sm select-none">
            <Sparkles className="w-4 h-4 text-[#2E5336]" />
            <span>تجارب حقيقية</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#112616] mb-3 font-['Almarai']">
            آراء زبنائنا بمدينة فاس
          </h2>

          <div className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-full border border-[#D4C8B5] shadow-sm text-xs font-bold text-[#112616] select-none">
            <span className="font-black text-[#C25E12] text-base">4.9</span>
            <div className="flex text-amber-500 text-sm">★★★★★</div>
            <span className="text-[#524B3E] font-medium border-r border-[#E8E1D3] pr-3 mr-1">
              استناداً إلى تقييمات الزبناء
            </span>
          </div>
        </div>

        {/* ─── شبكة البطاقات ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 text-right max-w-5xl mx-auto">
          {displayedReviews.map((rev) => (
            <article
              key={rev.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                isAdmin ? 'border-amber-300 ring-2 ring-amber-100' : 'border-[#D4C8B5] hover:border-[#C25E12] hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1E4327] text-white font-black text-sm flex items-center justify-center shrink-0 select-none shadow-sm">
                      {rev.author.charAt(0)}
                    </div>
                    <div className="leading-tight">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black text-[#112616]">
                          {rev.author}
                        </h3>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200 select-none">
                            <BadgeCheck className="w-3 h-3 text-emerald-600" />
                            <span>طلب مؤكد</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#524B3E] font-medium flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-[#C25E12]" />
                        <span>{rev.neighborhood}</span>
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#787163] font-medium shrink-0 bg-stone-50 px-2 py-0.5 rounded-full">
                    {rev.date}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 mb-3" aria-label={`تقييم ${rev.rating} من 5 نجوم`}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rev.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm text-[#2D271E] font-medium leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C25E12]" />
                    <span>إدارة التعليق:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmReview(rev)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all cursor-pointer active:scale-95 touch-manipulation"
                    title="حذف هذا التعليق نهائياً"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>حذف التعليق</span>
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* ─── زر قراءة المزيد ─── */}
        {reviews.length > INITIAL_VISIBLE_COUNT && (
          <div className="mt-6 pt-2">
            <button
              type="button"
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-white border border-[#D4C8B5] hover:bg-[#F7F4EC] text-[#1E4327] text-xs font-black transition-all cursor-pointer touch-manipulation select-none active:scale-95 shadow-sm"
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

        {/* ─── الأسفل ─── */}
        <div className="mt-8 pt-5 border-t border-[#EAE2D2] flex flex-col sm:flex-row items-center justify-between gap-4 text-right max-w-5xl mx-auto">
          <p className="text-xs text-[#524B3E] font-medium">
            هل تسوقت من متجر خُضرة مؤخراً؟ يسعدنا دائماً الاستماع إلى رأيك واقتراحاتك.
          </p>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#A34C0B] hover:to-[#7A3604] text-white font-black text-xs shadow-sm active:scale-95 transition-all cursor-pointer touch-manipulation select-none"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>إضافة تقييم</span>
            </button>

            <a
              href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}?text=${encodeURIComponent('السلام عليكم فريق متجر خُضرة، أود مشاركة رأيي معكم:')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#145A25] border border-emerald-300 text-xs font-black transition-all cursor-pointer active:scale-95 touch-manipulation select-none"
            >
              واتساب مباشر
            </a>
          </div>
        </div>

      </div>

      {/* ─── نافذة إضافة الرأي ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => !isSubmitting && setIsModalOpen(false)} />

          <div className="relative bg-white border border-[#D4C8B5] rounded-3xl w-full max-w-md shadow-2xl z-50 overflow-hidden p-6 text-right animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D3] mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1E4327] text-white flex items-center justify-center">
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-[#112616]">
                  مشاركة تجربتك مع متجر خُضرة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] flex items-center justify-center transition-colors active:scale-90 touch-manipulation cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSuccessAlert ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h4 className="text-base font-black text-[#112616]">شكراً لك على تقييمك القيّم!</h4>
                <p className="text-xs text-[#524B3E]">تم حفظ تقييمك في قاعدة البيانات بنجاح.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#112616] mb-1.5">
                    الاسم الكامل أو اللقب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: سارة الإدريسي"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D4C8B5] text-sm bg-white focus:outline-none focus:border-[#1E4327] text-[#112616] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#112616] mb-1.5">
                    الحي بمدينة فاس
                  </label>
                  <input
                    type="text"
                    value={newNeighborhood}
                    onChange={(e) => setNewNeighborhood(e.target.value)}
                    placeholder="مثال: طريق إيموزار، الأطلس، طريق عين الشقف، النرجس..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D4C8B5] text-sm bg-white focus:outline-none focus:border-[#1E4327] text-[#112616] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#112616] mb-1.5">
                    التقييم
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95 touch-manipulation select-none"
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
                    <span className="text-xs font-bold text-[#524B3E] mr-2">
                      ({newRating} من 5)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#112616] mb-1.5">
                    تعليقك <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="شاركنا رأيك في طراوة المنتجات، التوصيل، أو طريقة التعامل..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D4C8B5] text-sm bg-white focus:outline-none focus:border-[#1E4327] text-[#112616] transition-colors resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 min-h-[44px] rounded-xl bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#A34C0B] hover:to-[#7A3604] text-white font-black text-sm shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'جاري النشر...' : 'نشر التقييم'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    className="py-3 px-5 min-h-[44px] rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] font-bold text-sm transition-colors cursor-pointer active:scale-95 touch-manipulation select-none"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ─── PIN Modal ─── */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsPinModalOpen(false)} />

          <div className="relative bg-white border border-amber-300 rounded-3xl w-full max-w-sm shadow-2xl z-50 overflow-hidden p-6 text-right animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D3] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#C25E12] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#112616]">
                    إدارة المتجر
                  </h3>
                  <p className="text-[11px] text-stone-500">خاص بمدير المتجر فقط</p>
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

            <form onSubmit={handlePinSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#112616] mb-2">
                  أدخل الرمز السري (PIN):
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
                  className="w-full text-center text-xl font-black tracking-widest px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C25E12] focus:ring-2 focus:ring-[#C25E12]/20 transition-all"
                />
                {pinError && (
                  <p className="text-red-600 text-xs font-bold mt-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#A34C0B] hover:to-[#7A3604] text-white font-black text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  تأكيد الدخول
                </button>
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Change PIN Modal ─── */}
      {isChangePinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsChangePinModalOpen(false)} />

          <div className="relative bg-white border border-stone-300 rounded-3xl w-full max-w-sm shadow-2xl z-50 overflow-hidden p-6 text-right animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D3] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-[#112616]">
                  تغيير الرمز السري للمدير
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePinModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {changePinSuccess ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-black text-emerald-800">تم حفظ الرمز السري الجديد بنجاح!</p>
              </div>
            ) : (
              <form onSubmit={handleChangePinSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#112616] mb-2">
                    الرمز السري الجديد (4 أرقام أو أكثر):
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    minLength={4}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="مثال: 5678"
                    className="w-full text-center text-xl font-black tracking-widest px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C25E12] focus:ring-2 focus:ring-[#C25E12]/20 transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#A34C0B] hover:to-[#7A3604] text-white font-black text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    حفظ الرمز الجديد
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangePinModalOpen(false)}
                    className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── Delete Review Confirmation ─── */}
      {deleteConfirmReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => !isDeleting && setDeleteConfirmReview(null)} />

          <div className="relative bg-white border border-red-300 rounded-3xl w-full max-w-sm shadow-2xl z-50 overflow-hidden p-6 text-right animate-in zoom-in-95 duration-200 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="font-black text-base text-[#112616] text-center mb-2">
              تأكيد حذف التعليق
            </h3>
            <p className="text-sm text-stone-500 text-center mb-5">
              هل أنت متأكد من رغبتك في حذف تعليق <strong className="text-stone-800">"{deleteConfirmReview.author}"</strong> نهائياً من المتجر؟
            </p>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 mb-5 text-sm text-stone-700 italic text-center">
              "{deleteConfirmReview.comment}"
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>نعم، حذف نهائي</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmReview(null)}
                className="py-3 px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm cursor-pointer active:scale-95 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── لوحة إدارة الطلبات ─── */}
      <AdminOrdersPanel
        isOpen={isOrdersPanelOpen}
        onClose={handleCloseOrdersPanel}
        onOrdersChange={({ pending }) => setPendingOrdersCount(pending)}
      />

    </section>
  );
};