// ─── أنواع فئات المنتجات ───
export type ProductCategory = 
  | 'all' 
  | 'veg' 
  | 'fruit' 
  | 'dairy' 
  | 'grocery' 
  | 'drinks' 
  | 'cleaning';

export type ProductType = 'weight' | 'unit';

// ─── واجهة المنتج ───
export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  type: ProductType;
  price: number;
  unit_label?: string;
  stock: number;
  icon: string;
  image_url?: string;
  active: boolean;
  description?: string;
  origin?: string;
}

// ─── واجهة عنصر السلة ───
export interface CartItem {
  key: string;
  id: number;                    // ← مُصحَّح: كان string، أصبح number
  name: string;
  icon: string;
  image_url?: string;            // ← جديد: لدعم صور المنتجات في السلة
  variantLabel: string;
  unitTotal: number;
  qty: number;
  lineTotal: number;
  bundleId?: string;             // ← جديد (اختياري): لمعرفة إن كان من صندوق
}

// ─── أنواع الدفع ───
export type PaymentMethod = 'cod' | 'bank';

// ─── واجهة الحساب البنكي ───
export interface BankAccount {
  id: string;
  name: string;
  shortName?: string;
  image?: string;
  icon: string;
  rib: string;
  beneficiary: string;
  city: string;
}

// ─── واجهة وقت التسليم ───
export interface DeliverySlot {
  id: string;
  label: string;
  cutoffHour: number | null;
  periodText: string;
}

// ─── واجهة تقديم الطلب ───
export interface OrderSubmission {
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  street?: string;
  building?: string;
  neighborhood?: string;
  city?: string;
  coordinates?: { lat: number; lng: number };
  mapsLink?: string;
  notes?: string;
  deliverySlot: string;
  paymentMethod: PaymentMethod;
  bankId?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  receiptFileName?: string;
  status: string;
  created_at: string;
}