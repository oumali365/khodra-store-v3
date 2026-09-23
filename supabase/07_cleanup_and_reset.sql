-- ==============================================================================
-- 🧹 07_cleanup_and_reset.sql – تنظيف وإزالة الدوال والسياسات القديمة المتضاربة
-- متجر خُضرة - فاس (Khodra Store)
--
-- هذا الملف يقوم بحذف الاستعلامات والدوال القديمة الـ 19 المتفرقة في Supabase
-- لتجهيز قاعدة البيانات لاستقبال البنية الموحدة والجديدة بدون أي أخطاء تكرار
-- ==============================================================================

-- 1️⃣ إزالة الـ Triggers القديمة إن وجدت
DROP TRIGGER IF EXISTS trg_check_order_security_rate_limit ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;

-- 2️⃣ إزالة الدوال (Functions & RPCs) القديمة بكل صيغها
DROP FUNCTION IF EXISTS public.check_order_security_rate_limit();
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP FUNCTION IF EXISTS public.verify_admin_pin(TEXT);
DROP FUNCTION IF EXISTS public.get_orders_secure(TEXT);
DROP FUNCTION IF EXISTS public.update_order_status_secure(BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_order_status_secure(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_order_secure(BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.delete_order_secure(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_order_secure(TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.delete_review_secure(BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.delete_review_secure(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_review_secure(TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.purge_deleted_orders_secure(TEXT);
DROP FUNCTION IF EXISTS public.get_store_setting(TEXT);
DROP FUNCTION IF EXISTS public.update_store_setting_secure(TEXT, TEXT, TEXT);

-- 3️⃣ إزالة السياسات القديمة (Policies) لإعادة إنشائها بشكل نظيف
DO $$
BEGIN
  -- سياسات orders
  DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
  DROP POLICY IF EXISTS "allow_public_insert_orders" ON public.orders;
  DROP POLICY IF EXISTS "orders_admin_read" ON public.orders;
  DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
  DROP POLICY IF EXISTS "Allow public order insertion" ON public.orders;
  DROP POLICY IF EXISTS "Enable insert for everyone" ON public.orders;
  DROP POLICY IF EXISTS "Enable read for admin" ON public.orders;

  -- سياسات products
  DROP POLICY IF EXISTS "products_public_select" ON public.products;
  DROP POLICY IF EXISTS "products_admin_all" ON public.products;
  DROP POLICY IF EXISTS "Allow public read active products" ON public.products;

  -- سياسات reviews
  DROP POLICY IF EXISTS "reviews_public_select" ON public.reviews;
  DROP POLICY IF EXISTS "reviews_public_insert" ON public.reviews;
  DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews;

  -- سياسات store_settings
  DROP POLICY IF EXISTS "store_settings_public_select" ON public.store_settings;
  DROP POLICY IF EXISTS "store_settings_admin_all" ON public.store_settings;

  -- سياسات order_security_logs
  DROP POLICY IF EXISTS "logs_admin_read" ON public.order_security_logs;
EXCEPTION WHEN OTHERS THEN
  -- تجاهل أي أخطاء في حال عدم وجود الجداول بعد
  NULL;
END $$;
