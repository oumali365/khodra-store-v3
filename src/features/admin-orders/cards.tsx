// ============================================================
// cards.tsx - بطاقة الطلب الموحدة وترويستها
// ============================================================

import React, { useState } from 'react';
import {
  Phone,
  MapPin,
  MessageCircle,
  FileText,
  Printer,
  Copy,
  Trash2,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Coins,
  Archive,
  Star,
  Send,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  Bike,
} from 'lucide-react';
import type { DbOrder, OrderStatus, DeliveryDispatchInfo, StoreDriver } from './types';
import { STATUS_LABELS } from './constants';
import { FEZ_DELIVERY_ZONES } from '../../data/deliveryZones';
import {
  toWhatsApp,
  timeAgo,
  formatDateTime,
  cleanNote,
  buildCustomerThankAndConfirmMessage,
  buildStoreTeamDriverMessage,
  buildInDriveDriverMessage,
  buildCustomerReviewMessage,
} from './utils';

export interface OrderCardHeaderProps {
  order: DbOrder;
}

/**
 * ترويسة بطاقة الطلب: الرمز، العميل، التوقيت، المنطقة، الشارة، والمجموع
 */
export const OrderCardHeader: React.FC<OrderCardHeaderProps> = ({ order }) => {
  const statusConfig = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
  const zoneInfo = order.delivery_zone ? FEZ_DELIVERY_ZONES[order.delivery_zone] : null;

  return (
    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-sm text-stone-900 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-300">
            {order.order_code}
          </span>
          <h4 className="font-bold text-sm text-stone-900 truncate max-w-[140px]">
            {order.customer_name}
          </h4>
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(order.created_at)}</span>
          </span>
          {zoneInfo && (
            <span className="font-semibold text-stone-600">
              • {zoneInfo.name}
            </span>
          )}
        </div>
      </div>

      <div className="text-left">
        <div className="text-sm font-black text-emerald-800 tabular-nums">
          {order.total.toFixed(2)} د.م
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border mt-1 ${statusConfig.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          <span>{statusConfig.label}</span>
        </span>
      </div>
    </div>
  );
};

export interface OrderCardProps {
  order: DbOrder;
  currentBranch: 'pending' | 'prepared' | 'delivered';
  draft?: DeliveryDispatchInfo;
  onUpdateDraft?: (updates: Partial<DeliveryDispatchInfo>) => void;
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
  storeDrivers?: StoreDriver[];
  onStatusChange: (status: OrderStatus) => void;
  isUpdatingStatus?: boolean;
  onTogglePayment?: () => void;
  onToggleArchive?: () => void;
  onOpenInvoice: () => void;
  onOpenBordereau: () => void;
  onConfirmDelete: () => void;
  onCopyOrderText: () => void;
  copied?: boolean;
}

/**
 * بطاقة الطلب الموحدة لجميع الفروع
 */
