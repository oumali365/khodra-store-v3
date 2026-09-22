-- ============================================================
-- 02_delivery_zones_and_status_hardening.sql
-- إضافة دعم المسارات الذكية الأربعة (فاس) وتحديث حالات الطلبات
-- متجر خُضرة - فاس
-- ============================================================

-- 1. إضافة عمود delivery_zone لجدول الطلبات (orders) مع تقييد القيم المعتمدة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_zone'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_zone TEXT DEFAULT 'north';
    
    -- إضافة قيد التحقق للمسارات الأربعة المعتمدة بفاس
    ALTER TABLE orders ADD CONSTRAINT check_valid_delivery_zone 
      CHECK (delivery_zone IN ('north', 'central', 'south', 'east'));
  END IF;
END $$;

-- 2. فهرسة حقل المنطقة لتسريع استعلامات لوحة التحكم ومسارات السائقين
CREATE INDEX IF NOT EXISTS idx_orders_delivery_zone ON orders (delivery_zone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders (created_at DESC);

-- 3. تحديث الطلبات القديمة التي لا تملك مساراً مسجلاً بحسب الكلمات المفتاحية في العنوان
UPDATE orders
SET delivery_zone = CASE
  -- المنطقة الشرقية
  WHEN lower(address) ~ '(صفرو|sefrou|زهور|zouhour|بلخياط|رصيف|rcif|باب بوجلود|boujloud|الأندلس|andalous|ملاح|mellah|فاس البالي|سيدي بوجيدة|باب الفتوح)' THEN 'east'
  -- المنطقة الجنوبية
  WHEN lower(address) ~ '(بنسودة|bensouda|هارون|عين هارون|زواغة|zouagha|أمل|amal|دكارات|dokkarat|صناع|حي الوفاق)' THEN 'south'
  -- المنطقة الوسطى
  WHEN lower(address) ~ '(إيموزار|imouzzer|فلورنس|florence|أكدال|agdal|ملعب الخيل|champ de course|الجيش الملكي|bourguiba|باطا|bata|تاونات)' THEN 'central'
  -- المنطقة الشمالية
  ELSE 'north'
END
WHERE delivery_zone IS NULL OR delivery_zone NOT IN ('north', 'central', 'south', 'east');

-- 4. إتاحة حقل delivery_zone في سياسات القراءة والكتابة
COMMENT ON COLUMN orders.delivery_zone IS 'مسار التوصيل الذكي بفاس: north, central, south, east';
