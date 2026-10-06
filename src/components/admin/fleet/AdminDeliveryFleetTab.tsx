// ============================================================
// AdminDeliveryFleetTab.tsx (Re-export Layer)
// يُعيد تصدير المكون المهيكل من features/delivery-fleet
// ============================================================

export { AdminDeliveryFleetTab } from '../../../features/delivery-fleet/AdminDeliveryFleetTab';
export type { AdminDeliveryFleetTabProps } from '../../../features/delivery-fleet/types';
export {
  calculateZoneCOD,
  getSortedDriversForZone,
  cleanPhoneForWhatsApp,
  generateGoogleMapsMultiStopUrl,
} from '../../../features/delivery-fleet/utils';
