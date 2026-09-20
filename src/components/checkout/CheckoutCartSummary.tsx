// ============================================================
// الملف: CheckoutCartSummary.tsx
// مكوّن ملخص السلة في نافذة تأكيد الطلب (قابل للطي)
// ============================================================
import React, { useState } from 'react';
import { Package, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { CartItem } from '../../types';

interface CheckoutCartSummaryProps {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  isFreeDelivery: boolean;
  grandTotal: number;
  totalItems: number;
}

export const CheckoutCartSummary: React.FC<CheckoutCartSummaryProps> = ({
  items,
  deliveryFee,
  isFreeDelivery,
  grandTotal,
  totalItems,
}) => {
  const [showCartSummary, setShowCartSummary] = useState(false);

  return (
    <div className="bg-white border border-[#E8E1D3] rounded-2xl overflow-hidden shadow-sm">
      {/* رأس قابل للنقر */}
      <button
        type="button"
        onClick={() => setShowCartSummary(!showCartSummary)}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-[#F7F4EC] transition-colors cursor-pointer"
        aria-expanded={showCartSummary}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#163920]/10 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-[#163920]" />
          </div>
          <div className="text-right min-w-0">
            <span className="text-sm font-black text-[#112616] block">
              ملخص السلة
            </span>
            <span className="text-[11px] text-[#787163] font-bold block">
              {items.length} صنف • {totalItems} قطعة
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base sm:text-lg font-black text-[#C25E12] tabular-nums">
            {grandTotal.toFixed(2)} DH
          </span>
          {showCartSummary ? (
            <ChevronUp className="w-4 h-4 text-[#787163]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#787163]" />
          )}
        </div>
      </button>

      {/* المحتوى القابل للطي */}
      {showCartSummary && (
        <div className="border-t border-[#F0E9DA] p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {items.map((i) => (
            <div
              key={i.key}
              className="flex items-center justify-between p-2.5 bg-[#F7F4EC] rounded-xl border border-[#E8E1D3] gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg shrink-0">{i.icon}</span>
                <div className="text-right min-w-0">
                  <p className="text-xs font-black text-[#112616] truncate">
                    {i.name}
                  </p>
                  <p className="text-[10px] text-[#787163] font-bold truncate">
                    {i.variantLabel} {i.qty > 1 && `× ${i.qty}`}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-[#C25E12] tabular-nums shrink-0">
                {i.lineTotal.toFixed(2)} DH
              </span>
            </div>
          ))}

          <div className="pt-3 mt-2 border-t border-[#F0E9DA] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#524B3E] font-bold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>رسوم التوصيل:</span>
              </span>
              <span
                className={`font-black tabular-nums ${
                  isFreeDelivery ? 'text-emerald-700' : 'text-[#112616]'
                }`}
              >
                {isFreeDelivery ? 'مجاني 🎉' : `${deliveryFee.toFixed(2)} DH`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
