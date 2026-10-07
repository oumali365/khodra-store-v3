// ============================================================
// src/features/pricing-forecast/SupplierModal.tsx
// نافذة إدارة الموردين (CRUD) وتقييم الجودة وربطهم بأسواق الجملة
// ============================================================

import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Star, Phone, Check, Building2, MessageSquare, AlertCircle } from 'lucide-react';
import type { Supplier } from './types';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onSaveSupplier: (supplier: Partial<Supplier> & { name: string }) => Promise<void>;
  onDeleteSupplier: (id: string) => Promise<void>;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onSaveSupplier,
  onDeleteSupplier,
}) => {
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setSpecialty('خضار أساسية (سوق بنسودة)');
    setRating(5);
    setNotes('');
    setErrorMessage(null);
    setIsCreatingNew(true);
  };

  const handleStartEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setPhone(sup.phone);
    setSpecialty(sup.specialty);
    setRating(sup.rating || 5);
    setNotes(sup.notes || '');
    setErrorMessage(null);
    setIsCreatingNew(true);
  };

  const handleCancelForm = () => {
    setIsCreatingNew(false);
    setEditingSupplier(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('يرجى إدخال اسم المورد أو التعاونية');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSaveSupplier({
        id: editingSupplier ? editingSupplier.id : undefined,
        name: name.trim(),
        phone: phone.trim(),
        specialty: specialty.trim(),
        rating,
        notes: notes.trim(),
        is_active: true,
      });
      setIsCreatingNew(false);
      setEditingSupplier(null);
    } catch {
      setErrorMessage('تعذر حفظ بيانات المورد، يرجى المحاولة ثانية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, supName: string) => {
    if (confirm(`هل أنت متأكد من حذف المورد "${supName}"؟`)) {
      await onDeleteSupplier(id);
      if (editingSupplier?.id === id) {
        setIsCreatingNew(false);
        setEditingSupplier(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-right flex flex-col max-h-[92vh]">
        {/* الترويسة العلوية */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-[#163920] to-[#0E2615] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-[#FEF08A]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">إدارة موردي سوق الجملة (بنسودة / فاس)</h3>
              <p className="text-[11px] text-emerald-200 font-medium">
                تسجيل شركاء التوريد المباشر، تخصصات السلع، وتقييم الجودة (1-5 نجوم)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* جسم النافذة */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* زر إضافة مورد جديد */}
          {!isCreatingNew && (
            <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-200">
              <span className="font-bold text-stone-700">
                إجمالي الموردين المسجلين: <strong className="text-emerald-800 font-black">{suppliers.length}</strong>
              </span>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3.5 py-1.5 rounded-xl bg-[#163920] hover:bg-[#0E2615] text-white font-black text-xs inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#F5D76E]" />
                <span>إضافة مورد جديد</span>
              </button>
            </div>
          )}

          {/* نموذج الإدخال / التعديل */}
          {isCreatingNew && (
            <form onSubmit={handleSubmit} className="bg-emerald-50/40 p-4 rounded-2xl border-2 border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                <h4 className="font-black text-sm text-[#163920]">
                  {editingSupplier ? `تعديل المورد: ${editingSupplier.name}` : 'تسجيل مورد جديد'}
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-stone-500 hover:text-stone-800 text-[11px] font-bold cursor-pointer"
                >
                  إلغاء التعديل
                </button>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-100 text-red-800 text-[11px] font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    اسم المورد أو التعاونية: *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: الحاج المفضل بنجلون"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    رقم الهاتف / الواتساب:
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06XXXXXXXX"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 font-mono text-left font-bold focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    التخصص وسوق التوريد:
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="مثال: خضر ورقية، بطاطس وبصل، فواكه موسمية"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 font-medium focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    تقييم الجودة والموثوقية:
                  </label>
                  <div className="flex items-center gap-1.5 py-1.5 px-3 bg-white rounded-xl border border-stone-300">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="cursor-pointer transition-transform hover:scale-110"
                        title={`${star} نجوم`}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="mr-2 font-black text-amber-700 text-xs">
                      {rating} / 5 نجوم
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  ملاحظات وموقع الجناح في سوق بنسودة:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: جناح البطاطس رقم 14، توريد فجر الإثنين والخميس..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/60">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-l from-emerald-700 to-green-800 hover:from-emerald-800 hover:to-green-900 text-white font-black inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#F5D76E]" />
                  <span>{editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد'}</span>
                </button>
              </div>
            </form>
          )}

          {/* قائمة الموردين الحالية */}
          <div className="space-y-2.5">
            <h4 className="font-black text-xs text-stone-800 flex items-center gap-1.5">
              <span>قائمة الموردين المعتمدين</span>
              <span className="text-[10px] text-stone-500 font-normal">({suppliers.length} مورد)</span>
            </h4>

            {suppliers.length === 0 ? (
              <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                لا يوجد موردون مسجلون حالياً. انقر على "إضافة مورد جديد" لإضافة أول شريك توريد.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {suppliers.map((sup) => (
                  <div
                    key={sup.id}
                    className="p-3 rounded-2xl bg-white border border-stone-200/90 hover:border-emerald-500/50 hover:shadow-xs transition-all flex flex-col justify-between space-y-2 text-right"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <h5 className="font-black text-xs sm:text-sm text-stone-900">{sup.name}</h5>
                          <p className="text-[11px] text-stone-500 font-medium mt-0.5">{sup.specialty}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-200/60">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-[10px] font-black text-amber-800 tabular-nums">{sup.rating}</span>
                        </div>
                      </div>

                      {sup.notes && (
                        <p className="text-[10px] text-stone-400 mt-1.5 line-clamp-1 italic">
                          {sup.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      {sup.phone ? (
                        <a
                          href={`tel:${sup.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 hover:text-emerald-900"
                          dir="ltr"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{sup.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-stone-400">بدون هاتف</span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(sup)}
                          className="p-1 rounded-lg text-stone-600 hover:text-emerald-700 hover:bg-stone-100 cursor-pointer"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sup.id, sup.name)}
                          className="p-1 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* تذييل النافذة */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-[11px] text-stone-500 font-medium">
            يتم ربط الموردين مباشرة بجدول تسعير سوق بنسودة اليومي.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
