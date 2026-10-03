// ============================================================
// AdminSocialPublisherModal.tsx – مركز النشر والتواصل الاجتماعي (v2.0)
// أداة ذكية مدمجة في لوحة المدير: توليد + جدولة + نشر آلي + سجل
// ============================================================
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X, Share2, Send, MessageCircle, Copy, Check, ExternalLink, Sparkles, Globe,
  Settings, Megaphone, Flame, RotateCcw, CheckCircle2, Smartphone, Layers,
  Image as ImageIcon, Calendar, Clock, Trash2, BarChart3, AlertTriangle,
  Plus, Hash, Smile, Upload, XCircle, Play, Eye, Camera, Music, TrendingUp,
  Save, Filter, Rocket,
} from 'lucide-react';
import { STORE_CONFIG } from '../../data/config';

// ═══════════════════════════════════════════════════════════
// الأنواع (Types)
// ═══════════════════════════════════════════════════════════

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
  telegramChatIds: string; // قائمة IDs مفصولة بفواصل
  tiktok: string;
  facebookPageId: string;
  facebookPageToken: string;
}

type PlatformKey =
  | 'whatsapp' | 'facebook' | 'twitter' | 'telegram'
  | 'instagram' | 'tiktok' | 'native'
  | 'telegramBot' | 'facebookPage';

interface PublishRecord {
  id: string;
  platform: PlatformKey;
  text: string;
  timestamp: number;
  status: 'success' | 'failed';
  error?: string;
  hasImage?: boolean;
}

interface ScheduledPost {
  id: string;
  text: string;
  platforms: PlatformKey[];
  scheduledFor: number;
  imageDataUrl?: string;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: number;
}

type PostTemplateType = 'fresh_morning' | 'family_boxes' | 'free_delivery' | 'custom';
type TabKey = 'publish' | 'schedule' | 'history' | 'accounts';

// ═══════════════════════════════════════════════════════════
// ثوابت (Constants)
// ═══════════════════════════════════════════════════════════

const STORAGE = {
  links: 'khodra_admin_social_links',
  shareCount: 'khodra_admin_share_count',
  history: 'khodra_admin_social_history',
  schedule: 'khodra_admin_social_schedule',
  draft: 'khodra_admin_social_draft',
};

const DEFAULT_LINKS: SocialLinks = {
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  whatsappGroup: `https://wa.me/${STORE_CONFIG.whatsappNumber}`,
  telegramChannel: '',
  telegramBotToken: '',
  telegramChatId: '',
  telegramChatIds: '',
  tiktok: '',
  facebookPageId: '',
  facebookPageToken: '',
};

const EMOJI_PALETTE = [
  '🌿', '🍅', '🥬', '🍊', '🧺', '🚴', '📦', '✨', '✅', '🎁',
  '📱', '👉', '🔥', '💚', '🛒', '⚡', '🥗', '🍎', '🌅', '💰',
];

const HASHTAG_PALETTE = [
  '#خضرة_فاس', '#طازج_يوميا', '#فاس', '#توصيل_فاس', '#سوق_الجملة',
  '#خضار_وفواكه', '#عروض_فاس', '#FesDelivery', '#KhodraFresh', '#MoroccoFresh',
];

const PLATFORM_META: Record<PlatformKey, { label: string; color: string; limit: number; icon: React.ReactNode }> = {
  whatsapp:     { label: 'واتساب',        color: '#25D366', limit: 65000, icon: <MessageCircle className="w-3.5 h-3.5" /> },
  facebook:     { label: 'فيسبوك',        color: '#1877F2', limit: 63206, icon: <Share2 className="w-3.5 h-3.5" /> },
  twitter:      { label: 'منصة X',        color: '#000000', limit: 280,   icon: <Hash className="w-3.5 h-3.5" /> },
  telegram:     { label: 'تليغرام',       color: '#229ED9', limit: 4096,  icon: <Send className="w-3.5 h-3.5" /> },
  instagram:    { label: 'إنستغرام',      color: '#E4405F', limit: 2200,  icon: <Camera className="w-3.5 h-3.5" /> },
  tiktok:       { label: 'تيك توك',        color: '#000000', limit: 2200,  icon: <Music className="w-3.5 h-3.5" /> },
  native:       { label: 'مشاركة الجوال', color: '#2D6A3F', limit: 999999,icon: <Smartphone className="w-3.5 h-3.5" /> },
  telegramBot:  { label: 'تليغرام آلي',   color: '#0284C7', limit: 4096,  icon: <Rocket className="w-3.5 h-3.5" /> },
  facebookPage: { label: 'صفحة فيسبوك',   color: '#1877F2', limit: 63206, icon: <Share2 className="w-3.5 h-3.5" /> },
};

// ═══════════════════════════════════════════════════════════
// أدوات مساعدة (Helpers)
// ═══════════════════════════════════════════════════════════

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return new Date(ts).toLocaleDateString('ar-MA');
};

