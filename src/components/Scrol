// ============================================================
// الملف: ScrollBadges.tsx – الإصدار 1.0
// شارتان عائمتان (Absolute) أسفل الهيدر للتنقل السريع
// ============================================================
import React from 'react';
import { Leaf, Package, ChevronDown } from 'lucide-react';

export interface ScrollBadgeItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  /** لون مخصص اختياري للتدرّج */
  variant?: 'green' | 'orange';
}

interface ScrollBadgesProps {
  badges: ScrollBadgeItem[];
  /** الإزاحة العلوية بالنسبة للهيدر — الافتراضي 0 */
  topOffset?: number | string;
  /** فئة CSS إضافية للتخصيص */
  className?: string;
  /** اتجاه الظهور — الافتراضي للأسفل */
  position?: 'center' | 'left' | 'right';
}

export const ScrollBadges: React.FC<ScrollBadgesProps> = ({
  badges,
  topOffset = 0,
  className = '',
  position = 'center',
}) => {
  if (!badges || badges.length === 0) return null;

  const positionClass =
    position === 'left'
      ? 'left-1/2 sm:left-6 lg:left-8 -translate-x-1/2 sm:translate-x-0'
      : position === 'right'
      ? 'right-1/2 sm:right-6 lg:right-8 translate-x-1/2 sm:translate-x-0'
      : 'left-1/2 -translate-x-1/2';

  const topValue =
    typeof topOffset === 'number' ? `${topOffset}px` : topOffset;

  return (
    <div
      className={`absolute ${positionClass} z-30 flex items-center gap-2 sm:gap-2.5 ${className}`}
      style={{ top: topValue }}
    >
      {badges.map((badge) => {
        const isOrange = badge.variant === 'orange';

        return (
          <button
            key={badge.id}
            type="button"
            onClick={badge.onClick}
            aria-label={badge.label}
            className={`group relative inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-black text-xs sm:text-sm shadow-2xl border-2 transition-all duration-200 cursor-pointer active:scale-95 hover:-translate-y-0.5 ${
              isOrange
                ? 'bg-gradient-to-r from-[#C25E12] to-[#9C4505] hover:from-[#EA580C] hover:to-[#C25E12] text-white border-[#F5D76E]/40 shadow-[#C25E12]/30'
                : 'bg-gradient-to-b from-[#163920] to-[#0E2615] hover:from-[#1E4D2B] hover:to-[#12331C] text-white border-[#F5D76E]/40 shadow-[#163920]/30'
            }`}
          >
            {badge.icon ?? (
              isOrange ? (
                <Package className="w-4 h-4 text-[#F5D76E]" />
              ) : (
                <Leaf className="w-4 h-4 text-[#F5D76E]" />
              )
            )}

            <span className="whitespace-nowrap">{badge.label}</span>

            <ChevronDown className="w-3.5 h-3.5 text-[#F5D76E] group-hover:translate-y-0.5 transition-transform duration-200 animate-bounce stroke-[2.5]" />
          </button>
        );
      })}
    </div>
  );
};