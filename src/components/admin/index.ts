// ============================================================
// src/components/admin/index.ts
// تصدير مركزي لجميع ملفات ومكونات لوحة تحكم وإدارة المدير
// ============================================================
export { AdminOrdersPanel } from './AdminOrdersPanel';
export { AdminErrorBoundary } from './AdminErrorBoundary';
export { AdminNotificationToast } from './AdminNotificationToast';
export {
  PinModal,
  ChangePinModal,
  DeleteReviewModal,
} from './AdminReviewModals';
export { OrderInvoiceModal } from './OrderInvoiceModal';
export { OrderBordereauModal } from './OrderBordereauModal';
export { FinancePanel } from './FinancePanel';
export type {
  FinancePanelProps,
  MonthData,
  MonthResult,
  Assumptions,
} from './FinancePanel';
export { AdminDocumentsModal } from './AdminDocumentsModal';
export type { AdminDocumentsModalProps } from './AdminDocumentsModal';
export { AdminSocialPublisherModal } from './AdminSocialPublisherModal';
export type { AdminSocialPublisherModalProps } from './AdminSocialPublisherModal';
export { AdminMarketingView } from './AdminMarketingView';
export { AdminDeliveryFleetTab } from './AdminDeliveryFleetTab';
export type { AdminDeliveryFleetTabProps } from './AdminDeliveryFleetTab';
export { AdminPageLayout } from './AdminPageLayout';
export type { AdminRoute } from './AdminPageLayout';
export { AdminBottomDashboard } from './AdminBottomDashboard';


