// ============================================================
// AdminSocialPublisherModal.tsx
// مركز النشر والتواصل الاجتماعي
// ------------------------------------------------------------
// بنية الملف:
//   1) الأنواع (Types)
//   2) الثوابت (Constants)
//   3) الخدمات النقية (storage / clipboard / share URLs / telegram)
//   4) قوالب المنشورات (Post templates)
//   5) الخطافات المحلية (hooks)
//   6) المكوّنات الفرعية (presentational)
//   7) المكوّن الرئيسي (container)
// ============================================================
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  X,
  Share2,
  Send,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Megaphone,
  Flame,
  RotateCcw,
  CheckCircle2,
  Smartphone,
  Settings,
} from 'lucide-react';
import { STORE_CONFIG } from '../../../data/config';

/* ═══════════════════════════════════════════════════════════
   1) الأنواع
   ═══════════════════════════════════════════════════════════ */

export interface AdminSocialPublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  whatsappGroup: string;
  telegramChannel: string;
  telegramBotToken: string;
  telegramChatId: string;
  tiktok: string;
}

type SocialTab = 'publish' | 'accounts';

export type PostTemplateId = 'fresh_morning' | 'family_boxes' | 'free_delivery';

type FeedbackTone = 'success' | 'error';

interface Feedback {
  tone: FeedbackTone;
  message: string;
}

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
}

/* ═══════════════════════════════════════════════════════════
   2) الثوابت
   ═══════════════════════════════════════════════════════════ */

const STORAGE_KEYS = {
  links: 'khodra_admin_social_links',
  shareCount: 'khodra_admin_share_count',
} as const;

const SHARE_TITLE = 'متجر خُضرة فاس — خضر وفواكه طازجة';
const FALLBACK_STORE_URL = 'https://khodra.ma';

const DEFAULT_LINKS: SocialLinks = {
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  whatsappGroup: `https://wa.me/${STORE_CONFIG.whatsappNumber}`,
  telegramChannel: '',
  telegramBotToken: '',
  telegramChatId: '',
  tiktok: '',
};

const TEMPLATE_META: ReadonlyArray<{
  id: PostTemplateId;
  emoji: string;
  title: string;
  description: string;
}> = [
  {
    id: 'fresh_morning',
    emoji: '🌅',
    title: 'طراوة الصباح وبنسودة',
    description:
      'إعلان خضر وفواكه اليوم من سوق الجملة مع تأكيد الطراوة والتوصيل بـ 60 دقيقة.',
  },
  {
    id: 'family_boxes',
    emoji: '📦',
    title: 'صناديق العائلة التوفيرية',
    description:
      'عرض باقات الأسبوع التوفيرية (الأسرة الاقتصادي، الفواكه، الطبخ المغربي).',
  },
  {
    id: 'free_delivery',
    emoji: '🚴',
    title: 'التوصيل الفوري والمجاني',
    description:
      'تركيز على سرعة التوصيل في كافة أحياء فاس وشريط التوصيل المجاني.',
  },
] as const;

/* ═══════════════════════════════════════════════════════════
   3) الخدمات النقية
   ═══════════════════════════════════════════════════════════ */

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

const isBrowser = typeof window !== 'undefined';

/* ── 3.1 التخزين المحلي ─────────────────────────────────── */

function loadSocialLinks(): SocialLinks {
  if (!isBrowser) return DEFAULT_LINKS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.links);
    return raw ? { ...DEFAULT_LINKS, ...(JSON.parse(raw) as Partial<SocialLinks>) } : DEFAULT_LINKS;
  } catch {
    return DEFAULT_LINKS;
  }
}

function persistSocialLinks(links: SocialLinks): boolean {
  if (!isBrowser) return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.links, JSON.stringify(links));
    return true;
  } catch {
    return false;
  }
}

function loadShareCount(): number {
  if (!isBrowser) return 0;
  try {
    const parsed = Number.parseInt(
      window.localStorage.getItem(STORAGE_KEYS.shareCount) ?? '0',
      10,
    );
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function persistShareCount(value: number): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.shareCount, String(value));
  } catch {
    /* تجاهل */
  }
}

/* ── 3.2 الحافظة ────────────────────────────────────────── */

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* ننتقل للبديل */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/* ── 3.3 روابط المشاركة ─────────────────────────────────── */

