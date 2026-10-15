-- ==============================================================================
-- 🚚 migration (Part A): 20261015000000_unified_orders_delivery_part_a.sql
-- ==============================================================================

-- 1. إضافة الأعمدة الجديدة لجدول orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS zone_source TEXT DEFAULT 'auto' CHECK (zone_source IN ('auto', 'manual')),
  ADD COLUMN IF NOT EXISTS driver_id TEXT,
  ADD COLUMN IF NOT EXISTS driver_type TEXT CHECK (driver_type IN ('store', 'fast_app')),
  ADD COLUMN IF NOT EXISTS dispatch_status TEXT DEFAULT 'unassigned' CHECK (dispatch_status IN ('unassigned', 'assigned', 'out_for_delivery', 'delivered', 'failed')),
  ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_delivery_time TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. ضبط قيد delivery_zone بصيغة NOT VALID
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_delivery_zone_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_zone_check 
  CHECK (delivery_zone IS NULL OR delivery_zone IN ('north', 'central', 'south', 'east'))
  NOT VALID;

-- 3. التريغجر الأمني (يعتمد على public.is_admin() الموجود، ولا يعيد تعريفه)
CREATE OR REPLACE FUNCTION public.guard_order_status_drift()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
  v_is_elevated BOOLEAN;
BEGIN
  v_role := auth.role();
  -- NULL = اتصال مباشر بقاعدة البيانات (مثل محرر SQL أو الترحيلات)
  v_is_elevated := COALESCE(public.is_admin(), false) OR v_role = 'service_role' OR v_role IS NULL;

  IF TG_OP = 'INSERT' THEN
    IF NOT v_is_elevated THEN
      NEW.driver_id := NULL;
      NEW.driver_type := NULL;
      NEW.dispatch_status := 'unassigned';
      NEW.dispatched_at := NULL;
      NEW.delivered_at := NULL;
      NEW.zone_source := 'auto';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT v_is_elevated THEN
      -- منع العميل/authenticated غير المدير من تعديل الأعمدة الإدارية
      NEW.driver_id := OLD.driver_id;
      NEW.driver_type := OLD.driver_type;
      NEW.dispatch_status := OLD.dispatch_status;
      NEW.dispatched_at := OLD.dispatched_at;
      NEW.delivered_at := OLD.delivered_at;
      NEW.zone_source := OLD.zone_source;
    END IF;
  END IF;

  -- 3. تصحيح مسار الإلغاء
  -- منع إسناد طلب ملغي مسبقاً
  IF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' AND NEW.dispatch_status IN ('assigned', 'out_for_delivery') THEN
    RAISE EXCEPTION 'INVALID_ORDER_STATE: cannot assign or dispatch a cancelled order';
  END IF;

  -- عند تحويل الطلب إلى ملغي: تحرير السائق تلقائياً
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    IF OLD.dispatch_status = 'out_for_delivery' THEN
      NEW.dispatch_status := 'failed';
    ELSE
      NEW.dispatch_status := 'unassigned';
    END IF;
    NEW.driver_id := NULL;
    NEW.driver_type := NULL;
  END IF;

  -- التحقق من صحة حالات الشحن
  IF NEW.dispatch_status = 'out_for_delivery' AND NEW.status <> 'prepared' THEN
    RAISE EXCEPTION 'INVALID_ORDER_STATE: out_for_delivery requires status = prepared';
  END IF;

  IF NEW.dispatch_status = 'delivered' AND NEW.status <> 'delivered' THEN
    RAISE EXCEPTION 'INVALID_ORDER_STATE: dispatch_status delivered requires status = delivered';
  END IF;

  IF NEW.status = 'delivered' AND NEW.dispatch_status <> 'delivered' THEN
    NEW.dispatch_status := 'delivered';
    IF NEW.delivered_at IS NULL THEN
      NEW.delivered_at := NOW();
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_order_drift ON public.orders;
CREATE TRIGGER trg_guard_order_drift
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_order_status_drift();
