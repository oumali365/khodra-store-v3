-- ==============================================================================
-- 🧹 07_cleanup_and_reset.sql – تنظيف وإزالة الدوال والسياسات القديمة المتضاربة
-- متجر خُضرة - فاس (Khodra Store)
--
-- هذا الملف يقوم بحذف الاستعلامات والدوال القديمة الـ 19 المتفرقة في Supabase
-- بأمان تام دون أي أخطاء حتى لو كانت الجداول غير موجودة بعد (Safe Cleanup)
-- ==============================================================================

-- 1️⃣ إزالة الـ Triggers القديمة بأمان تام (فقط إذا كانت الجداول موجودة مسبقاً)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_check_order_security_rate_limit ON public.orders';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_settings') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

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

-- 3️⃣ إزالة السياسات القديمة (Policies) بأمان تام
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    EXECUTE 'DROP POLICY IF EXISTS "orders_public_insert" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "allow_public_insert_orders" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "orders_admin_read" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "orders_admin_all" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Allow public order insertion" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Enable insert for everyone" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Enable read for admin" ON public.orders';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    EXECUTE 'DROP POLICY IF EXISTS "products_public_select" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "products_admin_all" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Allow public read active products" ON public.products';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    EXECUTE 'DROP POLICY IF EXISTS "reviews_public_select" ON public.reviews';
    EXECUTE 'DROP POLICY IF EXISTS "reviews_public_insert" ON public.reviews';
    EXECUTE 'DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_settings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "store_settings_public_select" ON public.store_settings';
    EXECUTE 'DROP POLICY IF EXISTS "store_settings_admin_all" ON public.store_settings';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_security_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "logs_admin_read" ON public.order_security_logs';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
