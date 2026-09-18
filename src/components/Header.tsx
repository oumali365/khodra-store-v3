// ============================================================
// الملف: Header.tsx – الإصدار 3.0
// رأس المتجر – تصميم متناسق مع باقي المكونات
// ============================================================
import React, { useState } from 'react';
import {
  ShoppingBag, Search, Menu, X, Phone, ShieldCheck,
  RefreshCw, Info, Package, Sparkles, Leaf, LogOut,
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
  onSelectCategory,
  onOpenPage,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onScrollToBundles,
  onOpenExitModal,
}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E8E1D3] shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">

            {/* ── يمين: زر القائمة + الشعار المميز بدون أيقونة ── */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* زر القائمة */}
              <button
                type="button"
                onClick={onToggleMenu}
                className={`relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-white transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#C25E12]/40 touch-manipulation select-none cursor-pointer shrink-0 ${
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

              {/* الشعار المطور بدون أيقونة وبأناقة طباعية عالية */}
              <button
                type="button"
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

              {/* ─── خيار الخروج من التطبيق ─── */}
              {onOpenExitModal && (
                <div className="mt-4 pt-3 border-t border-[#E8E1D3]">
                  <button
                    type="button"
                    id="drawer-exit-app-btn"
                    onClick={() => {
                      onCloseMenu();
                      onOpenExitModal();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[46px] rounded-xl hover:bg-rose-50 text-stone-600 hover:text-rose-700 font-extrabold text-xs sm:text-sm text-right font-['Tajawal'] cursor-pointer touch-manipulation select-none transition-colors border border-transparent hover:border-rose-200"
                  >
                    <LogOut className="w-4 h-4 text-stone-400 group-hover:text-rose-600 shrink-0" />
                    <span>الخروج من التطبيق</span>
                  </button>
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