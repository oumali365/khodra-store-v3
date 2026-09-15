// ============================================================
// الملف: Header.tsx – الإصدار 3.0
// رأس المتجر – تصميم متناسق مع باقي المكونات
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, Menu, X, Phone, ShieldCheck,
  RefreshCw, Info, Download, Package, Sparkles, Leaf,
} from 'lucide-react';
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
  onScrollToBundles?: () => void;
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
  onScrollToBundles,
}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // ─── حالة زر التحميل ───
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');

  // ─── رسالة نجاح ───
  const showSuccessMessage = (message: string) => {
    const existingMessage = document.querySelector('.pwa-install-message');
    if (existingMessage) existingMessage.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = 'pwa-install-message fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-[#163920] text-white px-6 py-3.5 rounded-2xl shadow-2xl z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300 font-["Almarai"] text-sm sm:text-base border-2 border-[#F5D76E]';
    messageDiv.textContent = message;
    messageDiv.style.direction = 'rtl';
    messageDiv.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)';
    messageDiv.style.maxWidth = '90%';
    messageDiv.style.width = 'auto';
    messageDiv.style.minWidth = '200px';
    messageDiv.style.textAlign = 'center';

    const icon = document.createElement('span');
    icon.textContent = '✅ ';
    icon.style.marginLeft = '8px';
    messageDiv.prepend(icon);

    document.body.appendChild(messageDiv);

    setTimeout(() => {
      messageDiv.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
      setTimeout(() => {
        if (messageDiv.parentNode) messageDiv.remove();
      }, 300);
    }, 4000);
  };

  // ─── رسالة خطأ ───
  const showErrorMessage = (message: string) => {
    const existingMessage = document.querySelector('.pwa-install-message');
    if (existingMessage) existingMessage.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = 'pwa-install-message fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-[#C25E12] text-white px-6 py-3.5 rounded-2xl shadow-2xl z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300 font-["Almarai"] text-sm sm:text-base border-2 border-white/30';
    messageDiv.textContent = message;
    messageDiv.style.direction = 'rtl';
    messageDiv.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)';
    messageDiv.style.maxWidth = '90%';
    messageDiv.style.width = 'auto';
    messageDiv.style.minWidth = '200px';
    messageDiv.style.textAlign = 'center';

    const icon = document.createElement('span');
    icon.textContent = '⚠️ ';
    icon.style.marginLeft = '8px';
    messageDiv.prepend(icon);

    document.body.appendChild(messageDiv);

    setTimeout(() => {
      messageDiv.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
      setTimeout(() => {
        if (messageDiv.parentNode) messageDiv.remove();
      }, 300);
    }, 4000);
  };

  // ─── التحقق من نظام التشغيل ───
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const android = /Android/.test(userAgent);
    setIsIOS(iOS);
    setIsAndroid(android);
  }, []);

  // ─── الاستماع لحدث التحميل ───
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setShowInstallBtn(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBtn(false);
      setDownloadStatus('success');
      console.log('✅ تم تحميل التطبيق بنجاح!');
      showSuccessMessage('تم تحميل تطبيق خُضرة بنجاح! 🎉');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // ─── دالة تحميل التطبيق ───
  const handleDownloadClick = async () => {
    setDownloadStatus('downloading');

    if (isIOS) {
      setDownloadStatus('idle');
      alert('📱 لتحميل تطبيق خُضرة على iPhone:\n\n1. اضغط على زر المشاركة ⬆️\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"');
      return;
    }

    if (isAndroid && deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;

        if (result.outcome === 'accepted') {
          setShowInstallBtn(false);
          setDownloadStatus('success');
          showSuccessMessage('تم تحميل تطبيق خُضرة بنجاح! 🎉');
        } else {
          setDownloadStatus('idle');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('❌ خطأ في التحميل:', error);
        setDownloadStatus('error');
        showErrorMessage('حدث خطأ أثناء تحميل التطبيق');
        setTimeout(() => {
          alert('📱 لتحميل تطبيق خُضرة:\n\n1. افتح القائمة (☰)\n2. اختر "إضافة إلى الشاشة الرئيسية"');
        }, 500);
      }
    } else {
      setDownloadStatus('idle');
      let instructions = '📱 لتحميل تطبيق خُضرة:\n\n';
      if (isAndroid) {
        instructions += '1. افتح القائمة (☰)\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"';
      } else if (isIOS) {
        instructions += '1. اضغط على زر المشاركة ⬆️\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"';
      } else {
        instructions += '1. افتح القائمة (☰)\n2. اختر "تثبيت التطبيق"\n3. اتبع التعليمات';
      }
      alert(instructions);
    }
  };

  // ─── التمرير إلى صناديق العائلة ───
  const handleScrollToBundles = () => {
    onCloseMenu();
    if (onScrollToBundles) {
      setTimeout(() => onScrollToBundles(), 200);
    } else {
      setTimeout(() => {
        const el = document.getElementById('family-bundles-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  };

  return (
    <>
      {/* ════════ الهيدر الرئيسي ════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#D4C8B5] shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-6">

            {/* ── يمين: زر القائمة + الشعار ── */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* زر القائمة */}
              <button
                type="button"
                onClick={onToggleMenu}
                className={`relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-white transition-all duration-200 shadow-md hover:shadow-lg active:scale-90 focus:outline-none focus:ring-2 focus:ring-[#C25E12]/40 touch-manipulation select-none cursor-pointer shrink-0 ${
                  isMenuOpen
                    ? 'bg-gradient-to-br from-[#C25E12] to-[#9C4505]'
                    : 'bg-gradient-to-br from-[#1E4327] to-[#112616] hover:from-[#112616] hover:to-[#0A1A0F]'
                }`}
                aria-label="فتح القائمة الرئيسية"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              {/* الشعار */}
              <button
                type="button"
                onClick={() => onOpenPage(null)}
                className="flex items-center gap-2 group cursor-pointer text-right touch-manipulation select-none active:opacity-80 transition-opacity min-w-0"
              >
                {/* أيقونة خضراء صغيرة */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#163920] to-[#0E2615] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Leaf className="w-5 h-5 text-[#F5D76E]" />
                </div>

                <div className="min-w-0">
                  <span className="text-lg sm:text-2xl font-black text-[#112616] font-['Almarai'] block leading-none truncate">
                    {STORE_CONFIG.storeName}
                  </span>
                  <span className="text-[10px] sm:text-[12px] text-[#524B3E] font-bold hidden sm:block mt-0.5 truncate">
                    خضر وفواكه طازجة لباب دارك
                  </span>
                </div>
              </button>
            </div>

            {/* ── وسط: حقل البحث (سطح المكتب) ── */}
            <form onSubmit={onSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full group">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#524B3E] group-focus-within:text-[#C25E12] transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ابحث عن خضار، فواكه، ألبان..."
                  className="w-full pr-10 pl-9 py-2.5 bg-[#F7F4EC] border-2 border-transparent rounded-xl text-sm text-[#1A1814] placeholder-[#787163] focus:outline-none focus:bg-white focus:border-[#C25E12] focus:ring-2 focus:ring-[#C25E12]/15 transition-all font-['Tajawal'] font-medium shadow-xs hover:bg-white hover:border-[#D4C8B5]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787163] hover:text-[#C25E12] text-xs p-1.5 rounded-full hover:bg-[#EAE2D2] active:scale-90 transition-all touch-manipulation select-none cursor-pointer"
                    aria-label="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* ── يسار: بحث جوّال + واتساب + السلة ── */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* زر البحث الجوّال */}
              <button
                type="button"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className={`md:hidden w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition-all duration-150 shadow-sm active:scale-90 touch-manipulation select-none cursor-pointer shrink-0 border-2 ${
                  showMobileSearch
                    ? 'bg-[#C25E12] border-[#C25E12] text-white'
                    : 'bg-white border-[#C25E12] text-[#C25E12] hover:bg-[#F7F4EC]'
                }`}
                aria-label="بحث عن منتج"
              >
                {showMobileSearch ? (
                  <X className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Search className="w-5 h-5 stroke-[2.5]" />
                )}
              </button>

              {/* واتساب (سطح المكتب) */}
              <a
                href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366]/15 text-[#145A25] border border-[#25D366]/40 hover:bg-[#25D366]/25 active:scale-95 transition-all text-xs font-black font-['Almarai'] shadow-xs touch-manipulation select-none"
              >
                <Phone className="w-3.5 h-3.5 fill-current" />
                <span>واتساب</span>
              </a>

              {/* زر السلة */}
              <button
                type="button"
                onClick={onOpenCart}
                className="relative flex items-center gap-2 px-3 sm:px-5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-l from-[#C25E12] to-[#9C4505] hover:from-[#B85507] hover:to-[#8A3D04] text-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-150 font-extrabold font-['Almarai'] touch-manipulation select-none cursor-pointer shrink-0"
                aria-label={`سلة المشتريات (${cartCount} منتجات)`}
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2.5 -left-2.5 min-w-[22px] h-[22px] px-1 rounded-full bg-[#112616] text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none text-right">
                  <span className="text-[10px] text-amber-100 font-bold">السلة</span>
                  <span className="text-xs sm:text-sm font-black tabular-nums" dir="ltr">
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
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#524B3E] pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ابحث عن خضار، فواكه، ألبان..."
                  className="w-full pr-10 pl-9 py-3 bg-white border-2 border-[#C25E12]/40 rounded-xl text-sm text-[#1A1814] placeholder-[#787163] focus:outline-none focus:border-[#C25E12] focus:ring-2 focus:ring-[#C25E12]/15 transition-all font-['Tajawal'] font-medium shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787163] hover:text-[#C25E12] text-xs p-1.5 rounded-full hover:bg-[#EAE2D2] transition-colors"
                    aria-label="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      </header>

      {/* ════════ القائمة الجانبية (Drawer) ════════ */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMenu}
          />

          <div className="relative ml-auto w-full max-w-xs bg-[#FBF9F5] h-full shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-left duration-300 border-l border-[#D4C8B5]">

            {/* ─── رأس الدرج ─── */}
            <div className="relative p-4 bg-gradient-to-l from-[#163920] to-[#0E2615] text-white flex items-center justify-between shadow-md shrink-0 overflow-hidden">
              {/* زخرفة خلفية */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,215,110,0.15),transparent_60%)] pointer-events-none" />

              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-sm">
                  <Leaf className="w-5 h-5 text-[#F5D76E]" />
                </div>
                <div>
                  <span className="font-black text-base font-['Almarai'] block leading-tight">
                    متجر خُضرة
                  </span>
                  <span className="text-[10px] text-emerald-200 font-bold block">
                    خضر وفواكه طازجة
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onCloseMenu}
                className="relative w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all cursor-pointer touch-manipulation select-none border border-white/15"
                aria-label="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ─── المحتوى ─── */}
            <div className="p-4 flex-1">

              {/* ─── 🧺 قسم صناديق العائلة (بارز) ─── */}
              <div className="mb-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 shadow-sm overflow-hidden">
                {/* شريط علوي */}
                <div className="px-3 py-2 bg-gradient-to-l from-[#C25E12] to-[#9C4505] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#F5D76E]" />
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">
                    عرض خاص
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleScrollToBundles}
                  className="w-full flex items-center justify-between gap-3 px-3 py-3 min-h-[60px] bg-white hover:bg-amber-50/50 active:scale-[0.98] text-[#112616] font-extrabold text-sm transition-all text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#163920] to-[#0E2615] flex items-center justify-center text-white shadow-sm shrink-0">
                      <Package className="w-5 h-5 text-[#F5D76E]" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C25E12] text-white text-[9px] flex items-center justify-center border border-white font-black">
                        ✨
                      </span>
                    </div>
                    <div className="text-right min-w-0">
                      <span className="block text-sm font-black text-[#112616] truncate">
                        صناديق العائلة
                      </span>
                      <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                        وفّر حتى 20% • توصيل مجاني
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-white font-black bg-[#C25E12] px-2.5 py-1 rounded-full shadow-sm shrink-0">
                    جديد
                  </span>
                </button>
              </div>

              {/* ─── تصفح الأقسام ─── */}
              <div className="text-[11px] font-black text-[#787163] uppercase tracking-wider mb-2 font-['Almarai'] select-none">
                تصفح الأقسام
              </div>
              <div className="space-y-1 mb-4">
                {CATEGORIES_CONFIG.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.id);
                      onOpenPage(null);
                      onCloseMenu();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl hover:bg-[#F7F4EC] active:bg-[#EFE8DC] text-[#1A1814] hover:text-[#112616] font-extrabold text-sm transition-colors text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[#F7F4EC] group-hover:bg-white border border-[#E8E1D3] flex items-center justify-center text-base shrink-0 transition-colors">
                        {cat.icon}
                      </span>
                      <span>{cat.name}</span>
                    </div>
                    <span className="text-xs text-[#787163] font-bold group-hover:text-[#C25E12] group-hover:translate-x-[-2px] transition-all">
                      ←
                    </span>
                  </button>
                ))}
              </div>

              {/* ─── روابط مهمة ─── */}
              <div className="border-t border-[#E8E1D3] pt-4">
                <div className="text-[11px] font-black text-[#787163] uppercase tracking-wider mb-2 font-['Almarai'] select-none">
                  روابط مهمة
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => { onOpenPage('about'); onCloseMenu(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl hover:bg-[#F7F4EC] text-[#1A1814] font-extrabold text-sm text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none"
                  >
                    <Info className="w-4 h-4 text-[#163920] shrink-0" />
                    <span>من نحن</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { onOpenPage('policy'); onCloseMenu(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl hover:bg-[#F7F4EC] text-[#1A1814] font-extrabold text-sm text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none"
                  >
                    <RefreshCw className="w-4 h-4 text-[#C25E12] shrink-0" />
                    <span>سياسة الإرجاع</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { onOpenPage('privacy'); onCloseMenu(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl hover:bg-[#F7F4EC] text-[#1A1814] font-extrabold text-sm text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#163920] shrink-0" />
                    <span>سياسة الخصوصية</span>
                  </button>
                </div>
              </div>

              {/* ─── زر تحميل التطبيق ─── */}
              {!isInstalled && (
                <div className="mt-4 pt-4 border-t border-[#E8E1D3]">
                  <button
                    type="button"
                    onClick={handleDownloadClick}
                    disabled={downloadStatus === 'downloading'}
                    className={`w-full flex items-center gap-3 px-3 py-3 min-h-[52px] rounded-xl font-extrabold text-sm transition-all duration-150 text-right font-['Tajawal'] group cursor-pointer touch-manipulation select-none border-2 ${
                      downloadStatus === 'downloading'
                        ? 'bg-stone-200 text-stone-500 border-stone-300 cursor-wait'
                        : 'bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white border-[#0E2615] shadow-md hover:shadow-lg active:scale-95'
                    }`}
                  >
                    <span className={`text-xl ${downloadStatus === 'downloading' ? 'animate-spin' : ''}`}>
                      {downloadStatus === 'downloading' ? '⏳' : '📲'}
                    </span>

                    <span className="flex-1">
                      {downloadStatus === 'downloading'
                        ? 'جاري تحميل التطبيق...'
                        : isIOS
                          ? 'تحميل التطبيق (iOS)'
                          : isAndroid
                            ? 'تحميل التطبيق (Android)'
                            : 'تحميل التطبيق'}
                    </span>

                    <Download className={`w-4 h-4 ${
                      downloadStatus === 'downloading'
                        ? 'opacity-50'
                        : 'text-[#F5D76E] group-hover:translate-y-[-2px] transition-transform'
                    }`} />

                    {showInstallBtn && !isIOS && downloadStatus === 'idle' && (
                      <span className="text-[10px] bg-[#C25E12] text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                        متاح
                      </span>
                    )}
                  </button>
                </div>
              )}

              {isInstalled && (
                <div className="mt-4 pt-4 border-t border-[#E8E1D3]">
                  <div className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-emerald-50 text-emerald-900 font-extrabold text-sm text-right font-['Tajawal'] border-2 border-emerald-200">
                    <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-white" />
                    </span>
                    <span>التطبيق مثبت بالفعل ✅</span>
                  </div>
                </div>
              )}
            </div>

            {/* ─── تذييل الدرج ─── */}
            <div className="p-3.5 bg-[#F7F4EC] border-t border-[#D4C8B5] text-right shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-[#524B3E] font-['Tajawal'] font-semibold">
                  خدمة الزبناء متوفرة يومياً من 09:00 إلى 21:00
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};