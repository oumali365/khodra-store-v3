// ============================================================
// الملف: ProductCard.tsx – الإصدار 4.0
// بطاقة المنتج – تصميم شامل ومتناسق مع المتجر
// ============================================================
import React, { useState, useRef } from 'react';
import { Minus, Plus, Check, ShoppingBag, MapPin, Star } from 'lucide-react';
import gsap from 'gsap';
import { Product } from '../types';
import { STORE_CONFIG } from '../data/config';

interface ProductCardProps {
  product: Product;
  inCartQty: number;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  inCartQty,
  onAddToCart,
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

  // ─── تأثير GSAP للطيران نحو السلة ───
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
      'fixed z-[9999] pointer-events-none rounded-2xl overflow-hidden shadow-2xl border-2 border-[#C25E12] bg-white flex items-center justify-center';
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

  // ─── شارة الحالة ───
  const getStatusBadge = () => {
    if (isSoldOut) {
      return {
        text: 'نفد المخزون',
        cls: 'bg-red-50 text-red-800 border-red-300',
        icon: '🚫',
      };
    }
    if (isLimited) {
      return {
        text: 'كمية محدودة',
        cls: 'bg-amber-50 text-amber-900 border-amber-300',
        icon: '⚡',
      };
    }
    return {
      text: 'طازج اليوم',
      cls: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      icon: '✓',
    };
  };

  const badge = getStatusBadge();

  return (
    <article
      className={`relative bg-white rounded-[20px] p-3 sm:p-3.5 border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-[#C25E12] hover:-translate-y-0.5 group ${
        isSoldOut ? 'opacity-70 border-stone-300' : 'border-[#E8E1D3]'
      }`}
    >
      {/* ════════ شارة الحالة + شارة "في السلة" ════════ */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-full border shadow-xs ${badge.cls}`}>
          <span className="text-[10px]">{badge.icon}</span>
          <span>{badge.text}</span>
        </span>

        {/* شارة "في السلة" */}
        {inCartQty > 0 && !isSoldOut && (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black px-2 py-1 rounded-full bg-[#F5D76E] text-[#163920] border border-[#D4C8B5] shadow-xs animate-in zoom-in duration-200">
            <ShoppingBag className="w-2.5 h-2.5" />
            <span className="tabular-nums">{inCartQty}</span>
          </span>
        )}
      </div>

      {/* ════════ الصورة / الأيقونة ════════ */}
      <div className="flex flex-col items-center text-center">

        {/* حاوية الصورة */}
        <div
          ref={imgContainerRef}
          className="relative w-full aspect-square max-w-[140px] rounded-2xl bg-gradient-to-br from-[#F7F4EC] to-[#EAE2D2] border border-[#E8E1D3] flex items-center justify-center mb-3 shadow-xs group-hover:shadow-md transition-all duration-300 overflow-hidden mx-auto"
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const icon = document.createElement('span');
                  icon.textContent = product.icon || '🛒';
                  icon.className = 'text-6xl';
                  parent.appendChild(icon);
                }
              }}
            />
          ) : (
            <span className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform duration-300">
              {product.icon}
            </span>
          )}

          {/* شارة "وفّر" (اختياري - إذا كان هناك سعر قديم) */}
          {/* يمكن إضافتها لاحقاً */}
        </div>

        {/* اسم المنتج */}
        <h3 className="font-black text-sm sm:text-base text-[#112616] line-clamp-2 leading-tight mb-1.5 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* المنشأ */}
        {product.origin && (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-[#787163] font-bold mb-1.5">
            <MapPin className="w-3 h-3 text-[#C25E12]" />
            <span className="truncate max-w-[120px]">{product.origin}</span>
          </span>
        )}

        {/* السعر */}
        <div className="flex items-baseline justify-center gap-1.5 mt-1" dir="ltr">
          <span className="text-xl sm:text-2xl font-black text-[#C25E12] tabular-nums">
            {product.price.toFixed(2)}
          </span>
          <span className="text-xs sm:text-sm font-black text-[#C25E12]">DH</span>
          <span className="text-[10px] sm:text-xs text-[#787163] font-bold">
            / {isWeight ? 'kg' : product.unit_label || 'قطعة'}
          </span>
        </div>
      </div>

      {/* ════════ عداد الكمية + زر الإضافة ════════ */}
      <div className="mt-3 pt-3 border-t border-[#F0E9DA]">

        {/* عداد الكمية */}
        {!isSoldOut && (
          <div className="flex items-center justify-between bg-[#F7F4EC] rounded-xl p-1.5 border border-[#E8E1D3] mb-2.5">
            <button
              type="button"
              onClick={handleIncrement}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-white border border-[#E8E1D3] text-[#112616] hover:bg-[#163920] hover:text-white hover:border-[#163920] flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs touch-manipulation select-none"
              aria-label="زيادة الكمية"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="flex flex-col items-center leading-none select-none">
              <span dir="ltr" className="text-sm font-black text-[#112616] tabular-nums">
                {selectedQty} {isWeight ? 'kg' : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDecrement}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-white border border-[#E8E1D3] text-[#112616] hover:bg-[#163920] hover:text-white hover:border-[#163920] flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs touch-manipulation select-none"
              aria-label="إنقاص الكمية"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* زر الإضافة - 3 حالات */}
        <button
          type="button"
          disabled={isSoldOut}
          onClick={handleAdd}
          className={`w-full h-11 min-h-[44px] px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer touch-manipulation select-none active:scale-95 ${
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
              <Check className="w-4 h-4 text-[#F5D76E] animate-in zoom-in stroke-[2.5]" />
              <span>تمت الإضافة</span>
            </>
          ) : inCartQty > 0 ? (
            <>
              <ShoppingBag className="w-4 h-4 text-white" />
              <span>أضف المزيد</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 text-[#F5D76E]" />
              <span>أضف للسلة</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};