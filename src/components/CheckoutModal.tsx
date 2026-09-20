// ============================================================
// الملف: CheckoutModal.tsx – الإصدار 4.0
// تأكيد الطلب – مفكك ومعياري لسهولة الصيانة والتطوير
// ============================================================
import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Sparkles } from 'lucide-react';
import { CartItem, PaymentMethod, OrderSubmission } from '../types';
import { STORE_CONFIG, MOROCCAN_BANKS, DELIVERY_SLOTS } from '../data/config';
import {
  getClientId,
  getDeviceFingerprint,
  fetchClientIp,
  checkOrderCooldown,
  checkClientRateLimit,
  generateIdempotencyKey,
  validateMoroccanPhone,
  validateCustomerName,
  sanitizeInput,
} from '../services/securityService';
import {
  CheckoutCartSummary,
  CheckoutAddressSection,
  CheckoutPaymentSection,
  CheckoutSecuritySubmit,
} from './checkout';

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

  const validFirstSlot =
    DELIVERY_SLOTS.find(
      (slot) => slot.cutoffHour === null || currentHour < slot.cutoffHour
    )?.id || DELIVERY_SLOTS[DELIVERY_SLOTS.length - 1].id;

  // ─── بيانات الزبون والعنوان ───
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // ─── التوصيل والدفع ───
  const [deliverySlot, setDeliverySlot] = useState(validFirstSlot);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [selectedBankId, setSelectedBankId] = useState('barid');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // ─── الأخطاء وحالة الإرسال ───
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── أنظمة الحماية ومكافحة التكرار ───
  const [cooldown, setCooldown] = useState(() => checkOrderCooldown());
  const [rateLimit, setRateLimit] = useState(() => checkClientRateLimit());
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<string | null>(null);

  useEffect(() => {
    fetchClientIp().then((ip) => {
      if (ip) setIpAddress(ip);
    });

    const interval = setInterval(() => {
      setCooldown(checkOrderCooldown());
      setRateLimit(checkClientRateLimit());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ─── الحسابات المالية ───
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const isFreeDelivery = subtotal >= STORE_CONFIG.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : STORE_CONFIG.standardDeliveryFee;
  const grandTotal = subtotal + deliveryFee;
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  const currentBank =
    MOROCCAN_BANKS.find((b) => b.id === selectedBankId) || MOROCCAN_BANKS[0];

  const targetCity = 'فاس';

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
        setErrors((prev) => {
          const next = { ...prev };
          delete next.location;
          return next;
        });
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocationError('يرجى السماح بصلاحية الموقع (GPS) في المتصفح لتحديد موقع التوصيل بدقة');
        } else if (err.code === 2) {
          setLocationError('تعذر التقاط إحداثيات الموقع بدقة، يرجى تفعيل الـ GPS وإعادة المحاولة');
        } else {
          setLocationError('انتهت مهلة تحديد الموقع، يرجى إعادة المحاولة للتثبيت');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const generateGoogleMapsUrl = () => {
    if (locationCoords) {
      return `https://www.google.com/maps/search/?api=1&query=${locationCoords.lat},${locationCoords.lng}`;
    }
    const parts = [street.trim(), targetCity, 'المغرب'].filter(Boolean);
    if (!street.trim()) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join('، '))}`;
  };

  const getFullAddress = () => {
    const parts = [street.trim(), targetCity].filter(Boolean);
    return parts.join('، ');
  };

  const currentMapsUrl = generateGoogleMapsUrl();

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

    // 1. فحص الاسم
    const nameCheck = validateCustomerName(name);
    if (!nameCheck.valid) {
      newErrors.name = nameCheck.error || 'يرجى إدخال اسم صحيح';
    }

    // 2. فحص رقم الهاتف المغربي
    const phoneCheck = validateMoroccanPhone(phone);
    if (!phoneCheck.valid) {
      newErrors.phone = phoneCheck.error || 'يرجى إدخال رقم هاتف مغربي صحيح';
    }

    // 3. فحص تفاصيل العنوان
    const cleanStreet = sanitizeInput(street);
    if (!cleanStreet || cleanStreet.length < 3) {
      newErrors.street = 'يرجى إدخال اسم الشارع / الزنقة بوضوح';
    }

    if (!deliverySlot) {
      newErrors.deliverySlot = 'يرجى اختيار وقت التسليم المناسب';
    }

    if (paymentMethod === 'bank' && !receiptFile) {
      newErrors.receipt = 'يرجى إرفاق صورة أو وصل التحويل البنكي للمتابعة';
    }

    // 4. فحص الموقع الجغرافي (إلزامي لتأكيد التوصيل)
    if (!locationCoords || typeof locationCoords.lat !== 'number' || typeof locationCoords.lng !== 'number') {
      newErrors.location = 'يرجى تحديد موقعك الحالي (GPS) بدقة عبر الزر المخصص لإكمال تأكيد الطلب';
    }

    // 5. فحص عناصر السلة
    if (!items || items.length === 0) {
      newErrors.cart = 'السلة فارغة، يرجى اختيار بعض الخضر أو الفواكه أولاً';
    } else if (grandTotal <= 0 || grandTotal > 50000) {
      newErrors.cart = 'قيمة الطلب غير صحيحة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (cooldown.inCooldown) {
      setErrors((prev) => ({
        ...prev,
        security: `⏳ فترة التهدئة الأمنية مفعلة: يرجى الانتظار ${cooldown.remainingFormatted} قبل إرسال طلب جديد لنفس الزبون لتفادي التكرار.`,
      }));
      return;
    }

    if (!rateLimit.allowed) {
      setErrors((prev) => ({
        ...prev,
        security: `🛑 تجاوزت الحد الأقصى للطلبات في الساعة (3 طلبات). يرجى التواصل معنا عبر واتساب لمتابعة طلبك.`,
      }));
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    const orderCode = '#' + Math.floor(1000 + Math.random() * 9000);
    const chosenSlot =
      DELIVERY_SLOTS.find((s) => s.id === deliverySlot)?.label || deliverySlot;
    const fullAddress = getFullAddress() || sanitizeInput(street);
    const mapsLink = generateGoogleMapsUrl();

    const clientId = getClientId();
    const deviceFingerprint = getDeviceFingerprint();
    const phoneCheck = validateMoroccanPhone(phone);
    const cleanCustomerPhone = phoneCheck.cleanPhone || phone.trim();

    const idempotencyKey = generateIdempotencyKey(
      clientId,
      cleanCustomerPhone,
      grandTotal,
      totalItems
    );

    const submission: OrderSubmission = {
      orderCode,
      customerName: sanitizeInput(name),
      phone: cleanCustomerPhone,
      address: fullAddress,
      street: sanitizeInput(street),
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
      idempotencyKey,
      clientId,
      deviceFingerprint,
      ipAddress: ipAddress || undefined,
      turnstileToken: turnstileToken || 'verified_token',
      securityFlags: {
        verified_at: new Date().toISOString(),
        client_cooldown_passed: true,
        source: 'khodra_web_pwa',
      },
    };

    try {
      await onSubmitOrder(submission);
    } catch (err: any) {
      console.error('Submit order caught error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#FBF9F5] border border-[#E8E1D3] rounded-[24px] w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* ════════ Header ════════ */}
        <div className="relative p-4 sm:p-5 bg-gradient-to-l from-[#163920] to-[#0E2615] text-white flex items-center justify-between shrink-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,215,110,0.15),transparent_60%)] pointer-events-none" />

          <div className="relative flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-[#F5D76E]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black flex items-center gap-2">
                <span>تأكيد الطلب</span>
                <Sparkles className="w-4 h-4 text-[#F5D76E]" />
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100/90 font-bold">
                أكمل بياناتك لإتمام الطلب
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ════════ Scrollable Form Body ════════ */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 text-right"
        >
          {/* 1. ملخص السلة */}
          <CheckoutCartSummary
            items={items}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            isFreeDelivery={isFreeDelivery}
            grandTotal={grandTotal}
            totalItems={totalItems}
          />

          {/* 2. عنوان ووقت التوصيل الموحد */}
          <CheckoutAddressSection
            name={name}
            onNameChange={(val) => {
              setName(val);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            phone={phone}
            onPhoneChange={(val) => {
              setPhone(val);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
            }}
            street={street}
            onStreetChange={(val) => {
              setStreet(val);
              if (errors.street) setErrors((prev) => ({ ...prev, street: '' }));
            }}
            currentHour={currentHour}
            deliverySlot={deliverySlot}
            onSelectSlot={(slotId) => {
              setDeliverySlot(slotId);
              if (errors.deliverySlot) {
                setErrors((prev) => ({ ...prev, deliverySlot: '' }));
              }
            }}
            deliverySlotError={errors.deliverySlot}
            locationCoords={locationCoords}
            isLocating={isLocating}
            locationError={locationError}
            onGetLocation={handleGetLocation}
            currentMapsUrl={currentMapsUrl}
            errors={errors}
          />

          {/* 3. طريقة الدفع وتفاصيل التحويل البنكي */}
          <CheckoutPaymentSection
            paymentMethod={paymentMethod}
            onChangePaymentMethod={(method) => setPaymentMethod(method)}
            selectedBankId={selectedBankId}
            onSelectBankId={(id) => setSelectedBankId(id)}
            receiptFile={receiptFile}
            receiptPreview={receiptPreview}
            onFileChange={handleFileChange}
            receiptError={errors.receipt}
          />

          {/* 5. الأمان، التحقق، وزر التأكيد */}
          <CheckoutSecuritySubmit
            isSubmitting={isSubmitting}
            cooldown={cooldown}
            rateLimit={rateLimit}
            errors={errors}
            grandTotal={grandTotal}
            onTurnstileVerify={(token) => setTurnstileToken(token)}
          />
        </form>
      </div>
    </div>
  );
};
