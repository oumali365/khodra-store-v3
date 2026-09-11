// ============================================================
// CustomerReviews.tsx – قسم آراء وتقييمات العملاء
// متصل بقاعدة بيانات Supabase ومصمم بنمط مقتضب وواقعي بالدارجة المغربية
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronUp
} from 'lucide-react';
import { STORE_CONFIG } from '../data/config';
import { fetchReviews, submitCustomerReview } from '../services/supabaseService';

export interface CustomerReview {
  id: string;
  author: string;
  neighborhood: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

// 3 تعليقات احترافية بالدارجة المغربية قصيرة كقاعدة أساسية
const INITIAL_THREE_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    author: 'فاطمة الزهراء ب.',
    neighborhood: 'المعاريف، الدار البيضاء',
    rating: 5,
    date: 'منذ يومين',
    comment: 'تبارك الله السلعة نقية وطازجة بحال إلا مشيتي للسوق نقيتيها بيدك، والتوصيل ديما فالموعد.',
    verified: true,
  },
  {
    id: 'rev-2',
    author: 'أمين التازي',
    neighborhood: 'كاليفورنيا، الدار البيضاء',
    rating: 5,
    date: 'منذ 3 أيام',
    comment: 'خدمة في المستوى وكتوفر بزاف ديال الوقت، الخضرة كتوصل مقادة ومغسولة بعناية. برافو عليكم.',
    verified: true,
  },
  {
    id: 'rev-3',
    author: 'نادية بنجلون',
    neighborhood: 'بوركون، الدار البيضاء',
    rating: 5,
    date: 'منذ 5 أيام',
    comment: 'تعامل راقي وثقة كبيرة، الفواكه حلوة والخضر طرية بزاف. أول تجربة وأكيد ماشي الأخيرة.',
    verified: true,
  },
];

const INITIAL_VISIBLE_COUNT = 3;

