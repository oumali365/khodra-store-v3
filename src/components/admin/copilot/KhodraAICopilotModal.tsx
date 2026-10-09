// ============================================================
// KhodraAICopilotModal.tsx – نافذة المساعد التشغيلي الذكي المستقلة
// خُضرة AI Copilot v2 — متصل بقاعدة بيانات Supabase الحية
// استعلامات لحظية لقراءة المخزون، الطلبات، والمبيعات بسوق بنسودة
// تعمل كنافذة مستقلة (Modal Dialog) متجاوبة مع كل الشاشات
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Send,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Package,
  Bike,
  DollarSign,
  Share2,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Bot,
  User,
  Zap,
} from 'lucide-react';
import {
  sendCopilotChatApi,
  fetchDashboardInsights,
  type DashboardInsightsResponse,
  type CopilotChatResponse,
} from '../../../features/ai-marketing/aiMarketingClient';
import type { AdminRoute } from '../layout/AdminPageLayout';

export interface KhodraAICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateAdmin?: (route: AdminRoute) => void;
}

export const KhodraAICopilotModal: React.FC<KhodraAICopilotModalProps> = ({
  isOpen,
  onClose,
  onNavigateAdmin,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [insights, setInsights] = useState<DashboardInsightsResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<
    {
      role: 'user' | 'assistant';
      text: string;
      actions?: { label: string; actionType: string; payload?: any }[];
      dataContext?: string;
      toolsExecuted?: {
        toolName: string;
        source: string;
        summary: string;
        isRealData: boolean;
        data?: any;
      }[];
      isRealData?: boolean;
    }[]
  >([
    {
      role: 'assistant',
      text: `مرحباً بك سيدي المدير في Khodra AI Copilot v2 🌿

أنا مساعدك التشغيلي الذكي المتصل مباشرة بقاعدة بيانات Supabase لمتجر خُضرة فاس، مع تطبيق نظام الأدوات الحية (Tool-Based Architecture) ووضع القراءة فقط الصارم (Read-Only) لحماية بيانات المتجر.

يمكنك سؤالي بحرية عن:
1. 📦 المخزون اللحظي والسلع الناقصة أو غير المتوفرة.
2. 🛵 حالة الطلبات والطلبات المعلقة (pending) وربطها بالمناطق.
3. 💰 ملخص المبيعات والإيرادات الدقيقة ومتوسط السلة اليوم وهاد الأسبوع.
4. 📋 سجل وتدقيق حركات المخزون (inventory_ledger).
5. 📢 اقتراحات تسويقية مبنية على وفرة المخزون والطلب الفعلي بسوق بنسودة.

كيف يمكنني مساعدتك الآن؟`,
      actions: [
        { label: '📦 واش كاين شي خصاص فالمخزون؟', actionType: 'query', payload: 'واش كاين شي خصاص فالمخزون؟' },
        { label: '💰 ملخص مبيعات اليوم وهاد الأسبوع', actionType: 'query', payload: 'عطيني ملخص مبيعات اليوم وهاد الأسبوع مع إجمالي الإيرادات' },
        { label: '🛵 الطلبات اللي باقين pending', actionType: 'query', payload: 'شنو هما الطلبات اللي باقين pending وبحاجة متابعة فورية؟' },
        { label: '📋 آخر حركات وتعديلات المخزون', actionType: 'query', payload: 'شنو هما آخر حركات وتعديلات المخزون في السجل inventory_ledger؟' },
      ],
      dataContext: 'متصل مباشرة بـ Supabase • وضع القراءة فقط الآمن (Read-Only) • سوق بنسودة فاس',
      isRealData: true,
    },
  ]);

  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [expandedToolIndex, setExpandedToolIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // قفل التمرير بالخلفية عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // إغلاق عبر مفتاح Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // جلب الرؤى الذكية اللحظية عند الفتح
  useEffect(() => {
    if (isOpen && !insights) {
      fetchDashboardInsights()
        .then((data) => setInsights(data))
        .catch(() => {});
    }
  }, [isOpen, insights]);

  // التمرير لأسفل عند وصول رسالة جديدة
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, isOpen]);

  // التركيز على حقل الإدخال عند الفتح
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSendChat = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || isChatLoading) return;

    const newHistory = [
      ...chatMessages.slice(-6).map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        text: m.text,
      })),
    ];

    setChatMessages((prev) => [...prev, { role: 'user', text: query }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await sendCopilotChatApi(query, newHistory);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.reply,
          actions: res.suggestedActions,
          dataContext: res.dataContext,
          toolsExecuted: res.toolsExecuted,
          isRealData: res.isRealData,
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'تعذر الاتصال بالخادم مؤقتاً، يرجى المحاولة بعد قليل أو فحص البيانات مباشرة في اللوحة المعنية.',
          actions: [
            { label: '📦 فحص المخزون الحالي', actionType: 'view_inventory' },
            { label: '🛵 فحص الطلبات الواردة', actionType: 'view_orders' },
          ],
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleActionClick = (action: { label: string; actionType: string; payload?: any }) => {
    if (action.actionType === 'query' && action.payload) {
      handleSendChat(action.payload);
    } else if (action.actionType === 'view_orders') {
      onClose();
      if (onNavigateAdmin) {
        onNavigateAdmin('orders');
      } else {
        window.history.pushState({ admin: 'orders' }, '', '/admin/orders');
        window.dispatchEvent(new CustomEvent('khodra_admin_route_changed', { detail: 'orders' }));
      }
    } else if (action.actionType === 'view_inventory' || action.actionType === 'open_inventory') {
      onClose();
      if (onNavigateAdmin) {
        onNavigateAdmin('inventory');
      } else {
        window.history.pushState({ admin: 'inventory' }, '', '/admin/inventory');
        window.dispatchEvent(new CustomEvent('khodra_admin_route_changed', { detail: 'inventory' }));
      }
    } else if (action.actionType === 'view_pricing') {
      onClose();
      if (onNavigateAdmin) {
        onNavigateAdmin('pricing');
      } else {
        window.history.pushState({ admin: 'pricing' }, '', '/admin/pricing');
        window.dispatchEvent(new CustomEvent('khodra_admin_route_changed', { detail: 'pricing' }));
      }
    } else if (action.actionType === 'switch_publisher' || action.actionType === 'use_template') {
      onClose();
      if (onNavigateAdmin) {
        onNavigateAdmin('marketing');
      } else {
        window.history.pushState({ admin: 'marketing' }, '', '/admin/marketing');
        window.dispatchEvent(new CustomEvent('khodra_admin_route_changed', { detail: 'marketing' }));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="خُضرة AI Copilot"
      dir="rtl"
    >
      {/* خلفية معتمة مع ضبابية */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* نافذة المودال المستقلة */}
      <div
        className={`relative bg-[#090D10] text-stone-100 w-full ${
          isMaximized
            ? 'h-[98vh] max-w-[98vw] rounded-2xl'
            : 'max-w-4xl h-[92vh] sm:h-[88vh] rounded-3xl'
        } border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden transition-all duration-200 z-10`}
      >
        {/* ═══════ الرأس العلوي لنافذة Copilot ═══════ */}
        <header className="p-3.5 sm:p-4 bg-gradient-to-l from-[#042d2a] via-[#073631] to-[#041d1a] border-b border-cyan-500/40 text-white flex items-center justify-between gap-3 shrink-0 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-teal-500/10 border border-cyan-400/60 flex items-center justify-center shadow-inner shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5 font-['Almarai']">
                  <span>خُضرة AI Copilot v2</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/40 font-mono">
                    Tool-Based
                  </span>
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Supabase Live
                </span>
              </div>
              <p className="text-[11px] text-cyan-100/70 truncate mt-0.5 font-medium">
                المساعد التشغيلي الذكي لمتجر خُضرة • قراءة المخزون، المبيعات، والطلبات بسوق فاس
              </p>
            </div>
          </div>

          {/* أزرار التحكم بالنافذة */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white/10 text-cyan-200 border border-cyan-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>Read-Only آمن</span>
            </div>

            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isMaximized ? 'استعادة الحجم' : 'تكبير النافذة'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/50 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق النافذة"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ═══════ شريط المؤشرات الذكية اللحظية ═══════ */}
        {insights && insights.insights && insights.insights.length > 0 && (
          <div className="bg-[#0b171c] border-b border-cyan-950 px-3 sm:px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-300" />
              <span>رؤى المتجر:</span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {insights.insights.slice(0, 3).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChat(item.description)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                    item.type === 'opportunity'
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                      : item.type === 'warning'
                      ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                      : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
                  }`}
                >
                  <span>{item.title}</span>
                  <span className="text-[9px] bg-white/10 px-1.5 py-0.2 rounded-md font-mono">
                    {item.action}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ شريط الاستفسارات السريعة (Quick Chips) ═══════ */}
        <div className="bg-[#0d1e22]/60 border-b border-cyan-900/30 px-3 sm:px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-stone-400 shrink-0">استفسارات بنقرة واحدة:</span>
          {[
            { label: '📦 خصاص المخزون', q: 'واش كاين شي خصاص فالمخزون حالياً؟' },
            { label: '💰 مبيعات اليوم والأسبوع', q: 'عطيني ملخص مبيعات اليوم وهاد الأسبوع مع إجمالي الإيرادات' },
            { label: '🛵 طلبات pending', q: 'شنو هما الطلبات اللي باقين pending وبحاجة متابعة فورية؟' },
            { label: '📋 آخر حركات السجل', q: 'شنو هما آخر حركات وتعديلات المخزون في السجل inventory_ledger؟' },
            { label: '🌿 أكثر الخضر توفراً', q: 'شنو هما أكثر الخضار والفواكه المتوفرة حالياً بالأسعار؟' },
            { label: '📢 اقتراح ترويج اليوم', q: 'شنو خاصنا نسوقو اليوم بناءً على المخزون الوفير بسوق بنسودة؟' },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isChatLoading}
              onClick={() => handleSendChat(chip.q)}
              className="px-2.5 py-1 rounded-xl bg-[#14292e] hover:bg-[#1a383f] text-cyan-100 hover:text-white border border-cyan-700/40 text-[11px] font-bold transition-all shrink-0 cursor-pointer disabled:opacity-40 active:scale-95 shadow-2xs"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* ═══════ مساحة المحادثة والرسائل ═══════ */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 text-xs sm:text-sm select-text">
          {chatMessages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={i}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/30 border border-cyan-400/50 flex items-center justify-center shrink-0 text-cyan-300">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 leading-relaxed shadow-md ${
                    isUser
                      ? 'bg-gradient-to-l from-emerald-800 to-green-900 text-white rounded-br-xs border border-emerald-600/40'
                      : 'bg-[#101b20] text-stone-100 rounded-bl-xs border border-cyan-800/40'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.text}</p>

                  {/* سياق البيانات وبيان الاتصال الحقيقي */}
                  {msg.dataContext && (
                    <div className="mt-2.5 pt-2 border-t border-cyan-900/50 flex items-center gap-1.5 text-[10px] text-cyan-300/80 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{msg.dataContext}</span>
                    </div>
                  )}

                  {/* الأدوات المنفذة لقراءة البيانات الحية */}
                  {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-cyan-900/50 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold">
                        <span className="flex items-center gap-1 text-cyan-300">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>الأدوات المنفذة ({msg.toolsExecuted.length}):</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedToolIndex(expandedToolIndex === i ? null : i)}
                          className="text-cyan-400 hover:text-cyan-200 cursor-pointer flex items-center gap-0.5"
                        >
                          <span>{expandedToolIndex === i ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</span>
                          {expandedToolIndex === i ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {expandedToolIndex === i && (
                        <div className="space-y-1 pt-1">
                          {msg.toolsExecuted.map((tool, tIdx) => (
                            <div
                              key={tIdx}
                              className="bg-[#081215] p-2 rounded-xl border border-cyan-900/50 text-[10px] font-mono text-cyan-200"
                            >
                              <div className="flex items-center justify-between font-bold text-white">
                                <span>🛠️ {tool.toolName}</span>
                                <span className="text-emerald-400">بيانات Supabase حية ✓</span>
                              </div>
                              <p className="text-stone-300 mt-0.5">{tool.summary}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* الإجراءات المقترحة بنقرة واحدة */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-cyan-900/50 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          type="button"
                          onClick={() => handleActionClick(act)}
                          className="px-2.5 py-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 hover:text-white border border-cyan-600/50 text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* مؤشر التحميل */}
          {isChatLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center shrink-0 text-cyan-300 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#101b20] text-cyan-300 rounded-2xl rounded-bl-xs p-3.5 border border-cyan-800/40 text-xs flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>جارٍ فحص بيانات Supabase والإجابة بدقة...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ═══════ حقل إدخال الرسالة السفلي ═══════ */}
        <div className="p-3 sm:p-4 bg-[#081215] border-t border-cyan-900/50 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اسأل المساعد الذكي عن المخزون، الطلبات، المبيعات، أو خطط التسويق..."
              disabled={isChatLoading}
              className="flex-1 bg-[#101b20] border-2 border-cyan-900/60 focus:border-cyan-400 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-stone-400 outline-none transition-all disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-l from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">إرسال</span>
            </button>
          </form>

          <div className="flex items-center justify-between mt-2 text-[10px] text-stone-400 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>اتصال آمن ومباشر بقاعدة البيانات • وضع القراءة فقط</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setChatMessages((prev) => [prev[0]]);
              }}
              className="hover:text-stone-200 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>مسح المحادثة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