const countdownTo = (ts: number): string => {
  const diff = ts - Date.now();
  if (diff <= 0) return 'حان الموعد';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `بعد ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `بعد ${hours} ساعة و${mins % 60} د`;
  return `بعد ${Math.floor(hours / 24)} يوم`;
};

const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
};

// ═══════════════════════════════════════════════════════════
// المكوّن الرئيسي
// ═══════════════════════════════════════════════════════════

export const AdminSocialPublisherModal: React.FC<AdminSocialPublisherModalProps> = ({ isOpen, onClose }) => {
  // ─── الحالة الأساسية ───
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => ({
    ...DEFAULT_LINKS,
    ...safeParse<Partial<SocialLinks>>(STORAGE.links, {}),
  }));
  const [activeTab, setActiveTab] = useState<TabKey>('publish');
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplateType>('fresh_morning');
  const [customText, setCustomText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [telegramSending, setTelegramSending] = useState(false);
  const [fbSending, setFbSending] = useState(false);
  const [notify, setNotify] = useState<{ kind: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [shareCount, setShareCount] = useState<number>(() => parseInt(localStorage.getItem(STORAGE.shareCount) || '0', 10) || 0);
  const [history, setHistory] = useState<PublishRecord[]>(() => safeParse<PublishRecord[]>(STORAGE.history, []));
  const [scheduled, setScheduled] = useState<ScheduledPost[]>(() => safeParse<ScheduledPost[]>(STORAGE.schedule, []));
  const [historyFilter, setHistoryFilter] = useState<PlatformKey | 'all'>('all');
  const [showEmojiBar, setShowEmojiBar] = useState(true);
  const [showHashtagBar, setShowHashtagBar] = useState(true);
  const [schedDate, setSchedDate] = useState<string>('');
  const [schedTime, setSchedTime] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const templatesRef = useRef<Record<PostTemplateType, string>>({} as any);

  const storeUrl = typeof window !== 'undefined' ? window.location.origin : 'https://khodra.ma';

  // ─── التنبيهات السريعة ───
  const flash = useCallback((kind: 'success' | 'error' | 'info', msg: string, ms = 3500) => {
    setNotify({ kind, msg });
    setTimeout(() => setNotify(null), ms);
  }, []);

  // ─── قوالب المنشورات ───
  const templatesText = useMemo<Record<PostTemplateType, string>>(() => ({
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
  }), [storeUrl, customText]);

  templatesRef.current = templatesText;

  // النص الحالي للمنشور
  const currentPostText = selectedTemplate === 'custom' ? customText : templatesText[selectedTemplate];

  // ─── مؤشرات حدود المنصة ───
  const charLimitInfo = useMemo(() => {
    const len = currentPostText.length;
    const targets: PlatformKey[] = ['twitter', 'instagram', 'telegram', 'facebook'];
    return targets.map(k => ({
      key: k,
      ...PLATFORM_META[k],
      used: len,
      ok: len <= PLATFORM_META[k].limit,
    }));
  }, [currentPostText]);

  // ═══ تأثيرات جانبية ═══

  // قفل التمرير + حفظ المسودة + استعادة النص عند الفتح
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // استعادة المسودة إن وُجدت
    const draft = safeParse<{ text?: string; template?: PostTemplateType } | null>(STORAGE.draft, null);
    if (draft?.text && draft.text.trim()) {
      setCustomText(draft.text);
      setSelectedTemplate(draft.template || 'custom');
    } else {
      setCustomText(templatesRef.current.fresh_morning);
      setSelectedTemplate('fresh_morning');
    }

    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // حفظ تلقائي للمسودة (debounced)
  useEffect(() => {
    if (!isOpen || !customText) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE.draft, JSON.stringify({ text: customText, template: selectedTemplate }));
      } catch {}
    }, 700);
    return () => clearTimeout(t);
  }, [customText, selectedTemplate, isOpen]);

  // زر Escape للإغلاق
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // ═══ المنفّذ الآلي للمنشورات المجدولة (يعمل كل 20 ثانية) ═══
  useEffect(() => {
    if (!isOpen) return;
    const tick = async () => {
      const now = Date.now();
      const due = scheduled.filter(s => s.status === 'pending' && s.scheduledFor <= now);
      if (due.length === 0) return;

      for (const post of due) {
        let published = false;
        // محاولة النشر الآلي عبر تليغرام بوت
        if (post.platforms.includes('telegramBot') && socialLinks.telegramBotToken && (socialLinks.telegramChatIds || socialLinks.telegramChatId)) {
          const ok = await sendTelegramAuto(post.text, post.imageDataUrl, post.platforms.includes('telegramBot'));
          if (ok) published = true;
        }
        // محاولة النشر الآلي عبر فيسبوك Graph
        if (!published && post.platforms.includes('facebookPage') && socialLinks.facebookPageId && socialLinks.facebookPageToken) {
          const ok = await sendFacebookAuto(post.text, post.imageDataUrl);
          if (ok) published = true;
        }
        // تحديث الحالة
        setScheduled(prev => {
          const next = prev.map(s => s.id === post.id ? { ...s, status: (published ? 'sent' : 'pending') as ScheduledPost['status'] } : s);
          localStorage.setItem(STORAGE.schedule, JSON.stringify(next));
          return next;
        });
        if (published) {
          flash('success', `✓ تم نشر منشور مجدول تلقائياً (${new Date(post.scheduledFor).toLocaleTimeString('ar-MA')})`);
        }
      }
    };
    const interval = setInterval(tick, 20000);
    tick(); // فحص فوري
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, scheduled, socialLinks.telegramBotToken, socialLinks.telegramChatIds, socialLinks.facebookPageId, socialLinks.facebookPageToken]);

  // ═══ الدوال المساعدة ═══

  const persistSchedule = (list: ScheduledPost[]) => {
    setScheduled(list);
    try { localStorage.setItem(STORAGE.schedule, JSON.stringify(list)); } catch {}
  };

  const persistHistory = (list: PublishRecord[]) => {
    setHistory(list);
    try { localStorage.setItem(STORAGE.history, JSON.stringify(list.slice(0, 100))); } catch {}
  };

  const recordShare = useCallback((platform: PlatformKey, text: string, status: 'success' | 'failed' = 'success', error?: string, hasImage?: boolean) => {
    const rec: PublishRecord = { id: uid(), platform, text, timestamp: Date.now(), status, error, hasImage };
    setHistory(prev => {
      const next = [rec, ...prev].slice(0, 100);
      try { localStorage.setItem(STORAGE.history, JSON.stringify(next)); } catch {}
      return next;
    });
    if (status === 'success') {
      setShareCount(c => {
        const n = c + 1;
        try { localStorage.setItem(STORAGE.shareCount, String(n)); } catch {}
        return n;
      });
    }
  }, []);

  const handleSaveLinks = () => {
    try {
      localStorage.setItem(STORAGE.links, JSON.stringify(socialLinks));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {}
  };

  const handleSelectTemplate = (t: PostTemplateType) => {
    setSelectedTemplate(t);
    if (t !== 'custom') setCustomText(templatesText[t]);
  };

  const resetTemplateText = () => {
    if (selectedTemplate !== 'custom') setCustomText(templatesText[selectedTemplate]);
  };

  // ─── إدراج عند موضع المؤشر ───
  const insertAtCursor = (insert: string) => {
    const ta = textareaRef.current;
    if (!ta) { setCustomText(prev => prev + insert); setSelectedTemplate('custom'); return; }
    const start = ta.selectionStart ?? customText.length;
    const end = ta.selectionEnd ?? customText.length;
    const next = customText.slice(0, start) + insert + customText.slice(end);
    setCustomText(next);
    setSelectedTemplate('custom');
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + insert.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const toggleHashtag = (tag: string) => {
    if (customText.includes(tag)) {
      const next = customText.replace(tag, '').replace(/[ \t]{2,}/g, ' ').trim();
      setCustomText(next);
    } else {
      const prefix = customText.length > 0 && !/\s$/.test(customText) ? ' ' : '';
      insertAtCursor(prefix + tag + ' ');
    }
    setSelectedTemplate('custom');
  };

  // ─── إدارة الصورة ───
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { flash('error', 'يرجى اختيار ملف صورة صالح.'); return; }
    if (file.size > 6 * 1024 * 1024) { flash('error', 'حجم الصورة كبير جداً (الحد 6 ميغابايت).'); return; }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ═══ دوال النشر لكل منصة ═══

  const shareToWhatsApp = () => {
    const encoded = encodeURIComponent(currentPostText);
    const url = imageDataUrl
      ? `https://api.whatsapp.com/send?text=${encoded}` // الصورة يتم إرفاقها يدوياً بعد فتح واتساب
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    recordShare('whatsapp', currentPostText, 'success', undefined, !!imageDataUrl);
    if (imageDataUrl) flash('info', 'تم فتح واتساب — أرفق الصورة يدوياً من الحافظة.');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}&quote=${encodeURIComponent(currentPostText.slice(0, 500))}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
    recordShare('facebook', currentPostText, 'success', undefined, !!imageDataUrl);
  };

  const shareToTwitter = () => {
    const short = currentPostText.slice(0, 240);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(short)}&url=${encodeURIComponent(storeUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    recordShare('twitter', currentPostText, 'success', undefined, !!imageDataUrl);
  };

  const shareToTelegramWeb = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(currentPostText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    recordShare('telegram', currentPostText, 'success', undefined, !!imageDataUrl);
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'متجر خُضرة فاس — خضر وفواكه طازجة', text: currentPostText, url: storeUrl });
        recordShare('native', currentPostText, 'success', undefined, !!imageDataUrl);
      } catch {}
    } else {
      handleCopyText();
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(currentPostText);
      setCopiedStatus('all');
      recordShare('instagram', currentPostText, 'success');
      setTimeout(() => setCopiedStatus(null), 3000);
    } catch {}
  };

  // ─── النشر الآلي عبر تليغرام بوت ───
  const sendTelegramAuto = async (text: string, img: string | null | undefined, markRecord = false): Promise<boolean> => {
    const token = socialLinks.telegramBotToken;
    const chatIdsRaw = (socialLinks.telegramChatIds || socialLinks.telegramChatId || '').trim();
    if (!token || !chatIdsRaw) return false;
    const chatIds = chatIdsRaw.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
    if (chatIds.length === 0) return false;

    let anySuccess = false;
    for (const chatId of chatIds) {
      try {
        let res: Response;
        if (img) {
          const blob = await (await fetch(img)).blob();
          const fd = new FormData();
          fd.append('chat_id', chatId);
          fd.append('caption', text.slice(0, 1024)); // Telegram caption limit
          fd.append('parse_mode', 'HTML');
          fd.append('photo', blob, 'post.jpg');
          res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: fd });
        } else {
          res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: 'HTML',
              disable_web_page_preview: false,
            }),
          });
        }
        const data = await res.json();
        if (data.ok) anySuccess = true;
        else if (markRecord) flash('error', `تليغرام (${chatId}): ${data.description || 'خطأ'}`);
      } catch (e) {
        if (markRecord) flash('error', `فشل الاتصال بخادم تليغرام للقناة ${chatId}.`);
      }
    }
    return anySuccess;
  };

  const handleTelegramAutoPublish = async () => {
    if (!socialLinks.telegramBotToken || (!socialLinks.telegramChatIds && !socialLinks.telegramChatId)) {
      flash('error', 'يرجى إدخال Bot Token و Chat ID في تبويب إعدادات الحسابات أولاً.');
      setActiveTab('accounts');
      return;
    }
    setTelegramSending(true);
    try {
      const ok = await sendTelegramAuto(currentPostText, imageDataUrl, true);
      if (ok) {
        recordShare('telegramBot', currentPostText, 'success', undefined, !!imageDataUrl);
        flash('success', '✓ تم النشر الآلي بنجاح على قناة/قنوات تليغرام!');
      } else {
        recordShare('telegramBot', currentPostText, 'failed', 'فشل النشر الآلي');
        flash('error', 'تعذّر النشر التلقائي — تحقق من التوكن والقناة.');
      }
    } finally {
      setTelegramSending(false);
    }
  };

  // ─── النشر الآلي عبر Facebook Graph API ───
  const sendFacebookAuto = async (text: string, img: string | null | undefined): Promise<boolean> => {
    const pageId = socialLinks.facebookPageId;
    const token = socialLinks.facebookPageToken;
    if (!pageId || !token) return false;
    try {
      if (img) {
        // Graph API photo upload with URL/двоичные данные
        const blob = await (await fetch(img)).blob();
        const fd = new FormData();
        fd.append('caption', text);
        fd.append('access_token', token);
        fd.append('source', blob, 'post.jpg');
        const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, { method: 'POST', body: fd });
        const data = await res.json();
        return !!data.id;
      } else {
        const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, access_token: token }),
        });
        const data = await res.json();
        return !!data.id;
      }
    } catch { return false; }
  };

  const handleFacebookAutoPublish = async () => {
    if (!socialLinks.facebookPageId || !socialLinks.facebookPageToken) {
      flash('error', 'يرجى إدخال Page ID و Page Access Token في تبويب إعدادات الحسابات.');
      setActiveTab('accounts');
      return;
    }
    setFbSending(true);
    try {
      const ok = await sendFacebookAuto(currentPostText, imageDataUrl);
      if (ok) {
        recordShare('facebookPage', currentPostText, 'success', undefined, !!imageDataUrl);
        flash('success', '✓ تم النشر الآلي على صفحة فيسبوك بنجاح!');
      } else {
        recordShare('facebookPage', currentPostText, 'failed', 'فشل النشر الآلي');
        flash('error', 'فشل النشر على فيسبوك — تحقق من Page ID والتوكن.');
      }
    } finally {
      setFbSending(false);
    }
  };

  // ═══ جدولة المنشورات ═══
  const handleSchedule = () => {
    if (!schedDate || !schedTime) { flash('error', 'يرجى تحديد تاريخ ووقت النشر.'); return; }
    const dt = new Date(`${schedDate}T${schedTime}`);
    if (isNaN(dt.getTime())) { flash('error', 'صيغة التاريخ غير صحيحة.'); return; }
    if (dt.getTime() <= Date.now()) { flash('error', 'يجب أن يكون الموعد في المستقبل.'); return; }

    const platforms: PlatformKey[] = [];
    if (socialLinks.telegramBotToken && (socialLinks.telegramChatIds || socialLinks.telegramChatId)) platforms.push('telegramBot');
    if (socialLinks.facebookPageId && socialLinks.facebookPageToken) platforms.push('facebookPage');

    if (platforms.length === 0) {
      flash('error', 'لا توجد قنوات نشر آلية مُفعّلة. أضف Bot Token أو Facebook Page Token أولاً.');
      setActiveTab('accounts');
      return;
    }

    const post: ScheduledPost = {
      id: uid(),
      text: currentPostText,
      platforms,
      scheduledFor: dt.getTime(),
      imageDataUrl: imageDataUrl || undefined,
      status: 'pending',
      createdAt: Date.now(),
    };
    persistSchedule([post, ...scheduled]);
    flash('success', `✓ تم جدولة المنشور للتاريخ ${dt.toLocaleString('ar-MA')}`);
    setSchedDate('');
    setSchedTime('');
    setActiveTab('schedule');
  };

  const cancelScheduled = (id: string) => {
    persistSchedule(scheduled.map(s => s.id === id ? { ...s, status: 'cancelled' as const } : s));
  };

  const deleteScheduled = (id: string) => {
    if (!confirm('هل تريد حذف هذا المنشور المجدول نهائياً؟')) return;
    persistSchedule(scheduled.filter(s => s.id !== id));
  };

  const publishScheduledNow = async (post: ScheduledPost) => {
    let ok = false;
    if (post.platforms.includes('telegramBot')) {
      ok = await sendTelegramAuto(post.text, post.imageDataUrl, true);
    }
    if (!ok && post.platforms.includes('facebookPage')) {
      ok = await sendFacebookAuto(post.text, post.imageDataUrl);
    }
    if (ok) {
      persistSchedule(scheduled.map(s => s.id === post.id ? { ...s, status: 'sent' as const } : s));
      recordShare('telegramBot', post.text, 'success', undefined, !!post.imageDataUrl);
      flash('success', '✓ تم النشر المجدول بنجاح.');
    } else {
      flash('error', 'تعذّر النشر — تحقق من إعدادات القنوات الآلية.');
    }
  };

  // ═══ سجل النشر ═══
  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return history;
    return history.filter(h => h.platform === historyFilter);
  }, [history, historyFilter]);

  const deleteHistoryRecord = (id: string) => {
    persistHistory(history.filter(h => h.id !== id));
  };

  const clearHistory = () => {
    if (!confirm('هل تريد مسح سجل النشر بالكامل؟')) return;
    persistHistory([]);
  };

  const resendFromHistory = (rec: PublishRecord) => {
    setCustomText(rec.text);
    setSelectedTemplate('custom');
    setActiveTab('publish');
    flash('info', 'تم تحميل النص في المحرر — عدّله وانشره من جديد.');
  };

  // ─── إحصائيات ───
  const stats = useMemo(() => {
    const total = history.length;
    const success = history.filter(h => h.status === 'success').length;
    const failed = total - success;
    const byPlatform: Record<string, number> = {};
    history.forEach(h => { byPlatform[h.platform] = (byPlatform[h.platform] || 0) + 1; });
    return { total, success, failed, byPlatform };
  }, [history]);

  if (!isOpen) return null;

  // ═══════════════════════════════════════════════════════════
  // العرض (Render)
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="مركز النشر والتواصل الاجتماعي">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#FAF8F4] w-full sm:max-w-5xl shadow-2xl z-10 sm:rounded-3xl flex flex-col max-h-screen sm:max-h-[94vh] overflow-hidden text-right border-2 border-[#E8E1D3]">

        {/* ═══════ الرأس ═══════ */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-[#1A3D24] via-[#2D6A3F] to-[#163920] text-white flex items-center justify-between gap-3 shrink-0 shadow-md border-b-2 border-[#EAB308]/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-[#EAB308]/40 flex items-center justify-center shadow-inner shrink-0">
              <Megaphone className="w-6 h-6 text-[#F5D76E]" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg flex items-center gap-2 flex-wrap">
                <span>مركز النشر الذكي والتواصل الاجتماعي</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[#EAB308]/20 text-[#FEF08A] border border-[#EAB308]/40 font-black">
                  v2.0 — جدولة + نشر آلي
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100/90 font-semibold mt-0.5">
                توليد، جدولة، ونشر آلي على واتساب، فيسبوك، تليغرام وإنستغرام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
              <TrendingUp className="w-3.5 h-3.5 text-[#F5D76E]" />
              <span>{shareCount} عملية نشر</span>
            </div>
            <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer" aria-label="إغلاق">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═══════ شريط التبويبات ═══════ */}
        <div className="bg-white border-b border-[#E8E1D3] px-3 sm:px-6 pt-3 flex items-center gap-1 overflow-x-auto">
          {[
            { key: 'publish', label: 'تجهيز ونشر', icon: <Share2 className="w-4 h-4 text-[#2D6A3F]" /> },
            { key: 'schedule', label: `الجدولة (${scheduled.filter(s => s.status === 'pending').length})`, icon: <Calendar className="w-4 h-4 text-[#EA580C]" /> },
            { key: 'history', label: `السجل (${history.length})`, icon: <BarChart3 className="w-4 h-4 text-[#0284C7]" /> },
            { key: 'accounts', label: 'ربط الحسابات', icon: <Settings className="w-4 h-4 text-[#EA580C]" /> },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`pb-3 px-3 text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'border-[#2D6A3F] text-[#1A3D24]'
                  : 'border-transparent text-[#5A6B5F] hover:text-[#1A3D24]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══════ المحتوى الرئيسي ═══════ */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">

          {/* إشعار عام */}
          {notify && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-black animate-in fade-in ${
              notify.kind === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : notify.kind === 'error' ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-blue-50 border-blue-300 text-blue-900'
            }`}>
              {notify.kind === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
              {notify.kind === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
              {notify.kind === 'info' && <Sparkles className="w-4 h-4 shrink-0 text-blue-600" />}
              <span>{notify.msg}</span>
            </div>
          )}

          {/* ═══════════ تبويب 1: تجهيز ونشر ═══════════ */}
          {activeTab === 'publish' && (
            <div className="space-y-5">

              {/* اختيار القالب */}
              <div>
                <label className="block text-xs font-black text-[#1A3D24] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#EAB308]" />
                  <span>اختر قالباً تسويقياً جاهزاً:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {([
                    { key: 'fresh_morning', icon: '🌅', title: 'طراوة الصباح', desc: 'خضر وفواكه اليوم من سوق الجملة مع توصيل بـ 60 د.' },
                    { key: 'family_boxes', icon: '📦', title: 'صناديق العائلة', desc: 'باقات أسبوعية توفيرية للأسرة والفواكه والطبخ المغربي.' },
                    { key: 'free_delivery', icon: '🚴', title: 'التوصيل الفوري', desc: 'تركيز على سرعة التوصيل والتغطية الشاملة لفاس.' },
                  ] as const).map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => handleSelectTemplate(t.key)}
                      className={`p-3 rounded-xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between ${
                        selectedTemplate === t.key
                          ? 'border-[#2D6A3F] bg-[#2D6A3F]/8 ring-2 ring-[#2D6A3F]/20'
                          : 'border-[#E8E1D3] bg-white hover:border-[#2D6A3F]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-black text-xs text-[#1A3D24]">
                        <span className="text-base">{t.icon}</span>
                        <span>{t.title}</span>
                      </div>
                      <p className="text-[11px] text-[#5A6B5F] mt-1 font-semibold leading-relaxed">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* محرر النص */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="text-xs font-black text-[#1A3D24]">نص المنشور (حرّر بحرية):</label>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setShowEmojiBar(s => !s)} className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${showEmojiBar ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-stone-300 text-stone-600'}`}>
                      <Smile className="w-3.5 h-3.5 inline mr-0.5" /> إيموجي
                    </button>
                    <button type="button" onClick={() => setShowHashtagBar(s => !s)} className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${showHashtagBar ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-stone-300 text-stone-600'}`}>
                      <Hash className="w-3.5 h-3.5 inline mr-0.5" /> هاشتاغ
                    </button>
                    <button type="button" onClick={resetTemplateText} className="text-[11px] font-bold text-[#EA580C] hover:text-[#C25E12] inline-flex items-center gap-1 cursor-pointer">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استعادة</span>
                    </button>
                  </div>
                </div>

                {/* شريط الإيموجي */}
                {showEmojiBar && (
                  <div className="mb-2 p-2 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-wrap gap-1">
                    {EMOJI_PALETTE.map(e => (
                      <button key={e} type="button" onClick={() => insertAtCursor(e)} className="w-8 h-8 rounded-lg hover:bg-white text-lg flex items-center justify-center cursor-pointer transition-colors" title={`إدراج ${e}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                )}

                {/* شريط الهاشتاغات */}
                {showHashtagBar && (
                  <div className="mb-2 p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-wrap gap-1.5">
                    {HASHTAG_PALETTE.map(tag => {
                      const active = customText.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleHashtag(tag)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-emerald-600 text-white border border-emerald-700'
                              : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    rows={8}
                    value={customText}
                    onChange={(e) => { setCustomText(e.target.value); setSelectedTemplate('custom'); }}
                    dir="rtl"
                    className="w-full p-3.5 rounded-2xl bg-white border-2 border-[#2D6A3F]/25 focus:border-[#2D6A3F] focus:ring-2 focus:ring-[#2D6A3F]/20 outline-none text-xs sm:text-sm text-[#1A3D24] font-medium leading-relaxed resize-y shadow-inner font-sans"
                    placeholder="اكتب أو عدّل المنشور التسويقي هنا..."
                  />
                  <div className="absolute bottom-3 left-3 text-[10px] font-mono font-bold text-stone-500 bg-white/90 px-2 py-0.5 rounded-md border border-stone-200">
                    {customText.length} حرف
                  </div>
                </div>

                {/* مؤشرات حدود المنصات */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {charLimitInfo.map(info => (
                    <span
                      key={info.key}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1 border ${
                        info.ok
                          ? 'bg-stone-50 border-stone-200 text-stone-600'
                          : 'bg-rose-50 border-rose-300 text-rose-800'
                      }`}
                    >
                      {info.ok ? <Check className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-rose-600" />}
                      {info.label}: {info.used}/{info.limit}
                    </span>
                  ))}
                </div>
              </div>

              {/* مرفق الصورة */}
              <div className="bg-white rounded-2xl border-2 border-dashed border-stone-300 p-3.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="social-publisher-image" />
                    <label htmlFor="social-publisher-image" className="px-3.5 py-2 rounded-xl bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] hover:from-[#3A8152] hover:to-[#2D6A3F] text-white text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all">
                      <Upload className="w-4 h-4 text-[#F5D76E]" />
                      <span>{imageDataUrl ? 'تغيير الصورة' : 'إرفاق صورة تسويقية'}</span>
                    </label>
                    {imageDataUrl && (
                      <button type="button" onClick={removeImage} className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer">
                        <XCircle className="w-4 h-4" />
                        إزالة
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 font-semibold flex-1">
                    {imageDataUrl ? '✓ سيتم إرفاق الصورة تلقائياً مع النشر على تليغرام وفيسبوك.' : 'مستحسن: صورة 1080×1080، أقل من 6 ميغابايت.'}
                  </p>
                </div>

                {imageDataUrl && (
                  <div className="mt-3 relative w-full sm:w-64 rounded-xl overflow-hidden border-2 border-stone-200 shadow-sm">
                    <img src={imageDataUrl} alt="معاينة" className="w-full h-auto object-cover" />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-black">
                      <ImageIcon className="w-3 h-3 inline mr-1" /> مرفقة
                    </span>
                  </div>
                )}
              </div>

              {/* لوحة النشر السريع */}
              <div className="bg-gradient-to-br from-white to-[#FAF8F3] p-4 sm:p-5 rounded-2xl border-2 border-[#EAB308]/40 shadow-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-[#1A3D24] flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#EA580C]" />
                    <span>انشر الآن بنقرة واحدة:</span>
                  </h3>
                  <span className="text-[11px] font-bold text-[#5A6B5F]">يتم إرفاق النص ورابط المتجر آلياً</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <button type="button" onClick={shareToWhatsApp} className="p-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer">
                    <MessageCircle className="w-5 h-5" />
                    <span>واتساب</span>
                    <span className="text-[10px] font-normal opacity-90">حالات / مجموعات</span>
                  </button>
                  <button type="button" onClick={shareToFacebook} className="p-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer">
                    <Share2 className="w-5 h-5" />
                    <span>فيسبوك</span>
                    <span className="text-[10px] font-normal opacity-90">مشاركة عامة</span>
                  </button>
                  <button type="button" onClick={shareToTelegramWeb} className="p-3 rounded-xl bg-[#229ED9] hover:bg-[#1E8EC4] text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer">
                    <Send className="w-5 h-5" />
                    <span>تليغرام</span>
                    <span className="text-[10px] font-normal opacity-90">قناة / مجموعة</span>
                  </button>
                  <button type="button" onClick={shareViaNative} className="p-3 rounded-xl bg-gradient-to-l from-[#1A3D24] to-[#2D6A3F] hover:from-[#2D6A3F] hover:to-[#1A3D24] text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer">
                    <Smartphone className="w-5 h-5 text-[#F5D76E]" />
                    <span>مشاركة الجوال</span>
                    <span className="text-[10px] font-normal opacity-90">Stories / TikTok</span>
                  </button>
                </div>

                {/* أزرار آلية متقدمة */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-200/80">
                  <button
                    type="button"
                    disabled={telegramSending || !socialLinks.telegramBotToken}
                    onClick={handleTelegramAutoPublish}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#0284C7] text-white text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Rocket className="w-4 h-4 text-amber-300" />
                    <span>{telegramSending ? 'جارٍ الإرسال الآلي...' : 'نشر آلي عبر تليغرام بوت'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={fbSending || !socialLinks.facebookPageId}
                    onClick={handleFacebookAutoPublish}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#1877F2] to-[#0F5FC4] hover:from-[#0F5FC4] hover:to-[#1877F2] text-white text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Share2 className="w-4 h-4 text-amber-300" />
                    <span>{fbSending ? 'جارٍ النشر...' : 'نشر آلي على صفحة فيسبوك'}</span>
                  </button>
                </div>

                {/* أدوات سفلية */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-stone-200/80">
                  <button type="button" onClick={handleCopyText} className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border-2 border-stone-300 text-stone-800 text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs">
                    {copiedStatus === 'all' ? (
                      <><Check className="w-4 h-4 text-emerald-600" /><span className="text-emerald-700">تم النسخ بالكامل!</span></>
                    ) : (
                      <><Copy className="w-4 h-4 text-stone-600" /><span>نسخ (إنستغرام / تيك توك)</span></>
                    )}
                  </button>
                  <button type="button" onClick={shareToTwitter} className="px-3.5 py-2.5 rounded-xl bg-black hover:bg-stone-800 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95">
                    <Hash className="w-3.5 h-3.5" />
                    <span>نشر على منصة X</span>
                  </button>
                </div>
              </div>

              {/* لوحة الجدولة السريعة */}
              <div className="bg-blue-50/60 rounded-2xl border-2 border-blue-200 p-4 space-y-3">
                <h3 className="text-xs sm:text-sm font-black text-blue-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>جدولة المنشور للنشر الآلي لاحقاً</span>
                </h3>
                <p className="text-[11px] text-blue-800 font-semibold">
                  سيُنشر تلقائياً عبر القنوات الآلية المُفعّلة (تليغرام بوت / فيسبوك). يجب أن تبقى الصفحة مفتوحة.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                    className="p-2.5 rounded-xl bg-white border border-blue-300 text-xs font-bold text-stone-800 outline-none focus:border-blue-500" />
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                    className="p-2.5 rounded-xl bg-white border border-blue-300 text-xs font-bold text-stone-800 outline-none focus:border-blue-500" />
                  <button type="button" onClick={handleSchedule}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#1E40AF] to-[#1E3A8A] hover:from-[#1E3A8A] hover:to-[#1E40AF] text-white text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all">
                    <Clock className="w-4 h-4 text-amber-300" />
                    <span>جدولة النشر</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ═══════════ تبويب 2: الجدولة ═══════════ */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              {scheduled.length === 0 ? (
                <div className="p-10 text-center rounded-2xl border-2 border-dashed border-stone-300 bg-white">
                  <Calendar className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                  <p className="text-sm font-black text-stone-600">لا توجد منشورات مجدولة بعد.</p>
                  <p className="text-xs text-stone-400 mt-1">جدول أول منشور من تبويب "تجهيز ونشر".</p>
                </div>
              ) : (
                scheduled.map(post => (
                  <div key={post.id} className={`p-3.5 rounded-2xl border-2 bg-white ${
                    post.status === 'sent' ? 'border-emerald-300 bg-emerald-50/40'
                    : post.status === 'cancelled' ? 'border-stone-300 opacity-60'
                    : 'border-blue-300'
                  }`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            post.status === 'pending' ? 'bg-blue-100 text-blue-900'
                            : post.status === 'sent' ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-stone-200 text-stone-700'
                          }`}>
                            {post.status === 'pending' ? '⏳ منتظر' : post.status === 'sent' ? '✓ تم النشر' : '⛔ ملغى'}
                          </span>
                          {post.imageDataUrl && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 inline-flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" /> بصورة
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-stone-600">
                            {new Date(post.scheduledFor).toLocaleString('ar-MA')}
                          </span>
                          {post.status === 'pending' && (
                            <span className="text-[11px] font-black text-blue-700">({countdownTo(post.scheduledFor)})</span>
                          )}
                        </div>
                        <p className="text-xs text-stone-700 line-clamp-3 leading-relaxed whitespace-pre-wrap">{post.text.slice(0, 200)}{post.text.length > 200 ? '…' : ''}</p>
                      </div>

                      {post.imageDataUrl && (
                        <img src={post.imageDataUrl} alt="مرفقة" className="w-20 h-20 rounded-xl object-cover border-2 border-stone-200 shrink-0" />
                      )}
                    </div>

                    {post.status === 'pending' && (
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <button type="button" onClick={() => publishScheduledNow(post)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black inline-flex items-center gap-1.5 cursor-pointer active:scale-95">
                          <Play className="w-3.5 h-3.5" /> نشر الآن
                        </button>
                        <button type="button" onClick={() => cancelScheduled(post.id)} className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-black inline-flex items-center gap-1.5 cursor-pointer">
                          <XCircle className="w-3.5 h-3.5" /> إلغاء
                        </button>
                        <button type="button" onClick={() => deleteScheduled(post.id)} className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-black inline-flex items-center gap-1.5 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </button>
                      </div>
                    )}
                    {post.status !== 'pending' && (
                      <div className="mt-3">
                        <button type="button" onClick={() => deleteScheduled(post.id)} className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 text-[11px] font-black inline-flex items-center gap-1.5 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" /> حذف من السجل
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══════════ تبويب 3: السجل ═══════════ */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* إحصائيات */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-white border-2 border-stone-200 text-center">
                  <div className="text-2xl font-black text-[#1A3D24]">{stats.total}</div>
                  <div className="text-[11px] font-bold text-stone-500 mt-0.5">إجمالي العمليات</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-center">
                  <div className="text-2xl font-black text-emerald-700">{stats.success}</div>
                  <div className="text-[11px] font-bold text-emerald-600 mt-0.5">ناجحة</div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-center">
                  <div className="text-2xl font-black text-rose-700">{stats.failed}</div>
                  <div className="text-[11px] font-bold text-rose-600 mt-0.5">فاشلة</div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 border-2 border-blue-200 text-center">
                  <div className="text-2xl font-black text-blue-700">{Object.keys(stats.byPlatform).length}</div>
                  <div className="text-[11px] font-bold text-blue-600 mt-0.5">منصات مستخدمة</div>
                </div>
              </div>

              {/* فلتر */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-stone-500" />
                <button type="button" onClick={() => setHistoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${historyFilter === 'all' ? 'bg-[#2D6A3F] text-white' : 'bg-white border border-stone-300 text-stone-700'}`}>
                  الكل
                </button>
                {Object.keys(stats.byPlatform).map(p => (
                  <button key={p} type="button" onClick={() => setHistoryFilter(p as PlatformKey)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${historyFilter === p ? 'bg-[#2D6A3F] text-white' : 'bg-white border border-stone-300 text-stone-700'}`}>
                    {PLATFORM_META[p as PlatformKey]?.label || p} ({stats.byPlatform[p]})
                  </button>
                ))}
                {history.length > 0 && (
                  <button type="button" onClick={clearHistory} className="ml-auto px-2.5 py-1 rounded-lg text-[11px] font-black bg-rose-50 border border-rose-200 text-rose-700 cursor-pointer">
                    مسح الكل
                  </button>
                )}
              </div>

              {filteredHistory.length === 0 ? (
                <div className="p-10 text-center rounded-2xl border-2 border-dashed border-stone-300 bg-white">
                  <BarChart3 className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                  <p className="text-sm font-black text-stone-600">لا توجد عمليات نشر بعد.</p>
                </div>
              ) : (
                filteredHistory.map(rec => (
                  <div key={rec.id} className="p-3 rounded-2xl bg-white border-2 border-stone-200">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black text-white inline-flex items-center gap-1" style={{ backgroundColor: PLATFORM_META[rec.platform]?.color || '#555' }}>
                          {PLATFORM_META[rec.platform]?.icon}
                          {PLATFORM_META[rec.platform]?.label || rec.platform}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${rec.status === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                          {rec.status === 'success' ? '✓ ناجح' : '✗ فشل'}
                        </span>
                        {rec.hasImage && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 inline-flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> صورة
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-stone-500">{timeAgo(rec.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => resendFromHistory(rec)} title="إعادة استخدام النص" className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center cursor-pointer">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(rec.text); flash('success', 'تم النسخ'); }} title="نسخ النص" className="w-7 h-7 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center cursor-pointer">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => deleteHistoryRecord(rec.id)} title="حذف" className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed line-clamp-2 whitespace-pre-wrap">{rec.text.slice(0, 220)}{rec.text.length > 220 ? '…' : ''}</p>
                    {rec.error && <p className="mt-1 text-[11px] text-rose-700 font-bold">خطأ: {rec.error}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══════════ تبويب 4: الحسابات ═══════════ */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold leading-relaxed">
                💡 <strong>نصيحة تقنية:</strong> يمكنك ربط <strong>بوت تليغرام</strong> (مجاناً عبر @BotFather) و<strong>Facebook Page Access Token</strong> لتمكين النشر الآلي بضغطة زر وبشكل مجدول دون أي تدخل يدوي.
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تم حفظ إعدادات الحسابات بنجاح!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {([
                  { k: 'facebook', label: 'رابط صفحة فيسبوك الرسمية', placeholder: 'https://facebook.com/khodra.fes' },
                  { k: 'instagram', label: 'رابط حساب إنستغرام', placeholder: 'https://instagram.com/khodra.fes' },
                  { k: 'whatsappGroup', label: 'رابط مجموعة/قناة واتساب', placeholder: 'https://chat.whatsapp.com/...' },
                  { k: 'tiktok', label: 'رابط حساب تيك توك', placeholder: 'https://tiktok.com/@khodra.fes' },
                ] as const).map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-black text-[#1A3D24] mb-1">{f.label}:</label>
                    <input type="url" dir="ltr" placeholder={f.placeholder}
                      value={(socialLinks as any)[f.k]}
                      onChange={e => setSocialLinks({ ...socialLinks, [f.k]: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-[#2D6A3F]" />
                  </div>
                ))}
              </div>

              {/* تليغرام بوت */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border-2 border-sky-200 space-y-3">
                <h4 className="text-xs font-black text-sky-900 flex items-center gap-1.5">
                  <Rocket className="w-4 h-4 text-sky-700" />
                  <span>النشر الآلي عبر Telegram Bot (اختياري)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Bot Token (من @BotFather):</label>
                    <input type="password" dir="ltr" placeholder="123456789:ABCdefGh..."
                      value={socialLinks.telegramBotToken}
                      onChange={e => setSocialLinks({ ...socialLinks, telegramBotToken: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      معرّفات القنوات (مفصولة بفواصل):
                    </label>
                    <input type="text" dir="ltr" placeholder="@channel1, -1001234567890, @channel2"
                      value={socialLinks.telegramChatIds || socialLinks.telegramChatId}
                      onChange={e => setSocialLinks({ ...socialLinks, telegramChatIds: e.target.value, telegramChatId: '' })}
                      className="w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-sky-500" />
                    <p className="mt-1 text-[10px] text-stone-500 font-semibold">يدعم قنوات متعددة في وقت واحد ✨</p>
                  </div>
                </div>
              </div>

              {/* فيسبوك Graph API */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border-2 border-blue-200 space-y-3">
                <h4 className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-blue-700" />
                  <span>النشر الآلي عبر Facebook Graph API (اختياري)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Page ID:</label>
                    <input type="text" dir="ltr" placeholder="1234567890"
                      value={socialLinks.facebookPageId}
                      onChange={e => setSocialLinks({ ...socialLinks, facebookPageId: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Page Access Token:</label>
                    <input type="password" dir="ltr" placeholder="EAAB..."
                      value={socialLinks.facebookPageToken}
                      onChange={e => setSocialLinks({ ...socialLinks, facebookPageToken: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between flex-wrap gap-2">
                <button type="button" onClick={handleSaveLinks}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] hover:from-[#3A8152] hover:to-[#2D6A3F] text-white font-black text-xs cursor-pointer shadow-sm active:scale-95 transition-all inline-flex items-center gap-2">
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>حفظ إعدادات الحسابات</span>
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-bold inline-flex items-center gap-1 hover:bg-stone-50">
                      <Share2 className="w-3 h-3 opacity-60" /> فيسبوك <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-bold inline-flex items-center gap-1 hover:bg-stone-50">
                      <Camera className="w-3 h-3 opacity-60" /> إنستغرام <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                  {socialLinks.tiktok && (
                    <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-bold inline-flex items-center gap-1 hover:bg-stone-50">
                      <Music className="w-3 h-3 opacity-60" /> تيك توك <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ═══════ الفوتر ═══════ */}
        <div className="px-4 sm:px-6 py-3 bg-white border-t border-[#E8E1D3] flex items-center justify-between gap-3 shrink-0 text-[11px] font-bold text-stone-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              محفوظ تلقائياً
            </span>
            <span className="text-stone-300">|</span>
            <span>الجدولة تعمل كل 20 ثانية</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            <span>خُضرة v2.0 — مركز النشر الذكي</span>
          </div>
        </div>

      </div>
    </div>
  );
};