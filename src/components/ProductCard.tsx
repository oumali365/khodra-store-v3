// ============================================================
// الملف الثالث: ProductCard.tsx – محسّن
// ============================================================
import React, { useState, useRef } from 'react';
import { Minus, Plus, Check, ShoppingBag } from 'lucide-react';
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
      setSelectedQty((prev) => Math.max(STORE_CONFIG.weightStep, +(prev - STORE_CONFIG.weightStep).toFixed(1)));
    } else {
      setSelectedQty((prev) => Math.max(1, prev - 1));
    }
  };

  const handleIncrement = () => {
    if (isWeight) {
      setSelectedQty((prev) => Math.min(STORE_CONFIG.weightMax, +(prev + STORE_CONFIG.weightStep).toFixed(1)));
    } else {
      setSelectedQty((prev) => Math.min(20, prev + 1));
    }
  };

  // ─── تأثير GSAP البصري لتحريك المنتج نحو السلة في الشريط السفلي ───
  const animateToCart = () => {
    if (!imgContainerRef.current) return;

    const rect = imgContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // استهداف أيقونة السلة في الشريط السفلي الثابت
    const cartTarget = document.getElementById('sticky-cart-icon');
    let targetX = window.innerWidth > 640 ? window.innerWidth * 0.75 : window.innerWidth - 65;
    let targetY = window.innerHeight - 38;

    if (cartTarget) {
      const targetRect = cartTarget.getBoundingClientRect();
      targetX = targetRect.left + targetRect.width / 2;
      targetY = targetRect.top > window.innerHeight ? window.innerHeight - 38 : targetRect.top + targetRect.height / 2;
    }

    // إنشاء مجسم مصغر طائر للمنتج
    const flyer = document.createElement('div');
    flyer.className = 'fixed z-[9999] pointer-events-none rounded-2xl overflow-hidden shadow-2xl border-2 border-[#D9762B] bg-white flex items-center justify-center';
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

    // حركة GSAP منحنية بانسيابية عالية
    const tl = gsap.timeline({
      onComplete: () => {
        flyer.remove();

        // ارتداد خفيف لأيقونة السلة لحظة وصول المنتج
        const targetIcon = document.getElementById('sticky-cart-icon');
        if (targetIcon) {
          gsap.timeline()
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

  // شارة الحالة – محسّنة ومكبرة بتباين عالٍ
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
    <article
      className={`relative bg-white rounded-[18px] p-3.5 border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-[#C25E12] ${
        isSoldOut ? 'opacity-70 border-stone-300' : 'border-[#D4C8B5]'
      }`}
    >
      {/* ─── شارة الحالة (مكبرة) ─── */}
      <div className="flex items-center w-full mb-2">
        <span className={`text-xs font-extrabold px-3 py-1 rounded-full border shadow-xs ${badge.cls}`}>
          {badge.text}
        </span>
      </div>

      {/* ─── الصورة / الأيقونة + الاسم + السعر ─── */}
      <div className="flex flex-col items-center text-center">
        <div
          ref={imgContainerRef}
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-[18px] bg-[#F7F4EC] border border-[#DDD5C5] flex items-center justify-center text-5xl mb-2.5 shadow-xs hover:shadow-md transition-all duration-300 group-hover:scale-105 overflow-hidden"
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover rounded-[18px]"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const icon = document.createElement('span');
                  icon.textContent = product.icon || '🛒';
                  icon.className = 'text-5xl';
                  parent.appendChild(icon);
                }
              }}
            />
          ) : (
            <span>{product.icon}</span>
          )}
        </div>

        <h3 className="font-extrabold text-base sm:text-lg text-[#112616] line-clamp-1 mb-1">
          {product.name}
        </h3>

        {product.origin && (
          <span className="text-xs text-[#3E3A33] font-semibold mb-1">
            📍 {product.origin}
          </span>
        )}

        <div dir="ltr" className="inline-flex items-baseline justify-center gap-1.5 text-xs sm:text-sm text-[#1A1814] font-semibold mt-0.5">
          <span className="text-xl sm:text-2xl font-black text-[#B85507]">
            {product.price.toFixed(2)}
          </span>
          <span className="text-sm sm:text-base font-extrabold text-[#B85507]">dh</span>
          <span className="text-xs text-[#38332B] font-bold">
            / {isWeight ? 'kg' : product.unit_label || 'pièce'}
          </span>
        </div>
      </div>

      {/* ─── عداد الكمية وزر الإضافة (تم تبديل أماكن + و - بتباين عالٍ) ─── */}
      <div className="mt-2.5 pt-2.5 border-t border-[#E8E1D3]">
        {!isSoldOut && (
          <div className="flex items-center justify-between bg-[#F7F4EC] rounded-xl p-1.5 border border-[#D4C8B5] mb-2.5">
            <button
              type="button"
              onClick={handleIncrement}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-white border border-[#D4C8B5] text-[#112616] hover:bg-[#EBE4D5] flex items-center justify-center font-extrabold text-sm transition-all active:scale-90 cursor-pointer shadow-xs touch-manipulation select-none"
              aria-label="زيادة الكمية"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="flex flex-col items-center leading-none select-none">
              <span dir="ltr" className="text-sm font-extrabold text-[#112616]">
                {selectedQty} {isWeight ? 'kg' : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDecrement}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-white border border-[#D4C8B5] text-[#112616] hover:bg-[#EBE4D5] flex items-center justify-center font-extrabold text-sm transition-all active:scale-90 cursor-pointer shadow-xs touch-manipulation select-none"
              aria-label="إنقاص الكمية"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* ─── زر الإضافة المحسّن ─── */}
        <button
          type="button"
          disabled={isSoldOut}
          onClick={handleAdd}
          className={`w-full min-h-[44px] py-2.5 px-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all duration-150 shadow-md hover:shadow-lg cursor-pointer touch-manipulation select-none ${
            isSoldOut
              ? 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed'
              : isJustAdded
              ? 'bg-[#1B4323] text-white scale-[1.02] shadow-lg'
              : inCartQty > 0
              ? 'bg-[#1E4327]/10 text-[#112616] border-2 border-[#1E4327]/40 hover:bg-[#1E4327]/20 hover:border-[#1E4327]/60 active:scale-95'
              : 'bg-gradient-to-r from-[#C25E12] to-[#9C4505] text-white hover:scale-[1.01] hover:shadow-xl active:scale-95'
          }`}
        >
          {isSoldOut ? (
            <span>غير متوفر</span>
          ) : isJustAdded ? (
            <>
              <Check className="w-4 h-4 text-emerald-300 animate-in zoom-in stroke-[2.5]" />
              <span>تمت الإضافة!</span>
            </>
          ) : inCartQty > 0 ? (
            <>
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>أضف المزيد</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>أضف إلى السلة</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};