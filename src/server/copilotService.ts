// ============================================================
// src/server/copilotService.ts
// محرك Khodra AI Copilot v2 — المساعد التشغيلي الذكي
// المرحلة 2: Intelligent Question Understanding & Tool Routing
// تصنيف النوايا، دعم الأسئلة المركبة والمقارنات، إدارة القيود، ومنع الاختلاق
// ============================================================

import { getGeminiClient, GEMINI_MODEL } from './geminiClient';
import {
  COPILOT_FUNCTION_DECLARATIONS,
  dispatchCopilotTool,
  ToolExecutionResult,
  executeGetInventory,
  executeGetSalesSummary,
  executeGetOrders,
  executeGetProducts,
  executeGetInventoryMovements,
  executeGetStoreInfo,
} from './copilotTools';

export interface CopilotChatHistoryMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CopilotAction {
  label: string;
  actionType: string;
  payload?: any;
}

export type QuestionIntent =
  | 'ambiguous_clarification'
  | 'schema_limitation'
  | 'sales_comparison'
  | 'compound_multi_tool'
  | 'products_pricing'
  | 'inventory_health'
  | 'orders_tracking'
  | 'sales_period'
  | 'inventory_movements'
  | 'store_info'
  | 'general_advice';

export interface CopilotMetadata {
  intent: QuestionIntent;
  dataSource: 'supabase_live' | 'store_config' | 'none' | 'unavailable' | 'error';
  timePeriodAnalyzed?: string;
  limitations?: string[];
  toolsCount: number;
  isRealData: boolean;
  status: 'success' | 'empty' | 'error' | 'not_configured' | 'general' | 'needs_clarification';
}

export interface CopilotResponse {
  reply: string;
  toolsExecuted: {
    toolName: string;
    source: string;
    status?: string;
    summary: string;
    isRealData: boolean;
    data?: any;
    errorMessage?: string;
  }[];
  suggestedActions: CopilotAction[];
  dataContext: string;
  isRealData: boolean;
  modelUsed: string;
  metadata?: CopilotMetadata;
}

// ────────────────────────────────────────────────────────────
// التعليمات النظامية الموسعة لنموذج الذكاء الاصطناعي (Gemini)
// ────────────────────────────────────────────────────────────
const COPILOT_SYSTEM_INSTRUCTION = `
أنت "خُضرة AI Copilot v2" — المساعد التشغيلي والإداري الذكي الرسمي لمنصة "خُضرة — فاس" (Khodra Fès).
أنت شريك حقيقي لمدير المتجر وفريق العمليات في مدينة فاس والمغرب.

القواعد الصارمة والإلزامية لنزاهة البيانات والمصداقية (Phase 2):
1. 🔒 وضع القراءة فقط والأمان (Read-Only Security):
   أنت في وضع القراءة والتحليل فقط. لا يمكنك أبداً إجراء تعديلات مباشرة أو حذف أو إضافة على المنتجات أو المخزون أو الطلبات.

2. 🧠 فهم وتصنيف نية المستخدم واستدعاء الأدوات المناسبة (Intent & Tool Routing):
   يجب أن تصنف كل سؤال بدقة وتستدعي الأداة المناسبة:
   - المنتجات والأسعار والتوافر: استدعِ get_products (مثل البحث بالاسم أو الفئة أو التوفر).
   - المخزون وإعادة التوريد: استدعِ get_inventory (لحساب الكميات، النواقص، وقائمة التوريد من سوق بنسودة).
   - الطلبات وحالاتها: استدعِ get_orders (للطلبات الجديدة pending، المجهزة، المسلمة، والملغية).
   - المبيعات والإيرادات: استدعِ get_sales_summary مع تحديد الفترة (today, yesterday, last_7_days, this_month).
   - المقارنة بين فترتين: استدعِ get_sales_summary مرتين (الفترة الأولى والثانية) وقارن بينهما بوضوح.
   - الأسئلة المركبة: استدعِ كل الأدوات الضرورية فقط (مثل get_sales_summary لمعرفة الأكثر مبيعاً + get_inventory لفحص مخزونها اللحظي) وادمج النتائج دون تضارب.
   - حركات المخزون والتدقيق: استدعِ get_inventory_movements.
   - سياسات ومناطق المتجر: استدعِ get_store_info.

3. ⚠️ حدود المخطط والبيانات (Schema Limitations):
   - لا تدّعِ أبداً إمكانية حساب "الربح الصافي (Net Profit)"، لأن جدول الطلبات يسجل سعر البيع الإجمالي ومصاريف التوصيل، بينما تكلفة شراء السلع بالجملة (COGS) ومصاريف الوقود ورواتب السائقين غير متوفرة في قاعدة البيانات الحالية. صرّح بهذه الحدود بشفافية كاملة وقدم الإيرادات المؤكدة المتاحة فقط.
   - لا تخلط بين عدد الطلبات وإجمالي المبيعات، ولا تخلط الطلبات الملغاة أو قيد الإنجاز بالإيرادات المؤكدة للطلبات المسلمة.

4. ❓ الأسئلة الغامضة (Ambiguity):
   إذا كان السؤال مقتضباً أو غامضاً جداً (مثل "شحال؟" أو "تقرير" أو "قارن")، فاطلب توضيحاً بلطف وحدد الخيارات المتاحة.

5. 🌿 الإجابات الإرشادية العامة:
   إذا كان السؤال عن نصائح تخزين أو حفظ الخضر دون الحاجة لبيانات المتجر، قدم نصائح عملية مفيدة ووضّح أنها إرشادات عامة وليست مبنية على بيانات مخزون حية.

6. 🚫 منع اختلاق البيانات منعاً باتاً (Zero Hallucinations):
   لا تخترع أي أرقام، وفي حال فشل الاتصال بقاعدة البيانات، صرّح بالخطأ بوضوح ولا تستبدله بأصفار أو تخمينات.
`;

