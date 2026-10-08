// ============================================================
// src/features/ai-marketing/AIMarketingCenter.tsx
// مركز التسويق الذكي المتقدم — خُضرة AI Marketing Copilot
// يدمج: تحليل القوالب، توليد الأفكار، صانع الحملات، ذكاء المنتجات،
// المساعد الإداري، وسير عمل النشر الآمن مع سجلات التدقيق
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Share2,
  MessageCircle,
  TrendingUp,
  Package,
  Layers,
  Send,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  RefreshCw,
  Clock,
  Calendar,
  Check,
  ChevronLeft,
  X,
  Smartphone,
  Eye,
  Sliders,
  Flame,
  ShieldCheck,
  FileText,
  Lightbulb,
  Search,
} from 'lucide-react';
import { STORE_CONFIG } from '../../data/config';
import {
  fetchDashboardInsights,
  analyzeTemplateApi,
  generateIdeasApi,
  generateCampaignApi,
  fetchProductIntelligenceApi,
  sendCopilotChatApi,
  submitPublishQueueApi,
  fetchPublishQueueApi,
  fetchAuditLogsApi,
  type DashboardInsightsResponse,
  type CopilotChatResponse,
  type PublishQueueItem,
  type AuditLogItem,
} from './aiMarketingClient';
import type {
  TemplateAnalysisResult,
  MarketingIdea,
  GeneratedCampaign,
  ProductIntelligenceData,
} from '../../server/aiMarketingService';

// ─── القوالب المغربية المعتمدة لمتجر خُضرة ───
const MOROCCAN_TEMPLATES = [
  {
    id: 'fresh_morning',
    emoji: '🌅',
    title: 'طراوة الصباح وسوق بنسودة',
    badge: 'الأكثر استخداماً',
    body: `🌿 طراوة الصباح من سوق الجملة بنسودة لباب دارك بفاس! 🧺☀️

صباح الخير يا أهل فاس! سلعتنا اليوم منتقاة حبة بحبة على الفجر من سوق الجملة بنسودة:
• خضروات طازجة من الحقل مباشرة 🥕🥔🍅
• فواكه موسمية ممتازة 🍎🍊
• باقة قزبر ومعدنوس ونعناع بلدي هدية 🌿

🛵 التوصيل سريع حتى لباب دارك في فاس والنواحي.
💵 الدفع عند الاستلام بعد المعاينة والاطمئنان على الطراوة.
🛒 اطلب دابا وتهنى من تمارة السوق:`,
  },
  {
    id: 'family_boxes',
    emoji: '📦',
    title: 'صناديق العائلة التوفيرية',
    badge: 'توفير أسبوعي',
    body: `📦 خضرة الأسبوع كاملة فصندوق واحد واقتصادي! 🧺✨

وفّر وقتك وفلوسك مع صناديق خُضرة العائلية:
1️⃣ صندوق الأسرة الاقتصادي: أساسيات الطبخ لـ 5 أيام (بطاطس، بصل، طماطم، جزر، قرع).
2️⃣ باقة الطاجين الفاسي: خضار طرية منتقاة بعناية لطاجين مغربي أصيل.
3️⃣ صندوق الفواكه المنعش: فيتامينات طازجة لكل أفراد الأسرة.

🚚 التوصيل مجاني للطلبات فوق 250 درهم!
الدفع عند الاستلام بكل أمان.`,
  },
  {
    id: 'weekend_deals',
    emoji: '⚡',
    title: 'عروض نهاية الأسبوع والجمعة المباركة',
    badge: 'عروض الجمعة',
    body: `✨ جمعة مباركة مع باقة كسكس فاس الأصيل! 🍲🌿

خضار الكسكس السبعة واصلة طرية فجر اليوم:
• قرع أحمر بلدي معسل 🎃
• لفت أبيض وأصفر محفور 🥕
• جزر وكوسا وحمص طري
🎁 مع ربطة قزبر وكرفس مجاناً مع كل سلة كسكس!

اطلب الآن لضمان التوصيل قبل صلاة الجمعة لباب منزلك.`,
  },
  {
    id: 'b2b_restaurants',
    emoji: '🏢',
    title: 'عروض المطاعم والمقاهي B2B',
    badge: 'أسعار الجملة',
    body: `🏢 لأصحاب المطاعم، المقاهي، وسناك فاس: توريد يومي موثوق 🥬⚡

• خضار وفواكه منتقاة يومياً بأعلى معايير النظافة والجودة.
• أسعار جملة تنافسية مع فواتير رسمية وبونات تسليم.
• التوصيل الصباحي الباكر (قبل 09:30 صباحاً) لضمان انطلاق مطبخكم بسلاسة.

تواصلوا مع قسم B2B عبر الواتساب لتثبيت طلبية اليوم.`,
  },
  {
    id: 'whatsapp_status',
    emoji: '📱',
    title: 'حالة واتساب وستوري سريعة',
    badge: 'مختصر ومباشر',
    body: `🧺 خضرة اليوم طرية واصلة دابا من سوق بنسودة! 
🥔 بطاطس بلدية: 7 د.م
🍅 طماطم طازجة: 7 د.م
🧅 بصل أحمر: 6 د.م
🍊 برتقال عصير: 7.5 د.م

🛵 توصيل فوري لباب دارك بفاس · دفع عند الاستلام.
📲 أرسل طلبك دابا على الواتساب!`,
  },
];

