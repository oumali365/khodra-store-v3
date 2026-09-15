// ============================================================
// الملف: StickyBottomBar.tsx – الإصدار 2.0
// شريط السلة السفلي العائم – تصميم محسّن
// ============================================================
import React from 'react';
import { ShoppingBag, ArrowLeft, Truck } from 'lucide-react';
import { STORE_CONFIG } from '../data/config';

interface StickyBottomBarProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenCheckout: () => void;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenCheckout,
}) => {
  // حساب التوصيل المجاني
  const isFreeDelivery = cartTotal >= STORE_CONFIG.freeDeliveryThreshold;
  const remainingForFree = Math.max(0, STORE_CONFIG.freeDeliveryThreshold - cartTotal);

  return (
    <div
      id="sticky-bottom-bar"
      className={`fixed bottom-0 inset-x-0 z-45 transition-all duration-300 pointer-events-none ${
        cartCount === 0
          ? 'translate-y-full opacity-0'
          : 'translate-y-0 opacity-100'
      }`}
    >
      {/* ─── البطاقة العائمة ─── */}
      <div className="w-full px-3 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-auto">
        <div className="relative max-w-7xl mx-auto bg-white/95 backdrop-blur-md border border-[#D4C8B5] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200">

          {/* ─── شريط علوي: تقدم التوصيل المجاني ─── */}
          <div className={`px-4 py-1.5 text-[11px] font-black flex items-center gap-1.5 border-b ${
            isFreeDelivery
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}>
            <Truck className={`w-3.5 h-3.5 shrink-0 ${isFreeDelivery ? 'text-emerald-600' : 'text-[#C25E12]'}`} />
            {isFreeDelivery ? (
              <span className="flex items-center gap-1">
                🎉 <strong className="text-emerald-700">مبروك!</strong> حصلت على توصيل مجاني
              </span>
            ) : (
              <span>
                أضف <strong className="text-[#C25E12]">{remainingForFree.toFixed(2)} {STORE_CONFIG.currency}</strong> للحصول على توصيل مجاني
              </span>
            )}
          </div>

          {/* ─── المحتوى الرئيسي ─── */}
          <div className="py-2 sm:py-2.5 px-3 sm:px-4">
            <div className="flex items-center justify-between gap-2.5 sm:gap-4">

              {/* ─── زر عرض السلة ─── */}
              <button
                type="button"
                onClick={onOpenCart}
                className="flex items-center gap-2.5 sm:gap-3 px-2 sm:px-2.5 py-1.5 min-h-[52px] rounded-xl hover:bg-[#F7F4EC] active:bg-[#EFE8DC] transition-all cursor-pointer text-right group flex-1 min-w-0 touch-manipulation select-none"
                aria-label={`عرض السلة (${cartCount} منتجات)`}
              >
                {/* أيقونة السلة مع العدد */}
                <div
                  id="sticky-cart-icon"
                  className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#C25E12] to-[#9C4505] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 group-hover:shadow-lg transition-all duration-200 select-none"
                >
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />

                  {/* شارة العدد */}
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-[#112616] text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow-md">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>

                {/* معلومات السلة */}
                <div className="flex flex-col leading-tight min-w-0 flex-1">
                  <span className="text-[10px] text-[#524B3E] font-bold mb-0.5">
                    سلة التسوق
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#112616] truncate tabular-nums" dir="ltr">
                    {cartTotal.toFixed(2)} <span className="text-xs font-black text-[#C25E12]">{STORE_CONFIG.currency}</span>
                  </span>
                </div>
              </button>

              {/* ─── زر تأكيد الطلب ─── */}
              <button
                type="button"
                onClick={onOpenCheckout}
                className="relative min-h-[52px] py-2.5 px-5 sm:px-7 rounded-xl bg-gradient-to-r from-[#1E4327] to-[#112616] hover:from-[#112616] hover:to-[#0A1A0F] text-white font-black text-sm shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap border border-[#0A1A0F] touch-manipulation select-none group"
              >
                <span className="hidden sm:inline">تأكيد الطلب</span>
                <span className="sm:hidden">تأكيد</span>
                <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};