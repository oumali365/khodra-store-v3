// ============================================================
// الملف: Header.tsx – الإصدار 4.0
// رأس المتجر وقائمة منسدلة داخلية لفئات المتجر بتصميم أنيق ومحسن
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag, Search, Menu, X, Phone, ShieldCheck,
  RefreshCw, Info, Package, Leaf, LogOut,
  ChevronDown, Layers, Check, ExternalLink
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
  onOpenExitModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  cartTotal,
  onOpenCart,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onSelectCategory,
  onOpenPage,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onScrollToBundles,
  onOpenExitModal,
}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  // حالة القائمة المنسدلة الداخلية لفئات المتجر (مفتوحة افتراضياً أو قابلة للطي)
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(true);

  // إغلاق المودال بزر الهروب Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        onCloseMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, onCloseMenu]);

  // ─── التمرير إلى صناديق العائلة ───
  const handleScrollToBundles = () => {
    onCloseMenu();
    if (onScrollToBundles) {
      setTimeout(() => onScrollToBundles(), 200);
    } else {
      setTimeout(() => {
        const el = document.getElementById('family-bundles-section') || document.getElementById('family-boxes-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  };

  return (
    <>
      {/* ════════ الهيدر الرئيسي ════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E8E1D3] shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">

            {/* ── يمين: زر القائمة + الشعار المميز بدون أيقونة ── */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* زر القائمة */}
              <button
                type="button"
                id="main-nav-toggle-btn"
                onClick={onToggleMenu}
                className={`relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-white transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#C25E12]/40 touch-manipulation select-none cursor-pointer shrink-0 ${
                  isMenuOpen
                    ? 'bg-gradient-to-br from-[#C25E12] to-[#9C4505]'
                    : 'bg-gradient-to-br from-[#1E4327] to-[#112616] hover:from-[#112616] hover:to-[#0A1A0F]'
                }`}
                aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة الرئيسية'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              {/* الشعار المطور بدون أيقونة وبأناقة طباعية عالية */}
              <button
                type="button"
                id="store-logo-btn"
                onClick={() => onOpenPage(null)}
                className="group cursor-pointer text-right touch-manipulation select-none active:opacity-85 transition-opacity min-w-0"
              >
                <div className="flex flex-col justify-center">
                  <span className="text-2xl sm:text-3xl font-black text-[#163920] group-hover:text-[#0E2615] font-['Almarai'] tracking-tight leading-none transition-colors">
                    {STORE_CONFIG.storeName}
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#6B6455] font-bold mt-1 tracking-normal hidden xs:block sm:block truncate">
                    خضر وفواكه طازجة لباب دارك
                  </span>
                </div>
              </button>
            </div>

            {/* ── وسط: حقل البحث (سطح المكتب) بنمط أنظف ── */}
            <form onSubmit={onSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full group">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6455] group-focus-within:text-[#C25E12] transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ابحث عن خضار، فواكه، ألبان..."
                  className="w-full pr-10 pl-9 py-2.5 bg-[#FAF7F0] border border-[#E8E1D3] rounded-xl text-sm text-[#1A1814] placeholder-[#8A8170] focus:outline-none focus:bg-white focus:border-[#C25E12] focus:ring-2 focus:ring-[#C25E12]/15 transition-all font-['Tajawal'] font-medium shadow-xs hover:bg-white hover:border-[#D4C8B5]"
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
                id="mobile-search-toggle-btn"
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
                id="header-open-cart-btn"
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

      {/* ════════ القائمة الجانبية (Drawer / Menu) بتصميم محسن وأنيق ════════ */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* الخلفية المعتمة */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMenu}
          />

          {/* لوحة القائمة الجانبية */}
          <div className="relative ml-auto w-full max-w-[340px] sm:max-w-xs bg-[#FBF9F5] h-full shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-left duration-300 border-l border-[#D4C8B5]">

            {/* ─── رأس القائمة الجانبية ─── */}
            <div className="relative px-4 py-4 bg-gradient-to-l from-[#163920] to-[#0E2615] text-white flex items-center justify-between shadow-xs shrink-0 border-b border-[#0A1A0F]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-[#F5D76E]" />
                </div>
                <div>
                  <span className="font-black text-base font-['Almarai'] block leading-tight text-white">
                    {STORE_CONFIG.storeName}
                  </span>
                  <span className="text-[11px] text-emerald-200/80 font-medium block">
                    تسوق الخضر والفواكه الطازجة
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="menu-close-btn"
                onClick={onCloseMenu}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all cursor-pointer touch-manipulation select-none border border-white/15"
                aria-label="إغلاق القائمة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ─── المحتوى القابل للتمرير ─── */}
            <div className="p-3.5 sm:p-4 flex-1 overflow-y-auto no-scrollbar space-y-3.5">

              {/* ════════ 1. اكتشف فئات متجر خضرة (قائمة منسدلة داخلية) ════════ */}
              <div className="rounded-2xl bg-white border border-[#E8E1D3] shadow-xs overflow-hidden transition-all">
                {/* رأس القائمة المنسدلة للفئات: عرض فئات المتجر */}
                <button
                  type="button"
                  id="categories-accordion-trigger"
                  onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                  className="w-full flex items-center justify-between p-3.5 bg-gradient-to-l from-[#FAF7F0] to-white hover:bg-[#F4EFE3] active:bg-[#ECE5D6] text-right transition-colors cursor-pointer select-none group touch-manipulation"
                  aria-expanded={isCategoriesDropdownOpen}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#163920]/10 border border-[#163920]/20 flex items-center justify-center text-[#163920] shrink-0 group-hover:bg-[#163920] group-hover:text-white transition-colors">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[13px] font-black text-[#112616] font-['Almarai'] block leading-tight">
                        اكتشف فئات متجر خضرة
                      </span>
                      <span className="text-[11px] text-[#6B6455] font-medium block mt-0.5">
                        عرض فئات المتجر
                      </span>
                    </div>
                  </div>

                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[#524B3E] transition-transform duration-200 shrink-0 ${isCategoriesDropdownOpen ? 'rotate-180 text-[#C25E12]' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* المحتوى الداخلي المنسدل للفئات */}
                {isCategoriesDropdownOpen && (
                  <div className="p-2 pt-1 border-t border-[#EFE8DC] bg-[#FAF8F3]/60 space-y-1 animate-in slide-in-from-top-1 duration-150">
                    {CATEGORIES_CONFIG.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          id={`drawer-category-item-${cat.id}`}
                          onClick={() => {
                            onSelectCategory(cat.id);
                            onOpenPage(null);
                            onCloseMenu();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] rounded-xl text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none transition-all ${
                            isSelected
                              ? 'bg-gradient-to-l from-[#163920] to-[#0E2615] text-white shadow-xs font-black'
                              : 'hover:bg-white active:bg-[#EFE8DC] text-[#1A1814] hover:text-[#112616] font-bold text-xs sm:text-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 border ${
                              isSelected
                                ? 'bg-white/15 border-white/20 text-white'
                                : 'bg-white border-[#E8E1D3]'
                            }`}>
                              {cat.icon}
                            </span>
                            <span className="truncate">{cat.name}</span>
                          </div>

                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#F5D76E] text-[#112616] flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ════════ 2. قسم صناديق العائلة ════════ */}
              <div className="rounded-2xl bg-white border border-[#E8E1D3] shadow-xs overflow-hidden">
                <button
                  type="button"
                  id="drawer-family-boxes-btn"
                  onClick={handleScrollToBundles}
                  className="w-full flex items-center justify-between p-3.5 bg-gradient-to-l from-[#FAF7F0] to-white hover:bg-[#F4EFE3] active:bg-[#ECE5D6] text-[#112616] transition-colors text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#C25E12]/10 border border-[#C25E12]/20 flex items-center justify-center text-[#C25E12] shrink-0 group-hover:bg-[#C25E12] group-hover:text-white transition-colors">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="text-right min-w-0">
                      <span className="block text-[13px] font-black text-[#112616] truncate font-['Almarai'] leading-tight">
                        صناديق العائلة
                      </span>
                      <span className="text-[11px] text-[#6B6455] font-medium block mt-0.5">
                        سلات أسبوعية متكاملة بأسعار مميزة
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-[#8A8170] group-hover:text-[#C25E12] transition-colors font-bold pr-1">
                    ←
                  </span>
                </button>
              </div>

              {/* ════════ 3. روابط مهمة (ظاهرة وغير مطبقة كميزة منسدلة) ════════ */}
              <div className="rounded-2xl bg-white border border-[#E8E1D3] p-3 shadow-xs">
                <div className="text-[11px] font-black text-[#787163] uppercase tracking-wider mb-2 font-['Almarai'] select-none px-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#163920]" />
                  <span>روابط مهمة</span>
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    id="drawer-about-link"
                    onClick={() => { onOpenPage('about'); onCloseMenu(); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] rounded-xl hover:bg-[#F7F4EC] active:bg-[#EFE8DC] text-[#1A1814] font-bold text-xs sm:text-sm text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#163920]">
                        <Info className="w-4 h-4" />
                      </div>
                      <span>من نحن</span>
                    </div>
                    <span className="text-xs text-[#8A8170] group-hover:text-[#163920] font-bold">←</span>
                  </button>

                  <button
                    type="button"
                    id="drawer-policy-link"
                    onClick={() => { onOpenPage('policy'); onCloseMenu(); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] rounded-xl hover:bg-[#F7F4EC] active:bg-[#EFE8DC] text-[#1A1814] font-bold text-xs sm:text-sm text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C25E12]">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <span>سياسة الإرجاع</span>
                    </div>
                    <span className="text-xs text-[#8A8170] group-hover:text-[#C25E12] font-bold">←</span>
                  </button>

                  <button
                    type="button"
                    id="drawer-privacy-link"
                    onClick={() => { onOpenPage('privacy'); onCloseMenu(); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] rounded-xl hover:bg-[#F7F4EC] active:bg-[#EFE8DC] text-[#1A1814] font-bold text-xs sm:text-sm text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#163920]">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>سياسة الخصوصية والأمان</span>
                    </div>
                    <span className="text-xs text-[#8A8170] group-hover:text-[#163920] font-bold">←</span>
                  </button>
                </div>
              </div>

              {/* ─── خيار الخروج من التطبيق ─── */}
              {onOpenExitModal && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    id="drawer-exit-app-btn"
                    onClick={() => {
                      onCloseMenu();
                      onOpenExitModal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 min-h-[40px] rounded-xl hover:bg-rose-50 text-stone-600 hover:text-rose-700 font-bold text-xs text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none transition-colors border border-transparent hover:border-rose-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                        <LogOut className="w-3.5 h-3.5" />
                      </div>
                      <span>الخروج من التطبيق</span>
                    </div>
                    <span className="text-[10px] text-stone-400">إغلاق الجلسة</span>
                  </button>
                </div>
              )}
            </div>

            {/* ─── تذييل الدرج ─── */}
            <div className="p-3 bg-[#F4EFE3] border-t border-[#D4C8B5] text-right shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[11px] sm:text-xs text-[#524B3E] font-['Tajawal'] font-bold">
                  توصيل يومي لكافة أحياء فاس من 09:00 إلى 21:00
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
