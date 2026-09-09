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
      <header className="sticky top-0 z-40 bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#E3D9C3] shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 gap-2 sm:gap-6">

            {/* ── الجانب الأيمن: زر القائمة + الشعار ── */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onToggleMenu}
                className={`w-11 h-11 rounded-xl bg-[#2E5336] hover:bg-[#1B3A20] flex items-center justify-center text-white transition-all duration-400 shadow-md hover:shadow-lg hover:scale-[1.05] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#D9762B]/40 ${
                  isMenuOpen ? 'bg-[#D9762B] hover:bg-[#B85E1C]' : ''
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
                  <span className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-[#1B3A20] via-[#2E5336] to-[#4F8A5A] bg-clip-text text-transparent font-['Almarai'] block leading-none text-center sm:text-right">
                    {STORE_CONFIG.storeName}
                  </span>
                  <span className="text-[12px] text-[#655E4E] font-medium hidden sm:block mt-0.5 text-center sm:text-right">
                    خضر وفواكه طازجة لباب دارك
                  </span>
                </div>
              </button>
            </div>

            {/* ── الوسط: حقل البحث (سطح المكتب) ── */}
            <form onSubmit={onSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8270] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ابحث عن خضار، فواكه، ألبان، زيت زيتون..."
                  className="w-full pr-10 pl-9 py-3 bg-white border border-[#DFD1AC] rounded-xl text-sm text-[#2A2721] placeholder-[#8A8270] focus:outline-none focus:border-[#D9762B] focus:ring-2 focus:ring-[#D9762B]/20 transition-all font-['Tajawal'] shadow-sm hover:shadow-md"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8270] hover:text-[#2A2721] text-xs p-1 rounded-full hover:bg-[#F3ECDD] transition-colors"
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
                className="md:hidden w-10 h-10 rounded-xl bg-white border-2 border-[#D9762B] text-[#D9762B] hover:bg-[#FAF6EE] hover:border-[#B85E1C] hover:text-[#B85E1C] flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.05] active:scale-95"
                aria-label="بحث عن منتج"
              >
                <Search className="w-5 h-5" />
              </button>

              <a
                href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366]/10 text-[#1E7E34] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors text-xs font-bold font-['Almarai']"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>واتساب مباشر</span>
              </a>

              {/* زر السلة */}
              <button
                type="button"
                onClick={onOpenCart}
                className="relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D9762B] to-[#B85E1C] text-white shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-95 transition-all duration-300 font-bold font-['Almarai']"
                aria-label={`سلة المشتريات (${cartCount} منتجات)`}
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2.5 -left-2.5 bg-[#D9762B] text-white text-[10px] sm:text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FFFDF8] shadow-sm animate-bounce">
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none text-right">
                  <span className="text-[10px] text-emerald-100 font-medium">السلة</span>
                  <span className="text-xs font-extrabold font-['Almarai']">
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
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8270] pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ابحث عن خضار، فواكه، ألبان، بقالة..."
                  className="w-full pr-10 pl-9 py-3 bg-white border border-[#DFD1AC] rounded-xl text-sm text-[#2A2721] placeholder-[#8A8270] focus:outline-none focus:border-[#D9762B] focus:ring-2 focus:ring-[#D9762B]/20 transition-all font-['Tajawal'] shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8270] hover:text-[#2A2721] text-xs p-1 rounded-full hover:bg-[#F3ECDD] transition-colors"
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

          <div className="relative ml-auto w-full max-w-xs bg-[#FFFDF8] h-full shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-left duration-300">
            {/* رأس الدرج */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#2E5336] to-[#1B3420] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">🌿</span>
                <span className="font-extrabold text-base font-['Almarai']">قائمة متجر خُضرة</span>
              </div>
              <button
                type="button"
                onClick={onCloseMenu}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="إغلاق القائمة"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* الفئات */}
            <div className="p-4 sm:p-4 flex-1">
              <div className="text-[12px] font-bold text-[#8A8270] uppercase tracking-wider mb-2 font-['Almarai']">
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
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#FAF6EE] text-[#2A2721] hover:text-[#2E5336] font-semibold text-sm transition-colors text-right font-['Tajawal']"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg w-7 text-center">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                    <span className="text-xs text-[#8A8270]">←</span>
                  </button>
                ))}
              </div>

              {/* ─── روابط مهمة (بما فيها تثبيت التطبيق) ─── */}
              <div className="border-t border-[#EAE1CB] my-3 pt-3">
                <div className="text-[12px] font-bold text-[#8A8270] uppercase tracking-wider mb-2 font-['Almarai']">
                  روابط مهمة
                </div>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPage('about');
                      onCloseMenu();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FAF6EE] text-[#2A2721] font-semibold text-sm text-right font-['Tajawal']"
                  >
                    <Info className="w-4 h-4 text-[#4F8A5A]" />
                    <span>من نحن</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPage('policy');
                      onCloseMenu();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FAF6EE] text-[#2A2721] font-semibold text-sm text-right font-['Tajawal']"
                  >
                    <RefreshCw className="w-4 h-4 text-[#D9762B]" />
                    <span>سياسة الإرجاع</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPage('privacy');
                      onCloseMenu();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FAF6EE] text-[#2A2721] font-semibold text-sm text-right font-['Tajawal']"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#2E5336]" />
                    <span>سياسة الخصوصية</span>
                  </button>

                  {/* ─── زر تثبيت التطبيق (PWA) المحسن ─── */}
                  {!isInstalled && (
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FAF6EE] text-[#D9762B] hover:text-[#B85E1C] font-semibold text-sm transition-colors text-right font-['Tajawal'] group"
                    >
                      <span className="text-lg">📲</span>
                      <span>
                        {isIOS ? 'تثبيت تطبيق خُضرة (iOS)' : 'تثبيت تطبيق خُضرة'}
                      </span>
                      {showInstallBtn && !isIOS && (
                        <span className="mr-auto text-[10px] bg-[#D9762B] text-white px-2 py-0.5 rounded-full animate-pulse">
                          متاح
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* تذييل الدرج */}
            <div className="p-3 sm:p-3 bg-[#FAF6EE] border-t border-[#DFD1AC] text-right">
              <p className="text-[12px] text-[#655E4E] font-['Tajawal']">
                🕐 خدمة الزبناء متوفرة يومياً من 09:00 إلى 21:00
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};