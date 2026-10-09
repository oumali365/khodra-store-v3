// ============================================================
// src/server/copilotService.ts
// محرك Khodra AI Copilot v2 — المساعد التشغيلي الذكي
// يعتمد على Function Calling الحقيقي والربط المباشر بـ Supabase
// يلتزم بنزاهة البيانات التامة والفصل الصريح بين النجاح/الجدول الفارغ/الفشل
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
}

const COPILOT_SYSTEM_INSTRUCTION = `
أنت "خُضرة AI Copilot v2" — المساعد التشغيلي والإداري الذكي الرسمي لمنصة "خُضرة — فاس" (Khodra Fès).
أنت شريك حقيقي لمدير المتجر وفريق العمليات في مدينة فاس والمغرب.

القواعد الصارمة والإلزامية لنزاهة البيانات والمصداقية:
1. 🔒 وضع القراءة فقط والأمان (Read-Only Security):
   أنت في وضع القراءة والتحليل فقط. لا يمكنك أبداً إجراء تعديلات مباشرة أو حذف أو إضافة على المنتجات أو المخزون أو الطلبات.
   إذا طلب منك المدير تعديل سعر أو تغيير مخزون أو حذف طلب، وضّح له بلطف أن Copilot يعمل بوضع الاستعلام الآمن (Read-Only)، واقترح عليه التوجه للوحة المناسبة وإدخال رمز PIN الإداري.

2. 📊 الدقة والربط المباشر (Strict Grounding):
   يجب أن تعتمد حصرياً على الأدوات المتاحة (Tools) لجلب البيانات الحقيقية من Supabase:
   - get_products: للبحث في الكتالوج، الأسعار، وحالة توفر المنتجات.
   - get_inventory: لتحليل الكميات بالمستودع، المنتجات الناقصة، والمنتجات غير المتوفرة.
   - get_orders: لمتابعة الطلبات، الطلبات الجديدة (pending)، وحالات التوصيل.
   - get_sales_summary: لحساب إجمالي المبيعات، الإيرادات بالدرهم، ومتوسط السلة.
   - get_inventory_movements: للتحقق من سجل حركات المخزون (inventory_ledger).
   - get_store_info: لمعلومات التوصيل بفاس، الأسعار، وعتبة التوصيل المجاني.

3. ⚖️ الفصل الصارم بين حالات البيانات (Crucial Integrity Rule):
   يجب أن تميز بدقة وصراحة بين 4 حالات:
   أ) نجاح جلب البيانات الحقيقية من Supabase: أجب بالبيانات والأرقام الدقيقة الواردة في الأداة.
   ب) نجاح الاتصال ولكن الجدول خالٍ (Empty): وضّح للمدير أن قاعدة البيانات متصلة وسليمة، ولكن لا توجد بيانات مسجلة حالياً في هذه الفترة.
   ج) تعذر الاتصال أو فشل استعلام قاعدة البيانات (Error / Not Configured): صرّح بوضوح وشفافية أن الاتصال بقاعدة البيانات غير متاح حالياً أو حدث خطأ في الاستعلام. لا تدّعِ أبداً أنك حللت بيانات المتجر، ولا تقل أن عدد الطلبات هو صفر أو أن المخزون خالٍ.
   د) الإجابات العامة أو النصائح التسويقية: إذا أجبت بدون استخدام أدوات المتجر، بيّن أنها إرشادات عامة وليست مبنية على بيانات مخزون متجرك الفعلي.

4. 🚫 منع اختلاق البيانات منعاً باتاً (Zero Hallucinations):
   لا تخترع أي أرقام أو كميات أو طلبات غير موجودة في نتائج الأدوات.

5. 🇲🇦 اللهجة والأسلوب المهني:
   تحدث بلغة عربية مهنية واضحة مع فهم تام لخصوصية السوق المغربي ومدينة فاس (سوق الجملة بنسودة، أحياء فاس: طريق إيموزار، النرجس، الأطلس، بنسودة، عين الشقف، المدينة القديمة، العملة بالدرهم DH). تفهم تماماً الدارجة المغربية والفرنسية إذا كتب بها المستخدم.

6. 💡 تقديم التوجيه التشغيلي المفيد عند توفر البيانات:
   عند توفر بيانات حقيقية، قدّم قراءة تشغيلية ذكية ومباشرة تدعم اتخاذ القرار.
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

        const replyText = finalGen.text || 'تم فحص البيانات.';
        const actions = extractSuggestedActions(userMessage, toolsExecuted);
        const hasRealData = toolsExecuted.some((t) => t.isRealData && (t.status === 'success' || t.status === 'empty'));

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
        };
      }

      // إذا رد النموذج مباشرة بنص دون طلب أدوات (إجابة استشارية عامة)
      if (response.text) {
        return {
          reply: response.text,
          toolsExecuted: [],
          suggestedActions: extractSuggestedActions(userMessage, []),
          dataContext: 'إجابة إرشادية عامة (لم يتم استعلام بيانات المتجر الفعلية).',
          isRealData: false,
          modelUsed: GEMINI_MODEL,
        };
      }
    } catch (err) {
      console.warn('[CopilotService] Gemini API execution failed or fell back:', err);
    }
  }

  // ────────────────────────────────────────────────────────────
  // محرك النوايا الحتمي والذاتي (Deterministic Intent Router)
  // يضمن 100% الشفافية والنزاهة حتى عند تعذر Gemini
  // ────────────────────────────────────────────────────────────
  return await executeDeterministicCopilot(userMessage);
}

/**
 * المحرك الحتمي الاحتياطي الذكي:
 * يحلل السؤال، يستدعي نفس الأدوات الحقيقية، وينتج رداً نزيهاً يفرق بين النجاح والفشل
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

    if (inv.status === 'not_configured') {
      reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nقاعدة بيانات Supabase غير مهيأة على الخادم لتعذر العثور على مفاتيح الاتصال.\nتعذر جلب المخزون اللحظي لمتجر خُضرة فاس.\n\nيرجى التحقق من متغيرات البيئة (SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY أو SUPABASE_ANON_KEY).`;
      actions.push({ label: '📦 فتح لوحة المخزون في الإدارة', actionType: 'view_inventory' });
    } else if (inv.status === 'query_error' || inv.status === 'connection_error') {
      reply = `❌ **خطأ في استعلام المخزون:**\n\nتعذر الاتصال بقاعدة البيانات أو حدث خطأ أثناء فحص جدول المنتجات:\n${inv.errorMessage || 'خطأ غير معروف'}\n\nيرجى مراجعة إعدادات قاعدة البيانات أو المحاولة لاحقاً.`;
      actions.push({ label: '📦 فتح لوحة المخزون في الإدارة', actionType: 'view_inventory' });
    } else if (inv.status === 'empty') {
      reply = `📦 **تقرير المخزون — خُضرة فاس:**\n\nتم الاتصال بقاعدة بيانات Supabase بنجاح، ولكن جدول المنتجات لا يحتوي على أصناف مسجلة حالياً.\nيمكنك إضافة المنتجات الجديدة من لوحة إدارة المنتجات.`;
      actions.push({ label: '➕ إضافة منتجات جديدة', actionType: 'view_inventory' });
    } else {
      const { data } = inv;
      const lowCount = data.low_stock_count || 0;
      const outCount = data.out_of_stock_count || 0;

      reply = `📦 **تقرير المخزون اللحظي لمتجر خُضرة فاس (بيانات حية من Supabase):**\n\n`;
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

    if (sales.status === 'not_configured') {
      reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nقاعدة بيانات Supabase غير مهيأة على الخادم. تعذر جلب تقرير المبيعات الحقيقي.\nيرجى التأكد من تهيئة متغيرات الاتصال بـ Supabase.`;
      actions.push({ label: '🛵 عرض الطلبات الحالية', actionType: 'view_orders' });
    } else if (sales.status === 'query_error' || sales.status === 'connection_error') {
      reply = `❌ **خطأ في استعلام المبيعات:**\n\nتعذر حساب تقرير المبيعات بسبب خطأ في قاعدة البيانات:\n${sales.errorMessage || 'خطأ غير معروف'}`;
      actions.push({ label: '🛵 عرض الطلبات الحالية', actionType: 'view_orders' });
    } else if (sales.status === 'empty') {
      reply = `💰 **ملخص المبيعات التشغيلي (${sales.data?.period || 'اليوم'}) — خُضرة فاس:**\n\nتم الاتصال بقاعدة البيانات بنجاح: لا توجد طلبات مسجلة في هذه الفترة المحددة حتى الآن لحساب الإيرادات والمبيعات.`;
      actions.push({ label: '🛵 عرض الطلبات', actionType: 'view_orders' });
      actions.push({ label: '📢 إطلاق حملة تسويقية لتنشيط المبيعات', actionType: 'create_campaign' });
    } else {
      const { data } = sales;
      reply = `💰 **ملخص المبيعات التشغيلي (${data.period}) — خُضرة فاس (بيانات حية):**\n\n`;
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
      }

      actions.push({ label: '🛵 عرض الطلبات الحالية', actionType: 'view_orders' });
      actions.push({ label: '📢 إطلاق حملة تسويقية لتنشيط المبيعات', actionType: 'create_campaign' });
    }
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

    if (orders.status === 'not_configured') {
      reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nقاعدة بيانات Supabase غير مهيأة على الخادم. تعذر جلب سجل الطلبات الحقيقي للمتجر.\nيرجى التأكد من توفر إعدادات البيئة (SUPABASE_URL و المفاتيح).`;
      actions.push({ label: '🛵 الذهاب لإدارة الطلبات والأسطول', actionType: 'view_orders' });
    } else if (orders.status === 'query_error' || orders.status === 'connection_error') {
      reply = `❌ **خطأ في استعلام الطلبات:**\n\nتعذر جلب الطلبات بسبب خطأ في قاعدة البيانات:\n${orders.errorMessage || 'خطأ غير معروف'}`;
      actions.push({ label: '🛵 الذهاب لإدارة الطلبات والأسطول', actionType: 'view_orders' });
    } else if (orders.status === 'empty') {
      reply = `🛵 **حالة الطلبات الحالية (${orders.data?.period_label || 'اليوم'}):**\n\nتم الاتصال بقاعدة البيانات بنجاح: لا توجد طلبات مسجلة حالياً في النظام تطابق هذا البحث.`;
      actions.push({ label: '🛵 لوحة إدارة الطلبات', actionType: 'view_orders' });
    } else {
      const { data } = orders;
      reply = `🛵 **حالة الطلبات الحالية (${data.period_label}) — بيانات حية من Supabase:**\n\n`;
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
      }

      actions.push({ label: '🛵 الذهاب لإدارة الطلبات والأسطول', actionType: 'view_orders' });
    }
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

    if (movements.status === 'not_configured') {
      reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nقاعدة بيانات Supabase غير مهيأة على الخادم. تعذر جلب سجل حركات وتدقيق المخزون (inventory_ledger).`;
      actions.push({ label: '📦 فحص المخزون الحالي', actionType: 'view_inventory' });
    } else if (movements.status === 'query_error' || movements.status === 'connection_error') {
      reply = `❌ **خطأ في استعلام سجل التدقيق:**\n\nتعذر جلب حركات المخزون بسبب خطأ في قاعدة البيانات:\n${movements.errorMessage || 'خطأ غير معروف'}`;
      actions.push({ label: '📦 فحص المخزون الحالي', actionType: 'view_inventory' });
    } else if (movements.status === 'empty') {
      reply = `📋 **سجل حركات وتدقيق المخزون (Inventory Ledger):**\n\nتم الاتصال بقاعدة البيانات بنجاح: سجل التدقيق (inventory_ledger) خالٍ حالياً. يتم تسجيل الحركات تلقائياً عند اعتماد الطلبات أو إرجاعها أو إدخال السلع الصباحية.`;
      actions.push({ label: '📦 فحص المخزون الحالي', actionType: 'view_inventory' });
    } else {
      const { data } = movements;
      reply = `📋 **سجل حركات وتدقيق المخزون (Inventory Ledger) — بيانات حية:**\n\n`;
      reply += `تم تسجيل **${data.total_movements}** حركة أخيرة:\n\n`;
      data.movements.slice(0, 6).forEach((m: any) => {
        reply += `• **${m.product_name}** (${m.movement_type_arabic}): **${m.delta_formatted}**\n`;
        reply += `  المخزون السابق: ${m.stock_before} ⬅️ المخزون الحالي: **${m.stock_after}**\n`;
        reply += `  السبب: ${m.reason} (${new Date(m.created_at).toLocaleTimeString('ar-MA')})\n\n`;
      });
      actions.push({ label: '📦 فحص المخزون الحالي', actionType: 'view_inventory' });
    }
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

    if (prods.status === 'not_configured') {
      reply = `⚠️ **تنبيه الاتصال بقاعدة البيانات:**\n\nقاعدة بيانات Supabase غير مهيأة على الخادم. تعذر جلب قائمة المنتجات وأسعارها الحقيقية.\nيرجى التأكد من إعدادات الاتصال بـ Supabase.`;
      actions.push({ label: '💵 مراجعة أسعار السوق في الإدارة', actionType: 'view_pricing' });
    } else if (prods.status === 'query_error' || prods.status === 'connection_error') {
      reply = `❌ **خطأ في استعلام المنتجات:**\n\nتعذر جلب المنتجات بسبب خطأ في قاعدة البيانات:\n${prods.errorMessage || 'خطأ غير معروف'}`;
      actions.push({ label: '💵 مراجعة أسعار السوق في الإدارة', actionType: 'view_pricing' });
    } else if (prods.status === 'empty') {
      reply = `🌿 **قائمة المنتجات بمتجر خُضرة فاس:**\n\nتم الاتصال بقاعدة البيانات بنجاح: لا توجد منتجات مسجلة حالياً في جدول products.`;
      actions.push({ label: '➕ إضافة منتجات جديدة', actionType: 'view_inventory' });
    } else {
      const { data } = prods;
      reply = `🌿 **قائمة المنتجات والأسعار المعتمدة بمتجر خُضرة فاس (بيانات حية من Supabase):**\n\n`;
      reply += `تم فحص **${data.total_returned}** منتج مسجل. عينة من المنتجات:\n\n`;

      data.products.slice(0, 8).forEach((p: any) => {
        const availTag = p.is_available ? '✅ متوفر' : '❌ نافد';
        reply += `• **${p.name}**: **${p.price} درهم** / ${p.unit} (${availTag} - مخزون: ${p.stock})\n`;
      });

      reply += `\n💡 يمكنك مراجعة وتعديل الأسعار والمخزون مباشرة من لوحات الإدارة.\n\n`;
      actions.push({ label: '✨ إنشاء حملة ترويجية لمنتجات اليوم', actionType: 'create_campaign' });
      actions.push({ label: '💵 مراجعة أسعار السوق', actionType: 'view_pricing' });
    }
  }

  // 6) سؤال عام أو ترحيبي
  else {
    const storeInfo = executeGetStoreInfo();
    toolsExecuted.push(storeInfo);

    reply = `أهلاً بك سيدي المدير في **Khodra AI Copilot v2** 🌿\n\n`;
    reply += `أنا مساعدك التشغيلي المتصل بقاعدة بيانات متجر خُضرة فاس. يمكنك سؤالي عن أي شيء يخص:\n\n`;
    reply += `1. **المخزون اللحظي:** (مثلاً: "شنو الخضار اللي ناقصة؟" أو "شحال بقى فالطماطم؟")\n`;
    reply += `2. **الطلبات والتوصيل:** (مثلاً: "شحال من طلب كاين اليوم؟" أو "الطلبات اللي باقين pending")\n`;
    reply += `3. **المبيعات والأرباح:** (مثلاً: "شحال دخلنا هاد السيمانة؟" أو "أكثر المنتجات مبيعاً")\n`;
    reply += `4. **سجل حركات المخزون:** (مثلاً: "شنو هما آخر تعديلات على المخزون؟")\n`;
    reply += `5. **معلومات وسياسات التوصيل بفاس:** (مناطق التوصيل الأربعة، الحد الأدنى 70 DH، والتوصيل المجاني فوق 250 DH).\n\n`;
    reply += `🔒 **ملاحظة أمان:** أعمل في وضع القراءة فقط (Read-Only) لحماية بيانات المتجر من أي تعديل غير مصرح.\n\n`;
    reply += `كيف يمكنني مساعدتك الآن؟`;

    actions.push({ label: '📦 فحص المخزون', actionType: 'view_inventory' });
    actions.push({ label: '💰 ملخص مبيعات اليوم', actionType: 'view_sales' });
    actions.push({ label: '🛵 استعلام الطلبات الجديدة', actionType: 'view_orders' });
  }

  const hasRealData = toolsExecuted.some((t) => t.isRealData && (t.status === 'success' || t.status === 'empty'));

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
