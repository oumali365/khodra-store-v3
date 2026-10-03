// ============================================================
// Footer.tsx – تذييل المتجر المتطور بالمعايير اللونية الحديثة
// هوية بصرية موحدة: أخضر غابوي عميق + لمسات ذهبية وترابية + شارات الجودة
// ============================================================
import React from 'react';
import {
  Heart,
  ShieldCheck,
  Truck,
  RefreshCw,
  MessageCircle,
  Lock,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';
import { STORE_CONFIG } from '../../data/config';

interface FooterProps {
  onOpenPage: (page: 'about' | 'policy' | 'privacy' | null) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPage }) => {
  const handleAdminTrigger = () => {
    window.dispatchEvent(new CustomEvent('khodra_trigger_admin_modal'));
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
      className="relative overflow-hidden bg-gradient-to-b from-[#142E1B] via-[#0E2415] to-[#09170E] text-white pt-12 pb-24 sm:pb-16 border-t-2 border-[#EAB308]/40 shadow-2xl"
      dir="rtl"
    >
      {/* ═══════ إضاءات محيطية ناعمة للهوية البصرية ═══════ */}
      <div className="absolute -top-32 right-1/4 w-96 h-96 bg-[#2D6A3F]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-80 h-80 bg-[#EAB308]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-64 h-64 bg-[#EA580C]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ════════ شبكة المحتوى الرئيسية (3 أعمدة متوازنة) ════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 pb-10 border-b border-white/15 text-right items-start">

          {/* ─── العمود 1: الهوية والعلامة التجارية ─── */}
          <div className="space-y-4 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2D6A3F] to-[#1A3D24] border border-[#EAB308]/40 flex items-center justify-center shadow-[0_4px_14px_rgba(234,179,8,0.25)] shrink-0">
                <span className="text-xl">🌿</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#F5D76E] tracking-tight block">
                  {STORE_CONFIG.storeName}
                </span>
                <span className="text-[11px] text-emerald-200/80 font-bold block -mt-1">
                  طراوة يومية لباب الدار بفاس
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-200/90 leading-relaxed font-medium">
              نختار لكم يومياً أجود الخضار، الفواكه الطازجة، ومنتجات البقالة والألبان بعناية فائقة من أسواق الجملة بفاس مع توصيل سريع وموثوق لباب منزلك.
            </p>

            {/* شارات الضمان الثلاثية المحدثة */}
            <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
              <span className="text-[11px] bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/15 font-bold text-white flex items-center gap-1.5 backdrop-blur-xs transition-colors shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F5D76E]" strokeWidth={2.5} />
                <span>100% جودة وطراوة</span>
              </span>
              <span className="text-[11px] bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/15 font-bold text-white flex items-center gap-1.5 backdrop-blur-xs transition-colors shadow-2xs">
                <Truck className="w-3.5 h-3.5 text-[#F5D76E]" strokeWidth={2.5} />
                <span>توصيل سريع 45 دقيقة</span>
              </span>
              <span className="text-[11px] bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/15 font-bold text-white flex items-center gap-1.5 backdrop-blur-xs transition-colors shadow-2xs">
                <RefreshCw className="w-3.5 h-3.5 text-[#F5D76E]" strokeWidth={2.5} />
                <span>ضمان الاستبدال</span>
              </span>
            </div>
          </div>

          {/* ─── العمود 2: روابط مهمة وشفافية الخدمة ─── */}
          <div className="space-y-3.5 text-center sm:text-right">
            <h3 className="text-sm sm:text-base font-black text-[#F5D76E] flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-[#EAB308]" strokeWidth={2.5} />
              <span>معلومات وخدمات</span>
            </h3>

            <ul className="space-y-2 pt-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPage('about')}
                  className="group inline-flex items-center gap-2 text-xs sm:text-sm text-stone-200 hover:text-[#F5D76E] transition-colors cursor-pointer font-bold"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#EAB308]/60 group-hover:text-[#F5D76E] group-hover:-translate-x-1 transition-all" />
                  <span>من نحن ورسالتنا</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPage('policy')}
                  className="group inline-flex items-center gap-2 text-xs sm:text-sm text-stone-200 hover:text-[#F5D76E] transition-colors cursor-pointer font-bold"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#EAB308]/60 group-hover:text-[#F5D76E] group-hover:-translate-x-1 transition-all" />
                  <span>سياسة التوصيل والإرجاع</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPage('privacy')}
                  className="group inline-flex items-center gap-2 text-xs sm:text-sm text-stone-200 hover:text-[#F5D76E] transition-colors cursor-pointer font-bold"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#EAB308]/60 group-hover:text-[#F5D76E] group-hover:-translate-x-1 transition-all" />
                  <span>سياسة الخصوصية وحماية البيانات</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('customer-reviews-section')}
                  className="group inline-flex items-center gap-2 text-xs sm:text-sm text-stone-200 hover:text-[#F5D76E] transition-colors cursor-pointer font-bold"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#EAB308]/60 group-hover:text-[#F5D76E] group-hover:-translate-x-1 transition-all" />
                  <span>آراء وتقييمات زبنائنا بفاس</span>
                </button>
              </li>
            </ul>
          </div>

          {/* ─── العمود 3: التواصل الفوري والدعم ─── */}
          <div className="space-y-3.5 text-center sm:text-right">
            <h3 className="text-sm sm:text-base font-black text-[#F5D76E] flex items-center justify-center sm:justify-start gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
              <span>خدمة الزبناء والطلبات</span>
            </h3>

            <p className="text-xs text-stone-200 leading-relaxed font-medium">
              فريقنا جاهز للرد على استفساراتكم ومتابعة طلباتكم بكل اهتمام عبر الواتساب المباشر.
            </p>

            <div className="pt-1">
              <a
                href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2.5 bg-gradient-to-l from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 shadow-[0_6px_20px_rgba(34,197,94,0.30)] hover:shadow-[0_8px_26px_rgba(34,197,94,0.45)] hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto cursor-pointer border border-emerald-400/30"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                <MessageCircle className="w-4 h-4 fill-current text-white shrink-0" />
                <span>تواصل فوري عبر الواتساب</span>
              </a>
            </div>
          </div>

        </div>

        {/* ════════ التذييل السفلي وحقوق الملكية ════════ */}
        <div className="pt-6 flex items-center justify-center text-xs text-stone-300 gap-4 text-center">

          {/* حقوق النشر الرسمية + زر قفل المدير */}
          <div className="flex items-center justify-center gap-2 font-bold tracking-wide">
            <button
              type="button"
              onClick={handleAdminTrigger}
              title="دخول إدارة المتجر (PIN)"
              aria-label="دخول إدارة المتجر"
              className="text-stone-400 hover:text-[#F5D76E] transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer select-none"
            >
              <Lock className="w-3.5 h-3.5 text-stone-400 hover:text-[#F5D76E]" />
            </button>
            <p>
              جميع الحقوق محفوظة © {new Date().getFullYear()}{' '}
              <strong className="text-[#F5D76E] font-black">{STORE_CONFIG.storeName}</strong>{' '}
              <span className="text-stone-400 text-[11px] hidden sm:inline">(شركة خُضرة للتجارة الإلكترونية SARL)</span>
            </p>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;