function openWindow(url: string, features?: string): void {
  window.open(url, '_blank', features ?? 'noopener,noreferrer');
}

const shareUrls = {
  whatsapp: (text: string) =>
    `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,

  facebook: (url: string, text: string) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url,
    )}&quote=${encodeURIComponent(text.slice(0, 500))}`,

  twitter: (url: string, text: string) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text.slice(0, 240),
    )}&url=${encodeURIComponent(url)}`,

  telegram: (url: string, text: string) =>
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
};

/* ── 3.4 تليغرام Bot API ────────────────────────────────── */

async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<TelegramApiResponse | null> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  });
  return (await res.json().catch(() => null)) as TelegramApiResponse | null;
}

/* ═══════════════════════════════════════════════════════════
   4) قوالب المنشورات (دوال نقية تعتمد على الإعدادات فقط)
   ═══════════════════════════════════════════════════════════ */

function buildTemplates(
  storeUrl: string,
  whatsappNumber: string,
): Record<PostTemplateId, string> {
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
👉 https://wa.me/${whatsappNumber}

#توصيل_فوري_فاس #متجر_خضرة #أحياء_فاس #FesDelivery`,
  };
}

/* ═══════════════════════════════════════════════════════════
   5) الخطافات المحلية
   ═══════════════════════════════════════════════════════════ */

/** إشعار مؤقت يختفي تلقائياً مع تنظيف المؤقّت عند الإغلاق. */
function useTimedFeedback(defaultMs = 3500) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const showFeedback = useCallback(
    (next: Feedback, ms: number = defaultMs) => {
      setFeedback(next);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setFeedback(null), ms);
    },
    [defaultMs],
  );

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { feedback, showFeedback } as const;
}

/** عدّاد مشاركات مثبّت في localStorage. */
function useShareCounter() {
  const [count, setCount] = useState<number>(loadShareCount);

  const increment = useCallback(() => {
    setCount((current) => {
      const next = current + 1;
      persistShareCount(next);
      return next;
    });
  }, []);

  return { count, increment } as const;
}

/** قفل تمرير الصفحة + إغلاق بمفتاح Escape. */
function useModalBehavior(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);
}

/* ═══════════════════════════════════════════════════════════
   6) المكوّنات الفرعية
   ═══════════════════════════════════════════════════════════ */

/* ── 6.1 الرأس ──────────────────────────────────────────── */

const ModalHeader: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <header className="p-4 sm:p-5 bg-gradient-to-l from-[#1A3D24] via-[#2D6A3F] to-[#163920] text-white flex items-center justify-between gap-3 shrink-0 shadow-md border-b-2 border-[#EAB308]/40">
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

    <button
      type="button"
      onClick={onClose}
      className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer shrink-0"
      aria-label="إغلاق"
    >
      <X className="w-5 h-5" />
    </button>
  </header>
);

/* ── 6.2 شريط التبويبات ─────────────────────────────────── */

interface ModalTabsProps {
  active: SocialTab;
  onChange: (tab: SocialTab) => void;
  shareCount: number;
}

