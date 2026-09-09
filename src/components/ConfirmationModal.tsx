import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  MessageCircle, 
  X, 
  ArrowRight, 
  Clock, 
  MapPin, 
  CreditCard, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  ShoppingBag
} from 'lucide-react';
import { OrderSubmission } from '../types';
import { STORE_CONFIG, MOROCCAN_BANKS } from '../data/config';

interface ConfirmationModalProps {
  isOpen: boolean;
  order: OrderSubmission | null;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  order,
  onClose,
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showItemsList, setShowItemsList] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // تأجيل وتحميل حزمة الكونفيتي عند الحاجة فقط لتقليل حجم الحزمة الابتدائية
      import('canvas-confetti')
        .then((module) => {
          const confetti = module.default;
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#1E4327', '#C25E12', '#E8B93F', '#25D366']
          });
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  // إيجاد البنك المختار لعرض الشعار والاسم النظيف
  const matchedBank = MOROCCAN_BANKS.find(
    (b) => b.id === order.bankId || b.name === order.bankId || b.shortName === order.bankId
  );
  const cleanBankName = matchedBank
    ? (matchedBank.shortName || matchedBank.name).replace(/(البريد|بريد|التجاري|البنك|بنك|القرض|كاش)/gi, '').replace(/[()\-–—]/g, '').trim()
    : order.bankId
    ? order.bankId.replace(/(البريد|بريد|التجاري|البنك|بنك|القرض|كاش)/gi, '').replace(/[()\-–—]/g, '').trim()
    : 'تحويل بنكي';

  // Build formatted WhatsApp message
  const waLines = [
    `🛒 *طلب جديد من متجر خُضرة ${order.orderCode}*`,
    `👤 *الاسم:* ${order.customerName}`,
    `📞 *الهاتف:* ${order.phone}`,
    `📍 *عنوان التوصيل:* ${order.address}`,
    order.mapsLink ? `🗺️ *رابط Google Maps للسائق:*\n${order.mapsLink}` : '',
    order.notes ? `📝 *ملاحظات:* ${order.notes}` : '',
    `🕒 *وقت التسليم:* ${order.deliverySlot}`,
    `💳 *طريقة الدفع:* ${order.paymentMethod === 'bank' ? `تحويل بنكي (${cleanBankName})` : 'الدفع نقداً عند الاستلام'}`,
    order.receiptFileName ? `📎 *وصل التحويل:* تم إرفاق ملف (${order.receiptFileName})` : '',
    ``,
    `*قائمة المنتجات الطازجة:*`,
    ...order.items.map(
      (i) => `• ${i.icon} ${i.name} (${i.variantLabel}${i.qty > 1 ? ` × ${i.qty}` : ''}) — ${i.lineTotal.toFixed(2)} د.م`
    ),
    ``,
    `💰 *المجموع الفرعي:* ${order.subtotal.toFixed(2)} د.م`,
    `🚚 *رسوم التوصيل:* ${order.deliveryFee.toFixed(2)} د.م`,
    `⭐ *المجموع الإجمالي الواجب أداؤه:* ${order.total.toFixed(2)} د.م`,
    ``,
    `شكراً لثقتكم بمتجر خُضرة! 🌿`
  ].filter(Boolean);

  const fullText = waLines.join('\n');
  const whatsappUrl = `https://wa.me/${STORE_CONFIG.whatsappCleanNumber}?text=${encodeURIComponent(fullText)}`;

  const handleCopySummary = () => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white border border-[#D4C8B5] rounded-3xl w-full max-w-lg shadow-2xl z-50 overflow-hidden p-5 sm:p-6 text-center animate-in zoom-in-95 duration-200 my-auto max-h-[95vh] flex flex-col">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-[#F7F4EC] text-[#2D271E] hover:bg-[#EAE2D2] flex items-center justify-center transition-colors cursor-pointer border border-[#D4C8B5]"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="overflow-y-auto pr-1 pl-1 space-y-4">
          {/* Success Icon */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 border-2 border-[#1E4327] text-[#1E4327] flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#112616] mb-1">
              تم استلام طلبك بنجاح!
            </h2>
            <p className="text-xs sm:text-sm text-[#2D271E] font-medium leading-relaxed">
              شكراً لتسوقك من متجر خُضرة. تم تسجيل طلبك وسنواكبه في جميع المراحل.
            </p>
          </div>

          {/* Order Code Pill */}
          <div className="inline-flex items-center gap-2 bg-[#F7F4EC] border-2 border-dashed border-[#C25E12] rounded-xl px-4 py-2 font-mono text-base sm:text-lg font-black text-[#C25E12]">
            <span>رقم الطلب:</span>
            <span className="tracking-wider">{order.orderCode}</span>
          </div>

          {/* Order Details Brief */}
          <div className="bg-white border border-[#D4C8B5] rounded-2xl p-4 text-right space-y-3 shadow-xs">
            <div className="flex items-start gap-2 text-xs sm:text-sm text-[#2D271E]">
              <MapPin className="w-4 h-4 text-[#C25E12] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div>
                  <span className="font-bold">العنوان: </span>
                  <span className="font-black text-[#112616]">{order.address}</span>
                </div>
                {order.mapsLink && (
                  <div className="mt-1.5">
                    <a
                      href={order.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1E4327] border border-emerald-200 text-xs font-bold transition-colors"
                    >
                      <span>🗺️ فتح الموقع على Google Maps للسائق</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#2D271E]">
              <Clock className="w-4 h-4 text-[#1E4327] shrink-0" />
              <span className="font-bold">وقت التسليم:</span>
              <span className="font-black text-[#112616]">{order.deliverySlot}</span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm text-[#2D271E]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#1E4327] shrink-0" />
                <span className="font-bold">طريقة الدفع:</span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-[#112616]">
                {order.paymentMethod === 'bank' ? (
                  <>
                    {matchedBank?.image && (
                      <img
                        src={matchedBank.image}
                        alt="Bank"
                        className="h-5 w-auto max-w-[40px] object-contain inline-block"
                      />
                    )}
                    <span>تحويل عبر {cleanBankName}</span>
                  </>
                ) : (
                  <span>الدفع نقداً عند الاستلام</span>
                )}
              </div>
            </div>

            {/* زر عرض تفاصيل المنتجات */}
            <div className="pt-2 border-t border-[#EAE2D2]">
              <button
                type="button"
                onClick={() => setShowItemsList(!showItemsList)}
                className="w-full flex items-center justify-between text-xs font-black text-[#2D271E] hover:text-[#112616] transition-colors py-1 cursor-pointer"
              >
                <span>المنتجات المطلوبة ({order.items.length})</span>
                {showItemsList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showItemsList && (
                <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pt-2 border-t border-dashed border-[#D4C8B5]">
                  {order.items.map((i) => (
                    <div key={i.key} className="flex justify-between items-center text-xs p-2 bg-[#F7F4EC] rounded-xl border border-[#D4C8B5]/60">
                      <span className="flex items-center gap-1.5 text-[#112616]">
                        <span>{i.icon}</span>
                        <span className="font-black">{i.name}</span>
                        <span className="text-[#38332B] font-bold">({i.variantLabel}{i.qty > 1 ? ` × ${i.qty}` : ''})</span>
                      </span>
                      <span className="font-black text-[#C25E12]">{i.lineTotal.toFixed(2)} د.م</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-[#EAE2D2] flex justify-between items-center text-sm sm:text-base font-black text-[#112616]">
              <span>المجموع الإجمالي الواجب أداؤه:</span>
              <span className="text-lg sm:text-xl text-[#C25E12] font-black">
                {order.total.toFixed(2)} {STORE_CONFIG.currency}
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#25D366]"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>إرسال وتأكيد الطلب عبر واتساب</span>
            </a>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-[#F7F4EC] border border-[#D4C8B5] text-[#112616] font-black text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    <span className="text-emerald-800">تم نسخ الملخص ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#C25E12]" />
                    <span>نسخ تفاصيل الطلب</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#1E4327] hover:bg-[#112616] text-white font-black text-xs sm:text-sm transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>متابعة التسوق</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
