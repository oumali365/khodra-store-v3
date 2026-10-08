// ============================================================
// src/features/products-inventory/AdminInventoryPanel.tsx
// لوحة إدارة المنتجات والمخزون المتقدمة لمتجر "خُضرة — فاس"
// تتيح التحكم اللحظي بالمخزون، إضافة وتعديل المنتجات، ومنع الترويج عند النفاد
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  Tag,
  DollarSign,
  Layers,
  ChevronDown,
  X,
  Filter,
} from 'lucide-react';
import { Product, ProductCategory } from '../../types';
import {
  fetchProducts,
  saveProductToStore,
  updateProductStockQuick,
  deleteProductFromStore,
} from '../../services/supabaseService';
import { CATEGORIES_CONFIG } from '../../data/mockProducts';

interface AdminInventoryPanelProps {
  standalone?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToAI?: (prompt?: string) => void;
}

export const AdminInventoryPanel: React.FC<AdminInventoryPanelProps> = ({
  standalone = true,
  isOpen = true,
  onClose,
  onNavigateToAI,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // نوافذ التعديل والإضافة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'veg' as ProductCategory,
    type: 'weight' as 'weight' | 'unit',
    price: 0,
    unit_label: 'kg',
    stock: 10,
    min_stock_alert: 5,
    origin: 'فاس والمغرب',
    description: '',
    icon: '🛒',
    image_url: '',
    is_available: true,
    is_featured: false,
    is_seasonal: false,
    is_bestseller: false,
  });

  const [savingId, setSavingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch {
      showToast('error', 'تعذر تحميل المنتجات');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen, loadCatalog]);

  // إحصائيات المخزون
  const inventoryStats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => (p.stock ?? 0) > 5 && p.is_available !== false).length;
    const lowStock = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;
    const outOfStock = products.filter((p) => (p.stock ?? 0) === 0 || p.is_available === false).length;
    const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);

    return { total, inStock, lowStock, outOfStock, totalUnits };
  }, [products]);

  // تصفية المنتجات
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.origin && p.origin.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;

      let matchStock = true;
      if (stockFilter === 'low') {
        matchStock = (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5;
      } else if (stockFilter === 'out') {
        matchStock = (p.stock ?? 0) === 0 || p.is_available === false;
      }

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  // تعديل سريع للكمية
  const handleQuickStockChange = async (productId: number, delta: number) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const newStock = Math.max(0, (target.stock || 0) + delta);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock, is_available: newStock > 0 } : p))
    );

    setSavingId(productId);
    const res = await updateProductStockQuick(productId, newStock);
    setSavingId(null);

    if (res.success) {
      showToast('success', `تم تحديث مخزون ${target.name} إلى ${newStock}`);
    } else {
      showToast('error', res.message || 'فشل تحديث المخزون');
    }
  };

  // فتح نموذج الإضافة
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'veg',
      type: 'weight',
      price: 7,
      unit_label: 'kg',
      stock: 50,
      min_stock_alert: 5,
      origin: 'فاس والمغرب',
      description: '',
      icon: '🛒',
      image_url: '',
      is_available: true,
      is_featured: false,
      is_seasonal: false,
      is_bestseller: false,
    });
    setIsModalOpen(true);
  };

  // فتح نموذج التعديل
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      type: p.type,
      price: p.price,
      unit_label: p.unit_label || (p.type === 'unit' ? 'حبة' : 'kg'),
      stock: p.stock ?? 10,
      min_stock_alert: p.min_stock_alert ?? 5,
      origin: p.origin || 'المغرب',
      description: p.description || '',
      icon: p.icon || '🛒',
      image_url: p.image_url || '',
      is_available: p.is_available !== false,
      is_featured: Boolean(p.is_featured),
      is_seasonal: Boolean(p.is_seasonal),
      is_bestseller: Boolean(p.is_bestseller),
    });
    setIsModalOpen(true);
  };

  // حفظ المنتج
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0) {
      showToast('error', 'يرجى إدخال اسم المنتج وسعر صالح');
      return;
    }

    const payload: Partial<Product> & { name: string; price: number; category: ProductCategory } = {
      id: editingProduct ? editingProduct.id : undefined,
      name: formData.name,
      category: formData.category,
      type: formData.type,
      price: Number(formData.price),
      unit_label: formData.unit_label,
      stock: Number(formData.stock),
      min_stock_alert: Number(formData.min_stock_alert),
      origin: formData.origin,
      description: formData.description,
      icon: formData.icon,
      image_url: formData.image_url,
      is_available: formData.is_available,
      is_featured: formData.is_featured,
      is_seasonal: formData.is_seasonal,
      is_bestseller: formData.is_bestseller,
    };

    const res = await saveProductToStore(payload);
    if (res.success && res.data) {
      showToast('success', res.message || 'تم حفظ المنتج بنجاح');
      setIsModalOpen(false);
      loadCatalog();
    } else {
      showToast('error', res.message || 'فشل حفظ المنتج');
    }
  };

  // تعطيل منتج
  const handleDeleteProduct = async (p: Product) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في إيقاف وتعطيل المنتج "${p.name}"؟`)) {
      return;
    }

    const res = await deleteProductFromStore(p.id);
    if (res.success) {
      showToast('success', res.message || 'تم تعطيل المنتج');
      loadCatalog();
    } else {
      showToast('error', res.message || 'فشل تعطيل المنتج');
    }
  };

  if (!isOpen && !standalone) return null;

  return (
    <div
      className={`space-y-4 sm:space-y-6 text-right font-['Tajawal'] antialiased bg-[#FAFAF9] rounded-3xl ${
        standalone ? 'p-3 sm:p-6 max-w-7xl mx-auto' : 'p-2 sm:p-4'
      }`}
      dir="rtl"
    >
      {/* ═══════ الترويسة الرئيسية ═══════ */}
      <header className="relative overflow-hidden bg-gradient-to-l from-[#163920] via-[#1A4527] to-[#122F1B] rounded-3xl p-5 sm:p-7 text-white shadow-md border border-emerald-900/40">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EAB308]/20 border border-[#EAB308]/40 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-[#EAB308]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">إدارة المنتجات والمخزون</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {products.length} صنف
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-300 mt-1">
                تتبع الكميات الحية، تحديث الأسعار، وتأمين المخزون من النفاد لضمان دقة الحملات التسويقية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#ca9a07] text-[#163920] font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج جديد</span>
            </button>

            <button
              type="button"
              onClick={loadCatalog}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════ إشعار التنبيه ═══════ */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold border shadow-sm flex items-center justify-between gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════ بطاقات مقاييس المخزون ═══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-1">
            <span>إجمالي الأصناف</span>
            <Package className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900">{inventoryStats.total}</div>
          <div className="text-[11px] text-stone-500 mt-1 font-medium">
            مجموع المخزون: {inventoryStats.totalUnits} كجم / وحدة
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
            <span>متوفر بوفرة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{inventoryStats.inStock}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">جاهز للحملات والطلبات الكبرى</div>
        </div>

        <div
          onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          className={`rounded-2xl p-4 border transition-all cursor-pointer ${
            stockFilter === 'low'
              ? 'bg-amber-100 border-amber-400 shadow-sm'
              : 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/60'
          }`}
        >
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold mb-1">
            <span>أوشك على النفاد (1-5)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{inventoryStats.lowStock}</div>
          <div className="text-[11px] text-amber-800 mt-1 font-medium">
            {stockFilter === 'low' ? '✓ تم تطبيق التصفية' : 'اضغط لتصفية المنتجات الحرجة'}
          </div>
        </div>

        <div
          onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
          className={`rounded-2xl p-4 border transition-all cursor-pointer ${
            stockFilter === 'out'
              ? 'bg-rose-100 border-rose-400 shadow-sm'
              : 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/60'
          }`}
        >
          <div className="flex items-center justify-between text-rose-900 text-xs font-bold mb-1">
            <span>نفد / معطّل (0)</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900">{inventoryStats.outOfStock}</div>
          <div className="text-[11px] text-rose-800 mt-1 font-medium">
            {stockFilter === 'out' ? '✓ تم تطبيق التصفية' : 'محظور من الحملات التسويقية'}
          </div>
        </div>
      </div>

      {/* ═══════ تنبيه حماية الذكاء الاصطناعي ═══════ */}
      {inventoryStats.lowStock > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              نظام خُضرة AI يقوم تلقائياً باستبعاد المنتجات منخفضة المخزون ({inventoryStats.lowStock} منتجات) من
              الحملات الترويجية الضخمة لتفادي خيبة أمل الزبائن.
            </span>
          </div>
          {onNavigateToAI && (
            <button
              type="button"
              onClick={() => onNavigateToAI('عطيني المنتجات اللي خاصني نروج ليها اليوم مع المخزون المتوفر')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shrink-0 cursor-pointer transition-colors"
            >
              استشارة خُضرة AI
            </button>
          )}
        </div>
      )}

      {/* ═══════ أدوات التصفية والبحث ═══════ */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو المنشأ (مثلاً: بطاطس، طماطم، الشاوية)..."
              className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'low', 'out'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setStockFilter(mode as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  stockFilter === mode
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {mode === 'all' && 'الكل'}
                {mode === 'low' && 'قارب على النفاد ⚠️'}
                {mode === 'out' && 'غير متوفر ❌'}
              </button>
            ))}
          </div>
        </div>

        {/* أزرار الفئات */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
          {CATEGORIES_CONFIG.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ جدول المنتجات ═══════ */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-black">
              <tr>
                <th className="py-3 px-4">المنتج</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">سعر البيع</th>
                <th className="py-3 px-4">المخزون الحالي</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    لا توجد منتجات مطابقة للبحث أو التصفية الحالية
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const stock = p.stock ?? 0;
                  const isLow = stock > 0 && stock <= 5;
                  const isOut = stock === 0 || p.is_available === false;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 overflow-hidden text-lg">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as any).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span>{p.icon || '🛒'}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-black text-stone-900 flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.is_bestseller && (
                                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md font-bold">
                                  الأكثر طلباً
                                </span>
                              )}
                              {p.is_seasonal && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md font-bold">
                                  موسمي
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5">
                              {p.origin || 'المغرب'} · {p.type === 'unit' ? 'بالحبة' : 'بالكيلوغرام'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-stone-600 font-medium">
                          {CATEGORIES_CONFIG.find((c) => c.id === p.category)?.name || p.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-black text-emerald-800">
                        {p.price.toFixed(2)} د.م
                        <span className="text-[11px] text-stone-400 font-normal mr-1">
                          /{p.unit_label || (p.type === 'unit' ? 'وحدة' : 'kg')}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(p.id, -1)}
                            disabled={stock <= 0 || savingId === p.id}
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold disabled:opacity-30 cursor-pointer"
                          >
                            -
                          </button>
                          <span
                            className={`min-w-10 text-center font-black text-sm px-2 py-0.5 rounded-lg ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            {stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(p.id, 5)}
                            disabled={savingId === p.id}
                            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold cursor-pointer"
                            title="إضافة 5 وحدات"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            نفد المخزون
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            قارب على النفاد
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            متوفر
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
                            title="تعديل التفاصيل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            title="تعطيل المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════ نافذة إضافة / تعديل منتج ═══════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-stone-900">
                  {editingProduct ? `تعديل منتج: ${editingProduct.name}` : 'إضافة منتج جديد للمتجر'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">اسم المنتج *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: بطاطس بلدية، طماطم..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">التصنيف *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none bg-white"
                  >
                    {CATEGORIES_CONFIG.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">سعر البيع (DH) *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">المخزون الحالي *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">نوع البيع</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as any,
                        unit_label: e.target.value === 'unit' ? 'حبة' : 'kg',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none bg-white"
                  >
                    <option value="weight">وزن (كغم)</option>
                    <option value="unit">وحدة / حبة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">المنشأ / المنطقة</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="مثال: الشاوية، سايس، الغرب..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">رابط الصورة (Image URL)</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="/images/products/vegetables/potato.webp"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">الوصف التسويقي للمنتج</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مميزات الطراوة واستخدامات الطبخ..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* شارات وخيارات التسويق */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-stone-100 text-xs font-bold text-stone-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>متاح للبيع في المتجر</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_bestseller}
                    onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>الأكثر مبيعاً ⭐</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_seasonal}
                    onChange={(e) => setFormData({ ...formData, is_seasonal: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>منتج موسمي 🌿</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
