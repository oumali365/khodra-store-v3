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
      
      {/* ─── البطاقة العائمة بعرض كامل ─── */}
      <div className="w-full bg-white/95 backdrop-blur-md border-t border-[#D4C8B5] shadow-2xl pointer-events-auto py-2.5 px-3 sm:px-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">

          {/* ─── زر عرض السلة ─── */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2.5 sm:gap-3.5 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-[#F7F4EC] transition-all cursor-pointer text-right group flex-1 min-w-0"
          >
            {/* أيقونة السلة مع العدد */}
            <div
              id="sticky-cart-icon"
              className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#C25E12] to-[#9C4505] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#112616] text-white text-xs font-black flex items-center justify-center border-2 border-white shadow-sm">
                {cartCount}
              </span>
            </div>

            {/* معلومات السلة */}
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-base sm:text-lg font-black text-[#112616] truncate">
                {cartTotal.toFixed(2)} {STORE_CONFIG.currency}
              </span>
              <span className="text-xs text-[#2D271E] font-bold">
                {cartCount} {cartCount === 1 ? 'منتج في السلة' : 'منتجات في السلة'} • انقر للمعاينة
              </span>
            </div>
          </button>

          {/* ─── زر إتمام الطلب (أخضر) ─── */}
          <button
            type="button"
            onClick={onOpenCheckout}
            className="py-2.5 px-5 sm:px-7 rounded-xl bg-gradient-to-r from-[#1E4327] to-[#112616] text-white font-black text-sm sm:text-base shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap border border-[#1E4327]"
          >
            <span>إتمام الطلب</span>
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-[-2px] stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};