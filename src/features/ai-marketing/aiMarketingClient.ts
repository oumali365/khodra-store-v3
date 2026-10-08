// ============================================================
// src/features/ai-marketing/aiMarketingClient.ts
// عميل واجهة المستخدم للتواصل مع خادم الذكاء الاصطناعي والتسويق
// ============================================================

import type {
  TemplateAnalysisResult,
  MarketingIdea,
  GeneratedCampaign,
  ProductIntelligenceData,
} from '../../server/aiMarketingService';

export interface DashboardInsightsResponse {
  greeting: string;
  city: string;
  insights: {
    type: 'opportunity' | 'warning' | 'growth';
    title: string;
    description: string;
    action: string;
  }[];
  storeStats: any;
  recentRunsCount: number;
  approvedCampaignsCount: number;
}

export interface CopilotChatResponse {
  reply: string;
  suggestedActions: { label: string; actionType: string; payload?: any }[];
  dataContext: string;
}

export interface PublishQueueItem {
  id: string;
  campaignId: string;
  campaignName: string;
  channel: string;
  payload: any;
  status: 'approved' | 'queued' | 'published';
  idempotencyKey?: string;
  approvedAt: string;
  scheduledAt?: string;
  publishedAt?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  actorRole: string;
  createdAt: string;
}

export async function fetchDashboardInsights(): Promise<DashboardInsightsResponse> {
  try {
    const res = await fetch('/api/ai/dashboard-insights');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (e) {
    console.warn('Using client-side fallback for dashboard insights:', e);
  }

  return {
    greeting: 'صباح الخير والبركة 👋',
    city: 'فاس والنواحي',
    insights: [
      {
        type: 'opportunity',
        title: '🔥 3 فرص تسويقية اليوم',
        description: 'الطلب على خضار الطهي الفاسي (طماطم، بطاطس، بصل) في ذروته، مع وفرة ممتازة في سوق بنسودة.',
        action: 'إنشاء باقة الطبخ',
      },
      {
        type: 'warning',
        title: '⚠️ 2 منتجات تقترب من النفاد',
        description: 'تم تقييد الترويج لها تلقائياً لحين تجديد المخزون فجر الغد لتفادي إلغاء الطلبات.',
        action: 'فحص المخزون',
      },
      {
        type: 'growth',
        title: '📈 إقبال مرتفع على الفواكه وعصائر الصباح',
        description: 'برتقال العصير والموز يحققان نمواً ملحوظاً في سلات العائلات في طريق إيموزار والنرجس.',
        action: 'ترويج الفواكه',
      },
    ],
    storeStats: {
      totalProducts: 100,
      availableProducts: 96,
      lowStockCount: 2,
      currency: 'درهم مغربي (DH)',
    },
    recentRunsCount: 5,
    approvedCampaignsCount: 2,
  };
}

export async function analyzeTemplateApi(
  text: string,
  title?: string,
  templateId?: string
): Promise<TemplateAnalysisResult> {
  const res = await fetch('/api/ai/analyze-template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, title, templateId }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'فشل تحليل القالب');
  }

  return json.data;
}

export async function generateIdeasApi(
  count: number = 10,
  category?: string,
  objective?: string
): Promise<MarketingIdea[]> {
  const res = await fetch('/api/ai/generate-ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count, category, objective }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'فشل توليد الأفكار');
  }

  return json.data;
}

export async function generateCampaignApi(
  prompt: string,
  objective: string = 'زيادة المبيعات',
  category: string = 'all'
): Promise<GeneratedCampaign> {
  const res = await fetch('/api/ai/generate-campaign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, objective, category }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'فشل توليد الحملة');
  }

  return json.data;
}

export async function fetchProductIntelligenceApi(): Promise<ProductIntelligenceData> {
  const res = await fetch('/api/ai/product-intelligence');
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'فشل جلب ذكاء المنتجات');
  }
  return json.data;
}

export async function sendCopilotChatApi(message: string): Promise<CopilotChatResponse> {
  const res = await fetch('/api/ai/copilot-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'فشل معالجة السؤال');
  }

  return json.data;
}

export async function submitPublishQueueApi(payload: {
  campaignId?: string;
  campaignName?: string;
  channel: string;
  postPayload: any;
  idempotencyKey?: string;
}): Promise<PublishQueueItem> {
  const res = await fetch('/api/ai/publish-queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'فشل اعتماد النشر');
  }

  return json.data;
}

export async function fetchPublishQueueApi(): Promise<PublishQueueItem[]> {
  try {
    const res = await fetch('/api/ai/publish-queue');
    if (res.ok) {
      const json = await res.json();
      if (json.success) return json.data || [];
    }
  } catch {}
  return [];
}

export async function fetchAuditLogsApi(): Promise<AuditLogItem[]> {
  try {
    const res = await fetch('/api/ai/audit-logs');
    if (res.ok) {
      const json = await res.json();
      if (json.success) return json.data || [];
    }
  } catch {}
  return [];
}
