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
  MessageCircle,
} from 'lucide-react';
import { DELIVERY_SLOTS, STORE_CONFIG } from '../../data/config';
import { AddressDetectionResult } from '../../data/deliveryZones';

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
  zoneDetection?: AddressDetectionResult;
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
  zoneDetection,
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
            placeholder="مثال: حي النرجس، عمارة 5 / طريق إيموزار..."
            className={`w-full px-4 py-3 rounded-xl border text-sm text-[#112616] bg-[#F7F4EC] focus:bg-white focus:outline-none transition-all placeholder:text-[#787163] ${
              zoneDetection?.status === 'rejected' || errors.street
                ? 'border-red-500 ring-2 ring-red-100'
                : zoneDetection?.status === 'accepted'
                ? 'border-emerald-500 ring-2 ring-emerald-100'
                : 'border-[#E8E1D3] focus:border-[#163920] focus:ring-2 focus:ring-[#163920]/15'
            }`}
          />

          {/* ✅ سيناريو 1: عنوان صحيح في فاس */}
          {zoneDetection?.status === 'accepted' && (
            <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs font-black text-emerald-950 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="text-base shrink-0">🟢</span>
                <div>
                  <span className="font-black text-emerald-900">{zoneDetection.zoneBadge}</span>
                  <span className="text-emerald-700 text-[11px] block font-bold">
                    وقت التوصيل التقديري: {zoneDetection.estimatedTime}
                  </span>
                </div>
              </div>
              <span className="bg-emerald-200/90 text-emerald-900 px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0">
                منطقة معتمدة ✓
              </span>
            </div>
          )}

          {/* ❌ سيناريو 2: عنوان خارج فاس */}
          {zoneDetection?.status === 'rejected' && (
            <div className="mt-2.5 p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-right space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2 text-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-xs sm:text-sm text-red-950">
                    ⚠️ خارج نطاق التوصيل
                  </p>
                  <p className="text-[11px] sm:text-xs text-red-700 font-medium leading-relaxed mt-0.5">
                    عذراً، متجر خُضرة يقدم خدماته حالياً حصرياً لمدينة فاس وأحيائها المعتمدة.
                  </p>
                </div>
              </div>

              {/* قائمة المناطق المعتمدة في فاس */}
              <div className="bg-white/90 p-2.5 rounded-xl border border-red-200 text-[11px] space-y-1.5">
                <p className="font-black text-stone-900 text-xs">المناطق المعتمدة للتوصيل بفاس:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-bold text-stone-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>المنطقة الشمالية: الأطلس، النرجس، سايس</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>المنطقة الوسطى: إيموزار، فلورنس، أكدال</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    <span>المنطقة الجنوبية: بنسودة، زواغة، عين هارون</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span>المنطقة الشرقية: طريق صفرو، الزهور، فاس البالي</span>
                  </div>
                </div>
              </div>

              {/* زر واتساب للاستفسار */}
              <a
                href={`https://wa.me/${STORE_CONFIG.whatsappCleanNumber}?text=${encodeURIComponent(
                  `السلام عليكم، أردت الاستفسار عن التوصيل لعنواني خارج فاس (${street})`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-black text-xs transition-all shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>تواصل معنا عبر واتساب للاستفسار</span>
              </a>
            </div>
          )}

          {/* ⚠️ سيناريو 3: عنوان غامض لا تطابق واضح -> لا تظهر رسالة إيجابية ولا سلبية ويُقبل الطلب ليراجعه المدير يدوياً */}

          {errors.street && zoneDetection?.status !== 'rejected' && (
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
