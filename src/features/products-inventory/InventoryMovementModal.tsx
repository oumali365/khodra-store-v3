// ============================================================
// src/features/products-inventory/InventoryMovementModal.tsx
// نافذة تسجيل حركات المخزون المتقدمة (توريد صباحي، فاقد وتالف، مرتجعات)
// تربط الكميات بتكلفة الشراء الفعلية والموردين لضمان التدقيق المحاسبي
// ============================================================

import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Trash2,
  RotateCcw,
  Package,
  DollarSign,
  AlertTriangle,
  Building2,
  FileText,
  Check,
} from 'lucide-react';
import type { Product } from '../../types';
import { DEFAULT_SUPPLIERS } from '../pricing-forecast/pricingService';
import { calculateEstimatedPurchasePrice } from '../../services/financialEngine';

export type InventoryMovementType = 'morning_stockin' | 'waste_loss' | 'supplier_return';

interface InventoryMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  targetProduct?: Product | null;
  initialType?: InventoryMovementType;
  onSaveMovement: (movement: {
    productId: number;
    movementType: InventoryMovementType;
    quantity: number; // قيمة موجبة
    unitCost?: number;
    supplierId?: string;
    reason: string;
    orderId?: string;
  }) => Promise<{ success: boolean; message?: string }>;
}

