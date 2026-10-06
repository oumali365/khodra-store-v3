// ============================================================
// AdminOrdersPanel.tsx (Re-export Layer)
// يُعيد تصدير المكون المهيكل من features/admin-orders
// ============================================================

export { AdminOrdersPanel } from '../../../features/admin-orders/AdminOrdersPanel';
export type { AdminOrdersPanelProps } from '../../../features/admin-orders/types';
export {
  toWhatsApp,
  timeAgo,
  formatDateTime,
  cleanNote,
  buildOrderText,
  calculateDeliveryCost,
} from '../../../features/admin-orders/utils';