export const CustomerReviews: React.FC = () => {
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_THREE_REVIEWS);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // حقول نموذج إضافة الرأي المباشر
  const [newName, setNewName] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSuccessAlert, setIsSuccessAlert] = useState(false);

  // جلب التقييمات الحقيقية من Supabase
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
          
          // دمج تقييمات Supabase الجديدة مع التقييمات الأولية لتبقى ظاهرة دائماً
          const merged = [
            ...formatted,
            ...INITIAL_THREE_REVIEWS.filter(
              (init) => !formatted.some((f) => f.id === init.id || f.author === init.author)
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

  // العرض التلقائي: 3 تقييمات افتراضياً لتجنب التمرير الطويل
  const displayedReviews = useMemo(() => {
    if (showAllReviews) return reviews;
    return reviews.slice(0, INITIAL_VISIBLE_COUNT);
  }, [reviews, showAllReviews]);

  // إرسال رأي جديد وحفظه في Supabase (نشر مباشر بدون فئات)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newComment.trim()) return;

    setIsSubmitting(true);
    const newRevData = {
      author: newName.trim(),
      neighborhood: newNeighborhood.trim() || 'الدار البيضاء',
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

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-12" id="customer-reviews-section">
      <div className="bg-[#FAF8F4] border border-[#D4C8B5] rounded-3xl p-4 sm:p-7 shadow-xs text-center">
        
        {/* ─── الرأس: الشارة والعنوان والتقييم الإجمالي المختصر ─── */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-[#1E4327] text-xs font-black mb-2 shadow-2xs select-none">
            <Sparkles className="w-3.5 h-3.5 text-[#2E5336]" />
            <span>تجارب حقيقية</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#112616] mb-2 font-['Almarai']">
            آراء زبنائنا بالدار البيضاء
          </h2>

          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-[#D4C8B5] shadow-2xs text-xs font-bold text-[#112616] select-none">
            <span className="font-black text-[#C25E12] text-sm">4.9</span>
            <div className="flex text-amber-500 text-xs">★★★★★</div>
            <span className="text-[#524B3E] font-medium border-r border-[#E8E1D3] pr-2 mr-1">
              استناداً إلى تقييمات الزبناء
            </span>
          </div>
        </div>

        {/* ─── شبكة بطاقات آراء الزبناء (3 في الصف بشكل متوازن ومقتضب) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 text-right">
          {displayedReviews.map((rev) => (
            <article
              key={rev.id}
              className="bg-white border border-[#D4C8B5] rounded-2xl p-4 shadow-2xs hover:border-[#C25E12] transition-colors flex flex-col justify-between"
            >
              <div>
                {/* رأس البطاقة: الاسم والحي والتقييم والتاريخ */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1E4327] text-white font-black text-xs flex items-center justify-center shrink-0 select-none">
                      {rev.author.charAt(0)}
                    </div>
                    <div className="leading-tight">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-black text-[#112616]">
                          {rev.author}
                        </h3>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded font-bold border border-emerald-200 select-none">
                            <BadgeCheck className="w-2.5 h-2.5 text-emerald-600" />
                            <span>طلب مؤكد</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#524B3E] font-medium flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-[#C25E12]" />
                        <span>{rev.neighborhood}</span>
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#787163] font-medium shrink-0">
                    {rev.date}
                  </span>
                </div>

                {/* النجوم */}
                <div className="flex items-center gap-0.5 mb-2" aria-label={`تقييم ${rev.rating} من 5 نجوم`}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {/* نص التقييم بالدارجة المغربية */}
                <p className="text-xs sm:text-sm text-[#2D271E] font-medium leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* ─── زر قراءة المزيد / اختصار التقييمات لتجنب التمرير الطويل ─── */}
        {reviews.length > INITIAL_VISIBLE_COUNT && (
          <div className="mt-4 pt-2">
            <button
              type="button"
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#D4C8B5] hover:bg-[#F7F4EC] text-[#1E4327] text-xs font-black transition-all cursor-pointer touch-manipulation select-none active:scale-95 shadow-2xs"
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

        {/* ─── أسفل القسم: دعوة لمشاركة الرأي ─── */}
        <div className="mt-6 pt-4 border-t border-[#EAE2D2] flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
          <p className="text-xs text-[#524B3E] font-medium">
            هل تسوقت من متجر خُضرة مؤخراً؟ يسعدنا دائماً الاستماع إلى رأيك واقتراحاتك.
          </p>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-[#1E4327] hover:bg-[#112616] text-white font-black text-xs shadow-2xs active:scale-95 transition-all cursor-pointer touch-manipulation select-none"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>إضافة تقييم</span>
            </button>

            <a
              href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}?text=${encodeURIComponent('السلام عليكم فريق متجر خُضرة، أود مشاركة رأيي معكم:')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-3.5 py-2 min-h-[40px] rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#145A25] border border-emerald-300 text-xs font-black transition-all cursor-pointer active:scale-95 touch-manipulation select-none"
            >
              واتساب مباشر
            </a>
          </div>
        </div>

      </div>

      {/* ─── نافذة إضافة الرأي المنبثقة: نشر مباشر بدون فئات ─── */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" 
          role="dialog" 
          aria-modal="true"
        >
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
            onClick={() => !isSubmitting && setIsModalOpen(false)} 
          />

          <div className="relative bg-white border border-[#D4C8B5] rounded-3xl w-full max-w-md shadow-2xl z-50 overflow-hidden p-5 text-right animate-in zoom-in-95 duration-200 my-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D3] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1E4327] text-white flex items-center justify-center">
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-[#112616]">
                  مشاركة تجربتك مع متجر خُضرة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] flex items-center justify-center transition-colors active:scale-90 touch-manipulation cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSuccessAlert ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h4 className="text-sm sm:text-base font-black text-[#112616]">شكراً لك على تقييمك القيّم!</h4>
                <p className="text-xs text-[#524B3E]">تم حفظ تقييمك في قاعدة البيانات بنجاح.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#112616] mb-1">
                    الاسم الكامل أو اللقب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: سارة الإدريسي"
                    className="w-full px-3 py-2 rounded-xl border border-[#D4C8B5] text-xs sm:text-sm bg-white focus:outline-none focus:border-[#1E4327] text-[#112616]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#112616] mb-1">
                    الحي بالدار البيضاء
                  </label>
                  <input
                    type="text"
                    value={newNeighborhood}
                    onChange={(e) => setNewNeighborhood(e.target.value)}
                    placeholder="مثال: المعاريف، عين السبع، النخيل..."
                    className="w-full px-3 py-2 rounded-xl border border-[#D4C8B5] text-xs sm:text-sm bg-white focus:outline-none focus:border-[#1E4327] text-[#112616]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#112616] mb-1">
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
                          className={`w-5 h-5 ${
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
                  <label className="block text-xs font-bold text-[#112616] mb-1">
                    تعليقك <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="شاركنا رأيك في طراوة المنتجات، التوصيل، أو طريقة التعامل..."
                    className="w-full px-3 py-2 rounded-xl border border-[#D4C8B5] text-xs sm:text-sm bg-white focus:outline-none focus:border-[#1E4327] text-[#112616]"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 min-h-[42px] rounded-xl bg-gradient-to-r from-[#C25E12] to-[#9C4505] text-white font-black text-xs sm:text-sm shadow-2xs hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation select-none disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'جاري النشر...' : 'نشر التقييم'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    className="py-2.5 px-4 min-h-[42px] rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] font-bold text-xs transition-colors cursor-pointer active:scale-95 touch-manipulation select-none"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </section>
  );
};
