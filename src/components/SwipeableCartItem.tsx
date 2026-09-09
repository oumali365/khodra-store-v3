import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { Trash2, Plus, Minus } from 'lucide-react';
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

  // إظهار أيقونة وتأثير الحذف عند السحب لليمين أو اليسار
  const rightOpacity = useTransform(x, [-110, -50, 0], [1, 0.6, 0]);
  const rightScale = useTransform(x, [-110, -50, 0], [1.15, 0.95, 0.7]);

  const leftOpacity = useTransform(x, [0, 50, 110], [0, 0.6, 1]);
  const leftScale = useTransform(x, [0, 50, 110], [0.7, 0.95, 1.15]);

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 85;
    if (Math.abs(info.offset.x) >= threshold) {
      if (!isPastThreshold) setIsPastThreshold(true);
    } else {
      if (isPastThreshold) setIsPastThreshold(false);
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 shadow-2xs select-none touch-pan-y"
    >
      {/* ─── الطبقة الخلفية (تظهر عند السحب لليسار) ─── */}
      <motion.div
        style={{ opacity: rightOpacity, scale: rightScale }}
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 pl-3 gap-2 text-white font-black text-xs pointer-events-none"
      >
        <span>حذف من السلة</span>
        <Trash2 className="w-5 h-5 text-white stroke-[2.5]" />
      </motion.div>

      {/* ─── الطبقة الخلفية (تظهر عند السحب لليمين) ─── */}
      <motion.div
        style={{ opacity: leftOpacity, scale: leftScale }}
        className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 pr-3 gap-2 text-white font-black text-xs pointer-events-none"
      >
        <Trash2 className="w-5 h-5 text-white stroke-[2.5]" />
        <span>حذف من السلة</span>
      </motion.div>

      {/* ─── بطاقة المنتج القابلة للسحب ─── */}
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
          boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.1)',
        }}
        className={`relative bg-white border transition-colors rounded-xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 z-10 ${
          isPastThreshold ? 'border-red-400 bg-red-50/20' : 'border-[#D4C8B5]'
        }`}
      >
        {/* أيقونة المنتج بحجم مدمج */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#F7F4EC] border border-[#D4C8B5] flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-2xs pointer-events-none">
          {item.icon}
        </div>

        {/* معلومات المنتج بحجم مدمج وواضح */}
        <div className="flex-1 min-w-0 pointer-events-none">
          <h4 className="text-xs sm:text-sm font-black text-[#112616] truncate">
            {item.name}
          </h4>
          <p className="text-[11px] text-[#2D271E] font-bold">
            {item.variantLabel}
          </p>
          <div className="text-xs sm:text-sm font-black text-[#C25E12]">
            {item.lineTotal.toFixed(2)} {STORE_CONFIG.currency}
          </div>
        </div>

        {/* عداد الكمية بحجم مدمج */}
        <div 
          className="flex items-center gap-1 bg-[#F7F4EC] border border-[#D4C8B5] rounded-lg p-0.5 shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateQty(item.key, -1);
            }}
            className="w-6 h-6 rounded-md bg-white text-[#112616] hover:bg-[#EAE2D2] flex items-center justify-center font-black text-[10px] transition-colors cursor-pointer shadow-2xs border border-[#D4C8B5]"
            aria-label="إنقاص الكمية"
          >
            <Minus className="w-3 h-3 stroke-[2.5]" />
          </button>

          <span className="text-xs font-black text-[#112616] min-w-[20px] text-center select-none">
            {item.qty}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateQty(item.key, 1);
            }}
            className="w-6 h-6 rounded-md bg-white text-[#112616] hover:bg-[#EAE2D2] flex items-center justify-center font-black text-[10px] transition-colors cursor-pointer shadow-2xs border border-[#D4C8B5]"
            aria-label="زيادة الكمية"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
          </button>
        </div>

        {/* زر الحذف التقليدي بحجم مدمج */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveItem(item.key);
          }}
          className="w-7 h-7 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label={`حذف ${item.name} من السلة`}
          title="حذف من السلة"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </motion.div>
  );
};
