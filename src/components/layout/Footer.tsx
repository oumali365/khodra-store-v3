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
      className="relative overflow-hidden bg-[#070b09] text-white pt-6 pb-0 border-t-2 border-[#EAB308]/40 shadow-2xl select-none"
      dir="rtl"
    >
      {/* ═══════ خط التوهج الذهبي في أعلى الفوتر ═══════ */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#EAB308]/70 to-transparent pointer-events-none" />

      {/* ═══════ إضاءات محيطية ناعمة تحاكي لوحة الإدارة ═══════ */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-[#EAB308]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* تم تقليص المسافة الرأسية هنا من space-y-6 إلى space-y-5 */}
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

        {/* ════════ القسم الرئيسي: معلومات الخدمة والتغطية في بطاقتين متوازنتين ════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          {/* ─── بطاقة 1: معلومات وخدمات المتجر ─── */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-md flex flex-col justify-between">
            {/* عنوان نظيف بدون أي أيقونة (حذف الأيقونة حسب التوجيهات) */}
            <div className="pb-3 border-b border-zinc-800 text-center">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                معلومات وخدمات المتجر
              </h3>
            </div>

            {/* شبكة البطاقات 2×2 – محتوى متمركز بهوامش وحشوات مناسبة */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* بطاقة: من نحن */}
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

              {/* بطاقة: سياسة التوصيل */}
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

              {/* بطاقة: سياسة الخصوصية */}
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

              {/* بطاقة: تقييمات الزبناء */}
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

          {/* ─── بطاقة 2: المواعيد ونطاق التوصيل ─── */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-md flex flex-col justify-between">
            {/* عنوان نظيف بدون أي أيقونة (حذف الأيقونة حسب التوجيهات) */}
            <div className="pb-3 border-b border-zinc-800 text-center">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                المواعيد ونطاق التوصيل
              </h3>
            </div>

            <div className="space-y-3.5 text-xs text-stone-300">
              {/* صندوق المواعيد – محتوى مُوسَّط */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#2D6A3F]/25 border border-[#EAB308]/25 flex items-center justify-center text-[#F5D76E] shrink-0 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <strong className="text-white block font-black text-xs sm:text-sm">
                    أوقات استقبال وتوصيل الطلبات
                  </strong>
                  <p className="text-stone-300 text-xs leading-relaxed font-medium">
                    طيلة أيام الأسبوع من <span className="font-bold text-emerald-300 tabular-nums">08:00 صباحاً</span> إلى <span className="font-bold text-emerald-300 tabular-nums">20:00 مساءً</span> بدون انقطاع
                  </p>
                </div>
              </div>

              {/* صندوق أحياء فاس المغطاة – محتوى مُوسَّط */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center text-center space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-[#EA580C] shrink-0 shadow-xs">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="w-full space-y-2">
                  <strong className="text-white block font-black text-xs sm:text-sm">
                    أحياء مدينة فاس المغطاة بالتوصيل
                  </strong>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {FEZ_NEIGHBORHOODS.map((zone) => (
                      <span
                        key={zone}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 text-[10px] sm:text-[11px] font-bold text-stone-300"
                      >
                        {zone}
                      </span>
                    ))}
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-[10px] sm:text-[11px] font-bold text-emerald-300">
                      + جميع النواحي
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ════════ مركز خدمة الزبناء والواتساب المطور (مُوسَّط) ════════ */}
        <div className="bg-gradient-to-br from-[#102715] via-[#09170d] to-[#050e08] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative max-w-xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>خدمة الزبناء والطلبات الخاصة • فاس</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-xl font-black text-white">
                هل تحتاج مساعدة أو تفضل الطلب عبر الواتساب؟
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/80 font-medium leading-relaxed">
                نستقبل رسائلكم وقوائم مشترياتكم المكتوبة والتسجيلات الصوتية مباشرة طيلة اليوم.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 via-[#22C55E] to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 shadow-[0_6px_22px_rgba(34,197,94,0.35)] hover:shadow-[0_8px_28px_rgba(34,197,94,0.50)] hover:-translate-y-0.5 active:scale-95 cursor-pointer border border-emerald-300/40 min-w-[240px]"
              >
                <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
                </div>
                <span>تواصل فوري عبر الواتساب</span>
              </a>

              <a
                href={`tel:${STORE_CONFIG.whatsappNumber}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-stone-200 hover:text-white text-xs font-black transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#F5D76E]" />
                <span dir="ltr">{STORE_CONFIG.whatsappNumber}</span>
              </a>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-200/80 font-semibold pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>استجابة ومتابعة سريعة مع مندوب التوصيل في فاس</span>
            </div>
          </div>
        </div>

        {/* ════════ التذييل السفلي وحقوق الملكية وزر إدارة المتجر (بدون أيقونة شعار) ════════ */}
        <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-300 gap-3 text-center sm:text-right">
          <div className="flex items-center justify-center sm:justify-start gap-2.5 font-bold">
            <button
              type="button"
              onClick={handleAdminTrigger}
              title="دخول لوحة تحكم وإدارة المتجر (PIN)"
              aria-label="دخول إدارة المتجر"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-stone-400 hover:text-[#F5D76E] border border-zinc-700/80 hover:border-amber-400/50 transition-all cursor-pointer select-none shadow-xs group"
            >
              <Lock className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#F5D76E] transition-colors" />
            </button>
            <p className="text-stone-300">
              جميع الحقوق محفوظة © {new Date().getFullYear()}{' '}
              <strong className="text-[#F5D76E] font-black">{STORE_CONFIG.storeName}</strong>{' '}
              <span className="text-stone-400 text-[11px] hidden sm:inline">(سوق بنسودة • فاس)</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-400">
            <span>🇲🇦 صُنع في فاس، المملكة المغربية</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
