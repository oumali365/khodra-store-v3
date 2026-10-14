// ============================================================
// constants.ts - الثوابت والتكوينات لأسطول التوصيل بفاس
// ============================================================

import React from 'react';
import { Bike, Car, Truck } from 'lucide-react';
import type {
  DriverVehicleType,
  DriverStatus,
  FezZoneId,
  FastDeliveryApp,
  DriverFormData,
  FastCourierFormData,
  ZoneStyle,
  FastAppCourier,
} from './types';

export const VEHICLE_CONFIG: Record<
  DriverVehicleType,
  { label: string; icon: string; iconComponent: React.ComponentType<{ className?: string }> }
> = {
  moto: { label: 'دراجة نارية', icon: '🏍️', iconComponent: Bike },
  car: { label: 'سيارة', icon: '🚗', iconComponent: Car },
  van: { label: 'فان / شاحنة', icon: '🚐', iconComponent: Truck },
  scooter: { label: 'سكوتر', icon: '🛵', iconComponent: Bike },
  bicycle: { label: 'دراجة هوائية', icon: '🚲', iconComponent: Bike },
};

export const STATUS_CONFIG: Record<
  DriverStatus,
  { label: string; badge: string; dot: string }
> = {
  available: {
    label: 'متاح وجاهز',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  on_delivery: {
    label: 'في جولة توصيل',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    dot: 'bg-amber-500',
  },
  off_duty: {
    label: 'خارج الخدمة',
    badge: 'bg-stone-100 text-stone-700 border-stone-300',
    dot: 'bg-stone-400',
  },
};

export const ZONE_STYLES: Record<FezZoneId, ZoneStyle> = {
  east: {
    border: 'border-purple-300 hover:border-purple-500',
    bg: 'bg-purple-50/60',
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    headerBg: 'bg-purple-600',
    accentText: 'text-purple-800',
    tagColor: 'text-purple-600',
  },
  central: {
    border: 'border-amber-300 hover:border-amber-500',
    bg: 'bg-amber-50/60',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    headerBg: 'bg-amber-600',
    accentText: 'text-amber-800',
    tagColor: 'text-amber-600',
  },
  south: {
    border: 'border-orange-300 hover:border-orange-500',
    bg: 'bg-orange-50/60',
    badge: 'bg-orange-100 text-orange-900 border-orange-300',
    headerBg: 'bg-orange-600',
    accentText: 'text-orange-800',
    tagColor: 'text-orange-600',
  },
  north: {
    border: 'border-emerald-300 hover:border-emerald-500',
    bg: 'bg-emerald-50/60',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    headerBg: 'bg-emerald-600',
    accentText: 'text-emerald-800',
    tagColor: 'text-emerald-600',
  },
};

export const DEFAULT_DRIVER_FORM: DriverFormData = {
  name: '',
  phone: '',
  vehicleType: 'moto',
  zonePreference: 'all',
  status: 'available',
  commissionPerOrder: 25,
  vehiclePlate: '',
  address: '',
  notes: '',
};

export const DEFAULT_FAST_COURIER_FORM: FastCourierFormData = {
  name: '',
  app: 'indrive',
  appNameCustom: '',
  phone: '',
  vehicleType: 'moto',
  zone: 'all',
  typicalFare: 20,
  notes: '',
};

export const APP_BADGES: Record<FastDeliveryApp, { label: string; style: string }> = {
  indrive: { label: 'inDrive', style: 'bg-emerald-900 text-emerald-100 border-emerald-700' },
  glovo: { label: 'Glovo', style: 'bg-amber-400 text-amber-950 border-amber-500 font-black' },
  yassir: { label: 'Yassir', style: 'bg-rose-700 text-white border-rose-800 font-black' },
  careem: { label: 'Careem', style: 'bg-emerald-600 text-white border-emerald-700' },
  other: { label: 'تطبيق آخر', style: 'bg-stone-700 text-stone-100 border-stone-800' },
};

export const DEFAULT_FAST_COURIERS: FastAppCourier[] = [
  {
    id: 'fast-courier-glovo-1',
    name: 'سعيد الادريسي',
    app: 'glovo',
    phone: '0665653232',
    vehicleType: 'moto',
    zone: 'north',
    typicalFare: 25,
    notes: 'كابتن غلوفو - تغطية المنطقة الشمالية',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fast-courier-indrive-1',
    name: 'حميد التازي',
    app: 'indrive',
    phone: '0662348300',
    vehicleType: 'moto',
    zone: 'central',
    typicalFare: 25,
    notes: 'كابتن إندرايف - تغطية المنطقة الوسطى والأطلس',
    createdAt: new Date().toISOString(),
  },
];

export const FLEET_ZONES: FezZoneId[] = ['east', 'central', 'south', 'north'];
