// ============================================================
// AdminSocialPublisherModal.tsx – مركز النشر والتواصل الاجتماعي
// أداة ذكية مدمجة في لوحة المدير لربط حسابات التواصل الاجتماعي
// وتوليد ونشر المنشورات التسويقية بنقرة واحدة لجميع المنصات
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Share2,
  Send,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Globe,
  Settings,
  Megaphone,
  ShoppingBag,
  Flame,
  Truck,
  RotateCcw,
  CheckCircle2,
  Smartphone,
  Layers,
} from 'lucide-react';
import { STORE_CONFIG } from '../../data/config';

export interface AdminSocialPublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

type PostTemplateType = 'fresh_morning' | 'family_boxes' | 'free_delivery' | 'custom';

export const AdminSocialPublisherModal: React.FC<AdminSocialPublisherModalProps> = ({
  isOpen,
  onClose,
}) => {
  // ─── إعدادات وروابط الحسابات ───
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => {
    try {
      const saved = localStorage.getItem('khodra_admin_social_links');
      return saved ? { ...DEFAULT_LINKS, ...JSON.parse(saved) } : DEFAULT_LINKS;
    } catch {
      return DEFAULT_LINKS;
    }
  });

  const [activeTab, setActiveTab] = useState<'publish' | 'accounts' | 'history'>('publish');
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplateType>('fresh_morning');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [telegramSending, setTelegramSending] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [shareCount, setShareCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('khodra_admin_share_count') || '0', 10);
    } catch {
      return 0;
    }
  });

  // ─── نص المنشور القابل للتعديل ───
  const [customText, setCustomText] = useState('');

  // ─── قوالب المنشورات الجاهزة ───
  const storeUrl = typeof window !== 'undefined' ? window.location.origin : 'https://khodra.ma';

  const templatesText = useMemo(() => {
    return {
      fresh_morning: `🌿 خُضرة وفواكه طازجة اليوم من سوق الجملة بنسودة لباب دارك بفاس! 🧺

صباح الخير يا فاس! ☀️ سلتنا اليوم عامرة بالخضر والفواكه النخب الأول مقطوعة صبيحة اليوم، نقية ومفروزة حبة بحبة مع معايير جودة عالية:
🍅 طماطم، بطاطس، بصل، وجزر طري
🍊 فواكه الموسم حلوة ومنعشة
🥬 نعناع وأعشاب منتعشة لطاجين اليوم

🚴 التوصيل فوري خلال أقل من 60 دقيقة في جميع أحياء فاس (طريق إيموزار، الأطلس، أكدال، النرجس، سايس، بنسودة، زواغة، واد فاس).
💵 الدفع نقداً عند الاستلام (COD) مع حق المعاينة عند الباب!

🛒 اطلب الآن بكل سهولة في دقيقتين عبر المتجر:
👉 ${storeUrl}

#خضرة_فاس #طازج_يوميا #فاس #سوق_الجملة #توصيل_فاس #Fes #KhodraFresh`,

      family_boxes: `📦 وفر وقتك وفلوسك مع صناديق خُضرة العائلية الأسبوعية بفاس! 👨‍👩‍👧‍👦

جمعنا لك كل ما تحتاجه كوزينتك طيلة الأسبوع في صندوق توفيري متكامل وبأفضل سعر جملة:
🥬 صندوق الأسرة الاقتصادي (خضر الطبخ الأساسية المتنوعة)
🍎 صندوق الفواكه الطازجة المنعشة لجميع أفراد العائلة
🥗 صندوق الطبخ المغربي للأطباق الأصيلة

✨ مميزات صناديق خُضرة:
✅ توفير مضمون مقارنة بأسعار السوق اليومية
✅ توصيل مبرّد في صناديق عازلة تحافظ على الطراوة
✅ تتبع فوري وتوصيل سريع لباب بيتك

📱 اختر صندوقك المفضل واطلبه بنقرة واحدة:
👉 ${storeUrl}/?category=all

#صناديق_العائلة #عروض_فاس #خضار_وفواكه #توفير #فاس_المدينة #Khodra`,

      free_delivery: `🚴 توصيل فوري وسريع لجميع أحياء فاس مع عروض التوصيل لمتجر خُضرة! 🚚✨

ودّع مشقة الازدحام وتضييع الوقت في الأسواق! خُضرة توفر لك:
⚡ توصيل سريع فوري خلال 35 إلى 45 دقيقة
📍 تغطية شاملة لكافة قطاعات فاس (الشمالية، الوسطى، الجنوبية، والغربية)
🎁 شريط التوصيل المجاني التلقائي متاح الآن عند بلوغ الحد التوفيري!
⚖️ عداد أوزان ذكي بالكيلوغرام (kg) وحساب دقيق للسعر

🌿 تسوق خضرك وفواكهك طرية كأنك في الجوطية ولكن براحة تامة في دارك:
👉 ${storeUrl}

📞 للاستفسار أو الطلب المباشر عبر واتساب:
👉 https://wa.me/${STORE_CONFIG.whatsappNumber}

#توصيل_فوري_فاس #متجر_خضرة #أحياء_فاس #FesDelivery`,

      custom: customText,
    };
  }, [storeUrl, customText]);

  // تحديث النص عند تغيير القالب
  const currentPostText = selectedTemplate === 'custom' ? customText : templatesText[selectedTemplate];

  const handleSelectTemplate = (t: PostTemplateType) => {
    setSelectedTemplate(t);
    if (t !== 'custom') {
      setCustomText(templatesText[t]);
    }
  };

  // ─── إدارة قفل التمرير والهروب ───
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // تهيئة النص المخصص
      setCustomText(templatesText[selectedTemplate]);
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen, selectedTemplate, templatesText]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ─── حفظ إعدادات الروابط ───
  const handleSaveLinks = () => {
    try {
      localStorage.setItem('khodra_admin_social_links', JSON.stringify(socialLinks));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      // ignore
    }
  };

  // ─── تسجيل عملية مشاركة ───
  const recordShare = () => {
    const next = shareCount + 1;
    setShareCount(next);
    try {
      localStorage.setItem('khodra_admin_share_count', String(next));
    } catch {}
  };

  // ─── دوال النشر بنقرة واحدة ───

  // 1. واتساب
  const shareToWhatsApp = () => {
    recordShare();
    const encoded = encodeURIComponent(currentPostText);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 2. فيسبوك
  const shareToFacebook = () => {
    recordShare();
    const encodedUrl = encodeURIComponent(storeUrl);
    const encodedQuote = encodeURIComponent(currentPostText.slice(0, 500));
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  // 3. تويتر / إكس
  const shareToTwitter = () => {
    recordShare();
    const shortText = currentPostText.slice(0, 240);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortText)}&url=${encodeURIComponent(storeUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 4. مشاركة الهاتف العامة Web Share API (إنستغرام، تيك توك، إلخ)
  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'متجر خُضرة فاس — خضر وفواكه طازجة',
          text: currentPostText,
          url: storeUrl,
        });
        recordShare();
      } catch {
        // user cancelled
      }
    } else {
      // Fallback: نسخ النص
      handleCopyText();
    }
  };

  // 5. تليغرام الرابط العادي
  const shareToTelegramWeb = () => {
    recordShare();
    const url = `https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(currentPostText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 6. نشر آلي مباشر عبر Telegram Bot API (بدون فتح أي تطبيق!)
  const shareViaTelegramBot = async () => {
    if (!socialLinks.telegramBotToken || !socialLinks.telegramChatId) {
      setTelegramStatus({
        success: false,
        msg: 'يرجى إدخال Bot Token و Chat ID في تبويب إعدادات الحسابات أولاً.',
      });
      setTimeout(() => setTelegramStatus(null), 4000);
      return;
    }

    setTelegramSending(true);
    setTelegramStatus(null);
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${socialLinks.telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: socialLinks.telegramChatId,
            text: currentPostText,
            parse_mode: 'HTML',
            disable_web_page_preview: false,
          }),
        }
      );

      const data = await res.json();
      if (data.ok) {
        recordShare();
        setTelegramStatus({
          success: true,
          msg: '✓ تم النشر التلقائي بنجاح في قناة/مجموعة تليغرام!',
        });
      } else {
        setTelegramStatus({
          success: false,
          msg: `خطأ من تليغرام: ${data.description || 'تأكد من صحة التوكن والقناة'}`,
        });
      }
    } catch {
      setTelegramStatus({
        success: false,
        msg: 'فشل الاتصال بخادم تليغرام، تأكد من اتصال الإنترنت.',
      });
    } finally {
      setTelegramSending(false);
      setTimeout(() => setTelegramStatus(null), 5000);
    }
  };

  // 7. نسخ النص لإنستغرام أو تيك توك
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(currentPostText);
      setCopiedStatus('all');
      recordShare();
      setTimeout(() => setCopiedStatus(null), 3000);
    } catch {
      // fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="مركز النشر والتواصل الاجتماعي"
    >
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#FAF8F4] w-full sm:max-w-4xl shadow-2xl z-10 sm:rounded-3xl flex flex-col max-h-screen sm:max-h-[94vh] overflow-hidden text-right border-2 border-[#E8E1D3]">
        {/* ═══════ الرأس ═══════ */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-[#1A3D24] via-[#2D6A3F] to-[#163920] text-white flex items-center justify-between gap-3 shrink-0 shadow-md border-b-2 border-[#EAB308]/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-[#EAB308]/40 flex items-center justify-center shadow-inner shrink-0">
              <Megaphone className="w-6 h-6 text-[#F5D76E]" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg flex items-center gap-2">
                <span>مركز النشر الذكي والتواصل الاجتماعي</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[#EAB308]/20 text-[#FEF08A] border border-[#EAB308]/40 font-black">
                  نشر تلقائي بنقرة واحدة
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100/90 font-semibold mt-0.5">
                توليد ونشر إعلانات وعروض متجر خُضرة مباشرة على واتساب، فيسبوك، تليغرام وإنستغرام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═══════ شريط التبويبات العلوي ═══════ */}
        <div className="bg-white border-b border-[#E8E1D3] px-4 sm:px-6 pt-3 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('publish')}
              className={`pb-3 px-3 text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'publish'
                  ? 'border-[#2D6A3F] text-[#1A3D24]'
                  : 'border-transparent text-[#5A6B5F] hover:text-[#1A3D24]'
              }`}
            >
              <Share2 className="w-4 h-4 text-[#2D6A3F]" />
              <span>تجهيز ونشر الإعلانات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`pb-3 px-3 text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'accounts'
                  ? 'border-[#2D6A3F] text-[#1A3D24]'
                  : 'border-transparent text-[#5A6B5F] hover:text-[#1A3D24]'
              }`}
            >
              <Settings className="w-4 h-4 text-[#EA580C]" />
              <span>ربط الحسابات والقنوات</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 pb-2 text-[11px] font-bold text-[#5A6B5F]">
            <span>إجمالي المشاركات:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black">
              {shareCount} عملية نشر
            </span>
          </div>
        </div>

        {/* ═══════ المحتوى الرئيسي ═══════ */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* إشعار تليغرام الآلي إن وُجد */}
          {telegramStatus && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-black animate-in fade-in ${
                telegramStatus.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  telegramStatus.success ? 'text-emerald-600' : 'text-rose-600'
                }`}
              />
              <span>{telegramStatus.msg}</span>
            </div>
          )}

          {/* ═══════ تبويب 1: تجهيز ونشر المنشورات ═══════ */}
          {activeTab === 'publish' && (
            <div className="space-y-5">
              {/* اختيار القالب الجاهز */}
              <div>
                <label className="block text-xs font-black text-[#1A3D24] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#EAB308]" />
                  <span>اختر قالباً تسويقياً جاهزاً للتوليد الفوري:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('fresh_morning')}
                    className={`p-3 rounded-xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between ${
                      selectedTemplate === 'fresh_morning'
                        ? 'border-[#2D6A3F] bg-[#2D6A3F]/8 shadow-xs ring-2 ring-[#2D6A3F]/20'
                        : 'border-[#E8E1D3] bg-white hover:border-[#2D6A3F]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-[#1A3D24]">
                      <span className="text-base">🌅</span>
                      <span>طراوة الصباح وبنسودة</span>
                    </div>
                    <p className="text-[11px] text-[#5A6B5F] mt-1 font-semibold leading-relaxed">
                      إعلان خضر وفواكه اليوم من سوق الجملة مع تأكيد الطراوة والتوصيل بـ 60 دقيقة.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('family_boxes')}
                    className={`p-3 rounded-xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between ${
                      selectedTemplate === 'family_boxes'
                        ? 'border-[#2D6A3F] bg-[#2D6A3F]/8 shadow-xs ring-2 ring-[#2D6A3F]/20'
                        : 'border-[#E8E1D3] bg-white hover:border-[#2D6A3F]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-[#1A3D24]">
                      <span className="text-base">📦</span>
                      <span>صناديق العائلة التوفيرية</span>
                    </div>
                    <p className="text-[11px] text-[#5A6B5F] mt-1 font-semibold leading-relaxed">
                      عرض باقات الأسبوع التوفيرية (الأسرة الاقتصادي، الفواكه، الطبخ المغربي).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('free_delivery')}
                    className={`p-3 rounded-xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between ${
                      selectedTemplate === 'free_delivery'
                        ? 'border-[#2D6A3F] bg-[#2D6A3F]/8 shadow-xs ring-2 ring-[#2D6A3F]/20'
                        : 'border-[#E8E1D3] bg-white hover:border-[#2D6A3F]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-[#1A3D24]">
                      <span className="text-base">🚴</span>
                      <span>التوصيل الفوري والمجاني</span>
                    </div>
                    <p className="text-[11px] text-[#5A6B5F] mt-1 font-semibold leading-relaxed">
                      تركيز على سرعة التوصيل في كافة أحياء فاس وشريط التوصيل المجاني.
                    </p>
                  </button>
                </div>
              </div>

              {/* محرر النص التسويقي */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-[#1A3D24] flex items-center gap-1">
                    <span>نص المنشور (يمكنك التعديل والإضافة بحرية قبل النشر):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate(selectedTemplate)}
                    className="text-[11px] font-bold text-[#EA580C] hover:text-[#C25E12] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة النص الأصلي للقالب</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={8}
                    value={customText}
                    onChange={(e) => {
                      setCustomText(e.target.value);
                      setSelectedTemplate('custom');
                    }}
                    dir="rtl"
                    className="w-full p-3.5 rounded-2xl bg-white border-2 border-[#2D6A3F]/25 focus:border-[#2D6A3F] focus:ring-2 focus:ring-[#2D6A3F]/20 outline-none text-xs sm:text-sm text-[#1A3D24] font-medium leading-relaxed resize-y shadow-inner font-sans"
                    placeholder="اكتب أو عدّل المنشور التسويقي هنا..."
                  />
                  <div className="absolute bottom-3 left-3 text-[10px] font-mono font-bold text-stone-400 bg-stone-100/80 px-2 py-0.5 rounded-md">
                    {customText.length} حرف
                  </div>
                </div>
              </div>

              {/* أزرار النشر التلقائي بنقرة واحدة */}
              <div className="bg-gradient-to-br from-white to-[#FAF8F3] p-4 sm:p-5 rounded-2xl border-2 border-[#EAB308]/40 shadow-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-[#1A3D24] flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#EA580C]" />
                    <span>انشر الآن بنقرة واحدة على المنصة المفضلة:</span>
                  </h3>
                  <span className="text-[11px] font-bold text-[#5A6B5F]">
                    يتم إرفاق النص ورابط المتجر آلياً
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {/* زر واتساب */}
                  <button
                    type="button"
                    onClick={shareToWhatsApp}
                    className="p-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>نشر على واتساب</span>
                    <span className="text-[10px] font-normal opacity-90">حالات / مجموعات</span>
                  </button>

                  {/* زر فيسبوك */}
                  <button
                    type="button"
                    onClick={shareToFacebook}
                    className="p-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>مشاركة فيسبوك</span>
                    <span className="text-[10px] font-normal opacity-90">صفحة / منشور عام</span>
                  </button>

                  {/* زر تليغرام الويب */}
                  <button
                    type="button"
                    onClick={shareToTelegramWeb}
                    className="p-3 rounded-xl bg-[#229ED9] hover:bg-[#1E8EC4] text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Send className="w-5 h-5" />
                    <span>نشر تليغرام</span>
                    <span className="text-[10px] font-normal opacity-90">قناة / مجموعة</span>
                  </button>

                  {/* زر مشاركة الجوال الأصلية */}
                  <button
                    type="button"
                    onClick={shareViaNative}
                    className="p-3 rounded-xl bg-gradient-to-l from-[#1A3D24] to-[#2D6A3F] hover:from-[#2D6A3F] hover:to-[#1A3D24] text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Smartphone className="w-5 h-5 text-[#F5D76E]" />
                    <span>مشاركة الجوال</span>
                    <span className="text-[10px] font-normal opacity-90">Stories / TikTok</span>
                  </button>
                </div>

                {/* أزرار متقدمة إضافية: نسخ كامل + نشر آلي برمجياً في تليغرام */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-stone-200/80">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border-2 border-stone-300 text-stone-800 text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
                  >
                    {copiedStatus === 'all' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">تم نسخ النص بالكامل مع الهاشتاغات!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-stone-600" />
                        <span>نسخ النص لإنستغرام أو تيك توك</span>
                      </>
                    )}
                  </button>

                  {socialLinks.telegramBotToken && socialLinks.telegramChatId && (
                    <button
                      type="button"
                      disabled={telegramSending}
                      onClick={shareViaTelegramBot}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#0284C7] text-white text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-amber-300" />
                      <span>
                        {telegramSending ? 'جارٍ الإرسال التلقائي...' : 'إرسال آلي صامت للقناة (Bot API)'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={shareToTwitter}
                    className="px-3.5 py-2.5 rounded-xl bg-black hover:bg-stone-800 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <span>نشر على منصة X</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ تبويب 2: ربط وإعداد الحسابات ═══════ */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold leading-relaxed">
                💡 <strong>معلومة تقنية:</strong> هذه الروابط تُحفظ في متصفحك لتمكينك من فتح وإدارة صفحات المتجر الرسمية بنقرة واحدة، كما يمكنك ربط <strong>بوت تليغرام مجاني (Telegram Bot)</strong> لإرسال العروض تلقائياً لقناتك دون أي تدخل يدوي.
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تم حفظ إعدادات وروابط الحسابات بنجاح!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black text-[#1A3D24] mb-1">
                    رابط صفحة فيسبوك الرسمية:
                  </label>
                  <input
                    type="url"
                    value={socialLinks.facebook}
                    onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                    dir="ltr"
                    placeholder="https://facebook.com/khodra.fes"
                    className="w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#2D6A3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1A3D24] mb-1">
                    رابط حساب إنستغرام:
                  </label>
                  <input
                    type="url"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                    dir="ltr"
                    placeholder="https://instagram.com/khodra.fes"
                    className="w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#2D6A3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1A3D24] mb-1">
                    رابط مجموعة أو قناة واتساب للزبناء:
                  </label>
                  <input
                    type="url"
                    value={socialLinks.whatsappGroup}
                    onChange={(e) => setSocialLinks({ ...socialLinks, whatsappGroup: e.target.value })}
                    dir="ltr"
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#2D6A3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1A3D24] mb-1">
                    رابط حساب تيك توك:
                  </label>
                  <input
                    type="url"
                    value={socialLinks.tiktok}
                    onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                    dir="ltr"
                    placeholder="https://tiktok.com/@khodra.fes"
                    className="w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#2D6A3F]"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-stone-200">
                  <h4 className="text-xs font-black text-[#1A3D24] mb-2 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-[#0284C7]" />
                    <span>الربط الآلي البرمجي مع تليغرام (اختياري للنشر الصامت بضغطة زر):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        Telegram Bot Token (من @BotFather):
                      </label>
                      <input
                        type="password"
                        value={socialLinks.telegramBotToken}
                        onChange={(e) => setSocialLinks({ ...socialLinks, telegramBotToken: e.target.value })}
                        dir="ltr"
                        placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                        className="w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#2D6A3F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        معرّف القناة أو المجموعة (Chat ID مثل @khodra_channel):
                      </label>
                      <input
                        type="text"
                        value={socialLinks.telegramChatId}
                        onChange={(e) => setSocialLinks({ ...socialLinks, telegramChatId: e.target.value })}
                        dir="ltr"
                        placeholder="@khodra_channel أو -10012345678"
                        className="w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#2D6A3F]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveLinks}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] hover:from-[#3A8152] hover:to-[#2D6A3F] text-white font-black text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  حفظ إعدادات الحسابات
                </button>

                <div className="flex items-center gap-2">
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-bold inline-flex items-center gap-1 hover:bg-stone-50"
                    >
                      <span>صفحة فيسبوك</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-bold inline-flex items-center gap-1 hover:bg-stone-50"
                    >
                      <span>إنستغرام</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