const ModalTabs: React.FC<ModalTabsProps> = ({ active, onChange, shareCount }) => {
  const tabs: ReadonlyArray<{
    id: SocialTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'publish',
      label: 'تجهيز ونشر الإعلانات',
      icon: <Share2 className="w-4 h-4 text-[#2D6A3F]" />,
    },
    {
      id: 'accounts',
      label: 'ربط الحسابات والقنوات',
      icon: <Settings className="w-4 h-4 text-[#EA580C]" />,
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="تبويبات مركز النشر"
      className="bg-white border-b border-[#E8E1D3] px-4 sm:px-6 pt-3 flex items-center justify-between gap-3 overflow-x-auto"
    >
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cx(
                'pb-3 px-3 text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap',
                isActive
                  ? 'border-[#2D6A3F] text-[#1A3D24]'
                  : 'border-transparent text-[#5A6B5F] hover:text-[#1A3D24]',
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pb-2 text-[11px] font-bold text-[#5A6B5F] shrink-0">
        <span className="hidden sm:inline">إجمالي المشاركات:</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black">
          {shareCount} عملية نشر
        </span>
      </div>
    </div>
  );
};

/* ── 6.3 شريط الإشعارات ─────────────────────────────────── */

const FeedbackBanner: React.FC<{ feedback: Feedback }> = ({ feedback }) => {
  const isSuccess = feedback.tone === 'success';
  return (
    <div
      role="status"
      className={cx(
        'p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-black animate-in fade-in',
        isSuccess
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
          : 'bg-rose-50 border-rose-300 text-rose-900',
      )}
    >
      <CheckCircle2
        className={cx(
          'w-4 h-4 shrink-0',
          isSuccess ? 'text-emerald-600' : 'text-rose-600',
        )}
      />
      <span>{feedback.message}</span>
    </div>
  );
};

/* ── 6.4 اختيار القالب ──────────────────────────────────── */

interface TemplatePickerProps {
  selected: PostTemplateId;
  onSelect: (id: PostTemplateId) => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({ selected, onSelect }) => (
  <div>
    <label className="block text-xs font-black text-[#1A3D24] mb-2 flex items-center gap-1.5">
      <Sparkles className="w-4 h-4 text-[#EAB308]" />
      <span>اختر قالباً تسويقياً جاهزاً للتوليد الفوري:</span>
    </label>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {TEMPLATE_META.map((template) => {
        const isSelected = selected === template.id;
        return (
          <button
            key={template.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(template.id)}
            className={cx(
              'p-3 rounded-xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between',
              isSelected
                ? 'border-[#2D6A3F] bg-[#2D6A3F]/8 shadow-xs ring-2 ring-[#2D6A3F]/20'
                : 'border-[#E8E1D3] bg-white hover:border-[#2D6A3F]/40',
            )}
          >
            <div className="flex items-center gap-2 font-black text-xs text-[#1A3D24]">
              <span className="text-base">{template.emoji}</span>
              <span>{template.title}</span>
            </div>
            <p className="text-[11px] text-[#5A6B5F] mt-1 font-semibold leading-relaxed">
              {template.description}
            </p>
          </button>
        );
      })}
    </div>
  </div>
);

/* ── 6.5 محرر النص ──────────────────────────────────────── */

interface PostEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRestore: () => void;
  canRestore: boolean;
}

const PostEditor: React.FC<PostEditorProps> = ({
  value,
  onChange,
  onRestore,
  canRestore,
}) => (
  <div>
    <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
      <label
        htmlFor="social-post-body"
        className="text-xs font-black text-[#1A3D24] flex items-center gap-1"
      >
        نص المنشور (يمكنك التعديل والإضافة بحرية قبل النشر):
      </label>

      <button
        type="button"
        onClick={onRestore}
        disabled={!canRestore}
        className="text-[11px] font-bold text-[#EA580C] hover:text-[#C25E12] inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>استعادة النص الأصلي للقالب</span>
      </button>
    </div>

    <div className="relative">
      <textarea
        id="social-post-body"
        rows={8}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        dir="rtl"
        className="w-full p-3.5 pb-8 rounded-2xl bg-white border-2 border-[#2D6A3F]/25 focus:border-[#2D6A3F] focus:ring-2 focus:ring-[#2D6A3F]/20 outline-none text-xs sm:text-sm text-[#1A3D24] font-medium leading-relaxed resize-y shadow-inner"
        placeholder="اكتب أو عدّل المنشور التسويقي هنا..."
      />
      <div className="absolute bottom-2.5 left-3 text-[10px] font-mono font-bold text-stone-400 bg-stone-100/80 px-2 py-0.5 rounded-md pointer-events-none">
        {value.length} حرف
      </div>
    </div>
  </div>
);

/* ── 6.6 لوحة أزرار النشر ───────────────────────────────── */

interface PublishActionsProps {
  copied: boolean;
  telegramSending: boolean;
  telegramConfigured: boolean;
  onShareWhatsApp: () => void;
  onShareFacebook: () => void;
  onShareTelegram: () => void;
  onShareNative: () => void;
  onShareTwitter: () => void;
  onCopy: () => void;
  onTelegramBot: () => void;
}

const PublishActions: React.FC<PublishActionsProps> = ({
  copied,
  telegramSending,
  telegramConfigured,
  onShareWhatsApp,
  onShareFacebook,
  onShareTelegram,
  onShareNative,
  onShareTwitter,
  onCopy,
  onTelegramBot,
}) => (
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
      <button
        type="button"
        onClick={onShareWhatsApp}
        className="p-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
      >
        <MessageCircle className="w-5 h-5" />
        <span>نشر على واتساب</span>
        <span className="text-[10px] font-normal opacity-90">حالات / مجموعات</span>
      </button>

      <button
        type="button"
        onClick={onShareFacebook}
        className="p-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
      >
        <Share2 className="w-5 h-5" />
        <span>مشاركة فيسبوك</span>
        <span className="text-[10px] font-normal opacity-90">صفحة / منشور عام</span>
      </button>

      <button
        type="button"
        onClick={onShareTelegram}
        className="p-3 rounded-xl bg-[#229ED9] hover:bg-[#1E8EC4] text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
      >
        <Send className="w-5 h-5" />
        <span>نشر تليغرام</span>
        <span className="text-[10px] font-normal opacity-90">قناة / مجموعة</span>
      </button>

      <button
        type="button"
        onClick={onShareNative}
        className="p-3 rounded-xl bg-gradient-to-l from-[#1A3D24] to-[#2D6A3F] hover:from-[#2D6A3F] hover:to-[#1A3D24] text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
      >
        <Smartphone className="w-5 h-5 text-[#F5D76E]" />
        <span>مشاركة الجوال</span>
        <span className="text-[10px] font-normal opacity-90">Stories / TikTok</span>
      </button>
    </div>

    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-stone-200/80">
      <button
        type="button"
        onClick={onCopy}
        className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border-2 border-stone-300 text-stone-800 text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
      >
        {copied ? (
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

      {telegramConfigured && (
        <button
          type="button"
          disabled={telegramSending}
          onClick={onTelegramBot}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#0284C7] text-white text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs disabled:opacity-50 disabled:cursor-wait"
        >
          <Send className="w-4 h-4 text-amber-300" />
          <span>
            {telegramSending ? 'جارٍ الإرسال التلقائي...' : 'إرسال آلي صامت للقناة (Bot API)'}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={onShareTwitter}
        className="px-3.5 py-2.5 rounded-xl bg-black hover:bg-stone-800 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
      >
        <span>نشر على منصة X</span>
      </button>
    </div>
  </div>
);

/* ── 6.7 تبويب ربط الحسابات ─────────────────────────────── */

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, hint, children }) => (
  <div>
    <label className="block text-xs font-black text-[#1A3D24] mb-1">{label}</label>
    {children}
    {hint && <p className="text-[10px] font-semibold text-stone-500 mt-1">{hint}</p>}
  </div>
);

const INPUT_CLASS =
  'w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#2D6A3F] focus:ring-2 focus:ring-[#2D6A3F]/15 transition';

interface AccountsTabProps {
  links: SocialLinks;
  saved: boolean;
  onChange: (patch: Partial<SocialLinks>) => void;
  onSave: () => void;
}

const AccountsTab: React.FC<AccountsTabProps> = ({ links, saved, onChange, onSave }) => (
  <div className="space-y-4">
    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold leading-relaxed">
      💡 <strong>معلومة تقنية:</strong> هذه الروابط تُحفظ في متصفحك لتمكينك من فتح
      وإدارة صفحات المتجر الرسمية بنقرة واحدة، كما يمكنك ربط{' '}
      <strong>بوت تليغرام مجاني (Telegram Bot)</strong> لإرسال العروض تلقائياً لقناتك
      دون أي تدخل يدوي.
    </div>

    {saved && (
      <div
        role="status"
        className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center gap-2"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span>تم حفظ إعدادات وروابط الحسابات بنجاح!</span>
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <Field label="رابط صفحة فيسبوك الرسمية:">
        <input
          type="url"
          dir="ltr"
          value={links.facebook}
          onChange={(e) => onChange({ facebook: e.target.value })}
          placeholder="https://facebook.com/khodra.fes"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="رابط حساب إنستغرام:">
        <input
          type="url"
          dir="ltr"
          value={links.instagram}
          onChange={(e) => onChange({ instagram: e.target.value })}
          placeholder="https://instagram.com/khodra.fes"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="رابط مجموعة أو قناة واتساب للزبناء:">
        <input
          type="url"
          dir="ltr"
          value={links.whatsappGroup}
          onChange={(e) => onChange({ whatsappGroup: e.target.value })}
          placeholder="https://chat.whatsapp.com/..."
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="رابط حساب تيك توك:">
        <input
          type="url"
          dir="ltr"
          value={links.tiktok}
          onChange={(e) => onChange({ tiktok: e.target.value })}
          placeholder="https://tiktok.com/@khodra.fes"
          className={INPUT_CLASS}
        />
      </Field>

      <div className="sm:col-span-2 pt-2 border-t border-stone-200">
        <h4 className="text-xs font-black text-[#1A3D24] mb-2 flex items-center gap-1.5">
          <Send className="w-4 h-4 text-[#0284C7]" />
          <span>
            الربط الآلي البرمجي مع تليغرام (اختياري للنشر الصامت بضغطة زر):
          </span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Telegram Bot Token (من @BotFather):">
            <input
              type="password"
              dir="ltr"
              autoComplete="off"
              value={links.telegramBotToken}
              onChange={(e) => onChange({ telegramBotToken: e.target.value })}
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className={INPUT_CLASS}
            />
          </Field>

          <Field
            label="معرّف القناة أو المجموعة (Chat ID):"
            hint="مثال: @khodra_channel أو -10012345678"
          >
            <input
              type="text"
              dir="ltr"
              value={links.telegramChatId}
              onChange={(e) => onChange({ telegramChatId: e.target.value })}
              placeholder="@khodra_channel أو -10012345678"
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </div>
    </div>

    <div className="pt-3 flex items-center justify-between flex-wrap gap-2">
      <button
        type="button"
        onClick={onSave}
        className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] hover:from-[#3A8152] hover:to-[#2D6A3F] text-white font-black text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
      >
        حفظ إعدادات الحسابات
      </button>

      <div className="flex items-center gap-2 flex-wrap">
        {links.facebook && (
          <a
            href={links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-bold inline-flex items-center gap-1 hover:bg-stone-50"
          >
            <span>صفحة فيسبوك</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        )}
        {links.instagram && (
          <a
            href={links.instagram}
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
);

/* ═══════════════════════════════════════════════════════════
   7) المكوّن الرئيسي
   ═══════════════════════════════════════════════════════════ */

export const AdminSocialPublisherModal: React.FC<
  AdminSocialPublisherModalProps
> = ({ isOpen, onClose }) => {
  /* ── الحالة ── */
  const [links, setLinks] = useState<SocialLinks>(loadSocialLinks);
  const [tab, setTab] = useState<SocialTab>('publish');
  const [templateId, setTemplateId] = useState<PostTemplateId>('fresh_morning');
  const [copied, setCopied] = useState(false);
  const [linksSaved, setLinksSaved] = useState(false);
  const [telegramSending, setTelegramSending] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const { feedback, showFeedback } = useTimedFeedback();
  const { count: shareCount, increment: recordShare } = useShareCounter();

  /* ── القيم المشتقة ── */
  const storeUrl = useMemo(
    () => (isBrowser ? window.location.origin : FALLBACK_STORE_URL),
    [],
  );

  const templates = useMemo(
    () => buildTemplates(storeUrl, STORE_CONFIG.whatsappNumber),
    [storeUrl],
  );

  const [body, setBody] = useState<string>(() => templates.fresh_morning);

  const isDirty = body !== templates[templateId];

  const telegramConfigured = Boolean(
    links.telegramBotToken.trim() && links.telegramChatId.trim(),
  );

  /* ── سلوك النافذة ── */
  useModalBehavior(isOpen, onClose);

  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  /* ── الأحداث ── */

  const handleSelectTemplate = useCallback(
    (id: PostTemplateId) => {
      setTemplateId(id);
      setBody(templates[id]);
    },
    [templates],
  );

  const handleRestoreTemplate = useCallback(() => {
    setBody(templates[templateId]);
  }, [templates, templateId]);

  const handleLinksChange = useCallback((patch: Partial<SocialLinks>) => {
    setLinks((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSaveLinks = useCallback(() => {
    if (persistSocialLinks(links)) {
      setLinksSaved(true);
      window.setTimeout(() => setLinksSaved(false), 2500);
    } else {
      showFeedback({
        tone: 'error',
        message: 'تعذّر حفظ الإعدادات في هذا المتصفح (قد يكون التخزين المحلي معطّلاً).',
      });
    }
  }, [links, showFeedback]);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(body);
    if (ok) {
      recordShare();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } else {
      showFeedback({
        tone: 'error',
        message: 'تعذّر النسخ التلقائي، حدّد النص وانسخه يدوياً.',
      });
    }
  }, [body, recordShare, showFeedback]);

  const handleShareWhatsApp = useCallback(() => {
    recordShare();
    openWindow(shareUrls.whatsapp(body));
  }, [body, recordShare]);

  const handleShareFacebook = useCallback(() => {
    recordShare();
    openWindow(shareUrls.facebook(storeUrl, body), 'width=600,height=500');
  }, [body, storeUrl, recordShare]);

  const handleShareTelegram = useCallback(() => {
    recordShare();
    openWindow(shareUrls.telegram(storeUrl, body));
  }, [body, storeUrl, recordShare]);

  const handleShareTwitter = useCallback(() => {
    recordShare();
    openWindow(shareUrls.twitter(storeUrl, body));
  }, [body, storeUrl, recordShare]);

  const handleShareNative = useCallback(async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: SHARE_TITLE, text: body, url: storeUrl });
        recordShare();
        return;
      } catch (error) {
        // إلغاء المستخدم ليس خطأً يستحق التنبيه
        if ((error as DOMException)?.name === 'AbortError') return;
      }
    }
    await handleCopy();
  }, [body, storeUrl, recordShare, handleCopy]);

  const handleTelegramBot = useCallback(async () => {
    const token = links.telegramBotToken.trim();
    const chatId = links.telegramChatId.trim();

    if (!token || !chatId) {
      showFeedback({
        tone: 'error',
        message: 'يرجى إدخال Bot Token و Chat ID في تبويب إعدادات الحسابات أولاً.',
      });
      return;
    }

    setTelegramSending(true);
    try {
      const data = await sendTelegramMessage(token, chatId, body);
      if (data?.ok) {
        recordShare();
        showFeedback({
          tone: 'success',
          message: '✓ تم النشر التلقائي بنجاح في قناة/مجموعة تليغرام!',
        });
      } else {
        showFeedback({
          tone: 'error',
          message: `خطأ من تليغرام: ${data?.description ?? 'تأكد من صحة التوكن والقناة.'}`,
        });
      }
    } catch {
      showFeedback({
        tone: 'error',
        message: 'فشل الاتصال بخادم تليغرام، تأكد من اتصال الإنترنت.',
      });
    } finally {
      setTelegramSending(false);
    }
  }, [links, body, recordShare, showFeedback]);

  if (!isOpen) return null;

  /* ── العرض ── */
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="مركز النشر والتواصل الاجتماعي"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-[#FAF8F4] w-full sm:max-w-4xl shadow-2xl z-10 sm:rounded-3xl flex flex-col max-h-screen sm:max-h-[94vh] overflow-hidden text-right border-2 border-[#E8E1D3] outline-none"
      >
        <ModalHeader onClose={onClose} />

        <ModalTabs active={tab} onChange={setTab} shareCount={shareCount} />

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {feedback && <FeedbackBanner feedback={feedback} />}

          {tab === 'publish' && (
            <div className="space-y-5">
              <TemplatePicker selected={templateId} onSelect={handleSelectTemplate} />

              <PostEditor
                value={body}
                onChange={setBody}
                onRestore={handleRestoreTemplate}
                canRestore={isDirty}
              />

              <PublishActions
                copied={copied}
                telegramSending={telegramSending}
                telegramConfigured={telegramConfigured}
                onShareWhatsApp={handleShareWhatsApp}
                onShareFacebook={handleShareFacebook}
                onShareTelegram={handleShareTelegram}
                onShareNative={handleShareNative}
                onShareTwitter={handleShareTwitter}
                onCopy={handleCopy}
                onTelegramBot={handleTelegramBot}
              />
            </div>
          )}

          {tab === 'accounts' && (
            <AccountsTab
              links={links}
              saved={linksSaved}
              onChange={handleLinksChange}
              onSave={handleSaveLinks}
            />
          )}
        </div>
      </div>
    </div>
  );
};