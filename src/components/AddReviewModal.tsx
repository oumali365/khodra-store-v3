import React, { useState } from 'react';
import { MessageSquarePlus, X, CheckCircle2, Star, Send } from 'lucide-react';

interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: {
    author: string;
    neighborhood: string;
    rating: number;
    comment: string;
  }) => Promise<void>;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessAlert, setIsSuccessAlert] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        author: name.trim(),
        neighborhood: neighborhood.trim() || 'فاس',
        rating,
        comment: comment.trim(),
      });
      setIsSuccessAlert(true);
      setTimeout(() => {
        setIsSuccessAlert(false);
        onClose();
        setName('');
        setNeighborhood('');
        setRating(5);
        setComment('');
      }, 1500);
    } catch {
      // handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
      />

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
            onClick={() => !isSubmitting && onClose()}
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
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-black text-[#112616] mb-1.5">
                الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
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
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-200 text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-black text-[#524B3E] mr-2">
                  ({rating}/5)
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
                value={comment}
                onChange={(e) => setComment(e.target.value)}
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
                onClick={onClose}
                className="py-3 px-4 min-h-[46px] rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] font-black text-sm transition-colors cursor-pointer active:scale-95"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
