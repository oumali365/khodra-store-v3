// ============================================================
// الملف: CartDrawer.tsx – متوافق ومحسّن مع متجر "خُضرة"
// الإصدار: 2.0 (يدعم صور المنتجات + شارات الصناديق)
// ============================================================
import React from 'react';
import { AnimatePresence } from 'motion/react';
import { X, Trash2, ArrowLeft, Sparkles, ShoppingBag, Truck, Package } from 'lucide-react';
import { CartItem } from '../types';
import { STORE_CONFIG } from '../data/config';
import { SwipeableCartItem } from './SwipeableCartItem';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  // ─── الحسابات المالية ───
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const isFreeDelivery = subtotal >= STORE_CONFIG.freeDeliveryThreshold;
  const remainingForFree = Math.max(0, STORE_CONFIG.freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(
    100,
    Math.round((subtotal / STORE_CONFIG.freeDeliveryThreshold) * 100)
  );
  const deliveryFee =
    items.length === 0 ? 0 : isFreeDelivery ? 0 : STORE_CONFIG.standardDeliveryFee;
  const grandTotal = subtotal + deliveryFee;

  // ─── عدد المنتجات من صناديق العائلة ───
  const bundleItemsCount = items.filter((i) => !!i.bundleId).length;
  const totalItemsCount = items.reduce((sum, i) => sum + i.qty, 0);

  // ─── مقياس الطراوة (محسّن: يعتمد على التنوع) ───
  const uniqueProductCount = new Set(items.map((i) => i.id)).size;
  const freshnessScore = Math.min(
    100,
    Math.max(70, Math.round((uniqueProductCount / STORE_CONFIG.freshnessMaxItems) * 100))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="سلة المشتريات"
    >
      {/* الطبقة الخلفية الشفافة */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* درج السلة */}
      <div className="relative mr-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-right duration-300">

        {/* ─── رأس الدرج ─── */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#C25E12] to-[#9C4505] text-white flex items-center justify-between shadow-md sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden="true">🧺</span>
            <div>
              <h2 className="text-lg font-black tracking-tight">سلة المشتريات</h2>
              <p className="text-xs text-amber-100 font-bold">
                {totalItemsCount} قطعة • {items.length} صنف
                {bundleItemsCount > 0 && (
                  <span className="mr-1.5 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                    <Package className="w-3 h-3" />
                    {bundleItemsCount} صندوق
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all group cursor-pointer touch-manipulation select-none"
                aria-label="تفريغ السلة"
                title="تفريغ السلة"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white/20 hover:bg-white/30 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer touch-manipulation select-none"
              aria-label="إغلاق السلة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── شريط التوصيل المجاني ومؤشر الطراوة ─── */}
        {items.length > 0 && (
          <div className="p-3 bg-[#F7F4EC] border-b border-[#D4C8B5] sticky top-[73px] z-10 space-y-2">
            {/* شريط التوصيل المجاني */}
            <div className="bg-white p-2.5 rounded-xl border border-[#D4C8B5] shadow-xs">
              <div className="flex items-center justify-between text-xs font-black text-[#112616] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#C25E12]" />
                  {isFreeDelivery ? (
                    <span className="text-emerald-700 font-black">
                      مبروك! حصلت على توصيل مجاني 🎉
                    </span>
                  ) : (
                    <span>
                      أضف{' '}
                      <strong className="text-[#C25E12]">
                        {remainingForFree.toFixed(2)} {STORE_CONFIG.currency}
                      </strong>{' '}
                      للحصول على توصيل مجاني
                    </span>
                  )}
                </span>
                <span className="text-xs text-[#2D271E] font-black">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#EAE2D2] h-2.5 rounded-full overflow-hidden border border-[#D4C8B5]">
                <div
                  className="h-full bg-gradient-to-r from-[#C25E12] to-[#1E4327] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* مؤشر الطراوة */}
            <div className="flex items-center justify-between text-xs font-bold text-[#2D271E] bg-white p-2 rounded-xl border border-[#D4C8B5]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#1E4327]" />
                <span className="text-xs font-black text-[#112616]">مقياس طراوة السلة:</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#112616] font-black text-xs border border-emerald-300">
                {freshnessScore}% طازج وطبيعي
              </span>
            </div>
          </div>
        )}

        {/* ─── قائمة المنتجات ─── */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
              <div className="w-20 h-20 rounded-full bg-[#F7F4EC] border-2 border-dashed border-[#D4C8B5] flex items-center justify-center text-4xl mb-4 animate-bounce">
                🧺
              </div>
              <h3 className="text-lg font-black text-[#112616] mb-1.5">السلة فارغة</h3>
              <p className="text-sm text-[#2D271E] font-medium max-w-xs mb-6 leading-relaxed">
                أضف بعض الخضروات والفواكه الطازجة إلى سلتك لتوصيلها لباب دارك.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#1E4327] text-white font-black text-sm shadow-sm hover:bg-[#112616] transition-colors cursor-pointer"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {items.map((item) => (
                <SwipeableCartItem
                  key={item.key}
                  item={item}
                  onUpdateQty={onUpdateQty}
                  onRemoveItem={onRemoveItem}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* ─── تذييل الإجمالي وزر الدفع ─── */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-[#F7F4EC] border-t border-[#D4C8B5] space-y-3 sticky bottom-0 z-10">
            {/* ملخص المبالغ */}
            <div className="space-y-2 text-sm text-[#2D271E] font-medium">
              <div className="flex justify-between">
                <span className="font-bold">المجموع الفرعي:</span>
                <span className="font-black text-[#112616]">
                  {subtotal.toFixed(2)} {STORE_CONFIG.currency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">رسوم التوصيل:</span>
                <span
                  className={`font-black ${
                    isFreeDelivery ? 'text-emerald-700' : 'text-[#112616]'
                  }`}
                >
                  {isFreeDelivery
                    ? 'مجاني 🎉'
                    : `${deliveryFee.toFixed(2)} ${STORE_CONFIG.currency}`}
                </span>
              </div>
              <div className="pt-2 border-t border-[#D4C8B5] flex justify-between items-center text-sm sm:text-base font-black text-[#112616]">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#C25E12]" />
                  <span>المجموع الكلي:</span>
                </span>
                <span className="text-lg sm:text-xl text-[#C25E12] font-black">
                  {grandTotal.toFixed(2)} {STORE_CONFIG.currency}
                </span>
              </div>
            </div>

            {/* ─── زر إتمام الطلب ─── */}
            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-[#1E4327] to-[#112616] text-white font-black text-base shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#1E4327] touch-manipulation select-none"
            >
              <span>إتمام الطلب</span>
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* ملاحظة أمان */}
            <p className="text-[10px] text-center text-[#787163] font-medium">
              🔒 جميع البيانات محمية — يمكنك الدفع عند الاستلام
            </p>
          </div>
        )}

      </div>
    </div>
  );
};