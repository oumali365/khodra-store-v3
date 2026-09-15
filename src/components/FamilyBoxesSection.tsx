// ============================================================
// FamilyBoxesSection.tsx – قسم صناديق العائلة التوفيرية
// بطاقات تفاعلية مطابقة تماماً للتصميم الاحترافي المطلوب في عمود واحد
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  Package, Check, Plus, Minus, X, Sparkles, ShieldCheck,
  Truck, ShoppingBag, Eye, HeartHandshake, Leaf, Users, Scale,
} from 'lucide-react';
import { gsap } from 'gsap';
import { Product } from '../types';
import { STORE_CONFIG } from '../data/config';

import vegBoxImg from '../assets/images/fresh_vegetables_basket_1788941771901.jpg';
import fruitBoxImg from '../assets/images/fresh_fruits_harvest_1788941788583.jpg';
import mixBoxImg from '../assets/images/organic_farm_produce_1788941803206.jpg';

export interface FamilyBoxItem {
  name: string;
  amount: string;
  icon: string;
}

export interface FamilyBox {
  id: number;
  name: string;
  shortName: string;
  subtitle: string;
  image: string;
  price: number;
  originalPrice: number;
  savings: number;
  savingsBadge: string;
  weight: string;
  servings: string;
  itemsCountLabel: string;
  badge: string;
  badgeColor?: string;
  description: string;
  highlights: string[];
  items: FamilyBoxItem[];
  features: string[];
}

