-- ==============================================================================
-- ⚡ 03_functions_and_rpc.sql – الدوال المحمية والعمليات الآمنة (RPC)
-- متجر خُضرة - فاس (Khodra Store)
--
-- الدوال المتوفرة:
-- 1. verify_admin_pin: التحقق من رمز المدير من جدول store_settings
-- 2. get_orders_secure: قراءة الطلبات للمدير مع استبعاد تام للطلبات المحذوفة
-- 3. update_order_status_secure: تحديث حالة الطلب
-- 4. delete_order_secure: حذف الطلب مع دعم Soft Delete أو Hard Delete
-- 5. purge_deleted_orders_secure: تنظيف وإفراغ الطلبات المحذوفة نهائياً
-- 6. delete_review_secure: حذف التقييمات بأمان
-- 7. update_store_setting_secure: تحديث إعدادات المتجر برمز PIN
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1️⃣ دالة التحقق من رمز PIN للمدير
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.verify_admin_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_pin TEXT;
BEGIN
  -- جلب رمز الـ PIN من جدول الإعدادات
  SELECT value INTO v_stored_pin
  FROM public.store_settings
  WHERE key = 'admin_pin'
  LIMIT 1;

  -- إذا لم يوجد في الجدول نعتمد الرمز الافتراضي 090909
  IF v_stored_pin IS NULL OR TRIM(v_stored_pin) = '' THEN
    v_stored_pin := '090909';
  END IF;

  RETURN TRIM(COALESCE(p_pin, '')) = TRIM(v_stored_pin);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2️⃣ دالة جلب الطلبات المحمية (get_orders_secure)
-- ⚠️ تم تصحيح الفلترة لمنع ظهور الطلبات المحذوفة نهائياً بعد إزالتها
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_orders_secure(p_admin_pin TEXT)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.verify_admin_pin(p_admin_pin) THEN
    RAISE EXCEPTION 'INVALID_ADMIN_PIN: رمز المدير غير صحيح';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.orders
  WHERE (is_deleted IS NULL OR is_deleted = FALSE)
    AND (deleted_at IS NULL)
  ORDER BY created_at DESC;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3️⃣ دالة تحديث حالة الطلب (update_order_status_secure)
