// ============================================================
// components.tsx - فروع الطلبات الثلاثة وشريط الانتقالات وتعيين السائق
// ============================================================

import React, { useState } from 'react';
import { Package, Clock, CheckCircle2, Archive, Inbox, ChevronDown, ChevronUp, Save } from 'lucide-react';
import type { DbOrder, OrderStatus, DeliveryDispatchInfo, StoreDriver } from './types';
import { BRANCH_STYLES } from './constants';
import { OrderCard } from './cards';

/**
 * شريط تغيير حالة الطلب السريع
 */
export interface StatusTransitionBarProps {
  status: OrderStatus;
  isUpdatingStatus?: boolean;
  onStatusChange: (status: OrderStatus) => void;
}

export const StatusTransitionBar: React.FC<StatusTransitionBarProps> = ({
  status,
  isUpdatingStatus,
  onStatusChange,
}) => {
  return (
    <div className="pt-2 border-t border-stone-200">
      <div className="flex items-center gap-1.5 text-xs">
        {status !== 'pending' && (
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => onStatusChange('pending')}
            className="flex-1 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold transition-colors cursor-pointer text-center text-[11px]"
          >
            قيد المراجعة
          </button>
        )}
        {status !== 'prepared' && (
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => onStatusChange('prepared')}
            className="flex-1 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-colors cursor-pointer text-center text-[11px]"
          >
            جاهز للتوصيل 🛵
          </button>
        )}
        {status !== 'delivered' && (
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
  );
};

/**
 * بطاقة تعيين السائق وتفاصيل التوصيل (الأكورديون)
 */
export interface DriverAssignmentCardProps {
  draft?: DeliveryDispatchInfo;
  onUpdateDraft?: (updates: Partial<DeliveryDispatchInfo>) => void;
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
  storeDrivers?: StoreDriver[];
}

export const DriverAssignmentCard: React.FC<DriverAssignmentCardProps> = ({
  draft,
  onUpdateDraft,
  onSaveDraft,
  isSavingDraft,
  storeDrivers = [],
}) => {
  const [showDriverAccordion, setShowDriverAccordion] = useState(false);

  return (
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
  );
};

export interface BranchColumnProps {
  orders: DbOrder[];
  dispatchDrafts?: Record<string, DeliveryDispatchInfo>;
  onUpdateDraft?: (orderId: string | number, updates: Partial<DeliveryDispatchInfo>) => void;
  onSaveDraft?: (order: DbOrder) => void;
  savingDispatchId?: string | number | null;
  storeDrivers?: StoreDriver[];
  onStatusChange: (orderId: string | number, status: OrderStatus) => void;
  updatingId?: string | number | null;
  onTogglePayment?: (orderId: string | number, currentPaid: boolean) => void;
  onToggleArchive?: (orderId: string | number, currentArchived: boolean) => void;
  onOpenInvoice: (order: DbOrder) => void;
  onOpenBordereau: (order: DbOrder) => void;
  onConfirmDelete: (order: DbOrder) => void;
  onCopyOrderText: (order: DbOrder) => void;
  copiedId?: string | number | null;
}

