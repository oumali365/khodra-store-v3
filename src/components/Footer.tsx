// ============================================================
// الملف: Footer.tsx – الإصدار 2.0
// تذييل المتجر – تصميم أنيق ومتناسق
// ============================================================
import React from 'react';
import { Heart, ShieldCheck, Truck, RefreshCw, MessageCircle, Lock } from 'lucide-react';
import { STORE_CONFIG } from '../data/config';

interface FooterProps {
  onOpenPage: (page: 'about' | 'policy' | 'privacy' | null) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPage }) => {
  const handleAdminTrigger = () => {
    window.dispatchEvent(new CustomEvent('khodra_trigger_admin_modal'));
  };

  return (
    <footer className="bg-[#112616] text-white pt-8 pb-20 sm:pb-16 border-t-4 border-[#C25E12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ════════ الشبكة الرئيسية ════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-right items-start">

          {/* ─── العمود 1: العلامة التجارية ─── */}
          <div className="space-y-3 max-w-md mx-auto md:mx-0 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-2xl">🌿</span>
              <span className="text-xl sm:text-2xl font-black text-[#F5D76E] tracking-tight">
                {STORE_CONFIG.storeName}
              </span>
            </div>

            <p className="text-sm text-white/95 leading-relaxed font-medium">
              متجر خضرة يرسل أجود الخضروات، الفواكه، وأفضل منتجات البقالة والألبان مع توصيل سريع ومباشر لباب الدار.
            </p>

            {/* شارات الميزات */}
            <div className="flex flex-wrap gap-2 pt-0.5 justify-center md:justify-start">
              <span className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/20 font-bold text-white flex items-center gap-1.5 backdrop-blur-xs transition-all">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F5D76E]" />
                100% طراوة
              </span>
              <span className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/20 font-bold text-white flex items-center gap-1.5 backdrop-blur-xs transition-all">
                <Truck className="w-3.5 h-3.5 text-[#F5D76E]" />
                توصيل سريع
              </span>
              <span className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/20 font-bold text-white flex items-center gap-1.5 backdrop-blur-xs transition-all">
                <RefreshCw className="w-3.5 h-3.5 text-[#F5D76E]" />
                دفع آمن
              </span>
            </div>
          </div>

          {/* ─── العمود 2: روابط مهمة + الواتساب ─── */}
          <div className="space-y-3 text-center md:text-right max-w-md mx-auto md:mx-0 w-full">
            <h3 className="text-sm sm:text-base font-black text-[#F5D76E] relative inline-block md:block">
              روابط مهمة
              <span className="block md:hidden h-0.5 w-8 bg-[#C25E12] mx-auto mt-1 rounded-full" />
            </h3>

            {/* قائمة الروابط */}
            <ul className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 pt-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPage('about')}
                  className="text-sm text-white hover:text-[#F5D76E] transition-colors duration-200 cursor-pointer font-bold hover:underline"
                >
                  من نحن
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPage('policy')}
                  className="text-sm text-white hover:text-[#F5D76E] transition-colors duration-200 cursor-pointer font-bold hover:underline"
                >
                  سياسة الإرجاع
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPage('privacy')}
                  className="text-sm text-white hover:text-[#F5D76E] transition-colors duration-200 cursor-pointer font-bold hover:underline"
                >
                  سياسة الخصوصية
                </button>
              </li>
            </ul>

            {/* زر الواتساب */}
            <div className="space-y-3 pt-1">
              <a
                href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white px-5 py-2.5 rounded-full font-black text-sm no-underline transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,211,102,0.35)] cursor-pointer shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-current text-white" />
                <span>تواصل عبر الواتساب</span>
              </a>
            </div>
          </div>

        </div>

        {/* ════════ التذييل السفلي ════════ */}
        <div className="pt-4 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between text-xs text-white/90 gap-3 text-center">

          {/* حقوق النشر + زر المدير */}
          <div className="font-bold tracking-wide flex items-center justify-center sm:justify-start gap-1.5">
            <button
              type="button"
              onClick={handleAdminTrigger}
              title="إدارة تقييمات المتجر"
              aria-label="إدارة التقييمات للمدير"
              className="text-white/40 hover:text-[#F5D76E] transition-colors p-1 rounded-md hover:bg-white/10 cursor-pointer select-none"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
            <p>
              جميع الحقوق محفوظة © {new Date().getFullYear()}{' '}
              <span className="text-[#F5D76E] font-black">{STORE_CONFIG.storeName}</span>
            </p>
          </div>

          {/* "صنع بكل ❤️" */}
          <p className="flex items-center gap-1.5 justify-center font-bold whitespace-nowrap bg-white/10 px-3 py-1 rounded-full border border-white/20">
            <span>صنع بكل</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current animate-bounce" />
            <span className="text-white">لخدمة المائدة المغربية</span>
          </p>
        </div>

      </div>
    </footer>
  );
};