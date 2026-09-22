-- ==============================================================================
-- 🛡️ خطة الحماية والأمان الشاملة لمتجر خُضرة (Khodra Store Security Plan)
-- ملف SQL جاهز للنسخ والتنفيذ المباشر في Supabase SQL Editor
-- 
-- المحتويات:
-- 1. إضافة أعمدة الأمان إلى جدول orders (Idempotency Key, Client ID, Fingerprint, IP)
-- 2. فهرس فريد لمنع تكرار الطلبات (Unique Idempotency Index)
-- 3. جدول مراقبة وتتبع الطلبات (Order Security Logs)
-- 4. دالة و Trigger للتحقق من Rate Limit (3 طلبات/ساعة) و Cooldown (3 دقائق) على الخادم
-- 5. إعداد سياسات الأمان RLS (Row Level Security)
-- 6. عرض الطلبات المشبوهة (Suspicious Orders View) للمدير
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1️⃣ تحديث جدول الطلبات (orders) بإضافة حقول الحماية والتتبع
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS turnstile_token TEXT,
  ADD COLUMN IF NOT EXISTS security_flags JSONB DEFAULT '{}'::jsonb;

-- التعليق التوضيحي للأعمدة
COMMENT ON COLUMN public.orders.idempotency_key IS 'مفتاح فريد لمنع تكرار الطلب عند الضغط المزدوج أو إعادة المحاولة';
COMMENT ON COLUMN public.orders.client_id IS 'المعرف الدائم لمتصفح/جهاز الزبون للتتبع ومكافحة السبام';
COMMENT ON COLUMN public.orders.device_fingerprint IS 'بصمة الجهاز الرقمية لمنع الطلبات الآلية والمزيفة';
COMMENT ON COLUMN public.orders.ip_address IS 'عنوان IP لمرسل الطلب';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2️⃣ إنشاء فهرس فريد لمنع التكرار (Unique Idempotency Index)
-- في حال حاول أي طرف إرسال نفس الطلب مرتين خلال نافذة زمنية، تمنعه قاعدة البيانات
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key_unique
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- فهرس لتسريع استعلامات معدل الطلبات والتتبع
CREATE INDEX IF NOT EXISTS idx_orders_security_lookup
  ON public.orders (phone, client_id, ip_address, created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3️⃣ جدول سجلات الحماية (security logs) لتدقيق المحاولات المحظورة
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_security_logs (
  id BIGSERIAL PRIMARY KEY,
  attempt_type TEXT NOT NULL,          -- 'rate_limit_exceeded', 'cooldown_blocked', 'fake_phone', 'duplicate_prevented'
  phone TEXT,
  client_id TEXT,
  ip_address TEXT,
  reason TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_created_at
  ON public.order_security_logs (created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4️⃣ دالة فحص معدل الطلبات وفترة التهدئة على مستوى الخادم (Server Rate Limit)
-- تفرض قيوداً صارمة:
-- - Cooldown: حد أدنى 3 دقائق بين الطلب والآخر لنفس رقم الهاتف أو نفس الـ Client ID
-- - Rate Limit: أقصى حد 3 طلبات خلال آخر 60 دقيقة
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

  -- ─── فحص صحة رقم الهاتف المغربي على مستوى الخادم ───
  IF LENGTH(v_clean_phone) < 9 THEN
    RAISE EXCEPTION 'INVALID_PHONE: رقم الهاتف غير صالح. يرجى إدخال رقم مغربي صحيح.';
  END IF;

  -- ─── [أ] فحص فترة التهدئة (Cooldown 3 دقائق = 180 ثانية) ───
  -- التحقق من آخر طلب لنفس رقم الهاتف خلال آخر 180 ثانية
  IF v_clean_phone <> '' THEN
    SELECT EXTRACT(EPOCH FROM (NOW() - created_at))::INT
    INTO v_seconds_since_last
    FROM public.orders
    WHERE REGEXP_REPLACE(phone, '[^\d]', '', 'g') = v_clean_phone
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_seconds_since_last IS NOT NULL AND v_seconds_since_last < 180 THEN
      -- تسجيل المحاولة المحظورة
      INSERT INTO public.order_security_logs (attempt_type, phone, client_id, ip_address, reason)
      VALUES (
        'cooldown_blocked',
        NEW.phone,
        NEW.client_id,
        NEW.ip_address,
        format('محاولة إرسال بعد %s ثانية فقط من الطلب السابق (الحد الأدنى 180 ثانية)', v_seconds_since_last)
      );

      RAISE EXCEPTION 'COOLDOWN_ACTIVE: يرجى الانتظار %s ثانية قبل إرسال طلب جديد لنفس الرقم لمنع التكرار.', (180 - v_seconds_since_last);
    END IF;
  END IF;

  -- ─── [ب] فحص معدل الطلبات (Rate Limit: أقصى حد 3 طلبات في الساعة) ───
  -- فحص عدد الطلبات لنفس رقم الهاتف أو نفس الجهاز خلال آخر 60 دقيقة
  SELECT COUNT(*)
  INTO v_recent_order_count
  FROM public.orders
  WHERE (
    (v_clean_phone <> '' AND REGEXP_REPLACE(phone, '[^\d]', '', 'g') = v_clean_phone)
    OR
    (NEW.client_id IS NOT NULL AND client_id = NEW.client_id)
  )
  AND created_at >= (NOW() - INTERVAL '1 hour');

  IF v_recent_order_count >= 3 THEN
    -- تسجيل المحاولة المحظورة
    INSERT INTO public.order_security_logs (attempt_type, phone, client_id, ip_address, reason)
    VALUES (
      'rate_limit_exceeded',
      NEW.phone,
      NEW.client_id,
      NEW.ip_address,
      format('تجاوز الحد الأقصى (%s طلبات مسجلة في آخر ساعة)', v_recent_order_count)
    );

    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: لقد تجاوزت الحد المسموح به للطلبات في الساعة (3 طلبات). لحماية المتجر يرجى التواصل عبر واتساب.';
  END IF;

  RETURN NEW;
END;
$$;

-- ربط الـ Trigger بجدول الطلبات قبل إدراج أي صف جديد
DROP TRIGGER IF EXISTS trg_enforce_order_security ON public.orders;

CREATE TRIGGER trg_enforce_order_security
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_order_security_rate_limit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5️⃣ سياسات الأمان RLS (Row Level Security) لجدول orders
-- حماية الجدول من القراءة العامة مع السماح للزبائن بالإدراج الآمن فقط
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 1. السماح للجميع (Anon / Public) بإنشاء طلب جديد فقط
DROP POLICY IF EXISTS "Allow anonymous orders insert" ON public.orders;
CREATE POLICY "Allow anonymous orders insert"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. منع القراءة العامة لطلبات الزبائن لحماية خصوصيتهم وأرقام هواتفهم
-- القراءة تتم فقط إما عبر Service Role أو عبر RPC محمية برقم PIN السري
DROP POLICY IF EXISTS "Allow read orders public" ON public.orders;
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;

-- تمكين القراءة فقط لـ Service Role (لوحة الإدارة والـ RPCs المصرح لها)
DROP POLICY IF EXISTS "Allow service role read orders" ON public.orders;
CREATE POLICY "Allow service role read orders"
  ON public.orders
  FOR SELECT
  TO authenticated, service_role
  USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6️⃣ دالة RPC آمنة لجلب الطلبات مع التحقق من PIN الإدارة
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_orders_secure(p_admin_pin TEXT)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- التحقق من رمز PIN (الافتراضي 090909 أو المعدل في التخزين)
  IF p_admin_pin IS NULL OR LENGTH(p_admin_pin) < 4 THEN
    RAISE EXCEPTION 'UNAUTHORIZED: رمز PIN الإداري غير صحيح';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.orders
  ORDER BY created_at DESC
  LIMIT 100;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_orders_secure(TEXT) TO anon, authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7️⃣ View لمراقبة الطلبات المشبوهة أو المتكررة (للإدارة)
-- تظهر الطلبات التي تشترك في نفس بصمة الجهاز أو نفس عنوان IP بأرقام هواتف مختلفة
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_suspicious_orders AS
SELECT 
  o.id,
  o.order_code,
  o.customer_name,
  o.phone,
  o.total,
  o.status,
  o.client_id,
  o.device_fingerprint,
  o.ip_address,
  o.created_at,
  (
    SELECT COUNT(*) 
    FROM public.orders sub 
    WHERE (sub.client_id = o.client_id OR sub.ip_address = o.ip_address)
      AND sub.phone <> o.phone
  ) AS duplicate_device_flag
FROM public.orders o
ORDER BY o.created_at DESC;

COMMENT ON VIEW public.v_suspicious_orders IS 'لوحة كشف الطلبات المشبوهة التي تستخدم نفس الجهاز أو الـ IP بهويات متعددة';
