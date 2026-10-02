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

          {/* ─── شريط علوي: تقدم التوصيل المجاني (أنحف) ─── */}
<div className={`px-4 py-1 text-[11px] font-black border-b ${
  isFreeDelivery
    ? 'bg-[#2D6A3F]/10 text-[#1A3D24] border-[#2D6A3F]/15'
    : 'bg-[#FEF3C7] text-[#92400E] border-[#EAB308]/30'
}`}>
  <div className="flex items-center gap-2">
    <Truck
      className={`w-3.5 h-3.5 shrink-0 ${isFreeDelivery ? 'text-[#2D6A3F]' : 'text-[#EA580C]'}`}
      strokeWidth={2.5}
    />
    {isFreeDelivery ? (
      <span className="flex items-center gap-1">
        🎉 <strong className="text-[#2D6A3F]">مبروك!</strong> توصيل مجاني
      </span>
    ) : (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="shrink-0 text-[10px]">
          {Math.round((cartTotal / STORE_CONFIG.freeDeliveryThreshold) * 100)}%
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-[#EAB308]/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-l from-[#EA580C] to-[#F59E0B] transition-all duration-300"
            style={{ width: `${Math.min(100, (cartTotal / STORE_CONFIG.freeDeliveryThreshold) * 100)}%` }}
          />
        </div>
        <span className="shrink-0 text-[10px] text-[#92400E]">
          {remainingForFree.toFixed(2)} {STORE_CONFIG.currency}
        </span>
      </div>
    )}
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