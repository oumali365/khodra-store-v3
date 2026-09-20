// ============================================================
// الملف: CheckoutAddressSection.tsx
// مكوّن موحد: عنوان التوصيل + فترات التوصيل + تحديد الموقع بالـ GPS
// ============================================================
import React from 'react';
import {
  MapPin,
  Clock,
  AlertCircle,
  LocateFixed,
  Check,
  ExternalLink,
} from 'lucide-react';
import { DELIVERY_SLOTS } from '../../data/config';

interface CheckoutAddressSectionProps {
  name: string;
  onNameChange: (val: string) => void;
  phone: string;
  onPhoneChange: (val: string) => void;
  street: string;
  onStreetChange: (val: string) => void;
  currentHour: number;
  deliverySlot: string;
  onSelectSlot: (slotId: string) => void;
  deliverySlotError?: string;
  locationCoords: { lat: number; lng: number } | null;
  isLocating: boolean;
  locationError: string | null;
  onGetLocation: () => void;
  currentMapsUrl: string;
  errors: Record<string, string>;
}

export const CheckoutAddressSection: React.FC<CheckoutAddressSectionProps> = ({
  name,
  onNameChange,
  phone,
  onPhoneChange,
  street,
  onStreetChange,
  currentHour,
  deliverySlot,
  onSelectSlot,
  deliverySlotError,
  locationCoords,
  isLocating,
  locationError,
  onGetLocation,
  currentMapsUrl,
  errors,
}) => {
  return (
    <div className="bg-white border border-[#E8E1D3] rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0E9DA] mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#C25E12]/10 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-[#C25E12]" />
        </div>
        <h3 className="text-sm sm:text-base font-black text-[#112616]">
          عنوان وتوقيت التوصيل بمدينة فاس
        </h3>
      </div>

      <div className="space-y-3.5">
        {/* الاسم الكامل */}
        <div>
          <label className="block text-xs sm:text-sm font-black text-[#112616] mb-1.5">
            الاسم الكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="مثال: يوسف الإدريسي"
            className={`w-full px-4 py-3 rounded-xl border text-sm text-[#112616] bg-[#F7F4EC] focus:bg-white focus:outline-none transition-all placeholder:text-[#787163] ${
              errors.name
                ? 'border-red-500 ring-2 ring-red-100'
                : 'border-[#E8E1D3] focus:border-[#163920] focus:ring-2 focus:ring-[#163920]/15'
            }`}
          />
          {errors.name && (
            <p className="text-red-600 text-xs font-black mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* رقم الهاتف */}
        <div>
          <label className="block text-xs sm:text-sm font-black text-[#112616] mb-1.5">
            رقم الهاتف <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="0612345678"
            dir="ltr"
            className={`w-full px-4 py-3 rounded-xl border text-sm text-[#112616] bg-[#F7F4EC] focus:bg-white focus:outline-none transition-all placeholder:text-[#787163] ${
              errors.phone
                ? 'border-red-500 ring-2 ring-red-100'
                : 'border-[#E8E1D3] focus:border-[#163920] focus:ring-2 focus:ring-[#163920]/15'
            }`}
          />
          {errors.phone && (
            <p className="text-red-600 text-xs font-black mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.phone}</span>
            </p>
          )}
        </div>

        {/* الشارع / الحي */}
        <div>
          <label className="block text-xs sm:text-sm font-black text-[#112616] mb-1.5">
            الشارع / الزنقة / الحي <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={street}
            onChange={(e) => onStreetChange(e.target.value)}
            placeholder="شارع الحسن الثاني، طريق إيموزار..."
            className={`w-full px-4 py-3 rounded-xl border text-sm text-[#112616] bg-[#F7F4EC] focus:bg-white focus:outline-none transition-all placeholder:text-[#787163] ${
              errors.street
                ? 'border-red-500 ring-2 ring-red-100'
                : 'border-[#E8E1D3] focus:border-[#163920] focus:ring-2 focus:ring-[#163920]/15'
            }`}
          />
          {errors.street && (
            <p className="text-red-600 text-xs font-black mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.street}</span>
            </p>
          )}
        </div>

        {/* فترات التوصيل (مدمجة مباشرة داخل البطاقة فوق زر الموقع) */}
        <div className="pt-2 pb-1 border-t border-[#F0E9DA]">
          <div className="flex items-center gap-2 mb-2.5">
            <Clock className="w-4 h-4 text-[#C25E12]" />
            <label className="text-xs sm:text-sm font-black text-[#112616]">
              وقت التسليم المفضل <span className="text-red-500">*</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DELIVERY_SLOTS.map((slot) => {
              const isPassed =
                slot.cutoffHour !== null && currentHour >= slot.cutoffHour;
              const isSelected = deliverySlot === slot.id;

              return (
                <label
                  key={slot.id}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isPassed
                      ? 'opacity-40 bg-gray-100 border-gray-200 cursor-not-allowed'
                      : isSelected
                      ? 'bg-emerald-50/70 border-[#163920] ring-2 ring-[#163920]/20 shadow-sm'
                      : 'bg-[#F7F4EC] border-[#E8E1D3] hover:border-[#163920] hover:bg-white active:scale-[0.99]'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliverySlot"
                    value={slot.id}
                    disabled={isPassed}
                    checked={isSelected}
                    onChange={() => onSelectSlot(slot.id)}
                    className="mt-0.5 accent-[#163920] w-4 h-4 cursor-pointer"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-black text-[#112616] leading-snug">
                      {slot.label}
                    </span>
                    {isPassed && (
                      <span className="text-[11px] text-red-600 font-bold mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>انتهى حجز هذه الفترة</span>
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {deliverySlotError && (
            <p className="text-red-600 text-xs font-black flex items-center gap-1 mt-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{deliverySlotError}</span>
            </p>
          )}
        </div>

        {/* زر تحديد الموقع الحالي (إلزامي) */}
        <div className="pt-2 border-t border-[#F0E9DA]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <LocateFixed className="w-4 h-4 text-[#C25E12]" />
              <label className="text-xs sm:text-sm font-black text-[#112616]">
                تحديد الموقع الجغرافي (GPS) <span className="text-red-500">*</span>
              </label>
            </div>
            {locationCoords && (
              <span className="text-[11px] font-black text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                مُثبت ({locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onGetLocation}
            disabled={isLocating}
            className={`w-full min-h-[52px] py-3 px-4 rounded-xl border-2 text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer touch-manipulation select-none active:scale-[0.98] ${
              locationCoords
                ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-md'
                : errors.location
                ? 'bg-gradient-to-l from-[#163920] to-[#0E2615] text-white border-red-500 ring-2 ring-red-400 shadow-md'
                : 'bg-gradient-to-l from-[#163920] to-[#0E2615] text-white border-[#0E2615] shadow-md hover:shadow-lg'
            }`}
          >
            {isLocating ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري تحديد موقعك...</span>
              </>
            ) : locationCoords ? (
              <>
                <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                <span>تم تحديد موقعك بدقة</span>
              </>
            ) : (
              <>
                <LocateFixed className="w-5 h-5 text-[#F5D76E]" />
                <span>حدد موقعك الحالي</span>
              </>
            )}
          </button>

          {errors.location && !locationCoords && (
            <div className="mt-2.5 p-3 rounded-xl bg-red-50 border-2 border-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <p className="text-xs text-red-800 font-black leading-relaxed">{errors.location}</p>
            </div>
          )}

          {locationError && (
            <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-900 font-bold">{locationError}</p>
            </div>
          )}

          {currentMapsUrl && (
            <a
              href={currentMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-white hover:bg-emerald-50 active:scale-[0.98] border-2 border-emerald-500 text-emerald-900 font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>معاينة على الخريطة</span>
              <ExternalLink className="w-4 h-4 text-emerald-700 shrink-0" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