// ────────────────────────────────────────────────────────────
// دالة تصنيف نية السؤال بدقة (Question Intent Classifier)
// ────────────────────────────────────────────────────────────
export function classifyQuestionIntent(userMessage: string): QuestionIntent {
  const trimmed = userMessage.trim();
  const q = trimmed.toLowerCase();

  // 1. الأسئلة الغامضة جداً التي تحتاج توضيحاً
  if (
    trimmed.length <= 15 &&
    (q === 'شحال' ||
      q === 'شحال؟' ||
      q === 'شحال كاين' ||
      q === 'شحال كاين؟' ||
      q === 'تقرير' ||
      q === 'عطيني تقرير' ||
      q === 'قارن' ||
      q === 'قارن؟' ||
      q === 'مقارنة' ||
      q === 'الوضعية' ||
      q === 'الوضع دابا' ||
      q === 'شنو كاين')
  ) {
    return 'ambiguous_clarification';
  }

  // 2. الأسئلة التي تتطلب بيانات غير موجودة في المخطط (الربح الصافي، تكاليف الشراء، مصاريف الوقود)
  if (
    q.includes('ربح صافي') ||
    q.includes('الربح الصافي') ||
    q.includes('صافي الأرباح') ||
    q.includes('صافي الربح') ||
    q.includes('net profit') ||
    q.includes('تكلفة الشراء') ||
    q.includes('رأس مال السلعة') ||
    q.includes('سعر الشراء من الفلاح') ||
    q.includes('cogs') ||
    q.includes('مصاريف الديزل') ||
    q.includes('مصاريف الوقود') ||
    q.includes('رواتب السائقين') ||
    q.includes('مصاريف التشغيل')
  ) {
    return 'schema_limitation';
  }

  // 3. المقارنة بين فترتين
  if (
    (q.includes('قارن') || q.includes('مقارنة') || q.includes('انخفض أداؤها') || q.includes('مقارنة بالفترة')) &&
    (q.includes('مبيعات') ||
      q.includes('أمس') ||
      q.includes('البارح') ||
      q.includes('اليوم') ||
      q.includes('أسبوع') ||
      q.includes('سيمانة') ||
      q.includes('شهر') ||
      q.includes('فترة'))
  ) {
    return 'sales_comparison';
  }

  // 4. الأسئلة المركبة (تتطلب أكثر من أداة: مبيعات + مخزون، أو توريد + أسعار، إلخ)
  const isTopSellers = q.includes('أكثر مبيع') || q.includes('الأكثر مبيع') || q.includes('top selling') || q.includes('أكثر طلباً');
  const isStockCheck = q.includes('مخزون') || q.includes('متوفر') || q.includes('ستوك') || q.includes('كافي') || q.includes('نافد');
  const isReorderCheck = q.includes('إعادة التوريد') || q.includes('إعادة توريد') || q.includes('الناقصة') || q.includes('نقص');
  const isPriceCheck = q.includes('سعر') || q.includes('أسعار') || q.includes('أثمنة') || q.includes('ثمن');
  const isPendingOrders = q.includes('طلبات جديدة') || q.includes('pending') || q.includes('معلقة');

  if ((isTopSellers && isStockCheck) || (isReorderCheck && isPriceCheck) || (isPendingOrders && isStockCheck)) {
    return 'compound_multi_tool';
  }

  // 5. الأسئلة الإرشادية العامة
  if (
    (q.includes('كيفاش نحافظ') ||
      q.includes('كيف أحافظ') ||
      q.includes('طريقة تخزين') ||
      q.includes('تخزين') ||
      q.includes('تغليف') ||
      q.includes('نصيحة') ||
      q.includes('نصائح') ||
      q.includes('طراوة')) &&
    (q.includes('ورقية') ||
      q.includes('نعناع') ||
      q.includes('قزبر') ||
      q.includes('معدنوس') ||
      q.includes('خضار') ||
      q.includes('خضر') ||
      q.includes('فواكه') ||
      q.includes('محل'))
  ) {
    return 'general_advice';
  }

  // 6. حركات وتدقيق المخزون
  if (
    q.includes('حركات') ||
    q.includes('حركة') ||
    q.includes('ledger') ||
    q.includes('سجل التدقيق') ||
    q.includes('تعديل المخزون') ||
    q.includes('سجل الحركات') ||
    q.includes('خصم المخزون')
  ) {
    return 'inventory_movements';
  }

  // 7. المخزون والكميات وإعادة التوريد
  if (
    q.includes('مخزون') ||
    q.includes('ستوك') ||
    q.includes('stock') ||
    q.includes('إعادة التوريد') ||
    q.includes('إعادة توريد') ||
    q.includes('توريد') ||
    q.includes('خصاص') ||
    q.includes('ناقص') ||
    q.includes('نفاد') ||
    q.includes('سالا') ||
    q.includes('تقاضى') ||
    q.includes('شحال بقى')
  ) {
    return 'inventory_health';
  }

  // 8. المبيعات والإيرادات
  if (
    q.includes('مبيعات') ||
    q.includes('إيرادات') ||
    q.includes('شحال دخلنا') ||
    q.includes('دخل') ||
    q.includes('أرباح') ||
    q.includes('فلوس') ||
    q.includes('sales') ||
    q.includes('revenue') ||
    q.includes('متوسط السلة') ||
    q.includes('ملخص اليوم')
  ) {
    return 'sales_period';
  }

  // 9. الطلبات والتوصيل
  if (
    q.includes('طلب') ||
    q.includes('طلبات') ||
    q.includes('orders') ||
    q.includes('pending') ||
    q.includes('كوموند') ||
    q.includes('قيد الانتظار') ||
    q.includes('مجهزة') ||
    q.includes('مسلمة') ||
    q.includes('توصيل') ||
    q.includes('livraison')
  ) {
    return 'orders_tracking';
  }

  // 10. المنتجات والأسعار وتعداد الكتالوج
  if (
    q.includes('كم عدد المنتجات') ||
    q.includes('عدد المنتجات') ||
    q.includes('منتجات متوفرة') ||
    q.includes('أثمنة') ||
    q.includes('أسعار') ||
    q.includes('سعر') ||
    q.includes('ثمن') ||
    q.includes('خضار') ||
    q.includes('فواكه') ||
    q.includes('طماطم') ||
    q.includes('بطاطس') ||
    q.includes('بصل') ||
    q.includes('جزر') ||
    q.includes('كتالوج')
  ) {
    return 'products_pricing';
  }

  // 11. معلومات وسياسات المتجر
  if (
    q.includes('مناطق التوصيل') ||
    q.includes('فاس') ||
    q.includes('شروط التوصيل') ||
    q.includes('التوصيل بالمجان') ||
    q.includes('الحد الأدنى للطلب') ||
    q.includes('أوقات العمل') ||
    q.includes('طرق الدفع')
  ) {
    return 'store_info';
  }

  return 'store_info';
}

// ────────────────────────────────────────────────────────────
// دالة استخراج الفترة الزمنية من نص السؤال
// ────────────────────────────────────────────────────────────
function extractSalesPeriod(text: string): {
  period: 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'all_time';
  label: string;
} {
  const q = text.toLowerCase();
  if (q.includes('أمس') || q.includes('البارح') || q.includes('yesterday')) {
    return { period: 'yesterday', label: 'أمس' };
  }
  if (
    q.includes('آخر 7 أيام') ||
    q.includes('هاد السيمانة') ||
    q.includes('هذا الأسبوع') ||
    q.includes('أسبوع') ||
    q.includes('سيمانة')
  ) {
    return { period: 'last_7_days', label: 'آخر 7 أيام' };
  }
  if (q.includes('هذا الشهر') || q.includes('هاد الشهر') || q.includes('شهر') || q.includes('this month')) {
    return { period: 'this_month', label: 'هذا الشهر' };
  }
  if (q.includes('كامل الفترة') || q.includes('كلشي') || q.includes('all time') || q.includes('تاريخ المتجر')) {
    return { period: 'all_time', label: 'جميع الفترات' };
  }
  return { period: 'today', label: 'اليوم' };
}

/**
 * محرك المحادثة الرئيسي لـ Copilot v2
 */
