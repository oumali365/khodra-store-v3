// ============================================================
// AdminOrdersPanel.tsx – الإصدار 3.0
// نافذة إدارة الطلبات والأسطول الفوري بفاس (inDrive, DONE, Yassir)
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Package, Clock, CheckCircle2, XCircle, Search, Loader2,
  Phone, MapPin, MessageCircle, RefreshCw, ShoppingBag, ExternalLink,
  User, TrendingUp, Calendar, AlertCircle, Inbox, Copy, Trash2, Check,
  Printer, Sparkles, ShieldCheck, Percent, Bike, Truck, Navigation,
  ChevronDown, ChevronUp, Send, Save, Share2, Layers,
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
} from '../../data/config';
import { DeliveryProvider, DeliveryDispatchStatus, DeliveryDispatchInfo, FezZoneId } from '../../types';

interface AdminOrdersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOrdersChange?: (counts: { total: number; pending: number }) => void;
}

const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  Icon: React.FC<{ className?: string }>;
  pill: string;
  buttonActive: string;
  buttonIdle: string;
  dot: string;
}> = {
  pending: {
    label: 'قيد الإنشاء',
    Icon: Clock,
    pill: 'bg-amber-100 text-amber-900 border-amber-300',
    buttonActive: 'bg-amber-500 text-white border-amber-500 shadow-sm',
    buttonIdle: 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50',
    dot: 'bg-amber-500',
  },
  prepared: {
    label: 'تم التجهيز',
    Icon: Package,
    pill: 'bg-blue-100 text-blue-900 border-blue-300',
    buttonActive: 'bg-blue-600 text-white border-blue-600 shadow-sm',
    buttonIdle: 'bg-white text-blue-800 border-blue-300 hover:bg-blue-50',
    dot: 'bg-blue-500',
  },
  delivered: {
    label: 'تم التسليم',
    Icon: CheckCircle2,
    pill: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    buttonActive: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    buttonIdle: 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'ملغى',
    Icon: XCircle,
    pill: 'bg-red-100 text-red-900 border-red-300',
    buttonActive: 'bg-red-600 text-white border-red-600 shadow-sm',
    buttonIdle: 'bg-white text-red-800 border-red-300 hover:bg-red-50',
    dot: 'bg-red-500',
  },
};

const STATUS_ORDER: OrderStatus[] = ['pending', 'prepared', 'delivered', 'cancelled'];
const STATUS_ORDER_CHANGEABLE: OrderStatus[] = ['pending', 'prepared', 'delivered'];

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

function buildOrderText(order: DbOrder): string {
  const lines: string[] = [];
  lines.push(`🛒 طلب ${order.order_code}`);
  lines.push(`👤 العميل: ${order.customer_name}`);
  lines.push(`📞 الهاتف: ${order.phone}`);
  lines.push(`📍 العنوان: ${order.address}`);

  if (order.note) {
    order.note.split(' | ').forEach((part) => {
      lines.push(`• ${part}`);
    });
  }

  lines.push('');
  lines.push('📦 المنتجات:');
  if (order.items.length === 0) {
    lines.push('  (لا توجد تفاصيل)');
  } else {
    order.items.forEach((it) => {
      const variant = it.variantLabel ? ` (${it.variantLabel})` : '';
      lines.push(`  - ${it.name}${variant} × ${it.qty} = ${Number(it.lineTotal).toFixed(2)} DH`);
    });
  }

  lines.push('');
  lines.push(`🚚 التوصيل: ${order.delivery_fee.toFixed(2)} DH`);
  lines.push(`💰 الإجمالي: ${order.total.toFixed(2)} DH`);
  lines.push('');
  lines.push(`🕐 تاريخ الطلب: ${formatDateTime(order.created_at)}`);
  lines.push(`📌 الحالة: ${STATUS_CONFIG[order.status].label}`);

  return lines.join('\n');
}

