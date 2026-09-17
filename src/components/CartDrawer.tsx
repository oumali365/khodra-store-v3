// ============================================================
// الملف: CartDrawer.tsx – الإصدار 3.0
// درج السلة – تصميم محسّن، أنيق، ومتناسق مع المتجر
// ============================================================
import React from 'react';
import {
  X, Trash2, ArrowLeft, Sparkles, ShoppingBag, Truck, Package,
  ShieldCheck, Gift, Percent,
} from 'lucide-react';
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

  // ─── عدد المنتجات ───
  const bundleItemsCount = items.filter((i) => !!i.bundleId).length;
  const regularItemsCount = items.length - bundleItemsCount;
  const totalItemsCount = items.reduce((sum, i) => sum + i.qty, 0);

  // ─── مقياس الطراوة ───
  const uniqueProductCount = new Set(items.map((i) => i.id)).size;
  const freshnessScore = Math.min(
    100,
    Math.max(70, Math.round((uniqueProductCount / STORE_CONFIG.freshnessMaxItems) * 100))
  );

  // ─── التوفير المتوقع (اختياري: يمكن حسابه من أسعار أصلية) ───
  const estimatedSavings = isFreeDelivery ? deliveryFee : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="سلة المشتريات"
    >
      {/* ─── الطبقة الخلفية ─── */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* ─── درج السلة ─── */}
      <div className="relative mr-auto w-full max-w-md bg-[#FBF9F5] h-full shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-right duration-300">

        {/* ════════ رأس الدرج ════════ */}
        <div className="relative bg-gradient-to-l from-[#C25E12] via-[#B85507] to-[#9C4505] text-white px-4 py-3.5 shadow-md shrink-0">
          {/* زخرفة خلفية */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />

          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {/* أيقونة السلة */}
              <div className="relative w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-[#F5D76E]" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-[#112616] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-md">
                    {totalItemsCount > 99 ? '99+' : totalItemsCount}
                  </span>
                )}
              </div>

              {/* معلومات السلة */}
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  سلة المشتريات
                </h2>
                <p className="text-[11px] text-amber-100 font-bold truncate">
                  {totalItemsCount} قطعة • {items.length} صنف
                  {bundleItemsCount > 0 && (
                    <span className="mr-1.5 inline-flex items-center gap-0.5 bg-white/20 px-1.5 py-0.5 rounded-md">
                      <Package className="w-2.5 h-2.5" />
                      {bundleItemsCount} صندوق
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex items-center gap-1.5 shrink-0">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all group cursor-pointer touch-manipulation select-none border border-white/20"
                  aria-label="تفريغ السلة"
                  title="تفريغ السلة"
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white/25 hover:bg-white/35 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer touch-manipulation select-none border border-white/20"
                aria-label="إغلاق السلة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ════════ شريط التوصيل المجاني + الطراوة ════════ */}
        {items.length > 0 && (
          <div className="px-3 py-2.5 bg-[#F7F4EC] border-b border-[#E8E1D3] shrink-0 space-y-2">

            {/* شريط التوصيل المجاني */}
            <div className={`relative p-3 rounded-xl border-2 overflow-hidden transition-all ${
              isFreeDelivery
                ? 'bg-gradient-to-l from-emerald-50 to-teal-50 border-emerald-300'
                : 'bg-white border-amber-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-black mb-2">
                <span className="flex items-center gap-1.5">
                  <Truck className={`w-4 h-4 shrink-0 ${isFreeDelivery ? 'text-emerald-600' : 'text-[#C25E12]'}`} />
                  {isFreeDelivery ? (
                    <span className="text-emerald-800">
                      🎉 مبروك! حصلت على <strong>توصيل مجاني</strong>
                    </span>
                  ) : (
                    <span className="text-amber-900">
                      أضف <strong className="text-[#C25E12]">{remainingForFree.toFixed(2)} {STORE_CONFIG.currency}</strong> للتوصيل المجاني
                    </span>
                  )}
                </span>
                <span className={`text-xs font-black tabular-nums px-2 py-0.5 rounded-lg ${
                  isFreeDelivery
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-amber-200 text-amber-900'
                }`}>
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-white/80 h-2.5 rounded-full overflow-hidden border border-[#E8E1D3]">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isFreeDelivery
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      : 'bg-gradient-to-r from-amber-400 via-[#C25E12] to-[#9C4505]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* مقياس الطراوة */}
            <div className="flex items-center justify-between text-xs font-bold bg-white px-3 py-2 rounded-xl border border-[#E8E1D3]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#1E4327]" />
                <span className="text-xs font-black text-[#112616]">طراوة السلة:</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black text-[11px] border border-emerald-300">
                {freshnessScore}% طازج
              </span>
            </div>
          </div>
        )}

        {/* ════════ قائمة المنتجات ════════ */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          {items.length === 0 ? (
            /* ─── حالة فارغة محسّنة ─── */
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#F7F4EC] to-[#EAE2D2] border-2 border-dashed border-[#D4C8B5] flex items-center justify-center text-5xl mb-5">
                🧺
                <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#C25E12] text-white text-sm flex items-center justify-center shadow-md">
                  ✨
                </span>
              </div>
              <h3 className="text-lg font-black text-[#112616] mb-1.5">
                سلتك فارغة
              </h3>
              <p className="text-sm text-[#524B3E] font-medium max-w-xs mb-6 leading-relaxed">
                ابدأ بإضافة الخضار والفواكه الطازجة، أو اختر صندوق عائلة جاهز لتوفير الوقت والمال.
              </p>

              {/* اقتراحات سريعة */}
              <div className="w-full space-y-2 mb-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#163920] to-[#0E2615] text-white font-black text-xs sm:text-sm shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#F5D76E]" />
                  <span>تصفح المنتجات</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs sm:text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Package className="w-4 h-4 text-[#C25E12]" />
                  <span>اكتشف صناديق العائلة</span>
                  <Gift className="w-3.5 h-3.5 text-[#C25E12]" />
                </button>
              </div>

              <p className="text-[11px] text-[#787163] font-medium">
                💡 نصيحة: صناديق العائلة توفر لك حتى 20%
              </p>
            </div>
          ) : (
            <>
              {/* عنوان القائمة */}
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[11px] font-black text-[#787163] uppercase tracking-wider">
                  منتجاتك
                </span>
                <span className="text-[11px] font-bold text-[#787163]">
                  {items.length} عنصر
                </span>
              </div>

              {/* قائمة المنتجات القابلة للسحب */}
              <div className="space-y-2.5">
                {items.map((item) => (
                  <SwipeableCartItem
                    key={item.key}
                    item={item}
                    onUpdateQty={onUpdateQty}
                    onRemoveItem={onRemoveItem}
                  />
                ))}
              </div>

              {/* تلميح السحب */}
              <div className="pt-1 pb-2 text-center">
                <span className="text-[10px] text-[#787163] font-medium inline-flex items-center gap-1">
                  💡 اسحب أي منتج جانباً لحذفه بسرعة
                </span>
              </div>
            </>
          )}
        </div>

        {/* ════════ تذييل الإجمالي وزر الدفع ════════ */}
        {items.length > 0 && (
          <div className="bg-white border-t-2 border-[#E8E1D3] shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">

            {/* ملخص المبالغ */}
            <div className="p-4 space-y-2.5">
              {isFreeDelivery && (
                <div className="pb-2 border-b border-[#F0E9DA]">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-900 bg-emerald-100 px-2 py-1 rounded-md border border-emerald-300">
                    <Percent className="w-3 h-3" />
                    وفّرت {deliveryFee.toFixed(2)} {STORE_CONFIG.currency}
                  </span>
                </div>
              )}

              {/* المجموع الفرعي */}
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-[#524B3E]">المجموع الفرعي:</span>
                <span className="font-black text-[#112616] tabular-nums">
                  {subtotal.toFixed(2)} {STORE_CONFIG.currency}
                </span>
              </div>

              {/* رسوم التوصيل */}
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-[#524B3E]">رسوم التوصيل:</span>
                <span className={`font-black tabular-nums ${
                  isFreeDelivery ? 'text-emerald-700' : 'text-[#112616]'
                }`}>
                  {isFreeDelivery ? '🎉 مجاني' : `${deliveryFee.toFixed(2)} ${STORE_CONFIG.currency}`}
                </span>
              </div>

              {/* المجموع الكلي */}
              <div className="pt-3 border-t-2 border-[#E8E1D3] flex justify-between items-center">
                <span className="flex items-center gap-2 font-black text-[#112616] text-base">
                  <ShoppingBag className="w-4 h-4 text-[#C25E12]" />
                  <span>المجموع الكلي:</span>
                </span>
                <span className="text-xl sm:text-2xl text-[#C25E12] font-black tabular-nums">
                  {grandTotal.toFixed(2)} <span className="text-sm">{STORE_CONFIG.currency}</span>
                </span>
              </div>
            </div>

            {/* زر إتمام الطلب */}
            <div className="px-4 pb-3 space-y-2">
              <button
                type="button"
                onClick={onProceedToCheckout}
                className="w-full min-h-[52px] py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white font-black text-base shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer border-2 border-[#0E2615] touch-manipulation select-none group"
              >
                <ShoppingBag className="w-5 h-5 text-[#F5D76E]" />
                <span>إتمام الطلب</span>
                <ArrowLeft className="w-5 h-5 stroke-[2.5] transition-transform duration-200 group-hover:-translate-x-1" />
              </button>

              {/* ملاحظة أمان */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#787163] font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>بياناتك محمية — يمكنك الدفع عند الاستلام</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};