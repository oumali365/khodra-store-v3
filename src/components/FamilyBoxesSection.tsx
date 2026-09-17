// ============================================================
// FamilyBoxesSection.tsx – الإصدار 4.0
// تأثيرات بصرية خفيفة لتحسين الاستجابة
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  Package, Check, Plus, Minus, X, Sparkles, ShieldCheck,
  Truck, ShoppingBag, Eye, HeartHandshake, Users, Scale,
  Star, Leaf, Award, Percent, Clock,
} from 'lucide-react';
import { gsap } from 'gsap';
import { Product } from '../types';
import { STORE_CONFIG } from '../data/config';

// ─── مسارات صور صناديق العائلة ───
export const FAMILY_BOX_PUBLIC_IMAGES: Record<string, string> = {
  small: '/images/family-boxes/family-small.webp',
  medium: '/images/family-boxes/family-medium.webp',
  large: '/images/family-boxes/family-large.webp',
};

// ─── مكون عرض صورة صندوق العائلة ───
const BoxImageDisplay: React.FC<{
  src: string;
  alt: string;
  className?: string;
  badge?: string;
}> = ({ src, alt, className = '', badge }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-[#163920] to-[#0A180E] flex flex-col items-center justify-center p-4 text-center select-none ${className}`}>
        <span className="text-4xl sm:text-5xl mb-2 drop-shadow-md">📦</span>
        <span className="text-white font-black text-sm sm:text-base leading-tight drop-shadow-sm">
          {alt}
        </span>
        <span className="text-emerald-300 text-[11px] sm:text-xs mt-1 font-semibold">
          خضار وفواكه طازجة منتقاة بعناية
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

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
    image: FAMILY_BOX_PUBLIC_IMAGES.small,
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
    image: FAMILY_BOX_PUBLIC_IMAGES.medium,
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
    image: FAMILY_BOX_PUBLIC_IMAGES.large,
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
  selectedBox?: FamilyBox | null;
  onSelectBox?: (box: FamilyBox | null) => void;
}

export const FamilyBoxesSection: React.FC<FamilyBoxesSectionProps> = ({
  onAddToCart,
  selectedBox: controlledSelectedBox,
  onSelectBox: controlledOnSelectBox,
}) => {
  const [internalSelectedBox, setInternalSelectedBox] = useState<FamilyBox | null>(null);
  const isControlled = controlledSelectedBox !== undefined;
  const selectedBox = isControlled ? controlledSelectedBox : internalSelectedBox;

  const setSelectedBox = (box: FamilyBox | null) => {
    if (isControlled && controlledOnSelectBox) {
      controlledOnSelectBox(box);
    } else {
      setInternalSelectedBox(box);
    }
  };

  const [modalQty, setModalQty] = useState(1);
  const [addedBoxId, setAddedBoxId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedBox) {
      setModalQty(1);
    }
  }, [selectedBox]);

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

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
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

    setActiveBoxIndex(closestIdx);
  };

  const scrollToBox = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
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
      setActiveBoxIndex(index);
    }
  };

  return (
    <section
      id="family-boxes-section"
      className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-10 sm:my-16"
      aria-label="قسم صناديق العائلة التوفيرية"
    >
      {/* ─── عنوان القسم ─── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8 text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E4327]/10 text-[#1E4327] font-black text-xs sm:text-sm mb-3.5">
          <Package className="w-4 h-4 text-[#C25E12]" />
          <span>باقات التوفير الأسبوعية</span>
          <Sparkles className="w-3.5 h-3.5 text-[#C25E12]" />
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#112616] tracking-tight mb-2.5">
          صناديق العائلة الطازجة
        </h2>
        <p className="text-xs sm:text-sm text-[#524A3E] font-medium leading-relaxed max-w-md mx-auto">
          خضار وفواكه منتقاة بعناية تكفي أسرتك طيلة الأسبوع، مع توفير مؤكد في السعر وراحة تامة مباشرة لباب بيتك.
        </p>

        <div className="flex sm:hidden items-center justify-center gap-1.5 mt-4 pt-3 border-t border-stone-100">
          <span className="text-[11px] font-bold text-stone-500">مرر لاكتشاف جميع الباقات</span>
          <span className="text-xs text-[#008A4B]">←</span>
        </div>
      </div>

      {/* ─── عرض الصناديق ─── */}
      <div className="relative max-w-6xl mx-auto">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-row md:grid md:grid-cols-3 gap-5 sm:gap-6 lg:gap-7 overflow-x-auto md:overflow-x-visible pb-6 md:pb-0 pt-2 px-2 sm:px-0 snap-x snap-mandatory overscroll-x-contain scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {FAMILY_BOXES.map((box, idx) => {
            const isAdded = addedBoxId === box.id;
            const isActive = activeBoxIndex === idx;

            return (
              <article
                key={box.id}
                className={`w-[82vw] max-w-[325px] sm:w-[340px] md:w-auto md:max-w-none shrink-0 snap-center snap-always bg-white rounded-3xl border-2 shadow-sm transition-colors duration-200 p-4 sm:p-5 text-right flex flex-col justify-between ${
                  isActive ? 'border-[#008A4B]' : 'border-stone-200/90'
                }`}
              >
                <div>
                  <div
                    onClick={() => openBoxModal(box)}
                    className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-stone-100 cursor-pointer"
                  >
                    <BoxImageDisplay
                      src={box.image}
                      alt={box.name}
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black/0 pointer-events-none" />

                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#008A4B] text-white text-[11px] sm:text-xs font-black shadow-md tracking-wide">
                        {box.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#008A4B] text-white text-[11px] sm:text-xs font-black shadow-md tracking-wide">
                        {box.savingsBadge}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        onClick={() => openBoxModal(box)}
                        className="text-lg sm:text-xl font-black text-[#112616] cursor-pointer hover:text-[#1E4327] transition-colors leading-snug truncate"
                        title={box.name}
                      >
                        {box.name}
                      </h3>
                      <p className="text-stone-500 text-xs sm:text-sm font-semibold mt-1">
                        {box.subtitle}
                      </p>
                    </div>

                    <div className="text-left shrink-0" dir="ltr">
                      <div className="text-2xl sm:text-3xl font-black text-[#C25E12] leading-none tracking-tight">
                        <span>{box.price}</span>{' '}
                        <span className="text-sm sm:text-base font-black text-[#C25E12]">DH</span>
                      </div>
                      <div className="text-xs text-stone-400 line-through font-bold mt-1 tracking-tight">
                        <span>{box.originalPrice}</span> <span>DH</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-stone-200/90 text-stone-700 text-[11px] sm:text-xs font-bold">
                      <Users className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      <span>{box.servings}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-stone-200/90 text-stone-700 text-[11px] sm:text-xs font-bold">
                      <Scale className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      <span>{box.weight}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-stone-200/90 text-stone-700 text-[11px] sm:text-xs font-bold">
                      <Package className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      <span>{box.itemsCountLabel}</span>
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100">
                    <p className="text-xs sm:text-[13px] text-[#3E382F] font-semibold leading-relaxed line-clamp-2">
                      {box.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openBoxModal(box)}
                      className="py-2.5 sm:py-3 px-3 rounded-2xl border border-stone-300/90 bg-white hover:bg-stone-100 text-stone-800 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-xs"
                    >
                      <Eye className="w-4 h-4 text-stone-700" />
                      <span>التفاصيل</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, box)}
                      className={`flex-1 py-2.5 sm:py-3 px-3 rounded-2xl text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-sm transition-colors duration-200 cursor-pointer active:scale-95 ${
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

        <div className="flex md:hidden items-center justify-center gap-2 mt-4">
          {FAMILY_BOXES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToBox(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                activeBoxIndex === i ? 'w-6 bg-[#008A4B]' : 'w-2 bg-stone-300'
              }`}
              aria-label={`الانتقال إلى الصندوق ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ════════ النافذة المنبثقة ════════ */}
      {selectedBox && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="box-modal-title"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedBox(null)}
          />

          <div className="relative bg-[#FBF9F5] w-full max-w-xl rounded-[28px] shadow-2xl z-10 overflow-hidden flex flex-col max-h-[92vh] text-right border border-[#DFD1AC] animate-in zoom-in-95 duration-200 overscroll-contain">

            {/* الرأس */}
            <div className="relative h-48 sm:h-56 shrink-0 overflow-hidden bg-stone-900">
              <BoxImageDisplay
                src={selectedBox.image}
                alt={selectedBox.name}
                className="w-full h-full object-cover object-center"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1C10] via-[#0B1C10]/50 to-[#0B1C10]/10 pointer-events-none" />

              <button
                type="button"
                onClick={() => setSelectedBox(null)}
                className="absolute top-3.5 left-3.5 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-sm text-white flex items-center justify-center transition-colors cursor-pointer z-20 border border-white/20 active:scale-90"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 flex-wrap justify-end">
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#F5D76E] text-[#112616] text-xs font-black shadow-md">
                  {selectedBox.badge}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md text-white text-xs font-black border border-white/20 shadow-md">
                  <Clock className="w-3.5 h-3.5 text-[#F5D76E]" />
                  <span>متوفر اليوم</span>
                </span>
              </div>

              <div className="absolute bottom-0 right-0 left-0 p-4 sm:p-5 flex items-end justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 id="box-modal-title" className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-lg mb-0.5">
                    {selectedBox.name}
                  </h3>
                  <p className="text-emerald-100 text-xs sm:text-sm font-medium">
                    {selectedBox.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* التفاصيل */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 overscroll-contain">

              <div className="relative p-4 sm:p-4.5 rounded-2xl bg-gradient-to-l from-amber-50/90 to-orange-50/90 border border-amber-200/90 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-amber-900 font-black uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <Award className="w-3.5 h-3.5 text-[#C25E12]" />
                      <span>السعر الحصري</span>
                    </span>
                    <div className="flex items-baseline gap-2.5" dir="ltr">
                      <span className="text-3xl sm:text-4xl font-black text-[#C25E12] leading-none">
                        {selectedBox.price}
                      </span>
                      <span className="text-base sm:text-lg font-black text-[#C25E12]">DH</span>
                      <span className="text-sm text-stone-400 line-through font-bold">
                        {selectedBox.originalPrice} DH
                      </span>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-stone-700 text-xs font-bold shadow-2xs">
                      <Package className="w-3.5 h-3.5 text-[#C25E12]" />
                      <span>{selectedBox.itemsCountLabel}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-white border border-stone-200 text-center">
                  <Users className="w-5 h-5 text-[#1E4327] mx-auto mb-1.5" />
                  <div className="text-[10px] text-stone-500 font-black uppercase mb-0.5">يناسب</div>
                  <div className="text-xs font-black text-[#112616]">{selectedBox.servings}</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-stone-200 text-center">
                  <Scale className="w-5 h-5 text-[#1E4327] mx-auto mb-1.5" />
                  <div className="text-[10px] text-stone-500 font-black uppercase mb-0.5">الوزن</div>
                  <div className="text-xs font-black text-[#112616]">{selectedBox.weight}</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-stone-200 text-center">
                  <Package className="w-5 h-5 text-[#1E4327] mx-auto mb-1.5" />
                  <div className="text-[10px] text-stone-500 font-black uppercase mb-0.5">الأصناف</div>
                  <div className="text-xs font-black text-[#112616]">{selectedBox.itemsCountLabel}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="w-4 h-4 text-[#008A4B]" />
                  <h4 className="text-sm font-black text-[#112616]">عن هذا الصندوق</h4>
                </div>
                <p className="text-xs sm:text-sm text-[#38332B] leading-relaxed font-medium">
                  {selectedBox.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-black text-[#112616] flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#C25E12]" />
                    <span>محتويات الصندوق</span>
                  </h4>
                  <span className="text-[11px] font-black text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                    {selectedBox.items.length} صنف
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedBox.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-stone-200/90 flex items-center justify-between gap-2 hover:border-[#008A4B]/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-[#FAF6EE] border border-[#E8E1D3] flex items-center justify-center text-base shrink-0">
                          {item.icon}
                        </span>
                        <span className="font-bold text-[#112616] text-xs truncate">{item.name}</span>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-lg bg-[#EBFBF3] text-[#008A4B] font-black text-[11px] border border-[#86EFAC]">
                        {item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-l from-emerald-50 to-teal-50 border-2 border-emerald-200">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-black text-emerald-950 text-sm">ضمانات خُضرة</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-emerald-900">
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <div>
                      <div className="text-xs font-black mb-0.5">ضمان الرضا 100%</div>
                      <div className="text-[11px] font-medium opacity-90">استبدال فوري لأي صنف لم ينل إعجابك.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-emerald-900">
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <div>
                      <div className="text-xs font-black mb-0.5">توصيل مبرد وآمن</div>
                      <div className="text-[11px] font-medium opacity-90">نحافظ على برودة وطراوة المنتجات حتى باب منزلك.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-emerald-900">
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <div>
                      <div className="text-xs font-black mb-0.5">قطف طازج يومياً</div>
                      <div className="text-[11px] font-medium opacity-90">من المزرعة إلى بابك في أقل من 24 ساعة.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* التذييل */}
            <div className="p-4 sm:p-5 bg-white border-t-2 border-stone-200 flex items-center gap-3 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-1 bg-[#FAF8F4] border-2 border-[#D4C8B5] p-1 rounded-2xl shrink-0">
                <button
                  type="button"
                  onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                  disabled={modalQty <= 1}
                  className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors active:scale-90"
                  aria-label="إنقاص الكمية"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-black text-base text-[#112616] tabular-nums">
                  {modalQty}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQty((q) => Math.min(10, q + 1))}
                  disabled={modalQty >= 10}
                  className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors active:scale-90"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                id="modal-add-box-btn"
                type="button"
                onClick={() => handleModalAdd(selectedBox)}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg active:scale-98 transition-colors cursor-pointer border-2 border-[#0E2615]"
              >
                <ShoppingBag className="w-5 h-5 text-[#F5D76E]" />
                <span>أضف للسلة</span>
                <span className="px-3 py-1 rounded-xl bg-white/15 text-[#F5D76E] text-sm font-black tabular-nums" dir="ltr">
                  {(selectedBox.price * modalQty).toFixed(0)} DH
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};