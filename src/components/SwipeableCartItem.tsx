// ============================================================
// الملف: SwipeableCartItem.tsx
// الإصدار: 3.0 (تصميم متناسق مع المتجر + دعم كامل)
// ============================================================
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { Trash2, Plus, Minus, Package } from 'lucide-react';
import { CartItem } from '../types';
import { STORE_CONFIG } from '../data/config';

interface SwipeableCartItemProps {
  item: CartItem;
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
}

export const SwipeableCartItem: React.FC<SwipeableCartItemProps> = ({
  item,
  onUpdateQty,
  onRemoveItem,
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isPastThreshold, setIsPastThreshold] = useState(false);
  const x = useMotionValue(0);

  // إظهار أيقونة وتأثير الحذف عند السحب
  const rightOpacity = useTransform(x, [-110, -50, 0], [1, 0.6, 0]);
  const rightScale = useTransform(x, [-110, -50, 0], [1.15, 0.95, 0.7]);

  const leftOpacity = useTransform(x, [0, 50, 110], [0, 0.6, 1]);
  const leftScale = useTransform(x, [0, 50, 110], [0.7, 0.95, 1.15]);

  const handleDrag = (_: any, info: PanInfo) => {
    const threshold = 85;
    if (Math.abs(info.offset.x) >= threshold) {
      if (!isPastThreshold) setIsPastThreshold(true);
    } else {
      if (isPastThreshold) setIsPastThreshold(false);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 85;
    const velocityThreshold = 400;

    const shouldDelete =
      Math.abs(info.offset.x) >= threshold ||
      Math.abs(info.velocity.x) >= velocityThreshold;

    if (shouldDelete) {
      setIsRemoving(true);
      onRemoveItem(item.key);
    } else {
      setIsPastThreshold(false);
    }
  };

  const isBundleItem = !!item.bundleId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        x: x.get() > 0 ? 250 : -250,
        height: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        overflow: 'hidden',
        transition: {
          opacity: { duration: 0.2 },
          height: { duration: 0.25, delay: 0.05 },
          marginBottom: { duration: 0.25, delay: 0.05 },
        },
      }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#C25E12] via-[#E74C3C] to-[#C25E12] shadow-sm select-none touch-pan-y"
    >
      {/* ════════ الطبقة الخلفية (السحب لليسار) ════════ */}
      <motion.div
        style={{ opacity: rightOpacity, scale: rightScale }}
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 pl-3 gap-2 text-white font-black text-xs pointer-events-none"
      >
        <span>حذف من السلة</span>
        <Trash2 className="w-5 h-5 text-white stroke-[2.5]" />
      </motion.div>

      {/* ════════ الطبقة الخلفية (السحب لليمين) ════════ */}
      <motion.div
        style={{ opacity: leftOpacity, scale: leftScale }}
        className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 pr-3 gap-2 text-white font-black text-xs pointer-events-none"
      >
        <Trash2 className="w-5 h-5 text-white stroke-[2.5]" />
        <span>حذف من السلة</span>
      </motion.div>

      {/* ════════ بطاقة المنتج القابلة للسحب ════════ */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.4}
        dragSnapToOrigin={!isRemoving}
        style={{ x }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{
          cursor: 'grabbing',
          boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.15)',
        }}
        className={`relative bg-white border-2 transition-colors rounded-xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 z-10 ${
          isPastThreshold
            ? 'border-red-400 bg-red-50/30'
            : isBundleItem
            ? 'border-[#C25E12]/50 bg-amber-50/30'
            : 'border-[#E8E1D3] hover:border-[#C25E12]/40'
        }`}
      >
        {/* ─── أيقونة/صورة المنتج ─── */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#F7F4EC] border border-[#E8E1D3] flex items-center justify-center shrink-0 overflow-visible shadow-xs pointer-events-none">
          {/* الصورة أو الأيقونة */}
          <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-2xl sm:text-3xl">{item.icon}</span>
            )}
          </div>

          {/* شارة الصندوق */}
          {isBundleItem && (
            <span
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C25E12] text-white text-[10px] flex items-center justify-center border-2 border-white shadow-md z-10"
              title="من صندوق عائلة"
            >
              <Package className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* ─── معلومات المنتج ─── */}
        <div className="flex-1 min-w-0 pointer-events-none">
          <h4 className="text-xs sm:text-sm font-black text-[#112616] truncate leading-tight">
            {item.name}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-[#787163] font-bold truncate mt-0.5">
            {item.variantLabel}
          </p>
          <div className="text-xs sm:text-sm font-black text-[#C25E12] mt-0.5 tabular-nums">
            {item.lineTotal.toFixed(2)} {STORE_CONFIG.currency}
          </div>
        </div>

        {/* ─── عداد الكمية ─── */}
        <div
          className="flex items-center gap-1 bg-[#F7F4EC] border border-[#E8E1D3] rounded-lg p-0.5 shrink-0 select-none touch-manipulation"
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateQty(item.key, -1);
            }}
            className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-md bg-white text-[#112616] hover:bg-[#163920] hover:text-white active:scale-90 flex items-center justify-center font-black text-xs transition-all cursor-pointer shadow-xs border border-[#E8E1D3] hover:border-[#163920] touch-manipulation select-none"
            aria-label="إنقاص الكمية"
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <span className="text-xs font-black text-[#112616] min-w-[24px] text-center select-none tabular-nums">
            {item.qty}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateQty(item.key, 1);
            }}
            className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-md bg-white text-[#112616] hover:bg-[#163920] hover:text-white active:scale-90 flex items-center justify-center font-black text-xs transition-all cursor-pointer shadow-xs border border-[#E8E1D3] hover:border-[#163920] touch-manipulation select-none"
            aria-label="زيادة الكمية"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};