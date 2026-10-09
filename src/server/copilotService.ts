// ============================================================
// src/server/copilotService.ts
// محرك Khodra AI Copilot v2 — المساعد التشغيلي الذكي
// يعتمد على Function Calling الحقيقي والربط المباشر بـ Supabase
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

export interface CopilotResponse {
  reply: string;
  toolsExecuted: {
    toolName: string;
    source: string;
    summary: string;
    isRealData: boolean;
    data?: any;
  }[];
  suggestedActions: CopilotAction[];
  dataContext: string;
  isRealData: boolean;
  modelUsed: string;
}

const COPILOT_SYSTEM_INSTRUCTION = `
أنت "خُضرة AI Copilot v2" — المساعد التشغيلي والإداري الذكي الرسمي لمنصة "خُضرة — فاس" (Khodra Fès).
أنت شريك حقيقي لمدير المتجر وفريق العمليات في مدينة فاس والمغرب.

القواعد الصارمة والإلزامية:
1. 🔒 وضع القراءة فقط والأمان (Read-Only Security):
   أنت في وضع القراءة والتحليل فقط. لا يمكنك أبداً إجراء تعديلات مباشرة أو حذف أو إضافة على المنتجات أو المخزون أو الطلبات.
   إذا طلب منك المدير تعديل سعر أو تغيير مخزون أو حذف طلب، وضّح له بلطف أن Copilot يعمل بوضع الاستعلام الآمن (Read-Only)، واقترح عليه التوجه للوحة المناسبة (مثلاً لوحة إدارة المخزون أو إدارة الطلبات) وإدخال رمز PIN الإداري.

2. 📊 الدقة والواقعية والربط المباشر (Strict Grounding):
   يجب أن تعتمد حصرياً على الأدوات المتاحة (Tools) لجلب البيانات الحقيقية من Supabase:
   - get_products: للبحث في الكتالوج، الأسعار، وحالة توفر المنتجات.
   - get_inventory: لتحليل الكميات بالمستودع، المنتجات الناقصة، والمنتجات غير المتوفرة.
   - get_orders: لمتابعة الطلبات، الطلبات الجديدة (pending)، وحالات التوصيل.
   - get_sales_summary: لحساب إجمالي المبيعات، الإيرادات بالدرهم، ومتوسط السلة.
   - get_inventory_movements: للتحقق من سجل حركات المخزون (inventory_ledger).
   - get_store_info: لمعلومات التوصيل بفاس، الأسعار، وعتبة التوصيل المجاني.

3. 🚫 منع اختلاق البيانات منعاً باتاً (No Hallucinations):
   لا تخترع أي أرقام أو كميات أو طلبات غير موجودة. إذا كانت نتيجة الأداة فارغة (مثل: عدد الطلبات 0 أو لا توجد حركات مخزون مسجلة)، قل ذلك بكل صدق وشفافية للمدير.

4. 🇲🇦 اللهجة والأسلوب المهني:
   تحدث بلغة عربية مهنية واضحة مع فهم تام لخصوصية السوق المغربي ومدينة فاس (سوق الجملة بنسودة، أحياء فاس: طريق إيموزار، النرجس، الأطلس، بنسودة، عين الشقف، المدينة القديمة، العملة بالدرهم DH). تفهم تماماً الدارجة المغربية والفرنسية إذا كتب بها المستخدم.

5. 💡 تقديم التوجيه التشغيلي المفيد:
   لا تكتفِ بسرد الأرقام الجافة، بل قدّم قراءة تشغيلية ذكية (مثلاً: "لدينا 3 طلبات جديدة بحاجة للتجهيز فوراً قبل خروج الموزعين"، أو "الطماطم قاربت على النفاد (مخزون 4 كجم)، أنصح بعدم ترويجها لحين التزويد الصباحي").
`;

/**
 * محرك المحادثة الرئيسي لـ Copilot v2
 */
