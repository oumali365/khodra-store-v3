// ============================================================
// AdminOrdersPanel.tsx – الإصدار 5.0 (المُحدَّث والشامل)
// لوحة التحكم المتقدمة في الطلبات ومسارات التوصيل الفوري بفاس
// تصميم متناسق ومتقن مع هوية خضرة v4 ونظام التشغيل الكامل
// ============================================================
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  Phone,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  User,
  TrendingUp,
  Calendar,
  AlertCircle,
  Inbox,
  Copy,
  Trash2,
  Check,
  Printer,
  Sparkles,
  ShieldCheck,
  Bike,
  Navigation,
  ChevronDown,
  ChevronUp,
  Send,
  Save,
  Percent,
  Download,
  PhoneCall,
  SlidersHorizontal,
  Bell,
  BellOff,
  Coins,
  Layers,
} from 'lucide-react';
import {
  fetchOrders,
  updateOrderStatus,
  deleteOrder,
  subscribeToOrdersChanges,
  unsubscribeFromOrdersChanges,
  updateOrderDispatch,
  detectFezZone,
  DbOrder,
  OrderStatus,
} from '../../services/supabaseService';
import { OrderInvoiceModal } from './OrderInvoiceModal';
import { OrderBordereauModal } from './OrderBordereauModal';
import { AdminDeliveryFleetTab } from './AdminDeliveryFleetTab';
import {
  DELIVERY_PROVIDERS,
  FEZ_DELIVERY_ZONES,
  STORE_PICKUP_HUB,
  STORE_CONFIG,
} from '../../data/config';
import {
  DeliveryProvider,
  DeliveryDispatchStatus,
  DeliveryDispatchInfo,
  FezZoneId,
} from '../../types';

interface AdminOrdersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOrdersChange?: (counts: { total: number; pending: number }) => void;
}

// ─── إعدادات وتنسيقات الحالات ───
const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    Icon: React.FC<{ className?: string }>;
    pill: string;
    buttonActive: string;
    buttonIdle: string;
    dotColor: string;
  }
> = {
  pending: {
    label: 'قيد الإنشاء',
    Icon: Clock,
    pill: 'bg-amber-100 text-amber-900 border-amber-300',
    buttonActive: 'bg-amber-500 text-white border-amber-500 shadow-sm font-black',
    buttonIdle: 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50',
    dotColor: 'bg-amber-500',
  },
  prepared: {
    label: 'تم التجهيز',
    Icon: Package,
    pill: 'bg-blue-100 text-blue-900 border-blue-300',
    buttonActive: 'bg-blue-600 text-white border-blue-600 shadow-sm font-black',
    buttonIdle: 'bg-white text-blue-800 border-blue-300 hover:bg-blue-50',
    dotColor: 'bg-blue-500',
  },
  delivered: {
    label: 'تم التسليم',
    Icon: CheckCircle2,
    pill: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    buttonActive: 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black',
    buttonIdle: 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50',
    dotColor: 'bg-emerald-500',
  },
  cancelled: {
    label: 'ملغى',
    Icon: XCircle,
    pill: 'bg-red-100 text-red-900 border-red-300',
    buttonActive: 'bg-red-600 text-white border-red-600 shadow-sm font-black',
    buttonIdle: 'bg-white text-red-800 border-red-300 hover:bg-red-50',
    dotColor: 'bg-red-500',
  },
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'prepared', 'delivered', 'cancelled'];
const STATUS_CHANGE_OPTIONS: OrderStatus[] = ['pending', 'prepared', 'delivered', 'cancelled'];