-- تدعم كل من ID النصي والرقمي
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_order_status_secure(
  p_order_id TEXT,
  p_new_status TEXT,
  p_admin_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_rows INT;
BEGIN
  IF NOT public.verify_admin_pin(p_admin_pin) THEN
    RAISE EXCEPTION 'INVALID_ADMIN_PIN: رمز المدير غير صحيح';
  END IF;

  IF p_new_status NOT IN ('pending', 'prepared', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'INVALID_STATUS: حالة الطلب غير معتمدة';
  END IF;

  UPDATE public.orders
  SET status = p_new_status,
      updated_at = NOW()
  WHERE (id::TEXT = p_order_id OR order_code = p_order_id)
    AND (is_deleted IS NULL OR is_deleted = FALSE);

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  IF v_updated_rows = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'الطلب غير موجود أو محذوف');
  END IF;

  RETURN jsonb_build_object('success', true, 'status', p_new_status);
END;
$$;

-- نسخة إضافية لنوع BIGINT لضمان التوافق مع أي استدعاء قديم
CREATE OR REPLACE FUNCTION public.update_order_status_secure(
  p_order_id BIGINT,
  p_new_status TEXT,
  p_admin_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.update_order_status_secure(p_order_id::TEXT, p_new_status, p_admin_pin);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4️⃣ دالة حذف الطلب الآمنة (delete_order_secure)
-- ⚠️ تحل مشكلة "الطلبات تختفي ثم تعود للظهور" عبر تطبيق Soft Delete متزامن
-- مع خيار الحذف الكلي (Hard Delete)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_order_secure(
  p_order_id TEXT,
  p_admin_pin TEXT,
  p_hard_delete BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affected_rows INT;
BEGIN
  IF NOT public.verify_admin_pin(p_admin_pin) THEN
    RAISE EXCEPTION 'INVALID_ADMIN_PIN: رمز المدير غير صحيح';
  END IF;

  IF p_hard_delete = TRUE THEN
    -- حذف نهائي قطعي من الجدول
    DELETE FROM public.orders
    WHERE (id::TEXT = p_order_id OR order_code = p_order_id);
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  ELSE
    -- حذف مرن (Soft Delete) مضمون الفلترة في جميع الاستعلامات
    UPDATE public.orders
    SET is_deleted = TRUE,
        deleted_at = NOW(),
        updated_at = NOW()
    WHERE (id::TEXT = p_order_id OR order_code = p_order_id);
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  END IF;

  IF v_affected_rows = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'الطلب غير موجود بالفعل');
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'message', CASE WHEN p_hard_delete THEN 'تم الحذف النهائي' ELSE 'تم وضع علامة الحذف بنجاح' END,
    'affected_rows', v_affected_rows
  );
END;
$$;

-- توفير Overloads متوافقة مع الاستدعاء الثنائي (معلمتين فقط) أو نوع BIGINT
CREATE OR REPLACE FUNCTION public.delete_order_secure(
  p_order_id TEXT,
  p_admin_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.delete_order_secure(p_order_id, p_admin_pin, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_order_secure(
  p_order_id BIGINT,
  p_admin_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.delete_order_secure(p_order_id::TEXT, p_admin_pin, FALSE);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5️⃣ دالة إفراغ سلة المحذوفات نهائياً (purge_deleted_orders_secure)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.purge_deleted_orders_secure(p_admin_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  IF NOT public.verify_admin_pin(p_admin_pin) THEN
    RAISE EXCEPTION 'INVALID_ADMIN_PIN: رمز المدير غير صحيح';
  END IF;

  DELETE FROM public.orders
  WHERE is_deleted = TRUE OR deleted_at IS NOT NULL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'purged_count', v_deleted_count);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6️⃣ دالة حذف التقييم الآمنة (delete_review_secure)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_review_secure(
  p_review_id TEXT,
  p_admin_pin TEXT,
  p_hard_delete BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affected INT;
BEGIN
  IF NOT public.verify_admin_pin(p_admin_pin) THEN
    RAISE EXCEPTION 'INVALID_ADMIN_PIN: رمز المدير غير صحيح';
  END IF;

  IF p_hard_delete THEN
    DELETE FROM public.reviews WHERE id::TEXT = p_review_id;
    GET DIAGNOSTICS v_affected = ROW_COUNT;
  ELSE
    UPDATE public.reviews
    SET is_deleted = TRUE,
        deleted_at = NOW()
    WHERE id::TEXT = p_review_id;
    GET DIAGNOSTICS v_affected = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object('success', true, 'affected_rows', v_affected);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_review_secure(
  p_review_id TEXT,
  p_admin_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.delete_review_secure(p_review_id, p_admin_pin, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_review_secure(
  p_review_id BIGINT,
  p_admin_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.delete_review_secure(p_review_id::TEXT, p_admin_pin, FALSE);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7️⃣ دالة جلب وتحديث إعدادات المتجر
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_store_setting(p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_val TEXT;
BEGIN
  SELECT value INTO v_val FROM public.store_settings WHERE key = p_key LIMIT 1;
  RETURN v_val;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_store_setting_secure(
  p_key TEXT,
  p_value TEXT,
  p_admin_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.verify_admin_pin(p_admin_pin) THEN
    RAISE EXCEPTION 'INVALID_ADMIN_PIN: رمز المدير غير صحيح';
  END IF;

  INSERT INTO public.store_settings (key, value, updated_at)
  VALUES (p_key, p_value, NOW())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'key', p_key, 'value', p_value);
END;
$$;
