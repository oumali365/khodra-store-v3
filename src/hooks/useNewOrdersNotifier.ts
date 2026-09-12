// ============================================================
// useNewOrdersNotifier.ts – Hook لمراقبة الطلبات الجديدة
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchPendingOrdersCount } from '../services/supabaseService';

interface UseNewOrdersNotifierOptions {
  enabled: boolean;              // هل المراقبة مفعّلة (فقط في وضع المدير)
  pollIntervalMs?: number;       // فترة الفحص (افتراضي: 45000 = 45 ثانية)
}

interface UseNewOrdersNotifierResult {
  newCount: number;              // عدد الطلبات الجديدة منذ آخر مشاهدة
  totalPending: number;          // إجمالي الطلبات المعلقة في Supabase
  markAsSeen: () => void;        // إعادة تعيين العدّاد بعد فتح اللوحة
  refresh: () => Promise<void>;  // فحص فوري
}

export function useNewOrdersNotifier({
  enabled,
  pollIntervalMs = 45000,
}: UseNewOrdersNotifierOptions): UseNewOrdersNotifierResult {
  const [newCount, setNewCount] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  // آخر عدد تم مشاهدته (محفوظ في localStorage ليبقى بين الجلسات)
  const lastSeenRef = useRef<number>(() => {
    try {
      return Number(localStorage.getItem('khodra_last_seen_pending') || 0);
    } catch {
      return 0;
    }
  });

  // منع تكرار التنبيه لنفس الطلبات
  const lastFetchRef = useRef<number>(0);

  // ─── فحص الطلبات ───
  const checkOrders = useCallback(async () => {
    // منع الفحص المتكرر خلال 10 ثوانٍ
    const now = Date.now();
    if (now - lastFetchRef.current < 10000) return;
    lastFetchRef.current = now;

    try {
      const count = await fetchPendingOrdersCount();
      setTotalPending(count);

      // حساب الجديد منذ آخر مشاهدة
      const diff = Math.max(0, count - lastSeenRef.current);
      setNewCount(diff);
    } catch (err) {
      console.warn('خطأ في فحص الطلبات الجديدة:', err);
    }
  }, []);

  // ─── إعادة تعيين العدّاد ───
  const markAsSeen = useCallback(() => {
    lastSeenRef.current = totalPending;
    setNewCount(0);
    try {
      localStorage.setItem('khodra_last_seen_pending', String(totalPending));
    } catch {
      // ignore
    }
  }, [totalPending]);

  // ─── فحص فوري ───
  const refresh = useCallback(async () => {
    lastFetchRef.current = 0; // تجاوز الحماية
    await checkOrders();
  }, [checkOrders]);

  // ─── المراقبة الدورية ───
  useEffect(() => {
    if (!enabled) {
      setNewCount(0);
      return;
    }

    // فحص أولي فوري
    checkOrders();

    // فحص دوري
    const interval = setInterval(checkOrders, pollIntervalMs);

    // فحص عند عودة المستخدم للصفحة (بعد تصغير المتصفح)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // فحص عند استعادة الاتصال
    const handleOnline = () => refresh();
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [enabled, pollIntervalMs, checkOrders, refresh]);

  return {
    newCount,
    totalPending,
    markAsSeen,
    refresh,
  };
}