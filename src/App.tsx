import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { ArrowDownWideNarrow } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { StickyBottomBar } from './components/StickyBottomBar';
import { TrustBadges } from './components/TrustBadges';
import { Footer } from './components/Footer';
import { SortFilterModal, SortOption } from './components/SortFilterModal';

// تحميل مؤجل للنوافذ والصفحات غير الحرجة لتقليل حجم الجافاسكريبت المبدئي وتسريع التحميل
const CartDrawer = React.lazy(() =>
  import('./components/CartDrawer').then((module) => ({ default: module.CartDrawer }))
);
const CheckoutModal = React.lazy(() =>
  import('./components/CheckoutModal').then((module) => ({ default: module.CheckoutModal }))
);
const ConfirmationModal = React.lazy(() =>
  import('./components/ConfirmationModal').then((module) => ({ default: module.ConfirmationModal }))
);
const InfoPages = React.lazy(() =>
  import('./components/InfoPages').then((module) => ({ default: module.InfoPages }))
);

import { Product, CartItem, ProductCategory, OrderSubmission } from './types';
import { fetchProducts, submitOrder } from './services/supabaseService';
import { STORE_CONFIG } from './data/config';
import { CATEGORIES_CONFIG } from './data/mockProducts';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart state with persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORE_CONFIG.cacheKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Navigation & filter states
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('veg');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInfoPage, setActiveInfoPage] = useState<'about' | 'policy' | 'privacy' | null>(null);

  // Sorting and in-stock filter state
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // Modals & Drawers
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderSubmission | null>(null);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Refs
  const prevStatesRef = useRef({
    isMenuOpen: false,
    isCartOpen: false,
    isCheckoutOpen: false,
    confirmedOrder: null as OrderSubmission | null,
    activeInfoPage: null as 'about' | 'policy' | 'privacy' | null,
    isSortModalOpen: false,
  });

  const searchResultsRef = useRef<HTMLDivElement>(null);
  const catalogSectionRef = useRef<HTMLDivElement>(null);

  // Load products on start
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

  // Sync cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORE_CONFIG.cacheKey, JSON.stringify(cart));
    } catch {
      // ignore storage full errors
    }
  }, [cart]);

  // ─── FUNCTIONS TO CLOSE ALL MODALS/DRAWERS ───
  const closeAllModalsAndDrawers = useCallback(() => {
    let changed = false;

    if (isMenuOpen) {
      setIsMenuOpen(false);
      changed = true;
    }
    if (isCartOpen) {
      setIsCartOpen(false);
      changed = true;
    }
    if (isCheckoutOpen) {
      setIsCheckoutOpen(false);
      changed = true;
    }
    if (confirmedOrder) {
      setConfirmedOrder(null);
      changed = true;
    }
    if (activeInfoPage) {
      setActiveInfoPage(null);
      changed = true;
    }
    if (isSortModalOpen) {
      setIsSortModalOpen(false);
      changed = true;
    }

    return changed;
  }, [isMenuOpen, isCartOpen, isCheckoutOpen, confirmedOrder, activeInfoPage, isSortModalOpen]);

  // ─── HANDLE BROWSER BACK BUTTON ───
  useEffect(() => {
    window.history.pushState({ page: 'main' }, '');

    const handlePopState = () => {
      const hasAnyOpenModal = isMenuOpen || isCartOpen || isCheckoutOpen || !!confirmedOrder || !!activeInfoPage || isSortModalOpen;

      if (hasAnyOpenModal) {
        closeAllModalsAndDrawers();
        window.history.pushState({ page: 'main' }, '');
        return;
      }

      window.history.pushState({ page: 'main' }, '');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isMenuOpen, isCartOpen, isCheckoutOpen, confirmedOrder, activeInfoPage, isSortModalOpen, closeAllModalsAndDrawers]);

  // ─── PUSH HISTORY STATE WHEN ANY MODAL/DRAWER OPENS ───
  useEffect(() => {
    const prev = prevStatesRef.current;
    const currentHasOpen = isMenuOpen || isCartOpen || isCheckoutOpen || !!confirmedOrder || !!activeInfoPage || isSortModalOpen;
    const prevHasOpen = prev.isMenuOpen || prev.isCartOpen || prev.isCheckoutOpen || !!prev.confirmedOrder || !!prev.activeInfoPage || prev.isSortModalOpen;

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
    };
  }, [isMenuOpen, isCartOpen, isCheckoutOpen, confirmedOrder, activeInfoPage, isSortModalOpen]);

  // ─── MENU CONTROLS ───
  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  // ─── CART HELPERS ───
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
          const unitPrice = item.lineTotal / item.qty;
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

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderSubmission = async (order: OrderSubmission) => {
    await submitOrder(order);
    setConfirmedOrder(order);
    setIsCheckoutOpen(false);
    setCart([]);
  };

  // ─── SEARCH HANDLERS ───
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    if (query.trim().length > 0) {
      setTimeout(() => {
        scrollToSearchResults();
      }, 150);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      scrollToSearchResults();
    }
  };

  const scrollToSearchResults = () => {
    if (searchResultsRef.current) {
      searchResultsRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // ─── SCROLL TO CATALOG ───
  const scrollToCatalog = () => {
    if (catalogSectionRef.current) {
      catalogSectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // ─── CATEGORY SELECTION ───
  const handleSelectCategory = (cat: ProductCategory) => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }

    if (searchQuery.trim().length > 0) {
      setSearchQuery('');
    }

    setSelectedCategory(cat);

    if (activeInfoPage) {
      setActiveInfoPage(null);
    }

    setTimeout(() => {
      scrollToCatalog();
    }, 100);
  };

  // ─── OPEN INFO PAGE ───
  const handleOpenPage = (page: 'about' | 'policy' | 'privacy' | null) => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }

    setActiveInfoPage(page);

    if (page) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ─── FILTERED & SORTED PRODUCTS ───
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const hasSearch = searchQuery.trim().length > 0;

      const matchesCategory = hasSearch 
        ? true
        : selectedCategory === 'all' || p.category === selectedCategory;

      const matchesSearch = !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (p.origin && p.origin.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      const matchesStock = !onlyInStock || p.stock > 0;

      return matchesCategory && matchesSearch && matchesStock;
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, selectedCategory, searchQuery, onlyInStock, sortBy]);

  // ─── ACTIVE CATEGORY INFO ───
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
    if (category) {
      return category;
    }

    return {
      id: 'veg',
      name: 'خضروات',
      icon: '🥬',
      description: 'خضروات طازجة منتقاة بعناية من الحقول المغربية تصلكم مباشرة',
    };
  }, [selectedCategory, searchQuery, filteredProducts.length]);

  return (
    <div className="min-h-screen bg-[#F2EEE4] text-[#1A1814] flex flex-col font-['Tajawal']" dir="rtl">

      {/* Sticky Top Header */}
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onOpenPage={handleOpenPage}
        isMenuOpen={isMenuOpen}
        onToggleMenu={handleToggleMenu}
        onCloseMenu={handleCloseMenu}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeInfoPage ? (
          <Suspense fallback={<div className="max-w-3xl mx-auto p-12 text-center text-sm text-[#38332B]">جاري التحميل...</div>}>
            <InfoPages page={activeInfoPage} onBackToShop={() => handleOpenPage(null)} />
          </Suspense>
        ) : (
          <>
            {/* Hero Section */}
            <Hero
              onSelectCategory={handleSelectCategory}
              onScrollToCatalog={scrollToCatalog}
            />

            {/* Category Filter Pills (All Screens) */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              products={products}
            />

            {/* Products Grid Section */}
            <section 
              id="search-results-section"
              ref={searchResultsRef}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12"
            >
              <div ref={catalogSectionRef} id="catalog-section" />

              {/* Category Header Card – بطاقة تعريف المنتجات */}
              <div className="bg-gradient-to-b from-white to-[#FDFBF7] border border-[#D4C8B5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
                <div className="flex items-center gap-3.5 sm:gap-4 flex-col sm:flex-row text-center sm:text-right w-full sm:w-auto">
                  {/* أيقونة فرز وتصفية المنتجات الثابتة الملونة بالبرتقالي الأنيق */}
                  <button
                    type="button"
                    id="sort-products-btn"
                    onClick={() => setIsSortModalOpen(true)}
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 shrink-0 group ${
                      sortBy !== 'default' || onlyInStock
                        ? 'bg-gradient-to-br from-[#EA580C] to-[#C25E12] text-white ring-2 ring-[#C25E12]/40 ring-offset-2 ring-offset-white'
                        : 'bg-[#FFF5ED] hover:bg-[#FFEDD5] border-2 border-[#FDBA74] text-[#C25E12]'
                    }`}
                    title="فرز وتصفية المنتجات (الأقل سعراً، الأعلى سعراً، المخزن)"
                    aria-label="فرز وتصفية المنتجات"
                  >
                    <ArrowDownWideNarrow className={`w-5 h-5 sm:w-6 sm:h-6 stroke-[2.3] transition-transform group-hover:-translate-y-0.5 ${
                      sortBy !== 'default' || onlyInStock ? 'text-white' : 'text-[#C25E12]'
                    }`} />
                    {(sortBy !== 'default' || onlyInStock) && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 border-2 border-white rounded-full shadow-xs animate-pulse" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-[#112616] tracking-tight">
                        {activeCategoryInfo.name}
                      </h2>

                      <span className="text-xs font-black text-[#B85507] bg-[#FFF4EC] px-3 py-1 rounded-full border border-[#FDBA74] shadow-2xs">
                        {filteredProducts.length} متوفر
                      </span>

                      {(sortBy !== 'default' || onlyInStock) && (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-[#1E4327] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
                          <span className="text-emerald-700">✓</span>
                          <span>{sortBy === 'price-asc' ? 'الأقل سعراً' : sortBy === 'price-desc' ? 'الأعلى سعراً' : ''}</span>
                          <span>{onlyInStock ? (sortBy !== 'default' ? ' • المتوفر فقط' : 'المتوفر في المخزن فقط') : ''}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-[#4A4237] mt-1.5 font-medium leading-relaxed max-w-2xl">
                      {activeCategoryInfo.description}
                    </p>
                  </div>
                </div>

                {searchQuery && (
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('veg');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs sm:text-sm font-black text-[#B85507] hover:text-[#9C4505] bg-[#FFF4EC] hover:bg-[#FFE8D6] px-3.5 py-2 rounded-xl border border-[#FDBA74] shrink-0 cursor-pointer transition-colors shadow-2xs"
                    >
                      إلغاء تصفية البحث ({searchQuery}) ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Grid or Empty/Loading state */}
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-4 border border-[#DFD1AC] h-64 animate-pulse flex flex-col items-center justify-center gap-3"
                    >
                      <div className="w-16 h-16 bg-[#FAF6EE] rounded-2xl" />
                      <div className="w-24 h-4 bg-[#FAF6EE] rounded-full" />
                      <div className="w-16 h-3 bg-[#FAF6EE] rounded-full" />
                      <div className="w-full h-8 bg-[#FAF6EE] rounded-xl mt-auto" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-[#D4C8B5] rounded-3xl p-10 text-center max-w-md mx-auto shadow-sm">
                  <span className="text-4xl block mb-2">🔍</span>
                  <h3 className="text-base font-extrabold text-[#112616] mb-1">
                    لم نتمكن من العثور على أي منتج
                  </h3>
                  <p className="text-xs sm:text-sm text-[#38332B] mb-4">
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
                    className="px-5 py-2.5 rounded-xl bg-[#1E4327] hover:bg-[#112616] text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
                  >
                    {searchQuery ? 'عرض الخضروات المتوفرة' : 'عرض جميع المنتجات المتوفرة'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredProducts.map((product) => {
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
              )}
            </section>

            {/* Trust and Value Pillars */}
            <TrustBadges />
          </>
        )}
      </main>

      {/* ─── Lazy Loaded Modals wrapped in Suspense ─── */}
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

        {/* نافذة فرز وتصفية المنتجات الصغيرة */}
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
      </Suspense>

      {/* Floating Sticky Bottom Cart Bar */}
      <StickyBottomBar
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Footer */}
      <Footer
        onOpenPage={handleOpenPage}
      />

    </div>
  );
}