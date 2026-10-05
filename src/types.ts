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
  isInstant?: boolean;
}

// ─── شركات وتطبيقات التوصيل الفوري بفاس ───
export type DeliveryProvider = 'indrive' | 'done' | 'yassir' | 'glovo' | 'custom';

export type DeliveryDispatchStatus =
  | 'ready_for_pickup'
  | 'waiting_driver'
  | 'picked_up'
  | 'in_transit'
  | 'delivered';

export type FezZoneId = 'north' | 'central' | 'south' | 'east';

// ─── سائقو الفريق الداخلي للمتجر ───
export type DriverVehicleType = 'moto' | 'car' | 'van' | 'scooter' | 'bicycle';

export type DriverStatus = 'available' | 'on_delivery' | 'off_duty';

export interface StoreDriver {
  id: string;
  name: string;
  phone: string;
  vehicleType: DriverVehicleType;
  zonePreference: FezZoneId | 'all';
  status: DriverStatus;
  commissionPerOrder: number; // مثلاً 20 أو 25 درهم
  vehiclePlate?: string;
  notes?: string;
  activeOrdersCount?: number;
  totalDeliveredCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryDispatchInfo {
  provider: DeliveryProvider;
  driverName?: string;
  driverPhone?: string;
  deliveryCost?: number;
  trackingCode?: string;
  dispatchStatus: DeliveryDispatchStatus;
  dispatchedAt?: string;
  zone?: FezZoneId;
  notes?: string;
  packagingType?: string;
}

// ─── واجهة تقديم الطلب (مع دعم الحماية ومكافحة الطلبات المزيفة) ───
export interface OrderSubmission {
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  delivery_zone?: FezZoneId;
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
  // ─── حقول الأمان والتتبع ───
  idempotencyKey?: string;
  clientId?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  turnstileToken?: string;
  securityFlags?: Record<string, any>;
}