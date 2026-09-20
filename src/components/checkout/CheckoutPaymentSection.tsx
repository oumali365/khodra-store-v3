// ============================================================
// الملف: CheckoutPaymentSection.tsx
// مكوّن موحد لطريقة الدفع (الدفع عند الاستلام أو تحويل بنكي)
// يتضمن تفاصيل الحسابات البنكية، نسخ الـ RIB، ورفع الوصل
// ============================================================
import React, { useState } from 'react';
import {
  CreditCard,
  Banknote,
  Building2,
  Check,
  Copy,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { PaymentMethod } from '../../types';
import { MOROCCAN_BANKS } from '../../data/config';

interface CheckoutBankTransferProps {
  selectedBankId: string;
  onSelectBankId: (id: string) => void;
  receiptFile: File | null;
  receiptPreview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export const CheckoutBankTransfer: React.FC<CheckoutBankTransferProps> = ({
  selectedBankId,
  onSelectBankId,
  receiptFile,
  receiptPreview,
  onFileChange,
  error,
}) => {
  const [copiedRib, setCopiedRib] = useState(false);

  const currentBank =
    MOROCCAN_BANKS.find((b) => b.id === selectedBankId) || MOROCCAN_BANKS[0];

  const handleCopyRib = (rib: string) => {
    const cleanRib = rib.replace(/\s+/g, '');
    navigator.clipboard.writeText(cleanRib).then(() => {
      setCopiedRib(true);
      setTimeout(() => setCopiedRib(false), 2000);
    });
  };

  return (
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
                onClick={() => onSelectBankId(b.id)}
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
            onChange={onFileChange}
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

        {error && (
          <p className="text-red-600 text-xs font-black flex items-center gap-1.5 mt-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
};

interface CheckoutPaymentSectionProps {
  paymentMethod: PaymentMethod;
  onChangePaymentMethod: (method: PaymentMethod) => void;
  selectedBankId: string;
  onSelectBankId: (id: string) => void;
  receiptFile: File | null;
  receiptPreview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  receiptError?: string;
}

export const CheckoutPaymentSection: React.FC<CheckoutPaymentSectionProps> = ({
  paymentMethod,
  onChangePaymentMethod,
  selectedBankId,
  onSelectBankId,
  receiptFile,
  receiptPreview,
  onFileChange,
  receiptError,
}) => {
  return (
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
            onChange={() => onChangePaymentMethod('cod')}
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
            onChange={() => onChangePaymentMethod('bank')}
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

      {/* تفاصيل التحويل البنكي عند اختياره */}
      {paymentMethod === 'bank' && (
        <CheckoutBankTransfer
          selectedBankId={selectedBankId}
          onSelectBankId={onSelectBankId}
          receiptFile={receiptFile}
          receiptPreview={receiptPreview}
          onFileChange={onFileChange}
          error={receiptError}
        />
      )}
    </div>
  );
};
