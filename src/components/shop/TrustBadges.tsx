// ============================================================
// الملف: TrustBadges.tsx – الإصدار 6.0
// تصميم موحد ومتوافق تماماً مع قسم التقييمات وقسم المتجر
// حاوية رئيسية واحدة جامعة + عرض شبكي متناسق + تمرير انسيابي للجوال
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
      {/* ════════ الحاوية الموحدة المتوافقة تماماً مع تصميم قسم التقييمات ════════ */}
      <div className="relative bg-gradient-to-b from-[#FAF8F3] via-white to-[#F7F4EB] border-2 border-[#2D6A3F]/20 rounded-3xl sm:rounded-[36px] shadow-[0_12px_36px_rgba(45,106,63,0.08)] p-5 sm:p-8 lg:p-10 overflow-hidden">
        
        {/* إضاءات محيطية ناعمة */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#EAB308]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#2D6A3F]/8 rounded-full blur-3xl pointer-events-none" />

        {/* ─── 1. رأس القسم الموحد: العنوان والشارات ─── */}
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-[#2D6A3F]/12">
          
          {/* الجانب الأيمن: العنوان والوصف */}
          <div className="text-right space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A3D24] tracking-tight flex items-center gap-2">
              <span>علاش متجر خُضرة هو الخيار الأول للعائلات؟</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] inline-block shrink-0" />
            </h2>

            <p className="text-xs sm:text-sm text-[#5A6B5F] font-bold max-w-xl leading-relaxed">
              مئات العائلات في فاس كيثقوا فينا كل نهار لتوفير طعام صحي وطازج لموائدهم مع تجربة تسوق مريحة.
            </p>
          </div>

          {/* الجانب الأيسر: شارات الضمان المدمجة */}
          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            <div className="inline-flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-2xl border border-[#2D6A3F]/20 shadow-xs text-xs font-black text-[#1A3D24]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>4 ضمانات حصرية</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 px-3.5 py-2 rounded-2xl border border-emerald-500/30 shadow-xs text-xs font-black">
              <span>⚡ توصيل 45 دقيقة</span>
            </div>
          </div>

        </div>

        {/* ─── 2. شبكة المزايا المتناسقة ─── */}

        {/* على الشاشات المتوسطة والكبيرة (sm وأعلى): شبكة 4 أعمدة متكاملة */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 pt-6">
          {features.map((f) => (
            <div
              key={f.id}
              className="relative bg-white rounded-2xl border-2 border-[#2D6A3F]/15 hover:border-[#2D6A3F]/40 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group text-right"
            >
              <div>
                {/* رأس البطاقة: الأيقونة + الشارة */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${f.iconBg} border flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    {f.icon}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${f.tagColor}`}>
                    {f.badge}
                  </span>
                </div>

                {/* العنوان */}
                <h3 className="text-sm sm:text-base font-black text-[#1A3D24] leading-snug mb-2">
                  {f.title}
                </h3>

                {/* الوصف */}
                <p className="text-xs text-[#5A6B5F] font-semibold leading-relaxed">
                  {f.desc}
                </p>
              </div>

              {/* خط سفلي جمالي متناسق */}
              <div className="pt-3 mt-3 border-t border-stone-100 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700/80">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>معتمد لزبناء فاس</span>
              </div>
            </div>
          ))}
        </div>

        {/* على شاشات الهاتف المحمول (< sm): شريط أفقي انسيابي مدمج بدون فجوات */}
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
                className="w-[82vw] max-w-[300px] shrink-0 snap-center bg-white rounded-2xl border-2 border-[#2D6A3F]/15 p-4 shadow-xs flex flex-col justify-between text-right"
              >
                <div>
                  {/* رأس البطاقة على الهاتف */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${f.iconBg} border flex items-center justify-center shrink-0`}
                    >
                      {f.icon}
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${f.tagColor}`}>
                      {f.badge}
                    </span>
                  </div>

                  {/* عنوان الميزة */}
                  <h3 className="text-xs font-black text-[#1A3D24] leading-snug mb-1.5">
                    {f.title}
                  </h3>

                  {/* نص الوصف */}
                  <p className="text-xs text-[#5A6B5F] font-semibold leading-relaxed">
                    {f.desc}
                  </p>
                </div>

                {/* تذييل الميزة */}
                <div className="pt-2.5 mt-2.5 border-t border-stone-100 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700/80">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>معتمد لزبناء فاس</span>
                </div>
              </div>
            ))}
          </div>

          {/* نقاط التنقل وأسهم التوجيه المدمجة */}
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
                className="p-1.5 rounded-lg bg-white border border-[#2D6A3F]/20 text-[#1A3D24] disabled:opacity-40 cursor-pointer"
                aria-label="السابق"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={activeCardIndex >= features.length - 1}
                className="p-1.5 rounded-lg bg-white border border-[#2D6A3F]/20 text-[#1A3D24] disabled:opacity-40 cursor-pointer"
                aria-label="التالي"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── 3. الشريط السفلي المدمج: التزام الجودة ─── */}
        <div className="mt-6 pt-5 border-t border-[#2D6A3F]/12 flex items-center justify-center sm:justify-start gap-2 text-xs text-[#5A6B5F] font-bold text-center sm:text-right">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
          <span>التزامنا الدائم: خضار وفواكه طازجة يومياً من أسواق الجملة بفاس لباب داركم.</span>
        </div>

      </div>
    </section>
  );
};

export default TrustBadges;
