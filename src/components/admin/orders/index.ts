// ============================================================
// src/components/admin/orders/index.ts
// إعادة توجيه إلى الوحدة الأساسية في features/admin-orders
// مع التخلص من الطبقة المكررة شبه الفارغة
// ============================================================

export { AdminOrdersPanel } from '../../../features/admin-orders';
export type { AdminOrdersPanelProps } from '../../../features/admin-orders';
export { OrderInvoiceModal, OrderBordereauModal } from '../../../features/admin-orders/modals';
export {
  toWhatsApp,
  timeAgo,
  formatDateTime,
  cleanNote,
  buildOrderText,
  calculateDeliveryCost,
} from '../../../features/admin-orders/utils';
