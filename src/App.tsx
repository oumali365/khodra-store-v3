// ============================================================
// App.tsx – الإصدار 4.0
// يدمج CategoryHeader داخل CategoryFilter + onScrollToBundles
// ============================================================
import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { RotateCcw, ChevronDown, Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { FamilyBoxesSection, FamilyBox } from './components/FamilyBoxesSection';
import { StickyBottomBar } from './components/StickyBottomBar';
import { TrustBadges } from './components/TrustBadges';
import { CustomerReviews } from './components/CustomerReviews';
import { Footer } from './components/Footer';
import { SortOption } from './components/SortFilterModal';
import { ExitScreen } from './components/ExitScreen';

// ─── تحميل مؤجل للمودالات لتقليص الحجم الأولي وتسريع ظهور الصفحة الرئيسية ───
const CartDrawer = React.lazy(() =>
  import('./components/CartDrawer').then((m) => ({ default: m.CartDrawer }))
);
const CheckoutModal = React.lazy(() =>
  import('./components/CheckoutModal').then((m) => ({ default: m.CheckoutModal }))
);
const ConfirmationModal = React.lazy(() =>
  import('./components/ConfirmationModal').then((m) => ({ default: m.ConfirmationModal }))
);
const ExitConfirmationModal = React.lazy(() =>
  import('./components/ExitConfirmationModal').then((m) => ({ default: m.ExitConfirmationModal }))
);
const SortFilterModal = React.lazy(() =>
  import('./components/SortFilterModal').then((m) => ({ default: m.SortFilterModal }))
);

// ─── تحميل مؤجل للصفحات الإضافية والخريطة ───
const InfoPages = React.lazy(() =>
  import('./components/InfoPages').then((module) => ({ default: module.InfoPages }))
);
const StoreCoverageMap = React.lazy(() =>
  import('./components/StoreCoverageMap')
    .catch((err) => {
      console.warn('First attempt to load StoreCoverageMap failed, retrying...', err);
      return import('./components/StoreCoverageMap');
    })
    .then((module) => ({ default: module.default || module.StoreCoverageMap }))
);

// ─── صمام أمان للخريطة ───
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn('StoreCoverageMap dynamic load error caught safely:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-8 sm:my-12">
          <div className="bg-white border border-[#E8E1D3] rounded-[24px] p-6 sm:p-8 text-center space-y-3 shadow-sm">
            <span className="text-3xl select-none">🗺️</span>
            <h3 className="text-base font-black text-[#112616] font-['Almarai']">
              موقع المتجر ونطاق التوصيل بمدينة فاس
            </h3>
            <p className="text-xs sm:text-sm text-[#524B3E] font-medium max-w-md mx-auto">
              توصيل يومي لكافة أحياء فاس (طريق إيموزار، الأطلس، النرجس، عين الشقف، المدينة الجديدة).
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] text-white text-xs sm:text-sm font-black hover:shadow-lg cursor-pointer transition-all shadow-md active:scale-95 border-2 border-[#0E2615]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#F5D76E]" />
              <span>إعادة تحميل الخريطة</span>
            </button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

import { Product, CartItem, ProductCategory, OrderSubmission } from './types';
import { fetchProducts, submitOrder } from './services/supabaseService';
import { STORE_CONFIG } from './data/config';
import { CATEGORIES_CONFIG } from './data/mockProducts';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Cart state ───
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORE_CONFIG.cacheKey);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item: any) =>
          item &&
          typeof item === 'object' &&
          typeof item.name === 'string' &&
          typeof item.qty === 'number' &&
          item.qty > 0 &&
          typeof item.lineTotal === 'number' &&
          !isNaN(item.lineTotal)
      );
    } catch {
      return [];
    }
  });

  // ─── Navigation & filter states ───
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('veg');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInfoPage, setActiveInfoPage] = useState<'about' | 'policy' | 'privacy' | null>(null);

  // ─── Sorting and in-stock filter ───
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // ─── Products pagination (8 products default) ───
  const INITIAL_VISIBLE_COUNT = 8;
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  // Reset pagination when category, search, or filters change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [selectedCategory, searchQuery, sortBy, onlyInStock]);

  // ─── Modals & Drawers ───
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderSubmission | null>(null);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [selectedFamilyBox, setSelectedFamilyBox] = useState<FamilyBox | null>(null);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isAppExited, setIsAppExited] = useState(false);

  // ─── Refs ───
  const prevStatesRef = useRef({
    isMenuOpen: false,
    isCartOpen: false,
    isCheckoutOpen: false,
    confirmedOrder: null as OrderSubmission | null,
    activeInfoPage: null as 'about' | 'policy' | 'privacy' | null,
    isSortModalOpen: false,
    selectedFamilyBox: null as FamilyBox | null,
    isExitConfirmOpen: false,
  });

  const searchResultsRef = useRef<HTMLDivElement>(null);
  const catalogSectionRef = useRef<HTMLDivElement>(null);
  const bundlesSectionRef = useRef<HTMLDivElement>(null);

  // ─── Load products ───
  useEffect(() => {
    let mounted = true;
    fetchProducts().then((data) => {
      if (mounted) {
        setProducts(data);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // ─── Sync cart to local storage ───
  useEffect(() => {
    try {
      localStorage.setItem(STORE_CONFIG.cacheKey, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // ─── Handle browser / mobile hardware back button ───
  useEffect(() => {
    // إرسال حالة رئيسية للتاريخ لضمان التقاط زر الرجوع
    window.history.replaceState({ page: 'main' }, '');
    window.history.pushState({ page: 'main' }, '');

    const handlePopState = () => {
      // 1. إذا كانت نافذة تأكيد الخروج مفتوحة: زر الرجوع يلغيها ويبقي العميل في المتجر
      if (isExitConfirmOpen) {
        setIsExitConfirmOpen(false);
        window.history.pushState({ page: 'main' }, '');
        return;
      }

      // 2. إذا كانت نافذة تفاصيل صندوق العائلة مفتوحة: زر الرجوع يغلقها فقط ولا يخرج من المتجر!
      if (selectedFamilyBox) {
        setSelectedFamilyBox(null);
        window.history.pushState({ page: 'main' }, '');
        return;
      }

      // 3. إذا كانت نافذة إتمام الطلب مفتوحة: إغلاقها والعودة
      if (isCheckoutOpen) {
        setIsCheckoutOpen(false);
        window.history.pushState({ page: 'main' }, '');
        return;
      }

      // 4. إذا كانت سلة المشتريات مفتوحة: إغلاقها
      if (isCartOpen) {
        setIsCartOpen(false);
        window.history.pushState({ page: 'main' }, '');
        return;
      }

      // 5. إذا كانت نافذة تأكيد الطلب مفتوحة: إغلاقها
      if (confirmedOrder) {
        setConfirmedOrder(null);
        window.history.pushState({ page: 'main' }, '');
        return;
      }

      // 6. إذا كانت صفحة معلومات مفتوحة: العودة للمتجر
      if (activeInfoPage) {
        setActiveInfoPage(null);
        window.history.pushState({ page: 'main' }, '');
        return;
      }

      // 7. إذا كانت نافذة الفرز والتصفية مفتوحة: إغلاقها
      if (isSortModalOpen) {
        setIsSortModalOpen(false);
        window.history.pushState({ page: 'main' }, '');
        return;
      }

      // 8. إذا كانت القائمة الجانبية مفتوحة: إغلاقها
      if (isMenuOpen) {
        setIsMenuOpen(false);
        window.history.pushState({ page: 'main' }, '');
        return;
      }

      // 9. إذا لم تكن هناك أي نافذة مفتوحة وكان العميل بالصفحة الرئيسية:
      // تفعيل خاصية "هل تريد الخروج من التطبيق؟" للتأكيد ومنع الخروج المفاجئ
      setIsExitConfirmOpen(true);
      window.history.pushState({ page: 'main' }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isExitConfirmOpen,
    selectedFamilyBox,
    isCheckoutOpen,
    isCartOpen,
    confirmedOrder,
    activeInfoPage,
    isSortModalOpen,
    isMenuOpen,
  ]);

  // ─── Push history state when modal opens ───
  useEffect(() => {
    const prev = prevStatesRef.current;
    const currentHasOpen =
      isMenuOpen ||
      isCartOpen ||
      isCheckoutOpen ||
      !!confirmedOrder ||
      !!activeInfoPage ||
      isSortModalOpen ||
      !!selectedFamilyBox ||
      isExitConfirmOpen;

    const prevHasOpen =
      prev.isMenuOpen ||
      prev.isCartOpen ||
      prev.isCheckoutOpen ||
      !!prev.confirmedOrder ||
      !!prev.activeInfoPage ||
      prev.isSortModalOpen ||
      !!prev.selectedFamilyBox ||
      prev.isExitConfirmOpen;

    if (currentHasOpen && !prevHasOpen) {
      window.history.pushState({ page: 'modal' }, '');
    }

    prevStatesRef.current = {
      isMenuOpen,
      isCartOpen,
      isCheckoutOpen,
      confirmedOrder,
      activeInfoPage,
      isSortModalOpen,
      selectedFamilyBox,
      isExitConfirmOpen,
    };
  }, [
    isMenuOpen,
    isCartOpen,
    isCheckoutOpen,
    confirmedOrder,
    activeInfoPage,
    isSortModalOpen,
    selectedFamilyBox,
    isExitConfirmOpen,
  ]);

  // ─── حماية السلة عند محاولة مغادرة الصفحة أو إغلاق التبويب (beforeunload) ───
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cart.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cart]);

  // ─── Menu controls ───
  const handleToggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleCloseMenu = () => setIsMenuOpen(false);

  // ─── Cart helpers ───
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.lineTotal, 0), [cart]);

  const handleAddToCart = (product: Product, quantity: number) => {
    const isWeight = product.type === 'weight';
    const variantLabel = isWeight ? `${quantity} kg` : `${quantity} × ${product.unit_label || 'unit'}`;
    const key = `${product.id}|${variantLabel}`;
    const total = quantity * product.price;

    setCart((prev) => {
      const index = prev.findIndex((i) => i.key === key);
      if (index >= 0) {
        const next = [...prev];
        const existing = next[index];
        const newQty = existing.qty + 1;
        next[index] = {
          ...existing,
          qty: newQty,
          lineTotal: +(total * newQty).toFixed(2),
        };
        return next;
      }

      const newItem: CartItem = {
        key,
        id: product.id,
        name: product.name,
        icon: product.icon,
        image_url: product.image_url,
        variantLabel,
        unitTotal: +total.toFixed(2),
        qty: 1,
        lineTotal: +total.toFixed(2),
      };
      return [...prev, newItem];
    });
  };

  const handleUpdateCartQty = (key: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.key !== key) return item;
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          const unitPrice = item.unitTotal > 0 ? item.unitTotal : (item.lineTotal / item.qty);
          return {
            ...item,
            qty: newQty,
            lineTotal: +(unitPrice * newQty).toFixed(2),
          };
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  };

  const handleClearCart = () => setCart([]);

  // ─── Order submission ───
  const handleOrderSubmission = async (order: OrderSubmission) => {
    const result = await submitOrder(order);

    if (!result.success) {
      console.error('❌ فشل حفظ الطلب:', result.message, result.errorCode);
      const errorMessage = result.message || 'تعذّر حفظ الطلب في قاعدة البيانات';
      alert(
        '⚠️ تعذّر إرسال الطلب\n\n' +
        errorMessage + '\n\n' +
        '📱 يرجى التواصل معنا مباشرة عبر واتساب لإتمام طلبك:\n' +
        STORE_CONFIG.whatsappNumber
      );
      return;
    }

    setConfirmedOrder(order);
    setIsCheckoutOpen(false);
    setCart([]);
  };

  // ─── Search handlers ───
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setTimeout(() => scrollToSearchResults(), 150);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) scrollToSearchResults();
  };

  const scrollToSearchResults = () => {
    if (searchResultsRef.current) {
      searchResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ─── Scroll to catalog & category filter ───
  const categoryFilterRef = useRef<HTMLDivElement>(null);

  const scrollToCategoryFilter = () => {
    if (categoryFilterRef.current) {
      categoryFilterRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToCatalog = () => {
    if (catalogSectionRef.current) {
      catalogSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ─── Scroll to bundles ───
  const scrollToBundles = () => {
    if (bundlesSectionRef.current) {
      bundlesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const el = document.getElementById('family-boxes-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ─── Category selection ───
  const handleSelectCategory = (cat: ProductCategory, fromCategoryFilter = false) => {
    if (isMenuOpen) setIsMenuOpen(false);
    if (searchQuery.trim().length > 0) setSearchQuery('');
    setSelectedCategory(cat);
    if (activeInfoPage) setActiveInfoPage(null);

    // عند اختيار فئة من شريط الفئات نفسه، لا نقفز إلى بطاقات المنتجات
    // بل تتم معاينة شريط الفئات والوصف المحدّث في مكانه
    if (!fromCategoryFilter) {
      setTimeout(() => scrollToCategoryFilter(), 100);
    }
  };

  // ─── Open info page ───
  const handleOpenPage = (page: 'about' | 'policy' | 'privacy' | null) => {
    if (isMenuOpen) setIsMenuOpen(false);
    setActiveInfoPage(page);
    if (page) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Filtered & sorted products ───
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const hasSearch = searchQuery.trim().length > 0;
      const matchesCategory = hasSearch ? true : selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (p.origin && p.origin.toLowerCase().includes(searchQuery.toLowerCase().trim()));
      const matchesStock = !onlyInStock || p.stock > 0;
      return matchesCategory && matchesSearch && matchesStock;
    });

    if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [products, selectedCategory, searchQuery, onlyInStock, sortBy]);

  // ─── Products to display based on pagination limit (8 products default) ───
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // ─── Active category info ───
  const activeCategoryInfo = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return {
        id: 'search',
        name: `نتائج البحث عن "${searchQuery.trim()}"`,
        icon: '🔍',
        description: `عرض ${filteredProducts.length} منتج${filteredProducts.length !== 1 ? 'ات' : ''} تطابق بحثك`,
      };
    }

    const category = CATEGORIES_CONFIG.find((c) => c.id === selectedCategory);
    if (category) return category;

    return {
      id: 'veg',
      name: 'خضروات',
      icon: '🥬',
      description: 'خضروات طازجة منتقاة بعناية من الحقول المغربية تصلكم مباشرة',
    };
  }, [selectedCategory, searchQuery, filteredProducts.length]);

  if (isAppExited) {
    return (
      <ExitScreen
        onReenter={() => {
          setIsAppExited(false);
          setIsExitConfirmOpen(false);
          window.history.pushState({ page: 'main' }, '');
        }}
        cartCount={cartCount}
        cartTotal={cartTotal}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F2EEE4] text-[#1A1814] flex flex-col font-['Tajawal']" dir="rtl">

      {/* ═══════ Header ═══════ */}
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => handleSelectCategory(cat, false)}
        onOpenPage={handleOpenPage}
        isMenuOpen={isMenuOpen}
        onToggleMenu={handleToggleMenu}
        onCloseMenu={handleCloseMenu}
        onScrollToBundles={scrollToBundles}
        onOpenExitModal={() => setIsExitConfirmOpen(true)}
      />

      {/* ═══════ Main Content ═══════ */}
      <main className="flex-1">
        {activeInfoPage ? (
          <Suspense fallback={<div className="max-w-3xl mx-auto p-12 text-center text-sm text-[#524B3E]">جاري التحميل...</div>}>
            <InfoPages page={activeInfoPage} onBackToShop={() => handleOpenPage(null)} />
          </Suspense>
        ) : (
          <>
            {/* ─── Hero ─── */}
            <Hero
              onSelectCategory={(cat) => handleSelectCategory(cat, false)}
              onScrollToCatalog={scrollToCategoryFilter}
              onScrollToBundles={scrollToBundles}
            />

            {/* ─── Category Filter (مدمج مع الوصف المحسّن وزر التصفية بالأيقونة الخضراء) ─── */}
            <div ref={categoryFilterRef} id="category-filter-section" className="scroll-mt-20">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => handleSelectCategory(cat, true)}
                products={products}
                categoryInfo={activeCategoryInfo}
                sortBy={sortBy}
                onlyInStock={onlyInStock}
                onOpenSort={() => setIsSortModalOpen(true)}
                searchQuery={searchQuery}
                onClearSearch={() => {
                  setSearchQuery('');
                  setSelectedCategory('veg');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>

            {/* ═══════ Products Grid Section ═══════ */}
            <section
              id="search-results-section"
              ref={searchResultsRef}
              className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-12"
            >
              <div ref={catalogSectionRef} id="catalog-section" />

              {/* Grid or Empty/Loading state */}
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-4 border border-[#E8E1D3] h-64 animate-pulse flex flex-col items-center justify-center gap-3"
                    >
                      <div className="w-16 h-16 bg-[#F7F4EC] rounded-2xl" />
                      <div className="w-24 h-4 bg-[#F7F4EC] rounded-full" />
                      <div className="w-16 h-3 bg-[#F7F4EC] rounded-full" />
                      <div className="w-full h-8 bg-[#F7F4EC] rounded-xl mt-auto" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-[#E8E1D3] rounded-3xl p-10 text-center max-w-md mx-auto shadow-sm">
                  <span className="text-4xl block mb-2">🔍</span>
                  <h3 className="text-base font-black text-[#112616] mb-1">
                    لم نتمكن من العثور على أي منتج
                  </h3>
                  <p className="text-xs sm:text-sm text-[#524B3E] mb-4">
                    {searchQuery ? `لا توجد منتجات تطابق بحثك "${searchQuery}".` : 'لا توجد منتجات تطابق شروط الفرز الحالية.'}
                    {searchQuery && ' جرب البحث باسم آخر أو اختر قسماً مختلفاً.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('veg');
                      setSortBy('default');
                      setOnlyInStock(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:shadow-lg text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer border-2 border-[#0E2615] active:scale-95"
                  >
                    {searchQuery ? 'عرض الخضروات المتوفرة' : 'عرض جميع المنتجات المتوفرة'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {displayedProducts.map((product) => {
                      const cartItem = cart.find((c) => c.id === product.id);
                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          inCartQty={cartItem ? cartItem.qty : 0}
                          onAddToCart={handleAddToCart}
                        />
                      );
                    })}
                  </div>

                  {/* ─── زر عرض باقي المنتجات بتصميم متناسق مع زر التقييمات ─── */}
                  {filteredProducts.length > INITIAL_VISIBLE_COUNT && (
                    <div className="mt-6 text-center">
                      {visibleCount < filteredProducts.length ? (
                        <button
                          type="button"
                          id="load-more-products-btn"
                          onClick={() => setVisibleCount((prev) => prev + 8)}
                          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-white border-2 border-[#E8E1D3] hover:border-[#C25E12] hover:bg-[#F7F4EC] text-[#163920] text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 shadow-sm group"
                          title="عرض باقي المنتجات"
                        >
                          <ChevronDown className="w-4 h-4 text-[#163920] group-hover:text-[#C25E12] transition-colors" />
                          <span>عرض باقي المنتجات ({filteredProducts.length - visibleCount})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setVisibleCount(INITIAL_VISIBLE_COUNT);
                            // إعادة موضع الشاشة بسلاسة إلى بداية قائمة المنتجات لمنع القفز أو ظهور الخريطة فجأة
                            if (catalogSectionRef.current) {
                              catalogSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-white border-2 border-[#E8E1D3] hover:border-[#C25E12] hover:bg-[#F7F4EC] text-[#163920] text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 shadow-sm group"
                          title="عرض أقل"
                        >
                          <ChevronDown className="w-4 h-4 text-[#163920] group-hover:text-[#C25E12] transition-colors rotate-180" />
                          <span>عرض أقل</span>
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>

            {/* ─── Family Boxes Section ─── */}
            <div ref={bundlesSectionRef}>
              <FamilyBoxesSection
                onAddToCart={handleAddToCart}
                selectedBox={selectedFamilyBox}
                onSelectBox={setSelectedFamilyBox}
              />
            </div>

            {/* ─── Trust Badges ─── */}
            <TrustBadges />

            {/* ─── Store Coverage Map ─── */}
            <MapErrorBoundary>
              <Suspense
                fallback={
                  <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-8 sm:my-12">
                    <div className="bg-white border border-[#E8E1D3] rounded-[24px] p-4 sm:p-7 shadow-sm text-center animate-pulse space-y-4">
                      <div className="h-6 w-48 bg-stone-200 rounded-lg mx-auto"></div>
                      <div className="h-[310px] sm:h-[400px] md:h-[460px] bg-[#F7F4EC] rounded-2xl flex items-center justify-center text-xs text-stone-400 font-black">
                        جاري تحميل خريطة التغطية...
                      </div>
                    </div>
                  </section>
                }
              >
                <StoreCoverageMap />
              </Suspense>
            </MapErrorBoundary>

            {/* ─── Customer Reviews ─── */}
            <CustomerReviews />
          </>
        )}
      </main>

      {/* ═══════ Lazy Loaded Modals ═══════ */}
      <Suspense fallback={null}>
        {isCartOpen && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cart}
            onUpdateQty={handleUpdateCartQty}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onProceedToCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
          />
        )}

        {isCheckoutOpen && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            items={cart}
            onSubmitOrder={handleOrderSubmission}
          />
        )}

        {confirmedOrder && (
          <ConfirmationModal
            isOpen={!!confirmedOrder}
            order={confirmedOrder}
            onClose={() => setConfirmedOrder(null)}
          />
        )}

        {isSortModalOpen && (
          <SortFilterModal
            isOpen={isSortModalOpen}
            onClose={() => setIsSortModalOpen(false)}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onlyInStock={onlyInStock}
            onToggleOnlyInStock={() => setOnlyInStock((prev) => !prev)}
            onReset={() => {
              setSortBy('default');
              setOnlyInStock(false);
            }}
          />
        )}

        {/* ─── نافذة تأكيد الخروج من التطبيق ─── */}
        {isExitConfirmOpen && (
          <ExitConfirmationModal
            isOpen={isExitConfirmOpen}
            onClose={() => setIsExitConfirmOpen(false)}
            onConfirmExit={() => {
              setIsExitConfirmOpen(false);
              setIsAppExited(true);
            }}
            cartCount={cartCount}
            cartTotal={cartTotal}
          />
        )}
      </Suspense>

      {/* ═══════ Floating Sticky Bottom Bar ═══════ */}
      <StickyBottomBar
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* ═══════ Footer ═══════ */}
      <Footer onOpenPage={handleOpenPage} />

    </div>
  );
}