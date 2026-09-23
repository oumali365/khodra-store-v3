# 🗄️ دليل إدارة وتحديث قاعدة بيانات Supabase – متجر خُضرة فاس 🌿

تمت إعادة هيكلة وبرمجة جميع ملفات استعلامات SQL في مجلد `/supabase` بالكامل لتكون موحدة، متزامنة 100% مع تطبيق المتجر، وتستبدل الـ 19 استعلاماً القديمة المتفرقة في لوحة تحكم Supabase.

---

## 🎯 حل مشكلة "عند حذف الطلبات تختفي ولكنها تعود للظهور"

### سبب المشكلة سابقاً:
1. عند الضغط على حذف الطلب في لوحة الإدارة، كان الاستعلام ينفذ حذفاً مرناً (`soft delete`) بتعيين `is_deleted = true` أو `deleted_at = NOW()`.
2. في المقابل، كانت دالة جلب الطلبات `get_orders_secure` تستعلم الجدول بدون فلترة شرطية صارمة `WHERE (is_deleted IS NULL OR is_deleted = FALSE) AND (deleted_at IS NULL)`.
3. عند تحديث الصفحة أو استقبال إشعار Realtime، كانت الدالة تعيد قراءة كافة السجلات بما فيها المحذوفة، فتعود للظهور مجدداً في واجهة الإدارة.
4. كذلك لم تكن الطلبات تُمسح من الذاكرة التخزينية الاحتياطية للمتصفح (`localStorage`).

### الحل المطبق الآن:
- **في قاعدة البيانات:** دالة `get_orders_secure` تستثني كلياً وبشكل حازم أي صف يحمل `is_deleted = TRUE` أو `deleted_at IS NOT NULL`.
- **دعم الحذف القطعي (Hard Delete) والحذف المرن (Soft Delete):** دالة `delete_order_secure` توفر خيار الحذف النهائي أو الحذف المرن بدون أي ارتداد، بالإضافة لدالة `purge_deleted_orders_secure` لتفريغ سلة المهملات.
- **في كود التطبيق (`supabaseService.ts`):** تنظيف فوري متزامن للطلب من `localStorage` وفلترة أحداث Realtime اللحظية لمنع إعادة إدراج الطلب المحذوف.

---

## 📁 هيكلية ملفات SQL الجديدة وتطابقها مع الاستعلامات الـ 19 القديمة

| اسم الملف الجديد | الاستعلامات القديمة الـ 19 التي يدمجها ويعوضها | الوظيفة والمحتوى |
| :--- | :--- | :--- |
| **`00_master_setup.sql`** | **يعوض كافة الاستعلامات الـ 19 دفعة واحدة** | **الملف الشامل الموحد (All-in-One)**: ينفذ التنظيف وإنشاء الجداول، الحماية، دوال RPC، السياسات، بيانات المنتجات، والتزامن اللحظي في خطوة واحدة. |
| `01_schema_tables.sql` | `orders table`, `products table`, `customer reviews`, `creat table orders`, `add column if not exists`, `allow table order note`, `product category`, `origin products`, `store settings key` | إنشاء وتحديث جداول `products`, `orders`, `reviews`, `store_settings`, `order_security_logs` مع كافة الأعمدة والمؤشرات والفهارس المتقدمة. |
| `02_security_and_triggers.sql` | `store security`, `Untitled query` | فحص صحة الهاتف المغربي، فترة التهدئة Cooldown (3 دقائق)، سقف الطلبات Rate Limit (3 طلبات/ساعة)، وفهرس Idempotency الفريد لمنع تكرار الطلبات. |
| `03_functions_and_rpc.sql` | `Functions`, `orders admin pin`, `read orders`, `orders status`, `soft delete` | دوال الخادم الآمنة برمز PIN: `get_orders_secure`, `update_order_status_secure`, `delete_order_secure`, `purge_deleted_orders_secure`, `delete_review_secure`. |
| `04_rls_policies.sql` | `RLS policies`, `allow public insert` | سياسات أمان الصفوف: إتاحة إرسال الطلبات للزبائن دون كشف بيانات الزبائن الآخرين، وحصر القراءة للمدير. |
| `05_seed_data.sql` | `products values`, `store settings key` | البيانات الأولية: إعدادات المتجر (PIN = `090909`), تقييمات الزبائن لمدينة فاس، وكافة المنتجات الـ 100 بتسعيرتها وأصولها وتصنيفاتها الـ 6 الكاملة. |
| `06_realtime_setup.sql` | التزامن اللحظي | تفعيل `supabase_realtime` و `REPLICA IDENTITY FULL` للبث الفوري عند إضافة طلب أو حذفه. |
| `07_cleanup_and_reset.sql` | تنظيف التضاربات | حذف الدوال والتريغرات والسياسات القديمة المتضاربة لتهيئة بيئة نظيفة. |

---

## 🚀 طريقة التثبيت في لوحة Supabase (خطوة واحدة فقط)

1. سجل الدخول إلى [لوحة تحكم Supabase](https://supabase.com/dashboard).
2. ادخل إلى مشروع متجرك (Project).
3. اضغط من القائمة الجانبية على **SQL Editor** 📝.
4. يمكنك **حذف كافة الاستعلامات القديمة الـ 19** لتنظيف اللوحة نهائياً.
5. أنشئ استعلاماً جديداً (`+ New Query`).
6. انسخ كامل محتوى الملف:  
   👉 **`/supabase/00_master_setup.sql`**
7. الصقه في محرر SQL واضغط **Run** (أو `Ctrl + Enter`).
8. ستظهر لك رسالة نجاح `Success. No rows returned` أو `COMMIT`.

---

## 🔑 بيانات الاعتماد الافتراضية
- **رمز المدير (Admin PIN):** `090909` (يمكن تغييره في أي وقت من جدول `store_settings` بقيمة المفتاح `admin_pin`).
- **المسارات الذكية الأربعة بفاس:** `north` (الشمالية), `central` (الوسطى), `south` (الجنوبية), `east` (الشرقية).
