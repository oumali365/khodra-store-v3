import { BankAccount, DeliverySlot } from '../types';

export const STORE_CONFIG = {
  storeName: 'خُضرة',
  tagline: 'خضر وفواكه طازجة توصيل لباب منزلك',
  city: 'فاس والنواحي',
  whatsappNumber: '+212704274830',
  whatsappCleanNumber: '212704274830',
  currency: 'DH',
  standardDeliveryFee: 15,
  freeDeliveryThreshold: 250,
  freshnessMaxItems: 12,
  weightStep: 1,
  weightMax: 10,
  cacheKey: 'khodra_cart_v2',
  adminPin: '090909',
  supabaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://ywoxhwvxsuowaiqbtqdr.supabase.co',
  supabaseAnonKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3b3hod3Z4c3Vvd2FpcWJ0cWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDEzMjQsImV4cCI6MjEwMzA3NzMyNH0.Eit183FqRg-XcTobm_pccJpCf9A6bvEjTq2woJdvG-Y',
  cloudflareTurnstileSiteKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY) || '',
};

export const MOROCCAN_BANKS: BankAccount[] = [
  {
    id: 'barid',
    name: 'Al BARID (Barid Bank)',
    shortName: 'Al BARID',
    image: '/images/banks/barid-banque.webp',
    icon: '📮',
    rib: '350 810 0000000000000012 45',
    beneficiary: 'خُضرة فريش',
    city: 'فاس'
  },
  {
    id: 'chaabi',
    name: 'CHAABI (Banque Populaire)',
    shortName: 'CHAABI',
    image: '/images/banks/banque-populaire.webp',
    icon: '🐎',
    rib: '210 780 0000000000000034 67',
    beneficiary: 'خُضرة فريش',
    city: 'فاس'
  },
  {
    id: 'cih',
    name: 'CIH (العقاري والسياحي)',
    shortName: 'CIH',
    image: '/images/banks/cih-bank.webp',
    icon: '🏛️',
    rib: '230 640 0000000000000056 89',
    beneficiary: 'خُضرة فريش',
    city: 'فاس'
  },
  {
    id: 'tijjari',
    name: 'TIJJARI (Attijariwafa)',
    shortName: 'TIJJARI',
    image: '/images/banks/attijariwafa-bank.webp',
    icon: '🦅',
    rib: '007 810 0000000000000078 21',
    beneficiary: 'خُضرة فريش',
    city: 'فاس'
  },
  {
    id: 'boafrica',
    name: 'BMCE (Bank of Africa)',
    shortName: 'BMCE',
    image: '/images/banks/bank-of-africa.webp',
    icon: '🌍',
    rib: '000 240 0000000000000090 12',
    beneficiary: 'خُضرة فريش',
    city: 'فاس'
  },
  {
    id: 'cashplus',
    name: 'CASHPLUS (Cash Plus)',
    shortName: 'CASHPLUS',
    image: '/images/banks/cash-plus.webp',
    icon: '⚡',
    rib: '222 180 0000000000000100 34',
    beneficiary: 'خُضرة فريش',
    city: 'فاس'
  }
];

export const DELIVERY_SLOTS: DeliverySlot[] = [
  {
    id: 'instant_express',
    label: '⚡ توصيل فوري (inDrive Express خلال 45-60 دقيقة)',
    cutoffHour: 20,
    periodText: 'فوري الآن',
    isInstant: true,
  },
  {
    id: 'today_10_12',
    label: 'اليوم 10:00 و 12:00 (صباحاً)',
    cutoffHour: 9,
    periodText: 'صباحاً'
  },
  {
    id: 'today_18_21',
    label: 'اليوم 18:00 و 21:00 (مساءً)',
    cutoffHour: 18,
    periodText: 'مساءً'
  },
  {
    id: 'tomorrow_10_12',
    label: 'غداً 10:00 و 12:00 (صباحاً)',
    cutoffHour: null,
    periodText: 'صباحاً'
  },
  {
    id: 'tomorrow_18_21',
    label: 'غداً 18:00 و 21:00 (مساءً)',
    cutoffHour: null,
    periodText: 'مساءً'
  }
];