// ─── أدوات مساعدة ───
function toWhatsApp(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('212')) return digits;
  if (digits.startsWith('0')) return '212' + digits.slice(1);
  return digits;
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} د`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} س`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `منذ ${days} ي`;
    return new Date(dateStr).toLocaleDateString('ar-MA', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('ar-MA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ─── تنظيف الملاحظات من النصوص التقنية ───
function cleanNote(note: string): string {
  if (!note) return '';
  return note
    .split(' | ')
    .filter((part) => {
      const p = part.trim();
      if (!p) return false;
      if (/وقت\s*التسليم/.test(p)) return false;
      if (/طريقة\s*الدفع/.test(p)) return false;
      if (/رابط\s*الخريطة/.test(p)) return false;
      if (/^المنتجات\s*:/.test(p)) return false;
      if (/^التوصيل\s*:/.test(p)) return false;
      if (/google\.com\/maps/.test(p)) return false;
      return true;
    })
    .join(' • ');
}

// ─── بناء نص تفاصيل الطلب للنسخ ───
function buildOrderText(order: DbOrder): string {
  const lines: string[] = [];
  lines.push(`🌿 *طلب جديد من متجر خُضرة ${order.order_code}*`);
  lines.push(`👤 العميل: ${order.customer_name}`);
  lines.push(`📞 الهاتف: ${order.phone}`);
  lines.push(`📍 العنوان: ${order.address}`);
  if (order.maps_link) {
    lines.push(`🗺️ رابط الخريطة: ${order.maps_link}`);
  }
  const clean = cleanNote(order.note || '');
  if (clean) lines.push(`📝 ملاحظات: ${clean}`);
  lines.push('');
  lines.push(`📦 محتويات السلة (${order.items.length} أصناف):`);
  if (!order.items || order.items.length === 0) {
    lines.push('  (تفاصيل الأصناف غير محددة)');
  } else {
    order.items.forEach((it) => {
      const isWeight = /^kg$/i.test(it.variantLabel || '');
      const qtyLabel = isWeight
        ? `${it.qty} kg`
        : `${it.qty}${it.variantLabel ? ` (${it.variantLabel})` : ''}`;
      lines.push(`  • ${it.icon || '▫️'} ${it.name} × ${qtyLabel} = ${Number(it.lineTotal).toFixed(2)} DH`);
    });
  }
  lines.push('');
  lines.push(`💰 المجموع الفرعي: ${order.subtotal.toFixed(2)} DH`);
  lines.push(`🚚 رسوم التوصيل: ${order.delivery_fee.toFixed(2)} DH`);
  lines.push(`💵 الإجمالي النهائي: ${order.total.toFixed(2)} DH`);
  lines.push(`🕐 وقت الطلب: ${formatDateTime(order.created_at)}`);
  lines.push(`📌 الحالة: ${STATUS_CONFIG[order.status]?.label || order.status}`);
  return lines.join('\n');
}

// ─── تشغيل رنين التنبيه الصوتي عند وصول طلب جديد ───
function playOrderChime() {
  try {
    const isSoundEnabled = localStorage.getItem('khodra_notification_sound') !== 'false';
    if (!isSoundEnabled) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.14, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    /* ignore */
  }
}

// ─── رسالة واتساب لاستدعاء السائق ───
function buildDriverDispatchMessage(order: DbOrder, draft?: DeliveryDispatchInfo): string {
  const hub = STORE_PICKUP_HUB;
  const dispatch = draft || order.delivery_dispatch;
  const providerObj = DELIVERY_PROVIDERS.find((p) => p.id === dispatch?.provider) || DELIVERY_PROVIDERS[0];
  const zoneKey = (dispatch?.zone || order.delivery_zone || detectFezZone(order.address || '') || 'north') as FezZoneId;
  const zoneInfo = FEZ_DELIVERY_ZONES[zoneKey] || FEZ_DELIVERY_ZONES.north;
  const driverGreeting = dispatch?.driverName
    ? `السلام عليكم كابتن *${dispatch.driverName}* 🛵`
    : 'السلام عليكم كابتن التوصيل 🛵';
  const mapUrl =
    order.maps_link ||
    (order.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ' فاس')}`
      : '');
  const cleanN = cleanNote(order.note || '');
  const deliveryCost = dispatch?.deliveryCost ?? 25;
  const safeTotal = Number(order.total ?? 0);

  const itemsPreview =
    order.items && order.items.length > 0
      ? order.items
          .slice(0, 6)
          .map((it) => {
            const isWeight = /^kg$/i.test(it.variantLabel || '');
            const qtyLabel = isWeight
              ? `${it.qty} kg`
              : `${it.qty}${it.variantLabel ? ` (${it.variantLabel})` : ''}`;
            return `• ${it.name} × ${qtyLabel}`;
          })
          .join('\n') + (order.items.length > 6 ? `\n• +${order.items.length - 6} أصناف أخرى` : '')
      : '• صندوق خضار وفواكه طازجة';

  return [
    `${driverGreeting}`,
    `🌿 *طلب توصيل فوري - متجر خُضرة*`,
    `🔖 *رقم الطلب:* ${order.order_code}`,
    `🚴 *الخدمة:* ${providerObj.name}`,
    `🧭 *المسار:* ${zoneInfo.name} (${zoneInfo.targetTime})`,
    `────────────────────`,
    `1️⃣ *نقطة الاستلام (التموين):*`,
    `🏪 ${hub.name}`,
    `📍 ${hub.address}`,
    `🗺️ موقع الاستلام: ${hub.mapsLink}`,
    `📞 هاتف الإدارة: ${STORE_CONFIG.whatsappNumber}`,
    `────────────────────`,
    `2️⃣ *وجهة التسليم (الزبون):*`,
    `👤 *الاسم:* ${order.customer_name}`,
    `📞 *الهاتف:* ${order.phone}`,
    `🏠 *العنوان:* ${order.address}`,
    mapUrl ? `🗺️ *رابط الموقع (GPS):* ${mapUrl}` : '',
    cleanN ? `📝 *ملاحظة الزبون:* ${cleanN}` : '',
    `────────────────────`,
    `3️⃣ *تفاصيل الطرد والتحصيل (COD):*`,
    `📦 *الشحنة:* صندوق عازل (${order.items.length} أصناف)`,
    itemsPreview,
    `🚚 *أجرة التوصيل المتفق عليها:* ${deliveryCost} درهم`,
    `💵 *المبلغ المطلوب تحصيله من الزبون (COD): ${safeTotal.toFixed(2)} درهم* (نقداً عند التسليم)`,
    `────────────────────`,
    `⚠️ يرجى الاتصال بالزبون فور الوصول والمحافظة على استقامة الصندوق. طريق السلامة! 🌟`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── رسالة إشعار الزبون بانطلاق الطلب ───
function buildCustomerNotifyMessage(order: DbOrder, draft?: DeliveryDispatchInfo): string {
  const dispatch = draft || order.delivery_dispatch;
  const provider = DELIVERY_PROVIDERS.find((p) => p.id === dispatch?.provider)?.name || 'inDrive Delivery';
  const driverName = dispatch?.driverName || 'مندوب التوصيل';
  const driverPhone = dispatch?.driverPhone || '';
  return `مرحباً ${order.customer_name} 👋

طلبك #${order.order_code} من *متجر خُضرة* في الطريق إليك! 🚴🌿

📍 خدمة التوصيل: ${provider}
👤 السائق: ${driverName}
${driverPhone ? `📞 رقم السائق: ${driverPhone}\n` : ''}⏰ الوصول المتوقع: خلال 25-45 دقيقة

💵 المبلغ المطلوب عند الاستلام: *${Number(order.total ?? 0).toFixed(2)} درهم*

شكراً لثقتك في خُضرة 🌿`;
}

// ─── تصدير الطلبات إلى ملف Excel / CSV (يدعم العربية بـ BOM) ───
function exportOrdersToCsv(orders: DbOrder[]) {
  const headers = [
    'رقم الطلب',
    'العميل',
    'الهاتف',
    'العنوان',
    'المنطقة',
    'عدد الأصناف',
    'المجموع الفرعي (DH)',
    'رسوم التوصيل (DH)',
    'الإجمالي النهائي (DH)',
    'الحالة',
    'شركة التوصيل',
    'اسم السائق',
    'هاتف السائق',
    'أجرة السائق (DH)',
    'تاريخ الطلب',
    'ملاحظات الزبون',
  ];

  const rows = orders.map((o) => {
    const zoneKey = (o.delivery_zone || o.delivery_dispatch?.zone || 'north') as FezZoneId;
    const zoneName = FEZ_DELIVERY_ZONES[zoneKey]?.name || 'فاس';
    const providerName = DELIVERY_PROVIDERS.find((p) => p.id === o.delivery_dispatch?.provider)?.name || '-';
    return [
      `"${o.order_code}"`,
      `"${(o.customer_name || '').replace(/"/g, '""')}"`,
      `"${(o.phone || '').replace(/"/g, '""')}"`,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      `"${zoneName}"`,
      o.items?.length || 0,
      o.subtotal.toFixed(2),
      o.delivery_fee.toFixed(2),
      o.total.toFixed(2),
      `"${STATUS_CONFIG[o.status]?.label || o.status}"`,
      `"${providerName}"`,
      `"${(o.delivery_dispatch?.driverName || '').replace(/"/g, '""')}"`,
      `"${(o.delivery_dispatch?.driverPhone || '').replace(/"/g, '""')}"`,
      (o.delivery_dispatch?.deliveryCost ?? 25).toFixed(2),
      `"${formatDateTime(o.created_at)}"`,
      `"${cleanNote(o.note || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `khodra_orders_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const AdminOrdersPanel: React.FC<AdminOrdersPanelProps> = ({
  isOpen,
  onClose,
  onOrdersChange,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'fleet'>('orders');
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // فلاتر وبحث وترتيب
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [filterZone, setFilterZone] = useState<FezZoneId | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_price'>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // إشعار Toast ونسخ
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // نوافذ فرعية
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<DbOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<DbOrder | null>(null);
  const [bordereauOrder, setBordereauOrder] = useState<DbOrder | null>(null);

  // قوائم المنتجات المفتوحة (Accordion)
  const [expandedItemsIds, setExpandedItemsIds] = useState<Set<string | number>>(new Set());

  // تخصيص التوصيل والسائق
  const [expandedDispatchId, setExpandedDispatchId] = useState<string | number | null>(null);
  const [dispatchDrafts, setDispatchDrafts] = useState<Record<string, DeliveryDispatchInfo>>({});
  const [savingDispatchId, setSavingDispatchId] = useState<string | number | null>(null);

  // إعداد الصوت
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('khodra_notification_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('khodra_notification_sound', String(next));
      } catch {}
      showToast('success', next ? '🔔 تم تفعيل التنبيهات الصوتية' : '🔇 تم كتم التنبيهات الصوتية');
      return next;
    });
  };

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // حماية من التكرار اللانهائي لإعادة التصيير
  const lastNotifiedRef = useRef<{ total: number; pending: number } | null>(null);

  useEffect(() => {
    if (!onOrdersChange) return;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const total = orders.length;

    if (
      !lastNotifiedRef.current ||
      lastNotifiedRef.current.total !== total ||
      lastNotifiedRef.current.pending !== pending
    ) {
      lastNotifiedRef.current = { total, pending };
      try {
        onOrdersChange({ total, pending });
      } catch (err) {
        console.warn('onOrdersChange callback error:', err);
      }
    }
  }, [orders, onOrdersChange]);

  // جلب الطلبات والاشتراك في التحديثات الحية
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setIsLoading(true);

    fetchOrders()
      .then((data) => {
        if (mounted) {
          setOrders(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch orders in AdminOrdersPanel:', err);
        if (mounted) setIsLoading(false);
      });

    let channel: any = null;
    try {
      channel = subscribeToOrdersChanges(
        (payload) => {
          if (!mounted) return;
          if (payload.eventType === 'DELETE' || (payload.eventType === 'UPDATE' && payload.new?.is_deleted)) {
            const removedId = payload.old?.id || payload.new?.id;
            const removedCode = payload.old?.order_code || payload.new?.order_code;
            setOrders((prev) =>
              prev.filter((o) => String(o.id) !== String(removedId) && o.order_code !== removedCode)
            );
            return;
          }
          fetchOrders()
            .then((data) => {
              if (mounted) setOrders(data);
            })
            .catch(() => {});
          if (payload.eventType === 'INSERT') {
            playOrderChime();
            const clientName = payload.new?.client_name || payload.new?.customer_name || 'زبون';
            const code = payload.new?.order_code ? `(${payload.new.order_code})` : '';
            showToast('success', `🔔 طلب جديد من ${clientName} ${code}`);
          }
        },
        (status) => {
          if (mounted) setIsRealtimeActive(status === 'SUBSCRIBED');
        }
      );
    } catch (err) {
      console.warn('Realtime subscription error in AdminOrdersPanel:', err);
    }

    return () => {
      mounted = false;
      if (channel) {
        try {
          unsubscribeFromOrdersChanges(channel);
        } catch {}
      }
    };
  }, [isOpen, showToast]);

  // قفل تمرير الصفحة ومنع تجمد الشاشة
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.pointerEvents = '';
      setDeleteConfirmOrder(null);
      setInvoiceOrder(null);
      setBordereauOrder(null);
      setExpandedDispatchId(null);
    }
    return () => {
      try {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.pointerEvents = '';
      } catch {}
    };
  }, [isOpen]);

  // إغلاق النوافذ الفرعية بالتسلسل عند الضغط على Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirmOrder) {
          setDeleteConfirmOrder(null);
        } else if (invoiceOrder) {
          setInvoiceOrder(null);
        } else if (bordereauOrder) {
          setBordereauOrder(null);
        } else if (expandedDispatchId !== null) {
          setExpandedDispatchId(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleteConfirmOrder, invoiceOrder, bordereauOrder, expandedDispatchId, onClose]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const data = await fetchOrders();
    setOrders(data);
    setIsRefreshing(false);
    showToast('success', `تم تحديث قائمة الطلبات (${data.length} طلب)`);
  };

  const handleStatusChange = async (orderId: string | number, newStatus: OrderStatus) => {
    const previous = orders.find((o) => o.id === orderId);
    if (!previous || previous.status === newStatus) return;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    setUpdatingId(orderId);
    const res = await updateOrderStatus(orderId, newStatus);
    if (!res.success) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: previous.status } : o)));
      showToast('error', `فشل التحديث: ${res.message || 'خطأ غير معروف'}`);
    } else {
      showToast('success', `تم تحديث الطلب ${previous.order_code} إلى "${STATUS_CONFIG[newStatus].label}"`);
    }
    setUpdatingId(null);
  };

  const handleCopyOrder = async (order: DbOrder) => {
    const text = buildOrderText(order);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(order.id);
      showToast('success', `تم نسخ تفاصيل الطلب ${order.order_code}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopiedId(order.id);
        showToast('success', `تم نسخ تفاصيل الطلب ${order.order_code}`);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        showToast('error', 'تعذّر النسخ، يرجى المحاولة يدوياً');
      }
    }
  };

  const toggleItemsAccordion = (orderId: string | number) => {
    setExpandedItemsIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleToggleDispatchEdit = (order: DbOrder) => {
    const idKey = String(order.id);
    if (!dispatchDrafts[idKey]) {
      setDispatchDrafts((prev) => ({
        ...prev,
        [idKey]: order.delivery_dispatch || {
          provider: 'indrive',
          driverName: '',
          driverPhone: '',
          deliveryCost: 25,
          dispatchStatus: 'ready_for_pickup',
          zone: (order.delivery_zone || detectFezZone(order.address)) as FezZoneId,
          packagingType: 'cooler_box',
        },
      }));
    }
    setExpandedDispatchId((prev) => (prev === order.id ? null : order.id));
  };

  const handleUpdateDispatchDraft = (orderId: string | number, patch: Partial<DeliveryDispatchInfo>) => {
    const idKey = String(orderId);
    setDispatchDrafts((prev) => ({
      ...prev,
      [idKey]: {
        ...(prev[idKey] || {
          provider: 'indrive',
          driverName: '',
          driverPhone: '',
          deliveryCost: 25,
          dispatchStatus: 'ready_for_pickup',
          zone: 'north',
          packagingType: 'cooler_box',
        }),
        ...patch,
      },
    }));
  };

  const handleSaveDispatch = async (order: DbOrder) => {
    const idKey = String(order.id);
    const draft = dispatchDrafts[idKey];
    if (!draft) return;
    setSavingDispatchId(order.id);
    const res = await updateOrderDispatch(order.id, order.order_code, draft);
    setSavingDispatchId(null);
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, delivery_dispatch: draft, delivery_zone: draft.zone || o.delivery_zone } : o
        )
      );
      showToast('success', `تم حفظ بيانات التوصيل للطلب ${order.order_code}`);
      setExpandedDispatchId(null);
    } else {
      showToast('error', `فشل الحفظ: ${res.message || 'خطأ غير معروف'}`);
    }
  };

  const handleSendDriverDispatch = (order: DbOrder) => {
    const draft = dispatchDrafts[String(order.id)] || order.delivery_dispatch;
    const driverPhone = draft?.driverPhone;
    const msg = buildDriverDispatchMessage(order, draft);
    try {
      navigator.clipboard.writeText(msg).catch(() => {});
    } catch {}
    if (driverPhone) {
      const wa = toWhatsApp(driverPhone);
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
      showToast('success', 'تم نسخ الرسالة وفتح واتساب لإرسال بيانات الشحنة للسائق');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      showToast('success', 'تم نسخ تفاصيل المسار وفتح واتساب لاختيار السائق');
    }
  };

  const handleSendCustomerDispatchNotify = (order: DbOrder) => {
    const draft = dispatchDrafts[String(order.id)] || order.delivery_dispatch;
    const msg = buildCustomerNotifyMessage(order, draft);
    const wa = toWhatsApp(order.phone);
    if (wa) {
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
      showToast('success', 'تم فتح واتساب لإشعار الزبون');
    } else {
      navigator.clipboard.writeText(msg);
      showToast('success', 'تم نسخ نص الإشعار للزبون');
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmOrder) return;
    setIsDeleting(true);
    setDeletingId(deleteConfirmOrder.id);
    const res = await deleteOrder(deleteConfirmOrder.id);
    if (res.success) {
      setOrders((prev) =>
        prev.filter((o) => o.id !== deleteConfirmOrder.id && o.order_code !== deleteConfirmOrder.order_code)
      );
      showToast('success', `تم حذف الطلب ${deleteConfirmOrder.order_code}`);
      setDeleteConfirmOrder(null);
    } else {
      showToast('error', `فشل الحذف: ${res.message || 'خطأ غير معروف'}`);
    }
    setIsDeleting(false);
    setDeletingId(null);
  };

  // ─── الإحصائيات الشاملة ───
  const stats = useMemo(() => {
    const counts = { pending: 0, prepared: 0, delivered: 0, cancelled: 0 };
    let activeRevenue = 0;
    if (!Array.isArray(orders)) return { counts, activeRevenue, totalCount: 0 };

    orders.forEach((o) => {
      const s = o?.status && STATUS_CONFIG[o.status] ? o.status : 'pending';
      counts[s]++;
      if (s !== 'cancelled') {
        activeRevenue += Number(o.total || 0);
      }
    });
    return { counts, activeRevenue, totalCount: orders.length };
  }, [orders]);

  // ─── التصفية والفرز ───
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    const q = searchQuery.trim().toLowerCase();

    const filtered = orders.filter((o) => {
      if (!o) return false;
      const orderStatus = o.status && STATUS_CONFIG[o.status] ? o.status : 'pending';
      if (filterStatus !== 'all' && orderStatus !== filterStatus) return false;

      const orderZone = o.delivery_zone || o.delivery_dispatch?.zone || detectFezZone(o.address || '');
      if (filterZone !== 'all' && orderZone !== filterZone) return false;

      if (!q) return true;

      const itemsMatch =
        Array.isArray(o.items) &&
        o.items.some((it) => it.name && it.name.toLowerCase().includes(q));

      return (
        String(o.order_code || '').toLowerCase().includes(q) ||
        String(o.customer_name || '').toLowerCase().includes(q) ||
        String(o.phone || '').includes(q) ||
        String(o.address || '').toLowerCase().includes(q) ||
        itemsMatch
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'highest_price') {
        return Number(b.total || 0) - Number(a.total || 0);
      }
      // default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [orders, filterStatus, filterZone, searchQuery, sortBy]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-0 sm:p-4 select-none"
        role="dialog"
        aria-modal="true"
      >
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-[#FBF9F5] w-full sm:max-w-5xl shadow-2xl z-10 sm:rounded-[28px] flex flex-col max-h-screen sm:max-h-[92vh] overflow-hidden text-right border border-[#E8E1D3]">

          {/* ═══════════ Header — هوية خضرة الفاخرة ═══════════ */}
          <div className="relative p-4 sm:p-5 bg-gradient-to-l from-[#163920] via-[#122F1B] to-[#0A1C10] text-white flex items-center justify-between shrink-0 shadow-md overflow-hidden">
            {/* زخارف ضوئية ذهبية */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,rgba(245,215,110,0.18),transparent_65%)] pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
                <ShoppingBag className="w-5 h-5 text-[#F5D76E]" />
                {stats.counts.pending > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#0A1C10] shadow-md animate-pulse">
                    {stats.counts.pending > 99 ? '99+' : stats.counts.pending}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-base sm:text-lg text-white">إدارة الطلبات والتوصيل</h2>
                  <Sparkles className="w-4 h-4 text-[#F5D76E]" />
                </div>
                <p className="text-[11px] sm:text-xs text-emerald-100/90 font-bold flex items-center gap-1.5">
                  <span>{stats.totalCount} طلب مسجل</span>
                  <span>•</span>
                  <span className="text-[#F5D76E]">{stats.counts.pending} بانتظار التجهيز</span>
                  <span>•</span>
                  <span>{stats.activeRevenue.toFixed(0)} د.م إيرادات</span>
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* مؤشر الربط اللحظي */}
              {isRealtimeActive && (
                <span
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-400/30 text-[10px] font-black backdrop-blur-xs"
                  title="الاستقبال اللحظي للطلبات مفعّل عبر Supabase Realtime"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span>مباشر</span>
                </span>
              )}

              {/* زر تفعيل/كتم الصوت */}
              <button
                type="button"
                onClick={toggleSound}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center transition-all cursor-pointer border border-white/15"
                title={soundEnabled ? 'كتم التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية'}
              >
                {soundEnabled ? (
                  <Bell className="w-4 h-4 text-[#F5D76E]" />
                ) : (
                  <BellOff className="w-4 h-4 text-stone-300" />
                )}
              </button>

              {/* زر تصدير Excel CSV */}
              <button
                type="button"
                onClick={() => exportOrdersToCsv(filteredOrders)}
                disabled={filteredOrders.length === 0}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 border border-white/15"
                title="تصدير الطلبات المعروضة إلى ملف Excel (CSV)"
              >
                <Download className="w-4 h-4 text-emerald-200" />
              </button>

              {/* زر التحديث */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 border border-white/15"
                title="تحديث قائمة الطلبات"
              >
                <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* زر الإغلاق */}
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 flex items-center justify-center transition-all cursor-pointer border border-white/20"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* ═══════════ Toast الإشعارات ═══════════ */}
          {toast && (
            <div
              className={`px-4 py-3 text-xs font-black flex items-center gap-2.5 transition-all shadow-xs ${
                toast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-950 border-b-2 border-emerald-300'
                  : 'bg-red-50 text-red-950 border-b-2 border-red-300'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="flex-1">{toast.message}</span>
            </div>
          )}

          {/* ═══════════ أزرار التبويبات (Tabs) ═══════════ */}
          <div className="flex border-b border-[#E8E1D3] bg-white text-xs font-black shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-[#163920] text-[#163920] bg-emerald-50/50'
                  : 'border-transparent text-[#787163] hover:text-[#112616] hover:bg-[#F7F4EC]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>إدارة الطلبات</span>
              <span className="px-2 py-0.5 rounded-full bg-[#163920]/10 text-[#163920] text-[10px] font-black">
                {orders.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fleet')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'fleet'
                  ? 'border-[#C25E12] text-[#C25E12] bg-amber-50/50'
                  : 'border-transparent text-[#787163] hover:text-[#112616] hover:bg-[#F7F4EC]'
              }`}
            >
              <Bike className="w-4 h-4 text-[#C25E12]" />
              <span>مسارات التوصيل والأسطول</span>
              <span className="px-2 py-0.5 rounded-full bg-[#C25E12]/15 text-[#C25E12] text-[10px] font-black">
                inDrive + فاس
              </span>
            </button>
          </div>

          {activeTab === 'fleet' ? (
            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              <AdminDeliveryFleetTab
                orders={orders}
                onSelectOrderForBordereau={(o) => setBordereauOrder(o)}
                onOpenOrderInvoice={(o) => setInvoiceOrder(o)}
                showToast={showToast}
              />
            </div>
          ) : (
            <>
              {/* ═══════════ شريط إحصائيات وفلاتر الحالات (Status Filter Cards) ═══════════ */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 sm:p-4 bg-white border-b border-[#E8E1D3]">
                {/* 1. الكل */}
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    filterStatus === 'all'
                      ? 'bg-stone-800 text-white border-stone-800 shadow-sm'
                      : 'bg-[#F7F4EC] border-[#E8E1D3] hover:border-stone-400 text-stone-800'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <div className="text-right flex-1 min-w-0">
                    <div className="text-[10px] font-black truncate">كل الطلبات</div>
                    <div className="text-base sm:text-lg font-black leading-none tabular-nums">
                      {stats.totalCount}
                    </div>
                  </div>
                </button>

                {/* الحالات الفردية */}
                {ALL_STATUSES.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.Icon;
                  const isActive = filterStatus === s;
                  const count = stats.counts[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFilterStatus(isActive ? 'all' : s)}
                      className={`p-2.5 rounded-xl border-2 flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                        isActive
                          ? cfg.buttonActive
                          : 'bg-[#F7F4EC] border-[#E8E1D3] hover:border-[#C25E12]/50 hover:bg-white text-[#524B3E]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="text-right flex-1 min-w-0">
                        <div className="text-[10px] font-black truncate">{cfg.label}</div>
                        <div className="text-base sm:text-lg font-black leading-none tabular-nums">
                          {count}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ═══════════ شريط البحث والتصفية المتقدمة ═══════════ */}
              <div className="p-3 sm:p-4 bg-[#F7F4EC] border-b border-[#E8E1D3] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* حقل البحث السريع */}
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787163] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث برقم الطلب، العميل، الهاتف، العنوان أو الصنف..."
                    className="w-full pr-9 pl-9 py-2.5 rounded-xl border border-[#E8E1D3] bg-white text-xs sm:text-sm focus:outline-none focus:border-[#163920] focus:ring-2 focus:ring-[#163920]/15 text-[#112616] transition-all placeholder:text-stone-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F7F4EC] hover:bg-[#EAE2D2] flex items-center justify-center cursor-pointer transition-colors"
                      title="مسح البحث"
                    >
                      <X className="w-3 h-3 text-[#524B3E]" />
                    </button>
                  )}
                </div>

                {/* فلتر المنطقة */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={filterZone}
                    onChange={(e) => setFilterZone(e.target.value as FezZoneId | 'all')}
                    className="py-2.5 px-3 rounded-xl border border-[#E8E1D3] bg-white text-xs font-black text-[#112616] focus:outline-none focus:border-[#163920] cursor-pointer"
                  >
                    <option value="all">كل مناطق فاس (4 مسارات)</option>
                    <option value="north">🟢 المنطقة الشمالية (الأطلس، النرجس)</option>
                    <option value="central">🟡 المنطقة الوسطى (إيموزار، فلورنس)</option>
                    <option value="south">🟠 المنطقة الجنوبية (عين الشقف، الزهور)</option>
                    <option value="east">🟣 المنطقة الشرقية (المرينيين، المدينة القديمة)</option>
                  </select>

                  {/* فرز الترتيب */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="py-2.5 px-3 rounded-xl border border-[#E8E1D3] bg-white text-xs font-black text-[#112616] focus:outline-none focus:border-[#163920] cursor-pointer"
                  >
                    <option value="newest">الأحدث أولاً</option>
                    <option value="oldest">الأقدم أولاً</option>
                    <option value="highest_price">الأعلى قيمة (DH)</option>
                  </select>

                  {/* زر مسح كل الفلاتر عند التفعيل */}
                  {(filterStatus !== 'all' || filterZone !== 'all' || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterZone('all');
                        setSearchQuery('');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-white border-2 border-red-200 hover:border-red-400 text-xs font-black text-red-700 cursor-pointer flex items-center gap-1 transition-colors"
                      title="إعادة ضبط الفلاتر"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>إلغاء التصفية</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ═══════════ قائمة الطلبات (Orders Cards Stream) ═══════════ */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 bg-[#FAF8F4]">
                {isLoading ? (
                  <div className="py-20 text-center space-y-3">
                    <Loader2 className="w-9 h-9 text-[#163920] animate-spin mx-auto" />
                    <p className="text-xs text-[#787163] font-black">جارٍ تحميل وتحديث الطلبات...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-20 text-center max-w-sm mx-auto">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 border-2 border-dashed border-[#E8E1D3] shadow-xs">
                      <Inbox className="w-8 h-8 text-[#787163]" />
                    </div>
                    <p className="text-sm font-black text-[#112616] mb-1">
                      {orders.length === 0 ? 'لا توجد طلبات مسجلة حتى الآن' : 'لا توجد طلبات مطابقة لمعايير البحث'}
                    </p>
                    <p className="text-xs text-[#787163] mb-4">
                      {orders.length === 0
                        ? 'ستظهر هنا طلبات العملاء فور تسجيلها في المتجر'
                        : 'جرّب تغيير حالة الطلب أو البحث بكلمات أخرى'}
                    </p>
                    {(filterStatus !== 'all' || filterZone !== 'all' || searchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterStatus('all');
                          setFilterZone('all');
                          setSearchQuery('');
                        }}
                        className="py-2 px-4 rounded-xl bg-emerald-800 text-white font-black text-xs cursor-pointer shadow-xs active:scale-95"
                      >
                        عرض جميع الطلبات
                      </button>
                    )}
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const safeStatus: OrderStatus =
                      order.status && STATUS_CONFIG[order.status] ? order.status : 'pending';
                    const cfg = STATUS_CONFIG[safeStatus];
                    const PillIcon = cfg.Icon;
                    const isUpdating = updatingId === order.id;
                    const isBeingDeleted = deletingId === order.id;
                    const wa = toWhatsApp(order.phone || '');
                    const isCopied = copiedId === order.id;
                    const isFreeDelivery = Number(order.delivery_fee ?? 0) === 0;
                    const cleanN = cleanNote(order.note || '');
                    const safeTotal = Number(order.total ?? 0);
                    const safeSubtotal = Number(order.subtotal ?? (safeTotal - Number(order.delivery_fee ?? 0)));
                    const isItemsExpanded = expandedItemsIds.has(order.id);

                    const zoneKey = (order.delivery_zone ||
                      order.delivery_dispatch?.zone ||
                      detectFezZone(order.address || '')) as FezZoneId;
                    const zoneInfo = FEZ_DELIVERY_ZONES[zoneKey] || FEZ_DELIVERY_ZONES.north;

                    const mapHref =
                      order.maps_link ||
                      (order.address
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            order.address + ' فاس'
                          )}`
                        : '#');

                    return (
                      <article
                        key={order.id}
                        className={`bg-white rounded-2xl border-2 p-3.5 sm:p-4 transition-all shadow-xs ${
                          isUpdating || isBeingDeleted
                            ? 'border-amber-400 bg-amber-50/20'
                            : 'border-[#E8E1D3] hover:border-[#C25E12]/50 hover:shadow-md'
                        } ${isBeingDeleted ? 'opacity-50' : ''}`}
                      >
                        {/* ─── السطر 1: رقم الطلب + شارة الحالة + المنطقة + التوقيت ─── */}
                        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-[#F0E9DA] flex-wrap">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="text-sm sm:text-base font-black text-[#112616] tabular-nums tracking-wide">
                              {order.order_code}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-black shrink-0 ${cfg.pill}`}
                            >
                              <PillIcon className="w-3 h-3" />
                              <span>{cfg.label}</span>
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black shrink-0 ${zoneInfo.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${zoneInfo.dotColor}`} />
                              <span>{zoneInfo.name}</span>
                            </span>
                            {isFreeDelivery && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-black shrink-0">
                                <Percent className="w-3 h-3 text-emerald-600" />
                                <span>توصيل مجاني</span>
                              </span>
                            )}
                            {isUpdating && <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#787163] font-bold">
                            <span className="flex items-center gap-1" title={formatDateTime(order.created_at)}>
                              <Calendar className="w-3 h-3" />
                              <span>{timeAgo(order.created_at)}</span>
                            </span>
                          </div>
                        </div>

                        {/* ─── السطر 2: معلومات العميل والعنوان والمجموع ─── */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                          {/* بيانات العميل والتواصل */}
                          <div className="md:col-span-8 space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-[#C25E12]/10 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-[#C25E12]" />
                              </div>
                              <span className="font-black text-[#112616] text-sm">{order.customer_name}</span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="w-6 h-6 rounded-lg bg-[#C25E12]/10 flex items-center justify-center shrink-0">
                                <Phone className="w-3.5 h-3.5 text-[#C25E12]" />
                              </div>
                              <a
                                href={`tel:${order.phone}`}
                                className="font-black text-emerald-800 hover:text-emerald-950 hover:underline tabular-nums"
                                dir="ltr"
                                title="اتصال هاتفي مباشر"
                              >
                                {order.phone}
                              </a>
                              {wa && (
                                <a
                                  href={`https://wa.me/${wa}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] font-bold text-[10px] transition-colors"
                                  title="محادثة واتساب"
                                >
                                  <MessageCircle className="w-3 h-3 text-[#25D366]" />
                                  <span>واتساب</span>
                                </a>
                              )}
                            </div>

                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-lg bg-[#C25E12]/10 flex items-center justify-center shrink-0 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-[#C25E12]" />
                              </div>
                              <div className="leading-snug">
                                <span className="font-bold text-[#2A2721]">{order.address}</span>
                              </div>
                            </div>
                          </div>

                          {/* ملخص المبلغ المالي */}
                          <div className="md:col-span-4 bg-gradient-to-br from-[#FAF8F4] to-white rounded-xl p-3 border border-[#E8E1D3] flex flex-col justify-center space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[#787163]">
                              <span>المنتجات:</span>
                              <span className="font-bold tabular-nums">{safeSubtotal.toFixed(2)} DH</span>
                            </div>
                            <div className="flex items-center justify-between text-[#787163]">
                              <span>التوصيل:</span>
                              <span className="font-bold tabular-nums">
                                {isFreeDelivery ? 'مجاني' : `${Number(order.delivery_fee).toFixed(2)} DH`}
                              </span>
                            </div>
                            <div className="pt-1.5 border-t border-[#E8E1D3] flex items-center justify-between">
                              <span className="font-black text-[#112616] flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                <span>الإجمالي:</span>
                              </span>
                              <span className="text-base sm:text-lg font-black text-[#C25E12] tabular-nums">
                                {safeTotal.toFixed(2)} DH
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ─── ملاحظات العميل ─── */}
                        {cleanN && (
                          <div className="mb-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2">
                            <span className="font-black shrink-0">📝 ملاحظة:</span>
                            <span className="font-medium leading-relaxed">{cleanN}</span>
                          </div>
                        )}

                        {/* ─── Accordion المنتجات المفصلة (جديد: يتيح مراجعة الأصناف فوراً) ─── */}
                        <div className="mb-3 rounded-xl border border-[#E8E1D3] overflow-hidden bg-[#FAF8F4]">
                          <button
                            type="button"
                            onClick={() => toggleItemsAccordion(order.id)}
                            className="w-full px-3 py-2 flex items-center justify-between text-xs font-black text-[#112616] hover:bg-[#F2EEE4] transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-[#163920]" />
                              <span>
                                محتويات السلة ({order.items?.length || 0} أصناف)
                              </span>
                            </span>
                            <span className="text-[11px] text-[#787163] flex items-center gap-1 font-bold">
                              <span>{isItemsExpanded ? 'إخفاء التفاصيل' : 'عرض الأصناف'}</span>
                              {isItemsExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </span>
                          </button>

                          {isItemsExpanded && (
                            <div className="p-3 bg-white border-t border-[#E8E1D3] space-y-2">
                              {order.items && order.items.length > 0 ? (
                                <div className="divide-y divide-stone-100">
                                  {order.items.map((it, idx) => {
                                    const isWeight = /^kg$/i.test(it.variantLabel || '');
                                    const qtyText = isWeight
                                      ? `${it.qty} kg`
                                      : `${it.qty} × ${it.variantLabel || 'وحدة'}`;
                                    return (
                                      <div
                                        key={idx}
                                        className="py-1.5 flex items-center justify-between text-xs font-bold"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-base select-none">{it.icon || '🥬'}</span>
                                          <span className="text-[#112616] truncate">{it.name}</span>
                                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F4] border border-[#E8E1D3] text-[#524B3E]">
                                            {qtyText}
                                          </span>
                                        </div>
                                        <span className="text-stone-800 tabular-nums shrink-0">
                                          {Number(it.lineTotal).toFixed(2)} DH
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-[#787163] text-center py-2">
                                  لا توجد تفاصيل أصناف مخزنة لهذا الطلب
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ─── صندوق التوصيل وإدارة السائق (inDrive, DONE, Yassir) ─── */}
                        {(() => {
                          const idKey = String(order.id);
                          const currentDispatch = order.delivery_dispatch;
                          const draft = dispatchDrafts[idKey] || currentDispatch || {
                            provider: 'indrive' as DeliveryProvider,
                            driverName: '',
                            driverPhone: '',
                            deliveryCost: 25,
                            dispatchStatus: 'ready_for_pickup' as DeliveryDispatchStatus,
                            zone: zoneKey,
                            packagingType: 'cooler_box',
                          };
                          const isExpanded = expandedDispatchId === order.id;
                          const providerCfg =
                            DELIVERY_PROVIDERS.find((p) => p.id === draft.provider) || DELIVERY_PROVIDERS[0];

                          return (
                            <div className="mb-3 rounded-xl border-2 border-emerald-200/90 bg-emerald-50/40 overflow-hidden text-xs">
                              {/* شريط السائق المخصص */}
                              <div className="p-2.5 bg-gradient-to-r from-emerald-100/90 to-emerald-50 flex items-center justify-between gap-2 border-b border-emerald-200 flex-wrap">
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                  <span className="inline-flex items-center gap-1 font-black text-emerald-950">
                                    <Bike className="w-4 h-4 text-emerald-700" />
                                    <span>{providerCfg.name}</span>
                                  </span>
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-800">
                                    {zoneInfo.name}
                                  </span>
                                  {draft.driverName ? (
                                    <span className="text-[11px] font-bold text-stone-700">
                                      السائق: <strong className="text-emerald-950 font-black">{draft.driverName}</strong>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-amber-900 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md">
                                      بانتظار تخصيص السائق
                                    </span>
                                  )}
                                  {draft.deliveryCost && (
                                    <span className="text-[10px] text-stone-600 font-bold">
                                      (الأجرة: {draft.deliveryCost} DH)
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDispatchEdit(order)}
                                  className="text-[11px] font-black text-emerald-900 hover:text-emerald-950 flex items-center gap-1 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors cursor-pointer shadow-xs"
                                >
                                  <span>{isExpanded ? 'إخفاء الإعدادات' : 'تعديل السائق والمسار'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              {/* نموذج تعديل التوصيل والسائق */}
                              {isExpanded && (
                                <div className="p-3 bg-white border-b border-emerald-200 space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-black text-stone-700 mb-1">
                                        تطبيق أو شركة التوصيل:
                                      </label>
                                      <select
                                        value={draft.provider}
                                        onChange={(e) =>
                                          handleUpdateDispatchDraft(order.id, {
                                            provider: e.target.value as DeliveryProvider,
                                          })
                                        }
                                        className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white font-bold text-stone-800 focus:outline-emerald-600"
                                      >
                                        {DELIVERY_PROVIDERS.map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.name} {p.recommended ? '⭐ (الموصى به)' : ''}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black text-stone-700 mb-1">
                                        منطقة فاس (المسار الذكي):
                                      </label>
                                      <select
                                        value={draft.zone || zoneKey}
                                        onChange={(e) =>
                                          handleUpdateDispatchDraft(order.id, {
                                            zone: e.target.value as FezZoneId,
                                          })
                                        }
                                        className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white font-bold text-stone-800 focus:outline-emerald-600"
                                      >
                                        <option value="north">🟢 المنطقة الشمالية (الأطلس، النرجس)</option>
                                        <option value="central">🟡 المنطقة الوسطى (طريق إيموزار، فلورنس)</option>
                                        <option value="south">🟠 المنطقة الجنوبية (عين الشقف، الزهور)</option>
                                        <option value="east">🟣 المنطقة الشرقية (المرينيين، فاس البالي)</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-black text-stone-700 mb-1">
                                        اسم السائق:
                                      </label>
                                      <input
                                        type="text"
                                        value={draft.driverName || ''}
                                        onChange={(e) =>
                                          handleUpdateDispatchDraft(order.id, { driverName: e.target.value })
                                        }
                                        placeholder="مثال: يوسف العلوي"
                                        className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-emerald-600 font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black text-stone-700 mb-1">
                                        هاتف السائق:
                                      </label>
                                      <input
                                        type="tel"
                                        value={draft.driverPhone || ''}
                                        onChange={(e) =>
                                          handleUpdateDispatchDraft(order.id, { driverPhone: e.target.value })
                                        }
                                        placeholder="06XXXXXXXX"
                                        className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-emerald-600 font-bold"
                                        dir="ltr"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black text-stone-700 mb-1">
                                        أجرة التوصيل للسائق (DH):
                                      </label>
                                      <input
                                        type="number"
                                        value={draft.deliveryCost ?? 25}
                                        onChange={(e) =>
                                          handleUpdateDispatchDraft(order.id, {
                                            deliveryCost: Number(e.target.value) || 0,
                                          })
                                        }
                                        className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white font-black text-stone-800 focus:outline-emerald-600"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] text-stone-500 font-medium">
                                      مقر التموين: {STORE_PICKUP_HUB.name}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={savingDispatchId === order.id}
                                      onClick={() => handleSaveDispatch(order)}
                                      className="py-1.5 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                                    >
                                      {savingDispatchId === order.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Save className="w-3.5 h-3.5" />
                                      )}
                                      <span>حفظ بيانات التوصيل</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* أزرار التواصل السريع الخاصة بالتوصيل */}
                              <div className="p-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-emerald-50/80">
                                <button
                                  type="button"
                                  onClick={() => handleSendDriverDispatch(order)}
                                  className="py-1.5 px-2 rounded-lg bg-white hover:bg-emerald-100/70 text-emerald-900 border border-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  title="إرسال بيانات الشحنة للسائق عبر واتساب ونسخها"
                                >
                                  <Send className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>استدعاء السائق</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSendCustomerDispatchNotify(order)}
                                  className="py-1.5 px-2 rounded-lg bg-white hover:bg-emerald-100/70 text-emerald-900 border border-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  title="إشعار الزبون بمغادرة الطلب"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                                  <span>إشعار الزبون</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBordereauOrder({ ...order, delivery_dispatch: draft })}
                                  className="py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                                  title="معاينة وطباعة ملصق الشحن للصندوق"
                                >
                                  <Printer className="w-3.5 h-3.5 text-[#F5D76E]" />
                                  <span>ملصق الشحن</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ─── أزرار الإجراءات الأساسية (شبكة منظمة 4×1 أو 2×2) ─── */}
                        <div className="mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {/* 1. فتح الخريطة GPS */}
                          <a
                            href={mapHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-l from-[#2563EB] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#1E3A8A] text-white font-black text-xs shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 border-2 border-[#1E40AF]"
                            title="فتح موقع الزبون على الخريطة"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">فتح الخريطة</span>
                          </a>

                          {/* 2. الفاتورة */}
                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(order)}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white font-black text-xs shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 border-2 border-[#0E2615]"
                            title="معاينة وطباعة فاتورة الطلب للزبون"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#F5D76E] shrink-0" />
                            <span className="truncate">الفاتورة</span>
                          </button>

                          {/* 3. نسخ تفاصيل الطلب */}
                          <button
                            type="button"
                            onClick={() => handleCopyOrder(order)}
                            className={`inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-black text-xs border-2 shadow-xs transition-all cursor-pointer active:scale-95 ${
                              isCopied
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                                : 'bg-white hover:bg-[#F7F4EC] text-[#524B3E] hover:text-[#112616] border-[#E8E1D3] hover:border-[#C25E12]/50'
                            }`}
                            title="نسخ ملخص الطلب إلى الحافظة"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span className="truncate">تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">نسخ الطلب</span>
                              </>
                            )}
                          </button>

                          {/* 4. حذف الطلب */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmOrder(order)}
                            disabled={isBeingDeleted}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-black text-xs border-2 shadow-xs transition-all cursor-pointer active:scale-95 bg-red-50 hover:bg-red-100 text-red-700 border-red-300 hover:border-red-400 disabled:opacity-50"
                            title="حذف الطلب نهائياً"
                          >
                            {isBeingDeleted ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                                <span className="truncate">جارٍ الحذف...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">حذف الطلب</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* ─── أزرار تغيير الحالة المباشرة ─── */}
                        <div className="pt-3 border-t border-[#F0E9DA]">
                          <div className="text-[11px] font-black text-[#787163] mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#C25E12]" />
                              <span>تحديث حالة الطلب إلى:</span>
                            </span>
                            <span className="text-[10px] text-stone-500 font-bold">
                              الحالية: {cfg.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {STATUS_CHANGE_OPTIONS.map((s) => {
                              const sCfg = STATUS_CONFIG[s];
                              const SIcon = sCfg.Icon;
                              const isActive = safeStatus === s;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={isActive || isUpdating || isBeingDeleted}
                                  onClick={() => handleStatusChange(order.id, s)}
                                  className={`py-2 px-2 rounded-xl border-2 text-[11px] font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                                    isActive
                                      ? sCfg.buttonActive + ' cursor-default'
                                      : sCfg.buttonIdle + ' cursor-pointer'
                                  } disabled:opacity-60`}
                                >
                                  <SIcon className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{sCfg.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {/* ═══════════ شريط القاع (Footer) ═══════════ */}
              <div className="p-3 sm:p-4 bg-white border-t border-[#E8E1D3] flex items-center justify-between gap-2 shrink-0">
                <p className="text-[11px] text-[#787163] font-black">
                  عرض <span className="text-[#112616] font-black">{filteredOrders.length}</span> من أصل{' '}
                  <span className="text-[#112616] font-black">{orders.length}</span> طلب مسجل
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportOrdersToCsv(filteredOrders)}
                    disabled={filteredOrders.length === 0}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E8E1D3] hover:border-emerald-600 text-xs font-black text-stone-700 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تصدير Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white text-xs font-black cursor-pointer active:scale-95 transition-all border-2 border-[#0E2615] shadow-xs"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ═══════════ نافذة تأكيد الحذف الآمن ═══════════ */}
        {deleteConfirmOrder && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteConfirmOrder(null)}
            />
            <div className="relative bg-white border-2 border-red-300 rounded-[24px] w-full max-w-sm shadow-2xl z-10 overflow-hidden p-6 text-right animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="font-black text-base text-[#112616] text-center mb-2">تأكيد حذف الطلب</h3>
              <p className="text-xs text-[#787163] text-center mb-4 leading-relaxed">
                هل أنت متأكد من حذف الطلب
                <strong className="text-[#112616]"> {deleteConfirmOrder.order_code} </strong>
                للعميل
                <strong className="text-[#112616]"> {deleteConfirmOrder.customer_name} </strong>
                نهائياً؟
                <br />
                <span className="text-red-600 font-black">لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.</span>
              </p>
              <div className="bg-[#FAF8F4] p-3.5 rounded-xl border border-[#E8E1D3] mb-4 text-xs text-[#524B3E] space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-black">الهاتف:</span>
                  <span className="tabular-nums font-bold" dir="ltr">
                    {deleteConfirmOrder.phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-black">المبلغ المطلوب:</span>
                  <span className="font-black text-[#C25E12] tabular-nums">
                    {Number(deleteConfirmOrder.total ?? 0).toFixed(2)} DH
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleExecuteDelete}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارٍ الحذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>نعم، حذف الطلب</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmOrder(null)}
                  className="py-3 px-4 rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#524B3E] font-black text-sm cursor-pointer active:scale-95 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* نوافذ الفاتورة وملصق الشحن */}
      <OrderInvoiceModal
        order={invoiceOrder}
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />
      <OrderBordereauModal
        order={bordereauOrder}
        isOpen={!!bordereauOrder}
        onClose={() => setBordereauOrder(null)}
      />
    </>
  );
};
