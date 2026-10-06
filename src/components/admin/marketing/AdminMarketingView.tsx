// ============================================================
// AdminMarketingView.tsx – مركز النشر والتسويق المتطور لمتجر خُضرة
// يدعم 7 قوالب مغربية مخصصة، مولد أسعار اليوم الحي، معاينة الهاتف الذكي
// والنشر متعدد القنوات (واتساب، إنستغرام، فيسبوك، تليغرام، وتيك توك)
// ============================================================
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Share2,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Send,
  Smartphone,
  Tag,
  MapPin,
  RefreshCw,
  Eye,
  Edit3,
  Calendar,
  Clock,
  TrendingUp,
  Settings,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react';
import { STORE_CONFIG } from '../../../data/config';
import { fetchProducts } from '../../../services/supabaseService';
import { Product } from '../../../types';

export type MarketingTemplateId =
  | 'fresh_morning'
  | 'family_boxes'
  | 'weekend_deals'
  | 'moroccan_tagine'
  | 'b2b_restaurants'
  | 'whatsapp_status'
  | 'free_delivery';

interface MarketingTemplateMeta {
  id: MarketingTemplateId;
  emoji: string;
  title: string;
  badge: string;
  description: string;
}

const TEMPLATES_META: MarketingTemplateMeta[] = [
  {
    id: 'fresh_morning',
    emoji: '🌅',
    title: 'طراوة الصباح وسوق بنسودة',
    badge: 'الأكثر استخداماً',
    description: 'إعلان وصول خضر وفواكه الصباح مقطوعة اليوم مع تأكيد التوصيل السريع لباب المنزل.',
  },
  {
    id: 'family_boxes',
    emoji: '📦',
    title: 'صناديق العائلة التوفيرية',
    badge: 'توفير أسبوعي',
    description: 'ترويج باقات الأسبوع (صندوق الأسرة الاقتصادي، الفواكه الطازجة، صندوق الطبخ المغربي).',
  },
  {
    id: 'weekend_deals',
    emoji: '⚡',
    title: 'عروض نهاية الأسبوع والجمعة',
    badge: 'عروض خاصة',
    description: 'تخفيضات نهاية الأسبوع وجمعة مباركة مع هدايا التوصيل وخضار الكسكس الطازجة.',
  },
  {
    id: 'moroccan_tagine',
    emoji: '🍲',
    title: 'باقة الطاجين والكسكس المغربي',
    badge: 'تقليدي أصيل',
    description: 'تشكيلة متكاملة لوجبة الطاجين الفاسي وخضار الكسكس السبعة مع القزبر والمعدنوس البلدي.',
  },
  {
    id: 'b2b_restaurants',
    emoji: '🏢',
    title: 'عروض المطاعم والمقاهي B2B',
    badge: 'أسعار الجملة',
    description: 'عرض موجه لأصحاب المطاعم، الفنادق، وسناك فاس بتوريد يومي وفاتورة رسمية.',
  },
  {
    id: 'whatsapp_status',
    emoji: '📱',
    title: 'حالة واتساب سريعة (Status/Story)',
    badge: 'مختصر ومباشر',
    description: 'نص قصير منسق بنقاط محددة ملائم لنشره مباشرة في حالات واتساب وإنستغرام ستوري.',
  },
  {
    id: 'free_delivery',
    emoji: '🚴',
    title: 'عرض التوصيل المجاني والسريع',
    badge: 'توصيل مجاني',
    description: 'التركيز على شريط التوصيل المجاني للطلبات فوق 120 درهم وسرعة الوصول لكافة الأحياء.',
  },
];

interface SocialLinks {
  facebook: string;
  instagram: string;
  whatsappGroup: string;
  telegramChannel: string;
  telegramBotToken: string;
  telegramChatId: string;
  tiktok: string;
}

const DEFAULT_LINKS: SocialLinks = {
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  whatsappGroup: `https://wa.me/${STORE_CONFIG.whatsappNumber}`,
  telegramChannel: '',
  telegramBotToken: '',
  telegramChatId: '',
  tiktok: '',
};

