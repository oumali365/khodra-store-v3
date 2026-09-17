import React, { useEffect } from 'react';
import { LogOut, ShoppingBag, ArrowRight, ShieldCheck, Sparkles, HeartHandshake } from 'lucide-react';
import { STORE_CONFIG } from '../data/config';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  cartCount: number;
  cartTotal: number;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
  cartCount,
  cartTotal,
}) => {
  // إغلاق بمفتاح Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // منع تمرير الصفحة بالخلفية
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="exit-confirmation-dialog"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
    >
      {/* الخلفية المعتمة */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* بطاقة التأكيد */}
      <div className="relative bg-[#FAF8F4] border-2 border-[#E8E1D3] w-full max-w-md rounded-[28px] shadow-2xl z-10 overflow-hidden text-right p-5 sm:p-6 animate-in zoom-in-95 duration-200">
        {/* الأيقونة العلوية */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#163920] to-[#0E2615] flex items-center justify-center shadow-lg border-2 border-[#F5D76E]/30 relative">
            <LogOut className="w-8 h-8 text-[#F5D76E] translate-x-0.5" />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#C25E12] border-2 border-[#FAF8F4] flex items-center justify-center text-white text-[11px] font-black">
              !
            </span>
          </div>
        </div>

        {/* العنوان والرسالة */}
        <div className="text-center mb-5">
          <h2
            id="exit-modal-title"
            className="text-xl sm:text-2xl font-black text-[#112616] tracking-tight mb-2 font-['Almarai']"
          >
            هل تريد الخروج من التطبيق؟
          </h2>
          <p className="text-xs sm:text-sm text-[#524B3E] font-medium leading-relaxed font-['Tajawal']">
            يسعدنا دائماً وجودك معنا في متجر خُضرة وخدمتك بأفضل المنتجات الطازجة في فاس والنواحي.
          </p>
        </div>

        {/* بطاقة حالة السلة في حال وجود منتجات */}
        {cartCount > 0 ? (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 text-right">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <span className="text-xs font-black text-emerald-950">
                لديك {cartCount} {cartCount === 1 ? 'منتج' : 'منتجات'} في سلتك
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-800 font-bold leading-relaxed pr-9.5">
              المجموع: <span className="font-black text-[#C25E12]">{cartTotal.toFixed(2)} {STORE_CONFIG.currency}</span> — سلتك ستبقى محفوظة تلقائياً للعودة في أي وقت!
            </p>
          </div>
        ) : (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#F5D76E]/40 text-[#C25E12] flex items-center justify-center shrink-0 font-black text-base">
              🌿
            </span>
            <p className="text-xs text-amber-950 font-medium">
              الخضار والفواكه الطازجة متوفرة يومياً مع التوصيل السريع لباب بيتك.
            </p>
          </div>
        )}

        {/* أزرار الإجراءات */}
        <div className="space-y-2.5">
          {/* الزر الرئيسي: البقاء ومتابعة التسوق */}
          <button
            type="button"
            id="exit-modal-stay-btn"
            onClick={onClose}
            className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#1E4D2B] hover:to-[#12331C] text-white font-black text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-[#0E2615]"
          >
            <Sparkles className="w-4 h-4 text-[#F5D76E]" />
            <span>متابعة التسوق والبقاء بالمتجر</span>
          </button>

          {/* الزر الثانوي: تأكيد الخروج */}
          <button
            type="button"
            id="exit-modal-confirm-exit-btn"
            onClick={onConfirmExit}
            className="w-full min-h-[46px] py-2.5 px-5 rounded-2xl bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-800 font-bold text-xs sm:text-sm border border-stone-300 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4 text-stone-500" />
            <span>نعم، الخروج من التطبيق</span>
          </button>
        </div>

        {/* شارة تطمين سفلية */}
        <div className="mt-4 pt-3 border-t border-stone-200/70 flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>بياناتك وسلتك محفوظة ومؤمنة دائماً</span>
        </div>
      </div>
    </div>
  );
};
