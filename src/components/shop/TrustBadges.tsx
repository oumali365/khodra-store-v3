// ============================================================
// TrustBadges.tsx – الإصدار 6.1
// تصميم موحد: توسيط مثالي للبطاقات + وضوح أعلى
// ============================================================
import React, { useRef, useState } from 'react';
import {
  Sprout,
  Truck,
  ShieldCheck,
  HeartHandshake,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';

export const TrustBadges: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // ─── البطاقات الأربعة ───
  const features = [
    {
      id: 0,
      badge: 'طبيعي 100%',
      icon: <Sprout className="w-6 h-6 text-[#2D6A3F]" strokeWidth={2.5} />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      title: 'طراوة الحقول مباشرة',
      desc: 'كنجيبو الخضر والفواكه يومياً من فلاحين مغاربة، بلا وسطاء، لضمان الطراوة والجودة الطبيعية.',
    },
    {
      id: 1,
      badge: 'نفس اليوم',
      icon: <Truck className="w-6 h-6 text-[#EA580C]" strokeWidth={2.5} />,
      iconBg: 'bg-orange-500/10 border-orange-500/30',
      tagColor: 'bg-orange-100 text-orange-800 border-orange-300',
      title: 'توصيل سريع وفي الموعد',
      desc: 'طلبك كيوصلك نفس النهار، وفي الوقت اللي يناسبك، بدقة واحترافية عالية حتال باب دارك.',
    },
    {
      id: 2,
      badge: 'COD كاش وبنك',
      icon: <ShieldCheck className="w-6 h-6 text-[#2D6A3F]" strokeWidth={2.5} />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      title: 'دفع براحة واطمئنان',
      desc: 'ما كتخلص حتى كتوصلك السلعة وتشوفها بعينيك وترتاح — عاد كتخلص نقداً أو بالتحويل البنكي.',
    },
    {
      id: 3,
      badge: 'ضمان كامل',
      icon: <HeartHandshake className="w-6 h-6 text-[#EA580C]" strokeWidth={2.5} />,
      iconBg: 'bg-orange-500/10 border-orange-500/30',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
      title: 'ضمان الرضا 100%',
      desc: 'شي حاجة ما عجبتكش؟ كنبدلوها ليك أو كنرجعو ليك فلوسك فوراً — رضاك وراحة بالك هو رأس مالنا.',
    },
  ];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = Math.abs(container.scrollLeft);
    const cardWidth = container.firstElementChild
      ? (container.firstElementChild as HTMLElement).clientWidth + 12
      : 280;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveCardIndex(index);
  };

  const scrollToIndex = (idx: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.children[idx] as HTMLElement;
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      setActiveCardIndex(idx);
    }
  };

  const scrollNext = () => {
    const nextIdx = Math.min(features.length - 1, activeCardIndex + 1);
    scrollToIndex(nextIdx);
  };

  const scrollPrev = () => {
    const prevIdx = Math.max(0, activeCardIndex - 1);
    scrollToIndex(prevIdx);
  };

  return (
    <section
      className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-10 sm:my-14"
      aria-label="مميزات وثقة متجر خضرة"
      dir="rtl"
    >
      {/* ════════ الحاوية الموحدة ════════ */}
      <div className="relative bg-white border-2 border-[#2D6A3F]/15 rounded-3xl sm:rounded-[36px] shadow-[0_12px_36px_rgba(45,106,63,0.06)] p-5 sm:p-8 lg:p-10 overflow-hidden">

        {/* إضاءات محيطية ناعمة */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#EAB308]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#2D6A3F]/5 rounded-full blur-3xl pointer-events-none" />

        {/* ─── 1. رأس القسم الموحد (مُوسَّط) ─── */}
        <div className="relative flex flex-col items-center text-center gap-4 pb-6 border-b border-[#2D6A3F]/10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A3D24] tracking-tight flex items-center justify-center gap-2">
              <span>علاش متجر خُضرة هو الخيار الأول للعائلات؟</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] inline-block shrink-0" />
            </h2>

            <p className="text-sm sm:text-base text-[#3E4F43] font-bold leading-relaxed">
              مئات العائلات في فاس كيثقوا فينا كل نهار لتوفير طعام صحي وطازج لموائدهم مع تجربة تسوق مريحة.
            </p>
          </div>
        </div>

        {/* ─── 2. شبكة المزايا المتناسقة ─── */}

        {/* على الشاشات المتوسطة والكبيرة (sm وأعلى): شبكة 4 أعمدة */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 pt-6">
          {features.map((f) => (
            <div
              key={f.id}
              className="relative bg-white rounded-2xl border-2 border-[#2D6A3F]/15 hover:border-[#2D6A3F]/45 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between items-center text-center group"
            >
              <div className="w-full flex flex-col items-center">
                {/* الأيقونة */}
                <div
                  className={`w-14 h-14 rounded-2xl ${f.iconBg} border-2 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform mb-3`}
                >
                  {f.icon}
                </div>

                {/* الشارة */}
                <span className={`text-[11px] font-black px-3 py-1 rounded-full border-2 ${f.tagColor} mb-3`}>
                  {f.badge}
                </span>

                {/* العنوان */}
                <h3 className="text-base font-black text-[#1A3D24] leading-snug mb-2">
                  {f.title}
                </h3>

                {/* الوصف */}
                <p className="text-sm text-[#1F2937] font-semibold leading-relaxed">
                  {f.desc}
                </p>
              </div>

              {/* خط سفلي جمالي (مُوسَّط) */}
              <div className="w-full pt-3 mt-3 border-t-2 border-stone-100 flex items-center justify-center gap-1.5 text-[11px] font-black text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />
                <span>معتمد لزبناء فاس</span>
              </div>
            </div>
          ))}
        </div>

        {/* على شاشات الهاتف المحمول (< sm): شريط أفقي انسيابي */}
        <div className="sm:hidden pt-5">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory no-scrollbar"
            style={{ scrollbarWidth: 'none' }}
          >
            {features.map((f) => (
              <div
                key={f.id}
                className="w-[85vw] max-w-[320px] shrink-0 snap-center bg-white rounded-2xl border-2 border-[#2D6A3F]/15 p-5 shadow-sm flex flex-col justify-between items-center text-center"
              >
                <div className="w-full flex flex-col items-center">
                  {/* الأيقونة */}
                  <div
                    className={`w-12 h-12 rounded-2xl ${f.iconBg} border-2 flex items-center justify-center shrink-0 mb-2.5`}
                  >
                    {f.icon}
                  </div>

                  {/* الشارة */}
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 ${f.tagColor} mb-2.5`}>
                    {f.badge}
                  </span>

                  {/* العنوان */}
                  <h3 className="text-sm font-black text-[#1A3D24] leading-snug mb-1.5">
                    {f.title}
                  </h3>

                  {/* الوصف */}
                  <p className="text-xs text-[#1F2937] font-semibold leading-relaxed">
                    {f.desc}
                  </p>
                </div>

                {/* تذييل الميزة (مُوسَّط) */}
                <div className="w-full pt-3 mt-3 border-t-2 border-stone-100 flex items-center justify-center gap-1.5 text-[11px] font-black text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />
                  <span>معتمد لزبناء فاس</span>
                </div>
              </div>
            ))}
          </div>

          {/* نقاط التنقل وأسهم التوجيه */}
          <div className="flex items-center justify-between pt-2 px-1">
            <div className="flex items-center gap-1.5">
              {features.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    activeCardIndex === i
                      ? 'w-6 bg-[#2D6A3F]'
                      : 'w-2 bg-[#2D6A3F]/25 hover:bg-[#2D6A3F]/50'
                  }`}
                  aria-label={`الميزة ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={scrollPrev}
                disabled={activeCardIndex === 0}
                className="p-2 rounded-lg bg-white border-2 border-[#2D6A3F]/20 text-[#1A3D24] disabled:opacity-40 cursor-pointer"
                aria-label="السابق"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={activeCardIndex >= features.length - 1}
                className="p-2 rounded-lg bg-white border-2 border-[#2D6A3F]/20 text-[#1A3D24] disabled:opacity-40 cursor-pointer"
                aria-label="التالي"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── 3. الشريط السفلي المدمج (مُوسَّط) ─── */}
        <div className="mt-6 pt-5 border-t-2 border-[#2D6A3F]/10 flex items-center justify-center gap-2 text-sm text-[#1F2937] font-black text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
          <span>التزامنا الدائم: خضار وفواكه طازجة يومياً من أسواق الجملة بفاس لباب داركم.</span>
        </div>

      </div>
    </section>
  );
};

export default TrustBadges;