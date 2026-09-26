// ============================================================
// الملف: Footer.tsx – الإصدار 2.1
// تذييل مختصر + هوية خضرة + زر "العودة للأعلى" مدمج
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, ShieldCheck, Truck, RefreshCw, MessageCircle, Lock, ChevronUp,
} from 'lucide-react';
import { STORE_CONFIG } from '../data/config';

interface FooterProps {
  onOpenPage: (page: 'about' | 'policy' | 'privacy' | null) => void;
}

// ═══════ زر Ripple ═══════
const RippleButton: React.FC<{
  onClick?: () => void;
  className: string;
  children: React.ReactNode;
  rippleColor?: string;
  ariaLabel?: string;
  href?: string;
  target?: string;
  rel?: string;
}> = ({
  onClick,
  className,
  children,
  rippleColor = 'rgba(255,255,255,0.25)',
  ariaLabel,
  href,
  target,
  rel,
}) => {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'footer-ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.background = rippleColor;
      el.appendChild(ripple);

      window.setTimeout(() => ripple.remove(), 650);
    }
    onClick?.();
  };

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        onClick={handleClick}
        className={`relative overflow-hidden ${className}`}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </button>
  );
};

// ═══════ زر العودة للأعلى (مدمج) ═══════
const BackToTopButton: React.FC<{ threshold?: number }> = ({ threshold = 400 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const top = window.scrollY;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const p = total > 0 ? Math.min(100, (top / total) * 100) : 0;
        setIsVisible(top > threshold);
        setProgress(p);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [threshold]);

  if (!isVisible) return null;

  const R = 20;
  const C = 2 * Math.PI * R;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="العودة إلى أعلى الصفحة"
      title="العودة للأعلى"
      className="footer-back-to-top absolute -top-6 left-4 sm:left-6 w-12 h-12 rounded-full
                 bg-gradient-to-br from-[#2D6A3F] to-[#1A3D24]
                 hover:from-[#3A8152] hover:to-[#2D6A3F]
                 shadow-[0_6px_22px_rgba(45,106,63,0.45)]
                 hover:shadow-[0_8px_28px_rgba(45,106,63,0.55)]
                 border-2 border-[#EAB308]/50
                 flex items-center justify-center
                 cursor-pointer active:scale-90
                 transition-all duration-200
                 group z-10"
    >
      {/* دائرة التقدم */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r={R} fill="none" stroke="rgba(234,179,8,0.15)" strokeWidth="2.5" />
        <circle
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke="#EAB308"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress / 100)}
          style={{ transition: 'stroke-dashoffset 0.15s linear' }}
        />
      </svg>

      <ChevronUp
        className="w-5 h-5 text-[#EAB308] relative z-10 footer-arrow-bounce
                   group-hover:scale-110 transition-transform duration-200"
        strokeWidth={2.5}
      />
    </button>
  );
};

export const Footer: React.FC<FooterProps> = ({ onOpenPage }) => {
  const handleAdminTrigger = () => {
    window.dispatchEvent(new CustomEvent('khodra_trigger_admin_modal'));
  };

  return (
    <>
      <style>{`
        @keyframes footerRippleExpand {
          0%   { transform: scale(0); opacity: 0.55; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .footer-ripple {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          transform: scale(0);
          animation: footerRippleExpand 0.65s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, opacity;
        }

        @keyframes footerLogoGlow {
          0%, 100% { text-shadow: 0 0 0 rgba(234,179,8,0); }
          50%      { text-shadow: 0 0 20px rgba(234,179,8,0.5); }
        }
        .footer-logo-glow {
          animation: footerLogoGlow 3.5s ease-in-out infinite;
        }

        @keyframes footerBackToTopIn {
          0%   { opacity: 0; transform: translateY(20px) scale(0.8); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .footer-back-to-top {
          animation: footerBackToTopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes footerArrowBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-2px); }
        }
        .footer-arrow-bounce {
          animation: footerArrowBounce 2.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .footer-ripple,
          .footer-logo-glow,
          .footer-back-to-top,
          .footer-arrow-bounce { animation: none; }
        }
      `}</style>

      {/* ✅ الحاوية relative لتثبيت زر BackToTop فوقها */}
      <footer className="relative bg-gradient-to-b from-[#1A3D24] to-[#0E2615] text-white pt-10 pb-20 sm:pb-16 border-t-2 border-[#EAB308]/40 overflow-visible">

        {/* ✅ زر العودة للأعلى — يبرز فوق الحافة العلوية للفوتر */}
        <BackToTopButton threshold={400} />

        {/* دوائر ضوئية خفيفة */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#EAB308]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#2D6A3F]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ════════ الشبكة الرئيسية ════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-right items-start">

            {/* ─── العمود 1: العلامة التجارية ─── */}
            <div className="space-y-4 max-w-md mx-auto md:mx-0 text-center md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                {/* شعار الورقة في خلفية دائرية */}
                <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2D6A3F] to-[#1A3D24] border border-[#EAB308]/30 flex items-center justify-center text-xl shrink-0 shadow-[0_4px_14px_rgba(45,106,63,0.35)]">
                  🌿
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#EAB308] tracking-tight footer-logo-glow">
                  {STORE_CONFIG.storeName}
                </span>
              </div>

              <p className="text-sm text-white/90 leading-[1.9] font-medium">
                نرسل أجود الخضروات، الفواكه، وأفضل منتجات البقالة والألبان مع توصيل سريع ومباشر لباب الدار.
              </p>

              {/* شارات الميزات — بهوية موحّدة */}
              <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start">
                <span className="text-xs bg-[#2D6A3F]/40 hover:bg-[#2D6A3F]/60 px-3.5 py-1.5 rounded-full border border-[#EAB308]/30 font-bold text-white flex items-center gap-1.5 backdrop-blur-sm transition-all duration-200 cursor-default">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#EAB308]" strokeWidth={2.5} />
                  <span>100% طراوة</span>
                </span>
                <span className="text-xs bg-[#2D6A3F]/40 hover:bg-[#2D6A3F]/60 px-3.5 py-1.5 rounded-full border border-[#EAB308]/30 font-bold text-white flex items-center gap-1.5 backdrop-blur-sm transition-all duration-200 cursor-default">
                  <Truck className="w-3.5 h-3.5 text-[#EAB308]" strokeWidth={2.5} />
                  <span>توصيل سريع</span>
                </span>
                <span className="text-xs bg-[#2D6A3F]/40 hover:bg-[#2D6A3F]/60 px-3.5 py-1.5 rounded-full border border-[#EAB308]/30 font-bold text-white flex items-center gap-1.5 backdrop-blur-sm transition-all duration-200 cursor-default">
                  <RefreshCw className="w-3.5 h-3.5 text-[#EAB308]" strokeWidth={2.5} />
                  <span>دفع آمن</span>
                </span>
              </div>
            </div>

            {/* ─── العمود 2: روابط مهمة + الواتساب ─── */}
            <div className="space-y-4 text-center md:text-right max-w-md mx-auto md:mx-0 w-full">
              <h3 className="text-base sm:text-lg font-black text-[#EAB308] relative inline-block md:block">
                روابط مهمة
                <span className="block h-0.5 w-12 bg-gradient-to-r from-[#EAB308] to-transparent rounded-full mt-2 mx-auto md:mx-0" />
              </h3>

              {/* قائمة الروابط — نمط Chip أنيق */}
              <ul className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPage('about')}
                    className="text-xs sm:text-sm text-white hover:text-[#EAB308] bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 hover:border-[#EAB308]/40 transition-all duration-200 cursor-pointer font-bold active:scale-95"
                  >
                    من نحن
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPage('policy')}
                    className="text-xs sm:text-sm text-white hover:text-[#EAB308] bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 hover:border-[#EAB308]/40 transition-all duration-200 cursor-pointer font-bold active:scale-95"
                  >
                    سياسة الإرجاع
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPage('privacy')}
                    className="text-xs sm:text-sm text-white hover:text-[#EAB308] bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 hover:border-[#EAB308]/40 transition-all duration-200 cursor-pointer font-bold active:scale-95"
                  >
                    سياسة الخصوصية
                  </button>
                </li>
              </ul>

              {/* زر الواتساب مع Ripple */}
              <div className="pt-1">
                <RippleButton
                  href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  rippleColor="rgba(255,255,255,0.35)"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#25D366] to-[#20BA5A] hover:from-[#20BA5A] hover:to-[#1AA34A] text-white px-5 py-2.5 rounded-2xl font-black text-sm no-underline transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,211,102,0.40)] cursor-pointer shadow-[0_4px_14px_rgba(37,211,102,0.25)] border border-[#25D366]/30"
                >
                  <MessageCircle className="w-4 h-4 fill-current text-white relative z-10" />
                  <span className="relative z-10">تواصل عبر الواتساب</span>
                </RippleButton>
              </div>
            </div>

          </div>

          {/* ════════ التذييل السفلي ════════ */}
          <div className="pt-5 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between text-xs text-white/85 gap-3 text-center">

            {/* حقوق النشر + زر المدير */}
            <div className="font-bold tracking-wide flex items-center justify-center sm:justify-start gap-1.5">
              <button
                type="button"
                onClick={handleAdminTrigger}
                title="إدارة تقييمات المتجر"
                aria-label="إدارة التقييمات للمدير"
                className="text-white/35 hover:text-[#EAB308] transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer select-none active:scale-90"
              >
                <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <p>
                جميع الحقوق محفوظة © {new Date().getFullYear()}{' '}
                <span className="text-[#EAB308] font-black">{STORE_CONFIG.storeName}</span>
              </p>
            </div>

            {/* "صنع بكل ❤️" */}
            <p className="flex items-center gap-1.5 justify-center font-bold whitespace-nowrap bg-[#2D6A3F]/40 hover:bg-[#2D6A3F]/60 px-3.5 py-1.5 rounded-full border border-[#EAB308]/25 transition-colors duration-200">
              <span>صنع بكل</span>
              <Heart className="w-3.5 h-3.5 text-[#FB923C] fill-current animate-bounce" />
              <span className="text-white">لخدمة المائدة المغربية</span>
            </p>
          </div>

        </div>
      </footer>
    </>
  );
};