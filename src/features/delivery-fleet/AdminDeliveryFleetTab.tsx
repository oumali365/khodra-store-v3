// ============================================================
// AdminDeliveryFleetTab.tsx - منسّق أسطول التوصيل والجولات الذكية (< 250 سطر)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import type {
  AdminDeliveryFleetTabProps,
  FezZoneId,
  StoreDriver,
  FastAppCourier,
  DbOrder,
  DriverFormData,
  FastCourierFormData,
} from './types';
import { useDrivers, useFastCouriers, useZoneGroups, useFleetStats } from './hooks';
import {
  FleetKPIs,
  ZoneGrid,
  InternalDriversGrid,
  FastCouriersGrid,
  ProviderCards,
} from './components';
import { FleetModals } from './modals';
import {
  closeAndDeliverZoneTour,
  fetchOrders,
  subscribeToOrdersChanges,
  unsubscribeFromOrdersChanges,
} from '../../services/supabaseService';
import {
  cleanPhoneForWhatsApp,
  buildDriverWhatsAppMessage,
  generateGoogleMapsMultiStopUrl,
} from './utils';
import { FEZ_DELIVERY_ZONES } from '../../data/deliveryZones';

export const AdminDeliveryFleetTab: React.FC<AdminDeliveryFleetTabProps> = ({
  orders,
  showToast,
  onRefreshOrders,
}) => {
  const [internalOrders, setInternalOrders] = useState<DbOrder[]>([]);
  const effectiveOrders = orders && orders.length > 0 ? orders : internalOrders;

  const triggerToast = useCallback(
    (type: 'success' | 'error', message: string) => showToast?.(type, message),
    [showToast]
  );

  useEffect(() => {
    if (orders && orders.length > 0) return;
    let mounted = true;
    fetchOrders().then((d) => mounted && setInternalOrders(d)).catch(() => {});
    const ch = subscribeToOrdersChanges(() => {
      fetchOrders().then((d) => mounted && setInternalOrders(d)).catch(() => {});
    });
    return () => {
      mounted = false;
      if (ch) unsubscribeFromOrdersChanges(ch);
    };
  }, [orders]);

  const {
    drivers,
    isLoading: isDriversLoading,
    isSynced: isDriversSynced,
    isSyncing,
    addDriver,
    updateDriver,
    deleteDriver,
    toggleStatus,
    syncDrivers,
  } = useDrivers();

  const {
    couriers,
    isLoading: isCouriersLoading,
    addCourier,
    updateCourier,
    deleteCourier,
  } = useFastCouriers();

  const zoneGroups = useZoneGroups(effectiveOrders);
  const fleetStats = useFleetStats(effectiveOrders);

  const [selectedDriverForZone, setSelectedDriverForZone] = useState<Record<FezZoneId, string>>({
    east: '', central: '', south: '', north: '',
  });

  const [codZone, setCodZone] = useState<FezZoneId | null>(null);
  const [copyZone, setCopyZone] = useState<FezZoneId | null>(null);
  const [closeZone, setCloseZone] = useState<FezZoneId | null>(null);
  const [manifestZone, setManifestZone] = useState<FezZoneId | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [isClosingTour, setIsClosingTour] = useState(false);

  const [driverModal, setDriverModal] = useState<{
    isOpen: boolean; variant: 'internal' | 'fast'; data: StoreDriver | FastAppCourier | null;
  }>({ isOpen: false, variant: 'internal', data: null });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean; type: 'driver' | 'courier' | 'tour'; target: StoreDriver | FastAppCourier | null;
  }>({ isOpen: false, type: 'driver', target: null });

  const handleSendWhatsApp = (zoneKey: FezZoneId) => {
    const driver = drivers.find((d) => d.id === selectedDriverForZone[zoneKey]);
    const zOrders = zoneGroups[zoneKey];
    if (zOrders.length === 0) return triggerToast('error', 'لا توجد طلبات في هذه المنطقة');
    const msg = buildDriverWhatsAppMessage(zoneKey, zOrders, driver, FEZ_DELIVERY_ZONES[zoneKey]);
    const phone = driver ? cleanPhoneForWhatsApp(driver.phone) : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    triggerToast('success', `تم فتح واتساب لإرسال الجولة إلى ${driver?.name || 'السائق'}`);
  };

  const handleOpenGoogleMaps = (zoneKey: FezZoneId) => {
    const zOrders = zoneGroups[zoneKey];
    if (zOrders.length === 0) return triggerToast('error', 'لا توجد طلبات لتوليد المسار');
    window.open(generateGoogleMapsMultiStopUrl(zOrders), '_blank');
    triggerToast('success', `تم فتح مسار خرائط Google (${zOrders.length} محطات)`);
  };

  const handleConfirmCloseTour = async () => {
    if (!closeZone) return;
    const zOrders = zoneGroups[closeZone];
    const driver = drivers.find((d) => d.id === selectedDriverForZone[closeZone]) || null;
    setIsClosingTour(true);
    try {
      const res = await closeAndDeliverZoneTour({ orders: zOrders, driver, zoneKey: closeZone });
      triggerToast(res.success ? 'success' : 'error', res.message || 'تم إغلاق الجولة');
      if (res.success) onRefreshOrders?.();
    } finally {
      setIsClosingTour(false);
      setCloseZone(null);
    }
  };

  const handleCopy = async (text: string, templateKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTemplate(templateKey);
      triggerToast('success', 'تم النسخ بنجاح');
      setTimeout(() => setCopiedTemplate(null), 2500);
    } catch {
      triggerToast('error', 'تعذر النسخ');
    }
  };

  const handleDriverSubmit = async (data: DriverFormData | FastCourierFormData) => {
    if (driverModal.variant === 'internal') {
      if (driverModal.data) {
        await updateDriver((driverModal.data as StoreDriver).id, data as Partial<StoreDriver>);
        triggerToast('success', 'تم تعديل بيانات السائق بنجاح');
      } else {
        await addDriver(data as DriverFormData);
        triggerToast('success', 'تمت إضافة السائق بنجاح');
      }
    } else {
      if (driverModal.data) {
        await updateCourier((driverModal.data as FastAppCourier).id, data as Partial<FastAppCourier>);
        triggerToast('success', 'تم تعديل بيانات الكابتن بنجاح');
      } else {
        await addCourier(data as FastCourierFormData);
        triggerToast('success', 'تمت إضافة كابتن التطبيق بنجاح');
      }
    }
    setDriverModal({ isOpen: false, variant: 'internal', data: null });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.target) return;
    if (deleteModal.type === 'driver') {
      await deleteDriver(deleteModal.target.id);
      triggerToast('success', `تم حذف السائق ${deleteModal.target.name}`);
    } else {
      await deleteCourier(deleteModal.target.id);
      triggerToast('success', `تم حذف الكابتن ${deleteModal.target.name}`);
    }
    setDeleteModal({ isOpen: false, type: 'driver', target: null });
  };

  return (
    <div className="space-y-6 text-right">
      <FleetKPIs stats={fleetStats} />
      <ZoneGrid
        ordersByZone={zoneGroups}
        drivers={drivers}
        selectedDrivers={selectedDriverForZone}
        onSelectDriver={(z, id) => setSelectedDriverForZone((prev) => ({ ...prev, [z]: id }))}
        onViewCOD={(z) => setCodZone(z)}
        onSendWhatsApp={handleSendWhatsApp}
        onOpenGoogleMaps={handleOpenGoogleMaps}
        onCloseTour={(z) => setCloseZone(z)}
        onOpenManifest={(z) => setManifestZone(z)}
        onOpenCopyTemplates={(z) => setCopyZone(z)}
      />
      <InternalDriversGrid
        drivers={drivers}
        isLoading={isDriversLoading}
        isSynced={isDriversSynced}
        isSyncing={isSyncing}
        onSync={async () => {
          const res = await syncDrivers();
          triggerToast(res.synced ? 'success' : 'error', res.message || 'تمت المزامنة');
        }}
        onAdd={() => setDriverModal({ isOpen: true, variant: 'internal', data: null })}
        onEdit={(d) => setDriverModal({ isOpen: true, variant: 'internal', data: d })}
        onDelete={(d) => setDeleteModal({ isOpen: true, type: 'driver', target: d })}
        onStatusChange={async (d, s) => {
          await toggleStatus(d, s);
          triggerToast('success', `تم تحديث حالة ${d.name}`);
        }}
      />
      <FastCouriersGrid
        couriers={couriers}
        isLoading={isCouriersLoading}
        onAdd={() => setDriverModal({ isOpen: true, variant: 'fast', data: null })}
        onEdit={(c) => setDriverModal({ isOpen: true, variant: 'fast', data: c })}
        onDelete={(c) => setDeleteModal({ isOpen: true, type: 'courier', target: c })}
      />
      <ProviderCards />

      <FleetModals
        codZone={codZone}
        onCloseCod={() => setCodZone(null)}
        copyZone={copyZone}
        onCloseCopy={() => setCopyZone(null)}
        closeZone={closeZone}
        onCloseClose={() => setCloseZone(null)}
        manifestZone={manifestZone}
        onCloseManifest={() => setManifestZone(null)}
        ordersByZone={zoneGroups}
        drivers={drivers}
        selectedDrivers={selectedDriverForZone}
        copiedTemplate={copiedTemplate}
        onCopy={handleCopy}
        isClosingTour={isClosingTour}
        onConfirmCloseTour={handleConfirmCloseTour}
        driverModal={driverModal}
        onCloseDriverModal={() => setDriverModal((p) => ({ ...p, isOpen: false }))}
        onSubmitDriverModal={handleDriverSubmit}
        deleteModal={deleteModal}
        onCloseDeleteModal={() => setDeleteModal((p) => ({ ...p, isOpen: false }))}
        onConfirmDeleteModal={handleDeleteConfirm}
      />
    </div>
  );
};