export const FAMILY_BOXES: FamilyBox[] = [
  {
    id: 901,
    name: 'صندوق عائلة صغيرة',
    shortName: 'عائلة صغيرة',
    subtitle: 'مثالي لـ 2-3 أفراد',
    image: vegBoxImg,
    price: 89,
    originalPrice: 119,
    savings: 30,
    savingsBadge: 'وفر 30 dh',
    weight: '6-8 كغ',
    servings: '2-3 أفراد',
    itemsCountLabel: '9 أصناف',
    badge: 'الأكثر طلباً',
    description:
      'تشكيلة متوازنة ومختارة بعناية من الخضار الأساسية والفواكه الطازجة، مخصصة للأزواج والعائلات الصغيرة لتغطية احتياجات الأسبوع بطراوة تامة وبدون أي هدر.',
    highlights: ['بطاطس ممتازة 2.5 كغ', 'طماطم سلاطة 1.5 كغ', 'بصل أحمر 1.5 كغ', 'جزر بلدي 1 كغ', 'موز وبرتقال 2 كغ', 'باقة أعشاب هدية'],
    items: [
      { name: 'بطاطس بلدية ممتازة (للطبخ والقلي)', amount: '2.5 كغ', icon: '🥔' },
      { name: 'طماطم سلاطة حمراء ناضجة', amount: '1.5 كغ', icon: '🍅' },
      { name: 'بصل أحمر سايسي طري', amount: '1.5 كغ', icon: '🧅' },
      { name: 'جزر بلدي مقرمش وحلو', amount: '1 كغ', icon: '🥕' },
      { name: 'خيار مغربي مقرمش', amount: '500 غ', icon: '🥒' },
      { name: 'فلفل حلو مشكل (ألوان)', amount: '500 غ', icon: '🫑' },
      { name: 'برتقال بلدي للعصير والمائدة', amount: '1.5 كغ', icon: '🍊' },
      { name: 'موز مغربي عالي الحلاوة', amount: '1 كغ', icon: '🍌' },
      { name: 'باقة ورقيات (قزبر + معدنوس + نعناع)', amount: 'هدية مجانية', icon: '🌿' },
    ],
    features: [
      'وفر 30 dh مقارنة بالشراء المنفصل',
      'قطف طازج صبيحة يوم التوصيل',
      'حجم مثالي لتجنب التلف والهدر',
    ],
  },
  {
    id: 902,
    name: 'صندوق عائلة متوسطة',
    shortName: 'عائلة متوسطة',
    subtitle: 'مثالي لـ 4-5 أفراد',
    image: fruitBoxImg,
    price: 139,
    originalPrice: 175,
    savings: 36,
    savingsBadge: 'وفر 36 dh',
    weight: '14-16 كغ',
    servings: '4-5 أفراد',
    itemsCountLabel: '14 صنفاً',
    badge: 'الأكثر طلباً',
    description:
      'الباقة الأكثر توازناً للبيوت المغربية. كميات وافية من خضار الطواجن والكسكس والسلطات، مع سلة فواكه أسبوعية مشكلة تكفي العائلة 7 أيام كاملة بجودة مضمونة.',
    highlights: ['بطاطس 4 كغ', 'طماطم 3 كغ', 'بصل 2.5 كغ', 'خضار الطاجين 3 كغ', 'فواكه مشكلة 5 كغ', 'نعناع وورقيات'],
    items: [
      { name: 'بطاطس بلدية للطبخ والقلي', amount: '4 كغ', icon: '🥔' },
      { name: 'طماطم طرية وحمراء للمائدة والطبخ', amount: '3 كغ', icon: '🍅' },
      { name: 'بصل أحمر سايسي حلو', amount: '2.5 كغ', icon: '🧅' },
      { name: 'جزر بلدي مقرمش', amount: '2 كغ', icon: '🥕' },
      { name: 'قرع أخضر طري (كوسة/كورجيت)', amount: '1 كغ', icon: '🥬' },
      { name: 'فلفل مشكل + خيار مقرمش', amount: '1.5 كغ', icon: '🫑' },
      { name: 'باذنجان رومي خفيف', amount: '1 كغ', icon: '🍆' },
      { name: 'يقطين (قرع أحمر للكسكس)', amount: '1 كغ', icon: '🎃' },
      { name: 'برتقال مائدة وعصير', amount: '2.5 كغ', icon: '🍊' },
      { name: 'تفاح أطلسي ممتاز', amount: '1.5 كغ', icon: '🍎' },
      { name: 'موز محلي طري', amount: '1.5 كغ', icon: '🍌' },
      { name: 'فاكهة موسمية منتقاة', amount: '1 كغ', icon: '🍓' },
      { name: 'حامض ليمون بلدي', amount: '500 غ', icon: '🍋' },
      { name: 'باقة سخية ورقيات ونعناع فاسي', amount: 'هدية مجانية', icon: '🌿' },
    ],
    features: [
      'وفر 36 dh في سلة الأسبوع المتكاملة',
      'تنوع شامل يغطي كل وجبات الأسرة',
      'مغسول ومنقى بعناية وحبة بحبة',
    ],
  },
  {
    id: 903,
    name: 'صندوق عائلة كبيرة',
    shortName: 'عائلة كبيرة',
    subtitle: 'مثالي لـ 6-8 أفراد',
    image: mixBoxImg,
    price: 189,
    originalPrice: 245,
    savings: 56,
    savingsBadge: 'وفر 56 dh',
    weight: '20-22 كغ',
    servings: '6-8 أفراد',
    itemsCountLabel: '18 صنفاً',
    badge: 'التوفير الأكبر 👑',
    description:
      'صندوق البركة الشامل للعائلات الكبيرة ولمحبي الكرم والوفرة: أوزان سخية جداً من الخضار والفواكه، مع طبق بيض بلدي حر (10 بيضات) وتوصيل مجاني مباشر إلى باب بيتك.',
    highlights: ['خضار شاملة 12 كغ', 'فواكه منوعة 6 كغ', 'طبق بيض بلدي 10 حبات', 'ورقيات وأعشاب', 'توصيل مجاني 0 د.م'],
    items: [
      { name: 'بطاطس ممتازة (طبخ وقلي)', amount: '6 كغ', icon: '🥔' },
      { name: 'طماطم طازجة للمائدة والطهي', amount: '4 كغ', icon: '🍅' },
      { name: 'بصل أحمر ممتاز', amount: '4 كغ', icon: '🧅' },
      { name: 'جزر بلدي حلو', amount: '2.5 كغ', icon: '🥕' },
      { name: 'خضار الطاجين والسلطة المتنوعة', amount: '4 كغ', icon: '🥗' },
      { name: 'برتقال بلدي للعصير والمائدة', amount: '4 كغ', icon: '🍊' },
      { name: 'تفاح أطلسي مشكل', amount: '2.5 كغ', icon: '🍎' },
      { name: 'موز مغربي طري وعالي الحلاوة', amount: '2 كغ', icon: '🍌' },
      { name: 'فواكه موسمية متنوعة', amount: '2 كغ', icon: '🍐' },
      { name: 'طبق بيض بلدي حر من المزرعة', amount: '10 حبات', icon: '🥚' },
      { name: 'باقة ورقيات خضراء + نعناع أصيل', amount: 'هدية مجانية', icon: '🌿' },
      { name: 'خدمة التوصيل السريع لباب البيت', amount: 'مجاناً (0 د.م)', icon: '🚚' },
    ],
    features: [
      'أعلى قيمة توفير بالمتجر: وفر 56 dh فوراً',
      'توصيل مجاني مباشر إلى باب البيت',
      'طبق بيض بلدي حر من المزرعة هدية',
    ],
  },
];

