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
      <div className="w-full px-[15.75px] sm:px-[16.8px] pb-[max(0.7875rem,env(safe-area-inset-bottom))] pointer-events-auto">
        <div className="relative max-w-7xl mx-auto bg-white/95 backdrop-blur-md border border-[#D4C8B5] rounded-[21px] shadow-2xl py-[10.5px] sm:py-[13.125px] px-[18.375px] sm:px-[16.8px] transition-all duration-200">
          
          {/* ─── الخط البرتقالي العلوي (اختياري للحفاظ على الهوية) ─── */}
          <div className="absolute -top-px left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#D9762B] to-transparent rounded-full" />

          <div className="flex items-center justify-between gap-[13.125px] sm:gap-[16.8px]">

            {/* ─── زر عرض السلة ─── */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-[10.5px] sm:gap-[15.75px] px-[10.5px] sm:px-[13.125px] py-[5.25px] min-h-[44.1px] rounded-[21px] hover:bg-[#F7F4EC] active:bg-[#EFE8DC] transition-all cursor-pointer text-right group flex-1 min-w-0 touch-manipulation select-none"
            >
              {/* أيقونة السلة مع العدد */}
              <div
                id="sticky-cart-icon"
                className="relative w-[47.25px] h-[47.25px] sm:w-[49.875px] sm:h-[49.875px] rounded-[15.75px] bg-gradient-to-br from-[#C25E12] to-[#9C4505] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200 select-none"
              >
                <ShoppingBag className="w-[18.9px] h-[18.9px] sm:w-[21px] sm:h-[21px]" />
                <span className="absolute -top-[5.25px] -right-[5.25px] w-[21px] h-[21px] rounded-full bg-[#112616] text-white text-[10.5px] font-black flex items-center justify-center border-[10.5px] border-white shadow-sm">
                  {cartCount}
                </span>
              </div>

              {/* معلومات السلة */}
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-[15.75px] sm:text-[16.8px] font-black text-[#112616] truncate">
                  {cartTotal.toFixed(2)} {STORE_CONFIG.currency}
                </span>
                <span className="text-[12.6px] text-[#524B3E] font-bold truncate">
                  {cartCount} {cartCount === 1 ? 'منتج' : 'منتجات'} • انقر للمعاينة
                </span>
              </div>
            </button>

            {/* ─── زر إتمام الطلب (أخضر) ─── */}
            <button
              type="button"
              onClick={onOpenCheckout}
              className="min-h-[44.1px] sm:min-h-[46.2px] py-[10.5px] px-[26.25px] sm:px-[31.5px] rounded-[21px] bg-gradient-to-r from-[#1E4327] to-[#112616] text-white font-black text-[14.7px] sm:text-[14.7px] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-150 flex items-center gap-[7.875px] cursor-pointer shrink-0 whitespace-nowrap border border-[#1E4327] touch-manipulation select-none"
            >
              <span>إتمام الطلب</span>
              <ArrowLeft className="w-[16.8px] h-[16.8px] transition-transform group-hover:translate-x-[-2px] stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};