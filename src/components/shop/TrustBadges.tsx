// ============================================================
// الملف: TrustBadges.tsx – الإصدار 5.1
// شارات الثقة بهوية خضرة الموحّدة
// تحسينات: Ripple + Focus Pulse + Fade + Spacer + ظلال عضوية
// ============================================================
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Sprout,
  Truck,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Award,
} from 'lucide-react';

const FOCUS_PULSE_MS = 700;

// ═══════ زر Ripple ═══════
const RippleButton: React.FC<{
  onClick?: () => void;
  className: string;
  children: React.ReactNode;
  rippleColor?: string;
  ariaLabel?: string;
}> = ({ onClick, className, children, rippleColor = 'rgba(45,106,63,0.22)', ariaLabel }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'trust-ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.background = rippleColor;
      btn.appendChild(ripple);

      window.setTimeout(() => ripple.remove(), 650);
    }
    onClick?.();
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </button>
  );
};

export const TrustBadges: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [pulsingIndex, setPulsingIndex] = useState<number | null>(null);
  const scrollRaf = useRef<number | null>(null);
  const pulseTimer = useRef<number | null>(null);
  const prevActiveRef = useRef(0);

  // ─── البطاقات الأربعة ───
  // 🎨 تناوب لوني: أخضر → برتقالي → أخضر → برتقالي
  const features = [
    {
      id: 0,
      icon: <Sprout className="w-8 h-8 sm:w-9 sm:h-9 text-[#2D6A3F]" strokeWidth={2.5} />,
      iconBg: 'bg-[#2D6A3F]/10 border-[#2D6A3F]/25',
      title: 'طراوة الحقول مباشرة',
      desc: 'كنجيبو الخضر والفواكه يومياً من فلاحين مغاربة، بلا وسطاء، لضمان الطراوة والجودة الطبيعية.',
    },
    {
      id: 1,
      icon: <Truck className="w-8 h-8 sm:w-9 sm:h-9 text-[#EA580C]" strokeWidth={2.5} />,
      iconBg: 'bg-[#EA580C]/10 border-[#EA580C]/25',
      title: 'توصيل سريع وفي الموعد',
      desc: 'طلبك كيوصلك نفس النهار، وفي الوقت اللي يناسبك، بدقة واحترافية عالية حتال باب دارك.',
    },
    {
      id: 2,
      icon: <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-[#2D6A3F]" strokeWidth={2.5} />,
      iconBg: 'bg-[#2D6A3F]/10 border-[#2D6A3F]/25',
      title: 'دفع براحة واطمئنان',
      desc: 'ما كتخلص حتى كتوصلك السلعة وتشوفها بعينيك وترتاح — عاد كتخلص نقداً أو بالتحويل البنكي.',
    },
    {
      id: 3,
      icon: <HeartHandshake className="w-8 h-8 sm:w-9 sm:h-9 text-[#EA580C]" strokeWidth={2.5} />,
      iconBg: 'bg-[#EA580C]/10 border-[#EA580C]/25',
      title: 'ضمان الرضا 100%',
      desc: 'شي حاجة ما عجبتكش؟ كنبدلوها ليك أو كنرجعو ليك فلوسك فوراً — رضاك وراحة بالك هو رأس مالنا.',
    },
  ];

  const updateLayout = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cards = container.querySelectorAll('article');
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestIdx = 0;
    let minDiff = Infinity;

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const diff = Math.abs(cardCenter - containerCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setActiveCardIndex((prev) => (prev !== closestIdx ? closestIdx : prev));
  }, []);

  const handleScroll = () => {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(updateLayout);
  };

  // ✅ نبضة التركيز عند تغيير البطاقة
  useEffect(() => {
    if (prevActiveRef.current === activeCardIndex) return;
    prevActiveRef.current = activeCardIndex;
    setPulsingIndex(activeCardIndex);

    if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setPulsingIndex(null), FOCUS_PULSE_MS);
  }, [activeCardIndex]);

  useEffect(() => {
    return () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    };
  }, []);

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cards = container.querySelectorAll('article');
    if (cards[index]) {
      const card = cards[index] as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const deltaX = (cardRect.left + cardRect.width / 2) - (containerRect.left + containerRect.width / 2);

      container.scrollBy({ left: deltaX, behavior: 'smooth' });
      setActiveCardIndex(index);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-10 sm:my-16" aria-label="مميزات وثقة متجر خضرة">
      {/* ═══════ الأنماط الحركية ═══════ */}
      <style>{`
        @keyframes trustRippleExpand {
          0%   { transform: scale(0); opacity: 0.55; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .trust-ripple {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          transform: scale(0);
          animation: trustRippleExpand 0.65s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, opacity;
        }

        @keyframes trustFadeInRight {
          0%   { opacity: 0; transform: translateX(40px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .trust-fade-in-right {
          animation: trustFadeInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
          will-change: opacity, transform;
        }

        @keyframes trustFocusPulse {
          0%   { opacity: 0.5; }
          100% { opacity: 0; }
        }
        .trust-focus-pulse {
          animation: trustFocusPulse ${FOCUS_PULSE_MS}ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ✅ Spacer ذكي للجوال لتوسيط أول/آخر بطاقة */
        .trust-spacer {
          flex-shrink: 0;
          width: calc(50% - 33vw - 0.5rem);
        }
        @media (min-width: 640px) {
          .trust-spacer {
            width: calc(50% - 115px - 0.75rem);
          }
        }
        @media (min-width: 768px) {
          .trust-spacer { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .trust-ripple,
          .trust-fade-in-right,
          .trust-focus-pulse { animation: none; }
        }
      `}</style>

      {/* ─── العنوان والوصف ─── */}
      <div className="relative bg-gradient-to-b from-[#FAF8F3] to-[#F5EFE3] border border-[#2D6A3F]/12 rounded-[24px] sm:rounded-3xl shadow-[0_2px_10px_rgba(45,106,63,0.06)] p-6 sm:p-8 text-center max-w-xl mx-auto mb-8 sm:mb-10 overflow-hidden">
        {/* دوائر ضوئية */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#EAB308]/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#2D6A3F]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* شارة ذهبية */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FACC15] to-[#EAB308] border border-[#EAB308]/50 text-[#1A3D24] font-black text-xs sm:text-sm mb-4 shadow-[0_3px_12px_rgba(234,179,8,0.30)]">
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            <span>ضمانات وخدمة متجر خُضرة</span>
            <Award className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A3D24] tracking-tight mb-3 flex items-center justify-center gap-2 flex-wrap">
            علاش متجر خُضرة هو الخيار الأول للعائلات؟
            <span className="inline-block w-2 h-2 rounded-full bg-[#EAB308]" />
          </h2>

          <p className="text-xs sm:text-sm text-[#5A6B5F] font-bold leading-relaxed max-w-md mx-auto">
            مئات العائلات في فاس كيثقوا فينا كل نهار لتوفير طعام صحي وطازج لموائدهم
          </p>

          <div className="flex sm:hidden items-center justify-center gap-2 mt-5 pt-4 border-t border-[#2D6A3F]/10">
            <span className="text-[11px] font-black text-[#1A3D24]">اسحب لاكتشاف جميع الميزات</span>
            <span className="text-xs text-[#2D6A3F]">←</span>
          </div>
        </div>
      </div>

      {/* ─── عرض أفقي ─── */}
      <div className="relative max-w-5xl mx-auto py-2">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex flex-row gap-4 sm:gap-6 overflow-x-auto py-5 snap-x snap-mandatory overscroll-x-contain no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {/* Spacer أيسر (جوال) */}
          <div className="trust-spacer" aria-hidden="true" />

          {features.map((f, idx) => {
            const isActive = activeCardIndex === idx;
            const isPulsing = pulsingIndex === idx;

            return (
              <RippleButton
                key={f.id}
                onClick={() => scrollToIndex(idx)}
                ariaLabel={`الميزة: ${f.title}`}
                rippleColor={idx % 2 === 0 ? 'rgba(45,106,63,0.22)' : 'rgba(234,88,12,0.22)'}
                className={`trust-fade-in-right group w-[66vw] min-w-[210px] max-w-[245px] sm:w-[230px] md:w-[245px] shrink-0 snap-center bg-white rounded-3xl border-2 transition-all duration-300 md:hover:-translate-y-1 px-5 py-7 text-center flex flex-col items-center justify-center min-h-[290px] sm:min-h-[310px] cursor-pointer select-none ${
                  isActive
                    ? 'border-[#2D6A3F] shadow-[0_6px_20px_rgba(45,106,63,0.14)] scale-[1.01]'
                    : 'border-[#2D6A3F]/20 hover:border-[#2D6A3F]/45 shadow-xs hover:shadow-[0_10px_24px_rgba(45,106,63,0.12)]'
                }`}
                // @ts-ignore
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* الأيقونة */}
                <div
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl ${f.iconBg} border-2 flex items-center justify-center shadow-2xs mb-5 relative z-10 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3`}
                >
                  {f.icon}
                </div>

                {/* العنوان */}
                <h3 className="text-base sm:text-lg font-black text-[#1A3D24] leading-snug mb-3 text-center relative z-10">
                  {f.title}
                </h3>

                {/* النص */}
                <p className="text-xs sm:text-[13px] text-[#5A6B5F] font-semibold leading-relaxed text-center relative z-10">
                  {f.desc}
                </p>

                {/* ✅ نبضة التركيز */}
                {isPulsing && (
                  <div
                    className="trust-focus-pulse absolute inset-0 rounded-3xl bg-[#EAB308]/12 pointer-events-none"
                    aria-hidden="true"
                  />
                )}
              </RippleButton>
            );
          })}

          {/* Spacer أيمن (جوال) */}
          <div className="trust-spacer" aria-hidden="true" />
        </div>

        {/* ─── نقاط التنقل ─── */}
        <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
          {features.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToIndex(idx)}
              className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                activeCardIndex === idx
                  ? 'w-7 bg-[#2D6A3F] shadow-xs'
                  : 'w-2.5 bg-[#2D6A3F]/30 hover:bg-[#2D6A3F]/55'
              }`}
              aria-label={`الانتقال إلى الميزة ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};