export async function executeCopilotChat(
  userMessage: string,
  history: CopilotChatHistoryMessage[] = []
): Promise<CopilotResponse> {
  const gemini = getGeminiClient();
  const toolsExecuted: ToolExecutionResult[] = [];
  const detectedIntent = classifyQuestionIntent(userMessage);

  // إذا كان السؤال غامضاً جداً، نقوم بالرد التوجيهي المباشر لطلب التوضيح دون إهدار مكالمات Gemini
  if (detectedIntent === 'ambiguous_clarification') {
    return handleAmbiguousQuestion(userMessage);
  }

  // إذا كان عميل Gemini متاحاً، ننفذ دورة Function Calling مع مهلة أمان
  if (gemini) {
    try {
      const contents: any[] = [];
      const recentHistory = history.slice(-4);
      for (const h of recentHistory) {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }],
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const timeoutMs = 6000;
      const generateWithTimeout = (callOptions: any) =>
        Promise.race([
          gemini.models.generateContent(callOptions),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API call timed out after 6s')), timeoutMs)
          ),
        ]) as Promise<any>;

      const response = await generateWithTimeout({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: COPILOT_SYSTEM_INSTRUCTION,
          temperature: 0.2,
          tools: [{ functionDeclarations: COPILOT_FUNCTION_DECLARATIONS }],
        },
      });

      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const toolResponses = await Promise.all(
          functionCalls.map(async (call: any) => {
            const result = await dispatchCopilotTool(call.name, call.args);
            toolsExecuted.push(result);
            return {
              name: call.name,
              response: result.data,
            };
          })
        );

        const candidateContent = response.candidates?.[0]?.content;
        const toolFollowUpContents = [
          ...contents,
          candidateContent || {
            role: 'model',
            parts: functionCalls.map((fc: any) => ({
              functionCall: { name: fc.name, args: fc.args },
            })),
          },
          {
            role: 'user',
            parts: toolResponses.map((tr) => ({
              functionResponse: {
                name: tr.name,
                response: tr.response,
              },
            })),
          },
        ];

        const finalGen = await generateWithTimeout({
          model: GEMINI_MODEL,
          contents: toolFollowUpContents,
          config: {
            systemInstruction: COPILOT_SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        });

        const replyText = finalGen.text || 'تم فحص بيانات المتجر بنجاح.';
        const actions = extractSuggestedActions(userMessage, toolsExecuted);
        const hasRealData = toolsExecuted.some(
          (t) => t.isRealData === true && t.source === 'supabase_live' && t.status === 'success'
        );

        const metadata = buildResponseMetadata(detectedIntent, toolsExecuted, userMessage);

        return {
          reply: replyText,
          toolsExecuted: toolsExecuted.map((t) => ({
            toolName: t.toolName,
            source: t.source,
            status: t.status,
            summary: t.summary,
            isRealData: t.isRealData,
            data: t.data,
            errorMessage: t.errorMessage,
          })),
          suggestedActions: actions,
          dataContext: buildDataContextSummary(toolsExecuted),
          isRealData: hasRealData,
          modelUsed: GEMINI_MODEL,
          metadata,
        };
      }

      if (response.text) {
        return {
          reply: response.text,
          toolsExecuted: [],
          suggestedActions: extractSuggestedActions(userMessage, []),
          dataContext: 'إجابة إرشادية عامة (لم يتم استعلام بيانات المتجر الفعلية).',
          isRealData: false,
          modelUsed: GEMINI_MODEL,
          metadata: {
            intent: detectedIntent,
            dataSource: 'none',
            toolsCount: 0,
            isRealData: false,
            status: 'general',
            limitations: ['إجابة استشارية عامة لا ترتبط ببيانات المخزون اللحظية.'],
          },
        };
      }
    } catch (err) {
      console.warn('[CopilotService] Gemini execution fallback:', err);
    }
  }

  // في حال تعذر Gemini أو انقضاء مهلته، يتولى المحرك الحتمي المتقدم المعالجة
  return await executeDeterministicCopilot(userMessage);
}

// ────────────────────────────────────────────────────────────
// معالجة الأسئلة الغامضة لطلب التوضيح (Ambiguity Handler)
// ────────────────────────────────────────────────────────────
function handleAmbiguousQuestion(userMessage: string): CopilotResponse {
  const reply = `❓ **سؤالك يحتاج إلى توضيح أكثر سيدي المدير:**\n\nلقد استلمت استفسارك ("${userMessage}")، ولكي أزودك بأرقام وإحصائيات دقيقة وحقيقية من النظام، يرجى تحديد المجال المطلوب:\n\n1. 💰 **المبيعات والإيرادات:** هل تقصد مبيعات اليوم، مبيعات أمس، أم إجمالي الأسبوع بالدرهم؟\n2. 📦 **المخزون وإعادة التوريد:** هل تود فحص السلع الناقصة لبرمجتها من سوق بنسودة فجر الغد؟\n3. 🛵 **الطلبات والتوصيل:** هل تريد متابعة الطلبات الجديدة المعلقة (pending) وحالات السائقين؟\n4. 💵 **أسعار الكتالوج:** هل تبحث عن سعر أو توفر صنف خضار أو فاكهة محدد؟`;

  const actions: CopilotAction[] = [
    { label: '💰 مبيعات اليوم', actionType: 'view_sales' },
    { label: '📦 فحص المخزون والنواقص', actionType: 'view_inventory' },
    { label: '🛵 الطلبات قيد الانتظار', actionType: 'view_orders' },
  ];

  return {
    reply,
    toolsExecuted: [],
    suggestedActions: actions,
    dataContext: 'طلب توضيح (سؤال مقتضب يحتاج تحديد مجال الاستعلام).',
    isRealData: false,
    modelUsed: 'khodra-clarification-router',
    metadata: {
      intent: 'ambiguous_clarification',
      dataSource: 'none',
      toolsCount: 0,
      isRealData: false,
      status: 'needs_clarification',
      limitations: ['السؤال مقتضب ولا يحتوي على مؤشرات أو فترات زمنية كافية لتنفيذ استعلام دقيق.'],
    },
  };
}

/**
 * المحرك الحتمي الذكي الشامل:
 * يصنف السؤال بدقة، يستدعي الأدوات المطلوبة، ويدعم الأسئلة المركبة والمقارنات
 */
