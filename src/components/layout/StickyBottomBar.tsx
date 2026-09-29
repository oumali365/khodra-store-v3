// ============================================================
// الملف: StickyBottomBar.tsx – الإصدار 2.1
// تعطيل زر الأيقونة + تقليل الارتفاع + زر فتح السلة
// ============================================================
import React from 'react';
import { ShoppingBag, ArrowLeft, Truck } from 'lucide-react';
import { STORE_CONFIG } from '../../data/config';

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
      <div className="w-full px-3 sm:px-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] pointer-events-auto">
        <div className="relative max-w-7xl mx-auto bg-white/95 backdrop-blur-md border border-[#2D6A3F]/15 rounded-2xl shadow-[0_6px_22px_rgba(45,106,63,0.18)] overflow-hidden transition-all duration-200">

          {/* ─── شريط علوي: تقدم التوصيل المجاني (أنحف) ─── */}
          <div className={`px-4 py-1 text-[11px] font-black flex items-center gap-1.5 border-b ${
            isFreeDelivery
              ? 'bg-[#2D6A3F]/10 text-[#1A3D24] border-[#2D6A3F]/15'
              : 'bg-[#FEF3C7] text-[#92400E] border-[#EAB308]/30'
          }`}>
            <Truck
              className={`w-3.5 h-3.5 shrink-0 ${isFreeDelivery ? 'text-[#2D6A3F]' : 'text-[#EA580C]'}`}
              strokeWidth={2.5}
            />
            {isFreeDelivery ? (
              <span className="flex items-center gap-1">
                🎉 <strong className="text-[#2D6A3F]">مبروك!</strong> حصلت على توصيل مجاني
              </span>
            ) : (
              <span>
                أضف <strong className="text-[#EA580C]">{remainingForFree.toFixed(2)} {STORE_CONFIG.currency}</strong> للحصول على توصيل مجاني
              </span>
            )}
          </div>

          {/* ─── المحتوى الرئيسي (ارتفاع أقل) ─── */}
          <div className="py-1.5 sm:py-2 px-3 sm:px-4">
            <div className="flex items-center justify-between gap-2.5 sm:gap-4">

              {/* ─── 🔒 منطقة السلة (غير قابلة للنقر — عرض فقط) ─── */}
              <div
                className="flex items-center gap-2.5 sm:gap-3 px-2 sm:px-2.5 py-1 min-h-[44px] rounded-xl text-right group flex-1 min-w-0 select-none"
                aria-label={`عرض معلومات السلة: ${cartCount} منتجات بقيمة ${cartTotal.toFixed(2)}`}
                role="status"
              >
                {/* 🔒 أيقونة السلة معطّلة (بدون hover/click) */}
                <div
                  id="sticky-cart-icon"
                  className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#2D6A3F] to-[#1A3D24] text-white flex items-center justify-center shrink-0 shadow-sm select-none border border-[#EAB308]/25"
                  aria-hidden="true"
                >
                  <ShoppingBag className="w-5 h-5 text-[#EAB308]" strokeWidth={2.5} />

                  {/* شارة العدد */}
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-[#EA580C] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>

                {/* معلومات السلة */}
                <div className="flex flex-col leading-tight min-w-0 flex-1">
                  <span className="text-[10px] text-[#5A6B5F] font-bold mb-0.5">
                    سلة التسوق
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#1A3D24] truncate tabular-nums" dir="ltr">
                    {cartTotal.toFixed(2)} <span className="text-xs font-black text-[#EA580C]">{STORE_CONFIG.currency}</span>
                  </span>
                </div>
              </div>

              {/* ─── 🔄 زر فتح السلة (بدل تأكيد الطلب) ─── */}
              <button
                type="button"
                onClick={onOpenCart}
                aria-label={`فتح السلة وإتمام الطلب (${cartCount} منتجات)`}
                className="relative min-h-[44px] py-2 px-5 sm:px-7 rounded-xl bg-gradient-to-l from-[#EA580C] to-[#C25E12] hover:from-[#F97316] hover:to-[#EA580C] text-white font-black text-sm shadow-[0_4px_14px_rgba(234,88,12,0.30)] hover:shadow-[0_6px_22px_rgba(234,88,12,0.42)] hover:scale-[1.02] active:scale-95 transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap border border-[#EAB308]/25 touch-manipulation select-none group overflow-hidden"
              >
                {/* Ripple effect */}
                <span className="relative z-10 flex items-center gap-2">
                  <span className="hidden sm:inline">فتح السلة</span>
                  <span className="sm:hidden">فتح السلة</span>
                  <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1 stroke-[2.5]" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};