-- ==============================================================================
-- 🚚 migration (Part B): 20261015000001_unified_orders_delivery_part_b.sql
-- ==============================================================================
ALTER TABLE public.orders VALIDATE CONSTRAINT orders_delivery_zone_check;
