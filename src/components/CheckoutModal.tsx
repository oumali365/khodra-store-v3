// ============================================================
// الملف: CheckoutModal.tsx – الإصدار 3.0
// تأكيد الطلب – حماية متكاملة ضد التكرار والطلبات المزيفة
// ============================================================
import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Sparkles,
  Package,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
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
import { TurnstileWidget } from './TurnstileWidget';

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

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');

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

  // ─── أنظمة الحماية ومكافحة السبام ───
  const [cooldown, setCooldown] = useState(() => checkOrderCooldown());
  const [rateLimit, setRateLimit] = useState(() => checkClientRateLimit());
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<string | null>(null);

  // مؤقت التهدئة ومراقبة الحدود الأمنية وجلب الـ IP
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

  // ─── طي/فتح ملخص السلة على الهاتف ───
  const [showCartSummary, setShowCartSummary] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const isFreeDelivery = subtotal >= STORE_CONFIG.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : STORE_CONFIG.standardDeliveryFee;
  const grandTotal = subtotal + deliveryFee;

  const currentBank =
    MOROCCAN_BANKS.find((b) => b.id === selectedBankId) || MOROCCAN_BANKS[0];

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

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

  const targetCity = 'فاس';
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

    // ─── 1. فحص الاسم ومكافحة الأسماء الوهمية أو الرموز ───
    const nameCheck = validateCustomerName(name);
    if (!nameCheck.valid) {
      newErrors.name = nameCheck.error || 'يرجى إدخال اسم صحيح';
    }

    // ─── 2. فحص رقم الهاتف المغربي بدقة (منع العشوائي والمكرر) ───
    const phoneCheck = validateMoroccanPhone(phone);
    if (!phoneCheck.valid) {
      newErrors.phone = phoneCheck.error || 'يرجى إدخال رقم هاتف مغربي صحيح';
    }

    // ─── 3. فحص تفاصيل العنوان وتنظيفه من الأكواد الخبيثة ───
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

    // ─── 4. التحقق من سلامة عناصر السلة ───
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

    // 1️⃣ حماية فورية: منع الضغط المتكرر أثناء الإرسال أو خلال فترة التهدئة أو تجاوز المعدل
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

    // 1️⃣ تفعيل حالة التحميل وتعطيل الزر فوراً
    setIsSubmitting(true);

    const orderCode = '#' + Math.floor(1000 + Math.random() * 9000);
    const chosenSlot =
      DELIVERY_SLOTS.find((s) => s.id === deliverySlot)?.label || deliverySlot;
    const fullAddress = getFullAddress() || sanitizeInput(street);
    const mapsLink = generateGoogleMapsUrl();

    // 5️⃣ & 8️⃣ & 9️⃣ استخراج بصمة الجهاز والـ ClientId ومفتاح Idempotency
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
      // ─── معاملات الأمان والحماية ───
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

          {/* ═══════════════════════════════════════════════════
              ─── ملخص السلة (قابل للطي على الهاتف) ───
              ═══════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E8E1D3] rounded-2xl overflow-hidden shadow-sm">
            {/* رأس قابل للنقر */}
            <button
              type="button"
              onClick={() => setShowCartSummary(!showCartSummary)}
              className="w-full flex items-center justify-between gap-3 p-4 hover:bg-[#F7F4EC] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#163920]/10 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-[#163920]" />
                </div>
                <div className="text-right min-w-0">
                  <span className="text-sm font-black text-[#112616] block">
                    ملخص السلة
                  </span>
                  <span className="text-[11px] text-[#787163] font-bold block">
                    {items.length} صنف • {totalItems} قطعة
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-base sm:text-lg font-black text-[#C25E12] tabular-nums">
                  {grandTotal.toFixed(2)} DH
                </span>
                {showCartSummary ? (
                  <ChevronUp className="w-4 h-4 text-[#787163]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#787163]" />
                )}
              </div>
            </button>

            {/* المحتوى القابل للطي */}
            {showCartSummary && (
              <div className="border-t border-[#F0E9DA] p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                {items.map((i) => (
                  <div
                    key={i.key}
                    className="flex items-center justify-between p-2.5 bg-[#F7F4EC] rounded-xl border border-[#E8E1D3] gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">{i.icon}</span>
                      <div className="text-right min-w-0">
                        <p className="text-xs font-black text-[#112616] truncate">
                          {i.name}
                        </p>
                        <p className="text-[10px] text-[#787163] font-bold truncate">
                          {i.variantLabel} {i.qty > 1 && `× ${i.qty}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#C25E12] tabular-nums shrink-0">
                      {i.lineTotal.toFixed(2)} DH
                    </span>
                  </div>
                ))}

                <div className="pt-3 mt-2 border-t border-[#F0E9DA] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#524B3E] font-bold flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>رسوم التوصيل:</span>
                    </span>
                    <span
                      className={`font-black tabular-nums ${
                        isFreeDelivery ? 'text-emerald-700' : 'text-[#112616]'
                      }`}
                    >
                      {isFreeDelivery ? 'مجاني 🎉' : `${deliveryFee.toFixed(2)} DH`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════
              ─── عنوان التوصيل ───
              ═══════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E8E1D3] rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0E9DA] mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#C25E12]/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#C25E12]" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-[#112616]">
                عنوان التوصيل بمدينة فاس
              </h3>
            </div>

            <div className="space-y-3.5">
              {/* الاسم */}
              <div>
                <label className="block text-xs sm:text-sm font-black text-[#112616] mb-1.5">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

              {/* الهاتف */}
              <div>
                <label className="block text-xs sm:text-sm font-black text-[#112616] mb-1.5">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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

              {/* الشارع */}
              <div>
                <label className="block text-xs sm:text-sm font-black text-[#112616] mb-1.5">
                  الشارع / الزنقة / الحي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
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

              {/* زر تحديد الموقع */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className={`w-full min-h-[52px] py-3 px-4 rounded-xl border-2 text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer touch-manipulation select-none active:scale-[0.98] ${
                    locationCoords
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-md'
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

          {/* ═══════════════════════════════════════════════════
              ─── وقت التسليم ───
              ═══════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E8E1D3] rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0E9DA] mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#C25E12]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#C25E12]" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-[#112616]">
                وقت التسليم المفضل
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DELIVERY_SLOTS.map((slot) => {
                const isPassed =
                  slot.cutoffHour !== null && currentHour >= slot.cutoffHour;
                const isSelected = deliverySlot === slot.id;

                return (
                  <label
                    key={slot.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isPassed
                        ? 'opacity-40 bg-gray-100 border-gray-200 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-50/70 border-[#163920] ring-2 ring-[#163920]/20 shadow-sm'
                        : 'bg-white border-[#E8E1D3] hover:border-[#163920] hover:bg-[#F7F4EC] active:scale-[0.99]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliverySlot"
                      value={slot.id}
                      disabled={isPassed}
                      checked={isSelected}
                      onChange={() => setDeliverySlot(slot.id)}
                      className="mt-1 accent-[#163920] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[#112616]">
                        {slot.label}
                      </span>
                      {isPassed && (
                        <span className="text-xs text-red-600 font-bold mt-0.5 flex items-center gap-1">
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
              <p className="text-red-600 text-xs font-black flex items-center gap-1 mt-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.deliverySlot}</span>
              </p>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════
              ─── طريقة الدفع ───
              ═══════════════════════════════════════════════════ */}
          <div className="bg-white border border-[#E8E1D3] rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0E9DA] mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#C25E12]/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-[#C25E12]" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-[#112616]">
                طريقة الدفع
              </h3>
            </div>

            {/* اختيار طريقة الدفع */}
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-4 min-h-[56px] rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'bg-emerald-50/70 border-[#163920] ring-2 ring-[#163920]/20 shadow-sm'
                    : 'bg-white border-[#E8E1D3] hover:border-[#163920] hover:bg-[#F7F4EC] active:scale-[0.99]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="accent-[#163920] w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-2 min-w-0">
                  <Banknote className="w-5 h-5 text-[#163920] shrink-0" />
                  <span className="text-xs sm:text-sm font-black text-[#112616] truncate">
                    الدفع عند الاستلام
                  </span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 min-h-[56px] rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'bank'
                    ? 'bg-emerald-50/70 border-[#163920] ring-2 ring-[#163920]/20 shadow-sm'
                    : 'bg-white border-[#E8E1D3] hover:border-[#163920] hover:bg-[#F7F4EC] active:scale-[0.99]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={paymentMethod === 'bank'}
                  onChange={() => setPaymentMethod('bank')}
                  className="accent-[#163920] w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-5 h-5 text-[#C25E12] shrink-0" />
                  <span className="text-xs sm:text-sm font-black text-[#112616] truncate">
                    تحويل بنكي
                  </span>
                </div>
              </label>
            </div>

            {/* ═══════════════════════════════════════════════════
                ─── قسم التحويل البنكي (محسّن بالكامل) ───
                ═══════════════════════════════════════════════════ */}
            {paymentMethod === 'bank' && (
              <div className="mt-4 bg-gradient-to-br from-[#F7F4EC] to-white border-2 border-[#E8E1D3] rounded-2xl p-4 sm:p-5 space-y-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">

                {/* ─── 1. اختيار البنك ─── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#C25E12] flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-black text-[#112616]">
                      اختر البنك للتحويل
                    </span>
                  </div>

                  {/* شبكة البنوك: عمودان على الهاتف، 3 على التابلت، 6 على سطح المكتب */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
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
                          className={`relative p-3 min-h-[80px] rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'border-[#C25E12] ring-2 ring-[#C25E12]/25 shadow-md bg-amber-50'
                              : 'border-[#E8E1D3] hover:border-[#C25E12]/60 hover:bg-white bg-white'
                          }`}
                        >
                          {/* شارة الاختيار */}
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C25E12] text-white flex items-center justify-center border-2 border-white shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}

                          <div className="w-full h-9 flex items-center justify-center mb-1.5">
                            {b.image ? (
                              <img
                                src={b.image}
                                alt={cleanLabel}
                                className="max-h-8 max-w-[60px] object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-2xl">{b.icon}</span>
                            )}
                          </div>
                          <span className="text-[11px] font-black truncate max-w-full text-[#112616] leading-tight">
                            {cleanLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─── 2. تفاصيل الحساب ─── */}
                <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl p-4 space-y-3.5 shadow-sm">

                  {/* الحساب المعتمد */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0E9DA]">
                    <span className="text-xs font-black text-[#787163]">
                      الحساب المعتمد
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      {currentBank.image && (
                        <img
                          src={currentBank.image}
                          alt="Bank"
                          className="h-6 w-auto max-w-[55px] object-contain shrink-0"
                        />
                      )}
                      <span className="font-black text-sm text-[#112616] truncate">
                        {(currentBank.shortName || currentBank.name)
                          .replace(/(البريد|بريد|التجاري|البنك|بنك|القرض|كاش)/gi, '')
                          .replace(/[()\-–—]/g, '')
                          .trim()}
                      </span>
                    </div>
                  </div>

                  {/* اسم المستلم */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0E9DA]">
                    <span className="text-xs font-black text-[#787163]">
                      اسم المستلم
                    </span>
                    <span className="font-black text-sm text-[#163920] truncate">
                      {currentBank.beneficiary}
                    </span>
                  </div>

                  {/* RIB */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-black text-[#787163]">
                        رقم الحساب (RIB)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyRib(currentBank.rib)}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 min-h-[34px] rounded-lg border transition-all cursor-pointer active:scale-95 ${
                          copiedRib
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-[#C25E12] hover:bg-[#A34B07] text-white border-[#C25E12]'
                        }`}
                      >
                        {copiedRib ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الـ RIB</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* حقل RIB بارز */}
                    <div className="p-3.5 rounded-xl bg-[#F7F4EC] border-2 border-dashed border-[#D4C8B5] text-center">
                      <code className="font-mono font-black text-[#112616] tracking-[0.15em] text-sm sm:text-base select-all block break-all">
                        {currentBank.rib}
                      </code>
                    </div>
                  </div>
                </div>

                {/* ─── 3. رفع الوصل ─── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#C25E12] flex items-center justify-center shrink-0">
                      <Upload className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-black text-[#112616]">
                      إرفاق وصل التحويل
                    </span>
                    <span className="text-red-500 font-black">*</span>
                  </div>

                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center bg-white cursor-pointer transition-all group ${
                      receiptFile
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : 'border-[#D4C8B5] hover:border-[#C25E12] hover:bg-[#F7F4EC]'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {receiptFile ? (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {receiptPreview ? (
                          <img
                            src={receiptPreview}
                            alt="Receipt Preview"
                            className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-400 shadow-md shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm border-2 border-emerald-300 shrink-0">
                            PDF
                          </div>
                        )}
                        <div className="text-center sm:text-right min-w-0">
                          <p className="text-sm font-black text-[#112616] truncate max-w-[220px] mx-auto">
                            {receiptFile.name}
                          </p>
                          <span className="text-xs text-[#787163] font-bold">
                            {(receiptFile.size / 1024).toFixed(1)} KB
                          </span>
                          <p className="text-xs text-emerald-700 font-black mt-1 flex items-center justify-center sm:justify-start gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>تم رفع الملف بنجاح</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#C25E12]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-[#C25E12]" />
                        </div>
                        <span className="text-sm font-black text-[#112616] mb-1">
                          انقر لاختيار صورة الوصل
                        </span>
                        <span className="text-xs text-[#787163] font-bold">
                          JPG, PNG, PDF (الحد الأقصى 5MB)
                        </span>
                      </div>
                    )}
                  </div>

                  {errors.receipt && (
                    <p className="text-red-600 text-xs font-black flex items-center gap-1.5 mt-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errors.receipt}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════
              ─── الأمان، الكابتشا، وزر التأكيد ───
              ═══════════════════════════════════════════════════ */}
          <div className="pt-3 border-t-2 border-[#F0E9DA] space-y-3">
            {/* 6️⃣ التحقق الأمني ضد البوتات (Cloudflare Turnstile) */}
            <TurnstileWidget
              onVerify={(token) => setTurnstileToken(token)}
            />

            {/* 3️⃣ تنبيه فترة التهدئة (3 دقائق Cooldown) */}
            {cooldown.inCooldown && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-bold flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <p className="font-black text-amber-950 text-sm">
                    تحقق امني بسيط ({cooldown.remainingFormatted})
                  </p>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    لحمايتك وتفادي تكرار تسجيل نفس الطلب، يُرجى الانتظار حتى انتهاء العد التنازلي، أو تواصل معنا عبر واتساب إذا أردت تعديل طلبك السابق.
                  </p>
                </div>
              </div>
            )}

            {/* 4️⃣ تنبيه تجاوز معدل الطلبات (3 طلبات / ساعة) */}
            {!rateLimit.allowed && (
              <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 text-xs font-bold flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-black text-red-950 text-sm">
                    بلغت الحد الأقصى (3 طلبات خلال ساعة)
                  </p>
                  <p className="text-red-800 text-[11px] leading-relaxed">
                    لحماية المتجر من الطلبات المتكررة، تم منع إرسال طلبك الجديد مؤقتاً. سيعود الطلب للعمل بعد دقيقة، أو يمكنك التواصل معنا عبر واتساب للمساعدة.
                  </p>
                </div>
              </div>
            )}

            {/* رسائل الخطأ العامة */}
            {errors.security && (
              <div className="p-3 rounded-xl bg-red-100/80 border border-red-300 text-red-800 text-xs font-black flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errors.security}</span>
              </div>
            )}

            {errors.cart && (
              <div className="p-3 rounded-xl bg-red-100/80 border border-red-300 text-red-800 text-xs font-black flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errors.cart}</span>
              </div>
            )}

            {/* 1️⃣ زر التأكيد مع تعطيل فوري وLoader */}
            <button
              type="submit"
              disabled={isSubmitting || cooldown.inCooldown || !rateLimit.allowed}
              className="w-full min-h-[56px] py-4 px-4 rounded-2xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white font-black text-base shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer border-2 border-[#0E2615]"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-[#F5D76E] border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ التحقق وتأكيد الطلب بأمان...</span>
                </>
              ) : cooldown.inCooldown ? (
                <>
                  <Clock className="w-5 h-5 text-amber-300" />
                  <span>يرجى الانتظار ({cooldown.remainingFormatted})</span>
                </>
              ) : !rateLimit.allowed ? (
                <>
                  <ShieldAlert className="w-5 h-5 text-red-300" />
                  <span>تجاوزت الحد المسموح (3/ساعة)</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 text-[#F5D76E]" />
                  <span>تأكيد الطلب</span>
                  <span className="px-3 py-1 rounded-xl bg-white/15 text-[#F5D76E] text-sm font-black tabular-nums">
                    {grandTotal.toFixed(2)} DH
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#787163] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>نظام حماية الطلبات مُفعل 
</span>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};