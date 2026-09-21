# دليل تنظيم وتسمية صور المنتجات (Product Images Guide)

تم تهيئة هذه المجلدات لاستقبال صور المنتجات بحسب الفئات المعتمدة في المتجر وقاعدة بيانات Supabase:

## 📁 هيكل المجلدات والمسارات:

| الفئة في المتجر | مسار المجلد | مثال لرابط الصورة في Supabase (`image_url`) |
|-----------------|-------------|-------------------------------------------|
| **خضروات** | `/public/products/veg/` | `/products/veg/tomato.webp` |
| **فواكه** | `/public/products/fruit/` | `/products/fruit/orange.webp` |
| **ألبان وأجبان** | `/public/products/dairy/` | `/products/dairy/milk.webp` |
| **بقالة ومونة** | `/public/products/grocery/` | `/products/grocery/olive-oil.webp` |
| **عصائر ومشروبات** | `/public/products/drinks/` | `/products/drinks/juice.webp` |
| **نظافة وعناية** | `/public/products/cleaning/` | `/products/cleaning/soap.webp` |
| **صناديق العائلة** | `/public/products/boxes/` | `/products/boxes/family-box-1.webp` |

> 💡 **ملاحظة:** تم إنشاء روابط متكافئة تلقائياً للمسارات التالية لضمان التوافق مع أي تسمية استخدمتها في الـ SQL:
> - `/products/fruits/` تفتح تلقائياً نفس مجلد `/products/fruit/`
> - `/products/vegetables/` تفتح تلقائياً نفس مجلد `/products/veg/`
> - `/images/products/` تفتح تلقائياً نفس مجلد `/products/`

## 🎨 توصيات تحسين الصور لأفضل سرعة وأداء:
1. **الصيغة المفضلة:** `WebP` (أو `JPG` مضغوط).
2. **الأبعاد المثالية:** أبعاد مربعة `500x500` بكسل أو `600x600` بكسل.
3. **الحجم:** أقل من `70` كيلوبايت للصورة لضمان التحميل الفوري.
4. **تسمية الملفات:** استخدم الحروف الإنجليزية الصغيرة والشرطة `-` (مثال: `apple-royal.webp` بدلاً من أسماء تحتوي على فراغات).