function buildTemplateText(
  id: MarketingTemplateId,
  storeUrl: string,
  phone: string,
  priceListSummary?: string,
): string {
  const pricesPart = priceListSummary
    ? `\n\n🥬 أسعار اليوم المعتمدة في المتجر:\n${priceListSummary}\n`
    : '';

  switch (id) {
    case 'fresh_morning':
      return `🌿 طراوة الصباح من سوق الجملة بنسودة لباب دارك بفاس! 🧺☀️

صباح الخير يا أهل فاس! سلعتنا اليوم منتقاة حبة بحبة على الفجر من سوق الجملة بنسودة:
• خضروات طازجة من الحقل مباشرة 🥕🥔🍅
• فواكه موسمية سكرية ونقية 🍊🍎🍌
• باقات الأعشاب والنعناع الفاسي المعطر 🌿
${pricesPart}
🚀 توصيل يومي سريع لباب منزلك في كافة أحياء فاس (طريق إيموزار، الأطلس، النرجس، عين الشقف، المدينة الجديدة).
💰 الدفع عند الاستلام كاش أو تحويل بنكي فوري بعد معاينة الطلب.

📲 للطلب السريع تصفح المتجر الآن:
${storeUrl}

أو راسلنا مباشرة على واتساب:
wa.me/${phone}

#خضرة_فاس #سوق_بنسودة #خضر_طازجة #توصيل_فاس #طراوة_اليوم`;

    case 'family_boxes':
      return `📦 وفّر وقتك وفلوسك مع صناديق خُضرة العائلية الأسبوعية! 👨‍👩‍👧‍👦✨

تعبت من التسوق اليومي؟ جهزنا لك صناديق متكاملة تكفي احتياجات عائلتك طيلة الأسبوع وبأحسن سعر في فاس:

1️⃣ صندوق الأسرة الاقتصادي (خضر أسبوعية أساسية بجودة ممتازة)
2️⃣ صندوق الفواكه الملكي (تشكيلة طازجة للأطفال والضيافة)
3️⃣ صندوق الطاجين المغربي (كل ما يلزم لأشهى طاجين مغربي)
${pricesPart}
🛵 التوصيل لباب العمارة مجاناً للطلبات المؤهلة!
✅ تغليف محكم ونظيف يضمن بقاء الخضر طازجة في الثلاجة.

🛒 اطلب صندوقك المفضل بكبسة زر:
${storeUrl}

📞 للاستفسار أو الطلب عبر الهاتف/واتساب:
wa.me/${phone}

#صناديق_الخضار #خضرة_فاس #توفير_أسبوعي #توصيل_فاس #عائلة_مغربية`;

    case 'weekend_deals':
      return `⚡ جمعة مباركة وعروض نهاية الأسبوع من متجر خُضرة بفاس! 🕌🎉

استعد ليوم الجمعة ونهاية الأسبوع مع أجود الخضار والفواكه الطازجة:
• خضار الكسكس السبعة كاملة ومنعنعة 🥬🥕🎃
• اللفت، القرع، الكورجيت، الحمص، والربيع البلدي
• فواكه ممتازة للتحلية العائلية 🍇🍉🍊
${pricesPart}
🚚 نوصل إليك قبل موعد صلاة الجمعة والغداء العائلي!
💵 الدفع عند التسليم فقط بعد الرضا التام عن السلعة.

📲 احجز طلبيتك الآن قبل نفاد الكمية:
${storeUrl}

واتساب مباشر: wa.me/${phone}

#جمعة_مباركة #كسكس_مغربي #خضرة_فاس #عروض_نهاية_الأسبوع #فاس`;

    case 'moroccan_tagine':
      return `🍲 سر الطاجين الفاسي المعتبر في الخضار البلدية الطرية! 🇲🇦✨

طاجين الخضار باللحم أو الدجاج كيحتاج خضرة بلدية مقطوعة جديدة:
• بطاطس كطيب زبدة وطماطم حمراء معسلة 🍅🥔
• جزر بلدي طري، جلبانة، ولوبيا خضراء 🥕
• بصل أحمر منقى وربيع مخلط طازج من بنسودة 🧅
${pricesPart}
🛵 طلبك يوصل لباب منزلك معبأ بعناية في أقل وقت ممكن في مدينة فاس.

🛒 تصفح سلة الطاجين واطلب الآن:
${storeUrl}

واتساب للطلبات السريعة: wa.me/${phone}

#طاجين_مغربي #خضار_بلدية #خضرة_فاس #أكلات_مغربية #توصيل_فاس`;

    case 'b2b_restaurants':
      return `🏢 لأصحاب المطاعم، المقاهي، والسناكات بمدينة فاس 🍽️🥬

متجر خُضرة يضمن لمطبخكم توريداً يومياً مستقراً وموثوقاً:
✔️ أسعار جملة تفضيلية وعروض دورية
✔️ تسليم صباحي مبكر يومياً من سوق الجملة بنسودة
✔️ جودة نخب أول مختارة بعناية لمعايير الضيافة
✔️ كشف حساب أسبوعي أو شهري مع فاتورة رسمية SARL
${pricesPart}
🤝 نلتزم بالمواعيد والجودة لضمان نجاح خدماتكم اليومية.

📞 تواصل معنا لتحديد احتياجات مطعمكم وتجربة أول توريد:
wa.me/${phone}

رابط منصة خُضرة: ${storeUrl}

#مطاعم_فاس #مقاهي_فاس #توريد_خضر #خضرة_بنسودة #فاس_B2B`;

    case 'whatsapp_status':
      return `🌟 خضرة وفواكه اليوم من سوق بنسودة بفاس! 🧺
✅ جودة نخب أول طرية ومفروزة
✅ توصيل سريع لكافة أحياء فاس 🛵
✅ الدفع عند الاستلام كاش أو تحويل 💵
${pricesPart}
📲 تصفح المتجر واطلب الآن:
${storeUrl}

واتساب: wa.me/${phone} 🌿`;

    case 'free_delivery':
      return `🚴 التوصيل السريع والمجاني مع خُضرة فاس! 💨📦

طلبيتك لباب الدار بكل راحة:
• توصيل مجاني لكافة طلبات 120 درهم فما فوق 🎁
• تغليف نظيف في صناديق عازلة تحمي الخضار والفواكه
• تغطية يومية: طريق إيموزار، الأطلس، النرجس، عين الشقف، المدينة الجديدة، زواغة، ووسط المدينة.
${pricesPart}
✨ وفر مشقة السوق والزحمة، وخلي الخضرة توصلك طازجة حتى لبابك!

🛒 اطلب دابا واستفد من التوصيل:
${storeUrl}

تواصل مباشر على واتساب: wa.me/${phone}

#توصيل_مجاني #خضرة_فاس #سوق_أونلاين #توصيل_سريع_فاس`;
  }
}

