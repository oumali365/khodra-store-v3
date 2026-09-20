// ============================================================
// الملف: CheckoutSecuritySubmit.tsx
// مكوّن أنظمة الأمان (Turnstile, Cooldown, RateLimit) وزر التأكيد
// ============================================================
import React from 'react';
import {
  Clock,
  ShieldAlert,
  AlertCircle,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import { TurnstileWidget } from '../TurnstileWidget';

interface CheckoutSecuritySubmitProps {
  isSubmitting: boolean;
  cooldown: { inCooldown: boolean; remainingFormatted?: string };
  rateLimit: { allowed: boolean; remaining?: number };
  errors: Record<string, string>;
  grandTotal: number;
  onTurnstileVerify: (token: string) => void;
}

export const CheckoutSecuritySubmit: React.FC<CheckoutSecuritySubmitProps> = ({
  isSubmitting,
  cooldown,
  rateLimit,
  errors,
  grandTotal,
  onTurnstileVerify,
}) => {
  return (
    <div className="pt-3 border-t-2 border-[#F0E9DA] space-y-3">
      {/* 6️⃣ التحقق الأمني ضد البوتات (Cloudflare Turnstile) */}
      <TurnstileWidget onVerify={onTurnstileVerify} />

      {/* 3️⃣ تنبيه فترة التهدئة (Cooldown) */}
      {cooldown.inCooldown && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-bold flex items-start gap-2.5">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-0.5">
            <p className="font-black text-amber-950 text-sm">
              تحقق أمني بسيط ({cooldown.remainingFormatted})
            </p>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              لحمايتك وتفادي تكرار تسجيل نفس الطلب، يُرجى الانتظار حتى انتهاء العد التنازلي، أو تواصل معنا عبر واتساب إذا أردت تعديل طلبك السابق.
            </p>
          </div>
        </div>
      )}

      {/* 4️⃣ تنبيه تجاوز معدل الطلبات (3 طلبات / ساعة) */}
      {!rateLimit.allowed && (
        <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 text-xs font-bold flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-black text-red-950 text-sm">
              بلغت الحد الأقصى (3 طلبات خلال ساعة)
            </p>
            <p className="text-red-800 text-[11px] leading-relaxed">
              لحماية المتجر من الطلبات المتكررة، تم منع إرسال طلبك الجديد مؤقتاً. سيعود الطلب للعمل بعد دقيقة، أو يمكنك التواصل معنا عبر واتساب للمساعدة.
            </p>
          </div>
        </div>
      )}

      {/* رسائل الخطأ العامة */}
      {errors.security && (
        <div className="p-3 rounded-xl bg-red-100/80 border border-red-300 text-red-800 text-xs font-black flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errors.security}</span>
        </div>
      )}

      {errors.cart && (
        <div className="p-3 rounded-xl bg-red-100/80 border border-red-300 text-red-800 text-xs font-black flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errors.cart}</span>
        </div>
      )}

      {/* 1️⃣ زر التأكيد مع تعطيل فوري ومؤشر تحميل */}
      <button
        type="submit"
        disabled={isSubmitting || cooldown.inCooldown || !rateLimit.allowed}
        className="w-full min-h-[56px] py-4 px-4 rounded-2xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white font-black text-base shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer border-2 border-[#0E2615]"
      >
        {isSubmitting ? (
          <>
            <span className="w-5 h-5 border-2 border-[#F5D76E] border-t-transparent rounded-full animate-spin" />
            <span>جارٍ التحقق وتأكيد الطلب بأمان...</span>
          </>
        ) : cooldown.inCooldown ? (
          <>
            <Clock className="w-5 h-5 text-amber-300" />
            <span>يرجى الانتظار ({cooldown.remainingFormatted})</span>
          </>
        ) : !rateLimit.allowed ? (
          <>
            <ShieldAlert className="w-5 h-5 text-red-300" />
            <span>تجاوزت الحد المسموح (3/ساعة)</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-5 h-5 text-[#F5D76E]" />
            <span>تأكيد الطلب</span>
            <span className="px-3 py-1 rounded-xl bg-white/15 text-[#F5D76E] text-sm font-black tabular-nums">
              {grandTotal.toFixed(2)} DH
            </span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#787163] font-bold">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>نظام حماية الطلبات مُفعل</span>
      </div>
    </div>
  );
};
