// ============================================================
// AdminOrdersPanel.tsx – الإصدار 4.0 (نظيف واحترافي)
// نافذة إدارة الطلبات ومسارات التوصيل الفوري بفاس
// ============================================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Package, Clock, CheckCircle2, XCircle, Search, Loader2,
  Phone, MapPin, MessageCircle, RefreshCw, ShoppingBag, ExternalLink,
  User, TrendingUp, Calendar, AlertCircle, Inbox, Copy, Trash2, Check,
  Printer, ShieldCheck, Bike, ChevronDown, ChevronUp, Send, Save, Percent,
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

export interface AdminOrdersPanelProps {
  isOpen?: boolean;
  standalone?: boolean;
  onClose?: () => void;
  onOrdersChange?: (counts: { total: number; pending: number }) => void;
}

// ─── إعدادات الحالة (بدون "ملغى" في الواجهة الرئيسية) ───
const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  Icon: React.FC<{ className?: string }>;
  pill: string;
  buttonActive: string;
  buttonIdle: string;
}> = {
  pending: {
    label: 'قيد الإنشاء',
    Icon: Clock,
    pill: 'bg-amber-100 text-amber-900 border-amber-300',
    buttonActive: 'bg-amber-500 text-white border-amber-500 shadow-sm',
    buttonIdle: 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50',
  },
  prepared: {
    label: 'تم التجهيز',
    Icon: Package,
    pill: 'bg-blue-100 text-blue-900 border-blue-300',
    buttonActive: 'bg-blue-600 text-white border-blue-600 shadow-sm',
    buttonIdle: 'bg-white text-blue-800 border-blue-300 hover:bg-blue-50',
  },
  delivered: {
    label: 'تم التسليم',
    Icon: CheckCircle2,
    pill: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    buttonActive: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    buttonIdle: 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50',
  },
  cancelled: {
    label: 'ملغى',
    Icon: XCircle,
    pill: 'bg-red-100 text-red-900 border-red-300',
    buttonActive: 'bg-red-600 text-white border-red-600 shadow-sm',
    buttonIdle: 'bg-white text-red-800 border-red-300 hover:bg-red-50',
  },
};

// الفلاتر الظاهرة في الإحصائيات (بدون "ملغى")
const VISIBLE_FILTERS: OrderStatus[] = ['pending', 'prepared', 'delivered'];
const STATUS_ORDER_CHANGEABLE: OrderStatus[] = ['pending', 'prepared', 'delivered'];

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
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ─── تنظيف الملاحظات من المعلومات الزائدة ───
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

function buildOrderText(order: DbOrder): string {
  const lines: string[] = [];
  lines.push(`🛒 طلب ${order.order_code}`);
  lines.push(`👤 العميل: ${order.customer_name}`);
  lines.push(`📞 الهاتف: ${order.phone}`);
  lines.push(`📍 العنوان: ${order.address}`);
  const clean = cleanNote(order.note || '');
  if (clean) lines.push(`📝 ملاحظات: ${clean}`);
  lines.push('');
  lines.push('📦 المنتجات:');
  if (order.items.length === 0) {
    lines.push('  (لا توجد تفاصيل)');
  } else {
    order.items.forEach((it) => {
      const isWeight = /^kg$/i.test(it.variantLabel || '');
      const qtyLabel = isWeight
        ? `${it.qty} kg`
        : `${it.qty}${it.variantLabel ? ` (${it.variantLabel})` : ''}`;
      lines.push(`  - ${it.name} × ${qtyLabel} = ${Number(it.lineTotal).toFixed(2)} DH`);
    });
  }
  lines.push('');
  lines.push(`🚚 التوصيل: ${order.delivery_fee.toFixed(2)} DH`);
  lines.push(`💰 الإجمالي: ${order.total.toFixed(2)} DH`);
  lines.push(`🕐 تاريخ الطلب: ${formatDateTime(order.created_at)}`);
  lines.push(`📌 الحالة: ${STATUS_CONFIG[order.status].label}`);
  return lines.join('\n');
}

