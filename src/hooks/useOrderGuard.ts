// src/hooks/useOrderGuard.ts
import { useCallback, useRef } from 'react';

const COOLDOWN_MINUTES = 3;
const MAX_ORDERS_PER_HOUR = 3;
const LAST_ORDER_KEY = 'khodra_last_order';
const ORDERS_HISTORY_KEY = 'khodra_orders_history';

export interface OrderGuardResult {
  allowed: boolean;
  reason?: 'cooldown' | 'rate-limit';
  remainingSec?: number;
  remainingMin?: number;
}

export const useOrderGuard = () => {
  const guardRef = useRef(false); // حماية فورية من النقر المزدوج

  const check = useCallback((): OrderGuardResult => {
    const now = Date.now();

    // 1️⃣ Cooldown
    const lastOrderAt = localStorage.getItem(LAST_ORDER_KEY);
    if (lastOrderAt) {
      const elapsed = now - parseInt(lastOrderAt, 10);
      const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
      if (elapsed < cooldownMs) {
        return {
          allowed: false,
          reason: 'cooldown',
          remainingSec: Math.ceil((cooldownMs - elapsed) / 1000),
        };
      }
    }

    // 2️⃣ Rate Limit (3/ساعة)
    const history: number[] = JSON.parse(
      localStorage.getItem(ORDERS_HISTORY_KEY) || '[]'
    );
    const recent = history.filter((t) => now - t < 60 * 60 * 1000);
    if (recent.length >= MAX_ORDERS_PER_HOUR) {
      const oldest = Math.min(...recent);
      return {
        allowed: false,
        reason: 'rate-limit',
        remainingMin: Math.ceil((60 * 60 * 1000 - (now - oldest)) / 60000),
      };
    }

    return { allowed: true };
  }, []);

  const record = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(LAST_ORDER_KEY, now.toString());

    const history: number[] = JSON.parse(
      localStorage.getItem(ORDERS_HISTORY_KEY) || '[]'
    );
    const recent = history.filter((t) => now - t < 60 * 60 * 1000);
    recent.push(now);
    localStorage.setItem(ORDERS_HISTORY_KEY, JSON.stringify(recent));
  }, []);

  // قفل فوري (يمنع النقر المزدوج في نفس اللحظة)
  const lock = useCallback(() => {
    if (guardRef.current) return false;
    guardRef.current = true;
    return true;
  }, []);

  const unlock = useCallback(() => {
    guardRef.current = false;
  }, []);

  return { check, record, lock, unlock };
};