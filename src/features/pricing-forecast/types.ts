// ============================================================
// src/features/pricing-forecast/types.ts
// تعريف أنواع نظام التسعير الديناميكي وإدارة الموردين وتوقع الطلب
// ============================================================

import type { ProductCategory } from '../../types';

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  rating: number; // 1 to 5
  notes?: string;
  is_active: boolean;
  created_at?: string;
}

export type PriceTrend = 'up' | 'down' | 'stable';

export interface ProductPriceRow {
  id: number;
  name: string;
  category: ProductCategory;
  unit_label: string;
  icon: string;
  image_url?: string;
  supplier_id: string;
  supplier_name: string;
  purchase_price: number;       // سعر الشراء بالدرهم
  margin_percentage: number;    // هامش الربح %
  selling_price: number;        // سعر البيع المحسوب تلقائياً
  yesterday_price: number;      // سعر الشراء بالأمس للمقارنة
  trend: PriceTrend;            // مؤشر الاتجاه
  is_modified?: boolean;        // مؤشر التعديل اللحظي
  last_updated?: string;
}

export interface DailyPriceDbRecord {
  id?: string;
  product_id: number;
  supplier_id: string;
  purchase_price: number;
  margin_percentage: number;
  selling_price: number;
  recorded_date: string;
  updated_at?: string;
}

export interface DaySalesPoint {
  dayName: string; // الإثنين، الثلاثاء...
  dayIndex: number; // 1 = Monday, 7 = Sunday
  volumeKg: number;
  orderCount: number;
}

export interface TopProductSalesHistory {
  productId: number;
  productName: string;
  icon: string;
  category: ProductCategory;
  totalVolume30Days: number;
  dailyDistribution: DaySalesPoint[];
  averagePerMonday: number;
  currentStockRecommendation: number;
  spikeDetected: boolean;
  spikePercentage: number;
}

export interface DemandForecastSummary {
  currentDayName: string;
  currentDayIndex: number;
  smartSuggestionText: string;
  recommendedTopItems: {
    productId: number;
    name: string;
    icon: string;
    quantityKg: number;
    trendNote: string;
  }[];
  aiSpikeAlerts: {
    id: string;
    title: string;
    message: string;
    severity: 'warning' | 'info' | 'critical';
    suggestedIncreasePercent: number;
  }[];
}
