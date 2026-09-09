import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  Upload, 
  AlertCircle, 
  Clock, 
  CreditCard, 
  Banknote, 
  Building2, 
  ShoppingBag, 
  Truck, 
  Shield,
  MapPin,
  LocateFixed,
  ExternalLink
} from 'lucide-react';
import { CartItem, PaymentMethod, OrderSubmission } from '../types';
import { STORE_CONFIG, MOROCCAN_BANKS, DELIVERY_SLOTS } from '../data/config';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onSubmitOrder: (order: OrderSubmission) => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onSubmitOrder,
}) => {
  if (!isOpen) return null;

  const currentHour = new Date().getHours();

  const validFirstSlot = DELIVERY_SLOTS.find(
    (slot) => slot.cutoffHour === null || currentHour < slot.cutoffHour
  )?.id || DELIVERY_SLOTS[DELIVERY_SLOTS.length - 1].id;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // حقول العنوان المنفصلة لتحديد موقع Google Maps بدقة (الدار البيضاء)
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');

  // حالة تحديد الموقع الجغرافي عبر GPS
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [deliverySlot, setDeliverySlot] = useState(validFirstSlot);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [selectedBankId, setSelectedBankId] = useState('barid');
  const [copiedRib, setCopiedRib] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const isFreeDelivery = subtotal >= STORE_CONFIG.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : STORE_CONFIG.standardDeliveryFee;
  const grandTotal = subtotal + deliveryFee;

  const currentBank = MOROCCAN_BANKS.find((b) => b.id === selectedBankId) || MOROCCAN_BANKS[0];

  // دالة التقاط موقع GPS تلقائياً
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('خاصية تحديد الموقع غير مدعومة في جهازك أو متصفحك');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setLocationCoords({
          lat: +pos.coords.latitude.toFixed(6),
          lng: +pos.coords.longitude.toFixed(6),
        });
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocationError('يرجى السماح بصلاحية الموقع من إعدادات المتصفح للالتقاط التلقائي');
        } else if (err.code === 2) {
          setLocationError('تعذر التقاط الموقع بدقة، يرجى كتابة تفاصيل العنوان');
        } else {
          setLocationError('انتهت مهلة تحديد الموقع، يمكنك متابعة كتابة العنوان يدوياً');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // توليد رابط Google Maps الرسمي (الدار البيضاء)
  const targetCity = 'الدار البيضاء';
  const generateGoogleMapsUrl = () => {
    if (locationCoords) {
      return `https://www.google.com/maps/search/?api=1&query=${locationCoords.lat},${locationCoords.lng}`;
    }
    const parts = [
      building.trim() ? `رقم ${building.trim()}` : '',
      street.trim(),
      targetCity,
      'المغرب'
    ].filter(Boolean);

    if (!street.trim()) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join('، '))}`;
  };

  // تجميع العنوان الكامل
  const getFullAddress = () => {
    const parts = [
      building.trim() ? `رقم ${building.trim()}` : '',
      street.trim(),
      targetCity,
    ].filter(Boolean);
    return parts.join('، ');
  };

  const currentMapsUrl = generateGoogleMapsUrl();

  const handleCopyRib = (rib: string) => {
    const cleanRib = rib.replace(/\s+/g, '');
    navigator.clipboard.writeText(cleanRib).then(() => {
      setCopiedRib(true);
      setTimeout(() => setCopiedRib(false), 2000);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, receipt: 'حجم الملف يجب ألا يتجاوز 5 ميغابايت' }));
      return;
    }

    setReceiptFile(file);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.receipt;
      return next;
    });

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 3) {
      newErrors.name = 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل)';
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      newErrors.phone = 'يرجى إدخال رقم هاتف صحيح للتواصل معك';
    }

    if (!street.trim() || street.trim().length < 3) {
      newErrors.street = 'يرجى إدخال اسم الشارع / الزنقة';
    }

    if (!deliverySlot) {
      newErrors.deliverySlot = 'يرجى اختيار وقت التسليم المناسب';
    }

    if (paymentMethod === 'bank' && !receiptFile) {
      newErrors.receipt = 'يرجى إرفاق صورة أو وصل التحويل البنكي للمتابعة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const orderCode = '#' + Math.floor(1000 + Math.random() * 9000);
    const chosenSlot = DELIVERY_SLOTS.find((s) => s.id === deliverySlot)?.label || deliverySlot;
    const fullAddress = getFullAddress() || street.trim();
    const mapsLink = generateGoogleMapsUrl();

    const submission: OrderSubmission = {
      orderCode,
      customerName: name.trim(),
      phone: phone.trim(),
      address: fullAddress,
      street: street.trim(),
      building: building.trim() || undefined,
      city: targetCity,
      coordinates: locationCoords || undefined,
      mapsLink: mapsLink || undefined,
      deliverySlot: chosenSlot,
      paymentMethod,
      bankId: paymentMethod === 'bank' ? currentBank.name : undefined,
      items,
      subtotal,
      deliveryFee,
      total: grandTotal,
      receiptFileName: receiptFile ? receiptFile.name : undefined,
      status: 'جاري التجهيز',
      created_at: new Date().toISOString(),
    };

    try {
      await onSubmitOrder(submission);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Modal Card - تقليل الزوايا الدائرية وتحسين التباين */}
        <div className="relative bg-[#FDFBF7] border border-[#D5CBB5] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#1B3420] text-white flex items-center justify-between shrink-0 shadow-xs">
            <div>
              <h2 className="text-base sm:text-xl font-black flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-300" />
                <span>تأكيد الطلب</span>
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5 font-medium">
                أدخل بياناتك واختر وقت التسليم وطريقة الدفع
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-right">

            {/* ─── ملخص السلة المحسن بعناية وتباين عالٍ ─── */}
            <div className="bg-white border border-[#DCD4C4] rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D1]">
                <span className="text-sm sm:text-base font-black text-[#1B3420] flex items-center gap-2">
                  <span className="text-xl">🧺</span>
                  <span>ملخص السلة</span>
                  <span className="bg-[#C25E12] text-white text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                    {items.length} منتج{items.length !== 1 ? 'ات' : ''}
                  </span>
                </span>
              </div>

              {/* قائمة المنتجات */}
              <div className="py-2.5 space-y-2 max-h-40 overflow-y-auto">
                {items.map((i) => (
                  <div key={i.key} className="flex items-center justify-between p-2.5 bg-[#FAF8F3] rounded-xl border border-[#E8E1D1]">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{i.icon}</span>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-black text-[#191816]">{i.name}</p>
                        <p className="text-xs text-[#524B3E] font-medium">
                          {i.variantLabel} {i.qty > 1 && `× ${i.qty}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-[#C25E12]">
                      {i.lineTotal.toFixed(2)} DH
                    </span>
                  </div>
                ))}
              </div>

              {/* تفاصيل التوصيل والإجمالي (تم حذف المجموع الفرعي) */}
              <div className="pt-3 border-t border-[#E8E1D1] space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[#453F33] font-bold flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#2E6B39]" />
                    <span>رسوم التوصيل:</span>
                  </span>
                  <span className="font-extrabold text-[#191816]">
                    {deliveryFee.toFixed(2)} DH
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t-2 border-[#C25E12]">
                  <span className="text-sm sm:text-base font-black text-[#191816] flex items-center gap-1.5">
                    <span>💰</span>
                    <span>الإجمالي الكلي:</span>
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[#C25E12]">
                    {grandTotal.toFixed(2)} DH
                  </span>
                </div>
              </div>
            </div>

            {/* ─── قسم عنوان التوصيل بالدار البيضاء (يشمل معلومات المستلم) ─── */}
            <div className="space-y-3.5">
              <div className="bg-gradient-to-l from-[#F7F4EC] to-[#FFF9F0] border border-[#DCD4C4] rounded-2xl p-4 sm:p-5 shadow-xs">
                <h3 className="text-sm sm:text-base font-black text-[#1B3420] flex items-center gap-2 pb-3 border-b border-[#E8E1D1]">
                  <MapPin className="w-5 h-5 text-[#C25E12]" />
                  <span>عنوان التوصيل بالدار البيضاء</span>
                </h3>

                <div className="space-y-3.5 pt-3">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#191816] mb-1.5">
                      الاسم الكامل <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: يوسف الإدريسي"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#191816] bg-white focus:outline-none transition-all placeholder:text-[#8C8474] ${
                        errors.name ? 'border-red-500 ring-2 ring-red-100' : 'border-[#D0C6B4] focus:border-[#2E6B39] focus:ring-2 focus:ring-[#2E6B39]/20'
                      }`}
                    />
                    {errors.name && <p className="text-red-600 text-xs font-semibold mt-1">{errors.name}</p>}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#191816] mb-1.5">
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0612345678 أو 0712345678"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#191816] bg-white focus:outline-none transition-all placeholder:text-[#8C8474] ${
                        errors.phone ? 'border-red-500 ring-2 ring-red-100' : 'border-[#D0C6B4] focus:border-[#2E6B39] focus:ring-2 focus:ring-[#2E6B39]/20'
                      }`}
                    />
                    {errors.phone && <p className="text-red-600 text-xs font-semibold mt-1">{errors.phone}</p>}
                  </div>

                  {/* 1. الشارع / الزنقة */}
                  <div>
                    <label className="block text-xs font-bold text-[#191816] mb-1">
                      الشارع / الزنقة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="مثال: شارع محمد الخامس"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-[#191816] bg-white focus:outline-none transition-all placeholder:text-[#8C8474] ${
                        errors.street ? 'border-red-500 ring-2 ring-red-100' : 'border-[#D0C6B4] focus:border-[#2E6B39] focus:ring-2 focus:ring-[#2E6B39]/20'
                      }`}
                    />
                    {errors.street && <p className="text-red-600 text-xs font-semibold mt-1">{errors.street}</p>}
                  </div>

                  {/* 2. رقم العمارة / المنزل / الطابق */}
                  <div>
                    <label className="block text-xs font-bold text-[#191816] mb-1">
                      رقم العمارة / المنزل / الطابق <span className="text-[#736B58] font-normal">(اختياري)</span>
                    </label>
                    <input
                      type="text"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      placeholder="مثال: 12 أو عمارة الأمل، طابق 2، شقة 4"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0C6B4] text-xs sm:text-sm text-[#191816] bg-white focus:outline-none focus:border-[#2E6B39] focus:ring-2 focus:ring-[#2E6B39]/20 transition-all placeholder:text-[#8C8474]"
                    />
                  </div>

                  {/* 3. زر [حدد موقعك الحالي📍] عبر GPS */}
                  <div className="pt-2 border-t border-[#E8E1D1]">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      className={`w-full py-2.5 px-3 rounded-xl border-2 text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        locationCoords
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-2xs hover:bg-emerald-100'
                          : 'bg-white hover:bg-[#FAF8F3] text-[#C25E12] border-[#D0C6B4] hover:border-[#C25E12] shadow-2xs'
                      }`}
                    >
                      {isLocating ? (
                        <>
                          <span className="w-4 h-4 border-2 border-[#C25E12] border-t-transparent rounded-full animate-spin" />
                          <span>جاري تحديد موقعك الجغرافي عبر GPS...</span>
                        </>
                      ) : locationCoords ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                          <span>تم تحديد موقعك الحالي بدقة</span>
                        </>
                      ) : (
                        <>
                          <LocateFixed className="w-4 h-4 text-[#C25E12]" />
                          <span>حدد موقعك الحالي📍</span>
                        </>
                      )}
                    </button>

                    {/* رسالة تنبيه الخطأ عند تعذر تحديد الموقع */}
                    {locationError && (
                      <p className="text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded-lg p-2 mt-2 flex items-center gap-1.5 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>{locationError}</span>
                      </p>
                    )}

                    {/* بطاقة رابط Google Maps المولد تلقائياً */}
                    {currentMapsUrl && (
                      <div className="mt-2.5">
                        <a
                          href={currentMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-emerald-50 border-2 border-emerald-500 text-emerald-900 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                        >
                          <span>google maps معاينة الرابط</span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── وقت التسليم مع خلفية منسقة ─── */}
            <div className="space-y-3 pt-2">
              <div className="bg-gradient-to-r from-[#1E4327] to-[#2A5D35] rounded-2xl p-4 sm:p-5 shadow-md">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-[#E8B93F]" />
                  <span>وقت التسليم المفضل</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DELIVERY_SLOTS.map((slot) => {
                    const isPassed = slot.cutoffHour !== null && currentHour >= slot.cutoffHour;
                    const isSelected = deliverySlot === slot.id;

                    return (
                      <label
                        key={slot.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isPassed
                            ? 'opacity-40 bg-gray-800 border-gray-600 cursor-not-allowed'
                            : isSelected
                            ? 'bg-white/20 border-[#E8B93F] ring-2 ring-[#E8B93F]/30 shadow-xs backdrop-blur-sm'
                            : 'bg-white/10 border-white/20 hover:border-[#E8B93F] hover:bg-white/15'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliverySlot"
                          value={slot.id}
                          disabled={isPassed}
                          checked={isSelected}
                          onChange={() => setDeliverySlot(slot.id)}
                          className="mt-1 accent-[#E8B93F] w-4 h-4 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className={`text-xs sm:text-sm font-black ${isPassed ? 'text-gray-400' : 'text-white'}`}>
                            {slot.label}
                          </span>
                          {isPassed && (
                            <span className="text-xs text-red-300 font-bold mt-0.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              انتهى حجز هذه الفترة
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.deliverySlot && (
                  <p className="text-red-300 text-xs font-semibold flex items-center gap-1 mt-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.deliverySlot}</span>
                  </p>
                )}
              </div>
            </div>

            {/* ─── طريقة الدفع ─── */}
            <div className="space-y-3 pt-2 border-t border-[#E8E1D1]">
              <h3 className="text-sm sm:text-base font-black text-[#1B3420] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C25E12]" />
                <span>طريقة الدفع</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'bg-emerald-50/70 border-[#2E6B39] ring-2 ring-[#2E6B39]/20 shadow-xs'
                      : 'bg-white border-[#D0C6B4] hover:border-[#2E6B39] hover:bg-[#FAF8F3]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-[#2E6B39] w-4 h-4 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-[#2E6B39]" />
                    <span className="text-xs sm:text-sm font-black text-[#191816]">الدفع عند الاستلام</span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'bank'
                      ? 'bg-emerald-50/70 border-[#2E6B39] ring-2 ring-[#2E6B39]/20 shadow-xs'
                      : 'bg-white border-[#D0C6B4] hover:border-[#2E6B39] hover:bg-[#FAF8F3]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    checked={paymentMethod === 'bank'}
                    onChange={() => setPaymentMethod('bank')}
                    className="accent-[#2E6B39] w-4 h-4 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#C25E12]" />
                    <span className="text-xs sm:text-sm font-black text-[#191816]">تحويل بنكي</span>
                  </div>
                </label>
              </div>

              {/* Bank Transfer Panel */}
              {paymentMethod === 'bank' && (
                <div className="bg-white border border-[#DCD4C4] rounded-2xl p-4 space-y-4 shadow-xs animate-in fade-in duration-200">
                  <div className="text-xs sm:text-sm font-black text-[#1B3420] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#C25E12]" />
                    <span>اختر الحساب المناسب للتحويل:</span>
                  </div>

                  {/* Bank Tabs */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {MOROCCAN_BANKS.map((b) => {
                      const cleanLabel = (b.shortName || b.name)
                        .replace(/(البريد|بريد|التجاري|البنك|بنك|القرض|كاش)/gi, '')
                        .replace(/[()\-–—]/g, '')
                        .trim();
                      const isSelected = selectedBankId === b.id;

                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBankId(b.id)}
                          className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                            isSelected
                              ? 'border-[#C25E12] ring-2 ring-[#C25E12]/25 shadow-xs bg-amber-50'
                              : 'border-[#D0C6B4] hover:border-[#C25E12]/60 hover:bg-[#FAF8F3] bg-white text-[#191816]'
                          }`}
                        >
                          <div className="w-full h-8 flex items-center justify-center mb-1">
                            {b.image ? (
                              <img
                                src={b.image}
                                alt={cleanLabel}
                                className="max-h-7 max-w-[50px] object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xl">{b.icon}</span>
                            )}
                          </div>
                          <span className="text-xs font-black truncate max-w-full text-[#191816]">
                            {cleanLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bank Account Details Card */}
                  <div className="bg-[#FAF8F3] border border-[#DCD4C4] rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-[#E8E1D1]">
                      <span className="text-xs sm:text-sm text-[#524B3E] font-bold">الحساب المعتمد:</span>
                      <div className="flex items-center gap-2">
                        {currentBank.image && (
                          <img
                            src={currentBank.image}
                            alt="Bank"
                            className="h-6 w-auto max-w-[55px] object-contain"
                          />
                        )}
                        <span className="font-black text-xs sm:text-sm text-[#1B3420]">
                          {(currentBank.shortName || currentBank.name)
                            .replace(/(البريد|بريد|التجاري|البنك|بنك|القرض|كاش)/gi, '')
                            .replace(/[()\-–—]/g, '')
                            .trim()}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-[#E8E1D1]">
                      <span className="text-xs sm:text-sm text-[#524B3E] font-bold">اسم المستفيد:</span>
                      <span className="font-black text-xs sm:text-sm text-[#2E6B39]">{currentBank.beneficiary}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-[#524B3E] font-bold">رقم الحساب (RIB):</span>
                        <button
                          type="button"
                          onClick={() => handleCopyRib(currentBank.rib)}
                          className="inline-flex items-center gap-1.5 text-xs font-black text-[#C25E12] hover:text-[#A34B07] bg-white px-3 py-1.5 rounded-lg border border-[#D0C6B4] transition-colors cursor-pointer shadow-2xs"
                        >
                          {copiedRib ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">تم النسخ ✓</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ الـ RIB</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3 rounded-lg bg-white font-mono text-center font-bold text-[#191816] tracking-wider text-xs sm:text-sm select-all border border-[#D0C6B4]">
                        {currentBank.rib}
                      </div>
                    </div>
                  </div>

                  {/* Receipt Upload Zone */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-[#191816] flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-[#C25E12]" />
                      <span>إرفاق وصل التحويل البنكي</span>
                      <span className="text-red-500">*</span>
                    </label>

                    <div className={`relative border-2 border-dashed rounded-xl p-5 text-center bg-white cursor-pointer transition-all group ${
                      receiptFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-[#D0C6B4] hover:border-[#C25E12] hover:bg-[#FAF8F3]'
                    }`}>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />

                      {receiptFile ? (
                        <div className="flex items-center justify-center gap-4">
                          {receiptPreview ? (
                            <img
                              src={receiptPreview}
                              alt="Receipt Preview"
                              className="w-16 h-16 object-cover rounded-lg border-2 border-emerald-300 shadow-xs"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border-2 border-emerald-300">
                              PDF
                            </div>
                          )}
                          <div className="text-right">
                            <p className="text-xs sm:text-sm font-black text-[#191816] truncate max-w-[200px]">
                              {receiptFile.name}
                            </p>
                            <span className="text-xs text-[#736B58]">
                              {(receiptFile.size / 1024).toFixed(1)} KB
                            </span>
                            <p className="text-xs text-emerald-700 font-extrabold mt-0.5">✓ تم رفع الملف</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 text-[#C25E12] group-hover:scale-110 transition-transform mb-2" />
                          <span className="text-xs sm:text-sm font-black text-[#191816]">
                            انقر هنا لاختيار صورة الوصل
                          </span>
                          <span className="text-xs text-[#736B58] mt-1 font-medium">
                            JPG, PNG, PDF (الحد الأقصى 5MB)
                          </span>
                        </div>
                      )}
                    </div>
                    {errors.receipt && (
                      <p className="text-red-600 text-xs font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errors.receipt}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ─── زر التأكيد ─── */}
            <div className="pt-3 border-t border-[#E8E1D1] space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#C25E12] to-[#A34B07] hover:from-[#B5550D] hover:to-[#924205] text-white font-black text-base shadow-md hover:shadow-lg active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جارٍ تسجيل الطلب...</span>
                  </>
                ) : (
                  <>
                    <span>تأكيد الطلب</span>
                    <span className="text-amber-200">—</span>
                    <span className="text-white font-black">
                      {grandTotal.toFixed(2)} DH
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-center text-xs text-[#524B3E] font-medium">
                <Shield className="w-4 h-4 text-[#2E6B39]" />
                <span>بياناتك مشفرة ومحمية بالكامل وتستخدم فقط لإتمام التوصيل</span>
              </div>
            </div>

          </form>
        </div>
      </div>
  );
};