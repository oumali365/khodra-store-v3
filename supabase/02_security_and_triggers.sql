-- ==============================================================================
-- 🛡️ 02_security_and_triggers.sql – نظام الحماية المتقدم ومكافحة التكرار والسبام
-- متجر خُضرة - فاس (Khodra Store)
--
-- الوظائف:
-- 1. دالة فحص وتدقيق الطلبات (التحقق من صحة رقم الهاتف المغربي)
-- 2. فترة التهدئة Cooldown (حد أدنى 3 دقائق بين الطلب والآخر)
-- 3. سقف معدل الطلبات Rate Limit (أقصى حد 3 طلبات خلال 60 دقيقة)
-- 4. تسجيل المحاولات المشبوهة تلقائياً في order_security_logs
-- 5. التحديث التلقائي لحقل updated_at
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1️⃣ دالة فحص أمان ومعدل الطلبات قبل الإدراج
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_order_security_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_order_count INT;
  v_seconds_since_last INT;
  v_clean_phone TEXT;
BEGIN
  -- تنظيف رقم الهاتف لمطابقته بدقة
  v_clean_phone := REGEXP_REPLACE(COALESCE(NEW.phone, ''), '[^\d]', '', 'g');

  -- فحص طول رقم الهاتف المغربي
  IF LENGTH(v_clean_phone) < 9 THEN
    RAISE EXCEPTION 'INVALID_PHONE: رقم الهاتف غير صالح. يرجى إدخال رقم مغربي صحيح.';
  END IF;

  -- ─── [أ] فحص فترة التهدئة (Cooldown 3 دقائق = 180 ثانية) ───
  IF v_clean_phone <> '' THEN
    SELECT EXTRACT(EPOCH FROM (NOW() - created_at))::INT
    INTO v_seconds_since_last
    FROM public.orders
    WHERE REGEXP_REPLACE(phone, '[^\d]', '', 'g') = v_clean_phone
      AND (is_deleted IS NULL OR is_deleted = FALSE)
      AND (deleted_at IS NULL)
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_seconds_since_last IS NOT NULL AND v_seconds_since_last < 180 THEN
      -- تسجيل المحاولة المحظورة
      INSERT INTO public.order_security_logs (attempt_type, phone, client_id, ip_address, reason, payload)
      VALUES (
        'cooldown_blocked',
        NEW.phone,
        NEW.client_id,
        NEW.ip_address,
        format('الطلب بعد %s ثانية فقط من آخر طلب (الحد الأدنى 180 ثانية)', v_seconds_since_last),
        jsonb_build_object('order_code', NEW.order_code, 'subtotal', NEW.subtotal)
      );

      RAISE EXCEPTION 'COOLDOWN_ACTIVE: يرجى الانتظار قليلاً قبل إرسال طلب جديد لنفس الرقم (متبقي %s ثانية).', (180 - v_seconds_since_last);
    END IF;
  END IF;

  -- ─── [ب] فحص سقف الطلبات في الساعة (Rate Limit: 3 طلبات/ساعة) ───
  SELECT COUNT(*)
  INTO v_recent_order_count
  FROM public.orders
  WHERE (
    (v_clean_phone <> '' AND REGEXP_REPLACE(phone, '[^\d]', '', 'g') = v_clean_phone)
    OR (NEW.client_id IS NOT NULL AND client_id = NEW.client_id)
  )
  AND (is_deleted IS NULL OR is_deleted = FALSE)
  AND (deleted_at IS NULL)
  AND created_at > (NOW() - INTERVAL '60 minutes');

  IF v_recent_order_count >= 3 THEN
    -- تسجيل المحاولة المحظورة
    INSERT INTO public.order_security_logs (attempt_type, phone, client_id, ip_address, reason, payload)
    VALUES (
      'rate_limit_exceeded',
      NEW.phone,
      NEW.client_id,
      NEW.ip_address,
      format('تجاوز الحد الأقصى (%s طلبات في الساعة)', v_recent_order_count),
      jsonb_build_object('order_code', NEW.order_code, 'subtotal', NEW.subtotal)
    );

    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: تجاوزت الحد المسموح به للطلبات مؤقتاً (3 طلبات خلال ساعة واحدة). تواصل معنا عبر الواتساب للمساعدة.';
  END IF;

  RETURN NEW;
END;
$$;

-- ربط Trigger الفحص بجدول الطلبات
DROP TRIGGER IF EXISTS trg_check_order_security_rate_limit ON public.orders;
CREATE TRIGGER trg_check_order_security_rate_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_order_security_rate_limit();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2️⃣ دالة وتريغر التحديث التلقائي لحقل updated_at
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
