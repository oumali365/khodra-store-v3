import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { CustomerReview } from '../../data/initialReviews';

// ─── مودال إدخال الرمز السري (PIN) ───
interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<boolean> | boolean;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(pinInput);
    if (success) {
      setPinInput('');
      setPinError(null);
      onClose();
    } else {
      setPinError('الرمز السري غير صحيح! يرجى المحاولة مجدداً.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

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
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] font-black text-sm cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── مودال تغيير الرمز السري (Change PIN) ───
interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newPin: string) => Promise<boolean> | boolean;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [newPinInput, setNewPinInput] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length < 4) return;
    const ok = await onSubmit(newPinInput);
    if (ok) {
      setChangeSuccess(true);
      setTimeout(() => {
        setChangeSuccess(false);
        setNewPinInput('');
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

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
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {changeSuccess ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="text-sm font-black text-emerald-800">تم حفظ الرمز الجديد بنجاح!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] font-black text-sm cursor-pointer"
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

// ─── مودال تأكيد حذف التعليق (Delete Confirmation) ───
interface DeleteReviewModalProps {
  review: CustomerReview | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteReviewModal: React.FC<DeleteReviewModalProps> = ({
  review,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!review) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !isDeleting && onClose()}
      />

      <div className="relative bg-white border border-red-300 rounded-[24px] w-full max-w-sm shadow-2xl z-50 overflow-hidden p-6 text-right animate-in zoom-in-95 duration-200 my-auto">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="font-black text-base text-[#112616] text-center mb-2">
          تأكيد حذف التعليق
        </h3>
        <p className="text-xs text-[#787163] text-center mb-4 leading-relaxed">
          هل أنت متأكد من حذف تعليق{' '}
          <strong className="text-[#112616]">"{review.author}"</strong> نهائياً؟
          <br />
          <span className="text-red-600 font-black">سيختفي من جميع الأجهزة.</span>
        </p>

        <div className="bg-[#F7F4EC] p-3 rounded-xl border border-[#E8E1D3] mb-4 text-xs text-[#524B3E] italic text-center">
          "{review.comment}"
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
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
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#2D271E] font-black text-sm cursor-pointer active:scale-95 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
