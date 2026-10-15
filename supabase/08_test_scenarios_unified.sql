-- ==============================================================================
-- 🧪 سكريبت اختبار شامل ومحاكاة الأدوار (BEGIN / ROLLBACK)
-- ==============================================================================

BEGIN;

-- 1. محاكاة زائر عام (anon) يحاول حقن أعمدة إدارية عند الإنشاء
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role": "anon"}', true);

INSERT INTO public.orders (order_code, customer_name, phone, address, items, subtotal, total, driver_id, dispatch_status, zone_source)
VALUES ('TEST-ANON-01', 'زبون عام', '0611111111', 'طريق إيموزار فاس', '[]'::jsonb, 50, 50, 'drv-1', 'out_for_delivery', 'manual');

-- التحقق من تحييد الحقول الإدارية:
SELECT order_code, driver_id, dispatch_status, zone_source 
FROM public.orders WHERE order_code = 'TEST-ANON-01';


-- 2. محاكاة مستخدم مصادق عليه (authenticated غير مدير) يحاول تعديل dispatch_status
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "user-123", "role": "authenticated"}', true);

UPDATE public.orders
SET dispatch_status = 'out_for_delivery'
WHERE order_code = 'TEST-ANON-01';

SELECT order_code, dispatch_status 
FROM public.orders WHERE order_code = 'TEST-ANON-01';


-- 3. محاكاة مدير النظام (Admin) يقوم بالتعديل والإسناد
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object(
  'sub', 'admin-uuid',
  'role', 'authenticated',
  'app_metadata', json_build_object('role', 'admin')
)::text, true);

UPDATE public.orders
SET driver_id = 'drv-1',
    driver_type = 'store',
    dispatch_status = 'assigned'
WHERE order_code = 'TEST-ANON-01';

SELECT order_code, driver_id, dispatch_status 
FROM public.orders WHERE order_code = 'TEST-ANON-01';


-- 4. اختبار إلغاء طلب مسند (يجب أن يتم تحرير السائق تلقائياً)
UPDATE public.orders
SET status = 'cancelled'
WHERE order_code = 'TEST-ANON-01';

SELECT order_code, status, dispatch_status, driver_id 
FROM public.orders WHERE order_code = 'TEST-ANON-01';


-- 5. اختبار محاولة إسناد طلب ملغي (يجب أن يفشل الاستثناء)
DO $$
BEGIN
  UPDATE public.orders
  SET dispatch_status = 'assigned'
  WHERE order_code = 'TEST-ANON-01';
  RAISE EXCEPTION 'TEST_FAILED: Should have blocked assigning a cancelled order';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SUCCESS: Blocked assigning cancelled order with error: %', SQLERRM;
END $$;


-- 6. اختبار دالة إغلاق الجولة close_zone_tour_atomic على طلب بحالة prepared
INSERT INTO public.orders (order_code, customer_name, phone, address, items, subtotal, total, status)
VALUES ('TEST-TOUR-02', 'زبون جولة', '0622222222', 'حي الأطلس فاس', '[]'::jsonb, 150, 150, 'prepared');

SELECT public.close_zone_tour_atomic(
  ARRAY[(SELECT id::TEXT FROM public.orders WHERE order_code = 'TEST-TOUR-02')],
  'drv-2',
  'رشيد بنجلون',
  '0672345678',
  25.00,
  NULL
);

SELECT order_code, status, dispatch_status, delivered_at 
FROM public.orders WHERE order_code = 'TEST-TOUR-02';

ROLLBACK;
