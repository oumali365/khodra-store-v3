// src/data/familyBundles.ts

export interface BundleItem {
  productId: string;
  qty: number;
}

export interface FamilyBundle {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  size: 'small' | 'medium' | 'large';
  peopleCount: string;
  itemCount: number;
  weightRange: string;
  price: number;
  originalPrice: number;
  savingsPercent: number;
  items: BundleItem[];
  highlights: string[];
  badge?: string;
  badgeColor?: string;
}

export const FAMILY_BUNDLES: FamilyBundle[] = [
  // ═══════════════════════════════════════════════════════════
  // 🧺 الصندوق الصغير — عائلة 2-3 أفراد
  // ═══════════════════════════════════════════════════════════
  {
    id: 'bundle-small',
    name: 'صندوق عائلة صغيرة',
    tagline: 'مثالي لـ 2-3 أفراد',
    description: 'تشكيلة أسبوعية متوازنة من الخضر والفواكه الطازجة، تكفي عائلة صغيرة لمدة أسبوع كامل — بدون ما تحتاج تسوق.',
    image: '/images/bundles/family-small.webp',
    size: 'small',
    peopleCount: '2-3 أفراد',
    itemCount: 9,
    weightRange: '6-8 كغ',
    price: 169,
    originalPrice: 199,
    savingsPercent: 15,
    items: [
      { productId: '2', qty: 1.5 },  // بطاطس
      { productId: '1', qty: 1 },    // طماطم
      { productId: '3', qty: 1 },    // بصل أحمر
      { productId: '5', qty: 0.5 },  // جزر
      { productId: '8', qty: 0.5 },  // فلفل أخضر
      { productId: '10', qty: 0.5 }, // كوسة
      { productId: '19', qty: 0.5 }, // سبانخ
      { productId: '21', qty: 1 },   // تفاح أحمر
      { productId: '23', qty: 1 },   // موز
    ],
    highlights: ['9 أصناف طازجة', 'توفير 30 درهم', 'توصيل مجاني'],
    badge: 'الأكثر طلباً',
    badgeColor: 'bg-emerald-600',
  },

  // ═══════════════════════════════════════════════════════════
  // 🧺 الصندوق المتوسط — عائلة 4-5 أفراد
  // ═══════════════════════════════════════════════════════════
  {
    id: 'bundle-medium',
    name: 'صندوق عائلة متوسطة',
    tagline: 'الخيار الأمثل لـ 4-5 أفراد',
    description: 'صندوق وفير يغطي احتياجات عائلة متوسطة لأسبوع كامل، مع تنوع أكبر في الأصناف وجودة مضمونة.',
    image: '/images/bundles/family-medium.webp',
    size: 'medium',
    peopleCount: '4-5 أفراد',
    itemCount: 12,
    weightRange: '9-12 كغ',
    price: 209,
    originalPrice: 255,
    savingsPercent: 18,
    items: [
      { productId: '2', qty: 2 },    // بطاطس
      { productId: '1', qty: 1.5 },  // طماطم
      { productId: '3', qty: 1.5 },  // بصل أحمر
      { productId: '5', qty: 1 },    // جزر
      { productId: '8', qty: 1 },    // فلفل أخضر
      { productId: '10', qty: 1 },   // كوسة
      { productId: '19', qty: 1 },   // سبانخ
      { productId: '9', qty: 1 },    // باذنجان
      { productId: '6', qty: 1 },    // خيار
      { productId: '21', qty: 1.5 }, // تفاح أحمر
      { productId: '23', qty: 1.5 }, // موز
      { productId: '24', qty: 1 },   // برتقال
    ],
    highlights: ['12 صنف متنوع', 'توفير 46 درهم', 'توصيل مجاني'],
    badge: 'أفضل قيمة',
    badgeColor: 'bg-[#C25E12]',
  },

  // ═══════════════════════════════════════════════════════════
  // 🧺 الصندوق الكبير — عائلة 6+ أفراد
  // ═══════════════════════════════════════════════════════════
  {
    id: 'bundle-large',
    name: 'صندوق عائلة كبيرة',
    tagline: 'لعائلات 6 أفراد وأكثر',
    description: 'صندوق ضخم يلبي احتياجات العائلات الكبيرة، مع أصناف مميزة وإمكانية التخصيص حسب رغبتك.',
    image: '/images/bundles/family-large.webp',
    size: 'large',
    peopleCount: '6+ أفراد',
    itemCount: 15,
    weightRange: '13-16 كغ',
    price: 279,
    originalPrice: 349,
    savingsPercent: 20,
    items: [
      { productId: '2', qty: 3 },    // بطاطس
      { productId: '1', qty: 2 },    // طماطم
      { productId: '3', qty: 2 },    // بصل أحمر
      { productId: '5', qty: 1.5 },  // جزر
      { productId: '8', qty: 1 },    // فلفل أخضر
      { productId: '10', qty: 1.5 }, // كوسة
      { productId: '19', qty: 1 },   // سبانخ
      { productId: '9', qty: 1 },    // باذنجان
      { productId: '6', qty: 1.5 },  // خيار
      { productId: '11', qty: 0.5 }, // ملوخية
      { productId: '21', qty: 2 },   // تفاح أحمر
      { productId: '23', qty: 2 },   // موز
      { productId: '24', qty: 1.5 }, // برتقال
      { productId: '31', qty: 0.5 }, // أفوكادو
      { productId: '12', qty: 0.5 }, // بقدونس (أعشاب)
    ],
    highlights: ['15 صنف مميز', 'توفير 70 درهم', 'توصيل مجاني + تخصيص'],
    badge: 'وفّر أكثر',
    badgeColor: 'bg-purple-600',
  },
];