export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  currentBranch,
  draft,
  onUpdateDraft,
  onSaveDraft,
  isSavingDraft,
  storeDrivers = [],
  onStatusChange,
  isUpdatingStatus,
  onTogglePayment,
  onToggleArchive,
  onOpenInvoice,
  onOpenBordereau,
  onConfirmDelete,
  onCopyOrderText,
  copied,
}) => {
  const [showItems, setShowItems] = useState(false);
  const [showDriverAccordion, setShowDriverAccordion] = useState(false);
  const cleanN = cleanNote(order.note || '');
  const cleanPhone = toWhatsApp(order.phone);

  return (
    <div className="bg-white border-2 border-stone-200 hover:border-stone-300 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all space-y-3 text-right">
      {/* 1. معلومات الطلب (Order Info) */}
      <OrderCardHeader order={order} />

      {/* 2. الاتصال (Contact) */}
      <div className="text-xs space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-stone-700">
        <div className="flex items-center justify-between">
          <span className="text-stone-500 text-[11px]">الهاتف:</span>
          <span className="font-mono font-bold text-stone-900" dir="ltr">
            {order.phone}
          </span>
        </div>

        <div className="flex items-start justify-between">
          <span className="text-stone-500 text-[11px] shrink-0">العنوان:</span>
          <div className="text-left font-medium text-stone-800 pr-1 flex items-center gap-1">
            <span className="line-clamp-1">{order.address}</span>
            {order.maps_link && (
              <a
                href={order.maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 shrink-0"
                title="موقع GPS"
              >
                <MapPin className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {cleanN && (
          <div className="text-[11px] text-stone-600 italic pt-1 border-t border-stone-200">
            ملاحظة: {cleanN}
          </div>
        )}
      </div>

      {/* 3. المنتجات (Products) */}
      <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setShowItems((prev) => !prev)}
          className="w-full p-2 bg-stone-100/80 hover:bg-stone-200/80 flex items-center justify-between font-bold text-stone-800 transition-colors cursor-pointer"
        >
          <span>
            المنتجات ({order.items.length}) • المجموع {order.subtotal.toFixed(2)} د.م
          </span>
          {showItems ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showItems && (
          <div className="p-2.5 bg-white divide-y divide-stone-100 max-h-48 overflow-y-auto space-y-1">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center py-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span>{it.icon || '🛒'}</span>
                  <span className="font-bold text-stone-900">{it.name}</span>
                  <span className="text-stone-500">
                    × {it.qty} {it.variantLabel || ''}
                  </span>
                </div>
                <span className="font-bold text-stone-800 tabular-nums">
                  {it.lineTotal.toFixed(2)} د.م
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. بيانات السائق (Driver Data) */}
      {currentBranch === 'prepared' && (
        <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowDriverAccordion((prev) => !prev)}
            className="w-full p-2 bg-stone-50 hover:bg-stone-100 flex items-center justify-between font-bold text-stone-700 transition-colors cursor-pointer"
          >
            <span>بيانات السائق وأجرة التوصيل</span>
            {showDriverAccordion ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDriverAccordion && draft && onUpdateDraft && (
            <div className="p-3 bg-white space-y-2 border-t border-stone-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">اسم السائق:</label>
                  <input
                    type="text"
                    value={draft.driverName || ''}
                    onChange={(e) => onUpdateDraft({ driverName: e.target.value })}
                    placeholder="كابتن خُضرة"
                    className="w-full p-1.5 rounded border border-stone-300 text-stone-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">أجرة التوصيل (د.م):</label>
                  <input
                    type="number"
                    value={draft.deliveryCost || 20}
                    onChange={(e) => onUpdateDraft({ deliveryCost: Number(e.target.value) || 20 })}
                    className="w-full p-1.5 rounded border border-stone-300 text-stone-800 text-xs tabular-nums"
                  />
                </div>
              </div>

              {storeDrivers.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">أو اختر من سائقي الفريق:</label>
                  <select
                    onChange={(e) => {
                      const d = storeDrivers.find((drv) => drv.id === e.target.value);
                      if (d) {
                        onUpdateDraft({
                          driverName: d.name,
                          driverPhone: d.phone,
                          deliveryCost: d.commissionPerOrder || 20,
                        });
                      }
                    }}
                    className="w-full p-1.5 rounded border border-stone-300 text-stone-800 text-xs bg-white"
                  >
                    <option value="">-- سائقو الفريق الداخلي --</option>
                    {storeDrivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} ({drv.commissionPerOrder} د.م)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {onSaveDraft && (
                <button
                  type="button"
                  disabled={isSavingDraft}
                  onClick={onSaveDraft}
                  className="w-full py-1.5 rounded bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingDraft ? 'جاري الحفظ...' : 'حفظ بيانات التوصيل'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. استدعاء السائق (Driver Dispatch / Call) */}
      <div className="space-y-1.5">
        {currentBranch === 'pending' && (
          <a
            href={
              cleanPhone
                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    buildCustomerThankAndConfirmMessage(order)
                  )}`
                : '#'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            title="إرسال شكر وتأكيد الاستلام للزبون"
          >
            <Send className="w-3.5 h-3.5" />
            <span>واتساب: تأكيد واستلام الطلب للزبون</span>
          </a>
        )}

        {currentBranch === 'prepared' && (
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                buildStoreTeamDriverMessage(order, draft)
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-xs"
              title="استدعاء سائق فريق خُضرة الداخلي"
            >
              <Bike className="w-3.5 h-3.5" />
              <span>استدعاء كابتن المتجر</span>
            </a>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                buildInDriveDriverMessage(order, draft)
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-xs"
              title="استدعاء سائق خارجي"
            >
              <Send className="w-3.5 h-3.5" />
              <span>استدعاء سائق خارجي</span>
            </a>
          </div>
        )}

        {currentBranch === 'delivered' && (
          <a
            href={
              cleanPhone
                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    buildCustomerReviewMessage(order)
                  )}`
                : '#'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            title="طلب تقييم الخدمة من الزبون بعد التسليم"
          >
            <Star className="w-3.5 h-3.5 text-amber-300" />
            <span>واتساب: طلب تقييم الخدمة من العميل</span>
          </a>
        )}
      </div>

      {/* 6. حالة الطلب (Order Status) */}
      <div className="pt-2 border-t border-stone-200">
        <div className="flex items-center gap-1.5 text-xs">
          {order.status !== 'pending' && (
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => onStatusChange('pending')}
              className="flex-1 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold transition-colors cursor-pointer text-center text-[11px]"
            >
              قيد المراجعة
            </button>
          )}

          {order.status !== 'prepared' && (
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => onStatusChange('prepared')}
              className="flex-1 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-colors cursor-pointer text-center text-[11px]"
            >
              جاهز للتوصيل 🛵
            </button>
          )}

          {order.status !== 'delivered' && (
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => onStatusChange('delivered')}
              className="flex-1 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-colors cursor-pointer text-center text-[11px]"
            >
              تم التسليم ✅
            </button>
          )}
        </div>
      </div>

      {/* 7. أزرار التحكم والعمليات (Control Buttons) */}
      {currentBranch === 'delivered' && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200 text-xs">
          <button
            type="button"
            onClick={onTogglePayment}
            className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 border transition-colors cursor-pointer text-[11px] ${
              order.is_paid
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{order.is_paid ? 'تم استلام المبلغ ✅' : 'تأكيد قبض المبلغ 💵'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleArchive}
            className={`py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1 border transition-colors cursor-pointer text-[11px] ${
              order.is_archived
                ? 'bg-stone-200 text-stone-800 border-stone-300'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
            }`}
            title="نقل أو استعادة من الأرشيف"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{order.is_archived ? 'في الأرشيف' : 'أرشفة'}</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-1 pt-2 border-t border-stone-200">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenInvoice}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="عرض وطباعة الفاتورة"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">فاتورة</span>
          </button>

          <button
            type="button"
            onClick={onOpenBordereau}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="ملصق الشحن وبوليصة التوصيل"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">بوليصة</span>
          </button>

          <button
            type="button"
            onClick={onCopyOrderText}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="نسخ تفاصيل الطلب"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          type="button"
          onClick={onConfirmDelete}
          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="حذف الطلب"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
