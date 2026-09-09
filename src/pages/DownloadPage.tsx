import React from 'react';
import { Download, Smartphone, Tablet, CheckCircle } from 'lucide-react';

export const DownloadPage: React.FC = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B3A20] font-['Almarai'] mb-4">
        📲 حمل تطبيق خُضرة الآن!
      </h1>
      <p className="text-[#655E4E] text-lg mb-8">
        تسوق الخضار والفواكه الطازجة بسهولة من هاتفك
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-[#DFD1AC] shadow-sm">
          <Smartphone className="w-12 h-12 text-[#D9762B] mx-auto mb-3" />
          <h3 className="font-bold text-[#1B3A20]">تطبيق سريع</h3>
          <p className="text-sm text-[#655E4E]">تجربة سلسة وسريعة</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#DFD1AC] shadow-sm">
          <CheckCircle className="w-12 h-12 text-[#4F8A5A] mx-auto mb-3" />
          <h3 className="font-bold text-[#1B3A20]">توصيل فوري</h3>
          <p className="text-sm text-[#655E4E]">اطلب واستلم في نفس اليوم</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#DFD1AC] shadow-sm">
          <Download className="w-12 h-12 text-[#B85E1C] mx-auto mb-3" />
          <h3 className="font-bold text-[#1B3A20]">تثبيت سهل</h3>
          <p className="text-sm text-[#655E4E]">حمّل وابدأ التسوق فوراً</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {isIOS ? (
          <div className="p-4 bg-[#FAF6EE] rounded-xl border border-[#DFD1AC] text-right">
            <p className="font-bold text-[#1B3A20]">📱 لتثبيت التطبيق على iPhone:</p>
            <ol className="text-sm text-[#655E4E] mt-2 space-y-1 list-decimal list-inside">
              <li>افتح الموقع في Safari</li>
              <li>اضغط على زر المشاركة ⬆️</li>
              <li>اختر "إضافة إلى الشاشة الرئيسية"</li>
              <li>اضغط "إضافة"</li>
            </ol>
          </div>
        ) : (
          <a
            href="/app-release.apk"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-[#2E5336] text-white hover:bg-[#1B3A20] transition-all shadow-lg hover:shadow-xl"
          >
            <Download className="w-6 h-6" />
            <div className="text-right">
              <p className="text-xs opacity-80">تحميل لـ</p>
              <p className="font-bold text-lg">Android</p>
            </div>
          </a>
        )}
      </div>

      <p className="text-xs text-[#8A8270] mt-6">
        متوافق مع Android 5.0+ و iOS 12.0+
      </p>
    </div>
  );
};