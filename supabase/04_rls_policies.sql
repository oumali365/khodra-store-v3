-- ==============================================================================
-- 🔒 04_rls_policies.sql – سياسات الأمان على مستوى الصفوف (Row Level Security)
-- متجر خُضرة - فاس (Khodra Store)
--
-- القواعد:
-- 1. جدول الطلبات orders: مسموح للعملاء (anon) الإدراج فقط (INSERT)، والقراءة
--    محصورة على المدير عبر دالة get_orders_secure برمز الـ PIN.
-- 2. جدول المنتجات products: متاح للجميع قراءة المنتجات المفعلة فقط (active=true).
-- 3. جدول التقييمات reviews: متاح للجميع قراءة التقييمات غير المحذوفة وإضافة تقييم جديد.
-- 4. جدول الإعدادات store_settings: متاح للقراءة، والتعديل للمدير فقط.
-- 5. جدول سجلات الأمان order_security_logs: محمي وخاص بالنظام.
-- ==============================================================================

-- 1️⃣ تفعيل نظام RLS على كافة الجداول
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_security_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2️⃣ سياسات جدول الطلبات (orders)
-- ─────────────────────────────────────────────────────────────────────────────
-- السماح للزبائن بإرسال طلبات جديدة
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
CREATE POLICY "orders_public_insert"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- السماح بالتحكم الكامل عبر مفتاح الخدمة الداخلي أو المستخدم الموثق
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all"
  ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3️⃣ سياسات جدول المنتجات (products)
-- ─────────────────────────────────────────────────────────────────────────────
-- السماح للجميع بقراءة المنتجات النشطة
DROP POLICY IF EXISTS "products_public_select" ON public.products;
CREATE POLICY "products_public_select"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (active = TRUE);

-- إدارة المنتجات للمدير
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all"
  ON public.products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4️⃣ سياسات جدول التقييمات (reviews)
-- ─────────────────────────────────────────────────────────────────────────────
-- السماح بقراءة التقييمات المعتمدة وغير المحذوفة
DROP POLICY IF EXISTS "reviews_public_select" ON public.reviews;
CREATE POLICY "reviews_public_select"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (is_deleted IS NULL OR is_deleted = FALSE);

-- السماح للزبائن بإضافة تقييم جديد
DROP POLICY IF EXISTS "reviews_public_insert" ON public.reviews;
CREATE POLICY "reviews_public_insert"
  ON public.reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews;
CREATE POLICY "reviews_admin_all"
  ON public.reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5️⃣ سياسات جدول إعدادات المتجر (store_settings)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "store_settings_public_select" ON public.store_settings;
CREATE POLICY "store_settings_public_select"
  ON public.store_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "store_settings_admin_all" ON public.store_settings;
CREATE POLICY "store_settings_admin_all"
  ON public.store_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6️⃣ سياسات سجلات الحماية (order_security_logs)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "logs_admin_all" ON public.order_security_logs;
CREATE POLICY "logs_admin_all"
  ON public.order_security_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7️⃣ منح الصلاحيات الصريحة (Explicit Table Grants)
-- متوافق مع تحديث Supabase الجديد (30 أكتوبر) لضمان عمل Data API
-- ─────────────────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

GRANT INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;

GRANT SELECT, INSERT ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;

GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT ALL ON public.store_settings TO service_role;

GRANT ALL ON public.order_security_logs TO service_role;