export const InventoryMovementModal: React.FC<InventoryMovementModalProps> = ({
  isOpen,
  onClose,
  products,
  targetProduct = null,
  initialType = 'morning_stockin',
  onSaveMovement,
}) => {
  const [movementType, setMovementType] = useState<InventoryMovementType>(initialType);
  const [selectedProductId, setSelectedProductId] = useState<number>(() => {
    return targetProduct ? targetProduct.id : products[0]?.id || 1;
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const defaultCost = selectedProduct
    ? calculateEstimatedPurchasePrice(selectedProduct.price)
    : 5;

  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(defaultCost);
  const [supplierId, setSupplierId] = useState<string>(DEFAULT_SUPPLIERS[0]?.id || 'sup-1');
  const [reason, setReason] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // تحديث التكلفة المقدرة عند تغيير المنتج
  const handleProductSelect = (pid: number) => {
    setSelectedProductId(pid);
    const prod = products.find((p) => p.id === pid);
    if (prod) {
      setUnitCost(calculateEstimatedPurchasePrice(prod.price));
    }
  };

  const currentStock = selectedProduct ? (selectedProduct.stock ?? 0) : 0;
  const unitLabel = selectedProduct?.unit_label || (selectedProduct?.type === 'unit' ? 'حبة' : 'kg');

  // حساب الأثر المالي
  const totalCostValue = Number((quantity * (unitCost || 0)).toFixed(2));
  const newStockPreview =
    movementType === 'waste_loss'
      ? Math.max(0, currentStock - quantity)
      : currentStock + quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (quantity <= 0) {
      setErrorMsg('يرجى إدخال كمية أكبر من صفر.');
      return;
    }

    if (movementType === 'waste_loss' && quantity > currentStock) {
      if (!window.confirm(`الكمية التالفة (${quantity}) تتجاوز المخزون الحالي (${currentStock}). هل ترغب بالاستمرار وتصفير المخزون؟`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await onSaveMovement({
        productId: selectedProductId,
        movementType,
        quantity,
        unitCost: movementType !== 'supplier_return' ? unitCost : undefined,
        supplierId: movementType === 'morning_stockin' ? supplierId : undefined,
        reason: reason.trim() || (
          movementType === 'morning_stockin'
            ? 'توريد صباحي من سوق بنسودة'
            : movementType === 'waste_loss'
            ? 'فاقد وتلف فرز يومي'
            : 'مرتجع سلع من توصيل'
        ),
        orderId: orderId.trim() || undefined,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message || 'فشلت معالجة حركة المخزون');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء حفظ حركة المخزون');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden font-['Tajawal']">
        {/* ═══════ رأس النافذة ═══════ */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-[#163920] to-[#2D6A3F] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EAB308]/20 border border-[#EAB308]/40 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#EAB308]" />
            </div>
            <div>
              <h3 className="text-base font-black">تسجيل حركة مخزون موثقة</h3>
              <p className="text-[11px] text-stone-200">
                ربط تكلفة الشراء بالكميات ومعالجة التالف والمرتجع للتدقيق المحاسبي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ═══════ أزرار نوع الحركة ═══════ */}
        <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setMovementType('morning_stockin')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              movementType === 'morning_stockin'
                ? 'bg-[#163920] text-[#F5D76E] shadow-2xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>📥 توريد صباحي</span>
          </button>

          <button
            type="button"
            onClick={() => setMovementType('waste_loss')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              movementType === 'waste_loss'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>🗑️ فاقد وتالف</span>
          </button>

          <button
            type="button"
            onClick={() => setMovementType('supplier_return')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              movementType === 'supplier_return'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>🔄 مرتجع طلب</span>
          </button>
        </div>

        {/* ═══════ نموذج الإدخال ═══════ */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* اختيار المنتج */}
          <div>
            <label className="font-bold text-stone-600 block mb-1">المنتج المستهدف:</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(Number(e.target.value))}
              className="w-full py-2.5 px-3 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#163920]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name} (المخزون الحالي: {p.stock ?? 0} {p.unit_label || 'kg'})
                </option>
              ))}
            </select>
          </div>

          {/* كمية الحركة وتكلفة الشراء */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-600 block mb-1">
                {movementType === 'morning_stockin'
                  ? `الكمية الواردة (${unitLabel}):`
                  : movementType === 'waste_loss'
                  ? `الكمية التالفة (${unitLabel}):`
                  : `الكمية المرتجعة (${unitLabel}):`}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-white font-mono font-bold text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#163920]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-stone-600 block mb-1">
                سعر تكلفة الشراء للوحدة (د.م):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-white font-mono font-bold text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#163920]"
                required
              />
            </div>
          </div>

          {/* المورد (في حالة التوريد الصباحي) */}
          {movementType === 'morning_stockin' && (
            <div>
              <label className="font-bold text-stone-600 block mb-1">المورد (سوق الجملة بنسودة):</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#163920]"
              >
                {DEFAULT_SUPPLIERS.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} · {sup.specialty}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* رقم الطلب (في حالة المرتجع) */}
          {movementType === 'supplier_return' && (
            <div>
              <label className="font-bold text-stone-600 block mb-1">كود الطلب المرتبط (اختياري):</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="مثلاً: KD-2409-781"
                className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#163920]"
              />
            </div>
          )}

          {/* سبب الحركة / الملاحظات المحاسبية */}
          <div>
            <label className="font-bold text-stone-600 block mb-1">
              {movementType === 'waste_loss' ? 'سبب التلف والفرز:' : 'البيان / ملاحظة الحركة:'}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                movementType === 'waste_loss'
                  ? 'مثلاً: فرز ثانٍ غير صالح، رطوبة، تلف نقل بنسودة'
                  : movementType === 'morning_stockin'
                  ? 'مثلاً: توريد فجر الأربعاء - ضيعات سايس'
                  : 'مثلاً: إلغاء زبون عند باب المنزل'
              }
              className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#163920]"
            />
          </div>

          {/* ═══════ بطاقة الأثر المالي والمخزني ═══════ */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
            <span className="text-[11px] font-black text-stone-700 block">ملخص الأثر المالي والكمي للحركة:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 font-bold block">القيمة المالية للحركة:</span>
                <span className="text-sm font-black font-mono text-stone-900 tabular-nums">
                  {totalCostValue.toFixed(2)} د.م
                </span>
                <span className="text-[9px] text-stone-500 block mt-0.5">
                  ({quantity} {unitLabel} × {unitCost.toFixed(2)} د.م)
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 font-bold block">رصيد المخزون المتوقع:</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs text-stone-400 line-through tabular-nums">{currentStock}</span>
                  <span className="text-sm font-black font-mono text-[#163920] tabular-nums">
                    ← {newStockPreview} {unitLabel}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-emerald-700 block mt-0.5">
                  {newStockPreview > 0 ? 'متوفر بالمخزن' : 'غير متوفر (0)'}
                </span>
              </div>
            </div>
          </div>

          {/* أزرار الحفظ */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-white font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ${
                movementType === 'waste_loss'
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : movementType === 'supplier_return'
                  ? 'bg-amber-700 hover:bg-amber-800'
                  : 'bg-[#163920] hover:bg-[#0E2615] text-[#F5D76E]'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'جارٍ التسجيل...' : 'تأكيد وقيد الحركة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
