import React from 'react';
import { Sprout, Truck, ShieldCheck, HeartHandshake, Clock, Star, TrendingUp } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  const features = [
    {
      icon: <Sprout className="w-7 h-7 sm:w-8 sm:h-8 text-[#4F8A5A]" />,
      title: 'طراوة الحقول مباشرة',
      desc: 'كنجيبو الخضر والفواكه يومياً من الفلاحين المغاربة مباشرة، بلا وسطاء، لضمان الطراوة والجودة اللي تستحق.',
    },
    {
      icon: <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-[#D9762B]" />,
      title: 'توصيل سريع وفي الموعد',
      desc: 'طلبك كيوصلك نفس النهار وفي الفترة الزمنية المناسبة ليك بكل دقة واحترافية لباب دارك.',
    },
    {
      icon: <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-[#2E5336]" />,
      title: 'دفع براحة واطمئنان',
      desc: 'ما كتخلص حتى كتوصلك السلعة وتشوفها بعينيك وتتأكد من الجودة — عاد كتخلص نقداً أو بتحويل بنكي.',
    },
    {
      icon: <HeartHandshake className="w-7 h-7 sm:w-8 sm:h-8 text-[#B85E1C]" />,
      title: 'ضمان الرضا 100%',
      desc: 'شي حاجة ما عجبتكش؟ كنبدلوها ليك أو كنرجعو ليك فلوسها فالحين — رضاك هو رأس مالنا.',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-8 sm:my-14">
      <div className="bg-white border border-[#D4C8B5] rounded-3xl p-4 sm:p-10 shadow-sm text-center">
        <h2 className="text-lg sm:text-2xl font-black text-[#112616] mb-2">
          علاش متجر خُضرة هو الخيار الأول للعائلات؟
        </h2>
        <p className="text-[11px] sm:text-sm text-[#2D271E] max-w-xl mx-auto mb-6 sm:mb-8 font-semibold">
          مئات الزبناء الأوفياء في فاس كيثقوا فينا كل نهار لتوفير طعام صحي وطازج لموائدهم
        </p>

        {/* شبكة 2×2 حتى في وضع الهاتف */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 text-right">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="bg-[#F7F4EC] border border-[#D4C8B5] rounded-2xl p-3 sm:p-6 shadow-xs hover:shadow-md hover:border-[#C25E12] transition-all flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white border border-[#D4C8B5] flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-xs">
                {f.icon}
              </div>
              <h3 className="font-black text-xs sm:text-lg text-[#112616] mb-1 sm:mb-2 leading-tight">
                {f.title}
              </h3>
              <p className="text-[10px] sm:text-sm text-[#2D271E] leading-relaxed font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};