interface FamilyBoxesSectionProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

export const FamilyBoxesSection: React.FC<FamilyBoxesSectionProps> = ({ onAddToCart }) => {
  const [selectedBox, setSelectedBox] = useState<FamilyBox | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [addedBoxId, setAddedBoxId] = useState<number | null>(null);

  // إغلاق النافذة المنبثقة بزر Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBox(null);
    };
    if (selectedBox) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedBox]);

  const boxToProduct = (box: FamilyBox): Product => ({
    id: box.id,
    name: box.name,
    category: 'veg',
    type: 'unit',
    price: box.price,
    unit_label: 'صندوق',
    stock: 30,
    icon: box.id === 903 ? '👑' : '🥬',
    image_url: box.image,
    active: true,
    description: box.description,
    origin: 'مزارع مغربية ممتازة',
  });

  // تحريك تأثير الطيران نحو السلة
  const animateFlyer = (sourceElement: HTMLElement | null, box: FamilyBox) => {
    if (!sourceElement) return;
    const rect = sourceElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const cartTarget = document.getElementById('sticky-cart-icon');
    let targetX = window.innerWidth > 640 ? window.innerWidth * 0.75 : window.innerWidth - 65;
    let targetY = window.innerHeight - 38;

    if (cartTarget) {
      const targetRect = cartTarget.getBoundingClientRect();
      targetX = targetRect.left + targetRect.width / 2;
      targetY =
        targetRect.top > window.innerHeight
          ? window.innerHeight - 38
          : targetRect.top + targetRect.height / 2;
    }

    const flyer = document.createElement('div');
    flyer.className =
      'fixed z-[9999] pointer-events-none rounded-2xl overflow-hidden shadow-2xl border-2 border-[#D9762B] bg-white flex items-center justify-center';
    flyer.style.width = '68px';
    flyer.style.height = '68px';
    flyer.style.left = `${rect.left + rect.width / 2 - 34}px`;
    flyer.style.top = `${rect.top + rect.height / 2 - 34}px`;

    const img = document.createElement('img');
    img.src = box.image;
    img.alt = box.name;
    img.className = 'w-full h-full object-cover';
    flyer.appendChild(img);

    document.body.appendChild(flyer);

    const startCenterX = rect.left + rect.width / 2;
    const startCenterY = rect.top + rect.height / 2;
    const deltaX = targetX - startCenterX;
    const deltaY = targetY - startCenterY;

    const tl = gsap.timeline({
      onComplete: () => {
        flyer.remove();
        const targetIcon = document.getElementById('sticky-cart-icon');
        if (targetIcon) {
          gsap
            .timeline()
            .to(targetIcon, { scale: 1.35, duration: 0.12, ease: 'back.out(2)' })
            .to(targetIcon, { scale: 1, duration: 0.18, ease: 'power2.out' });
        }
      },
    });

    tl.to(flyer, {
      scale: 1.15,
      duration: 0.15,
      ease: 'power1.out',
    }).to(
      flyer,
      {
        x: deltaX,
        y: deltaY,
        scale: 0.35,
        opacity: 0.75,
        duration: 0.55,
        ease: 'power2.in',
      },
      '-=0.05'
    );
  };

  const handleQuickAdd = (e: React.MouseEvent, box: FamilyBox) => {
    e.stopPropagation();
    const btn = e.currentTarget as HTMLElement;
    animateFlyer(btn, box);
    onAddToCart(boxToProduct(box), 1);

    setAddedBoxId(box.id);
    setTimeout(() => setAddedBoxId(null), 1800);
  };

  const handleModalAdd = (box: FamilyBox) => {
    const modalBtn = document.getElementById('modal-add-box-btn');
    animateFlyer(modalBtn, box);
    onAddToCart(boxToProduct(box), modalQty);
    setSelectedBox(null);
  };

  const openBoxModal = (box: FamilyBox) => {
    setSelectedBox(box);
    setModalQty(1);
  };

  const [activeBoxIndex, setActiveBoxIndex] = useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // تحديث المؤشر النشط بدقة عند التمرير الأفقي باللمس
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const cards = container.querySelectorAll('article');
    let closestIdx = 0;
    let minDiff = Infinity;

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const diff = Math.abs(cardRect.right - containerRect.right);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setActiveBoxIndex(closestIdx);
  };

  const scrollToBox = (index: number) => {
    if (!scrollContainerRef.current) return;
    const cards = scrollContainerRef.current.querySelectorAll('article');
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: 'smooth',
        inline: 'start',
        block: 'nearest',
      });
      setActiveBoxIndex(index);
    }
  };

  return (
    <section
      id="family-boxes-section"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
      aria-label="قسم صناديق العائلة التوفيرية"
    >
      {/* ─── عنوان القسم داخل بطاقة مطابقة لتصميم البطاقات ─── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-5 sm:p-7 text-center max-w-md sm:max-w-lg mx-auto mb-6 sm:mb-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E4327]/10 text-[#1E4327] font-black text-xs sm:text-sm mb-3">
          <Package className="w-4 h-4 text-[#C25E12]" />
          <span>باقات التوفير الأسبوعية</span>
          <Sparkles className="w-3.5 h-3.5 text-[#C25E12]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#112616] tracking-tight mb-2">
          صناديق العائلة الطازجة
        </h2>
        <p className="text-xs sm:text-sm text-[#524A3E] font-medium leading-relaxed">
          خضار وفواكه منتقاة بعناية تكفي أسرتك طيلة الأسبوع، مع توفير مؤكد في السعر وراحة تامة.
        </p>

        {/* مؤشر مرئي للتمرير على الشاشات الصغيرة */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 mt-4 pt-3 border-t border-stone-100">
          <span className="text-[11px] font-bold text-stone-500">مرر لاكتشاف جميع الباقات</span>
          <span className="text-xs text-[#008A4B] animate-pulse">←</span>
        </div>
      </div>

      {/* ─── عرض الصناديق: أفقي متداخل بانسيابية على الشاشات الصغيرة (Horizontal Scroll) وعمودي متناسق على الشاشات الكبيرة ─── */}
      <div className="relative max-w-md sm:max-w-lg mx-auto">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-row sm:flex-col gap-3.5 sm:gap-7 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 pt-1 px-4 sm:px-0 scroll-px-4 snap-x snap-mandatory overscroll-x-contain scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {FAMILY_BOXES.map((box, idx) => {
            const isAdded = addedBoxId === box.id;

            return (
              <article
                key={box.id}
                className="w-[85vw] max-w-[340px] sm:w-full sm:max-w-none shrink-0 snap-start snap-always bg-white rounded-3xl border border-stone-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 p-3.5 sm:p-4 text-right flex flex-col justify-between"
              >
                <div>
                  {/* ─── صورة الصندوق مع الزوايا المنحنية والشارات المطابقة للصورة ─── */}
                  <div
                    onClick={() => openBoxModal(box)}
                    className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-stone-100 cursor-pointer group"
                  >
                    <img
                      src={box.image}
                      alt={box.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
                    />

                    {/* تأثير تدرج خفيف عند التحويم */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />

                    {/* شارة أعلى اليمين: الأكثر طلباً */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#008A4B] text-white text-xs font-black shadow-md tracking-wide">
                        {box.badge}
                      </span>
                    </div>

                    {/* شارة أسفل اليسار: وفّر XX dh */}
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#008A4B] text-white text-xs font-black shadow-md tracking-wide">
                        {box.savingsBadge}
                      </span>
                    </div>
                  </div>

                  {/* ─── سطر العنوان والسعر (كتابة السعر والعملة من اليسار إلى اليمين: 139 DH) ─── */}
                  <div className="mt-4 flex items-start justify-between gap-3">
                    {/* الجانب الأيمن: اسم الصندوق والوصف المختصر */}
                    <div>
                      <h3
                        onClick={() => openBoxModal(box)}
                        className="text-xl sm:text-2xl font-black text-[#112616] cursor-pointer hover:text-[#1E4327] transition-colors leading-tight"
                      >
                        {box.name}
                      </h3>
                      <p className="text-stone-500 text-xs sm:text-sm font-semibold mt-1">
                        {box.subtitle}
                      </p>
                    </div>

                    {/* الجانب الأيسر: السعر الحالي والمشطوب مكتوب من اليسار لليمين (مثال: 139 DH) */}
                    <div className="text-left shrink-0" dir="ltr">
                      <div className="text-2xl sm:text-3xl font-black text-[#C25E12] leading-none tracking-tight">
                        <span>{box.price}</span>{' '}
                        <span className="text-base sm:text-lg font-black text-[#C25E12]">DH</span>
                      </div>
                      <div className="text-xs sm:text-sm text-stone-400 line-through font-bold mt-1 tracking-tight">
                        <span>{box.originalPrice}</span> <span>DH</span>
                      </div>
                    </div>
                  </div>

                  {/* ─── شارات المواصفات (أفراد، وزن، أصناف) ─── */}
                  <div className="mt-3.5 flex items-center gap-2 flex-wrap">
                    {/* شارة عدد الأفراد */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-stone-200/90 text-stone-700 text-xs font-bold transition-colors hover:bg-stone-100">
                      <Users className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      <span>{box.servings}</span>
                    </span>

                    {/* شارة الوزن */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-stone-200/90 text-stone-700 text-xs font-bold transition-colors hover:bg-stone-100">
                      <Scale className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      <span>{box.weight}</span>
                    </span>

                    {/* شارة عدد الأصناف */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-stone-200/90 text-stone-700 text-xs font-bold transition-colors hover:bg-stone-100">
                      <Package className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      <span>{box.itemsCountLabel}</span>
                    </span>
                  </div>
                </div>

                <div>
                  {/* خط فاصل رفيع */}
                  <hr className="border-stone-100 my-4" />

                  {/* ─── الأزرار التفاعلية السفلية (التفاصيل + أضف للسلة) ─── */}
                  <div className="flex items-center gap-2.5">
                    {/* زر التفاصيل على اليمين */}
                    <button
                      type="button"
                      onClick={() => openBoxModal(box)}
                      className="flex-1 py-3 px-3 rounded-2xl border border-stone-300/90 bg-white hover:bg-stone-100 text-stone-800 text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Eye className="w-4 h-4 text-stone-700" />
                      <span>التفاصيل</span>
                    </button>

                    {/* زر أضف للسلة على اليسار بالأخضر الداكن مع تأثير تفاعلي */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, box)}
                      className={`flex-1 py-3 px-3 rounded-2xl text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95 ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#163920] hover:bg-[#0E2615]'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4 text-[#F5D76E]" />
                          <span>تمت الإضافة</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 text-[#F5D76E]" />
                          <span>أضف للسلة</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* مؤشرات النقاط التفاعلية (Dots) للشاشات الصغيرة لتسهيل التبديل بين الصناديق */}
        <div className="flex sm:hidden items-center justify-center gap-2 mt-3">
          {FAMILY_BOXES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToBox(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeBoxIndex === i ? 'w-6 bg-[#008A4B]' : 'w-2 bg-stone-300'
              }`}
              aria-label={`الانتقال إلى الصندوق ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ─── نافذة منبثقة تفاعلية لعرض كامل المحتويات والضمانات ─── */}
      {selectedBox && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="box-modal-title"
        >
          {/* الخلفية المعتمة */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedBox(null)}
          />

          {/* محتوى النافذة */}
          <div className="relative bg-[#FAF8F4] w-full max-w-lg rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] text-right border border-[#DFD1AC] animate-in zoom-in-95 duration-200">
            {/* ─── صورة الغلاف مع زر الإغلاق ─── */}
            <div className="relative h-48 sm:h-52 shrink-0 overflow-hidden bg-stone-900">
              <img
                src={selectedBox.image}
                alt={selectedBox.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1C10]/95 via-[#0B1C10]/40 to-transparent" />

              {/* زر الإغلاق */}
              <button
                type="button"
                onClick={() => setSelectedBox(null)}
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>

              {/* معلومات الغلاف */}
              <div className="absolute bottom-4 right-4 left-4 flex items-end justify-between gap-2">
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-xl bg-[#008A4B] text-white text-xs font-black shadow-md mb-2">
                    {selectedBox.badge}
                  </span>
                  <h3 id="box-modal-title" className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {selectedBox.name}
                  </h3>
                  <p className="text-emerald-100 text-xs font-medium mt-0.5">
                    {selectedBox.subtitle}
                  </p>
                </div>

                <span className="shrink-0 px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-black border border-white/20">
                  {selectedBox.weight}
                </span>
              </div>
            </div>

            {/* ─── تفاصيل الصندوق القابلة للتمرير ─── */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* شريط السعر والتوفير */}
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 font-bold block mb-1">سعر العرض التوفيري:</span>
                  <div className="flex items-baseline gap-2" dir="ltr">
                    <span className="text-2xl font-black text-[#C25E12]">
                      {selectedBox.price} <span className="text-sm font-black text-[#C25E12]">DH</span>
                    </span>
                    <span className="text-sm text-stone-400 line-through font-bold">
                      {selectedBox.originalPrice} DH
                    </span>
                  </div>
                </div>

                <div className="text-left">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#EBFBF3] border border-[#86EFAC] text-[#008A4B] font-black text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span dir="ltr">{selectedBox.savingsBadge}</span>
                  </span>
                  <span className="text-[11px] text-stone-500 font-bold block mt-1">
                    {selectedBox.servings}
                  </span>
                </div>
              </div>

              {/* الوصف */}
              <p className="text-xs sm:text-sm text-[#38332B] leading-relaxed font-medium">
                {selectedBox.description}
              </p>

              {/* قائمة المحتويات الدقيقة */}
              <div>
                <h4 className="text-sm font-black text-[#112616] mb-2.5 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#C25E12]" />
                  <span>محتويات الصندوق بالتفصيل ({selectedBox.items.length} أصناف):</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedBox.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-stone-200/90 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <span className="font-bold text-[#112616] truncate">{item.name}</span>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#FAF6EE] text-[#1E4327] font-black text-[11px] border border-[#E8E1D3]">
                        {item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* الضمانات */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
                <div className="font-black text-emerald-950 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>ضمانات خُضرة للجودة والطراوة:</span>
                </div>                
                <div className="flex items-center gap-2 text-emerald-900 font-medium">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>ضمان الرضا 100%، استبدال فوري لأي صنف لم ينل إعجابك.</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-900 font-medium">
                  <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>توصيل سريع وآمن يحافظ على برودة وطراوة المنتجات.</span>
                </div>
              </div>
            </div>

            {/* ─── التذييل: عداد الكمية وزر الإضافة للسلة ─── */}
            <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 bg-[#FAF8F4] border border-[#D4C8B5] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                  disabled={modalQty <= 1}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                  aria-label="إنقاص الكمية"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-black text-sm text-[#112616]">
                  {modalQty}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQty((q) => Math.min(10, q + 1))}
                  disabled={modalQty >= 10}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                id="modal-add-box-btn"
                type="button"
                onClick={() => handleModalAdd(selectedBox)}
                className="flex-1 py-3 px-5 rounded-2xl bg-[#163920] hover:bg-[#0E2615] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#F5D76E]" />
                <span>أضف للسلة</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white/20 text-[#F5D76E] text-xs font-black" dir="ltr">
                  {(selectedBox.price * modalQty)} DH
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
