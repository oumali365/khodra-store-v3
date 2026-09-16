// ============================================================
// الملف: TrustBadges.tsx – الإصدار 2.0
// شارات الثقة – تصميم متناسق مع المتجر
// ============================================================
import React from 'react';
import {
  Sprout,
  Truck,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Award,
  Users,
  Leaf,
} from 'lucide-react';

export const TrustBadges: React.FC = () => {
  const features = [
    {
      icon: <Sprout className="w-6 h-6 sm:w-8 sm:h-8 text-[#163920]" />,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      title: 'طراوة الحقول مباشرة',
      desc: 'كنجيبو الخضر والفواكه يومياً من الفلاحين المغاربة مباشرة، بلا وسطاء، لضمان الطراوة والجودة اللي تستحق.',
    },
    {
      icon: <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-[#C25E12]" />,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      title: 'توصيل سريع وفي الموعد',
      desc: 'طلبك كيوصلك نفس النهار وفي الفترة الزمنية المناسبة ليك بكل دقة واحترافية لباب دارك.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-[#163920]" />,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      title: 'دفع براحة واطمئنان',
      desc: 'ما كتخلص حتى كتوصلك السلعة وتشوفها بعينيك وتتأكد من الجودة — عاد كتخلص نقداً أو بتحويل بنكي.',
    },
    {
      icon: <HeartHandshake className="w-6 h-6 sm:w-8 sm:h-8 text-[#C25E12]" />,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      title: 'ضمان الرضا 100%',
      desc: 'شي حاجة ما عجبتكش؟ كنبدلوها ليك أو كنرجعو ليك فلوسها فالحين — رضاك هو رأس مالنا.',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-8 sm:my-14">
      <div className="relative bg-white border border-[#E8E1D3] rounded-[24px] p-5 sm:p-8 shadow-sm overflow-hidden">

        {/* ─── زخارف خلفية ─── */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#F5D76E]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#163920]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative">

          {/* ════════ الرأس ════════ */}
          <div className="text-center mb-6 sm:mb-8">
            {/* شارة علوية */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#163920]/8 border border-[#163920]/20 text-[#163920] text-[11px] sm:text-xs font-black mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#C25E12]" />
              <span>لماذا خُضرة؟</span>
              <Leaf className="w-3.5 h-3.5 text-[#163920]" />
            </div>

            {/* العنوان */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#112616] mb-2 leading-tight">
              علاش متجر خُضرة هو الخيار الأول للعائلات؟
            </h2>

            {/* الوصف */}
            <p className="text-xs sm:text-sm text-[#524B3E] max-w-2xl mx-auto font-medium leading-relaxed">
              مئات الزبناء الأوفياء في فاس كيثقوا فينا كل نهار لتوفير طعام صحي وطازج لموائدهم
            </p>
          </div>

          {/* ════════ شبكة 2×2 ════════ */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 text-right">
            {features.map((f, idx) => (
              <div
                key={idx}
                className="relative bg-white border border-[#E8E1D3] rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-lg hover:border-[#C25E12]/40 hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center text-center group overflow-hidden"
              >
                {/* شريط علوي ملون */}
                <div className={`absolute top-0 inset-x-0 h-1 ${f.bgColor.replace('bg-', 'bg-gradient-to-r from-')} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />

                {/* الأيقونة */}
                <div
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${f.bgColor} border-2 ${f.borderColor} flex items-center justify-center mb-3 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}
                >
                  {f.icon}

                  {/* شارة رقم صغيرة (اختيارية) */}
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#163920] text-[#F5D76E] text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                    {idx + 1}
                  </span>
                </div>

                {/* العنوان */}
                <h3 className="font-black text-xs sm:text-sm md:text-base text-[#112616] mb-1.5 leading-tight">
                  {f.title}
                </h3>

                {/* الوصف */}
                <p className="text-[10px] sm:text-xs text-[#524B3E] leading-relaxed font-medium">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* ════════ شارات الثقة السفلية ════════ */}
          <div className="mt-6 sm:mt-8 pt-5 border-t border-[#F0E9DA]">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">

              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#163920] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-xs">
                <Award className="w-3.5 h-3.5 text-emerald-700" />
                <span>+500 عميل سعيد</span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#163920] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>ضمان الجودة 100%</span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#C25E12] bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-xs">
                <Truck className="w-3.5 h-3.5 text-[#C25E12]" />
                <span>توصيل نفس اليوم</span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#C25E12] bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-xs">
                <Users className="w-3.5 h-3.5 text-[#C25E12]" />
                <span>عائلات فاس تثق بنا</span>
              </span>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};