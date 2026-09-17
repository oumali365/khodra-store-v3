import React from 'react';
import { ShoppingBag, ArrowRight, RefreshCw, Leaf, CheckCircle2, PhoneCall } from 'lucide-react';
import { STORE_CONFIG } from '../data/config';

interface ExitScreenProps {
  onReenter: () => void;
  cartCount: number;
  cartTotal: number;
}

export const ExitScreen: React.FC<ExitScreenProps> = ({ onReenter, cartCount, cartTotal }) => {
  const handleCloseTab = () => {
    try {
      window.close();
    } catch {
      // ignore
    }
    // fallback attempt back navigation
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div
      id="app-exit-screen"
      className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-4 text-right selection:bg-[#F5D76E] selection:text-[#112616] font-['Tajawal']"
    >
      <div className="w-full max-w-lg bg-white rounded-[32px] border-2 border-[#E8E1D3] shadow-2xl p-6 sm:p-8 text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
        {/* خلفية تجميلية خفيفة */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#163920]/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-[#F5D76E]/20 blur-2xl pointer-events-none" />

        {/* الشعار */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#163920] to-[#0E2615] mx-auto flex items-center justify-center shadow-xl border-2 border-[#F5D76E]/30 mb-5">
          <Leaf className="w-10 h-10 text-[#F5D76E]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#112616] tracking-tight mb-2 font-['Almarai']">
          شكراً لزيارتك متجر خُضرة
        </h1>

        <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
          نتمنى لك يوماً طيباً ومباركاً.
        </p>

        {/* تنبيه السلة المحفوظة */}
        {cartCount > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-right flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-emerald-950">
                سلتك ({cartCount} منتجات بقيمة {cartTotal.toFixed(2)} {STORE_CONFIG.currency}) محفوظة بأمان
              </p>
              <p className="text-[11px] text-emerald-800 font-medium">
                يمكنك العودة في أي وقت لإكمال طلبك بنقرة واحدة!
              </p>
            </div>
          </div>
        )}

        {/* أزرار العودة والإغلاق */}
        <div className="space-y-3">
          <button
            type="button"
            id="reenter-store-btn"
            onClick={onReenter}
            className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#1E4D2B] hover:to-[#12331C] text-white font-black text-base shadow-lg hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-[#0E2615]"
          >
            <RefreshCw className="w-5 h-5 text-[#F5D76E]" />
            <span>العودة إلى المتجر ومتابعة التسوق</span>
          </button>
        </div>

        {/* خدمة الزبناء عبر واتساب */}
        <div className="mt-6 pt-5 border-t border-stone-200/80 flex items-center justify-center gap-2 text-xs text-stone-500 font-bold">
          <PhoneCall className="w-3.5 h-3.5 text-[#C25E12]" />
          <span>خدمة الزبناء: {STORE_CONFIG.whatsappNumber} (فاس والنواحي)</span>
        </div>
      </div>
    </div>
  );
};
