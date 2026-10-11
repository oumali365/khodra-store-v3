// ============================================================
// src/features/layout/AdminExitConfirmModal.tsx
// نافذة تأكيد مغادرة لوحة الإدارة لمنع الخروج غير المقصود عند الضغط على زر الرجوع في الهاتف
// ============================================================

import React, { useEffect } from 'react';
import { ShieldAlert, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';

interface AdminExitConfirmModalProps {
  isOpen: boolean;
  sectionName?: string;
  onStay: () => void;
  onConfirmExit: () => void;
}

export const AdminExitConfirmModal: React.FC<AdminExitConfirmModalProps> = ({
  isOpen,
  sectionName = 'لوحة التحكم',
  onStay,
  onConfirmExit,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStay();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-exit-title"
    >
      <div
        className="fixed inset-0"
        onClick={onStay}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-[#18181B] border-2 border-[#EAB308]/30 rounded-[28px] shadow-2xl p-6 text-right z-10 text-white animate-in zoom-in-95 duration-200">
        {/* شريط جمالي علوي */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#EAB308] to-emerald-500 rounded-t-[28px]" />

        {/* أيقونة التنبيه */}
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-[#EAB308]/40 flex items-center justify-center mx-auto mb-4 shadow-lg text-[#F5D76E]">
          <ShieldAlert className="w-8 h-8 text-[#EAB308]" strokeWidth={2.2} />
        </div>

        {/* النصوص التوضيحية */}
        <div className="text-center mb-5">
          <h3
            id="admin-exit-title"
            className="text-lg sm:text-xl font-black text-white font-['Almarai'] mb-1.5"
          >
            تأكيد مغادرة لوحة الإدارة
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed font-['Tajawal']">
            أنت تعمل حالياً داخل قسم <span className="font-black text-[#F5D76E]">"{sectionName}"</span>. هل تريد حقاً الخروج من لوحة الإدارة والعودة إلى واجهة المتجر؟
          </p>
        </div>

        {/* الأزرار */}
        <div className="space-y-2.5">
          {/* الزر الرئيسي: البقاء في الإدارة */}
          <button
            type="button"
            onClick={onStay}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] hover:from-[#3A8152] hover:to-[#2D6A3F] text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#EAB308]/30 active:scale-98"
          >
            <ShieldCheck className="w-4 h-4 text-[#F5D76E]" />
            <span>البقاء في لوحة الإدارة ومتابعة العمل</span>
          </button>

          {/* الزر الثانوي: الخروج للمتجر */}
          <button
            type="button"
            onClick={onConfirmExit}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4 text-rose-400 rotate-180" />
            <span>الخروج والعودة للمتجر</span>
          </button>
        </div>
      </div>
    </div>
  );
};
