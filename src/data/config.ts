import { BankAccount, DeliverySlot } from '../types';

export const STORE_CONFIG = {
  storeName: 'خُضرة',
  tagline: 'خضر وفواكه طازجة توصيل لباب منزلك',
  city: 'فاس والنواحي',
  whatsappNumber: '+212704274830',
  whatsappCleanNumber: '212704274830',
  currency: 'د.ر',
  standardDeliveryFee: 15,
  freeDeliveryThreshold: 185,
  freshnessMaxItems: 12,
  weightStep: 1,
  weightMax: 10,
  cacheKey: 'khodra_cart_v2',
  adminPin: '1234',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://ywoxhwvxsuowaiqbtqdr.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3b3hod3Z4c3Vvd2FpcWJ0cWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDEzMjQsImV4cCI6MjEwMzA3NzMyNH0.Eit183FqRg-XcTobm_pccJpCf9A6bvEjTq2woJdvG-Y',
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
