// ============================================================
// Footer.tsx – تذييل المتجر المتطور
// إصلاح الهامش الزائد + تحسين عرض بطاقة الواتساب + وضوح حقوق الملكية
// + قفل مخفي + فتح اللوحة بـ 3 ضغطات على الشعار + تأثير نبضي
// ============================================================
import React, { useRef, useState } from 'react';
import {
  Truck,
  MessageCircle,
  Lock,
  Star,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { STORE_CONFIG } from '../../data/config';

interface FooterProps {
  onOpenPage: (page: 'about' | 'policy' | 'privacy' | null) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPage }) => {
  // ═══════ عداد الضغطات على الشعار (3 ضغطات = فتح لوحة التحكم) ═══════
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<number | null>(null);

  // ═══════ حالة التأثير النبضي البصري ═══════
  const [pulseCount, setPulseCount] = useState(0);

  const handleAdminTrigger = () => {
    window.dispatchEvent(new CustomEvent('khodra_trigger_admin_modal'));
  };

  const handleLogoClick = () => {
    // تصفير العداد إذا مرّ وقت طويل بين الضغطات (1.5 ثانية)
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
    }

    clickCountRef.current += 1;

    // ═══ التأثير البصري النبضي عند كل ضغطة ═══
    setPulseCount((c) => c + 1);

    // عند الوصول إلى 3 ضغطات → فتح لوحة التحكم
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      handleAdminTrigger();
      return;
    }

    // إعادة تعيين العداد بعد 1.5 ثانية من آخر ضغطة
    clickTimerRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
    }, 1500);
  };

  const scrollToSection = (id: string) => {
    try {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch {}
  };

  return (
    <footer
      className="relative overflow-hidden bg-[#070b09] text-white pt-6 pb-0 border-t-2 border-[#EAB308]/40 shadow-2xl select-none"
      dir="rtl"
    >
      {/* ═══════ خط التوهج الذهبي في أعلى الفوتر ═══════ */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#EAB308]/70 to-transparent pointer-events-none" />

      {/* ═══════ إضاءات محيطية ناعمة تحاكي لوحة الإدارة ═══════ */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-[#EAB308]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ═══════ أنماط التأثير النبضي (تُحقن مرة واحدة) ═══════ */}
      <style>{`
        @keyframes khodra-logo-pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 6px 22px rgba(234, 179, 8, 0.28),
                        0 0 0 0 rgba(234, 179, 8, 0.55);
          }
          50% {
            transform: scale(1.12);
            box-shadow: 0 6px 22px rgba(234, 179, 8, 0.55),
                        0 0 0 10px rgba(234, 179, 8, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 6px 22px rgba(234, 179, 8, 0.28),
                        0 0 0 0 rgba(234, 179, 8, 0);
          }
        }
        .khodra-logo-pulse {
          animation: khodra-logo-pulse 0.45s ease-out;
        }

        @keyframes khodra-logo-success {
          0%   { transform: scale(1);   box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.8); }
          40%  { transform: scale(1.22); box-shadow: 0 0 0 14px rgba(34, 197, 94, 0); }
          100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .khodra-logo-success {
          animation: khodra-logo-success 0.6s ease-out;
          border-color: rgba(34, 197, 94, 0.9) !important;
        }
      `}</style>

      <div className="relative max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 space-y-5">

        {/* ════════ رأس الفوتر: هوية المتجر والعلامة التجارية ════════ */}
        <div className="flex flex-col items-center text-center space-y-2 max-w-2xl mx-auto">
          {/* 🌿 الشعار – اضغط 3 مرات لفتح لوحة التحكم */}
          <button
            type="button"
            onClick={handleLogoClick}
            aria-label="شعار المتجر"
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#2D6A3F] to-[#122A18] border border-[#EAB308]/60 flex items-center justify-center shadow-[0_6px_22px_rgba(234,179,8,0.28)] shrink-0 cursor-pointer transition-transform ${
              pulseCount >= 3 ? 'khodra-logo-success' : 'khodra-logo-pulse'
            }`}
            key={pulseCount} /* ← إعادة تشغيل الأنيميشن في كل ضغطة */
          >
            <span className="text-xl sm:text-2xl">🌿</span>
          </button>

          <div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                متجر <span className="text-[#F5D76E]">{STORE_CONFIG.storeName}</span>
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                FES
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-300 font-medium mt-1.5 leading-relaxed">
              نختار لكم كل صباح أجود الخضار، الفواكه، ومنتجات البقالة والألبان بعناية فائقة من أسواق الجملة بفاس مع توصيل سريع وموثوق لباب دارك.
            </p>
          </div>
        </div>

        {/* ─── بطاقة: معلومات وخدمات المتجر ─── */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-md flex flex-col justify-between">
          <div className="pb-3 border-b border-zinc-800 text-center">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              معلومات وخدمات المتجر
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onOpenPage('about')}
              className="group bg-zinc-950/70 hover:bg-[#122A18] border border-zinc-800 hover:border-[#EAB308]/60 rounded-2xl p-4 sm:p-5 text-center transition-all duration-200 shadow-sm flex flex-col items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-[#2D6A3F]/30 border border-[#EAB308]/30 flex items-center justify-center text-[#F5D76E] shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-center">
                <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                  من نحن ورسالتنا
                </h4>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">قصتنا وقيمنا</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenPage('policy')}
              className="group bg-zinc-950/70 hover:bg-[#122A18] border border-zinc-800 hover:border-[#EAB308]/60 rounded-2xl p-4 sm:p-5 text-center transition-all duration-200 shadow-sm flex flex-col items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-[#2D6A3F]/30 border border-[#EAB308]/30 flex items-center justify-center text-[#F5D76E] shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-center">
                <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                  التوصيل والإرجاع
                </h4>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">المواعيد والشروط</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenPage('privacy')}
              className="group bg-zinc-950/70 hover:bg-[#122A18] border border-zinc-800 hover:border-[#EAB308]/60 rounded-2xl p-4 sm:p-5 text-center transition-all duration-200 shadow-sm flex flex-col items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-[#2D6A3F]/30 border border-[#EAB308]/30 flex items-center justify-center text-[#F5D76E] shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-center">
                <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                  سياسة الخصوصية
                </h4>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">أمان وسرية بياناتك</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('customer-reviews-section')}
              className="group bg-zinc-950/70 hover:bg-[#122A18] border border-zinc-800 hover:border-[#EAB308]/60 rounded-2xl p-4 sm:p-5 text-center transition-all duration-200 shadow-sm flex flex-col items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-[#2D6A3F]/30 border border-[#EAB308]/30 flex items-center justify-center text-[#F5D76E] shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-center">
                <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                  تقييمات الزبناء
                </h4>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">آراء أهل فاس</p>
              </div>
            </button>
          </div>
        </div>

        {/* ════════ مركز خدمة الزبناء والواتساب ════════ */}
        <div className="bg-gradient-to-br from-[#122A18] via-[#0b1c10] to-[#07130a] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative max-w-xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>متصل الآن • En ligne</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-white">
                هل تحتاج مساعدة أو لديك طلب خاص؟
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed max-w-lg mx-auto">
                فريقنا رهن إشارتكم لتلقي استفساراتكم أو استلام قائمة مشترياتكم الصوتية والمكتوبة. تواصلوا معنا مباشرة عبر الواتساب.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <a
                href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-[#22C55E] to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-8 py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base transition-all duration-200 shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_12px_36px_rgba(34,197,94,0.55)] hover:-translate-y-0.5 active:scale-95 cursor-pointer border border-emerald-300/50 w-full sm:w-auto min-w-[260px]"
              >
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                </div>
                <span>تواصل فوري عبر الواتساب</span>
              </a>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-200/80 font-bold pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>استجابة ومتابعة سريعة مع مندوب التوصيل</span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            التذييل السفلي: حقوق الملكية – عرض أوضح ومحسّن
            ════════════════════════════════════════════════════════════ */}
        <div className="pt-6 border-t border-zinc-800">
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center">

              {/* النص */}
              <p className="text-sm sm:text-base text-stone-200 font-bold leading-relaxed">
                جميع الحقوق محفوظة © {new Date().getFullYear()}{' '}
                <strong className="text-[#F5D76E] font-black">{STORE_CONFIG.storeName}</strong>
              </p>

              {/* الفاصل – يظهر فقط على الشاشات الكبيرة */}
              <span className="hidden sm:inline-block w-px h-5 bg-zinc-700" aria-hidden="true" />

              {/* الشركة */}
              <p className="text-[11px] sm:text-xs text-stone-400 font-semibold">
                شركة خُضرة للتجارة الإلكترونية SARL
              </p>

              {/* 🔒 قفل المدير – مخفي تمامًا بلون خلفية الفوتر الليلي */}
              <button
                type="button"
                onClick={handleAdminTrigger}
                title=""
                aria-label=""
                tabIndex={-1}
                className="admin-lock p-0 m-0 bg-transparent border-0 shadow-none outline-none text-[#070b09] hover:text-[#F5D76E] transition-colors cursor-pointer select-none shrink-0 leading-none"
                style={{ background: 'transparent', border: 'none' }}
              >
                <Lock className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            مساحة سفلية محجوزة لشريط السلة العائم (Cart Bar)
            ════════════════════════════════════════════════════════════ */}
        <div
          aria-hidden="true"
          className="w-full h-[80px] sm:h-[70px] pointer-events-none"
        />

      </div>
    </footer>
  );
};

export default Footer;