export const AdminMarketingView: React.FC = () => {
  const storeUrl = typeof window !== 'undefined' ? window.location.origin : 'https://khodrafresh.vercel.app';
  const whatsappNumber = STORE_CONFIG.whatsappNumber || '212704274830';

  const [activeTab, setActiveTab] = useState<'composer' | 'accounts' | 'analytics'>('composer');
  const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplateId>('fresh_morning');
  const [postBody, setPostBody] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // تخصيصات سريعة
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<string>('');

  // المنتجات الحية لتوليد الأسعار
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // الحسابات المحفوظة
  const [links, setLinks] = useState<SocialLinks>(() => {
    try {
      const raw = localStorage.getItem('khodra_admin_social_links');
      return raw ? { ...DEFAULT_LINKS, ...JSON.parse(raw) } : DEFAULT_LINKS;
    } catch {
      return DEFAULT_LINKS;
    }
  });

  // عداد المشاركات
  const [shareCount, setShareCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('khodra_admin_share_count') || '0', 10);
    } catch {
      return 0;
    }
  });

  // وضع الهاتف في المعاينة (للشاشات الصغيرة: تبديل بين المحرر والمعاينة)
  const [mobileViewMode, setMobileViewMode] = useState<'editor' | 'preview'>('editor');

  // جلب المنتجات الحية مرة واحدة عند الفتح
  useEffect(() => {
    let isMounted = true;
    setIsLoadingProducts(true);
    fetchProducts()
      .then((data) => {
        if (isMounted) setLiveProducts(data);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingProducts(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // توليد ملخص أسعار المنتجات
  const priceListSummary = useMemo(() => {
    if (!liveProducts || liveProducts.length === 0) return '';
    const topVegs = liveProducts.filter((p) => p.category === 'veg' && p.active).slice(0, 5);
    const topFruits = liveProducts.filter((p) => p.category === 'fruit' && p.active).slice(0, 3);
    const selected = [...topVegs, ...topFruits];
    if (selected.length === 0) return '';

    return selected
      .map((p) => `• ${p.icon || '🥬'} ${p.name}: ${p.price} د.م${p.unit_label ? `/${p.unit_label}` : p.type === 'unit' ? '/حبة' : '/كلغ'}`)
      .join('\n');
  }, [liveProducts]);

  // تحديث نص القالب عند التبديل
  useEffect(() => {
    const text = buildTemplateText(selectedTemplate, storeUrl, whatsappNumber);
    setPostBody(text);
  }, [selectedTemplate, storeUrl, whatsappNumber]);

  const recordShare = useCallback(() => {
    setShareCount((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem('khodra_admin_share_count', String(next));
        localStorage.setItem('khodra_admin_last_shared', new Date().toISOString());
      } catch {}
      return next;
    });
  }, []);

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  // إدراج أسعار اليوم الحية داخل المنشور
  const handleInjectPrices = () => {
    if (!priceListSummary) {
      showToast('⚠️ لا تتوفر قائمة أسعار حالياً، يرجى التحقق من المنتجات.');
      return;
    }
    const insertBlock = `\n\n🛒 قائمة أسعار اليوم الطرية بفاس:\n${priceListSummary}\n`;
    setPostBody((prev) => {
      if (prev.includes('قائمة أسعار اليوم')) {
        return prev;
      }
      return `${prev}${insertBlock}`;
    });
    showToast('✅ تم إدراج أسعار الخضر والفواكه الحالية بنجاح في المنشور!');
  };

  // إضافة خصم فوري
  const handleApplyDiscount = (pct: number) => {
    setDiscountPercent(pct);
    const discountText = `\n🔥 تخفيض خاص ${pct}% لكل الطلبات اليوم بكود: KHODRA${pct} 🔥\n`;
    setPostBody((prev) => {
      if (prev.includes(`تخفيض خاص ${pct}%`)) return prev;
      return `${discountText}${prev}`;
    });
    showToast(`✅ تم إضافة كود تخفيض ${pct}%`);
  };

  // إضافة حي معين للتوصيل
  const handleAddZone = (zoneName: string) => {
    setSelectedZone(zoneName);
    const zoneLine = `\n📍 توصيل فوري خاص اليوم لحي: ${zoneName} في أقل من 60 دقيقة! 🛵`;
    setPostBody((prev) => `${prev}${zoneLine}`);
    showToast(`✅ تم توجيه المنشور لحي ${zoneName}`);
  };

  // نسخ النص الكامل
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postBody);
      setCopied(true);
      recordShare();
      showToast('✅ تم نسخ المنشور بالكامل إلى الحافظة!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('تعذر النسخ التلقائي، يمكنك تحديده ونسخه يدوياً.');
    }
  };

  // مشاركة واتساب مباشر
  const handleShareWhatsApp = () => {
    recordShare();
    const encoded = encodeURIComponent(postBody);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // مشاركة فيسبوك
  const handleShareFacebook = () => {
    recordShare();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}&quote=${encodeURIComponent(postBody.slice(0, 500))}`;
    window.open(shareUrl, '_blank', 'width=600,height=500');
  };

  // مشاركة تويتر/X
  const handleShareTwitter = () => {
    recordShare();
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postBody.slice(0, 240))}&url=${encodeURIComponent(storeUrl)}`;
    window.open(shareUrl, '_blank');
  };

  // مشاركة الهاتف الذكي الأصلية (Native Share)
  const handleShareNative = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'متجر خُضرة فاس',
          text: postBody,
          url: storeUrl,
        });
        recordShare();
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }
    await handleCopy();
  };

  // إرسال بوت تليغرام
  const handleTelegramBot = async () => {
    const token = links.telegramBotToken.trim();
    const chatId = links.telegramChatId.trim();

    if (!token || !chatId) {
      showToast('⚠️ يرجى إدخال Bot Token و Chat ID في تبويب الإعدادات أولاً.');
      return;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: postBody,
          parse_mode: 'HTML',
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        recordShare();
        showToast('✅ تم إرسال المنشور بنجاح لقناة/مجموعة تليغرام!');
      } else {
        showToast(`❌ تعذر الإرسال: ${data?.description || 'تأكد من البيانات'}`);
      }
    } catch {
      showToast('❌ تعذر الاتصال بخادم تليغرام، تأكد من الإنترنت.');
    }
  };

  // حفظ روابط الحسابات
  const handleSaveLinks = () => {
    try {
      localStorage.setItem('khodra_admin_social_links', JSON.stringify(links));
      showToast('✅ تم حفظ إعدادات وروابط الحسابات بنجاح');
    } catch {
      showToast('فشل الحفظ');
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ═══════ الرأس الترحيبي لمركز التسويق ═══════ */}
      <div className="bg-gradient-to-l from-[#0C2D48] via-[#0E3A5D] to-[#071E30] rounded-2xl p-4 sm:p-5 text-white border border-[#0284C7]/40 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-500/30">
              <Share2 className="w-4 h-4 text-[#FEF08A]" />
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-black font-['Almarai'] text-white">
              إدارة النشر والتسويق الاجتماعي
            </h1>
          </div>
        </div>

        {/* أزرار التبويبات الرئيسية */}
        <div className="mt-4 pt-3 border-t border-cyan-500/20 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('composer')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'composer'
                ? 'bg-white text-[#0C2D48] shadow-md'
                : 'bg-black/30 hover:bg-black/50 text-white/90 border border-white/10'
            }`}
          >
            <Edit3 className="w-4 h-4 text-[#0284C7]" />
            <span>محرر المنشورات التفاعلي</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'accounts'
                ? 'bg-white text-[#0C2D48] shadow-md'
                : 'bg-black/30 hover:bg-black/50 text-white/90 border border-white/10'
            }`}
          >
            <Settings className="w-4 h-4 text-[#0284C7]" />
            <span>ربط الحسابات والقنوات (Bot API)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-white text-[#0C2D48] shadow-md'
                : 'bg-black/30 hover:bg-black/50 text-white/90 border border-white/10'
            }`}
          >
            <Clock className="w-4 h-4 text-[#FEF08A]" />
            <span>أوقات النشر الذهبية في فاس</span>
          </button>
        </div>
      </div>

      {/* ═══════ إشعار الحالة ═══════ */}
      {statusNotice && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-700 text-white text-xs sm:text-sm font-black border border-emerald-400 shadow-md flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F5D76E]" />
            <span>{statusNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-white/80 hover:text-white cursor-pointer px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          التبويب 1: محرر المنشورات التفاعلي مع المعاينة الحية للهاتف
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'composer' && (
        <div className="space-y-6">

          {/* 1. اختيار القالب التسويقي */}
          <div className="bg-white border-2 border-[#E8E1D3] rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-sm font-black text-[#1A3D24] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#EAB308]" />
                <span>اختر قالباً تسويقياً جاهزاً (7 قوالب متخصصة):</span>
              </label>
              <span className="text-xs text-stone-500 font-medium">
                محدثة خصيصاً لمواسم وأوقات فاس
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {TEMPLATES_META.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0284C7] bg-[#0284C7]/8 ring-2 ring-[#0284C7]/20 shadow-xs'
                        : 'border-[#E8E1D3] bg-[#FAF8F4] hover:border-[#0284C7]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xl">{tmpl.emoji}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-stone-200 text-stone-700">
                          {tmpl.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-stone-900 leading-tight">
                        {tmpl.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                        {tmpl.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. شريط الأدوات السريعة والمساعدات (تضمين الأسعار والخصومات) */}
          <div className="bg-[#FAF8F4] border border-[#E8E1D3] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleInjectPrices}
                disabled={isLoadingProducts}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-l from-emerald-700 to-green-800 hover:from-emerald-800 hover:to-green-900 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#F5D76E]" />
                <span>إدراج أسعار الخضر والفواكه الحية في المنشور</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const text = buildTemplateText(selectedTemplate, storeUrl, whatsappNumber);
                setPostBody(text);
                showToast('🔄 تمت إعادة تعيين نص القالب للوضع الأصلي');
              }}
              className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-600 border border-stone-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط القالب</span>
            </button>
          </div>

          {/* تبديل في الهواتف بين المحرر والمعاينة */}
          <div className="lg:hidden flex items-center bg-stone-200 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setMobileViewMode('editor')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mobileViewMode === 'editor' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>تحرير نص المنشور</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('preview')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mobileViewMode === 'preview' ? 'bg-[#0284C7] text-white shadow-sm' : 'text-stone-600'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>معاينة شاشة الهاتف (WhatsApp)</span>
            </button>
          </div>

          {/* 3. شبكة المحرر والمعاينة الحية للهاتف (Side-by-Side on Desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* الجزء الأيمن: محرر النصوص والأزرار (7 أعمدة في الحاسوب) */}
            <div className={`lg:col-span-7 space-y-4 ${mobileViewMode === 'preview' ? 'hidden lg:block' : 'block'}`}>
              <div className="bg-white border-2 border-[#E8E1D3] rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#0284C7]" />
                    <span>محرر الرسالة التسويقية:</span>
                  </h3>
                  <span className="text-[11px] font-mono text-stone-400">
                    {postBody.length} حرف
                  </span>
                </div>

                <textarea
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  rows={14}
                  className="w-full p-4 rounded-2xl border-2 border-stone-200 text-xs sm:text-sm font-sans text-stone-900 leading-relaxed outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10 transition-all resize-y bg-[#FAF8F4]"
                  dir="rtl"
                />

                {/* أزرار النشر السريع (1-Click Publishing) */}
                <div className="pt-2 space-y-3">
                  <span className="text-xs font-black text-stone-700 block">
                    🚀 قنوات النشر المباشر بنقرة واحدة:
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* واتساب */}
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="p-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5 text-white" />
                      <span>إرسال لواتساب</span>
                      <span className="text-[10px] opacity-90">مجموعات وزبائن</span>
                    </button>

                    {/* نسخ للحافظة / إنستغرام وتيك توك */}
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-600 via-rose-500 to-amber-500 hover:opacity-90 text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
                      <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
                      <span className="text-[10px] opacity-90">إنستغرام / تيك توك</span>
                    </button>

                    {/* فيسبوك */}
                    <button
                      type="button"
                      onClick={handleShareFacebook}
                      className="p-3.5 rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <Share2 className="w-5 h-5 text-white" />
                      <span>نشر فيسبوك</span>
                      <span className="text-[10px] opacity-90">صفحة أو مجموعة</span>
                    </button>

                    {/* مشاركة الهاتف الأصلية */}
                    <button
                      type="button"
                      onClick={handleShareNative}
                      className="p-3.5 rounded-2xl bg-gradient-to-br from-[#163920] to-[#0E2615] hover:opacity-90 text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <Smartphone className="w-5 h-5 text-[#F5D76E]" />
                      <span>مشاركة الجوال</span>
                      <span className="text-[10px] opacity-90">Stories / Apps</span>
                    </button>
                  </div>

                  {/* إجراءات ثانوية */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={handleTelegramBot}
                      className="px-3.5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5 text-[#FEF08A]" />
                      <span>نشر آلي في قناة تليغرام (Bot API)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareTwitter}
                      className="px-3 py-2 rounded-xl bg-black hover:bg-stone-800 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>منصة X</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* الجزء الأيسر: معاينة واقعية لشاشة الهاتف (5 أعمدة في الحاسوب) */}
            <div className={`lg:col-span-5 ${mobileViewMode === 'editor' ? 'hidden lg:block' : 'block'}`}>
              <div className="sticky top-20 bg-white border-2 border-[#E8E1D3] rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#0284C7]" />
                    <span className="text-xs font-black text-stone-900">
                      معاينة حية لشاشة الهاتف (WhatsApp):
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    مباشر
                  </span>
                </div>

                {/* مجسم الهاتف الذكي بتفاصيل حقيقية */}
                <div className="w-full max-w-[340px] mx-auto bg-[#111B21] rounded-[36px] p-3 shadow-2xl border-4 border-stone-800">
                  {/* شريط حالة الهاتف العلوي */}
                  <div className="flex items-center justify-between px-4 py-1 text-[11px] text-stone-400 font-mono">
                    <span>9:41</span>
                    <div className="w-14 h-3.5 bg-black rounded-full" />
                    <span>5G • 100%</span>
                  </div>

                  {/* رأس محادثة واتساب */}
                  <div className="bg-[#202C33] text-white px-3 py-2 rounded-2xl flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#163920] border border-[#EAB308]/60 flex items-center justify-center shrink-0">
                        <span className="text-xs">🌿</span>
                      </div>
                      <div className="min-w-0 text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black truncate">خُضرة فاس</span>
                          <span className="text-[9px] bg-emerald-600 px-1 rounded-full">حساب موثق</span>
                        </div>
                        <span className="text-[10px] text-stone-400 block truncate">
                          سوق بنسودة • توصيل فاس
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* مساحة الدردشة وفقاعة الرسالة الخضراء */}
                  <div className="bg-[#0B141A] rounded-2xl p-3 my-2 min-h-[300px] max-h-[380px] overflow-y-auto space-y-2 text-right">
                    <div className="bg-[#005C4B] text-white text-[11px] leading-relaxed p-3 rounded-2xl rounded-tr-none shadow-md space-y-1.5 whitespace-pre-wrap font-sans">
                      <p>{postBody}</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200/70 pt-1">
                        <span>الآن</span>
                        <span>✓✓</span>
                      </div>
                    </div>
                  </div>

                  {/* زر سريع من داخل المعاينة */}
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>إرسال هذا المنشور فوراً</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-center text-stone-500 font-medium">
                  الرسالة تظهر لمنسوبي مجموعات واتساب بهذا التنسيق المنظم والمريح للقراءة.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          التبويب 2: إعدادات الحسابات وربط تليغرام Bot API
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <div className="bg-white border-2 border-[#E8E1D3] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#0284C7]" />
              <span>ربط قنوات التواصل وحسابات البث الآلي:</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              أدخل روابط صفحات المتجر ورمز Bot API لتفعيل النشر الفوري الصامت بنقرة واحدة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-black text-stone-800 block mb-1">
                رابط صفحة فيسبوك:
              </label>
              <input
                type="url"
                value={links.facebook}
                onChange={(e) => setLinks({ ...links, facebook: e.target.value })}
                placeholder="https://facebook.com/khodrafresh"
                className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#0284C7]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="text-xs font-black text-stone-800 block mb-1">
                رابط حساب إنستغرام:
              </label>
              <input
                type="url"
                value={links.instagram}
                onChange={(e) => setLinks({ ...links, instagram: e.target.value })}
                placeholder="https://instagram.com/khodrafresh"
                className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#0284C7]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="text-xs font-black text-stone-800 block mb-1">
                رابط مجموعة / مجتمع واتساب:
              </label>
              <input
                type="url"
                value={links.whatsappGroup}
                onChange={(e) => setLinks({ ...links, whatsappGroup: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#0284C7]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="text-xs font-black text-stone-800 block mb-1">
                حساب تيك توك:
              </label>
              <input
                type="url"
                value={links.tiktok}
                onChange={(e) => setLinks({ ...links, tiktok: e.target.value })}
                placeholder="https://tiktok.com/@khodrafresh"
                className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#0284C7]"
                dir="ltr"
              />
            </div>
          </div>

          <div className="bg-[#FAF8F4] p-5 rounded-2xl border border-stone-200 space-y-4">
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-[#0284C7]" />
              <span>إعدادات النشر التلقائي في تليغرام (Telegram Bot API):</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Telegram Bot Token:
                </label>
                <input
                  type="password"
                  value={links.telegramBotToken}
                  onChange={(e) => setLinks({ ...links, telegramBotToken: e.target.value })}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRstUVw"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#0284C7]"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Telegram Chat ID / Channel Username:
                </label>
                <input
                  type="text"
                  value={links.telegramChatId}
                  onChange={(e) => setLinks({ ...links, telegramChatId: e.target.value })}
                  placeholder="@khodra_fes أو -10012345678"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#0284C7]"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleSaveLinks}
              className="px-6 py-3 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:opacity-95 text-white font-black text-xs cursor-pointer shadow-md active:scale-95"
            >
              حفظ جميع إعدادات القنوات
            </button>

            <span className="text-xs text-stone-400 font-medium">
              البيانات تحفظ محلياً على هذا الجهاز بأمان
            </span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          التبويب 3: التوقيت الذهبي للنشر وإحصائيات المتجر
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="bg-white border-2 border-[#E8E1D3] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#EAB308]" />
              <span>مواعيد النشر الأكثر فاعلية لطلبات الخضار في فاس:</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              مبنية على سلوك تسوق العائلات والموظفين في أحياء فاس (الأطلس، النرجس، طريق إيموزار).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                <span>🌅</span>
                <span>فترة الصباح: 07:30 - 09:30</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                أفضل وقت لنشر طراوة الصباح وقائمة أسعار سوق بنسودة لجلب طلبات الغداء الطازجة وتجهيزها قبل الظهر.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-black text-sm">
                <span>🌆</span>
                <span>فترة ما بعد الظهيرة: 16:00 - 18:30</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                توقيت مثالي للموظفين العائدين من العمل ولربات البيوت لتحديد احتياجات العشاء وخضار الغد.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                <span>🕌</span>
                <span>مساء الخميس وصباح الجمعة</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                تجهيز طلبيات الكسكس المغربي وصناديق نهاية الأسبوع، وهو اليوم الأعلى في متوسط قيمة السلة.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
