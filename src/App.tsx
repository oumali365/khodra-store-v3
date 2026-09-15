// ============================================================
// الملف: App.tsx – الإصدار 3.0
// يدعم: صناديق العائلة + الصور الحقيقية + صور المنتجات
// ============================================================
import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { CategoryHeader } from './components/CategoryHeader';
import { ProductCard } from './components/ProductCard';
import { StickyBottomBar } from './components/StickyBottomBar';
import { TrustBadges } from './components/TrustBadges';
import { CustomerReviews } from './components/CustomerReviews';
import { Footer } from './components/Footer';
import { SortFilterModal, SortOption } from './components/SortFilterModal';

// ─── تحميل مؤجل للمكونات غير الحرجة ───
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

// ✨ تحميل مؤجل لقسم صناديق العائلة
const FamilyCart = React.lazy(() =>
  import('./components/FamilyCart').then((module) => ({ default: module.FamilyCart }))
);

import { Product, CartItem, ProductCategory, OrderSubmission } from './types';
import { fetchProducts, submitOrder } from './services/supabaseService';
import { STORE_CONFIG } from './data/config';
import { CATEGORIES_CONFIG } from './data/mockProducts';
import { FamilyBundle } from './data/familyBundles';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Cart state with persistence ───
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORE_CONFIG.cacheKey);
      return saved ? JSON.parse(saved) : [];
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

  // ─── Modals & Drawers ───
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderSubmission | null>(null);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // ─── Refs ───
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
  const bundlesSectionRef = useRef<HTMLDivElement>(null);

  // ─── Load products on start ───
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
      // ignore storage full errors
    }
  }, [cart]);

  // ─── Close all modals/drawers ───
  const closeAllModalsAndDrawers = useCallback(() => {
    let changed = false;
    if (isMenuOpen) { setIsMenuOpen(false); changed = true; }
    if (isCartOpen) { setIsCartOpen(false); changed = true; }
    if (isCheckoutOpen) { setIsCheckoutOpen(false); changed = true; }
    if (confirmedOrder) { setConfirmedOrder(null); changed = true; }
    if (activeInfoPage) { setActiveInfoPage(null); changed = true; }
    if (isSortModalOpen) { setIsSortModalOpen(false); changed = true; }
    return changed;
  }, [isMenuOpen, isCartOpen, isCheckoutOpen, confirmedOrder, activeInfoPage, isSortModalOpen]);

  // ─── Handle browser back button ───
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
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMenuOpen, isCartOpen, isCheckoutOpen, confirmedOrder, activeInfoPage, isSortModalOpen, closeAllModalsAndDrawers]);

  // ─── Push history state when modal opens ───
  useEffect(() => {
    const prev = prevStatesRef.current;
    const currentHasOpen = isMenuOpen || isCartOpen || isCheckoutOpen || !!confirmedOrder || !!activeInfoPage || isSortModalOpen;
    const prevHasOpen = prev.isMenuOpen || prev.isCartOpen || prev.isCheckoutOpen || !!prev.confirmedOrder || !!prev.activeInfoPage || prev.isSortModalOpen;

    if (currentHasOpen && !prevHasOpen) {
      window.history.pushState({ page: 'modal' }, '');
    }

    prevStatesRef.current = {
      isMenuOpen, isCartOpen, isCheckoutOpen, confirmedOrder, activeInfoPage, isSortModalOpen,
    };
  }, [isMenuOpen, isCartOpen, isCheckoutOpen, confirmedOrder, activeInfoPage, isSortModalOpen]);

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

  // ─── Add family bundle to cart ───
  const handleAddBundle = useCallback((bundle: FamilyBundle) => {
    // التحقق من وجود جميع المنتجات
    const missingProducts: string[] = [];
    bundle.items.forEach((bundleItem) => {
      const product = products.find((p) => p.id === Number(bundleItem.productId));
      if (!product) missingProducts.push(bundleItem.productId);
    });

    if (missingProducts.length > 0) {
      console.warn('⚠️ منتجات غير موجودة في قاعدة البيانات:', missingProducts);
    }

    setCart((prev) => {
      const nextCart = [...prev];

      bundle.items.forEach((bundleItem) => {
        const product = products.find((p) => p.id === Number(bundleItem.productId));
        if (!product) return;

        const isWeight = product.type === 'weight';
        const variantLabel = isWeight
          ? `${bundleItem.qty} kg`
          : `${bundleItem.qty} × ${product.unit_label || 'unit'}`;
        const key = `${product.id}|${bundle.name}|${variantLabel}`;
        const lineTotal = +(product.price * bundleItem.qty).toFixed(2);

        const existingIndex = nextCart.findIndex((i) => i.key === key);
        if (existingIndex >= 0) {
          const existing = nextCart[existingIndex];
          nextCart[existingIndex] = {
            ...existing,
            qty: existing.qty + 1,
            lineTotal: +((existing.lineTotal / existing.qty) * (existing.qty + 1)).toFixed(2),
          };
        } else {
          nextCart.push({
            key,
            id: product.id,
            name: product.name,
            icon: product.icon,
            image_url: product.image_url,
            variantLabel: `🧺 ${bundle.name}`,
            unitTotal: lineTotal,
            qty: 1,
            lineTotal,
            bundleId: bundle.id,
          });
        }
      });

      return nextCart;
    });
  }, [products]);

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

  const scrollToCatalog = () => {
    if (catalogSectionRef.current) {
      catalogSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ✨ تمرير إلى قسم صناديق العائلة
  const scrollToBundles = () => {
    if (bundlesSectionRef.current) {
      bundlesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ─── Category selection ───
  const handleSelectCategory = (cat: ProductCategory) => {
    if (isMenuOpen) setIsMenuOpen(false);
    if (searchQuery.trim().length > 0) setSearchQuery('');
    setSelectedCategory(cat);
    if (activeInfoPage) setActiveInfoPage(null);
    setTimeout(() => scrollToCatalog(), 100);
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
        onScrollToBundles={scrollToBundles}
      />

      {/* Main Content */}
      <main className="flex-1">
        {activeInfoPage ? (
          <Suspense fallback={<div className="max-w-3xl mx-auto p-12 text-center text-sm text-[#38332B]">جاري التحميل...</div>}>
            <InfoPages page={activeInfoPage} onBackToShop={() => handleOpenPage(null)} />
          </Suspense>
        ) : (
          <>
            {/* Hero */}
            <Hero
              onSelectCategory={handleSelectCategory}
              onScrollToCatalog={scrollToCatalog}
              onScrollToBundles={scrollToBundles}
            />

            {/* Category Filter Pills */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              products={products}
            />

            {/* ─── ✨ قسم صناديق العائلة ─── */}
            {!searchQuery && (
              <div ref={bundlesSectionRef}>
                <Suspense
                  fallback={
                    <div className="max-w-7xl mx-auto px-4 py-12 text-center">
                      <div className="w-12 h-12 border-4 border-[#C25E12] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-[#524B3E] mt-3 font-bold">جاري تحميل صناديق العائلة...</p>
                    </div>
                  }
                >
                  <FamilyCart onAddBundle={handleAddBundle} />
                </Suspense>
              </div>
            )}

            {/* Products Grid Section */}
            <section
              id="search-results-section"
              ref={searchResultsRef}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12"
            >
              <div ref={catalogSectionRef} id="catalog-section" />

              <CategoryHeader
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

            <TrustBadges />
            <CustomerReviews />
          </>
        )}
      </main>

      {/* ─── Lazy Loaded Modals ─── */}
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

      {/* Sticky Bottom Cart Bar */}
      <StickyBottomBar
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Footer */}
      <Footer onOpenPage={handleOpenPage} />
    </div>
  );
}