// دالة نغمة تنبيه صوتية لطيفة عند وصول طلب جديد
function playOrderChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

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
    // تجاهل قيود المتصفح إذا لم يتفاعل الزائر بعد
  }
}

// دالة رسالة استدعاء وتفويض سائق التوصيل الفوري (inDrive, DONE, Yassir)
function buildDriverDispatchMessage(order: DbOrder): string {
  const hub = STORE_PICKUP_HUB;
  const dispatch = order.delivery_dispatch;
  const providerObj = DELIVERY_PROVIDERS.find((p) => p.id === dispatch?.provider) || DELIVERY_PROVIDERS[0];

  return `السلام عليكم 🚴
طلب توصيل عبر (${providerObj.name}) لمتجر خُضرة فاس 🌿
رقم الطلب: ${order.order_code}

📍 نقطة الاستلام (Hub):
${hub.name}
${hub.address}

📍 نقطة التسليم (الزبون):
👤 الزبون: ${order.customer_name}
📞 الهاتف: ${order.phone}
🏠 العنوان: ${order.address}
${order.maps_link ? `🗺️ الخريطة: ${order.maps_link}` : ''}

💵 مبلغ التحصيل المطلوب (COD):
${order.total.toFixed(2)} درهم (نقداً عند التسليم)

📦 طبيعة الطرد: صندوق عازل خضار وفواكه طازجة (${order.items.length} أصناف).`;
}

// دالة رسالة إشعار الزبون بمغادرة الطلب مع السائق وفق استراتيجية خُضرة
function buildCustomerNotifyMessage(order: DbOrder): string {
  const dispatch = order.delivery_dispatch;
  const provider = DELIVERY_PROVIDERS.find((p) => p.id === dispatch?.provider)?.name || 'inDrive Delivery';
  const driverName = dispatch?.driverName || 'سائق التوصيل الفوري';
  const driverPhone = dispatch?.driverPhone || '';

  return `مرحباً ${order.customer_name} 👋

طلبك #${order.order_code} في الطريق إليك! 🚴

📍 شركة التوصيل: ${provider}
👤 السائق: ${driverName}
${driverPhone ? `📞 رقم التواصل مع السائق: ${driverPhone}\n` : ''}⏰ الوصول المتوقع: خلال 25-45 دقيقة

💵 المبلغ المطلوب: ${order.total.toFixed(2)} درهم
(الدفع نقداً عند التسليم)

شكراً لثقتك في خُضرة 🌿`;
}

