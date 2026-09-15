import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Check, 
  Star, 
  Users, 
  Package, 
  Weight, 
  Gift, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { FAMILY_BUNDLES, FamilyBundle } from '../data/familyBundles';
import { CartItem } from '../types';

interface FamilyCartProps {
  onAddBundle: (items: CartItem[], bundleName: string) => void;
}

export const FamilyCart: React.FC<FamilyCartProps> = ({ onAddBundle }) => {
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  const handleAddBundle = (bundle: FamilyBundle) => {
    // هنا يتم تحويل عناصر الصندوق إلى عناصر سلة
    // (سيتم ربطها بـ CartContext في المكون الأب)
    const cartItems: CartItem[] = bundle.items.map((item, idx) => ({
      key: `${bundle.id}-${item.productId}-${idx}`,
      productId: item.productId,
      name: item.productId, // سيتم استبداله باسم المنتج الحقيقي من CartContext
      variantLabel: 'صندوق عائلة',
      qty: item.qty,
      unitPrice: 0, // سيتم حسابه
      lineTotal: 0,
      icon: '🧺',
      image: '',
    }));

    onAddBundle(cartItems, bundle.name);
    setAddedBundleId(bundle.id);
    setTimeout(() => setAddedBundleId(null), 2500);
  };

  const toggleExpand = (id: string) => {
    setExpandedBundle(expandedBundle === id ? null : id);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-10 sm:my-14" id="family-bundles-section">
      <div className="bg-gradient-to-br from-[#FAF7F2] to-[#F0EBE0] border border-[#D4C8B5] rounded-3xl p-5 sm:p-8 shadow-sm">

        {/* ─── الرأس ─── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-[#1E4327] text-xs font-black mb-3 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#2E5336]" />
            <span>وفّر وقتك وفلوسك</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#112616] mb-3">
            🧺 صناديق عائلة خُضرة
          </h2>
          <p className="text-sm sm:text-base text-[#524B3E] max-w-2xl mx-auto font-medium leading-relaxed">
            اختر الصندوق المناسب لحجم عائلتك، واستلم خضراً وفواكه طازجة كل أسبوع بسعر ثابت وجودة مضمونة — بدون ما تحتاج تسوق.
          </p>

          {/* الميزات السريعة */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {[
              { icon: <Truck className="w-3.5 h-3.5" />, text: 'توصيل مجاني' },
              { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: 'ضمان استبدال فوري' },
              { icon: <Gift className="w-3.5 h-3.5" />, text: 'توفير يصل إلى 20%' },
            ].map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#D4C8B5] text-[11px] sm:text-xs font-bold text-[#524B3E] shadow-sm">
                <span className="text-[#2E6B39]">{f.icon}</span>
                <span>{f.text}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ─── شبكة الصناديق ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FAMILY_BUNDLES.map((bundle) => {
            const isExpanded = expandedBundle === bundle.id;
            const isAdded = addedBundleId === bundle.id;

            return (
              <article
                key={bundle.id}
                className="relative bg-white border-2 border-[#E0D8C8] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#C25E12] transition-all duration-300 flex flex-col"
              >
                {/* Badge */}
                {bundle.badge && (
                  <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full ${bundle.badgeColor} text-white text-[10px] font-black shadow-md`}>
                    {bundle.badge}
                  </div>
                )}

                {/* صورة الصندوق */}
                <div className="relative h-44 sm:h-52 bg-gradient-to-br from-emerald-50 to-amber-50 overflow-hidden">
                  <img
                    src={bundle.image}
                    alt={bundle.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Badge الحجم */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-[10px] font-black text-[#112616] shadow-sm flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#C25E12]" />
                    {bundle.peopleCount}
                  </div>
                </div>

                {/* المحتوى */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <h3 className="text-base sm:text-lg font-black text-[#112616] mb-1">
                    {bundle.name}
                  </h3>
                  <p className="text-xs text-[#C25E12] font-bold mb-3">
                    {bundle.tagline}
                  </p>

                  {/* الإحصائيات */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#524B3E] font-bold bg-[#FAF8F3] rounded-lg p-2">
                      <Package className="w-3.5 h-3.5 text-[#2E6B39]" />
                      <span>{bundle.itemCount} أصناف</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#524B3E] font-bold bg-[#FAF8F3] rounded-lg p-2">
                      <Weight className="w-3.5 h-3.5 text-[#2E6B39]" />
                      <span>{bundle.weightRange}</span>
                    </div>
                  </div>

                  {/* المميزات */}
                  <ul className="space-y-1.5 mb-4">
                    {bundle.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-[#2D271E] font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  {/* السعر */}
                  <div className="mt-auto pt-4 border-t border-[#F0E9DA]">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <div className="text-[10px] text-[#787163] font-bold mb-0.5">السعر الإجمالي</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-[#C25E12]">
                            {bundle.price}
                          </span>
                          <span className="text-sm font-black text-[#C25E12]">د.م</span>
                          <span className="text-xs text-[#787163] line-through font-bold">
                            {bundle.originalPrice} د.م
                          </span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                        وفّر {bundle.savingsPercent}%
                      </div>
                    </div>

                    {/* زر الإضافة */}
                    <button
                      type="button"
                      onClick={() => handleAddBundle(bundle)}
                      disabled={isAdded}
                      className={`w-full min-h-[46px] py-3 px-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-[#C25E12] to-[#A34B07] hover:from-[#B5550D] hover:to-[#924205] text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>تمت الإضافة للسلة</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>أضف الصندوق</span>
                        </>
                      )}
                    </button>

                    {/* زر عرض التفاصيل */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(bundle.id)}
                      className="w-full mt-2 py-2 text-[11px] font-black text-[#524B3E] hover:text-[#C25E12] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>إخفاء المحتوى</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>عرض محتوى الصندوق</span>
                        </>
                      )}
                    </button>

                    {/* قائمة المنتجات */}
                    {isExpanded && (
                      <div className="mt-3 p-3 bg-[#FAF8F3] rounded-xl border border-[#E8E1D1] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="text-[11px] font-black text-[#112616] mb-2 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-[#C25E12]" />
                          <span>محتوى الصندوق:</span>
                        </div>
                        <ul className="grid grid-cols-2 gap-1.5">
                          {bundle.items.map((item, idx) => (
                            <li key={idx} className="text-[11px] text-[#524B3E] font-medium flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-[#C25E12]" />
                              <span className="truncate">{item.productId}</span>
                              <span className="text-[#787163]">× {item.qty}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ─── ملاحظة سفلية ─── */}
        <div className="mt-8 p-4 rounded-2xl bg-white/60 border border-[#D4C8B5] flex items-start gap-3 max-w-3xl mx-auto">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-[#112616] mb-0.5">
              ضمان خُضرة للجودة
            </p>
            <p className="text-[11px] text-[#524B3E] leading-relaxed">
              إذا لم يكن أي صنف في الصندوق طازجاً بما يكفي، نستبدله فوراً في نفس اليوم
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};