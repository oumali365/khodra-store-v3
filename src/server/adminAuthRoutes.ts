// ============================================================
// src/server/adminAuthRoutes.ts
// مسارات المصادقة المركزية والآمنة للوحة إدارة متجر خُضرة — فاس
// تدير التحقق من الرمز السري وتغييره مع حماية Brute-force وإبطال الجلسات
// ============================================================

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getServerSupabase } from './supabaseServerClient';

export const adminAuthRouter = Router();

// ─── حماية الذاكرة المؤقتة ضد التخمين (In-Memory Brute-Force Rate Limiting) ───
interface FailedAttemptRecord {
  count: number;
  lockedUntil: number;
  lastAttempt: number;
}

const failedAttemptsMap = new Map<string, FailedAttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة
const ATTEMPT_EXPIRY_MS = 15 * 60 * 1000;

function getClientIp(req: Request): string {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf.trim()) return cf.split(',')[0].trim();

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string): { isLocked: boolean; remainingMinutes: number } {
  const record = failedAttemptsMap.get(ip);
  if (!record) return { isLocked: false, remainingMinutes: 0 };

  const now = Date.now();
  if (record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return { isLocked: true, remainingMinutes };
  }

  // إذا انتهت فترة القفل أو مضى وقت طويل دون محاولات، نعيد التصفير
  if (now - record.lastAttempt > ATTEMPT_EXPIRY_MS) {
    failedAttemptsMap.delete(ip);
    return { isLocked: false, remainingMinutes: 0 };
  }

  return { isLocked: false, remainingMinutes: 0 };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const current = failedAttemptsMap.get(ip) || { count: 0, lockedUntil: 0, lastAttempt: now };
  current.count += 1;
  current.lastAttempt = now;

  if (current.count >= MAX_FAILED_ATTEMPTS) {
    current.lockedUntil = now + LOCKOUT_WINDOW_MS;
    console.warn(`🔒 [Admin Auth] IP ${ip} locked out for 15 minutes after ${current.count} failed PIN attempts`);
  }

  failedAttemptsMap.set(ip, current);
}

function clearFailedAttempts(ip: string): void {
  failedAttemptsMap.delete(ip);
}

/**
 * جلب الرمز السري وإصدار الجلسة الحالي من قاعدة البيانات المركزية Supabase
 */
