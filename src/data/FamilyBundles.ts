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
  {
    id: 'bundle-small',
    name: 'صندوق عائلة صغيرة',
    tagline: 'مثالي لـ 2-3 أفراد',
    description: 'تشكيلة أسبوعية متوازنة من الخضر والفواكه الطازجة، تكفي عائلة صغيرة لمدة أسبوع كامل.',
    image: '/images/bundles/family-small.webp',
    size: 'small',
    peopleCount: '2-3 أفراد',
    itemCount: 9,
    weightRange: '6-8 كغ',
    price: 169,
    originalPrice: 199,
    savingsPercent: 15,
    items: [
      { productId: 'potato', qty: 1.5 },
      { productId: 'tomato', qty: 1 },
      { productId: 'onion', qty: 1 },
      { productId: 'carrot', qty: 1 },
      { productId: 'pepper', qty: 0.5 },
      { productId: 'zucchini', qty: 0.5 },
      { productId: 'spinach', qty: 0.5 },
      { productId: 'apple', qty: 1 },
      { productId: 'banana', qty: 1 },
    ],
    highlights: ['9 أصناف طازجة', 'توفير 30 درهم', 'توصيل مجاني'],
    badge: 'الأكثر طلباً',
    badgeColor: 'bg-emerald-600',
  },
  {
    id: 'bundle-medium',
    name: 'صندوق عائلة متوسطة',
    tagline: 'الخيار الأمثل لـ 4-5 أفراد',
    description: 'صندوق وفير يغطي احتياجات عائلة متوسطة لأسبوع كامل، مع تنوع أكبر في الأصناف.',
    image: '/images/bundles/family-medium.webp',
    size: 'medium',
    peopleCount: '4-5 أفراد',
    itemCount: 12,
    weightRange: '9-12 كغ',
    price: 209,
    originalPrice: 255,
    savingsPercent: 18,
    items: [
      { productId: 'potato', qty: 2 },
      { productId: 'tomato', qty: 1.5 },
      { productId: 'onion', qty: 1.5 },
      { productId: 'carrot', qty: 1 },
      { productId: 'pepper', qty: 1 },
      { productId: 'zucchini', qty: 1 },
      { productId: 'spinach', qty: 1 },
      { productId: 'pumpkin', qty: 1 },
      { productId: 'cucumber', qty: 1 },
      { productId: 'apple', qty: 1.5 },
      { productId: 'banana', qty: 1.5 },
      { productId: 'orange', qty: 1 },
    ],
    highlights: ['12 صنف متنوع', 'توفير 46 درهم', 'توصيل مجاني'],
    badge: 'أفضل قيمة',
    badgeColor: 'bg-[#C25E12]',
  },
  {
    id: 'bundle-large',
    name: 'صندوق عائلة كبيرة',
    tagline: 'لعائلات 6 أفراد وأكثر',
    description: 'صندوق ضخم يلبي احتياجات العائلات الكبيرة، مع أصناف مميزة وإمكانية التخصيص.',
    image: '/images/bundles/family-large.webp',
    size: 'large',
    peopleCount: '6+ أفراد',
    itemCount: 15,
    weightRange: '13-16 كغ',
    price: 279,
    originalPrice: 349,
    savingsPercent: 20,
    items: [
      { productId: 'potato', qty: 3 },
      { productId: 'tomato', qty: 2 },
      { productId: 'onion', qty: 2 },
      { productId: 'carrot', qty: 1.5 },
      { productId: 'pepper', qty: 1 },
      { productId: 'zucchini', qty: 1.5 },
      { productId: 'spinach', qty: 1 },
      { productId: 'pumpkin', qty: 1 },
      { productId: 'cucumber', qty: 1.5 },
      { productId: 'eggplant', qty: 1 },
      { productId: 'apple', qty: 2 },
      { productId: 'banana', qty: 2 },
      { productId: 'orange', qty: 1.5 },
      { productId: 'avocado', qty: 0.5 },
      { productId: 'herbs', qty: 0.5 },
    ],
    highlights: ['15 صنف مميز', 'توفير 70 درهم', 'توصيل مجاني + تخصيص'],
    badge: 'وفّر أكثر',
    badgeColor: 'bg-purple-600',
  },
];