-- ==============================================================================
-- ⚡ 06_realtime_setup.sql – إعداد التزامن اللحظي الفوري (Supabase Realtime)
-- متجر خُضرة - فاس (Khodra Store)
--
-- يفعل الاستماع الفوري للأحداث:
-- 1. جدول الطلبات (orders): إشعار فوري عند وصول طلب جديد أو تعديل الحالة أو الحذف
-- 2. جدول التقييمات (reviews): ظهور التقييمات المضافة فورياً
-- 3. جدول المنتجات (products): تحديث المخزون والأسعار مباشرة
-- ==============================================================================

-- تفعيل إرسال كافة بيانات الصف عند التحديث أو الحذف (Full Replica Identity)
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- إضافة الجداول لمنشور البث اللحظي supabase_realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- إضافة جدول orders إن لم يكن مضافاً
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  -- إضافة جدول reviews إن لم يكن مضافاً
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
  END IF;

  -- إضافة جدول products إن لم يكن مضافاً
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;