export async function getStoredAdminCredentials(): Promise<{
  adminPin: string | null;
  sessionVersion: string;
  updatedAt: string | null;
}> {
  const supabase = getServerSupabase();
  if (!supabase) {
    throw new Error('قاعدة بيانات Supabase غير مهيأة في بيئة الخادم.');
  }

  const { data, error } = await supabase
    .from('store_settings')
    .select('key, value, updated_at')
    .in('key', ['admin_pin', 'admin_session_version']);

  if (error) {
    throw new Error(`تعذر قراءة إعدادات الإدارة: ${error.message}`);
  }

  let adminPin: string | null = null;
  let sessionVersion = 'v1';
  let updatedAt: string | null = null;

  if (Array.isArray(data)) {
    for (const row of data) {
      if (row.key === 'admin_pin') {
        adminPin = String(row.value || '').trim();
        updatedAt = row.updated_at;
      } else if (row.key === 'admin_session_version') {
        sessionVersion = String(row.value || 'v1').trim();
      }
    }
  }

  // إذا لم يكن الرمز مخزناً في قاعدة البيانات بعد، نتحقق من متغير البيئة على الخادم كقيمة أولية ونخزنها مركزياً
  if (!adminPin && (process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN)) {
    adminPin = String(process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN).trim();
    try {
      await supabase.from('store_settings').upsert(
        [
          {
            key: 'admin_pin',
            value: adminPin,
            description: 'رمز الدخول إلى لوحة إدارة الطلبات وحذفها',
            updated_at: new Date().toISOString(),
          },
          {
            key: 'admin_session_version',
            value: sessionVersion,
            description: 'مؤشر إصدار الجلسات الإدارية النشطة لإبطال الجلسات القديمة فورياً',
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'key' }
      );
    } catch (upsertErr) {
      console.warn('Could not seed initial admin_pin to store_settings:', upsertErr);
    }
  }

  return { adminPin, sessionVersion, updatedAt };
}

// ────────────────────────────────────────────────────────────
// 1️⃣ POST /api/admin/verify-pin - التحقق المركزي من رمز الدخول
// ────────────────────────────────────────────────────────────
adminAuthRouter.post('/api/admin/verify-pin', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { isLocked, remainingMinutes } = checkRateLimit(ip);

  if (isLocked) {
    return res.status(429).json({
      success: false,
      valid: false,
      locked: true,
      error: `تم قفل التحقق مؤقتاً بسبب كثرة المحاولات الخاطئة. يرجى الانتظار ${remainingMinutes} دقيقة.`,
    });
  }

  const { pin } = req.body || {};
  const trimmedPin = typeof pin === 'string' ? pin.trim() : '';

  if (!trimmedPin || trimmedPin.length < 4) {
    return res.status(400).json({
      success: false,
      valid: false,
      error: 'يرجى إدخال رمز سري مكون من 4 أرقام على الأقل.',
    });
  }

  try {
    const { adminPin, sessionVersion } = await getStoredAdminCredentials();

    if (!adminPin) {
      return res.status(500).json({
        success: false,
        valid: false,
        error: 'لم يتم العثور على رمز الإدارة في إعدادات المتجر.',
      });
    }

    if (trimmedPin === adminPin) {
      clearFailedAttempts(ip);

      // توليد رمز جلسة مؤقت مشفر يعتمد على الرمز السري وإصدار الجلسة
      const sessionToken = crypto
        .createHash('sha256')
        .update(`${adminPin}:${sessionVersion}:${ip}`)
        .digest('hex');

      return res.json({
        success: true,
        valid: true,
        sessionVersion,
        sessionToken,
      });
    }

    // محاولة خاطئة
    recordFailedAttempt(ip);

    // تسجيل في سجلات الأمان
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('order_security_logs').insert({
          attempt_type: 'admin_pin_failed',
          ip_address: ip,
          reason: 'محاولة إدخال رمز مدير غير صحيح عبر خادم API المركزي',
          payload: { timestamp: new Date().toISOString() },
        });
      } catch (logErr) {
        console.warn('[Admin Auth] Security log insert notice:', logErr);
      }
    }

    return res.status(401).json({
      success: false,
      valid: false,
      error: 'الرمز السري غير صحيح.',
    });
  } catch (err: any) {
    console.error('❌ [Admin Auth verify-pin error]:', err?.message || err);
    return res.status(500).json({
      success: false,
      valid: false,
      error: 'حدث خطأ في الخادم أثناء التحقق من الرمز السري.',
    });
  }
});

