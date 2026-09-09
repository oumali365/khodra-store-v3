import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  MessageCircle, 
  X, 
  ArrowRight, 
  Clock, 
  MapPin, 
  CreditCard, 
  ChevronDown, 
  ChevronUp
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
  const [showItemsList, setShowItemsList] = useState(false);

  useEffect(() => {
    if (isOpen) {
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

  const matchedBank = MOROCCAN_BANKS.find(
    (b) => b.id === order.bankId || b.name === order.bankId || b.shortName === order.bankId
  );
  
  const cleanBankName = matchedBank
    ? (matchedBank.shortName || matchedBank.name).replace(/(البريد|بريد|التجاري|البنك|بنك|القرض|كاش)/gi, '').replace(/[()\-–—]/g, '').trim()
    : order.bankId
    ? order.bankId.replace(/(البريد|بريد|التجاري|البنك|بنك|القرض|كاش)/gi, '').replace(/[()\-–—]/g, '').trim()
    : 'تحويل بنكي';

  const waLines = [
    `🛒 *طلب جديد من متجر خُضرة ${order.orderCode}*`,
    `📞 *الهاتف:* ${order.phone}`,
    `📍 *عنوان التوصيل:* ${order.address}`,
    order.mapsLink ? `🗺️ *رابط Google Maps:*\n${order.mapsLink}` : '',
    order.notes ? `📝 *ملاحظات:* ${order.notes}` : '',
    `🕒 *وقت التسليم:* ${order.deliverySlot}`,
    `💳 *طريقة الدفع:* ${order.paymentMethod === 'bank' ? `تحويل بنكي (${cleanBankName})` : 'الدفع نقداً عند الاستلام'}`,
    order.receiptFileName ? `📎 *وصل التحويل:* ${order.receiptFileName}` : '',
    ``,
    `*قائمة المنتجات:*`,
    ...order.items.map(
      (i) => `• ${i.icon} ${i.name} (${i.variantLabel}${i.qty > 1 ? ` × ${i.qty}` : ''}) — ${i.lineTotal.toFixed(2)} د.م`
    ),
    ``,
    `💰 *المجموع الفرعي:* ${order.subtotal.toFixed(2)} د.م`,
    `🚚 *رسوم التوصيل:* ${order.deliveryFee.toFixed(2)} د.م`,
    `⭐ *الإجمالي:* ${order.total.toFixed(2)} د.م`,
    ``,
    `شكراً لثقتكم بمتجر خُضرة! 🌿`
  ].filter(Boolean);

  const fullText = waLines.join('\n');
  const whatsappUrl = `https://wa.me/${STORE_CONFIG.whatsappCleanNumber}?text=${encodeURIComponent(fullText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white border border-[#D4C8B5] rounded-3xl w-full max-w-lg shadow-2xl z-50 overflow-hidden p-5 sm:p-6 text-center animate-in zoom-in-95 duration-200 my-auto max-h-[95vh] flex flex-col">
        
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
              شكراً لتسوقك من متجر خُضرة.
            </p>
          </div>

          {/* Order Code */}
          <div className="inline-flex items-center gap-2 bg-[#F7F4EC] border-2 border-dashed border-[#C25E12] rounded-xl px-4 py-2 font-mono text-base sm:text-lg font-black text-[#C25E12]">
            <span>رقم الطلب:</span>
            <span className="tracking-wider">{order.orderCode}</span>
          </div>

          {/* Order Details */}
          <div className="bg-white border border-[#D4C8B5] rounded-2xl p-4 text-right space-y-3 shadow-xs">
            
            {/* عنوان التوصيل */}
            <div className="bg-gradient-to-l from-[#F7F4EC] to-[#FFF9F0] border border-[#D4C8B5] rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-[#C25E12]" />
                <span className="font-black text-[#C25E12] text-sm">عنوان التوصيل بالدار البيضاء</span>
              </div>
              
              <div className="space-y-2 text-right">
                <div className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2 border border-[#D4C8B5]/50">
                  <span className="font-bold text-[#2D271E] text-xs">الإسم الكامل:</span>
                  <span className="font-black text-[#112616] text-sm">{order.customerName}</span>
                </div>
                
                <div className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2 border border-[#D4C8B5]/50">
                  <span className="font-bold text-[#2D271E] text-xs">رقم الهاتف:</span>
                  <span className="font-black text-[#112616] text-sm" dir="ltr">{order.phone}</span>
                </div>
                
                <div className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2 border border-[#D4C8B5]/50">
                  <span className="font-bold text-[#2D271E] text-xs">العنوان:</span>
                  <span className="font-black text-[#112616] text-sm">{order.address}</span>
                </div>
              </div>
            </div>

            {/* وقت التسليم */}
            <div className="bg-gradient-to-r from-[#1E4327] to-[#2A5D35] rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Clock className="w-5 h-5 text-[#E8B93F]" />
                </div>
                <div className="flex-1 text-right">
                  <span className="text-[#E8B93F] font-bold text-xs block mb-1">وقت التسليم المفضل</span>
                  <span className="font-black text-white text-sm sm:text-base">{order.deliverySlot}</span>
                </div>
              </div>
            </div>

            {/* طريقة الدفع */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-[#2D271E] bg-[#F7F4EC] rounded-lg px-3 py-2">
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

            {/* المنتجات - عرض نظيف ومبسط */}
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
                <div className="mt-2 space-y-1 overflow-y-auto max-h-40">
                  {order.items.map((i) => (
                    <div key={i.key} className="flex items-center justify-between py-1.5 px-2 hover:bg-[#F7F4EC] rounded-lg transition-colors">
                      <span className="flex items-center gap-2 text-[#112616]">
                        <span className="text-base">{i.icon}</span>
                        <span className="text-xs font-black">{i.name}</span>
                        {i.qty > 1 && (
                          <span className="text-xs text-[#C25E12] font-bold">×{i.qty}</span>
                        )}
                      </span>
                      <span className="text-xs font-black text-[#C25E12]">{i.lineTotal.toFixed(2)} د.م</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* الإجمالي */}
            <div className="pt-2.5 border-t border-[#EAE2D2] flex justify-between items-center text-sm sm:text-base font-black text-[#112616]">
              <span>المجموع الإجمالي:</span>
              <span className="text-lg sm:text-xl text-[#C25E12] font-black">
                {order.total.toFixed(2)} {STORE_CONFIG.currency}
              </span>
            </div>
          </div>

          {/* زر الإرسال */}
          <div className="pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#25D366]"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>إرسال وتأكيد الطلب عبر واتساب</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#1E4327] hover:bg-[#112616] text-white font-black text-xs sm:text-sm transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
            >
              <span>متابعة التسوق</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};