export const AdminOrdersPanel: React.FC<AdminOrdersPanelProps> = ({ isOpen, onClose, onOrdersChange }) => {
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

  // إدارة تفاصيل التوصيل الفوري والسائقين
  const [expandedDispatchId, setExpandedDispatchId] = useState<string | number | null>(null);
  const [dispatchDrafts, setDispatchDrafts] = useState<Record<string, DeliveryDispatchInfo>>({});
  const [savingDispatchId, setSavingDispatchId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!onOrdersChange) return;
    const pending = orders.filter((o) => o.status === 'pending').length;
    onOrdersChange({ total: orders.length, pending });
  }, [orders, onOrdersChange]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setIsLoading(true);

    fetchOrders().then((data) => {
      if (mounted) {
        setOrders(data);
        setIsLoading(false);
      }
    });

    // ⚡ اشتراك Realtime لحظي: استقبال فوري لأي طلب جديد أو تعديل حالة أو حذف
    const channel = subscribeToOrdersChanges(
      (payload) => {
        if (!mounted) return;
        console.log('⚡ Realtime order update in AdminOrdersPanel:', payload.eventType);

        // جلب البيانات المحدثة تلقائياً
        fetchOrders().then((data) => {
          if (mounted) {
            setOrders(data);
          }
        });

        if (payload.eventType === 'INSERT') {
          playOrderChime();
          const clientName = payload.new?.client_name || payload.new?.customer_name || 'زبون';
          const code = payload.new?.order_code ? `(${payload.new.order_code})` : '';
          showToast('success', `🔔 طلب جديد وصل الآن من ${clientName} ${code}!`);
        }
      },
      (status) => {
        if (mounted) {
          setIsRealtimeActive(status === 'SUBSCRIBED');
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribeFromOrdersChanges(channel);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

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

  const handleUpdateDispatchDraft = (
    orderId: string | number,
    patch: Partial<DeliveryDispatchInfo>
  ) => {
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
    const res = await updateOrderDispatch(order.id, draft);
    setSavingDispatchId(null);

    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, delivery_dispatch: draft } : o))
      );
      showToast('success', `تم حفظ وتحديث بيانات التوصيل للطلب ${order.order_code}`);
      setExpandedDispatchId(null);
    } else {
      showToast('error', `فشل حفظ بيانات التوصيل: ${res.message || 'خطأ غير معروف'}`);
    }
  };

  const handleSendDriverDispatch = (order: DbOrder) => {
    const draft = dispatchDrafts[String(order.id)] || order.delivery_dispatch;
    const driverPhone = draft?.driverPhone;
    const msg = buildDriverDispatchMessage(order);

    if (driverPhone) {
      const wa = toWhatsApp(driverPhone);
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
      showToast('success', 'تم فتح واتساب لإرسال بيانات الشحنة للسائق');
    } else {
      navigator.clipboard.writeText(msg);
      showToast('success', 'تم نسخ تفاصيل الرحلة ونقطة الانطلاق من بنسودة لسائق inDrive');
    }
  };

  const handleSendCustomerDispatchNotify = (order: DbOrder) => {
    const msg = buildCustomerNotifyMessage(order);
    const wa = toWhatsApp(order.phone);
    if (wa) {
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
      showToast('success', 'تم فتح واتساب لإشعار الزبون بمغادرة الطلب');
    } else {
      navigator.clipboard.writeText(msg);
      showToast('success', 'تم نسخ نص إشعار خروج الطلب للزبون');
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmOrder) return;
    setIsDeleting(true);
    setDeletingId(deleteConfirmOrder.id);

    const res = await deleteOrder(deleteConfirmOrder.id);

    if (res.success) {
      setOrders((prev) => prev.filter((o) => o.id !== deleteConfirmOrder.id));
      showToast('success', `تم حذف الطلب ${deleteConfirmOrder.order_code} نهائياً`);
      setDeleteConfirmOrder(null);
    } else {
      showToast('error', `فشل الحذف: ${res.message || 'خطأ غير معروف'}`);
    }

    setIsDeleting(false);
    setDeletingId(null);
  };

  const stats = useMemo(() => {
    const counts = { pending: 0, prepared: 0, delivered: 0, cancelled: 0 };
    orders.forEach((o) => { counts[o.status]++; });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;
      if (!q) return true;
      return (
        o.order_code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.address.toLowerCase().includes(q)
      );
    });
  }, [orders, filterStatus, searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-[#FBF9F5] w-full sm:max-w-4xl shadow-2xl z-10 sm:rounded-[28px] flex flex-col max-h-screen sm:max-h-[92vh] overflow-hidden text-right border border-[#E8E1D3]">

          {/* ═══════════ Header ═══════════ */}
          <div className="relative p-4 sm:p-5 bg-gradient-to-l from-[#163920] to-[#0E2615] text-white flex items-center justify-between shrink-0 shadow-md overflow-hidden">
            {/* زخرفة خلفية */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,215,110,0.15),transparent_60%)] pointer-events-none" />

            <div className="relative flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-[#F5D76E]" />
                {stats.pending > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#0E2615] shadow-md animate-pulse">
                    {stats.pending > 99 ? '99+' : stats.pending}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-base sm:text-lg flex items-center gap-2">
                  <span>إدارة الطلبات</span>
                  <Sparkles className="w-4 h-4 text-[#F5D76E]" />
                </h2>
                <p className="text-[11px] sm:text-xs text-emerald-100/90 font-bold">
                  {orders.length} طلب مسجل • {stats.pending} قيد الإنشاء
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-2 shrink-0">
              {isRealtimeActive && (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 border border-emerald-400/30 text-[10px] font-black backdrop-blur-xs"
                  title="الاستقبال اللحظي للطلبات مفعّل (Supabase Realtime)"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span>مباشر (Realtime)</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 border border-white/15"
                title="تحديث"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer border border-white/15"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ═══════════ Toast ═══════════ */}
          {toast && (
            <div className={`px-4 py-3 text-xs font-black flex items-center gap-2.5 ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-b-2 border-emerald-200'
                : 'bg-red-50 text-red-900 border-b-2 border-red-200'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          )}

          {/* ═══════════ Tab Switcher ═══════════ */}
          <div className="flex border-b border-[#E8E1D3] bg-white text-xs font-black shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-[#163920] text-[#163920] bg-emerald-50/40'
                  : 'border-transparent text-[#787163] hover:text-[#112616] hover:bg-[#F7F4EC]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>الطلبات والمبيعات</span>
              <span className="px-2 py-0.5 rounded-full bg-[#163920]/10 text-[#163920] text-[10px]">
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fleet')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'fleet'
                  ? 'border-[#C25E12] text-[#C25E12] bg-amber-50/40'
                  : 'border-transparent text-[#787163] hover:text-[#112616] hover:bg-[#F7F4EC]'
              }`}
            >
              <Bike className="w-4 h-4 text-[#C25E12]" />
              <span>🚴 أسطول التوصيل ومسارات فاس</span>
              <span className="px-2 py-0.5 rounded-full bg-[#C25E12]/15 text-[#C25E12] text-[10px]">
                inDrive + تجميع المسارات
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
              {/* ═══════════ Stats Row ═══════════ */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-white border-b border-[#E8E1D3]">
            {STATUS_ORDER.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.Icon;
              const isActive = filterStatus === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterStatus(isActive ? 'all' : s)}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    isActive ? `${cfg.buttonActive}` : 'bg-[#F7F4EC] border-[#E8E1D3] hover:border-[#C25E12]/50 hover:bg-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? '' : 'text-[#524B3E]'}`} />
                  <div className="text-right flex-1 min-w-0">
                    <div className={`text-[10px] sm:text-[11px] font-black truncate ${isActive ? '' : 'text-[#524B3E]'}`}>
                      {cfg.label}
                    </div>
                    <div className={`text-base sm:text-lg font-black leading-none tabular-nums ${isActive ? '' : 'text-[#112616]'}`}>
                      {stats[s]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ═══════════ Search ═══════════ */}
          <div className="p-3 sm:p-4 bg-[#F7F4EC] border-b border-[#E8E1D3] flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787163] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم الطلب، الاسم، الهاتف، أو العنوان..."
                className="w-full pr-9 pl-9 py-2.5 rounded-xl border border-[#E8E1D3] bg-white text-xs sm:text-sm focus:outline-none focus:border-[#163920] focus:ring-2 focus:ring-[#163920]/15 text-[#112616] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F7F4EC] hover:bg-[#EAE2D2] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-3 h-3 text-[#524B3E]" />
                </button>
              )}
            </div>

            {filterStatus !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className="px-3 py-2.5 rounded-xl bg-white border-2 border-[#E8E1D3] hover:border-[#C25E12] text-xs font-black text-[#524B3E] hover:text-[#C25E12] cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
              >
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
                  {orders.length === 0
                    ? 'ستظهر هنا كل الطلبات التي يتم رفعها على المتجر'
                    : 'جرّب تغيير الفلتر أو مسح البحث'}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status];
                const PillIcon = cfg.Icon;
                const isUpdating = updatingId === order.id;
                const isBeingDeleted = deletingId === order.id;
                const wa = toWhatsApp(order.phone);
                const itemsCount = order.items.reduce((s, i) => s + (Number(i.qty) || 1), 0);
                const isCopied = copiedId === order.id;
                const hasContactRow = !!(wa || order.maps_link);
                const hasBothContact = !!(wa && order.maps_link);
                const isFreeDelivery = order.delivery_fee === 0;

                return (
                  <article
                    key={order.id}
                    className={`bg-white rounded-2xl border-2 p-3.5 sm:p-4 transition-all ${
                      isUpdating || isBeingDeleted
                        ? 'border-amber-400 shadow-md'
                        : 'border-[#E8E1D3] hover:border-[#C25E12]/40 hover:shadow-sm'
                    } ${isBeingDeleted ? 'opacity-60' : ''}`}
                  >
                    {/* ─── Row 1: رقم الطلب + الحالة + الوقت ─── */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-[#F0E9DA]">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-[#112616] shrink-0 tabular-nums">
                          {order.order_code}
                        </span>
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

                    {/* ─── Row 2: معلومات العميل + الملخص ─── */}
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

                      <div className="bg-gradient-to-br from-[#F7F4EC] to-white rounded-xl p-3 border border-[#E8E1D3]">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-[#524B3E] font-black flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            <span>المنتجات:</span>
                          </span>
                          <span className="font-black text-[#112616] tabular-nums">{itemsCount} قطعة</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-[#524B3E] font-black">التوصيل:</span>
                          <span className={`font-black tabular-nums ${isFreeDelivery ? 'text-emerald-700' : 'text-[#112616]'}`}>
                            {isFreeDelivery ? 'مجاني 🎉' : `${order.delivery_fee.toFixed(2)} DH`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#E8E1D3]">
                          <span className="text-xs font-black text-[#112616] flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            <span>الإجمالي:</span>
                          </span>
                          <span className="text-sm font-black text-[#C25E12] tabular-nums">{order.total.toFixed(2)} DH</span>
                        </div>
                      </div>
                    </div>

                    {/* ─── ملاحظات الطلب ─── */}
                    {order.note && (
                      <div className="mb-3 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-[11px] text-amber-950 space-y-1">
                        {order.note.split(' | ').map((part, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-600 shrink-0 font-black">•</span>
                            <span className="leading-snug font-medium">{part}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ─── قسم التوصيل الفوري والسائق (inDrive / فاس) ─── */}
                    {(() => {
                      const idKey = String(order.id);
                      const currentDispatch = order.delivery_dispatch;
                      const draft = dispatchDrafts[idKey] || currentDispatch || {
                        provider: 'indrive' as DeliveryProvider,
                        driverName: '',
                        driverPhone: '',
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
                          {/* شريط رأس التوصيل */}
                          <div className="p-2.5 bg-gradient-to-r from-emerald-100/80 to-emerald-50 flex items-center justify-between gap-2 border-b border-emerald-200">
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                              <span className="inline-flex items-center gap-1 font-black text-emerald-900">
                                <Bike className="w-4 h-4 text-emerald-700" />
                                <span>{providerCfg.name}</span>
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-800">
                                {zoneCfg.name}
                              </span>
                              {draft.driverName ? (
                                <span className="text-[11px] font-bold text-stone-700">
                                  كابتن: <strong className="text-emerald-950">{draft.driverName}</strong>
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-800 font-bold bg-amber-100/70 px-1.5 py-0.5 rounded">
                                  بانتظار تخصيص السائق
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleDispatchEdit(order)}
                              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white hover:bg-emerald-50 px-2 py-1 rounded-md border border-emerald-300 transition-colors cursor-pointer"
                            >
                              <span>{isExpanded ? 'إخفاء' : 'تعديل السائق'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* نموذج تعديل السائق والتوصيل (Expandable) */}
                          {isExpanded && (
                            <div className="p-3 bg-white border-b border-emerald-200 space-y-2.5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-black text-stone-600 mb-1">
                                    شركة / منصة التوصيل:
                                  </label>
                                  <select
                                    value={draft.provider}
                                    onChange={(e) =>
                                      handleUpdateDispatchDraft(order.id, {
                                        provider: e.target.value as DeliveryProvider,
                                      })
                                    }
                                    className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white font-bold text-stone-800 focus:outline-emerald-600"
                                  >
                                    {DELIVERY_PROVIDERS.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} {p.recommended ? '⭐ (موصى به)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-black text-stone-600 mb-1">
                                    منطقة فاس (Smart Zone):
                                  </label>
                                  <select
                                    value={draft.zone || 'north'}
                                    onChange={(e) =>
                                      handleUpdateDispatchDraft(order.id, {
                                        zone: e.target.value as FezZoneId,
                                      })
                                    }
                                    className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white font-bold text-stone-800 focus:outline-emerald-600"
                                  >
                                    <option value="north">المنطقة الشمالية (الأطلس، النرجس، سايس)</option>
                                    <option value="central">المنطقة الوسطى (طريق إيموزار، فلورنس، أكدال)</option>
                                    <option value="south">المنطقة الجنوبية (بنسودة، عين هارون، زواغة)</option>
                                    <option value="east">المنطقة الشرقية (الزهور، طريق صفرو، فاس البالي)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] font-black text-stone-600 mb-1">
                                    اسم السائق / المندوب:
                                  </label>
                                  <input
                                    type="text"
                                    value={draft.driverName || ''}
                                    onChange={(e) =>
                                      handleUpdateDispatchDraft(order.id, { driverName: e.target.value })
                                    }
                                    placeholder="مثال: يوسف العلوي (inDrive)"
                                    className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-emerald-600"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-black text-stone-600 mb-1">
                                    هاتف السائق:
                                  </label>
                                  <input
                                    type="tel"
                                    value={draft.driverPhone || ''}
                                    onChange={(e) =>
                                      handleUpdateDispatchDraft(order.id, { driverPhone: e.target.value })
                                    }
                                    placeholder="06XXXXXXXX"
                                    className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-emerald-600"
                                    dir="ltr"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-black text-stone-600 mb-1">
                                    تكلفة التوصيل المتفق عليها (DH):
                                  </label>
                                  <input
                                    type="number"
                                    value={draft.deliveryCost ?? 25}
                                    onChange={(e) =>
                                      handleUpdateDispatchDraft(order.id, {
                                        deliveryCost: Number(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white font-bold text-stone-800 focus:outline-emerald-600"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-stone-500">
                                  نقطة الاستلام: {STORE_PICKUP_HUB.name}
                                </span>
                                <button
                                  type="button"
                                  disabled={savingDispatchId === order.id}
                                  onClick={() => handleSaveDispatch(order)}
                                  className="py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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

                          {/* أزرار الإجراءات الفورية للسائق والزبون */}
                          <div className="p-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-emerald-50/70">
                            <button
                              type="button"
                              onClick={() => handleSendDriverDispatch(order)}
                              className="py-1.5 px-2 rounded-lg bg-white hover:bg-emerald-100/70 text-emerald-900 border border-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              title="استدعاء وإرسال بيانات الشحنة ونقطة بنسودة لسائق inDrive"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-700" />
                              <span>استدعاء سائق inDrive</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendCustomerDispatchNotify(order)}
                              className="py-1.5 px-2 rounded-lg bg-white hover:bg-emerald-100/70 text-emerald-900 border border-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              title="إشعار الزبون بمغادرة الطلب مع كابتن التوصيل عبر واتساب"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                              <span>إشعار الزبون بالانطلاق</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setBordereauOrder(order)}
                              className="py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              title="معاينة وطباعة ملصق الشحن الحراري والصندوق العازل 50L"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#F5D76E]" />
                              <span>ملصق الشحن (Bordereau)</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ─── أزرار الإجراءات ─── */}
                    <div className="mb-3 space-y-2">

                      {/* ─── الصف 1: التواصل ─── */}
                      {hasContactRow && (
                        <div className={`grid gap-2 ${hasBothContact ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {wa && (
                            <a
                              href={`https://wa.me/${wa}?text=${encodeURIComponent(`السلام عليكم ${order.customer_name}، بخصوص طلبكم ${order.order_code} من متجر خُضرة:`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-l from-[#25D366] to-[#1EBE5D] hover:from-[#20BA5A] hover:to-[#17A34A] text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 border-2 border-[#1EBE5D]"
                            >
                              <MessageCircle className="w-4 h-4 shrink-0" />
                              <span>واتساب</span>
                            </a>
                          )}
                          {order.maps_link && (
                            <a
                              href={order.maps_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-l from-[#2563EB] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#1E3A8A] text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 border-2 border-[#1E40AF]"
                            >
                              <ExternalLink className="w-4 h-4 shrink-0" />
                              <span>الخريطة</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* ─── الصف 2: الإدارة ─── */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setInvoiceOrder(order)}
                          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 border-2 border-[#0E2615]"
                          title="معاينة وطباعة الفاتورة"
                        >
                          <Printer className="w-4 h-4 text-[#F5D76E] shrink-0" />
                          <span className="truncate">الفاتورة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyOrder(order)}
                          className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-black text-xs border-2 shadow-sm transition-all cursor-pointer active:scale-95 ${
                            isCopied
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                              : 'bg-white hover:bg-[#F7F4EC] text-[#524B3E] hover:text-[#112616] border-[#E8E1D3] hover:border-[#C25E12]/40'
                          }`}
                          title="نسخ تفاصيل الطلب"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span className="truncate">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 shrink-0" />
                              <span className="truncate">نسخ</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ─── صف الحالة ─── */}
                    <div className="pt-3 border-t border-[#F0E9DA]">
                      <div className="text-[11px] font-black text-[#787163] mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#C25E12]" />
                        <span>تغيير الحالة إلى:</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {STATUS_ORDER_CHANGEABLE.map((s) => {
                          const sCfg = STATUS_CONFIG[s];
                          const SIcon = sCfg.Icon;
                          const isActive = order.status === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              disabled={isActive || isUpdating || isBeingDeleted}
                              onClick={() => handleStatusChange(order.id, s)}
                              className={`py-2 px-2 rounded-lg border-2 text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all active:scale-95 ${
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

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmOrder(order)}
                          disabled={isBeingDeleted}
                          className="py-2 px-2 rounded-lg border-2 text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all active:scale-95 bg-red-50 hover:bg-red-100 text-red-700 border-red-300 hover:border-red-400 disabled:opacity-60 cursor-pointer"
                          title="حذف الطلب نهائياً"
                        >
                          {isBeingDeleted ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                              <span className="truncate">جاري...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">حذف</span>
                            </>
                          )}
                        </button>
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white text-xs font-black cursor-pointer active:scale-95 transition-all border-2 border-[#0E2615] shadow-sm"
            >
              إغلاق
            </button>
          </div>
            </>
          )}

        </div>

        {/* ═══════════ Delete Confirmation Modal ═══════════ */}
        {deleteConfirmOrder && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteConfirmOrder(null)}
            />

            <div className="relative bg-white border-2 border-red-300 rounded-[24px] w-full max-w-sm shadow-2xl z-10 overflow-hidden p-6 text-right animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7" />
              </div>

              <h3 className="font-black text-base text-[#112616] text-center mb-2">
                تأكيد حذف الطلب
              </h3>
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
                  <span className="font-black text-[#C25E12] tabular-nums">{deleteConfirmOrder.total.toFixed(2)} DH</span>
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
                      <span>جاري الحذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>نعم، حذف</span>
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

      {/* ═══════════ نافذة الفاتورة ═══════════ */}
      <OrderInvoiceModal
        order={invoiceOrder}
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />

      {/* ═══════════ نافذة ملصق الشحن والتوصيل ═══════════ */}
      <OrderBordereauModal
        order={bordereauOrder}
        isOpen={!!bordereauOrder}
        onClose={() => setBordereauOrder(null)}
      />
    </>
  );
};