// ────────────────────────────────────────────────────────────
// 2️⃣ POST /api/admin/change-pin - تحديث الرمز السري المركزي وإبطال الجلسات القديمة
// ────────────────────────────────────────────────────────────
adminAuthRouter.post('/api/admin/change-pin', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { currentPin, newPin } = req.body || {};

  const cleanCurrent = typeof currentPin === 'string' ? currentPin.trim() : '';
  const cleanNew = typeof newPin === 'string' ? newPin.trim() : '';

  if (!cleanCurrent || cleanCurrent.length < 4) {
    return res.status(400).json({
      success: false,
      error: 'يرجى إدخال الرمز السري الحالي للتأكيد.',
    });
  }

  if (!cleanNew || cleanNew.length < 4) {
    return res.status(400).json({
      success: false,
      error: 'الرمز السري الجديد يجب أن يتكون من 4 أرقام أو أكثر.',
    });
  }

  if (cleanCurrent === cleanNew) {
    return res.status(400).json({
      success: false,
      error: 'الرمز الجديد مطابق للرمز الحالي، يرجى اختيار رمز جديد ومختلف.',
    });
  }

  try {
    const supabase = getServerSupabase();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'اتصال قاعدة البيانات غير متوفر على الخادم.',
      });
    }

    // 1. التحقق الصارم من الرمز الحالي ضد قاعدة البيانات المركزية
    const { adminPin: storedPin } = await getStoredAdminCredentials();

    if (!storedPin || storedPin !== cleanCurrent) {
      recordFailedAttempt(ip);
      return res.status(401).json({
        success: false,
        error: 'الرمز السري الحالي غير صحيح. تعذر حفظ الرمز الجديد.',
      });
    }

    // 2. تحديث الرمز السري في جدول store_settings عبر العميل الموثوق
    const newSessionVersion = `v_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const { error: updatePinError } = await supabase
      .from('store_settings')
      .upsert(
        [
          {
            key: 'admin_pin',
            value: cleanNew,
            description: 'رمز الدخول إلى لوحة إدارة الطلبات وحذفها',
            updated_at: nowIso,
          },
          {
            key: 'admin_session_version',
            value: newSessionVersion,
            description: 'مؤشر إصدار الجلسات الإدارية النشطة لإبطال الجلسات القديمة فورياً',
            updated_at: nowIso,
          },
        ],
        { onConflict: 'key' }
      );

    if (updatePinError) {
      console.error('❌ [Admin Auth change-pin update error]:', updatePinError);
      return res.status(500).json({
        success: false,
        error: `فشل تحديث الرمز في قاعدة البيانات: ${updatePinError.message}`,
      });
    }

    // 3. توثيق العملية في سجل الأمان المركزي
    try {
      await supabase.from('order_security_logs').insert({
        attempt_type: 'admin_pin_changed',
        ip_address: ip,
        reason: 'تم تغيير الرمز السري للمدير بنجاح عبر الخادم المركزي وإبطال كافة الجلسات السابقة',
        payload: {
          sessionVersion: newSessionVersion,
          timestamp: nowIso,
        },
      });
    } catch (logErr) {
      console.warn('[Admin Auth] Log insert notice:', logErr);
    }

    // تصفير أي محاولات فاشلة
    clearFailedAttempts(ip);

    console.log(`✅ [Admin Auth] PIN successfully changed centrally in Supabase. New session version: ${newSessionVersion}`);

    const newSessionToken = crypto
      .createHash('sha256')
      .update(`${cleanNew}:${newSessionVersion}:${ip}`)
      .digest('hex');

    return res.json({
      success: true,
      message: 'تم تحديث الرمز السري بنجاح ومزامنته في الخادم المركزي.',
      sessionVersion: newSessionVersion,
      sessionToken: newSessionToken,
    });
  } catch (err: any) {
    console.error('❌ [Admin Auth change-pin error]:', err?.message || err);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ داخلي أثناء تحديث الرمز السري.',
    });
  }
});

// ────────────────────────────────────────────────────────────
// 3️⃣ POST /api/admin/validate-session - التحقق من استمرار صلاحية الجلسة
// ────────────────────────────────────────────────────────────
adminAuthRouter.post('/api/admin/validate-session', async (req: Request, res: Response) => {
  const { pin, sessionVersion } = req.body || {};
  const cleanPin = typeof pin === 'string' ? pin.trim() : '';
  const cleanVersion = typeof sessionVersion === 'string' ? sessionVersion.trim() : '';

  if (!cleanPin && !cleanVersion) {
    return res.status(400).json({ valid: false, reason: 'NO_CREDENTIALS_PROVIDED' });
  }

  try {
    const { adminPin, sessionVersion: currentVersion } = await getStoredAdminCredentials();

    if (!adminPin) {
      return res.json({ valid: false, reason: 'NO_PIN_CONFIGURED' });
    }

    // إذا تم تمرير إصدار الجلسة، نتحقق من عدم تغييره في الخادم المركزي
    if (cleanVersion && cleanVersion !== currentVersion) {
      return res.json({ valid: false, reason: 'SESSION_REVOKED' });
    }

    // إذا تم تمرير الرمز السري، نتحقق من مطابقته للرمز الحالي في الخادم
    if (cleanPin && cleanPin !== adminPin) {
      return res.json({ valid: false, reason: 'PIN_MISMATCH' });
    }

    return res.json({
      valid: true,
      sessionVersion: currentVersion,
    });
  } catch (err: any) {
    return res.status(500).json({
      valid: false,
      error: err?.message || 'Server error',
    });
  }
});