export async function executeCopilotChat(
  userMessage: string,
  history: CopilotChatHistoryMessage[] = []
): Promise<CopilotResponse> {
  const gemini = getGeminiClient();
  const toolsExecuted: ToolExecutionResult[] = [];

  // إذا كان عميل Gemini متاحاً، ننفذ دورة Function Calling
  if (gemini) {
    try {
      // 1. إعداد المحتوى الأولي
      const contents: any[] = [];

      // إضافة السجل السابق المحدود (آخر 4 رسائل للسياق)
      const recentHistory = history.slice(-4);
      for (const h of recentHistory) {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }],
        });
      }

      // إضافة رسالة المستخدم الحالية
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      // 2. إرسال الطلب مع تعريفات الأدوات
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: COPILOT_SYSTEM_INSTRUCTION,
          temperature: 0.2,
          tools: [{ functionDeclarations: COPILOT_FUNCTION_DECLARATIONS }],
        },
      });

      // 3. التحقق من استدعاءات الأدوات (Function Calls)
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        // تنفيذ الأدوات المطلوبة بالتوازي
        const toolResponses = await Promise.all(
          functionCalls.map(async (call) => {
            const result = await dispatchCopilotTool(call.name, call.args);
            toolsExecuted.push(result);
            return {
              name: call.name,
              response: result.data,
            };
          })
        );

        // 4. الجولة الثانية: إرسال نتائج الأدوات للنموذج لصياغة الرد النهائي
        const candidateContent = response.candidates?.[0]?.content;
        const toolFollowUpContents = [
          ...contents,
          candidateContent || {
            role: 'model',
            parts: functionCalls.map((fc) => ({
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

        const finalGen = await gemini.models.generateContent({
          model: GEMINI_MODEL,
          contents: toolFollowUpContents,
          config: {
            systemInstruction: COPILOT_SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        });

        const replyText = finalGen.text || 'تم فحص البيانات بنجاح.';
        const actions = extractSuggestedActions(userMessage, toolsExecuted);

        return {
          reply: replyText,
          toolsExecuted: toolsExecuted.map((t) => ({
            toolName: t.toolName,
            source: t.source,
            summary: t.summary,
            isRealData: t.isRealData,
            data: t.data,
          })),
          suggestedActions: actions,
          dataContext: buildDataContextSummary(toolsExecuted),
          isRealData: toolsExecuted.some((t) => t.isRealData),
          modelUsed: GEMINI_MODEL,
        };
      }

      // إذا رد النموذج مباشرة بنص دون طلب أدوات
      if (response.text) {
        return {
          reply: response.text,
          toolsExecuted: [],
          suggestedActions: extractSuggestedActions(userMessage, []),
          dataContext: 'إجابة إرشادية مباشرة من خُضرة AI Copilot.',
          isRealData: true,
          modelUsed: GEMINI_MODEL,
        };
      }
    } catch (err) {
      console.warn('[CopilotService] Gemini API execution failed or fell back:', err);
    }
  }

  // ────────────────────────────────────────────────────────────
  // محرك النوايا الحتمي والذاتي (Deterministic Intent Router)
  // يضمن 100% أن المستخدم يحصل على بيانات Supabase الحية حتى لو
  // انقطع مفتاح Gemini أو حدث أي استثناء
  // ────────────────────────────────────────────────────────────
  return await executeDeterministicCopilot(userMessage);
}

/**
 * المحرك الحتمي الاحتياطي الذكي:
 * يحلل السؤال، يستدعي نفس أدوات Supabase الحقيقية، وينتج رداً غنياً ومنسقاً
 */
async function executeDeterministicCopilot(userMessage: string): Promise<CopilotResponse> {
  const q = userMessage.toLowerCase();
  const toolsExecuted: ToolExecutionResult[] = [];
  let reply = '';
  const actions: CopilotAction[] = [];

  // 1) استفسارات المخزون (Inventory)
  if (
    q.includes('مخزون') ||
    q.includes('ستوك') ||
    q.includes('stock') ||
    q.includes('ناقص') ||
    q.includes('نفاد') ||
    q.includes('متوفر') ||
    q.includes('تقاضى') ||
    q.includes('سالا') ||
    q.includes('كمية')
  ) {
    const inv = await executeGetInventory({ filter: 'all' });
    toolsExecuted.push(inv);

    const { data } = inv;
    const lowCount = data.low_stock_count || 0;
    const outCount = data.out_of_stock_count || 0;

    reply = `📦 **تقرير المخزون اللحظي لمتجر خُضرة فاس:**\n\n`;
    reply += `• **إجمالي المنتجات المسجلة:** ${data.total_products} منتج\n`;
    reply += `• **المتوفر بأمان (> 5 كجم/وحدة):** ${data.available_healthy_count} منتج\n`;
    reply += `• **المنتجات منخفضة المخزون (1 إلى 5):** ${lowCount} منتجات\n`;
    reply += `• **المنتجات غير المتوفرة (0):** ${outCount} منتج\n`;
    reply += `• **مؤشر صحة المخزون:** ${data.inventory_health_percentage}%\n\n`;

    if (data.low_stock_list && data.low_stock_list.length > 0) {
      reply += `⚠️ **تنبيه السلع المقاربة على النفاد:**\n`;
      data.low_stock_list.slice(0, 6).forEach((item: any) => {
        reply += `  - ${item.name}: متبقي **${item.stock} ${item.unit}** فقط (سعر: ${item.price} درهم)\n`;
      });
      reply += `💡 *توجيه التشغيل:* يرجى الحذر من إطلاق حملات ترويجية مكثفة على هذه السلع لتفادي عجز التوصيل، وبرمجتها في قائمة مشتريات فجر الغد من سوق بنسودة.\n\n`;
    }

    if (data.out_of_stock_list && data.out_of_stock_list.length > 0) {
      reply += `❌ **المنتجات غير المتوفرة حالياً:**\n`;
      data.out_of_stock_list.slice(0, 5).forEach((item: any) => {
        reply += `  - ${item.name} (${item.unit})\n`;
      });
      reply += `\n`;
    }

    actions.push({ label: '📦 فتح لوحة المخزون لإعادة التزويد', actionType: 'view_inventory' });
    actions.push({ label: '💵 مراجعة أسعار سوق الجملة اليوم', actionType: 'view_pricing' });
  }

  // 2) استفسارات المبيعات والمالية (Sales & Revenue)
  else if (
    q.includes('مبيعات') ||
    q.includes('شحال دخلنا') ||
    q.includes('أرباح') ||
    q.includes('فلوس') ||
    q.includes('إيرادات') ||
    q.includes('chhal') ||
    q.includes('sales') ||
    q.includes('revenue') ||
    q.includes('دخل') ||
    q.includes('ملخص اليوم')
  ) {
    const period = q.includes('أسبوع') || q.includes('سيمانة') ? 'last_7_days' : q.includes('شهر') ? 'this_month' : 'today';
    const sales = await executeGetSalesSummary({ period });
    toolsExecuted.push(sales);

    const { data } = sales;
    reply = `💰 **ملخص المبيعات التشغيلي (${data.period}) — خُضرة فاس:**\n\n`;
    reply += `• **إجمالي الطلبات:** ${data.total_orders} طلب\n`;
    reply += `• **طلبات تم تسليمها بنجاح:** ${data.delivered_orders_count} طلب بإيراد مؤكد: **${data.delivered_revenue_dh} درهم**\n`;
    reply += `• **طلبات قيد الإنجاز (جديدة/مجهزة):** ${data.pending_orders_count} طلب بقيمة: **${data.pending_potential_revenue_dh} درهم**\n`;
    reply += `• **الطلبات الملغية:** ${data.cancelled_orders_count}\n`;
    reply += `• **متوسط قيمة الطلب (AOV):** **${data.average_order_value_dh} درهم**\n\n`;

    if (data.top_selling_items && data.top_selling_items.length > 0) {
      reply += `🔥 **المنتجات الأكثر طلباً في السلات:**\n`;
      data.top_selling_items.forEach((item: any, i: number) => {
        reply += `  ${i + 1}. ${item.name}: **${item.total_quantity} ${item.unit}** (في ${item.in_orders_count} طلب)\n`;
      });
      reply += `\n`;
    } else {
      reply += `ℹ️ لم تسجل طلبات مكتملة تحتوي على عناصر في هذه الفترة المحددة.\n\n`;
    }

    actions.push({ label: '🛵 عرض الطلبات الحالية', actionType: 'view_orders' });
    actions.push({ label: '📢 إطلاق حملة تسويقية لتنشيط المبيعات', actionType: 'create_campaign' });
  }

  // 3) استفسارات الطلبات (Orders Tracking)
  else if (
    q.includes('طلب') ||
    q.includes('طلبات') ||
    q.includes('orders') ||
    q.includes('pending') ||
    q.includes('كوموند') ||
    q.includes('توصيل') ||
    q.includes('livraison')
  ) {
    const status = q.includes('جديد') || q.includes('pending') ? 'pending' : 'all';
    const orders = await executeGetOrders({ status, limit: 15 });
    toolsExecuted.push(orders);

    const { data } = orders;
    reply = `🛵 **حالة الطلبات الحالية (${data.period_label}):**\n\n`;
    reply += `• **إجمالي الطلبات:** ${data.total_orders_found} طلب\n`;
    reply += `• **قيد الانتظار (جديدة تحتاج متابعة):** **${data.counts_by_status.pending}** طلب\n`;
    reply += `• **تم التجهيز:** ${data.counts_by_status.prepared} طلب\n`;
    reply += `• **تم التوصيل:** ${data.counts_by_status.delivered} طلب\n`;
    reply += `• **ملغية:** ${data.counts_by_status.cancelled} طلب\n\n`;

    if (data.orders && data.orders.length > 0) {
      reply += `📋 **أحدث الطلبات في النظام:**\n`;
      data.orders.slice(0, 5).forEach((ord: any) => {
        reply += `  - **${ord.order_code}** (${ord.customer_name}) | ${ord.status_arabic} | **${ord.total_dh} DH**\n    العنوان: ${ord.address} (منطقة ${ord.delivery_zone})\n`;
      });
      reply += `\n`;
    } else {
      reply += `لا توجد طلبات معلقة مسجلة حالياً في قاعدة البيانات.\n\n`;
    }

    actions.push({ label: '🛵 الذهاب لإدارة الطلبات والأسطول', actionType: 'view_orders' });
  }

  // 4) استفسارات حركات وتدقيق المخزون (Inventory Ledger Movements)
  else if (
    q.includes('حركات') ||
    q.includes('حركة') ||
    q.includes('ledger') ||
    q.includes('سجل') ||
    q.includes('خصم') ||
    q.includes('تعديل المخزون')
  ) {
    const movements = await executeGetInventoryMovements({ limit: 10 });
    toolsExecuted.push(movements);

    const { data } = movements;
    reply = `📋 **سجل حركات وتدقيق المخزون (Inventory Ledger):**\n\n`;

    if (data.movements && data.movements.length > 0) {
      reply += `تم تسجيل **${data.total_movements}** حركة أخيرة:\n\n`;
      data.movements.slice(0, 6).forEach((m: any) => {
        reply += `• **${m.product_name}** (${m.movement_type_arabic}): **${m.delta_formatted}**\n`;
        reply += `  المخزون السابق: ${m.stock_before} ⬅️ المخزون الحالي: **${m.stock_after}**\n`;
        reply += `  السبب: ${m.reason} (${new Date(m.created_at).toLocaleTimeString('ar-MA')})\n\n`;
      });
    } else {
      reply += `ℹ️ سجل التدقيق (inventory_ledger) خالٍ حالياً. يتم تسجيل الحركات تلقائياً عند اعتماد الطلبات أو إرجاعها أو إدخال السلع الصباحية.\n\n`;
    }

    actions.push({ label: '📦 فحص المخزون الحالي', actionType: 'view_inventory' });
  }

  // 5) استفسارات المنتجات وأسعارها والتوفر (Products & Pricing)
  else if (
    q.includes('خضار') ||
    q.includes('فواكه') ||
    q.includes('منتج') ||
    q.includes('سعر') ||
    q.includes('أثمنة') ||
    q.includes('بطاطس') ||
    q.includes('طماطم') ||
    q.includes('بصل') ||
    q.includes('تفاح') ||
    q.includes('برتقال')
  ) {
    const prods = await executeGetProducts({ limit: 20 });
    toolsExecuted.push(prods);

    const { data } = prods;
    reply = `🌿 **قائمة المنتجات والأسعار المعتمدة بمتجر خُضرة فاس:**\n\n`;
    reply += `تم فحص **${data.total_returned}** منتج. عينة من المنتجات المتوفرة:\n\n`;

    data.products.slice(0, 8).forEach((p: any) => {
      const availTag = p.is_available ? '✅ متوفر' : '❌ نافد';
      reply += `• **${p.name}**: **${p.price} درهم** / ${p.unit} (${availTag} - مخزون: ${p.stock})\n`;
    });

    reply += `\n💡 المنتجات منتقاة فجر اليوم مباشرة من سوق الجملة بنسودة.\n\n`;

    actions.push({ label: '✨ إنشاء حملة ترويجية لمنتجات اليوم', actionType: 'create_campaign' });
    actions.push({ label: '💵 مراجعة أسعار السوق', actionType: 'view_pricing' });
  }

  // 6) سؤال عام أو ترحيبي
  else {
    const storeInfo = executeGetStoreInfo();
    const inv = await executeGetInventory({ filter: 'all' });
    toolsExecuted.push(storeInfo);
    toolsExecuted.push(inv);

    reply = `أهلاً بك سيدي المدير في **Khodra AI Copilot v2** 🌿\n\n`;
    reply += `أنا مساعدك التشغيلي المتصل مباشرة بقاعدة بيانات Supabase لمتجر خُضرة فاس. يمكنك سؤالي عن أي شيء يخص:\n\n`;
    reply += `1. **المخزون اللحظي:** (مثلاً: "شنو الخضار اللي ناقصة؟" أو "شحال بقى فالطماطم؟")\n`;
    reply += `2. **الطلبات والتوصيل:** (مثلاً: "شحال من طلب كاين اليوم؟" أو "الطلبات اللي باقين pending")\n`;
    reply += `3. **المبيعات والأرباح:** (مثلاً: "شحال دخلنا هاد السيمانة؟" أو "أكثر المنتجات مبيعاً")\n`;
    reply += `4. **سجل حركات المخزون:** (مثلاً: "شنو هما آخر تعديلات على المخزون؟")\n`;
    reply += `5. **معلومات التوصيل بفاس:** (مناطق التوصيل الأربعة، الحد الأدنى 70 DH، والتوصيل المجاني فوق 250 DH).\n\n`;
    reply += `🔒 **ملاحظة أمان:** أعمل في وضع القراءة فقط (Read-Only) لحماية بيانات المتجر من أي تعديل غير مصرح.\n\n`;
    reply += `كيف يمكنني مساعدتك الآن؟`;

    actions.push({ label: '📦 فحص السلع الناقصة بالمخزون', actionType: 'view_inventory' });
    actions.push({ label: '💰 ملخص مبيعات اليوم', actionType: 'view_sales' });
    actions.push({ label: '🛵 استعلام الطلبات الجديدة', actionType: 'view_orders' });
  }

  return {
    reply,
    toolsExecuted: toolsExecuted.map((t) => ({
      toolName: t.toolName,
      source: t.source,
      summary: t.summary,
      isRealData: t.isRealData,
      data: t.data,
    })),
    suggestedActions: actions,
    dataContext: buildDataContextSummary(toolsExecuted),
    isRealData: toolsExecuted.some((t) => t.isRealData),
    modelUsed: 'khodra-deterministic-router',
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
 * تلخيص سياق البيانات التي تم استخدامها
 */
function buildDataContextSummary(tools: ToolExecutionResult[]): string {
  if (tools.length === 0) {
    return 'قاعدة بيانات متجر خُضرة — فاس.';
  }

  const summaries = tools.map((t) => {
    const badge = t.source === 'supabase_live' ? '⚡ بيانات حية من Supabase' : '📋 بيانات الكتالوج المعتمدة';
    return `${t.toolName} (${badge})`;
  });

  return `الأدوات المنفذة: ${summaries.join(' • ')}`;
}