export const AIMarketingCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'copilot' | 'analyzer' | 'generator' | 'intelligence' | 'queue'>('copilot');

  // بيانات اللوحة العامة
  const [insights, setInsights] = useState<DashboardInsightsResponse | null>(null);
  const [productIntel, setProductIntel] = useState<ProductIntelligenceData | null>(null);
  const [queueItems, setQueueItems] = useState<PublishQueueItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);

  // حالة المساعد الذكي
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; text: string; actions?: any[]; dataContext?: string }[]
  >([
    {
      role: 'assistant',
      text: 'صباح الخير والبركة سيدي المدير! 👋 أنا خُضرة AI Copilot المساعد التسويقي لمتجرك في فاس. حللت المخزون ومبيعات اليوم، والطلب مرتفع جداً على خضار الطهي اليومي. شنو تبغي نخدمو عليه دابا؟',
      actions: [
        { label: '✨ شنو خاصنا نسوقو اليوم؟', actionType: 'query', payload: 'شنو خاصنا نسوقو اليوم؟' },
        { label: '🔥 إنشاء حملة سريعة لباقة الطبخ', actionType: 'create_campaign' },
        { label: '📝 فحص قالب واتساب الصباحي', actionType: 'switch_analyzer' },
      ],
      dataContext: 'مستند إلى تحليل مخزون 100 منتج ومبيعات سوق بنسودة بفاس.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // حالة محلل القوالب
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('fresh_morning');
  const [templateInput, setTemplateInput] = useState<string>(MOROCCAN_TEMPLATES[0].body);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<TemplateAnalysisResult | null>(null);

  // حالة مولد الأفكار والحملات
  const [ideasCount, setIdeasCount] = useState<number>(5);
  const [ideasObjective, setIdeasObjective] = useState<string>('زيادة المبيعات اليومية وتنشيط السلات');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<MarketingIdea[]>([]);

  // حالة مولد الحملة المتكاملة
  const [campaignPrompt, setCampaignPrompt] = useState<string>('أريد حملة لزيادة مبيعات خضار الطهي الأساسية وباقة الطاجين هذا الأسبوع في فاس');
  const [campaignObjective, setCampaignObjective] = useState<string>('رفع المبيعات وتنشيط سلات الشراء');
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<GeneratedCampaign | null>(null);

  // إشعار النجاح / الخطأ
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleCopy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  }, []);

  // تحميل البيانات الأولية
  const loadInitialData = useCallback(async () => {
    setIsLoadingInsights(true);
    try {
      const [insightsData, intelData, queueData, logsData] = await Promise.all([
        fetchDashboardInsights(),
        fetchProductIntelligenceApi().catch(() => null),
        fetchPublishQueueApi().catch(() => []),
        fetchAuditLogsApi().catch(() => []),
      ]);
      setInsights(insightsData);
      if (intelData) setProductIntel(intelData);
      setQueueItems(queueData);
      setAuditLogs(logsData);
    } finally {
      setIsLoadingInsights(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // إرسال رسالة للمساعد
  const handleSendChat = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || isChatLoading) return;

    setChatMessages((prev) => [...prev, { role: 'user', text: query }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await sendCopilotChatApi(query);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.reply,
          actions: res.suggestedActions,
          dataContext: res.dataContext,
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'عذراً، حدث خطأ مؤقت أثناء الاتصال بنظام الذكاء الاصطناعي. يمكنك الاعتماد على التوصيات المحلية أو إعادة المحاولة.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // تنفيذ إجراء من رسائل المساعد
  const handleActionClick = (action: { label: string; actionType: string; payload?: any }) => {
    if (action.actionType === 'create_campaign') {
      setActiveTab('generator');
      if (action.payload?.category) {
        setCampaignPrompt(`حملة ترويجية لقسم ${action.payload.category} مع التوصيل السريع بفاس`);
      }
    } else if (action.actionType === 'switch_analyzer') {
      setActiveTab('analyzer');
    } else if (action.actionType === 'product_intelligence') {
      setActiveTab('intelligence');
    } else if (action.actionType === 'query' && action.payload) {
      handleSendChat(action.payload);
    }
  };

  // تحليل القالب
  const handleRunAnalysis = async () => {
    if (!templateInput.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const selectedMeta = MOROCCAN_TEMPLATES.find((t) => t.id === selectedTemplateId);
      const res = await analyzeTemplateApi(templateInput, selectedMeta?.title || 'قالب مخصص', selectedTemplateId);
      setAnalysisResult(res);
      showToast('success', `تم تحليل القالب بنجاح — النتيجة: ${res.marketingScore}/100`);
    } catch (err: any) {
      showToast('error', err?.message || 'فشل تحليل القالب');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // توليد الأفكار
  const handleGenerateIdeas = async () => {
    if (isGeneratingIdeas) return;
    setIsGeneratingIdeas(true);
    try {
      const ideas = await generateIdeasApi(ideasCount, 'all', ideasObjective);
      setGeneratedIdeas(ideas);
      showToast('success', `تم توليد ${ideas.length} أفكار تسويقية بنجاح!`);
    } catch (err: any) {
      showToast('error', err?.message || 'فشل توليد الأفكار');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // توليد الحملة المتكاملة
  const handleGenerateCampaign = async () => {
    if (!campaignPrompt.trim() || isGeneratingCampaign) return;
    setIsGeneratingCampaign(true);
    try {
      const camp = await generateCampaignApi(campaignPrompt, campaignObjective, 'all');
      setActiveCampaign(camp);
      showToast('success', `تم بناء استراتيجية الحملة بنجاح — Score: ${camp.score.overall}/100`);
    } catch (err: any) {
      showToast('error', err?.message || 'فشل إنشاء الحملة');
    } finally {
      setIsGeneratingCampaign(false);
    }
  };

  // اعتماد ونشر منشور
  const handleApprovePost = async (post: any, channel: string) => {
    try {
      const res = await submitPublishQueueApi({
        campaignId: activeCampaign?.id || 'camp-manual',
        campaignName: activeCampaign?.campaignName || 'حملة خُضرة المعتمدة',
        channel,
        postPayload: post,
        idempotencyKey: `post-${Date.now()}-${channel}`,
      });
      showToast('success', `تم اعتماد المنشور بنجاح لقناة ${channel}`);
      // تحديث طابور النشر
      const updatedQueue = await fetchPublishQueueApi();
      setQueueItems(updatedQueue);
    } catch (err: any) {
      showToast('error', err?.message || 'فشل اعتماد النشر');
    }
  };

  // زر فتح واتساب المباشر
  const handleOpenWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${STORE_CONFIG.whatsappCleanNumber}?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-right font-['Tajawal'] antialiased bg-[#FAFAF9] rounded-3xl p-3 sm:p-6 max-w-7xl mx-auto" dir="rtl">
      {/* ═══════ الترويسة الرئيسية ═══════ */}
      <header className="relative overflow-hidden bg-gradient-to-l from-[#163920] via-[#1A4527] to-[#122F1B] rounded-3xl p-5 sm:p-7 text-white shadow-md border border-emerald-900/40">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EAB308]/20 border border-[#EAB308]/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-[#EAB308]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">خُضرة AI Marketing Copilot</h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  فاس الذكية
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-300 mt-1">
                مساعد التسويق الذكي المبني خصيصاً لسوق فاس: يحلل المنتجات، يقترح الحملات، ويولد محتوى احترافي بضوابط أمان تامة.
              </p>
            </div>
          </div>

          {/* علامات تبويب المركز التسويقي */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-black/20 rounded-2xl backdrop-blur-xs no-scrollbar text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('copilot')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'copilot' ? 'bg-[#EAB308] text-[#163920] shadow-sm font-black' : 'text-stone-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>المساعد الذكي</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analyzer')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'analyzer' ? 'bg-[#EAB308] text-[#163920] shadow-sm font-black' : 'text-stone-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>محلل القوالب</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('generator')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'generator' ? 'bg-[#EAB308] text-[#163920] shadow-sm font-black' : 'text-stone-300 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>مولد الحملات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('intelligence')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'intelligence' ? 'bg-[#EAB308] text-[#163920] shadow-sm font-black' : 'text-stone-300 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>ذكاء المنتجات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'queue' ? 'bg-[#EAB308] text-[#163920] shadow-sm font-black' : 'text-stone-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>النشر والتدقيق ({queueItems.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══════ إشعار التنبيه ═══════ */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold border shadow-sm flex items-center justify-between gap-3 animate-in fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          التبويب 1: لوحة القيادة التنبؤية والمساعد الإداري (Copilot)
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'copilot' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* بطاقات المؤشرات الذكية اللحظية */}
          {insights && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {insights.insights.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-4 border transition-all ${
                    item.type === 'opportunity'
                      ? 'bg-emerald-50/80 border-emerald-200/90 text-emerald-950'
                      : item.type === 'warning'
                      ? 'bg-amber-50/80 border-amber-200/90 text-amber-950'
                      : 'bg-sky-50/80 border-sky-200/90 text-sky-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm">{item.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 shadow-2xs">
                      {item.action}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium">{item.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* محادثة المساعد الإداري الذكي */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  🤖
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-stone-900">مساعد خُضرة الإداري (Copilot)</h3>
                  <p className="text-[11px] text-stone-400">استشر الذكاء الاصطناعي حول المبيعات، التسويق، أو خطط نهاية الأسبوع</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('generator');
                  setCampaignPrompt('أنشئ حملة اليوم لأكثر المنتجات طلباً مع باقة توفير وعرض توصيل مجاني لباب المنزل بفاس');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#EAB308] hover:bg-[#d8a304] text-[#163920] font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ إنشاء حملة سريعة بضغطة زر</span>
              </button>
            </div>

            {/* سجل المحادثة */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto p-1 text-xs sm:text-sm">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 whitespace-pre-line leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-800 text-white rounded-br-xs'
                        : 'bg-stone-100 text-stone-900 rounded-bl-xs border border-stone-200/60'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* إجراءات سريعة واقتراحات مستندة على الإجابة */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {msg.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          type="button"
                          onClick={() => handleActionClick(act)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.dataContext && (
                    <span className="text-[10px] text-stone-400 mt-1 mr-1">
                      {msg.dataContext}
                    </span>
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-stone-500 text-xs p-2">
                  <span className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                  <span>الذكاء الاصطناعي يحلل بيانات المتجر وسوق بنسودة...</span>
                </div>
              )}
            </div>

            {/* حقل الإدخال */}
            <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="اسأل المساعد (مثلاً: شنو نروج اليوم؟، عطيني فكرة لرفع مبيعات الفواكه)..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => handleSendChat()}
                disabled={!chatInput.trim() || isChatLoading}
                className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">إرسال</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          التبويب 2: محلل القوالب التسويقية (AI Template Analyzer)
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'analyzer' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900">محلل القوالب التسويقية (Marketing Score)</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                اختر قالباً معتمداً أو ألصق نص منشورك ليقوم الذكاء الاصطناعي بفحصه وفق 10 معايير وتقديم نسخة محسنة لسوق فاس.
              </p>
            </div>

            {/* اختيار القالب المعتمد */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {MOROCCAN_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(tmpl.id);
                    setTemplateInput(tmpl.body);
                    setAnalysisResult(null);
                  }}
                  className={`p-2.5 rounded-2xl text-right border transition-all cursor-pointer ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-emerald-50 border-emerald-600 shadow-2xs'
                      : 'bg-stone-50 border-stone-200/80 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-lg mb-1">{tmpl.emoji}</div>
                  <div className="text-xs font-black text-stone-900 truncate">{tmpl.title}</div>
                  <div className="text-[10px] text-stone-500 truncate">{tmpl.badge}</div>
                </button>
              ))}
            </div>

            {/* محرر النص المراد فحصه */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">نص الإعلان أو المنشور المراد تحليله:</label>
              <textarea
                rows={6}
                value={templateInput}
                onChange={(e) => setTemplateInput(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-stone-200 text-xs sm:text-sm font-medium focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !templateInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'جارٍ فحص القالب بالذكاء الاصطناعي...' : '🚀 فحص القالب وحساب النتيجة'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(templateInput, 'current_template')}
                className="px-3.5 py-2 rounded-xl text-stone-600 hover:bg-stone-100 border border-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'current_template' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>نسخ النص الحالي</span>
              </button>
            </div>
          </div>

          {/* نتائج التحليل التفصيلية */}
          {analysisResult && (
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-5 sm:p-7 space-y-6 animate-in fade-in duration-300">
              {/* النتيجة الإجمالية */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-l from-emerald-50 to-teal-50/50 border border-emerald-200">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex flex-col items-center justify-center font-black shadow-md">
                    <span className="text-2xl leading-none">{analysisResult.marketingScore}</span>
                    <span className="text-[10px] text-emerald-200 font-bold">من 100</span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-950">
                      تقييم القالب: {analysisResult.marketingScore >= 85 ? 'ممتاز وعالي التحويل ⭐' : analysisResult.marketingScore >= 70 ? 'جيد مع فرص تحسين 📈' : 'يحتاج تقوية وتعديل ⚠️'}
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {analysisResult.moroccanContextNotes}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTemplateInput(analysisResult.enhancedVersion);
                    showToast('success', 'تم اعتماد النسخة المحسنة في المحرر!');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-black hover:bg-emerald-900 transition-colors cursor-pointer shrink-0"
                >
                  تطبيق النسخة المحسنة
                </button>
              </div>

              {/* تفاصيل المعايير العشرة */}
              <div>
                <h5 className="text-xs font-black text-stone-700 mb-3">تفصيل درجات المعايير التسويقية:</h5>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { label: 'قوة العنوان', val: analysisResult.criteriaScores.headline },
                    { label: 'وضوح العرض', val: analysisResult.criteriaScores.offerClarity },
                    { label: 'قوة الـ CTA', val: analysisResult.criteriaScores.ctaStrength },
                    { label: 'ملاءمة الجمهور', val: analysisResult.criteriaScores.audienceFit },
                    { label: 'جودة الصياغة', val: analysisResult.criteriaScores.copyQuality },
                    { label: 'قابلية التحويل', val: analysisResult.criteriaScores.conversionPotential },
                    { label: 'إيقاع الطول', val: analysisResult.criteriaScores.lengthPacing },
                    { label: 'وضوح المنتج', val: analysisResult.criteriaScores.productClarity },
                    { label: 'قوة القيمة', val: analysisResult.criteriaScores.offerStrength },
                    { label: 'ملاءمة التوقيت', val: analysisResult.criteriaScores.timingFit },
                  ].map((crit, idx) => (
                    <div key={idx} className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/70">
                      <div className="text-[11px] text-stone-500 font-bold mb-1 truncate">{crit.label}</div>
                      <div className="flex items-center justify-between">
                        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mr-2">
                          <div
                            className={`h-full rounded-full ${
                              crit.val >= 80 ? 'bg-emerald-600' : crit.val >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${crit.val}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-stone-800">{crit.val}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* نقاط القوة والضعف */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 space-y-2">
                  <div className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>نقاط القوة البارزة:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700">
                    {analysisResult.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 space-y-2">
                  <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>فرص التحسين والتطوير:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700">
                    {analysisResult.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600">·</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* النسخة المحسنة الجاهزة */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-stone-900">النسخة المحسنة المقترحة من خُضرة AI:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(analysisResult.enhancedVersion, 'enhanced_copy')}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'enhanced_copy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>نسخ النسخة المحسنة</span>
                  </button>
                </div>
                <div className="bg-white rounded-xl p-3.5 border border-stone-200 text-xs sm:text-sm whitespace-pre-line leading-relaxed text-stone-800 font-medium">
                  {analysisResult.enhancedVersion}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          التبويب 3: مولد الحملات والأفكار (Campaigns & Ideas)
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'generator' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* قسم مولد الأفكار السريعة */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <span>مولد الأفكار التسويقية (AI Ideas Generator)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  توليد أفكار مبنية على المنتجات الحقيقية، المخزون، والمناسبات في مدينة فاس.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {[5, 10, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setIdeasCount(num)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      ideasCount === num ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {num} أفكار
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleGenerateIdeas}
                  disabled={isGeneratingIdeas}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingIdeas ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingIdeas ? 'جارٍ التوليد...' : 'توليد الأفكار'}</span>
                </button>
              </div>
            </div>

            {/* الأفكار المولدة */}
            {generatedIdeas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {generatedIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="bg-stone-50 rounded-2xl p-4 border border-stone-200 hover:border-amber-400 transition-colors space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 mb-1">
                        <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">{idea.category}</span>
                        <span>{idea.timing}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-stone-900">{idea.title}</h4>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">{idea.description}</p>
                    </div>

                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-stone-500 font-medium">
                        المنتجات: {idea.targetProducts.slice(0, 2).join('، ')}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCampaignPrompt(`حملة: ${idea.title} — ${idea.description}`);
                          window.scrollTo({ top: 600, behavior: 'smooth' });
                        }}
                        className="text-xs font-black text-emerald-800 hover:text-emerald-950 cursor-pointer"
                      >
                        تحويل لحملة ←
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* قسم مولد الحملة المتكاملة */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>مولد الحملات الاستراتيجي (AI Campaign Generator)</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                اكتب فكرتك أو هدفك وسيقوم النظام بتصميم الاستراتيجية، واختيار المنتجات، وتوليد نصوص النشر لجميع القنوات.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">وصف أو هدف الحملة:</label>
                <textarea
                  rows={3}
                  value={campaignPrompt}
                  onChange={(e) => setCampaignPrompt(e.target.value)}
                  placeholder="مثال: أريد حملة لزيادة مبيعات الخضر هذا الأسبوع وباقة الطبخ الفاسي اليومي..."
                  className="w-full p-3.5 rounded-2xl border border-stone-200 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-600">الهدف:</span>
                  {['زيادة المبيعات', 'جذب زبائن جدد', 'تنشيط إعادة الشراء', 'ترويج باقة'].map((obj) => (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => setCampaignObjective(obj)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        campaignObjective === obj ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {obj}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateCampaign}
                  disabled={isGeneratingCampaign || !campaignPrompt.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingCampaign ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingCampaign ? 'جارٍ بناء الحملة...' : '🚀 إنشاء الحملة بالذكاء الاصطناعي'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* عرض نتائج الحملة المولدة */}
          {activeCampaign && (
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-5 sm:p-7 space-y-6 animate-in fade-in duration-300">
              {/* شريط الحملة والنتيجة */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-l from-emerald-900 to-teal-900 text-white">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">حملة معتمدة</span>
                    <span className="text-xs text-emerald-300 font-mono">ID: {activeCampaign.id}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black mt-1">{activeCampaign.campaignName}</h3>
                  <p className="text-xs text-stone-300 mt-1 max-w-2xl">{activeCampaign.strategy}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center px-4 py-2 rounded-2xl bg-white/10 border border-white/20">
                    <div className="text-2xl font-black text-[#EAB308]">{activeCampaign.score.overall}</div>
                    <div className="text-[10px] text-stone-300">Campaign Score</div>
                  </div>
                </div>
              </div>

              {/* المنتجات المستهدفة وتفاصيل العرض */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                  <div className="text-xs font-black text-stone-800">المنتجات المختارة في الحملة:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCampaign.products.map((p, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-800">
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-stone-600 mt-2">
                    <strong>الجمهور المستهدف:</strong> {activeCampaign.targetAudience}
                  </div>
                </div>

                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                  <div className="text-xs font-black text-stone-800">تفاصيل العرض الترويجي:</div>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium">
                    {activeCampaign.offerDetails}
                  </p>
                </div>
              </div>

              {/* نصوص المنشورات عبر القنوات */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-stone-900">محتوى النشر عبر القنوات (جاهز للاعتماد والمشاركة):</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCampaign.posts.map((post, pIdx) => (
                    <div
                      key={pIdx}
                      className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-stone-800 flex items-center gap-1.5">
                            {post.platform === 'whatsapp' && '📱 رسالة واتساب'}
                            {post.platform === 'instagram' && '📸 إنستغرام وفيسبوك'}
                            {post.platform === 'story' && '⚡ ستوري / حالة سريعة'}
                            {post.platform === 'product_desc' && '🛒 وصف صفحة المتجر'}
                          </span>
                          {post.suggestedTime && (
                            <span className="text-[11px] text-stone-500 font-mono">
                              ⏰ {post.suggestedTime}
                            </span>
                          )}
                        </div>

                        {post.headline && (
                          <div className="text-xs font-black text-emerald-950 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                            {post.headline}
                          </div>
                        )}

                        <div className="bg-white rounded-xl p-3 border border-stone-200 text-xs whitespace-pre-line leading-relaxed text-stone-800">
                          {post.caption}
                        </div>

                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="text-[11px] text-stone-500 font-mono">
                            {post.hashtags.join(' ')}
                          </div>
                        )}
                      </div>

                      {/* أزرار الإجراءات لكل منشور */}
                      <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(`${post.headline ? post.headline + '\n\n' : ''}${post.caption}`, `post_${pIdx}`)}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedKey === `post_${pIdx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>نسخ</span>
                          </button>

                          {post.platform === 'whatsapp' && (
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsApp(post.caption)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>فتح واتساب</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApprovePost(post, post.platform)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>اعتماد وجدولة</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* الجدول الزمني المقترح */}
              {activeCampaign.recommendedSchedule && activeCampaign.recommendedSchedule.length > 0 && (
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                  <div className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span>الجدول الزمني المقترح للتنفيذ:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {activeCampaign.recommendedSchedule.map((s, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-stone-200">
                        <div className="font-black text-emerald-900">{s.day} · {s.channel}</div>
                        <div className="text-stone-600 mt-1">{s.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          التبويب 4: ذكاء المنتجات والباقات (Product Intelligence)
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {productIntel ? (
            <>
              {/* باقات المنتجات المقترحة بالذكاء الاصطناعي */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-4 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-600" />
                    <span>اقتراحات الباقات المجمعة (Smart Bundles)</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    الذكاء الاصطناعي يحلل المنتجات الأكثر شراءً معاً ويقترح باقات ذكية ترفع متوسط قيمة السلة (AOV).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {productIntel.suggestedBundles.map((b, idx) => (
                    <div
                      key={idx}
                      className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                          <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-black">
                            {b.suggestedPrice} درهم
                          </span>
                          <span className="text-stone-400">{b.discountNote}</span>
                        </div>
                        <h4 className="text-sm font-black text-stone-900">{b.name}</h4>
                        <div className="text-xs text-stone-600 mt-2 space-y-1">
                          <strong>المكونات:</strong>
                          <ul className="list-disc list-inside text-[11px] text-stone-700">
                            {b.items.map((it, i) => (
                              <li key={i}>{it}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-xs text-stone-500 mt-2 bg-white p-2.5 rounded-xl border border-stone-200/60 leading-relaxed font-medium">
                          💡 {b.whyItWorks}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('generator');
                          setCampaignPrompt(`حملة ترويجية لـ "${b.name}" بسعر ${b.suggestedPrice} درهم مع التوصيل لباب المنزل في فاس`);
                        }}
                        className="w-full py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs transition-colors cursor-pointer text-center"
                      >
                        إنشاء حملة لهذه الباقة ←
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* المنتجات الأكثر طلباً مقابل فرص الترويج */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-4 sm:p-6 space-y-3">
                  <h4 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>المنتجات الأكثر مبيعاً (Top Sellers)</span>
                  </h4>
                  <div className="space-y-2">
                    {productIntel.topSellers.map((item, i) => (
                      <div key={i} className="bg-stone-50 p-3 rounded-2xl border border-stone-200/70 text-xs">
                        <div className="flex items-center justify-between font-black text-stone-900">
                          <span>{item.name}</span>
                          <span className="text-emerald-700">{item.price} د.م</span>
                        </div>
                        <p className="text-stone-500 mt-1 text-[11px]">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-4 sm:p-6 space-y-3">
                  <h4 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>فرص ترويجية واعدة (Promote Opportunities)</span>
                  </h4>
                  <div className="space-y-2">
                    {productIntel.promoteOpportunities.map((item, i) => (
                      <div key={i} className="bg-stone-50 p-3 rounded-2xl border border-stone-200/70 text-xs">
                        <div className="flex items-center justify-between font-black text-stone-900">
                          <span>{item.name}</span>
                          <span className="text-stone-500 font-normal">المخزون: {item.stock}</span>
                        </div>
                        <p className="text-stone-500 mt-1 text-[11px]">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-3xl text-center text-stone-400">
              جاري جلب تحليلات ذكاء المنتجات...
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          التبويب 5: طابور النشر وسجل التدقيق (Publish Queue & Audit)
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'queue' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* طابور المنشورات المعتمدة */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>طابور النشر المعتمد وضوابط الحوكمة</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  الذكاء الاصطناعي لا ينشر مباشرة بدون موافقة الإدارة، كل منشور يمر عبر التحقق والمراجعة.
                </p>
              </div>

              <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {queueItems.length} منشورات معتمدة
              </span>
            </div>

            {queueItems.length === 0 ? (
              <div className="py-10 text-center text-stone-400 text-xs">
                لا توجد منشورات في طابور النشر حالياً. يمكنك اعتماد منشورات من تبويب "مولد الحملات".
              </div>
            ) : (
              <div className="space-y-3">
                {queueItems.map((q) => (
                  <div
                    key={q.id}
                    className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-stone-900">{q.campaignName}</span>
                        <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-bold text-[10px]">
                          قناة: {q.channel}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          حالة: معتمد ✓
                        </span>
                      </div>
                      <div className="text-stone-600 line-clamp-2 max-w-2xl font-medium">
                        {q.payload?.headline || q.payload?.caption || 'محتوى معتمد'}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-1">
                        تاريخ الاعتماد: {new Date(q.approvedAt).toLocaleString('ar-MA')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(q.payload?.caption || '', q.id)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold flex items-center gap-1 cursor-pointer hover:bg-stone-100"
                      >
                        {copiedKey === q.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>نسخ</span>
                      </button>

                      {q.channel === 'whatsapp' && (
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(q.payload?.caption || '')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>إرسال واتساب</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* سجل التدقيق (Audit Trail) */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-4 sm:p-6 space-y-3">
            <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-500" />
              <span>سجل التدقيق الأمني (Audit Logs)</span>
            </h4>
            <div className="divide-y divide-stone-100 text-xs">
              {auditLogs.length === 0 ? (
                <div className="py-4 text-stone-400 text-center">لا توجد سجلات تدقيق سابقة</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-stone-600">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800">{log.action}</span>
                      <span className="text-[10px] text-stone-400 font-mono">({log.entityType})</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString('ar-MA')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
