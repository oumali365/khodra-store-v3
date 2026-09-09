import { BankAccount, DeliverySlot } from '../types';

export const STORE_CONFIG = {
  storeName: 'خُضرة',
  tagline: 'خضر وفواكه طازجة توصيل لباب منزلك',
  city: 'الدار البيضاء والنواحي',
  whatsappNumber: '+212704274830',
  whatsappCleanNumber: '212704274830',
  currency: 'د.ر',
  standardDeliveryFee: 15,
  freeDeliveryThreshold: 185,
  freshnessMaxItems: 12,
  weightStep: 1,
  weightMax: 10,
  cacheKey: 'khodra_cart_v2',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://ywoxhwvxsuowaiqbtqdr.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3b3hod3Z4c3Vvd2FpcWJ0cWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDEzMjQsImV4cCI6MjEwMzA3NzMyNH0.Eit183FqRg-XcTobm_pccJpCf9A6bvEjTq2woJdvG-Y',
};

export const MOROCCAN_BANKS: BankAccount[] = [
  {
    id: 'barid',
    name: 'Al Barid (Barid Bank)',
    shortName: 'Al Barid',
    image: '/images/banks/barid-banque.webp',
    icon: '📮',
    rib: '350 810 0000000000000012 45',
    beneficiary: 'شركة خُضرة فريش ش.م.م (KHODRA FRESH SARL)',
    city: 'الدار البيضاء'
  },
  {
    id: 'chaabi',
    name: 'الشعبي (Banque Populaire)',
    shortName: 'الشعبي',
    image: '/images/banks/banque-populaire.webp',
    icon: '🐎',
    rib: '210 780 0000000000000034 67',
    beneficiary: 'شركة خُضرة فريش ش.م.م (KHODRA FRESH SARL)',
    city: 'الدار البيضاء'
  },
  {
    id: 'cih',
    name: 'CIH (العقاري والسياحي)',
    shortName: 'CIH',
    image: '/images/banks/cih-bank.webp',
    icon: '🏛️',
    rib: '230 640 0000000000000056 89',
    beneficiary: 'شركة خُضرة فريش ش.م.م (KHODRA FRESH SARL)',
    city: 'الدار البيضاء'
  },
  {
    id: 'tijjari',
    name: 'وفا (Attijariwafa)',
    shortName: 'وفا',
    image: '/images/banks/attijariwafa-bank.webp',
    icon: '🦅',
    rib: '007 810 0000000000000078 21',
    beneficiary: 'شركة خُضرة فريش ش.م.م (KHODRA FRESH SARL)',
    city: 'الدار البيضاء'
  },
  {
    id: 'boafrica',
    name: 'أفريقيا (Bank of Africa)',
    shortName: 'أفريقيا',
    image: '/images/banks/bank-of-africa.webp',
    icon: '🌍',
    rib: '000 240 0000000000000090 12',
    beneficiary: 'شركة خُضرة فريش ش.م.م (KHODRA FRESH SARL)',
    city: 'الدار البيضاء'
  },
  {
    id: 'cashplus',
    name: 'بلوس (Cash Plus)',
    shortName: 'بلوس',
    image: '/images/banks/cash-plus.webp',
    icon: '⚡',
    rib: '222 180 0000000000000100 34',
    beneficiary: 'شركة خُضرة فريش ش.م.م (KHODRA FRESH SARL)',
    city: 'الدار البيضاء'
  }
];

export const DELIVERY_SLOTS: DeliverySlot[] = [
  {
    id: 'today_09_12',
    label: 'اليوم بين 09:00 و 12:00 (صباحاً)',
    cutoffHour: 9,
    periodText: 'صباحاً'
  },
  {
    id: 'today_14_16',
    label: 'اليوم بين 14:00 و 16:00 (بعد الزوال)',
    cutoffHour: 14,
    periodText: 'بعد الزوال'
  },
  {
    id: 'today_18_21',
    label: 'اليوم بين 18:00 و 21:00 (مساءً)',
    cutoffHour: 18,
    periodText: 'مساءً'
  },
  {
    id: 'tomorrow_09_12',
    label: 'غداً بين 09:00 و 12:00 (غداً صباحاً)',
    cutoffHour: null,
    periodText: 'غداً صباحاً'
  },
  {
    id: 'tomorrow_16_20',
    label: 'غداً بين 16:00 و 20:00 (توصيل مسائي)',
    cutoffHour: null,
    periodText: 'غداً مساءً'
  }
];
