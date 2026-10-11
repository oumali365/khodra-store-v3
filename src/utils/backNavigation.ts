// ============================================================
// src/utils/backNavigation.ts
// مدير التنقل المتقدم وسلوك زر الرجوع في الهاتف (Android / Browser Back Button Manager)
// يمنع الخروج غير المقصود ويوفر سلوكاً سياقياً متوافقاً مع المنصة
// ============================================================

import { useEffect, useRef } from 'react';

export type BackHandler = () => boolean;

interface RegisteredHandler {
  id: string;
  handler: BackHandler;
  priority: number;
}

const handlers: RegisteredHandler[] = [];

/**
 * تسجيل معالج لزر الرجوع
 * @param id معرف فريد للمعالج
 * @param handler دالة ترجع true إذا قامت بمعالجة الرجوع (إغلاق نافذة مثلاً)، و false إن لم تكن نشطة
 * @param priority الأولوية (أرقام أعلى = أولوية تنفيذ أسبق)
 * @returns دالة إلغاء التسجيل
 */
export function registerBackHandler(id: string, handler: BackHandler, priority = 10): () => void {
  const existingIdx = handlers.findIndex((h) => h.id === id);
  if (existingIdx >= 0) {
    handlers.splice(existingIdx, 1);
  }

  handlers.push({ id, handler, priority });
  // ترتيب تنازلي حسب الأولوية
  handlers.sort((a, b) => b.priority - a.priority);

  return () => {
    const idx = handlers.findIndex((h) => h.id === id);
    if (idx >= 0) {
      handlers.splice(idx, 1);
    }
  };
}

/**
 * تنفيذ المعالج ذي الأولوية القصوى النشط حالياً
 * @returns true إذا تم التعامل مع حدث الرجوع بنجاح
 */
export function dispatchBackHandler(): boolean {
  for (const item of handlers) {
    try {
      const handled = item.handler();
      if (handled) {
        return true;
      }
    } catch (err) {
      console.warn(`[BackHandler] Error in handler ${item.id}:`, err);
    }
  }
  return false;
}

/**
 * خطاف مخصص لربط أي نافذة منبثقة أو عنصر تفاعلي بزر الرجوع تلقائياً
 */
export function useBackHandler(
  id: string,
  isOpen: boolean,
  onDismiss: () => void,
  priority = 10
) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!isOpen) return;

    // تسجيل المعالج عند فتح النافذة
    const unregister = registerBackHandler(
      id,
      () => {
        onDismissRef.current();
        return true;
      },
      priority
    );

    return unregister;
  }, [id, isOpen, priority]);
}
