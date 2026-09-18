// ============================================================
// InstallAppBanner.tsx
// بانر تثبيت التطبيق / PWA بنمط وهوية متجر خُضرة الأصيلة
// مستوحى من هيكلية وبساطة بانر done.ma مع تدرجات خُضرة الخضراء
// والبرتقالية الذهبية وتوافق تام مع الهواتف الذكية وiOS وAndroid
// ============================================================
import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, ArrowDownCircle, ShieldCheck } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { STORE_CONFIG } from '../data/config';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallAppBanner: React.FC = () => {
  // يظهر دائماً كحالة افتراضية لضمان رؤيته فوراً في المعاينة
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success'>('idle');
  const [modalInstallState, setModalInstallState] = useState<'idle' | 'downloading' | 'done'>('idle');

  const triggerDirectDownload = () => {
    const link = document.createElement('a');
    link.href = '/app-release.apk';
    link.download = 'khodra-fresh.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // 1. التحقق من نظام التشغيل
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: boolean }).MSStream;
    setIsIOS(iOSDevice);

    // 2. استرجاع الحدث إن كان مخزناً في كائن window مسبقاً
    const cachedPrompt = (window as unknown as { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt;
    if (cachedPrompt) {
      setDeferredPrompt(cachedPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      (window as unknown as { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt = promptEvent;
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setInstallStatus('success');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowGuideModal(true);
      return;
    }

    const currentPrompt = deferredPrompt || (window as unknown as { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt;

    if (currentPrompt) {
      try {
        setInstallStatus('installing');
        await currentPrompt.prompt();
        const { outcome } = await currentPrompt.userChoice;

        if (outcome === 'accepted') {
          setIsVisible(false);
          setInstallStatus('success');
        } else {
          setInstallStatus('idle');
        }
        setDeferredPrompt(null);
        (window as unknown as { deferredPrompt?: null }).deferredPrompt = null;
      } catch (err) {
        console.warn('PWA prompt failed:', err);
        setInstallStatus('idle');
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // ─── نافذة الإرشادات والتحميل المخصصة ───
  const renderGuideModal = () => (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setShowGuideModal(false)}
    >
      <div
        className="relative w-full max-w-md bg-[#FFFDF8] rounded-[26px] p-5 sm:p-6 shadow-2xl border-2 border-[#E8E1D3] text-right font-['Tajawal'] overflow-hidden"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* شريط جمالي علوي بألوان خضرة */}
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-[#163920] via-[#C25E12] to-[#163920]" />

        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={() => setShowGuideModal(false)}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#F2EEE4] hover:bg-[#E8E1D3] flex items-center justify-center text-[#524B3E] hover:text-[#1A1814] transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* رأس النافذة */}
        <div className="flex items-center gap-3.5 mb-4 mt-1">
          <div className="w-13 h-13 rounded-2xl bg-[#0E2615] flex items-center justify-center shadow-md shrink-0 border border-[#F5D76E]/40 overflow-hidden p-0.5">
            <img
              src="/web-app-manifest-192x192.png"
              alt="خُضرة"
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/apple-touch-icon.png';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base sm:text-lg font-black text-[#112616] font-['Almarai']">
                تطبيق {STORE_CONFIG.storeName}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#163920]/10 text-[#163920] text-[10px] font-black">
                سريع وخفيف
              </span>
            </div>
            <p className="text-xs text-[#6B6455] font-medium mt-0.5">
              تسوق الخضار والفواكه الطازجة لباب دارك بفاس
            </p>
          </div>
        </div>

        {isIOS ? (
          /* إرشادات أجهزة Apple / iOS */
          <div className="space-y-3.5 text-[#2A2721] text-sm">
            <div className="p-3 bg-[#FAF6EE] rounded-2xl border border-[#DFD1AC] text-[#8C430E] text-xs font-bold leading-relaxed flex items-center gap-2">
              <span className="text-base">🍏</span>
              <span>لتثبيت التطبيق على جهاز iPhone أو iPad من متصفح Safari:</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F7F4EC] border border-[#E8E1D3]">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black shrink-0 text-xs">
                  1
                </div>
                <div>
                  <span className="font-bold block text-[#163920] text-xs">اضغط على زر المشاركة</span>
                  <span className="text-[11px] text-[#6B6455]">
                    رمز <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> في أسفل شاشة Safari
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F7F4EC] border border-[#E8E1D3]">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0 text-xs">
                  2
                </div>
                <div>
                  <span className="font-bold block text-[#163920] text-xs">إضافة إلى الشاشة الرئيسية</span>
                  <span className="text-[11px] text-[#6B6455]">
                    مرر للأسفل واختر <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-[#163920]" /> Add to Home Screen
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F7F4EC] border border-[#E8E1D3]">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-[#C25E12] flex items-center justify-center font-black shrink-0 text-xs">
                  3
                </div>
                <div>
                  <span className="font-bold block text-[#163920] text-xs">اضغط "إضافة" (Add)</span>
                  <span className="text-[11px] text-[#6B6455]">في الزاوية العلوية للشاشة</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* خيارات أجهزة Android والكمبيوتر */
          <div className="space-y-3.5">
            <p className="text-xs text-[#524B3E] leading-relaxed">
              اختر الطريقة الأنسب لك لتثبيت التطبيق على جهازك والاستمتاع بتجربة طلب سريعة:
            </p>

            <div className="space-y-2.5">
              {/* خيار تثبيت PWA الفوري / التحميل المباشر بدون رسائل توجيهية */}
              <button
                type="button"
                onClick={async () => {
                  const prompt = deferredPrompt || (window as unknown as { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt;
                  if (prompt) {
                    try {
                      await prompt.prompt();
                      const { outcome } = await prompt.userChoice;
                      if (outcome === 'accepted') {
                        setShowGuideModal(false);
                        setIsVisible(false);
                        return;
                      }
                    } catch (e) {
                      console.warn(e);
                    }
                  }

                  // يبدأ التحميل المباشر فوراً على الهاتف بدون أي رسالة متصفح
                  setModalInstallState('downloading');
                  triggerDirectDownload();

                  setTimeout(() => {
                    setModalInstallState('done');
                    setTimeout(() => {
                      setShowGuideModal(false);
                      setModalInstallState('idle');
                    }, 1400);
                  }, 600);
                }}
                disabled={modalInstallState === 'downloading'}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white shadow-md active:scale-95 transition-all text-xs sm:text-sm font-black font-['Almarai'] cursor-pointer border border-[#0E2615]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Download className={`w-5 h-5 text-[#F5D76E] ${modalInstallState === 'downloading' ? 'animate-bounce' : ''}`} />
                  </div>
                  <div className="text-right">
                    <span className="block text-sm">
                      {modalInstallState === 'downloading'
                        ? 'جاري التحميل المباشر...'
                        : modalInstallState === 'done'
                        ? 'تم بدء التحميل بنجاح ✅'
                        : 'تثبيت التطبيق الفوري (PWA)'}
                    </span>
                    <span className="text-[10px] text-emerald-200 font-normal">
                      {modalInstallState === 'downloading'
                        ? 'لحظة واحدة وسيبدأ التثبيت على جهازك'
                        : 'تطبيق خفيف وسريع بدون استهلاك للذاكرة'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#F5D76E] text-[#0E2615] text-[10px] font-black">
                  {modalInstallState === 'done' ? '✓ تم' : 'موصى به'}
                </span>
              </button>

              {/* تحميل ملف APK مباشر */}
              <a
                href="/app-release.apk"
                download="khodra-fresh.apk"
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-[#FAF6EE] text-[#163920] border-2 border-[#E8E1D3] hover:border-[#C25E12]/50 shadow-xs active:scale-95 transition-all text-xs sm:text-sm font-black font-['Almarai']"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#C25E12] flex items-center justify-center">
                    <ArrowDownCircle className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <span className="block text-sm text-[#163920]">تحميل حزمة Android (APK)</span>
                    <span className="text-[10px] text-[#6B6455] font-normal">نسخة الأندرويد المباشرة (1.9 ميغابايت)</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F2EEE4] text-[#8C430E] text-[10px] font-black">
                  APK
                </span>
              </a>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#E8E1D3] flex items-center justify-between text-[11px] text-[#6B6455]">
          <span className="flex items-center gap-1.5 font-medium text-[#163920]">
            <ShieldCheck className="w-4 h-4 text-[#163920]" />
            تطبيق متجر خُضرة الرسمي بفاس
          </span>
          <button
            type="button"
            onClick={() => setShowGuideModal(false)}
            className="text-[#C25E12] font-black hover:underline cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );

  if (!isVisible) {
    return (
      <AnimatePresence>
        {showGuideModal && renderGuideModal()}
      </AnimatePresence>
    );
  }

  return (
    <>
      <aside
        id="pwa-install-banner-khodra-theme"
        dir="rtl"
        aria-label="بانر تثبيت تطبيق خُضرة"
        className="w-full bg-gradient-to-l from-[#163920] via-[#112D19] to-[#0D2414] text-white border-b border-[#F5D76E]/25 shadow-sm z-40 select-none transition-all duration-300 relative"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* ─── اليمين: زر الإغلاق (✕) + شعار خُضرة + الوصف الفرعي ─── */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            {/* زر الإغلاق ✕ */}
            <button
              type="button"
              id="pwa-banner-dismiss-btn"
              onClick={handleDismiss}
              className="w-7 h-7 sm:w-8 sm:h-8 min-w-[28px] min-h-[28px] flex items-center justify-center text-[#E8E1D3] hover:text-white rounded-full hover:bg-white/10 active:scale-90 transition-all cursor-pointer touch-manipulation shrink-0"
              aria-label="إغلاق البانر"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
            </button>

            {/* أيقونة / شعار المتجر بحجم أوضح ومظهر جذاب */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#0E2615] flex items-center justify-center shadow-md shrink-0 border border-[#F5D76E]/50 overflow-hidden p-0.5">
              <img
                src="/web-app-manifest-192x192.png"
                alt={STORE_CONFIG.storeName}
                className="w-full h-full object-cover rounded-[13px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/apple-touch-icon.png';
                }}
              />
            </div>

            {/* الوصف الفرعي فقط بخط أوضح وأبرز */}
            <p className="text-white font-bold text-xs sm:text-sm lg:text-[15px] leading-snug font-['Tajawal'] tracking-wide truncate">
              خضار وفواكه طازجة لباب دارك بفاس 🚚
            </p>
          </div>

          {/* ─── اليسار: زر "حمل التطبيق" بعرض واضح ومميز ─── */}
          <div className="shrink-0">
            <button
              type="button"
              id="pwa-banner-install-btn"
              onClick={handleInstallClick}
              disabled={installStatus === 'installing'}
              className="flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-l from-[#C25E12] to-[#A34A07] hover:from-[#D9762B] hover:to-[#B85E1C] text-white border border-[#F5D76E]/50 shadow-sm hover:shadow-md active:scale-95 transition-all text-xs sm:text-sm font-black font-['Almarai'] whitespace-nowrap cursor-pointer touch-manipulation group"
            >
              <Download className="w-4 h-4 text-[#F5D76E] group-hover:translate-y-0.5 transition-transform shrink-0 stroke-[2.5]" />
              <span>حمل التطبيق</span>
            </button>
          </div>

        </div>
      </aside>

      {/* نافذة التعليمات المنبثقة */}
      <AnimatePresence>
        {showGuideModal && renderGuideModal()}
      </AnimatePresence>
    </>
  );
};
