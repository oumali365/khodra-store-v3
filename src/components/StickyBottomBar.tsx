import React from 'react';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
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
        <div className="relative max-w-7xl mx-auto bg-white/95 backdrop-blur-md border border-[#D4C8B5] rounded-2xl shadow-2xl py-2 sm:py-2.5 px-4 sm:px-4 transition-all duration-200">
          
          {/* ─── الخط البرتقالي العلوي (اختياري للحفاظ على الهوية) ─── */}
          <div className="absolute -top-px left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#D9762B] to-transparent rounded-full" />

          <div className="flex items-center justify-between gap-2.5 sm:gap-4">

            {/* ─── زر عرض السلة ─── */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-2.5 sm:gap-3 px-2 sm:px-3 py-1 min-h-[46px] rounded-xl hover:bg-[#F7F4EC] active:bg-[#EFE8DC] transition-all cursor-pointer text-right group flex-1 min-w-0 touch-manipulation select-none"
            >
              {/* أيقونة السلة مع العدد */}
              <div
                id="sticky-cart-icon"
                className="relative w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-lg bg-gradient-to-br from-[#C25E12] to-[#9C4505] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200 select-none"
              >
                <ShoppingBag className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#112616] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              </div>

              {/* معلومات السلة */}
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-[15px] sm:text-base font-black text-[#112616] truncate">
                  {cartTotal.toFixed(2)} {STORE_CONFIG.currency}
                </span>
                <span className="text-xs text-[#524B3E] font-bold truncate">
                  {cartCount} {cartCount === 1 ? 'منتج' : 'منتجات'} • انقر للمعاينة
                </span>
              </div>
            </button>

            {/* ─── زر إتمام الطلب (أخضر) ─── */}
            <button
              type="button"
              onClick={onOpenCheckout}
              className="min-h-[42px] sm:min-h-[44px] py-2 px-5 sm:px-6 rounded-xl bg-gradient-to-r from-[#1E4327] to-[#112616] text-white font-black text-sm sm:text-sm shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap border border-[#1E4327] touch-manipulation select-none"
            >
              <span>إتمام الطلب</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:translate-x-[-2px] stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};