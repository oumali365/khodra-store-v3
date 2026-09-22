// ============================================================
// OrderBordereauModal.tsx
// ملصق الشحن والتوصيل الفوري (Bordereau de Livraison)
// مخصص للصناديق العازلة (50L) وسائقي inDrive / DONE / Yassir بفاس
// ============================================================
import React, { useEffect } from 'react';
import {
  X,
  Printer,
  Package,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  Truck,
  Layers,
  ExternalLink,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { DbOrder } from '../../services/supabaseService';
import { STORE_CONFIG, DELIVERY_PROVIDERS, STORE_PICKUP_HUB, FEZ_DELIVERY_ZONES } from '../../data/config';

interface OrderBordereauModalProps {
  order: DbOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderBordereauModal: React.FC<OrderBordereauModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const dispatch = order.delivery_dispatch;
  const provider = DELIVERY_PROVIDERS.find((p) => p.id === dispatch?.provider) || DELIVERY_PROVIDERS[0];
  const zoneKey = dispatch?.zone || 'other';
  const zoneInfo = FEZ_DELIVERY_ZONES[zoneKey as keyof typeof FEZ_DELIVERY_ZONES] || FEZ_DELIVERY_ZONES.other;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=700,height=850');
    if (!printWindow) {
      window.print();
      return;
    }

    const content = document.getElementById('bordereau-printable')?.outerHTML || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>ملصق شحن ${order.order_code}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif;
            background: #ffffff;
            color: #111827;
            padding: 16px;
            direction: rtl;
          }
          .bordereau-box {
            border: 2px solid #000;
            padding: 16px;
            max-width: 580px;
            margin: 0 auto;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px dashed #333;
            padding-bottom: 12px;
            margin-bottom: 12px;
          }
          .logo { font-size: 24px; font-weight: 900; color: #15803d; }
          .badge {
            background: #000;
            color: #fff;
            padding: 4px 10px;
            font-size: 14px;
            font-weight: bold;
            border-radius: 4px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
          .card {
            border: 1px solid #cbd5e1;
            padding: 10px;
            border-radius: 6px;
            background: #f8fafc;
          }
          .card-title {
            font-size: 12px;
            color: #64748b;
            font-weight: bold;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .card-val {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
          }
          .cod-banner {
            background: #fef08a;
            border: 2px solid #ca8a04;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            margin: 12px 0;
          }
          .cod-amount {
            font-size: 28px;
            font-weight: 900;
            color: #854d0e;
          }
          .layers-box {
            border: 1px solid #94a3b8;
            padding: 8px;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 12px;
            background: #f1f5f9;
          }
          .layer-item {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 4px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 8px;
          }
          .items-table th, .items-table td {
            border: 1px solid #e2e8f0;
            padding: 6px 8px;
            text-align: right;
          }
          .items-table th { background: #e2e8f0; font-weight: bold; }
          .footer-note {
            margin-top: 12px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      id="bordereau-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-stone-900 text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-600 rounded-lg text-white">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold">ملصق الشحن والتوصيل الفوري (Bordereau)</h2>
              <p className="text-xs text-stone-300">
                طلب رقم {order.order_code} • مخصص للصناديق العازلة وسائقي فاس
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-bordereau-btn"
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الملصق</span>
            </button>
            <button
              id="close-bordereau-btn"
              onClick={onClose}
              type="button"
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50">
          <div
            id="bordereau-printable"
            className="bordereau-box bg-white border-2 border-stone-900 rounded-xl p-5 shadow-sm mx-auto max-w-xl"
          >
            {/* Top Logo & Code */}
            <div className="flex items-center justify-between border-b-2 border-dashed border-stone-800 pb-3 mb-4">
              <div>
                <span className="text-2xl font-black text-emerald-700 tracking-tight">خُضرة 🌿</span>
                <p className="text-xs font-semibold text-stone-600">طازج من سوق الجملة بنسودة إلى باب المنزل</p>
              </div>
              <div className="text-left">
                <span className="inline-block bg-stone-900 text-white text-xs font-black px-3 py-1 rounded">
                  {order.order_code}
                </span>
                <p className="text-[11px] text-stone-500 mt-1">
                  {new Date(order.created_at).toLocaleDateString('ar-MA')} - فاس
                </p>
              </div>
            </div>

            {/* Hub & Provider Bar */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="border border-stone-200 bg-stone-50 rounded-lg p-2.5">
                <p className="text-[11px] font-bold text-stone-500">نقطة الانطلاق (Hub):</p>
                <p className="text-xs font-bold text-stone-800">{STORE_PICKUP_HUB.name}</p>
                <p className="text-[10px] text-stone-500">{STORE_PICKUP_HUB.address}</p>
              </div>
              <div className="border border-stone-200 bg-emerald-50 rounded-lg p-2.5">
                <p className="text-[11px] font-bold text-emerald-800">شركة التوصيل المعتمدة:</p>
                <p className="text-sm font-black text-emerald-900 flex items-center gap-1">
                  <span>{provider.icon}</span> {provider.name}
                </p>
                <p className="text-[10px] text-emerald-700 font-semibold">
                  المسار: {zoneInfo.name} ({zoneInfo.targetTime})
                </p>
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="border-2 border-stone-900 rounded-lg p-3 bg-white mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">الزبون المستلم:</span>
                <span className="text-xs font-black bg-stone-200 text-stone-800 px-2 py-0.5 rounded">
                  {zoneInfo.name}
                </span>
              </div>
              <h3 className="text-lg font-black text-stone-900 mb-1">{order.customer_name}</h3>
              <div className="flex items-center gap-2 text-stone-800 font-mono font-bold text-base mb-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span dir="ltr">{order.phone}</span>
              </div>
              <div className="flex items-start gap-1.5 text-xs text-stone-700 bg-stone-100 p-2 rounded">
                <MapPin className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                <span className="font-semibold">{order.address}</span>
              </div>
            </div>

            {/* COD Cash On Delivery Callout */}
            <div className="bg-amber-100 border-2 border-amber-500 rounded-xl p-3.5 text-center mb-3">
              <p className="text-xs font-bold text-amber-900">المبلغ الإجمالي المطلوب تحصيله (COD):</p>
              <div className="text-3xl font-black text-amber-950 my-0.5">
                {order.total.toFixed(2)} <span className="text-lg">درهم</span>
              </div>
              <p className="text-[11px] font-semibold text-amber-800">
                (شامل رسوم المنتجات والتوصيل • الدفع نقداً عند باب المنزل)
              </p>
            </div>

            {/* Courier & Driver Section if assigned */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-xs border border-stone-200 rounded-lg p-2.5 bg-stone-50">
              <div>
                <span className="text-stone-500 font-bold block">السائق المكلّف:</span>
                <span className="font-black text-stone-800">
                  {dispatch?.driverName || 'بانتظار تخصيص السائق عبر inDrive'}
                </span>
                {dispatch?.driverPhone && (
                  <span className="block font-mono text-stone-600 mt-0.5" dir="ltr">
                    {dispatch.driverPhone}
                  </span>
                )}
              </div>
              <div>
                <span className="text-stone-500 font-bold block">تكلفة التوصيل المتفق عليها:</span>
                <span className="font-bold text-emerald-800">
                  {dispatch?.deliveryCost ? `${dispatch.deliveryCost} درهم` : '20-30 د.م (تفاوض inDrive)'}
                </span>
              </div>
            </div>

            {/* Cooler Box Packaging Layout Guide (من الاستراتيجية) */}
            <div className="border border-stone-300 rounded-lg p-2.5 bg-stone-100/80 mb-3 text-[11px]">
              <p className="font-black text-stone-800 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>إرشادات التوضيب في الصندوق العازل (50L):</span>
              </p>
              <div className="space-y-1 text-stone-700">
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-stone-200">
                  <span>🔝 <strong>الطبقة العليا:</strong> فواكه حساسة وطماطم كرزية</span>
                  <span className="text-emerald-700 font-bold">لا تضع أوزان فوقها</span>
                </div>
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-stone-200">
                  <span>🔸 <strong>الطبقة الوسطى:</strong> خضروات ورقية (خس، سبانخ، نعناع)</span>
                  <span className="text-stone-500">في أكياس تهوية</span>
                </div>
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-stone-200">
                  <span>🔻 <strong>الطبقة السفلى:</strong> خضروات ثقيلة (بطاطس، بصل، جزر)</span>
                  <span className="text-stone-500">قاعدة الصندوق</span>
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div className="border-t border-stone-200 pt-2 mb-2">
              <p className="text-xs font-bold text-stone-700 mb-1">محتويات الطرد ({order.items.length} أصناف):</p>
              <table className="w-full text-xs text-right border border-stone-200">
                <thead>
                  <tr className="bg-stone-200 text-stone-800 font-bold">
                    <th className="p-1.5 border border-stone-300">المنتج</th>
                    <th className="p-1.5 border border-stone-300 text-center">الكمية</th>
                    <th className="p-1.5 border border-stone-300 text-left">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-stone-200">
                      <td className="p-1.5">
                        {item.name} {item.variantLabel ? `(${item.variantLabel})` : ''}
                      </td>
                      <td className="p-1.5 text-center font-bold">{item.qty}</td>
                      <td className="p-1.5 text-left font-mono font-bold" dir="ltr">
                        {item.lineTotal.toFixed(2)} DH
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[10px] text-stone-500 border-t border-dashed border-stone-300 pt-2">
              متجر خُضرة • خدمة التوصيل الفوري بفاس • الدعم: {STORE_CONFIG.whatsappNumber}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
