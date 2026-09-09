// ============================================================
// الملف: Header.tsx – مع زر تثبيت PWA في القائمة الجانبية فقط
// ============================================================
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, Phone, ShieldCheck, RefreshCw, Info, Download } from 'lucide-react';
import { STORE_CONFIG } from '../data/config';
import { ProductCategory } from '../types';
import { CATEGORIES_CONFIG } from '../data/mockProducts';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  onOpenPage: (page: 'about' | 'policy' | 'privacy' | null) => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  cartTotal,
  onOpenCart,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onSelectCategory,
  onOpenPage,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // ─── حالة زر التثبيت ───
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // ─── دالة عرض رسالة النجاح ───
  const showSuccessMessage = (message: string) => {
    // إزالة أي رسالة موجودة مسبقاً
    const existingMessage = document.querySelector('.pwa-install-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // إنشاء عنصر الرسالة
    const messageDiv = document.createElement('div');
    messageDiv.className = 'pwa-install-message fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-[#2E5336] text-white px-6 py-3 rounded-xl shadow-2xl z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300 font-["Almarai"] text-sm sm:text-base';
    messageDiv.textContent = message;
    messageDiv.style.direction = 'rtl';
    messageDiv.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)';
    
    // إضافة أيقونة
    const icon = document.createElement('span');
    icon.textContent = '✅ ';
    icon.style.marginLeft = '8px';
    messageDiv.prepend(icon);
    
    document.body.appendChild(messageDiv);

    // إزالة الرسالة بعد 4 ثواني
    setTimeout(() => {
      messageDiv.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 300);
    }, 4000);
  };

  // ─── التحقق من نظام iOS ───
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
  }, []);

  // ─── الاستماع لحدث التثبيت ───
  useEffect(() => {
    // التحقق مما إذا كان التطبيق مثبتاً بالفعل
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setShowInstallBtn(false);
      return;
    }

    // الاستماع لحدث التثبيت (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // ─── ✅ حدث التثبيت الناجح (المكان المناسب لإضافة الرسالة) ───
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBtn(false);
      console.log('✅ تم تثبيت التطبيق بنجاح!');
      
      // ✅ إضافة رسالة النجاح هنا
      showSuccessMessage('تم تثبيت تطبيق خُضرة بنجاح! 🎉');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // تنظيف المستمعين
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // ─── دالة تثبيت التطبيق (PWA) المحسنة ───
  const handleInstallClick = async () => {
    // في iOS، نعرض تعليمات التثبيت
    if (isIOS) {
      alert('📱 لتثبيت تطبيق خُضرة على iPhone:\n\n1. اضغط على زر المشاركة ⬆️\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"');
      return;
    }

    // في Android، نستخدم الـ Prompt
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
          console.log('✅ تم تثبيت التطبيق');
          setShowInstallBtn(false);
          // ✅ إضافة رسالة النجاح هنا أيضاً (في حال لم يعمل حدث appinstalled)
          showSuccessMessage('تم تثبيت تطبيق خُضرة بنجاح! 🎉');
        } else {
          console.log('❌ تم رفض التثبيت');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('❌ خطأ في التثبيت:', error);
        // في حالة الخطأ، نعرض تعليمات التثبيت اليدوي
        alert('📱 لتثبيت التطبيق:\n\n1. افتح القائمة (☰)\n2. اختر "إضافة إلى الشاشة الرئيسية"');
      }
    } else {
      // إذا لم يظهر الـ Prompt، نعرض تعليمات التثبيت
      alert('📱 لتثبيت تطبيق خُضرة:\n\n1. افتح القائمة (☰)\n2. اختر "إضافة إلى الشاشة الرئيسية"');
    }
  };

  return (
    <>
      {/* ─── الهيدر الرئيسي ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D4C8B5] shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 gap-2 sm:gap-6">

            {/* ── الجانب الأيمن: زر القائمة + الشعار ── */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onToggleMenu}
                className={`w-11 h-11 rounded-xl bg-[#1E4327] hover:bg-[#112616] flex items-center justify-center text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.05] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#C25E12]/40 ${
                  isMenuOpen ? 'bg-[#C25E12] hover:bg-[#9C4505]' : ''
                }`}
                aria-label="فتح القائمة الرئيسية"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
              </button>

              <button
                type="button"
                onClick={() => onOpenPage(null)}
                className="flex items-center gap-2 group cursor-pointer text-right flex-1 sm:flex-none justify-center"
              >
                <div>
                  <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#112616] via-[#1E4327] to-[#2E5336] bg-clip-text text-transparent font-['Almarai'] block leading-none text-center sm:text-right">
                    {STORE_CONFIG.storeName}
                  </span>
                  <span className="text-[12px] text-[#38332B] font-bold hidden sm:block mt-0.5 text-center sm:text-right">
                    خضر وفواكه طازجة لباب دارك
                  </span>
                </div>
              </button>
            </div>

            {/* ── الوسط: حقل البحث (سطح المكتب) ── */}
            <form onSubmit={onSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4338] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ابحث عن خضار، فواكه، ألبان، زيت زيتون..."
                  className="w-full pr-10 pl-9 py-3 bg-[#F7F4EC] border border-[#D4C8B5] rounded-xl text-sm text-[#1A1814] placeholder-[#4A4338] focus:outline-none focus:bg-white focus:border-[#C25E12] focus:ring-2 focus:ring-[#C25E12]/20 transition-all font-['Tajawal'] font-medium shadow-xs hover:border-[#C25E12]/60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4338] hover:text-[#1A1814] text-xs p-1 rounded-full hover:bg-[#EAE2D2] transition-colors"
                    aria-label="مسح البحث"
                  >
                    ✕
                  </button>
                )}
              </div>
            </form>

            {/* ── الجانب الأيسر: بحث جوّال + واتساب + زر السلة ── */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="md:hidden w-10 h-10 rounded-xl bg-white border-2 border-[#C25E12] text-[#C25E12] hover:bg-[#F7F4EC] hover:border-[#9C4505] hover:text-[#9C4505] flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.05] active:scale-95"
                aria-label="بحث عن منتج"
              >
                <Search className="w-5 h-5 stroke-[2.5]" />
              </button>

              <a
                href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366]/15 text-[#145A25] border border-[#25D366]/40 hover:bg-[#25D366]/25 transition-colors text-xs font-black font-['Almarai'] shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 fill-current" />
                <span>واتساب مباشر</span>
              </a>

              {/* زر السلة */}
              <button
                type="button"
                onClick={onOpenCart}
                className="relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C25E12] to-[#9C4505] text-white shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-95 transition-all duration-300 font-extrabold font-['Almarai']"
                aria-label={`سلة المشتريات (${cartCount} منتجات)`}
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2.5 -left-2.5 bg-[#112616] text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none text-right">
                  <span className="text-xs text-amber-100 font-bold">السلة</span>
                  <span className="text-xs sm:text-sm font-black font-['Almarai']">
                    {cartTotal.toFixed(2)} {STORE_CONFIG.currency}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* ── حقل البحث الجوّال (منسدل) ── */}
          {showMobileSearch && (
            <div className="md:hidden pb-3 pt-1 animate-in slide-in-from-top-2 duration-200">
              <form onSubmit={onSearchSubmit} className="relative w-full">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4338] pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ابحث عن خضار، فواكه، ألبان، بقالة..."
                  className="w-full pr-10 pl-9 py-3 bg-[#F7F4EC] border border-[#D4C8B5] rounded-xl text-sm text-[#1A1814] placeholder-[#4A4338] focus:outline-none focus:bg-white focus:border-[#C25E12] focus:ring-2 focus:ring-[#C25E12]/20 transition-all font-['Tajawal'] font-medium shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4338] hover:text-[#1A1814] text-xs p-1 rounded-full hover:bg-[#EAE2D2] transition-colors"
                    aria-label="مسح البحث"
                  >
                    ✕
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      </header>

      {/* ─── القائمة الجانبية (Drawer) ─── */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={onCloseMenu} 
          />

          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-left duration-300 border-l border-[#D4C8B5]">
            {/* رأس الدرج */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#1E4327] to-[#112616] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">🌿</span>
                <span className="font-black text-base font-['Almarai']">قائمة متجر خُضرة</span>
              </div>
              <button
                type="button"
                onClick={onCloseMenu}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="إغلاق القائمة"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* الفئات */}
            <div className="p-4 sm:p-4 flex-1">
              <div className="text-[12px] font-black text-[#1A1814] uppercase tracking-wider mb-2 font-['Almarai']">
                تصفح الأقسام
              </div>
              <div className="space-y-0.5">
                {CATEGORIES_CONFIG.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.id);
                      onOpenPage(null);
                      onCloseMenu();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F7F4EC] text-[#1A1814] hover:text-[#112616] font-extrabold text-sm transition-colors text-right font-['Tajawal'] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg w-7 text-center">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                    <span className="text-xs text-[#4A4338] font-bold">←</span>
                  </button>
                ))}
              </div>

              {/* ─── روابط مهمة (بما فيها تثبيت التطبيق) ─── */}
              <div className="border-t border-[#E8E1D3] my-3 pt-3">
                <div className="text-[12px] font-black text-[#1A1814] uppercase tracking-wider mb-2 font-['Almarai']">
                  روابط مهمة
                </div>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPage('about');
                      onCloseMenu();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F4EC] text-[#1A1814] font-extrabold text-sm text-right font-['Tajawal'] cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-[#1E4327]" />
                    <span>من نحن</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPage('policy');
                      onCloseMenu();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F4EC] text-[#1A1814] font-extrabold text-sm text-right font-['Tajawal'] cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-[#C25E12]" />
                    <span>سياسة الإرجاع</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPage('privacy');
                      onCloseMenu();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F4EC] text-[#1A1814] font-extrabold text-sm text-right font-['Tajawal'] cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#1E4327]" />
                    <span>سياسة الخصوصية</span>
                  </button>

                  {/* ─── زر تثبيت التطبيق (PWA) المحسن ─── */}
                  {!isInstalled && (
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F4EC] text-[#B85507] hover:text-[#9C4505] font-extrabold text-sm transition-colors text-right font-['Tajawal'] group cursor-pointer"
                    >
                      <span className="text-lg">📲</span>
                      <span>
                        {isIOS ? 'تثبيت تطبيق خُضرة (iOS)' : 'تثبيت تطبيق خُضرة'}
                      </span>
                      {showInstallBtn && !isIOS && (
                        <span className="mr-auto text-xs bg-[#B85507] text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                          متاح
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* تذييل الدرج */}
            <div className="p-3 sm:p-4 bg-[#F7F4EC] border-t border-[#D4C8B5] text-right">
              <p className="text-xs sm:text-sm text-[#2D271E] font-['Tajawal'] font-semibold leading-relaxed">
                🕐 خدمة الزبناء متوفرة يومياً من 09:00 إلى 21:00
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};