function playOrderChime() {
  try {
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
    osc1.connect(gain1); gain1.connect(ctx.destination);
    osc1.start(now); osc1.stop(now + 0.3);
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.start(now + 0.12); osc2.stop(now + 0.55);
  } catch { /* تجاهل */ }
}

function buildDriverDispatchMessage(order: DbOrder, draft?: DeliveryDispatchInfo): string {
  const hub = STORE_PICKUP_HUB;
  const dispatch = draft || order.delivery_dispatch;
  const providerObj = DELIVERY_PROVIDERS.find((p) => p.id === dispatch?.provider) || DELIVERY_PROVIDERS[0];
  const zoneKey = (dispatch?.zone || order.delivery_zone || detectFezZone(order.address || '') || 'north') as keyof typeof FEZ_DELIVERY_ZONES;
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
    order.items.length > 0
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

export const AdminOrdersPanel: React.FC<AdminOrdersPanelProps> = ({
  isOpen = false,
  standalone = false,
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
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<DbOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<DbOrder | null>(null);
  const [bordereauOrder, setBordereauOrder] = useState<DbOrder | null>(null);

  const [expandedDispatchId, setExpandedDispatchId] = useState<string | number | null>(null);
  const [dispatchDrafts, setDispatchDrafts] = useState<Record<string, DeliveryDispatchInfo>>({});
  const [savingDispatchId, setSavingDispatchId] = useState<string | number | null>(null);

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

  useEffect(() => {
    if (!isOpen && !standalone) return;
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
          fetchOrders().then((data) => { if (mounted) setOrders(data); }).catch(() => {});
          if (payload.eventType === 'INSERT') {
            playOrderChime();
            const clientName = payload.new?.client_name || payload.new?.customer_name || 'زبون';
            const code = payload.new?.order_code ? `(${payload.new.order_code})` : '';
            showToast('success', `🔔 طلب جديد من ${clientName} ${code}`);
          }
        },
        (status) => { if (mounted) setIsRealtimeActive(status === 'SUBSCRIBED'); }
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
  }, [isOpen, standalone]);

  useEffect(() => {
    if (standalone) return;
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
  }, [isOpen, standalone]);

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

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const data = await fetchOrders();
    setOrders(data);
    setIsRefreshing(false);
    showToast('success', `تم تحديث القائمة (${data.length} طلب)`);
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
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopiedId(order.id);
        showToast('success', `تم نسخ تفاصيل الطلب ${order.order_code}`);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        showToast('error', 'تعذّر النسخ، حاول مرة أخرى');
      }
    }
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
          zone: detectFezZone(order.address),
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
          provider: 'indrive', driverName: '', driverPhone: '',
          deliveryCost: 25, dispatchStatus: 'ready_for_pickup',
          zone: 'north', packagingType: 'cooler_box',
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
    const res = await updateOrderDispatch(order.id, draft);
    setSavingDispatchId(null);
    if (res.success) {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, delivery_dispatch: draft } : o)));
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
      showToast('success', 'تم نسخ رسالة استدعاء السائق وفتح واتساب لاختيار السائق');
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
      showToast('success', 'تم نسخ نص الإشعار');
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmOrder) return;
    setIsDeleting(true);
    setDeletingId(deleteConfirmOrder.id);
    const res = await deleteOrder(deleteConfirmOrder.id);
    if (res.success) {
      setOrders((prev) => prev.filter((o) => o.id !== deleteConfirmOrder.id && o.order_code !== deleteConfirmOrder.order_code));
      showToast('success', `تم حذف الطلب ${deleteConfirmOrder.order_code}`);
      setDeleteConfirmOrder(null);
    } else {
      showToast('error', `فشل الحذف: ${res.message || 'خطأ غير معروف'}`);
    }
    setIsDeleting(false);
    setDeletingId(null);
  };

  const stats = useMemo(() => {
    const counts = { pending: 0, prepared: 0, delivered: 0, cancelled: 0 };
    if (!Array.isArray(orders)) return counts;
    orders.forEach((o) => {
      const s = o?.status && STATUS_CONFIG[o.status] ? o.status : 'pending';
      counts[s]++;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (!o) return false;
      const orderStatus = o.status && STATUS_CONFIG[o.status] ? o.status : 'pending';
      if (filterStatus !== 'all' && orderStatus !== filterStatus) return false;
      if (!q) return true;
      return (
        String(o.order_code || '').toLowerCase().includes(q) ||
        String(o.customer_name || '').toLowerCase().includes(q) ||
        String(o.phone || '').includes(q) ||
        String(o.address || '').toLowerCase().includes(q)
      );
    });
  }, [orders, filterStatus, searchQuery]);

  if (!isOpen && !standalone) return null;

  const panelBody = (
    <>
      <div className={`relative bg-[#FBF9F5] w-full ${
        standalone
          ? 'max-w-7xl mx-auto shadow-md rounded-3xl min-h-[650px]'
          : 'sm:max-w-4xl shadow-2xl sm:rounded-[28px] max-h-screen sm:max-h-[92vh]'
      } flex flex-col overflow-hidden text-right border border-[#E8E1D3]`}>

          {/* ═══════════ Modern Header with Tabs ═══════════ */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 bg-white border-b border-[#E8E1D3] shrink-0 text-right">
            {/* Tabs Container */}
            <div className="flex w-full sm:w-auto bg-[#F7F4EC] p-1.5 rounded-2xl border border-[#E8E1D3]">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-white text-[#163920] shadow-sm border border-[#E8E1D3]'
                    : 'text-[#787163] hover:text-[#112616] hover:bg-white/50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>إدارة الطلبات</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('fleet')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'fleet'
                    ? 'bg-white text-[#C25E12] shadow-sm border border-[#E8E1D3]'
                    : 'text-[#787163] hover:text-[#112616] hover:bg-white/50'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>مسارات التوصيل</span>
              </button>
            </div>

            {/* Action Buttons & Realtime Indicator */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isRealtimeActive && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black" title="الاستقبال اللحظي مفعّل">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span>مباشر</span>
                </span>
              )}
            </div>
          </div>

          {/* ═══════════ Toast ═══════════ */}
          {toast && (
            <div className={`px-4 py-3 text-xs font-black flex items-center gap-2.5 ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-b-2 border-emerald-200'
                : 'bg-red-50 text-red-900 border-b-2 border-red-200'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          )}

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
              {/* ═══════════ Stats Row (3 فلاتر فقط بدون "ملغى") ═══════════ */}
              <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-white border-b border-[#E8E1D3]">
                {VISIBLE_FILTERS.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.Icon;
                  const isActive = filterStatus === s;
                  return (
                    <button key={s} type="button"
                      onClick={() => setFilterStatus(isActive ? 'all' : s)}
                      className={`p-2.5 rounded-xl border-2 flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                        isActive ? cfg.buttonActive : 'bg-[#F7F4EC] border-[#E8E1D3] hover:border-[#C25E12]/50 hover:bg-white'
                      }`}>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? '' : 'text-[#524B3E]'}`} />
                      <div className="text-right flex-1 min-w-0">
                        <div className={`text-[10px] sm:text-[11px] font-black truncate ${isActive ? '' : 'text-[#524B3E]'}`}>{cfg.label}</div>
                        <div className={`text-base sm:text-lg font-black leading-none tabular-nums ${isActive ? '' : 'text-[#112616]'}`}>{stats[s]}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ═══════════ Search ═══════════ */}
              <div className="p-3 sm:p-4 bg-[#F7F4EC] border-b border-[#E8E1D3] flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787163] pointer-events-none" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث برقم الطلب، الاسم، الهاتف، أو العنوان..."
                    className="w-full pr-9 pl-9 py-2.5 rounded-xl border border-[#E8E1D3] bg-white text-xs sm:text-sm focus:outline-none focus:border-[#163920] focus:ring-2 focus:ring-[#163920]/15 text-[#112616] transition-all" />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F7F4EC] hover:bg-[#EAE2D2] flex items-center justify-center cursor-pointer transition-colors">
                      <X className="w-3 h-3 text-[#524B3E]" />
                    </button>
                  )}
                </div>
                {filterStatus !== 'all' && (
                  <button type="button" onClick={() => setFilterStatus('all')}
                    className="px-3 py-2.5 rounded-xl bg-white border-2 border-[#E8E1D3] hover:border-[#C25E12] text-xs font-black text-[#524B3E] hover:text-[#C25E12] cursor-pointer flex items-center gap-1 shrink-0 transition-colors">
                    <X className="w-3.5 h-3.5" />
                    <span>مسح</span>
                  </button>
                )}
              </div>

              {/* ═══════════ Orders List ═══════════ */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {isLoading ? (
                  <div className="py-16 text-center">
                    <Loader2 className="w-8 h-8 text-[#163920] animate-spin mx-auto mb-3" />
                    <p className="text-xs text-[#787163] font-black">جارٍ تحميل الطلبات...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#F7F4EC] flex items-center justify-center mx-auto mb-3 border-2 border-dashed border-[#E8E1D3]">
                      <Inbox className="w-8 h-8 text-[#787163]" />
                    </div>
                    <p className="text-sm font-black text-[#112616] mb-1">
                      {orders.length === 0 ? 'لا توجد طلبات بعد' : 'لا توجد نتائج مطابقة'}
                    </p>
                    <p className="text-xs text-[#787163]">
                      {orders.length === 0 ? 'ستظهر هنا كل الطلبات' : 'جرّب تغيير الفلتر أو مسح البحث'}
                    </p>
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

                    return (
                      <article key={order.id}
                        className={`bg-white rounded-2xl border-2 p-3.5 sm:p-4 transition-all ${
                          isUpdating || isBeingDeleted
                            ? 'border-amber-400 shadow-md'
                            : 'border-[#E8E1D3] hover:border-[#C25E12]/40 hover:shadow-sm'
                        } ${isBeingDeleted ? 'opacity-60' : ''}`}>

                        {/* ─── Row 1: رقم الطلب + الحالة + الوقت ─── */}
                        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-[#F0E9DA]">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="text-sm sm:text-base font-black text-[#112616] shrink-0 tabular-nums">{order.order_code}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-black shrink-0 ${cfg.pill}`}>
                              <PillIcon className="w-3 h-3" />
                              <span>{cfg.label}</span>
                            </span>
                            {isFreeDelivery && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black shrink-0">
                                <Percent className="w-3 h-3" />
                                <span>توصيل مجاني</span>
                              </span>
                            )}
                            {isUpdating && <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                          </div>
                          <span className="text-[10px] sm:text-[11px] text-[#787163] font-black shrink-0 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {timeAgo(order.created_at)}
                          </span>
                        </div>

                        {/* ─── Row 2: معلومات العميل + الإجمالي فقط ─── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-[#C25E12]/10 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-[#C25E12]" />
                              </div>
                              <span className="font-black text-[#112616] truncate">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-[#C25E12]/10 flex items-center justify-center shrink-0">
                                <Phone className="w-3.5 h-3.5 text-[#C25E12]" />
                              </div>
                              <span className="font-bold text-[#524B3E] tabular-nums" dir="ltr">{order.phone}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-lg bg-[#C25E12]/10 flex items-center justify-center shrink-0 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-[#C25E12]" />
                              </div>
                              <span className="font-medium text-[#524B3E] leading-snug line-clamp-2">{order.address}</span>
                            </div>
                          </div>

                          {/* الإجمالي فقط - تم حذف المنتجات والتوصيل */}
                          <div className="bg-gradient-to-br from-[#F7F4EC] to-white rounded-xl p-3 border border-[#E8E1D3] flex flex-col justify-center">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-[#112616] flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                <span>الإجمالي:</span>
                              </span>
                              <span className="text-lg font-black text-[#C25E12] tabular-nums">{safeTotal.toFixed(2)} DH</span>
                            </div>
                          </div>
                        </div>

                        {/* ─── ملاحظات (منظفة) ─── */}
                        {cleanN && (
                          <div className="mb-3 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-[11px] text-amber-950">
                            <span className="font-medium leading-snug">{cleanN}</span>
                          </div>
                        )}

                        {/* ─── قسم التوصيل ─── */}
                        {(() => {
                          const idKey = String(order.id);
                          const currentDispatch = order.delivery_dispatch;
                          const draft = dispatchDrafts[idKey] || currentDispatch || {
                            provider: 'indrive' as DeliveryProvider,
                            driverName: '', driverPhone: '',
                            deliveryCost: 25,
                            dispatchStatus: 'ready_for_pickup' as DeliveryDispatchStatus,
                            zone: detectFezZone(order.address),
                            packagingType: 'cooler_box',
                          };
                          const isExpanded = expandedDispatchId === order.id;
                          const providerCfg = DELIVERY_PROVIDERS.find((p) => p.id === draft.provider) || DELIVERY_PROVIDERS[0];
                          const zoneCfg = FEZ_DELIVERY_ZONES[draft.zone || 'north'] || FEZ_DELIVERY_ZONES.north;

                          return (
                            <div className="mb-3 rounded-xl border-2 border-emerald-200/90 bg-emerald-50/40 overflow-hidden text-xs">
                              <div className="p-2.5 bg-gradient-to-r from-emerald-100/80 to-emerald-50 flex items-center justify-between gap-2 border-b border-emerald-200">
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                  <span className="inline-flex items-center gap-1 font-black text-emerald-900">
                                    <Bike className="w-4 h-4 text-emerald-700" />
                                    <span>{providerCfg.name}</span>
                                  </span>
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-800">{zoneCfg.name}</span>
                                  {draft.driverName ? (
                                    <span className="text-[11px] font-bold text-stone-700">
                                      السائق: <strong className="text-emerald-950">{draft.driverName}</strong>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-amber-800 font-bold bg-amber-100/70 px-1.5 py-0.5 rounded">بانتظار تخصيص السائق</span>
                                  )}
                                </div>
                                <button type="button" onClick={() => handleToggleDispatchEdit(order)}
                                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white hover:bg-emerald-50 px-2 py-1 rounded-md border border-emerald-300 transition-colors cursor-pointer">
                                  <span>{isExpanded ? 'إخفاء' : 'تعديل السائق'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              {isExpanded && (
                                <div className="p-3 bg-white border-b border-emerald-200 space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-black text-stone-600 mb-1">شركة التوصيل:</label>
                                      <select value={draft.provider}
                                        onChange={(e) => handleUpdateDispatchDraft(order.id, { provider: e.target.value as DeliveryProvider })}
                                        className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white font-bold text-stone-800 focus:outline-emerald-600">
                                        {DELIVERY_PROVIDERS.map((p) => (
                                          <option key={p.id} value={p.id}>{p.name} {p.recommended ? '⭐' : ''}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black text-stone-600 mb-1">منطقة فاس:</label>
                                      <select value={draft.zone || 'north'}
                                        onChange={(e) => handleUpdateDispatchDraft(order.id, { zone: e.target.value as FezZoneId })}
                                        className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white font-bold text-stone-800 focus:outline-emerald-600">
                                        <option value="north">المنطقة الشمالية</option>
                                        <option value="central">المنطقة الوسطى</option>
                                        <option value="south">المنطقة الجنوبية</option>
                                        <option value="east">المنطقة الشرقية</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-black text-stone-600 mb-1">اسم السائق:</label>
                                      <input type="text" value={draft.driverName || ''}
                                        onChange={(e) => handleUpdateDispatchDraft(order.id, { driverName: e.target.value })}
                                        placeholder="مثال: يوسف العلوي"
                                        className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-emerald-600" />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black text-stone-600 mb-1">هاتف السائق:</label>
                                      <input type="tel" value={draft.driverPhone || ''}
                                        onChange={(e) => handleUpdateDispatchDraft(order.id, { driverPhone: e.target.value })}
                                        placeholder="06XXXXXXXX"
                                        className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-emerald-600" dir="ltr" />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black text-stone-600 mb-1">تكلفة التوصيل (DH):</label>
                                      <input type="number" value={draft.deliveryCost ?? 25}
                                        onChange={(e) => handleUpdateDispatchDraft(order.id, { deliveryCost: Number(e.target.value) || 0 })}
                                        className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white font-bold text-stone-800 focus:outline-emerald-600" />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] text-stone-500">نقطة الاستلام: {STORE_PICKUP_HUB.name}</span>
                                    <button type="button" disabled={savingDispatchId === order.id}
                                      onClick={() => handleSaveDispatch(order)}
                                      className="py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
                                      {savingDispatchId === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                      <span>حفظ</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div className="p-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-emerald-50/70">
                                <button type="button" onClick={() => handleSendDriverDispatch(order)}
                                  className="py-1.5 px-2 rounded-lg bg-white hover:bg-emerald-100/70 text-emerald-900 border border-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  title="إرسال بيانات الشحنة للسائق عبر واتساب ونسخها">
                                  <Send className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>استدعاء السائق</span>
                                </button>
                                <button type="button" onClick={() => handleSendCustomerDispatchNotify(order)}
                                  className="py-1.5 px-2 rounded-lg bg-white hover:bg-emerald-100/70 text-emerald-900 border border-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  title="إشعار الزبون بمغادرة الطلب">
                                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                                  <span>إشعار الزبون</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBordereauOrder({ ...order, delivery_dispatch: draft })}
                                  className="py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                  title="معاينة وطباعة ملصق الشحن">
                                  <Printer className="w-3.5 h-3.5 text-[#F5D76E]" />
                                  <span>ملصق الشحن</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ─── أزرار الإجراءات بتصميم شبكة 2×2 متناسقة ومصغرة ─── */}
                        <div className="mb-3 grid grid-cols-2 gap-2">
                          {/* 1. زر الخريطة (مصغر ضمن شبكة 2×2) */}
                          {(() => {
                            const mapHref =
                              order.maps_link ||
                              (order.address
                                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ' فاس')}`
                                : '#');
                            return (
                              <a
                                href={mapHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-l from-[#2563EB] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#1E3A8A] text-white font-black text-xs shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 border-2 border-[#1E40AF]"
                                title={order.maps_link ? 'فتح موقع الزبون الدقيق على الخريطة' : 'البحث عن عنوان الزبون في خرائط جوجل'}
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">فتح الخريطة</span>
                              </a>
                            );
                          })()}

                          {/* 2. زر الفاتورة */}
                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(order)}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white font-black text-xs shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 border-2 border-[#0E2615]"
                            title="معاينة وطباعة الفاتورة"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#F5D76E] shrink-0" />
                            <span className="truncate">الفاتورة</span>
                          </button>

                          {/* 3. زر النسخ */}
                          <button
                            type="button"
                            onClick={() => handleCopyOrder(order)}
                            className={`inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-black text-xs border-2 shadow-xs transition-all cursor-pointer active:scale-95 ${
                              isCopied
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                : 'bg-white hover:bg-[#F7F4EC] text-[#524B3E] hover:text-[#112616] border-[#E8E1D3] hover:border-[#C25E12]/40'
                            }`}
                            title="نسخ تفاصيل الطلب"
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

                          {/* 4. زر الحذف */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmOrder(order)}
                            disabled={isBeingDeleted}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-black text-xs border-2 shadow-xs transition-all cursor-pointer active:scale-95 bg-red-50 hover:bg-red-100 text-red-700 border-red-300 hover:border-red-400 disabled:opacity-60"
                            title="حذف الطلب"
                          >
                            {isBeingDeleted ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                                <span className="truncate">جاري...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">حذف الطلب</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* ─── صف الحالة ─── */}
                        <div className="pt-3 border-t border-[#F0E9DA]">
                          <div className="text-[11px] font-black text-[#787163] mb-2 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#C25E12]" />
                            <span>تغيير الحالة إلى:</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {STATUS_ORDER_CHANGEABLE.map((s) => {
                              const sCfg = STATUS_CONFIG[s];
                              const SIcon = sCfg.Icon;
                              const isActive = safeStatus === s;
                              return (
                                <button key={s} type="button"
                                  disabled={isActive || isUpdating || isBeingDeleted}
                                  onClick={() => handleStatusChange(order.id, s)}
                                  className={`py-2 px-2 rounded-lg border-2 text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all active:scale-95 ${
                                    isActive ? sCfg.buttonActive + ' cursor-default' : sCfg.buttonIdle + ' cursor-pointer'
                                  } disabled:opacity-60`}>
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

              {/* ═══════════ Footer ═══════════ */}
              <div className="p-3 sm:p-4 bg-white border-t border-[#E8E1D3] flex items-center justify-between gap-2 shrink-0">
                <p className="text-[11px] text-[#787163] font-black">
                  عرض <span className="text-[#112616]">{filteredOrders.length}</span> من أصل <span className="text-[#112616]">{orders.length}</span> طلب
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="w-10 h-10 rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] border border-[#E8E1D3] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 text-[#112616]"
                    title="تحديث"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <button type="button" onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white text-xs font-black cursor-pointer active:scale-95 transition-all border-2 border-[#0E2615] shadow-sm">
                    إغلاق
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ═══════════ Delete Confirmation Modal ═══════════ */}
        {deleteConfirmOrder && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteConfirmOrder(null)} />
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
                <span className="text-red-600 font-black">لا يمكن التراجع عن هذا الإجراء.</span>
              </p>
              <div className="bg-[#F7F4EC] p-3.5 rounded-xl border border-[#E8E1D3] mb-4 text-xs text-[#524B3E] space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-black">الهاتف:</span>
                  <span className="tabular-nums" dir="ltr">{deleteConfirmOrder.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-black">الإجمالي:</span>
                  <span className="font-black text-[#C25E12] tabular-nums">{Number(deleteConfirmOrder.total ?? 0).toFixed(2)} DH</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button type="button" disabled={isDeleting} onClick={handleExecuteDelete}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>نعم، حذف</span>
                    </>
                  )}
                </button>
                <button type="button" disabled={isDeleting} onClick={() => setDeleteConfirmOrder(null)}
                  className="py-3 px-4 rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#524B3E] font-black text-sm cursor-pointer active:scale-95 transition-colors">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );

  if (standalone) {
    return (
      <div className="w-full space-y-4">
        {panelBody}
        <OrderInvoiceModal order={invoiceOrder} isOpen={!!invoiceOrder} onClose={() => setInvoiceOrder(null)} />
        <OrderBordereauModal order={bordereauOrder} isOpen={!!bordereauOrder} onClose={() => setBordereauOrder(null)} />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        {panelBody}
      </div>

      <OrderInvoiceModal order={invoiceOrder} isOpen={!!invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      <OrderBordereauModal order={bordereauOrder} isOpen={!!bordereauOrder} onClose={() => setBordereauOrder(null)} />
    </>
  );
};