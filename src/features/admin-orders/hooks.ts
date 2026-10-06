// ============================================================
// hooks.ts - خطافات إدارة الطلبات وحالتها والتحديث الفوري
// ============================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { DbOrder, OrderStatus, DeliveryDispatchInfo, StoreDriver } from './types';
import {
  fetchOrders,
  updateOrderStatus,
  deleteOrder,
  subscribeToOrdersChanges,
  unsubscribeFromOrdersChanges,
  updateOrderDispatch,
  updateOrderPayment,
  updateOrderArchive,
  fetchSingleOrder,
  fetchStoreDrivers,
} from '../../services/supabaseService';
import { logger } from '../../utils/logger';
import { playOrderChime, calculateDeliveryCost } from './utils';
import { DEFAULT_DISPATCH } from './constants';

/**
 * خطاف إدارة الطلبات والاشتراك الذكي في Supabase Realtime
 */
export function useOrders(onOrdersChange?: (counts: { total: number; pending: number }) => void) {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialLoadRef = useRef(false);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      logger.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      logger.error('Failed to refresh orders:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // التحميل الأولي
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // الاشتراك الفوري الذكي (Realtime)
  useEffect(() => {
    const channel = subscribeToOrdersChanges(async (payload) => {
      logger.info('Order realtime event received:', payload.eventType);

      const eventType = payload.eventType;
      const newRow = payload.new as any;
      const oldRow = payload.old as any;

      if (eventType === 'INSERT' && newRow?.id) {
        playOrderChime();
        // جلب تفاصيل الطلب كاملة
        const fullOrder = await fetchSingleOrder(newRow.id);
        if (fullOrder) {
          setOrders((prev) => [fullOrder, ...prev.filter((o) => o.id !== fullOrder.id)]);
        } else {
          loadOrders();
        }
      } else if (eventType === 'UPDATE' && newRow?.id) {
        const fullOrder = await fetchSingleOrder(newRow.id);
        if (fullOrder) {
          setOrders((prev) => prev.map((o) => (o.id === fullOrder.id ? fullOrder : o)));
        } else {
          loadOrders();
        }
      } else if (eventType === 'DELETE' && oldRow?.id) {
        setOrders((prev) => prev.filter((o) => o.id !== oldRow.id));
      } else {
        refreshOrders();
      }
    });

    return () => {
      if (channel) {
        unsubscribeFromOrdersChanges(channel);
      }
    };
  }, [loadOrders, refreshOrders]);

  // إشعار المكون الأب بعدد الطلبات
  useEffect(() => {
    if (!initialLoadRef.current && orders.length === 0) return;
    initialLoadRef.current = true;
    const nonCancelled = orders.filter((o) => o.status !== 'cancelled');
    const pendingCount = nonCancelled.filter((o) => o.status === 'pending').length;
    onOrdersChange?.({ total: nonCancelled.length, pending: pendingCount });
  }, [orders, onOrdersChange]);

  return {
    orders,
    setOrders,
    isLoading,
    isRefreshing,
    refreshOrders,
  };
}

/**
 * خطاف إجراءات الطلب (تغيير الحالة، تأكيد الدفع، الأرشفة، الحذف)
 */
export function useOrderActions(setOrders: React.Dispatch<React.SetStateAction<DbOrder[]>>) {
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const changeStatus = useCallback(
    async (orderId: string | number, newStatus: OrderStatus) => {
      setUpdatingId(orderId);
      // تحديث محلي سريع للتجربة اللحظية
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      try {
        const res = await updateOrderStatus(orderId, newStatus);
        return res;
      } catch (err) {
        logger.error('Failed to update order status:', err);
        return { success: false, message: 'فشل التحديث' };
      } finally {
        setUpdatingId(null);
      }
    },
    [setOrders]
  );

  const togglePayment = useCallback(
    async (orderId: string | number, currentPaid: boolean) => {
      const nextPaid = !currentPaid;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, is_paid: nextPaid } : o))
      );
      return await updateOrderPayment(orderId, nextPaid);
    },
    [setOrders]
  );

  const toggleArchive = useCallback(
    async (orderId: string | number, currentArchived: boolean) => {
      const nextArchived = !currentArchived;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, is_archived: nextArchived } : o))
      );
      return await updateOrderArchive(orderId, nextArchived);
    },
    [setOrders]
  );

  const removeOrder = useCallback(
    async (orderId: string | number) => {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      return await deleteOrder(orderId);
    },
    [setOrders]
  );

  return {
    updatingId,
    changeStatus,
    togglePayment,
    toggleArchive,
    removeOrder,
  };
}

/**
 * خطاف إدارة مسودات تعيين السائقين والتوصيل
 */
export function useDispatchDrafts(orders: DbOrder[]) {
  const [dispatchDrafts, setDispatchDrafts] = useState<Record<string, DeliveryDispatchInfo>>({});
  const [savingDispatchId, setSavingDispatchId] = useState<string | number | null>(null);
  const [storeDrivers, setStoreDrivers] = useState<StoreDriver[]>([]);

  useEffect(() => {
    fetchStoreDrivers().then((res) => setStoreDrivers(res.drivers)).catch(() => {});
  }, []);

  // مزامنة المسودات الأولية مع الطلبات
  useEffect(() => {
    setDispatchDrafts((prev) => {
      const next = { ...prev };
      orders.forEach((o) => {
        const key = String(o.id);
        if (!next[key]) {
          next[key] = o.delivery_dispatch || {
            ...DEFAULT_DISPATCH,
            zone: o.delivery_zone || 'north',
            deliveryCost: calculateDeliveryCost(o.delivery_zone, o.address),
          };
        }
      });
      return next;
    });
  }, [orders]);

  const updateDraft = useCallback((orderId: string | number, updates: Partial<DeliveryDispatchInfo>) => {
    const key = String(orderId);
    setDispatchDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || DEFAULT_DISPATCH),
        ...updates,
      },
    }));
  }, []);

  const saveDraft = useCallback(
    async (order: DbOrder) => {
      const key = String(order.id);
      const draft = dispatchDrafts[key] || order.delivery_dispatch || DEFAULT_DISPATCH;
      setSavingDispatchId(order.id);
      try {
        const res = await updateOrderDispatch(order.id, order.order_code, draft);
        return res;
      } finally {
        setSavingDispatchId(null);
      }
    },
    [dispatchDrafts]
  );

  return {
    dispatchDrafts,
    updateDraft,
    saveDraft,
    savingDispatchId,
    storeDrivers,
  };
}

/**
 * خطاف تصفية الطلبات وتقسيمها حسب الفروع والبحث والأرشفة
 */
export function useOrdersFilter(orders: DbOrder[], searchQuery: string, showArchived: boolean) {
  return useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = orders.filter((o) => {
      if (o.status === 'cancelled') return false;
      if (!query) return true;
      return (
        o.order_code.toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.phone.includes(query) ||
        o.address.toLowerCase().includes(query)
      );
    });

    const pending = filtered.filter((o) => o.status === 'pending');
    const prepared = filtered.filter((o) => o.status === 'prepared');
    const delivered = filtered.filter((o) => o.status === 'delivered' && (showArchived || !o.is_archived));
    const archived = filtered.filter((o) => o.status === 'delivered' && o.is_archived);

    return {
      pendingOrders: pending,
      preparedOrders: prepared,
      deliveredOrders: delivered,
      archivedOrders: archived,
      totalCount: filtered.length,
    };
  }, [orders, searchQuery, showArchived]);
}
