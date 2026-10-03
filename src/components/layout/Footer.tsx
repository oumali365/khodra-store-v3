// ============================================================
// Footer.tsx – تذييل المتجر المتطور بالمعايير الفاخرة الموحدة
// تصميم احترافي متناسق مع لوحة إدارة المتجر: خلفية داكنة عميقة + بطاقات تفاعلية + شارات جودة + زر واتساب 
// ============================================================
import React from 'react';
import {
  Heart,
  Truck,
  MessageCircle,
  Lock,
  MapPin,
  Clock,
  Sparkles,
  ChevronLeft,
  Star,
  CheckCircle2,
  BookOpen,
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
      className="relative overflow-hidden bg-[#070b09] text-white pt-8 pb-16 sm:pb-10 border-t-2 border-[#EAB308]/40 shadow-2xl select-none"
      dir="rtl"
    >
      {/* ═══════ خط التوهج الذهبي في أعلى الفوتر ═══════ */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#EAB308]/70 to-transparent pointer-events-none" />

      {/* ═══════ إضاءات محيطية ناعمة تحاكي لوحة الإدارة ═══════ */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-[#EAB308]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 space-y-6">

        {/* ════════ رأس الفوتر: هوية المتجر والعلامة التجارية ════════ */}
        <div className="flex flex-col items-center text-center space-y-2 max-w-2xl mx-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#2D6A3F] to-[#122A18] border-1 border-[#EAB308]/60 flex items-center justify-center shadow-[0_6px_22px_rgba(234,179,8,0.28)] shrink-0">
            <span className="text-xl sm:text-2xl">🌿</span>
          </div>

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
            <p className="text-[12px] sm:text-xs text-stone-400 font-medium mt-2 leading-relaxed">
              نختار لكم كل صباح أجود الخضار، الفواكه، ومنتجات البقالة والألبان بعناية فائقة من أسواق الجملة بفاس مع توصيل سريع وموثوق لباب دارك.
            </p>
          </div>
        </div>

        {/* ════════ القسم الأوسط: معلومات الخدمة والتغطية في بطاقتين متوازنتين ════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 pt-1">

          {/* ─── بطاقة أ: روابط وخدمات المتجر ─── */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 text-right space-y-2.5 shadow-md">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white">
                  معلومات وخدمات المتجر
                </h3>
              </div>
              <span className="text-[9px] font-bold text-stone-400">
                روابط سريعة
              </span>
            </div>

            {/* شبكة البطاقات 2×2 */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {/* بطاقة: من نحن */}
              <button
                type="button"
                onClick={() => onOpenPage('about')}
                className="group bg-gradient-to-br from-zinc-900/90 to-[#0e1f13] border border-emerald-500/30 hover:border-[#EAB308]/60 rounded-xl p-2.5 text-right transition-all duration-200 shadow-md hover:shadow-emerald-950/50 flex flex-col justify-between active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#2D6A3F] to-[#183921] border border-[#EAB308]/40 flex items-center justify-center shrink-0 shadow-sm">
                    <BookOpen className="w-3.5 h-3.5 text-[#F5D76E]" strokeWidth={2.5} />
                  </div>
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#F5D76E] group-hover:-translate-x-1 transition-all" />
                </div>
                <div className="mt-2">
                  <h4 className="text-[11px] font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                    من نحن ورسالتنا
                  </h4>
                </div>
              </button>

              {/* بطاقة: سياسة التوصيل */}
              <button
                type="button"
                onClick={() => onOpenPage('policy')}
                className="group bg-gradient-to-br from-zinc-900/90 to-[#0e1f13] border border-emerald-500/30 hover:border-[#EAB308]/60 rounded-xl p-2.5 text-right transition-all duration-200 shadow-md hover:shadow-emerald-950/50 flex flex-col justify-between active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#2D6A3F] to-[#183921] border border-[#EAB308]/40 flex items-center justify-center shrink-0 shadow-sm">
                    <Truck className="w-3.5 h-3.5 text-[#F5D76E]" strokeWidth={2.5} />
                  </div>
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#F5D76E] group-hover:-translate-x-1 transition-all" />
                </div>
                <div className="mt-2">
                  <h4 className="text-[11px] font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                    سياسة التوصيل والإرجاع
                  </h4>
                </div>
              </button>

              {/* بطاقة: سياسة الخصوصية */}
              <button
                type="button"
                onClick={() => onOpenPage('privacy')}
                className="group bg-gradient-to-br from-zinc-900/90 to-[#0e1f13] border border-emerald-500/30 hover:border-[#EAB308]/60 rounded-xl p-2.5 text-right transition-all duration-200 shadow-md hover:shadow-emerald-950/50 flex flex-col justify-between active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#2D6A3F] to-[#183921] border border-[#EAB308]/40 flex items-center justify-center shrink-0 shadow-sm">
                    <Lock className="w-3.5 h-3.5 text-[#F5D76E]" strokeWidth={2.5} />
                  </div>
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#F5D76E] group-hover:-translate-x-1 transition-all" />
                </div>
                <div className="mt-2">
                  <h4 className="text-[11px] font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                    سياسة الخصوصية
                  </h4>
                </div>
              </button>

              {/* بطاقة: آراء الزبناء */}
              <button
                type="button"
                onClick={() => scrollToSection('customer-reviews-section')}
                className="group bg-gradient-to-br from-zinc-900/90 to-[#0e1f13] border border-emerald-500/30 hover:border-[#EAB308]/60 rounded-xl p-2.5 text-right transition-all duration-200 shadow-md hover:shadow-emerald-950/50 flex flex-col justify-between active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#2D6A3F] to-[#183921] border border-[#EAB308]/40 flex items-center justify-center shrink-0 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-[#F5D76E]" strokeWidth={2.5} />
                  </div>
                  <ChevronLeft className="w-3 h-3 text-stone-500 group-hover:text-[#F5D76E] group-hover:-translate-x-1 transition-all" />
                </div>
                <div className="mt-2">
                  <h4 className="text-[11px] font-black text-white group-hover:text-[#F5D76E] transition-colors leading-tight">
                    آراء زبنائنا بفاس
                  </h4>
                </div>
              </button>
            </div>
          </div>

          {/* ─── بطاقة ب: أوقات العمل والتغطية ─── */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 text-right space-y-2.5 shadow-md">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white">
                  المواعيد ونطاق التوصيل
                </h3>
              </div>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                متاح يومياً
              </span>
            </div>

            <div className="space-y-2 text-[11px] text-stone-300">
              <div className="flex items-start gap-2 bg-zinc-800/40 p-2 rounded-xl border border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-[#F5D76E] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-black text-[10px] sm:text-[11px]">
                    أوقات استقبال الطلبات والتوصيل:
                  </strong>
                  <span className="text-stone-300 text-[10px] leading-snug">
                    يومياً وطيلة أيام الأسبوع من 08:00 صباحاً حتى 20:00 مساءً.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-zinc-800/40 p-2 rounded-xl border border-zinc-800">
                <MapPin className="w-3.5 h-3.5 text-[#EA580C] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-black text-[10px] sm:text-[11px]">
                    أحياء مدينة فاس المغطاة:
                  </strong>
                  <span className="text-stone-300 text-[10px] leading-snug">
                    طريق إيموزار، الأطلس، النرجس، عين الشقف، المدينة الجديدة، زواغة، وبنسودة...
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ════════ مركز خدمة الزبناء والواتساب ════════ */}
        <div className="bg-gradient-to-br from-[#122A18] via-[#0b1c10] to-[#07130a] border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-6 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative max-w-xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>خدمة الزبناء والمساعدة الفورية • En ligne</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm sm:text-lg font-black text-white">
                هل تحتاج مساعدة أو لديك طلب خاص؟
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100/80 font-medium leading-relaxed">
                فريقنا رهن إشارتكم لتلقي استفساراتكم أو استلام قائمة مشترياتكم الصوتية والمكتوبة.
              </p>
            </div>

            <div className="pt-1 flex justify-center">
              <a
                href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 via-[#22C55E] to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-6 py-2.5 sm:py-3 rounded-2xl font-black text-[11px] sm:text-xs transition-all duration-200 shadow-[0_6px_22px_rgba(34,197,94,0.35)] hover:shadow-[0_8px_28px_rgba(34,197,94,0.50)] hover:-translate-y-0.5 active:scale-95 cursor-pointer border border-emerald-300/40 w-auto min-w-[220px] sm:min-w-[260px]"
              >
                <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
                </div>
                <span>تواصل فوري عبر الواتساب</span>
              </a>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-200/70 font-semibold pt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>استجابة ومتابعة سريعة مع مندوب التوصيل</span>
            </div>
          </div>
        </div>

        {/* ════════ التذييل السفلي وحقوق الملكية وزر إدارة المتجر ════════ */}
        <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-3 text-center sm:text-right">

          <div className="flex items-center justify-center sm:justify-start gap-2 font-bold">
            <button
              type="button"
              onClick={handleAdminTrigger}
              title="دخول لوحة تحكم وإدارة المتجر (PIN)"
              aria-label="دخول إدارة المتجر"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-stone-400 hover:text-[#F5D76E] border border-zinc-700 hover:border-amber-400/50 transition-all cursor-pointer select-none shadow-xs group"
            >
              <Lock className="w-3 h-3 text-stone-400 group-hover:text-[#F5D76E] transition-colors" />
            </button>
            <p>
              جميع الحقوق محفوظة © {new Date().getFullYear()}{' '}
              <strong className="text-[#F5D76E] font-black">{STORE_CONFIG.storeName}</strong>{' '}
              <span className="text-stone-500 text-[10px] hidden sm:inline">(شركة خُضرة للتجارة الإلكترونية SARL)</span>
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 justify-center font-bold text-[10px] sm:text-[11px] bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-800 text-stone-300 transition-colors shadow-2xs">
            <span>صنع بكل</span>
            <Heart className="w-3 h-3 text-red-500 fill-current animate-bounce" />
            <span className="text-white font-black">لخدمة المائدة الفاسية والمغربية</span>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;