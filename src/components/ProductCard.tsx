// ============================================================
// الملف: ProductCard.tsx – الإصدار 3.0
// زر "أضف للسلة" بحالات ثلاث:
//   - عادي: أخضر داكن "أضف للسلة"
//   - في السلة: برتقالي "أضف المزيد"
//   - تمت الإضافة: أخضر زمردي "تمت الإضافة"
// ============================================================
import React, { useState, useRef } from 'react';
import { Minus, Plus, Check, ShoppingBag } from 'lucide-react';
import gsap from 'gsap';
import { motion } from 'motion/react';
import { Product } from '../types';
import { STORE_CONFIG } from '../data/config';

interface ProductCardProps {
  product: Product;
  inCartQty: number;
  onAddToCart: (product: Product, quantity: number) => void;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  inCartQty,
  onAddToCart,
  index = 0,
}) => {
  const isWeight = product.type === 'weight';
  const initialQty = isWeight ? STORE_CONFIG.weightStep : 1;
  const [selectedQty, setSelectedQty] = useState<number>(initialQty);
  const [isJustAdded, setIsJustAdded] = useState(false);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const isSoldOut = product.stock <= 0;
  const isLimited = product.stock > 0 && product.stock <= 5;

  const handleDecrement = () => {
    if (isWeight) {
      setSelectedQty((prev) =>
        Math.max(STORE_CONFIG.weightStep, +(prev - STORE_CONFIG.weightStep).toFixed(1))
      );
    } else {
      setSelectedQty((prev) => Math.max(1, prev - 1));
    }
  };

  const handleIncrement = () => {
    if (isWeight) {
      setSelectedQty((prev) =>
        Math.min(STORE_CONFIG.weightMax, +(prev + STORE_CONFIG.weightStep).toFixed(1))
      );
    } else {
      setSelectedQty((prev) => Math.min(20, prev + 1));
    }
  };

  // ─── تأثير GSAP البصري لتحريك المنتج نحو السلة ───
  const animateToCart = () => {
    if (!imgContainerRef.current) return;

    const rect = imgContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const cartTarget = document.getElementById('sticky-cart-icon');
    let targetX = window.innerWidth > 640 ? window.innerWidth * 0.75 : window.innerWidth - 65;
    let targetY = window.innerHeight - 38;

    if (cartTarget) {
      const targetRect = cartTarget.getBoundingClientRect();
      targetX = targetRect.left + targetRect.width / 2;
      targetY =
        targetRect.top > window.innerHeight
          ? window.innerHeight - 38
          : targetRect.top + targetRect.height / 2;
    }

    const flyer = document.createElement('div');
    flyer.className =
      'fixed z-[9999] pointer-events-none rounded-2xl overflow-hidden shadow-2xl border-2 border-[#D9762B] bg-white flex items-center justify-center';
    flyer.style.width = '64px';
    flyer.style.height = '64px';
    flyer.style.left = `${rect.left + rect.width / 2 - 32}px`;
    flyer.style.top = `${rect.top + rect.height / 2 - 32}px`;

    if (product.image_url) {
      const img = document.createElement('img');
      img.src = product.image_url;
      img.alt = product.name;
      img.className = 'w-full h-full object-cover';
      flyer.appendChild(img);
    } else {
      const icon = document.createElement('span');
      icon.textContent = product.icon || '🛒';
      icon.className = 'text-3xl';
      flyer.appendChild(icon);
    }

    document.body.appendChild(flyer);

    const startCenterX = rect.left + rect.width / 2;
    const startCenterY = rect.top + rect.height / 2;
    const deltaX = targetX - startCenterX;
    const deltaY = targetY - startCenterY;

    const tl = gsap.timeline({
      onComplete: () => {
        flyer.remove();

        const targetIcon = document.getElementById('sticky-cart-icon');
        if (targetIcon) {
          gsap
            .timeline()
            .to(targetIcon, { scale: 1.35, duration: 0.12, ease: 'back.out(2)' })
            .to(targetIcon, { scale: 1, duration: 0.18, ease: 'power2.out' });
        }
      },
    });

    tl.to(flyer, {
      scale: 1.15,
      duration: 0.15,
      ease: 'power1.out',
    }).to(flyer, {
      x: deltaX,
      y: deltaY,
      scale: 0.25,
      opacity: 0.75,
      rotation: 360,
      duration: 0.6,
      ease: 'power2.in',
    });
  };

  const handleAdd = () => {
    if (isSoldOut) return;
    animateToCart();
    onAddToCart(product, selectedQty);
    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 1200);
  };

  // شارة الحالة
  const getStatusBadge = () => {
    if (isSoldOut) {
      return { text: 'نفد المخزون', cls: 'bg-red-50 text-red-800 border-red-200 font-bold' };
    }
    if (isLimited) {
      return { text: 'كمية محدودة', cls: 'bg-amber-50 text-amber-900 border-amber-300 font-bold' };
    }
    return { text: 'متوفر طازج', cls: 'bg-emerald-50 text-[#0F2D16] border-emerald-300 font-black' };
  };

  const badge = getStatusBadge();

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.22,
        ease: 'easeOut',
      }}
      className={`relative bg-white rounded-2xl p-2.5 sm:p-3 border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-[#C25E12] ${
        isSoldOut ? 'opacity-70 border-stone-300' : 'border-[#D4C8B5]'
      }`}
    >
      {/* ─── شارة الحالة ─── */}
      <div className="flex items-center w-full mb-1 sm:mb-1.5">
        <span className={`text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${badge.cls}`}>
          {badge.text}
        </span>
      </div>

      {/* ─── الصورة / الأيقونة + الاسم + السعر ─── */}
      <div className="flex flex-col items-center text-center">
        <div
          ref={imgContainerRef}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#F7F4EC] border border-[#DDD5C5] flex items-center justify-center text-4xl mb-1.5 shadow-2xs hover:shadow-sm transition-all duration-300 group-hover:scale-105 overflow-hidden"
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
              loading="lazy"
              decoding="async"
              width="96"
              height="96"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const icon = document.createElement('span');
                  icon.textContent = product.icon || '🛒';
                  icon.className = 'text-4xl';
                  parent.appendChild(icon);
                }
              }}
            />
          ) : (
            <span>{product.icon}</span>
          )}
        </div>

        <h3 className="font-extrabold text-sm sm:text-base text-[#112616] line-clamp-1 mb-0.5">
          {product.name}
        </h3>

        {product.origin && (
          <span className="text-[10px] sm:text-xs text-[#3E3A33] font-semibold mb-0.5">
            📍 {product.origin}
          </span>
        )}

        <div
          dir="ltr"
          className="inline-flex items-baseline justify-center gap-1 text-xs text-[#1A1814] font-semibold mt-0.5"
        >
          <span className="text-lg sm:text-xl font-black text-[#B85507]">
            {product.price.toFixed(2)}
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-[#B85507]">dh</span>
          <span className="text-[11px] text-[#38332B] font-bold">
            / {isWeight ? 'kg' : product.unit_label || 'pièce'}
          </span>
        </div>
      </div>

      {/* ─── عداد الكمية وزر الإضافة بتصميم مضغوط ومتناسق ─── */}
      <div className="mt-2 pt-2 border-t border-[#E8E1D3]">
        {!isSoldOut && (
          <div className="flex items-center justify-between bg-[#F7F4EC] rounded-lg p-1 border border-[#D4C8B5] mb-1.5">
            <button
              type="button"
              onClick={handleIncrement}
              className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-md bg-white border border-[#D4C8B5] text-[#112616] hover:bg-[#EBE4D5] flex items-center justify-center font-black transition-all active:scale-90 cursor-pointer shadow-2xs touch-manipulation select-none"
              aria-label="زيادة الكمية"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <div className="flex items-center justify-center leading-none select-none px-1">
              <span dir="ltr" className="text-xs sm:text-sm font-black text-[#112616] tabular-nums">
                {selectedQty} {isWeight ? 'kg' : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDecrement}
              className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-md bg-white border border-[#D4C8B5] text-[#112616] hover:bg-[#EBE4D5] flex items-center justify-center font-black transition-all active:scale-90 cursor-pointer shadow-2xs touch-manipulation select-none"
              aria-label="إنقاص الكمية"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* ─── زر الإضافة بحالات ثلاث ─── */}
        <button
          type="button"
          disabled={isSoldOut}
          onClick={handleAdd}
          className={`w-full h-9 sm:h-10 min-h-[36px] sm:min-h-[40px] px-2.5 rounded-lg font-black text-xs sm:text-[13px] flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer touch-manipulation select-none active:scale-95 ${
            isSoldOut
              ? 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed'
              : isJustAdded
              ? 'bg-emerald-600 text-white scale-[1.02]'
              : inCartQty > 0
              ? 'bg-gradient-to-r from-[#EA580C] via-[#C25E12] to-[#9C4505] hover:from-[#F97316] hover:to-[#C25E12] text-white'
              : 'bg-[#163920] hover:bg-[#0E2615] text-white'
          }`}
        >
          {isSoldOut ? (
            <span>غير متوفر</span>
          ) : isJustAdded ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#F5D76E] animate-in zoom-in stroke-[2.5]" />
              <span>تمت الإضافة</span>
            </>
          ) : inCartQty > 0 ? (
            <>
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
              <span>أضف المزيد</span>
              <span className="px-1.5 py-0.2 rounded bg-white/20 text-white text-[10px] font-black tabular-nums">
                {inCartQty}
              </span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 text-[#F5D76E]" />
              <span>أضف للسلة</span>
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
};