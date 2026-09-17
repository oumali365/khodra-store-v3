// ============================================================
// الملف: TrustBadges.tsx – الإصدار 5.0
// شارات الثقة – تأثيرات بصرية خفيفة + لون برتقالي
// ============================================================
import React, { useRef, useState } from 'react';
import {
  Sprout,
  Truck,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Award,
} from 'lucide-react';

export const TrustBadges: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // ─── البطاقات الأربعة ───
  const features = [
    {
      id: 0,
      icon: <Sprout className="w-8 h-8 sm:w-9 sm:h-9 text-[#163920]" />,
      iconBg: 'bg-emerald-50 border-emerald-200/80',
      title: 'طراوة الحقول مباشرة',
      desc: 'كنجيبو الخضر والفواكه يومياً من فلاحين مغاربة، بلا وسطاء، لضمان الطراوة والجودة الطبيعية.',
    },
    {
      id: 1,
      icon: <Truck className="w-8 h-8 sm:w-9 sm:h-9 text-[#C25E12]" />,
      iconBg: 'bg-amber-50 border-amber-200/80',
      title: 'توصيل سريع وفي الموعد',
      desc: 'طلبك كيوصلك نفس النهار، وفي الوقت اللي يناسبك، بدقة واحترافية عالية حتال باب دارك.',
    },
    {
      id: 2,
      icon: <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-[#163920]" />,
      iconBg: 'bg-emerald-50 border-emerald-200/80',
      title: 'دفع براحة واطمئنان',
      desc: 'ما كتخلص حتى كتوصلك السلعة وتشوفها بعينيك وترتاح — عاد كتخلص نقداً أو بالتحويل البنكي.',
    },
    {
      id: 3,
      icon: <HeartHandshake className="w-8 h-8 sm:w-9 sm:h-9 text-[#C25E12]" />,
      iconBg: 'bg-amber-50 border-amber-200/80',
      title: 'ضمان الرضا 100%',
      desc: 'شي حاجة ما عجبتكش؟ كنبدلوها ليك أو كنرجعو ليك فلوسك فوراً — رضاك وراحة بالك هو رأس مالنا.',
    },
  ];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cards = container.querySelectorAll('article');
    const containerCenter = container.getBoundingClientRect().left + container.offsetWidth / 2;

    let closestIdx = 0;
    let minDiff = Infinity;

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const diff = Math.abs(cardCenter - containerCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setActiveCardIndex(closestIdx);
  };

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cards = container.querySelectorAll('article');
    if (cards[index]) {
      const card = cards[index] as HTMLElement;
      const cardLeft = card.offsetLeft;
      const cardWidth = card.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollPosition = cardLeft - (containerWidth - cardWidth) / 2;

      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
      setActiveCardIndex(index);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-10 sm:my-16" aria-label="مميزات وثقة متجر خضرة">
      {/* ─── العنوان والوصف ─── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 text-center max-w-md sm:max-w-xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#163920]/10 text-[#163920] font-black text-xs sm:text-sm mb-3">
          <Sparkles className="w-4 h-4 text-[#C25E12]" />
          <span>ضمانات وخدمة متجر خُضرة</span>
          <Award className="w-3.5 h-3.5 text-[#163920]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#112616] tracking-tight mb-2.5">
          علاش متجر خُضرة هو الخيار الأول للعائلات؟
        </h2>

        <p className="text-xs sm:text-sm text-[#524B3E] font-medium leading-relaxed">
          مئات العائلات في فاس كيثقوا فينا كل نهار لتوفير طعام صحي وطازج لموائدهم
        </p>

        <div className="flex sm:hidden items-center justify-center gap-1.5 mt-4 pt-3 border-t border-stone-100">
          <span className="text-[11px] font-bold text-stone-500">مرر لاكتشاف جميع الميزات</span>
          <span className="text-xs text-[#C25E12] font-black">←</span>
        </div>
      </div>

      {/* ─── عرض أفقي بسيط ─── */}
      <div className="relative max-w-5xl mx-auto py-2">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex flex-row gap-4 sm:gap-6 overflow-x-auto py-5 px-[14vw] sm:px-12 md:px-6 snap-x snap-mandatory overscroll-x-contain scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {features.map((f, idx) => {
            const isActive = activeCardIndex === idx;

            return (
              <article
                key={f.id}
                onClick={() => scrollToIndex(idx)}
                className={`w-[66vw] min-w-[210px] max-w-[245px] sm:w-[230px] md:w-[245px] shrink-0 snap-center snap-always bg-white rounded-3xl border-2 shadow-sm transition-colors duration-200 px-5 py-7 text-center flex flex-col items-center justify-center min-h-[300px] sm:min-h-[320px] cursor-pointer group select-none ${
                  isActive
                    ? 'border-[#C25E12]'
                    : 'border-stone-200/90'
                }`}
              >
                {/* الأيقونة */}
                <div
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl ${f.iconBg} border flex items-center justify-center shadow-xs mb-5`}
                >
                  {f.icon}
                </div>

                {/* العنوان */}
                <h3 className="text-base sm:text-lg font-black text-[#112616] leading-snug mb-3 text-center">
                  {f.title}
                </h3>

                {/* النص */}
                <p className="text-xs sm:text-[13px] text-[#524B3E] font-medium leading-relaxed text-center">
                  {f.desc}
                </p>
              </article>
            );
          })}
        </div>

        {/* ─── مؤشرات النقاط (Dots) باللون البرتقالي ─── */}
        <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
          {features.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToIndex(idx)}
              className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                activeCardIndex === idx
                  ? 'w-7 bg-[#C25E12]'
                  : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
              aria-label={`الانتقال إلى الميزة ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};