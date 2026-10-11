// ============================================================
// src/components/admin/fleet/index.ts
// إعادة توجيه مباشرة إلى الوحدة الأساسية في features/delivery-fleet
// مع التخلص من الطبقات المكررة شبه الفارغة
// ============================================================

export { AdminDeliveryFleetTab } from '../../../features/delivery-fleet';
export type { AdminDeliveryFleetTabProps } from '../../../features/delivery-fleet';
export { TourManifestModal } from '../../../features/delivery-fleet/modals';
export {
  calculateZoneCOD,
  getSortedDriversForZone,
  cleanPhoneForWhatsApp,
  generateGoogleMapsMultiStopUrl,
} from '../../../features/delivery-fleet/utils';