// ─── تقسيم مناطق فاس إلى مسارات ذكية (Smart Route Batching) ───
export const FEZ_DELIVERY_ZONES = {
  north: {
    id: 'north',
    name: 'المنطقة الشمالية',
    neighborhoods: ['أكدال', 'الشارع الملكي', 'طريق إيموزار', 'الأطلس', 'المدينة الجديدة', 'ملعب الخيل'],
    targetTime: '20-30 دقيقة',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: '#059669',
    description: 'شوارع واسعة، حركة سريعة للدراجات',
  },
  central: {
    id: 'central',
    name: 'المنطقة الوسطى',
    neighborhoods: ['النرجس', 'سايس', 'المرينيين', 'حي طارق', 'مونفلوري', 'عين قادوس'],
    targetTime: '25-35 دقيقة',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    color: '#d97706',
    description: 'كثافة سكانية عالية، طلبات أسرية متقاربة',
  },
  south: {
    id: 'south',
    name: 'المنطقة الجنوبية',
    neighborhoods: ['بنسودة', 'عين هارون', 'زواغة', 'حي الأمل', 'طريق صفرو'],
    targetTime: '30-40 دقيقة',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
    color: '#ea580c',
    description: 'قرب نقطة تموين الجملة ببنسودة',
  },
  other: {
    id: 'other',
    name: 'أحياء فاس الأخرى',
    neighborhoods: ['فاس البالي', 'الرصيف', 'عين الشقف والنواحي'],
    targetTime: '35-50 دقيقة',
    badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-300',
    color: '#71717a',
    description: 'مسافات متباعدة أو أزقة المشاة',
  },
} as const;

// ─── شركات وتطبيقات التوصيل الفوري بفاس ───
export const DELIVERY_PROVIDERS = [
  {
    id: 'indrive' as const,
    name: 'inDrive Delivery',
    tagline: 'الأساسي (90%) - تفاوض مباشر وتكلفة مناسبة',
    badgeClass: 'bg-emerald-600 text-white',
    icon: '🚴',
    appUrl: 'https://indrive.com',
    recommended: true,
    avgCost: '20-30 د.م',
  },
  {
    id: 'done' as const,
    name: 'DONE Delivery',
    tagline: 'احتياطي وقت الذروة (24/7)',
    badgeClass: 'bg-indigo-600 text-white',
    icon: '⚡',
    appUrl: 'https://done.ma',
    recommended: false,
    avgCost: '25-35 د.م',
  },
  {
    id: 'yassir' as const,
    name: 'Yassir Express',
    tagline: 'أسطول دراجات واسع بمدينة فاس',
    badgeClass: 'bg-red-600 text-white',
    icon: '🛵',
    appUrl: 'https://yassir.com',
    recommended: false,
    avgCost: '25-35 د.م',
  },
  {
    id: 'glovo' as const,
    name: 'Glovo Express',
    tagline: 'توصيل فوري ممتاز (30-45 دقيقة)',
    badgeClass: 'bg-amber-500 text-black font-bold',
    icon: '🟡',
    appUrl: 'https://glovoapp.com',
    recommended: false,
    avgCost: '30-45 د.م',
  },
  {
    id: 'custom' as const,
    name: 'كابتن خُضرة (مندوب خاص)',
    tagline: 'سائق المتجر الدائم بالدراجة النارية',
    badgeClass: 'bg-teal-700 text-white',
    icon: '🌿',
    appUrl: '',
    recommended: false,
    avgCost: 'داخلي',
  },
];

// نقطة التجميع والتموين الأساسية
export const STORE_PICKUP_HUB = {
  name: 'سوق الجملة للخضر والفواكه بنسودة / مقر خُضرة',
  address: 'المنطقة الصناعية بنسودة، فاس',
  mapsLink: 'https://maps.google.com/?q=Bensouda+Wholesale+Market+Fes',
};