async function executeDeterministicCopilot(userMessage: string): Promise<CopilotResponse> {
  const intent = classifyQuestionIntent(userMessage);
  const toolsExecuted: ToolExecutionResult[] = [];
  let reply = '';
  const actions: CopilotAction[] = [];
  let limitations: string[] = [];
  let timePeriodLabel = 'اليوم';

  switch (intent) {
    // ══════════════════════════════════════════════════════════
    // 1️⃣ أسئلة تتطلب بيانات غير متوفرة في المخطط (Schema Limitation)
    // ══════════════════════════════════════════════════════════
    case 'schema_limitation': {
      const sales = await executeGetSalesSummary({ period: 'today' });
      toolsExecuted.push(sales);
      limitations = [
        'جدول الطلبات يسجل إجمالي البيع ومصاريف التوصيل، بينما تكاليف الشراء بالجملة (COGS) ومصاريف الوقود ورواتب السائقين غير مسجلة في المخطط.',
        'لا يمكن احتساب صافي الربح (Net Profit) بدقة تجنباً لاختلاق بيانات غير مؤكدة.',
      ];

      reply = `⚠️ **تنبيه الشفافية وحدود بيانات النظام (Schema Boundaries):**\n\n`;
      reply += `تعتمد منصة خُضرة على الشفافية التامة؛ جدول الطلبات \`orders\` في قاعدة البيانات يسجل بدقة:\n`;
      reply += `• إجمالي قيمة السلة للزبون (\`total\`)\n`;
      reply += `• مصاريف التوصيل (\`delivery_fee\`)\n`;
      reply += `• حالة الطلب (مسلم، قيد الانتظار، ملغي)\n\n`;
      reply += `🚫 **البيانات غير المتوفرة في المخطط الحالي:**\n`;
      reply += `تكلفة شراء السلع بالجملة من الفلاحين أو سوق بنسودة (COGS)، ومصاريف استهلاك الوقود للمركبات، ورواتب الموزعين **غير مسجلة في جداول قاعدة البيانات الحالية**.\n\n`;
      reply += `لذا، **لا يمكن احتساب صافي الربح (Net Profit)** أو هامش الربح الحقيقي بدقة في هذه المرحلة، والتزاماً بنزاهة المنصة، لن نختلق أي تقديرات غير مؤكدة.\n\n`;

      if (sales.status === 'success') {
        const d = sales.data;
        reply += `📊 **البيانات المتاحة والمؤكدة لـ (${d.period}):**\n`;
        reply += `• إجمالي الإيرادات المؤكدة (الطلبات المسلمة): **${d.delivered_revenue_dh} درهم** (${d.delivered_orders_count} طلب مسلّم)\n`;
        reply += `• طلبات قيد الإنجاز: **${d.pending_orders_count} طلب** بقيمة محتملة: **${d.pending_potential_revenue_dh} درهم**\n`;
      } else if (sales.status === 'empty') {
        reply += `ℹ️ *لا توجد طلبات مسجلة اليوم لحساب الإيرادات المتاحة.*`;
      } else {
        reply += `⚠️ *تعذر الاتصال بقاعدة البيانات لجلب الإيرادات.*`;
      }

      actions.push({ label: '💰 مراجعة إيرادات اليوم', actionType: 'view_sales' });
      actions.push({ label: '🛵 استعلام الطلبات المسلمة', actionType: 'view_orders' });
      break;
    }

    // ══════════════════════════════════════════════════════════
    // 2️⃣ مقارنة المبيعات بين فترتين (Sales Comparison)
    // ══════════════════════════════════════════════════════════
    case 'sales_comparison': {
      const q = userMessage.toLowerCase();
      let p1: any = 'today';
      let p2: any = 'yesterday';
      let labelComp = 'اليوم مقارنة بأمس';

      if (q.includes('أسبوع') || q.includes('سيمانة')) {
        p1 = 'last_7_days';
        p2 = 'previous_7_days';
        labelComp = 'آخر 7 أيام مقارنة بالـ 7 أيام السابقة';
      } else if (q.includes('شهر')) {
        p1 = 'this_month';
        p2 = 'last_month';
        labelComp = 'هذا الشهر مقارنة بالشهر الماضي';
      }

      timePeriodLabel = labelComp;
      limitations = [
        'المقارنة مبنية حصراً على الطلبات المسلمة (Delivered Orders).',
        'الطلبات الملغاة تم استبعادها من حساب الإيرادات المقارنة.',
      ];

      const [res1, res2] = await Promise.all([
        executeGetSalesSummary({ period: p1 }),
        executeGetSalesSummary({ period: p2 }),
      ]);
      toolsExecuted.push(res1, res2);

      if (res1.status === 'not_configured' || res2.status === 'not_configured') {
        reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nقاعدة بيانات Supabase غير مهيأة على الخادم. تعذر إجراء مقارنة المبيعات بين الفترتين.`;
        actions.push({ label: '🛵 عرض الطلبات', actionType: 'view_orders' });
      } else if (res1.status === 'query_error' || res2.status === 'query_error') {
        reply = `❌ **خطأ في استعلام المقارنة:**\n\nحدث خطأ أثناء جلب بيانات إحدى الفترتين من قاعدة البيانات.`;
        actions.push({ label: '🛵 عرض الطلبات', actionType: 'view_orders' });
      } else {
        const d1 = res1.data;
        const d2 = res2.data;

        const rev1 = d1.delivered_revenue_dh || 0;
        const rev2 = d2.delivered_revenue_dh || 0;
        const diffRev = Math.round((rev1 - rev2) * 100) / 100;

        const ord1 = d1.delivered_orders_count || 0;
        const ord2 = d2.delivered_orders_count || 0;
        const diffOrd = ord1 - ord2;

        reply = `📊 **تقرير مقارنة المبيعات التشغيلية (${labelComp}) — بيانات حية:**\n\n`;
        reply += `• **الفترة الحالية (${d1.period}):**\n`;
        reply += `  - إيراد التسليم المؤكد: **${rev1} درهم** (${ord1} طلب مسلّم)\n`;
        reply += `  - متوسط السلة (AOV): **${d1.average_order_value_dh || 0} درهم**\n\n`;

        reply += `• **الفترة المرجعية (${d2.period}):**\n`;
        reply += `  - إيراد التسليم المؤكد: **${rev2} درهم** (${ord2} طلب مسلّم)\n`;
        reply += `  - متوسط السلة (AOV): **${d2.average_order_value_dh || 0} درهم**\n\n`;

        reply += `📈 **خلاصة الفروقات والتحليل:**\n`;
        const revIcon = diffRev > 0 ? '🟢 ارتفاع' : diffRev < 0 ? '🔴 انخفاض' : '⚪ استقرار';
        reply += `• التغير في الإيراد المؤكد: **${revIcon} بمقدار ${Math.abs(diffRev)} درهم** (${diffRev >= 0 ? '+' : ''}${diffRev} DH)\n`;
        reply += `• التغير في الطلبات المسلمة: **${diffOrd >= 0 ? '+' : ''}${diffOrd} طلب**\n\n`;

        if (d1.top_selling_items?.length > 0) {
          reply += `🔥 أكثر صنف طلباً في الفترة الحالية: **${d1.top_selling_items[0].name}** (${d1.top_selling_items[0].total_quantity} ${d1.top_selling_items[0].unit})\n`;
        }

        actions.push({ label: '📢 إطلاق حملة لتنشيط المبيعات', actionType: 'create_campaign' });
        actions.push({ label: '🛵 استعلام الطلبات الحالية', actionType: 'view_orders' });
      }
      break;
    }

    // ══════════════════════════════════════════════════════════
    // 3️⃣ الأسئلة المركبة (Compound Multi-Tool)
    // ══════════════════════════════════════════════════════════
    case 'compound_multi_tool': {
      limitations = [
        'تم دمج إحصائيات المبيعات التاريخية مع الجرد اللحظي لجدول المنتجات دون تكرار.',
      ];

      // استدعاء أداتي المبيعات والمخزون معاً
      const [salesRes, invRes] = await Promise.all([
        executeGetSalesSummary({ period: 'all_time' }),
        executeGetInventory({ filter: 'all' }),
      ]);
      toolsExecuted.push(salesRes, invRes);

      if (salesRes.status === 'not_configured' || invRes.status === 'not_configured') {
        reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nتعذر تنفيذ الاستعلام المركب لعدم تهيئة بيانات الاتصال بـ Supabase على الخادم.`;
        actions.push({ label: '📦 فتح لوحة المخزون', actionType: 'view_inventory' });
      } else if (salesRes.status === 'query_error' || invRes.status === 'query_error') {
        reply = `❌ **خطأ استعلام:** تعذر إتمام أحد الاستعلامات المركبة من قاعدة البيانات.`;
        actions.push({ label: '📦 فتح لوحة المخزون', actionType: 'view_inventory' });
      } else {
        const topItems = salesRes.data.top_selling_items || [];
        const invData = invRes.data;

        // مراجعة المخزون اللحظي للمنتجات الأكثر طلباً
        reply = `🧺 **تحليل مركب: المنتجات الأكثر طلباً وحالة مخزونها اللحظي بالمستودع:**\n\n`;

        if (topItems.length > 0) {
          reply += `تم رصد الأصناف المتصدرة في سجلات الطلبات وفحص توفرها اللحظي:\n\n`;
          topItems.slice(0, 5).forEach((item: any, idx: number) => {
            const inLow = invData.low_stock_list?.find((x: any) => x.name === item.name);
            const inOut = invData.out_of_stock_list?.find((x: any) => x.name === item.name);

            let stockVerdict = '✅ المخزون متوفر بأمان';
            if (inOut) stockVerdict = '❌ نافد حالياً (0 كجم) — يتطلب توريداً عاجلاً!';
            else if (inLow) stockVerdict = `⚠️ متبقي كمية محدودة (${inLow.stock} ${inLow.unit}) — يوصى بإعادة التزويد`;

            reply += `${idx + 1}. **${item.name}**\n`;
            reply += `   • إجمالي ما طُلب منها: **${item.total_quantity} ${item.unit}** (في ${item.in_orders_count} طلب)\n`;
            reply += `   • الوضع اللحظي: ${stockVerdict}\n\n`;
          });
        } else {
          reply += `لا توجد بيانات كافية في سجل الطلبات للمنتجات الأكثر مبيعاً.\n\n`;
        }

        reply += `📦 **مؤشر صحة المخزون العام:** ${invData.inventory_health_percentage}% (إجمالي المنتجات المسجلة: ${invData.total_products}).\n`;

        actions.push({ label: '📦 مراجعة المخزون الكامل', actionType: 'view_inventory' });
        actions.push({ label: '💵 مراجعة أسعار سوق بنسودة', actionType: 'view_pricing' });
      }
      break;
    }

    // ══════════════════════════════════════════════════════════
    // 4️⃣ أسئلة المنتجات والأسعار وحساب التوفر الإجمالي
    // ══════════════════════════════════════════════════════════
    case 'products_pricing': {
      const q = userMessage.toLowerCase();
      const isCountQuery =
        q.includes('كم عدد') || q.includes('شحال من منتوج') || q.includes('عدد المنتجات') || q.includes('شحال كاين من صنف');

      const prods = await executeGetProducts({ limit: 100 });
      toolsExecuted.push(prods);

      if (prods.status === 'not_configured') {
        reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nقاعدة بيانات Supabase غير مهيأة على الخادم. تعذر جلب المنتجات وأسعارها الحقيقية.`;
        actions.push({ label: '💵 مراجعة الأسعار في الإدارة', actionType: 'view_pricing' });
      } else if (prods.status === 'query_error' || prods.status === 'connection_error') {
        reply = `❌ **خطأ استعلام:** تعذر جلب المنتجات بسبب خطأ في قاعدة البيانات: ${prods.errorMessage}`;
        actions.push({ label: '💵 مراجعة الأسعار في الإدارة', actionType: 'view_pricing' });
      } else if (prods.status === 'empty') {
        reply = `🌿 **قائمة المنتجات:** تم الاتصال بقاعدة البيانات بنجاح، ولكن لا توجد منتجات مسجلة حالياً في جدول products.`;
        actions.push({ label: '➕ إضافة منتجات جديدة', actionType: 'view_inventory' });
      } else {
        const { data } = prods;
        const total = data.total_returned || 0;
        const available = data.total_available_in_batch || 0;
        const outOfStock = data.total_out_of_stock_in_batch || 0;

        if (isCountQuery) {
          reply = `🌿 **إحصائية المنتجات المسجلة بمتجر خُضرة فاس (بيانات حية من Supabase):**\n\n`;
          reply += `• **إجمالي المنتجات في النظام:** **${total} منتجاً**\n`;
          reply += `• **المنتجات المتوفرة والجاهزة للطلب:** **${available} منتجاً** (نسبة جاهزية ${total > 0 ? Math.round((available / total) * 100) : 100}%)\n`;
          reply += `• **المنتجات غير المتوفرة حالياً:** **${outOfStock} منتجاً**\n\n`;
          reply += `جميع هذه الأصناف مربوطة بأسعار السوق اليومي ويتم تزويدها صباح كل يوم من سوق الجملة بنسودة بفاس.`;
        } else {
          reply = `🌿 **قائمة عينة من أسعار المنتجات المعتمدة اليوم بمتجر خُضرة فاس:**\n\n`;
          data.products.slice(0, 8).forEach((p: any) => {
            const availBadge = p.is_available ? '✅ متوفر' : '❌ نافد';
            reply += `• **${p.name}**: **${p.price} درهم** / ${p.unit} (${availBadge} - مخزون: ${p.stock})\n`;
          });
          reply += `\n💡 يبلغ إجمالي المنتجات المسجلة في المتجر **${total} منتجاً** (${available} متوفر).`;
        }

        actions.push({ label: '💵 مراجعة وتحديث أسعار اليوم', actionType: 'view_pricing' });
        actions.push({ label: '📦 فحص المخزون بالكامل', actionType: 'view_inventory' });
      }
      break;
    }

    // ══════════════════════════════════════════════════════════
    // 5️⃣ المخزون وتحليل أولويات إعادة التوريد
    // ══════════════════════════════════════════════════════════
    case 'inventory_health': {
      const q = userMessage.toLowerCase();
      const isReorderQuery =
        q.includes('إعادة التوريد') || q.includes('إعادة توريد') || q.includes('خاصنا نجيبو') || q.includes('النواقص');

      const inv = await executeGetInventory({ filter: 'all' });
      toolsExecuted.push(inv);

      if (inv.status === 'not_configured') {
        reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nقاعدة بيانات Supabase غير مهيأة على الخادم. تعذر فحص المخزون اللحظي للمتجر.`;
        actions.push({ label: '📦 فتح لوحة المخزون', actionType: 'view_inventory' });
      } else if (inv.status === 'query_error' || inv.status === 'connection_error') {
        reply = `❌ **خطأ استعلام:** تعذر فحص المخزون بسبب خطأ في قاعدة البيانات: ${inv.errorMessage}`;
        actions.push({ label: '📦 فتح لوحة المخزون', actionType: 'view_inventory' });
      } else if (inv.status === 'empty') {
        reply = `📦 **تقرير المخزون:** تم الاتصال بقاعدة البيانات بنجاح: لا توجد منتجات مسجلة في جدول products.`;
        actions.push({ label: '➕ إضافة منتجات جديدة', actionType: 'view_inventory' });
      } else {
        const { data } = inv;
        const lowCount = data.low_stock_count || 0;
        const outCount = data.out_of_stock_count || 0;
        const reorderList = data.reorder_recommendations || [];

        if (isReorderQuery) {
          reply = `🛒 **قائمة أولويات إعادة التوريد من سوق الجملة بنسودة — فاس (بيانات حية):**\n\n`;
          if (reorderList.length === 0) {
            reply += `✅ **المخزون مكتمل وممتاز!**\nجميع الـ **${data.total_products} منتجاً** المسجلة في المتجر تتوفر على كميات كافية وآمنة (> 5 كجم). لا توجد أصناف تحتاج لإعادة توريد طارئة حالياً.\n`;
          } else {
            reply += `يوجد **${reorderList.length} صنفاً** بحاجة لإعادة التزويد:\n\n`;
            reorderList.slice(0, 8).forEach((item: any, i: number) => {
              reply += `${i + 1}. **${item.name}** [${item.priority}]\n   • الكمية المتبقية: ${item.stock} ${item.unit}\n   • التوجيه: ${item.action}\n\n`;
            });
            reply += `💡 *توجيه تشغيلي:* يرجى إدراج هذه الأصناف في قائمة مشتريات فجر الغد من سوق بنسودة لتفادي نفاد السلات.\n`;
          }
        } else {
          reply = `📦 **تقرير المخزون اللحظي لمتجر خُضرة فاس (بيانات حية من Supabase):**\n\n`;
          reply += `• **إجمالي المنتجات المسجلة:** ${data.total_products} منتج\n`;
          reply += `• **المتوفر بأمان (> 5 كجم/وحدة):** ${data.available_healthy_count} منتج\n`;
          reply += `• **المنتجات منخفضة المخزون (1 إلى 5):** ${lowCount} منتجات\n`;
          reply += `• **المنتجات غير المتوفرة (0):** ${outCount} منتج\n`;
          reply += `• **مؤشر صحة المخزون:** ${data.inventory_health_percentage}%\n\n`;

          if (lowCount > 0 || outCount > 0) {
            reply += `⚠️ **أبرز السلع التي تتطلب انتباهاً:**\n`;
            data.low_stock_list?.slice(0, 5).forEach((item: any) => {
              reply += `  - ${item.name}: متبقي **${item.stock} ${item.unit}**\n`;
            });
          }
        }

        actions.push({ label: '📦 فتح لوحة المخزون لإعادة التزويد', actionType: 'view_inventory' });
        actions.push({ label: '💵 مراجعة أسعار سوق بنسودة', actionType: 'view_pricing' });
      }
      break;
    }

    // ══════════════════════════════════════════════════════════
    // 6️⃣ المبيعات والإيرادات لفترة محددة (Sales Period)
    // ══════════════════════════════════════════════════════════
    case 'sales_period': {
      const parsed = extractSalesPeriod(userMessage);
      timePeriodLabel = parsed.label;
      limitations = [
        'الإيرادات محسوبة حصراً على الطلبات المسلمة (Delivered Orders).',
        'الطلبات المعلقة والملغاة تم فرزها بشكل منفصل.',
      ];

      const sales = await executeGetSalesSummary({ period: parsed.period });
      toolsExecuted.push(sales);

      if (sales.status === 'not_configured') {
        reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nقاعدة بيانات Supabase غير مهيأة على الخادم. تعذر جلب تقرير المبيعات الحقيقي.`;
        actions.push({ label: '🛵 عرض الطلبات', actionType: 'view_orders' });
      } else if (sales.status === 'query_error' || sales.status === 'connection_error') {
        reply = `❌ **خطأ استعلام:** تعذر حساب تقرير المبيعات بسبب خطأ في قاعدة البيانات: ${sales.errorMessage}`;
        actions.push({ label: '🛵 عرض الطلبات', actionType: 'view_orders' });
      } else if (sales.status === 'empty') {
        reply = `💰 **ملخص المبيعات التشغيلي (${sales.data?.period || parsed.label}) — خُضرة فاس:**\n\nتم الاتصال بقاعدة البيانات بنجاح: لا توجد طلبات مسجلة في هذه الفترة المحددة حتى الآن لحساب الإيرادات.`;
        actions.push({ label: '🛵 عرض الطلبات', actionType: 'view_orders' });
        actions.push({ label: '📢 إطلاق حملة تسويقية لتنشيط المبيعات', actionType: 'create_campaign' });
      } else {
        const { data } = sales;
        reply = `💰 **ملخص المبيعات التشغيلي (${data.period}) — خُضرة فاس (بيانات حية):**\n\n`;
        reply += `• **إجمالي الطلبات المسجلة:** ${data.total_orders} طلب\n`;
        reply += `• **الطلبات المسلمة بنجاح (المؤكدة):** ${data.delivered_orders_count} طلب بإيراد مؤكد: **${data.delivered_revenue_dh} درهم**\n`;
        reply += `• **الطلبات قيد الإنجاز (جديدة/مجهزة):** ${data.pending_orders_count} طلب بقيمة محتملة: **${data.pending_potential_revenue_dh} درهم**\n`;
        reply += `• **الطلبات الملغية:** ${data.cancelled_orders_count}\n`;
        reply += `• **متوسط قيمة الطلب (AOV):** **${data.average_order_value_dh} درهم**\n\n`;

        if (data.top_selling_items?.length > 0) {
          reply += `🔥 **المنتجات الأكثر طلباً في السلات:**\n`;
          data.top_selling_items.slice(0, 5).forEach((item: any, i: number) => {
            reply += `  ${i + 1}. ${item.name}: **${item.total_quantity} ${item.unit}** (في ${item.in_orders_count} طلب)\n`;
          });
          reply += `\n`;
        }

        actions.push({ label: '🛵 استعلام الطلبات الحالية', actionType: 'view_orders' });
        actions.push({ label: '📢 إنشاء حملة ترويجية للمبيعات', actionType: 'create_campaign' });
      }
      break;
    }

    // ══════════════════════════════════════════════════════════
    // 7️⃣ الطلبات ومتابعة التوصيل (Orders Tracking)
    // ══════════════════════════════════════════════════════════
    case 'orders_tracking': {
      const q = userMessage.toLowerCase();
      const statusFilter = q.includes('جديد') || q.includes('pending') ? 'pending' : 'all';
      const orders = await executeGetOrders({ status: statusFilter, limit: 15 });
      toolsExecuted.push(orders);

      if (orders.status === 'not_configured') {
        reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nقاعدة بيانات Supabase غير مهيأة على الخادم. تعذر جلب سجل الطلبات الحقيقي للمتجر.`;
        actions.push({ label: '🛵 لوحة الطلبات والأسطول', actionType: 'view_orders' });
      } else if (orders.status === 'query_error' || orders.status === 'connection_error') {
        reply = `❌ **خطأ استعلام:** تعذر جلب الطلبات بسبب خطأ في قاعدة البيانات: ${orders.errorMessage}`;
        actions.push({ label: '🛵 لوحة الطلبات والأسطول', actionType: 'view_orders' });
      } else if (orders.status === 'empty') {
        reply = `🛵 **حالة الطلبات الحالية (${orders.data?.period_label || 'اليوم'}):**\n\nتم الاتصال بقاعدة البيانات بنجاح: لا توجد طلبات مسجلة حالياً في النظام تطابق هذا البحث.`;
        actions.push({ label: '🛵 لوحة الطلبات', actionType: 'view_orders' });
      } else {
        const { data } = orders;
        reply = `🛵 **حالة الطلبات الحالية (${data.period_label}) — بيانات حية من Supabase:**\n\n`;
        reply += `• **إجمالي الطلبات:** ${data.total_orders_found} طلب\n`;
        reply += `• **قيد الانتظار (جديدة تحتاج متابعة):** **${data.counts_by_status.pending}** طلب\n`;
        reply += `• **تم التجهيز بالمستودع:** ${data.counts_by_status.prepared} طلب\n`;
        reply += `• **تم التوصيل بنجاح:** ${data.counts_by_status.delivered} طلب\n`;
        reply += `• **ملغية:** ${data.counts_by_status.cancelled} طلب\n\n`;

        if (data.orders?.length > 0) {
          reply += `📋 **أحدث الطلبات في النظام:**\n`;
          data.orders.slice(0, 5).forEach((ord: any) => {
            reply += `  - **${ord.order_code}** (${ord.customer_name}) | ${ord.status_arabic} | **${ord.total_dh} DH**\n    العنوان: ${ord.address} (منطقة ${ord.delivery_zone})\n`;
          });
        }

        actions.push({ label: '🛵 إدارة وتوزيع الطلبات على السائقين', actionType: 'view_orders' });
      }
      break;
    }

    // ══════════════════════════════════════════════════════════
    // 8️⃣ حركات وتدقيق المخزون (Inventory Movements)
    // ══════════════════════════════════════════════════════════
    case 'inventory_movements': {
      const movements = await executeGetInventoryMovements({ limit: 10 });
      toolsExecuted.push(movements);

      if (movements.status === 'not_configured') {
        reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nقاعدة بيانات Supabase غير مهيأة على الخادم. تعذر جلب سجل حركات المخزون.`;
        actions.push({ label: '📦 فحص المخزون', actionType: 'view_inventory' });
      } else if (movements.status === 'query_error' || movements.status === 'connection_error') {
        reply = `❌ **خطأ استعلام:** تعذر جلب حركات المخزون: ${movements.errorMessage}`;
        actions.push({ label: '📦 فحص المخزون', actionType: 'view_inventory' });
      } else if (movements.status === 'empty') {
        reply = `📋 **سجل حركات وتدقيق المخزون:** تم الاتصال بقاعدة البيانات بنجاح: سجل التدقيق (inventory_ledger) خالٍ حالياً. يتم تسجيل الحركات تلقائياً عند اعتماد الطلبات أو التزويد الصباحي.`;
        actions.push({ label: '📦 فحص المخزون', actionType: 'view_inventory' });
      } else {
        const { data } = movements;
        reply = `📋 **سجل حركات وتدقيق المخزون (Inventory Ledger) — بيانات حية:**\n\n`;
        reply += `تم تسجيل **${data.total_movements}** حركة أخيرة:\n\n`;
        data.movements.slice(0, 6).forEach((m: any) => {
          reply += `• **${m.product_name}** (${m.movement_type_arabic}): **${m.delta_formatted}**\n`;
          reply += `  المخزون السابق: ${m.stock_before} ⬅️ الحالي: **${m.stock_after}**\n`;
          reply += `  السبب: ${m.reason} (${new Date(m.created_at).toLocaleTimeString('ar-MA')})\n\n`;
        });
        actions.push({ label: '📦 فحص المخزون الحالي', actionType: 'view_inventory' });
      }
      break;
    }

    // ══════════════════════════════════════════════════════════
    // 9️⃣ نصائح وإرشادات تشغيلية عامة (General Advice)
    // ══════════════════════════════════════════════════════════
    case 'general_advice': {
      limitations = ['هذه إرشادات تشغيلية عامة ولا تستند إلى بيانات المخزون اللحظية.'];
      reply = `🌿 **دليل الإرشادات التشغيلية للحفاظ على طراوة الخضر والورقيات:**\n\n`;
      reply += `1. **الخضر الورقية (النعناع، القزبر، المعدنوس، الكرفس):**\n`;
      reply += `   • تجنب رشها بالماء بكميات كثيرة إذا كانت ستُخزن لساعات، فالرطوبة الزائدة تعفن الأوراق.\n`;
      reply += `   • الطريقة المثالية: لف القيعان بقطعة قماش خيش رطبة ووضعها في مكان جيد التهوية بعيداً عن الشمس المباشرة وحرارة المطبخ.\n\n`;
      reply += `2. **الدرنات (البطاطس، البصل):**\n`;
      reply += `   • لا تخزن البطاطس والبصل في نفس الصندوق لأن غازات البصل تسرع تبرعم البطاطس.\n`;
      reply += `   • احفظهما في مكان مظلم وبارد وجاف مع تهوية مستمرة من الأسفل.\n\n`;
      reply += `3. **الطماطم والخيار:**\n`;
      reply += `   • الطماطم تفقد نكهتها وطراوتها الطبيعية إذا وضعت في تبريد شديد؛ احفظها في درجة حرارة الغرفة (15-18°C) ورتبها حبة بحبة مع توجيه العنق لأسفل.\n\n`;
      reply += `💡 *ملاحظة:* هذه توجيهات تشغيلية عامة لرفع جودة التخزين وتقليل الهدر، وليست مبنية على بيانات مخزون المتجر اللحظية.`;

      actions.push({ label: '📦 فحص كميات الورقيات الحالية', actionType: 'view_inventory' });
      actions.push({ label: '💵 مراجعة أسعار الورقيات اليوم', actionType: 'view_pricing' });
      break;
    }

    // ══════════════════════════════════════════════════════════
    // 🔟 معلومات وسياسات المتجر (Store Info)
    // ══════════════════════════════════════════════════════════
    default: {
      const storeInfo = executeGetStoreInfo();
      toolsExecuted.push(storeInfo);

      reply = `أهلاً بك سيدي المدير في **Khodra AI Copilot v2** 🌿\n\n`;
      reply += `أنا مساعدك التشغيلي المتصل بقاعدة بيانات متجر خُضرة فاس. يمكنك سؤالي عن:\n\n`;
      reply += `1. **المخزون وإعادة التوريد:** ("كم عدد المنتجات المتوفرة؟" أو "ما المنتجات التي تحتاج إلى إعادة التوريد؟")\n`;
      reply += `2. **المبيعات والمقارنات:** ("ما إجمالي مبيعات آخر 7 أيام؟" أو "قارن المبيعات بين اليوم وأمس")\n`;
      reply += `3. **الأسئلة المركبة:** ("ما المنتجات الأكثر مبيعاً وهل مخزونها كافي دابا؟")\n`;
      reply += `4. **متابعة الطلبات:** ("الطلبات المعلقة اليوم" أو "الطلبات حسب المناطق")\n`;
      reply += `5. **سياسات المتجر بفاس:** مناطق التوصيل الأربعة، الحد الأدنى 70 DH، والتوصيل المجاني فوق 250 DH.\n\n`;
      reply += `🔒 **ملاحظة أمان:** أعمل في وضع القراءة فقط (Read-Only) لحماية بيانات المتجر من أي تعديل غير مصرح.\n`;

      actions.push({ label: '📦 فحص المخزون', actionType: 'view_inventory' });
      actions.push({ label: '💰 ملخص مبيعات اليوم', actionType: 'view_sales' });
      actions.push({ label: '🛵 استعلام الطلبات الجديدة', actionType: 'view_orders' });
      break;
    }
  }

  const hasRealData = toolsExecuted.some(
    (t) => t.isRealData === true && t.source === 'supabase_live' && t.status === 'success'
  );

  const metadata = buildResponseMetadata(intent, toolsExecuted, userMessage, limitations, timePeriodLabel);

  return {
    reply,
    toolsExecuted: toolsExecuted.map((t) => ({
      toolName: t.toolName,
      source: t.source,
      status: t.status,
      summary: t.summary,
      isRealData: t.isRealData,
      data: t.data,
      errorMessage: t.errorMessage,
    })),
    suggestedActions: actions,
    dataContext: buildDataContextSummary(toolsExecuted),
    isRealData: hasRealData,
    modelUsed: 'khodra-deterministic-router-v2',
    metadata,
  };
}

// ────────────────────────────────────────────────────────────
// دالة بناء البيانات الوصفية للمصدر والقيود (Metadata Builder)
// ────────────────────────────────────────────────────────────
function buildResponseMetadata(
  intent: QuestionIntent,
  tools: ToolExecutionResult[],
  _userMessage: string,
  extraLimitations: string[] = [],
  timePeriodLabel?: string
): CopilotMetadata {
  const hasLiveSuccess = tools.some((t) => t.source === 'supabase_live' && t.status === 'success');
  const hasLiveEmpty = tools.some((t) => t.source === 'supabase_live' && t.status === 'empty');
  const hasError = tools.some((t) => t.status === 'query_error' || t.status === 'connection_error');
  const hasNotConfigured = tools.some((t) => t.status === 'not_configured');
  const hasStoreConfig = tools.some((t) => t.source === 'store_config');

  let dataSource: 'supabase_live' | 'store_config' | 'none' | 'unavailable' | 'error' = 'none';
  if (hasLiveSuccess || hasLiveEmpty) dataSource = 'supabase_live';
  else if (hasStoreConfig) dataSource = 'store_config';
  else if (hasNotConfigured) dataSource = 'unavailable';
  else if (hasError) dataSource = 'error';

  let status: 'success' | 'empty' | 'error' | 'not_configured' | 'general' | 'needs_clarification' = 'general';
  if (intent === 'ambiguous_clarification') status = 'needs_clarification';
  else if (hasNotConfigured) status = 'not_configured';
  else if (hasError) status = 'error';
  else if (hasLiveSuccess) status = 'success';
  else if (hasLiveEmpty) status = 'empty';

  const limitations = [...extraLimitations];
  if (intent === 'schema_limitation') {
    if (!limitations.includes('لا تسجل قاعدة البيانات تكاليف الشراء أو مصاريف التشغيل لحساب صافي الربح.')) {
      limitations.push('لا تسجل قاعدة البيانات تكاليف الشراء أو مصاريف التشغيل لحساب صافي الربح.');
    }
  }

  return {
    intent,
    dataSource,
    timePeriodAnalyzed: timePeriodLabel,
    limitations: limitations.length > 0 ? limitations : undefined,
    toolsCount: tools.length,
    isRealData: hasLiveSuccess,
    status,
  };
}

/**
 * استخراج أزرار الإجراءات السريعة بناءً على السياق والأدوات المنفذة
 */
function extractSuggestedActions(
  userMessage: string,
  tools: ToolExecutionResult[]
): CopilotAction[] {
  const actions: CopilotAction[] = [];
  const q = userMessage.toLowerCase();

  const usedToolNames = new Set(tools.map((t) => t.toolName));

  if (usedToolNames.has('get_inventory') || q.includes('مخزون') || q.includes('stock')) {
    actions.push({ label: '📦 فتح لوحة إدارة المخزون', actionType: 'view_inventory' });
    actions.push({ label: '💵 مراجعة أسعار السوق الصباحي', actionType: 'view_pricing' });
  }

  if (usedToolNames.has('get_orders') || q.includes('طلب') || q.includes('orders')) {
    actions.push({ label: '🛵 إدارة وتوزيع أسطول الطلبات', actionType: 'view_orders' });
  }

  if (usedToolNames.has('get_sales_summary') || q.includes('مبيعات') || q.includes('حملة')) {
    actions.push({ label: '✨ إنشاء حملة تسويقية لمبيعات اليوم', actionType: 'create_campaign' });
    actions.push({ label: '📱 إرسال تنبيه واتساب للزبائن', actionType: 'publish_whatsapp' });
  }

  if (actions.length === 0) {
    actions.push({ label: '📦 فحص المخزون', actionType: 'view_inventory' });
    actions.push({ label: '🛵 الطلبات الحالية', actionType: 'view_orders' });
    actions.push({ label: '✨ أفكار تسويقية', actionType: 'create_campaign' });
  }

  return actions.slice(0, 3);
}

/**
 * تلخيص سياق البيانات ومصدرها الحقيقي بكل شفافية ونزاهة
 */
function buildDataContextSummary(tools: ToolExecutionResult[]): string {
  if (tools.length === 0) {
    return 'خُضرة فاس — وضع الاستعلام التشغيلي (لم تُنفذ أدوات).';
  }

  const summaries = tools.map((t) => {
    let badge = '📋 غير متوفر';
    if (t.source === 'supabase_live' && t.status === 'success') {
      badge = '⚡ بيانات حية من Supabase';
    } else if (t.source === 'supabase_live' && t.status === 'empty') {
      badge = 'ℹ️ Supabase متصل (الجدول فارغ)';
    } else if (t.status === 'query_error' || t.status === 'connection_error') {
      badge = '❌ خطأ في استعلام Supabase';
    } else if (t.status === 'not_configured') {
      badge = '⚠️ Supabase غير مهيأ على الخادم';
    } else if (t.source === 'store_config') {
      badge = '⚙️ إعدادات المتجر العامة';
    }
    return `${t.toolName} (${badge})`;
  });

  return `الأدوات: ${summaries.join(' • ')}`;
}
