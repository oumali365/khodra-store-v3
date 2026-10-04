// ============================================================
// Footer.tsx – تذييل المتجر المتطور
// إصلاح الهامش الزائد + تحسين عرض بطاقة الواتساب + وضوح حقوق الملكية
// ============================================================
import React from 'react';
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
      className="relative overflow-hidden bg-[#070b09] text-white pt-6 pb-0 border-t-2 border-[#EAB308]/40 shadow-2xl select-none"
      dir="rtl"
    >
      {/* ═══════ خط التوهج الذهبي في أعلى الفوتر ═══════ */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#EAB308]/70 to-transparent pointer-events-none" />

      {/* ═══════ إضاءات محيطية ناعمة تحاكي لوحة الإدارة ═══════ */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-[#EAB308]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 space-y-5">

        {/* ════════ رأس الفوتر: هوية المتجر والعلامة التجارية ════════ */}
        <div className="flex flex-col items-center text-center space-y-2 max-w-2xl mx-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#2D6A3F] to-[#122A18] border border-[#EAB308]/60 flex items-center justify-center shadow-[0_6px_22px_rgba(234,179,8,0.28)] shrink-0">
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

        {/* ════════ مركز خدمة الزبناء والواتساب (عرض أوضح وأكثر بروزاً) ════════ */}
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

        {/* ════════ التذييل السفلي وحقوق الملكية (عرض أوضح) ════════ */}
<div className="pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm text-stone-300 gap-4 text-center">

  {/* ✅ القفل الآن على يمين نص الحقوق في نفس السطر + بدون إطار + بلون خلفية الفوتر */}
  <div className="flex flex-row-reverse items-center justify-center gap-2 font-bold flex-wrap">

    {/* 🔒 قفل المدير – مخفي بلون خلفية الفوتر الليلي */}
    <button
      type="button"
      onClick={handleAdminTrigger}
      title=""
      aria-label=""
      className="admin-lock p-0 m-0 bg-transparent border-0 shadow-none outline-none text-[#070b09] hover:text-[#F5D76E] transition-colors cursor-pointer select-none shrink-0 leading-none"
      style={{ background: 'transparent', border: 'none' }}
    >
      <Lock className="w-3.5 h-3.5" />
    </button>

    {/* 📝 نص حقوق الملكية */}
    <p className="text-stone-200 leading-relaxed">
      جميع الحقوق محفوظة © {new Date().getFullYear()}{' '}
      <strong className="text-[#F5D76E] font-black">{STORE_CONFIG.storeName}</strong>{' '}
      <span className="text-stone-400 text-[11px] block sm:inline sm:mt-0 mt-1">
        (شركة خُضرة للتجارة الإلكترونية SARL)
      </span>
    </p>
  </div>
</div>

        {/* ════════════════════════════════════════════════════════════
            مساحة سفلية محجوزة لشريط السلة العائم (Cart Bar) - تم تقليصها
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