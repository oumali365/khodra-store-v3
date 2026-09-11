// ============================================================
// الملف: StickyBottomBar.tsx – شريط سفلي ثابت بعرض كامل
// ============================================================
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
      {/* ─── الخط البرتقالي العلوي ─── */}
      <div className="h-0.5 bg-gradient-to-r from-[#D9762B] via-[#F29D4A] to-[#D9762B] w-full" />
      
      {/* ─── البطاقة العائمة بعرض كامل بارتفاع مدمج ورشيق ─── */}
      <div className="w-full bg-white/95 backdrop-blur-md border-t border-[#D4C8B5] shadow-xl pointer-events-auto py-1.5 sm:py-2 px-3 sm:px-4 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">

          {/* ─── زر عرض السلة ─── */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-2.5 py-1 min-h-[38px] rounded-xl hover:bg-[#F7F4EC] active:bg-[#EFE8DC] transition-all cursor-pointer text-right group flex-1 min-w-0 touch-manipulation select-none"
          >
            {/* أيقونة السلة مع العدد بحجم مدمج */}
            <div
              id="sticky-cart-icon"
              className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-gradient-to-br from-[#C25E12] to-[#9C4505] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200 select-none"
            >
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#112616] text-white text-[10px] font-black flex items-center justify-center border-1.5 border-white shadow-2xs">
                {cartCount}
              </span>
            </div>

            {/* معلومات السلة */}
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm sm:text-base font-black text-[#112616] truncate">
                {cartTotal.toFixed(2)} {STORE_CONFIG.currency}
              </span>
              <span className="text-[11px] text-[#524B3E] font-bold truncate">
                {cartCount} {cartCount === 1 ? 'منتج' : 'منتجات'} • انقر للمعاينة
              </span>
            </div>
          </button>

          {/* ─── زر إتمام الطلب (أخضر) ─── */}
          <button
            type="button"
            onClick={onOpenCheckout}
            className="min-h-[38px] sm:min-h-[40px] py-1.5 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-[#1E4327] to-[#112616] text-white font-black text-xs sm:text-sm shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap border border-[#1E4327] touch-manipulation select-none"
          >
            <span>إتمام الطلب</span>
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-[-2px] stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};