export const PendingBranch: React.FC<BranchColumnProps> = ({
  orders,
  onStatusChange,
  updatingId,
  onOpenInvoice,
  onOpenBordereau,
  onConfirmDelete,
  onCopyOrderText,
  copiedId,
}) => {
  const styles = BRANCH_STYLES.pending;
  return (
    <div className={`border-2 ${styles.border} ${styles.bg} rounded-2xl p-4 flex flex-col justify-between shadow-xs space-y-4`}>
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${styles.iconColor}`} />
            <h3 className="font-black text-sm text-stone-900">{styles.title}</h3>
          </div>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${styles.badge}`}>{orders.length}</span>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500 bg-white/80 rounded-xl mt-3 border border-dashed border-stone-200">
            <Inbox className="w-6 h-6 mx-auto mb-1 text-stone-400" />
            <p className="font-bold text-stone-700">لا توجد طلبات جديدة حالياً</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                currentBranch="pending"
                onStatusChange={(status) => onStatusChange(order.id, status)}
                isUpdatingStatus={updatingId === order.id}
                onOpenInvoice={() => onOpenInvoice(order)}
                onOpenBordereau={() => onOpenBordereau(order)}
                onConfirmDelete={() => onConfirmDelete(order)}
                onCopyOrderText={() => onCopyOrderText(order)}
                copied={copiedId === order.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const PreparedBranch: React.FC<BranchColumnProps> = ({
  orders,
  dispatchDrafts = {},
  onUpdateDraft,
  onSaveDraft,
  savingDispatchId,
  storeDrivers = [],
  onStatusChange,
  updatingId,
  onOpenInvoice,
  onOpenBordereau,
  onConfirmDelete,
  onCopyOrderText,
  copiedId,
}) => {
  const styles = BRANCH_STYLES.prepared;
  return (
    <div className={`border-2 ${styles.border} ${styles.bg} rounded-2xl p-4 flex flex-col justify-between shadow-xs space-y-4`}>
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Package className={`w-5 h-5 ${styles.iconColor}`} />
            <h3 className="font-black text-sm text-stone-900">{styles.title}</h3>
          </div>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${styles.badge}`}>{orders.length}</span>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500 bg-white/80 rounded-xl mt-3 border border-dashed border-stone-200">
            <Inbox className="w-6 h-6 mx-auto mb-1 text-stone-400" />
            <p className="font-bold text-stone-700">لا توجد طلبات قيد التجهيز</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                currentBranch="prepared"
                draft={dispatchDrafts[String(order.id)]}
                onUpdateDraft={(updates) => onUpdateDraft?.(order.id, updates)}
                onSaveDraft={() => onSaveDraft?.(order)}
                isSavingDraft={savingDispatchId === order.id}
                storeDrivers={storeDrivers}
                onStatusChange={(status) => onStatusChange(order.id, status)}
                isUpdatingStatus={updatingId === order.id}
                onOpenInvoice={() => onOpenInvoice(order)}
                onOpenBordereau={() => onOpenBordereau(order)}
                onConfirmDelete={() => onConfirmDelete(order)}
                onCopyOrderText={() => onCopyOrderText(order)}
                copied={copiedId === order.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export interface DeliveredBranchProps extends BranchColumnProps {
  showArchived: boolean;
  onToggleShowArchived: () => void;
  archivedCount: number;
}

export const DeliveredBranch: React.FC<DeliveredBranchProps> = ({
  orders,
  showArchived,
  onToggleShowArchived,
  archivedCount,
  onStatusChange,
  updatingId,
  onTogglePayment,
  onToggleArchive,
  onOpenInvoice,
  onOpenBordereau,
  onConfirmDelete,
  onCopyOrderText,
  copiedId,
}) => {
  const styles = BRANCH_STYLES.delivered;
  return (
    <div className={`border-2 ${styles.border} ${styles.bg} rounded-2xl p-4 flex flex-col justify-between shadow-xs space-y-4`}>
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-5 h-5 ${styles.iconColor}`} />
            <h3 className="font-black text-sm text-stone-900">{styles.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleShowArchived}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                showArchived
                  ? 'bg-stone-800 text-white border-stone-900'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
              }`}
            >
              <Archive className="w-3 h-3" />
              <span>الأرشيف ({archivedCount})</span>
            </button>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${styles.badge}`}>{orders.length}</span>
          </div>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500 bg-white/80 rounded-xl mt-3 border border-dashed border-stone-200">
            <Inbox className="w-6 h-6 mx-auto mb-1 text-stone-400" />
            <p className="font-bold text-stone-700">لا توجد طلبات مسلّمة في العرض الحالي</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                currentBranch="delivered"
                onStatusChange={(status) => onStatusChange(order.id, status)}
                isUpdatingStatus={updatingId === order.id}
                onTogglePayment={() => onTogglePayment?.(order.id, Boolean(order.is_paid))}
                onToggleArchive={() => onToggleArchive?.(order.id, Boolean(order.is_archived))}
                onOpenInvoice={() => onOpenInvoice(order)}
                onOpenBordereau={() => onOpenBordereau(order)}
                onConfirmDelete={() => onConfirmDelete(order)}
                onCopyOrderText={() => onCopyOrderText(order)}
                copied={copiedId === order.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
