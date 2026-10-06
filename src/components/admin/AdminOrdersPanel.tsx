// ============================================================
// AdminOrdersPanel.tsx – الإصدار 6.0
// إدارة الطلبات ومسار معالجة الطلبات لمتجر خُضرة - فاس
// 1. قيد الإنشاء (الطلبات الجديدة قيد المراجعة والمعالجة)
// 2. تم التجهيز (الجاهزة للتوصيل وتخصيص السائق)
// 3. تم التسليم (المكتملة وتأكيد الدفع وتقييم العميل)
// ============================================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Package,
  Clock,
  CheckCircle2,
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
  AlertCircle,
  Inbox,
  Check,
  Copy,
  Trash2,
  Printer,
  Sparkles,
  Bike,
  Navigation,
  Car,
  ChevronDown,
  ChevronUp,
  Send,
  Save,
  Coins,
  Star,
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
  fetchStoreDrivers,
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
  StoreDriver,
} from '../../types';

export interface AdminOrdersPanelProps {
  isOpen?: boolean;
  standalone?: boolean;
  onClose?: () => void;
  onOrdersChange?: (counts: { total: number; pending: number }) => void;
}

// ─── مفاتيح التخزين المحلي لتأكيد الدفع ───
const STORAGE_KEY_PAID = 'khodra_paid_orders';

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
  return lines.join('\n');
}

// ─── 1. رسالة إشعار الزبون وتأكيد الاستلام مع الشكر ───
function buildCustomerThankAndConfirmMessage(order: DbOrder): string {
  const safeTotal = Number(order.total ?? 0).toFixed(2);
  return `مرحباً بك أخي/أختي *${order.customer_name}* 🌿

نشكرك على اختيارك *متجر خُضرة*! تم استلام طلبك رقم *${order.order_code}* عبر المتجر بنجاح.

📋 *تفاصيل الطلب:*
• الإجمالي: *${safeTotal} درهم*
• العنوان: ${order.address}

طلبك الآن قيد الإنشاء والمراجعة، وجارٍ تجهيزه طازجاً من سوق بنسودة بفاس بأعلى معايير الجودة والنظافة. سنوافيك بإشعار فوري عند انطلاق المندوب للتسليم! 

شكراً جزيلاً لثقتك بنا 💚✨`;
}

// ─── 2. رسالة استدعاء سائق فريق متجر خضرة (خيار أساسي) ───
function buildStoreTeamDriverMessage(order: DbOrder, draft?: DeliveryDispatchInfo): string {
  const hub = STORE_PICKUP_HUB;
  const driverGreeting = draft?.driverName
    ? `السلام عليكم كابتن *${draft.driverName}* 🛵🌿`
    : 'السلام عليكم كابتن فريق متجر خُضرة 🛵🌿';
  const cleanN = cleanNote(order.note || '');
  const deliveryCost = draft?.deliveryCost ?? 11; // أجور الفريق الداخلي 9-13 درهم
  const safeTotal = Number(order.total ?? 0).toFixed(2);
  const mapUrl =
    order.maps_link ||
    (order.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ' فاس')}`
      : '');

  return [
    driverGreeting,
    `📦 *طلب توصيل جاهز - فريق متجر خُضرة الداخلي (أساسي)*`,
    `🔖 *رقم الطلب:* ${order.order_code}`,
    `────────────────────`,
    `1️⃣ *نقطة الاستلام (المتجر):*`,
    `🏪 ${hub.name}`,
    `📍 ${hub.address}`,
    `🗺️ موقع الاستلام: ${hub.mapsLink}`,
    `────────────────────`,
    `2️⃣ *بيانات الزبون والتسليم:*`,
    `👤 *الاسم:* ${order.customer_name}`,
    `📞 *الهاتف:* ${order.phone}`,
    `🏠 *العنوان:* ${order.address}`,
    mapUrl ? `🗺️ موقع GPS: ${mapUrl}` : '',
    cleanN ? `📝 ملاحظة: ${cleanN}` : '',
    `────────────────────`,
    `3️⃣ *التحصيل والأجرة:*`,
    `🛵 أجرة التوصيل: ${deliveryCost} درهم`,
    `💵 *المبلغ المطلوب تحصيله (COD): ${safeTotal} درهم* (نقداً عند التسليم)`,
    `────────────────────`,
    `⚠️ يرجى تأكيد الاستلام عند الانطلاق والمحافظة على استقامة الصندوق. طريق السلامة! 🌟`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── 3. رسالة استدعاء سائق inDrive (المستوى الثاني - احتياطي) ───
function buildInDriveDriverMessage(order: DbOrder, draft?: DeliveryDispatchInfo): string {
  const hub = STORE_PICKUP_HUB;
  const deliveryCost = draft?.deliveryCost ?? 22; // أجور سائقي التطبيقات 20-25 درهم
  const safeTotal = Number(order.total ?? 0).toFixed(2);
  const mapUrl =
    order.maps_link ||
    (order.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ' فاس')}`
      : '');

  return [
    `السلام عليكم كابتن inDrive 🚗🌿`,
    `مشوار توصيل طرد - متجر خُضرة بفاس (خيار احتياطي)`,
    `🔖 *رقم الطلب:* ${order.order_code}`,
    `────────────────────`,
    `📍 *نقطة الانطلاق (استلام الطرد):*`,
    `🏪 ${hub.name} - ${hub.address}`,
    `🗺️ موقع الاستلام: ${hub.mapsLink}`,
    `────────────────────`,
    `📍 *نقطة الوصول (تسليم الزبون):*`,
    `👤 الاسم: ${order.customer_name}`,
    `📞 الهاتف: ${order.phone}`,
    `🏠 العنوان: ${order.address}`,
    mapUrl ? `🗺️ رابط الموقع: ${mapUrl}` : '',
    `────────────────────`,
    `💵 *المبلغ المطلوب تحصيله (COD): ${safeTotal} درهم*`,
    `🚚 *أجرة المشوار المقترحة:* ${deliveryCost} درهم`,
    `────────────────────`,
    `يرجى التواصل لتأكيد المشوار والانطلاق فوراً. شكراً لك!`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── 4. رسالة طلب تقييم الخدمة للعميل (رقم هاتف العميل وليس السائق) ───
function buildCustomerReviewMessage(order: DbOrder): string {
  const appOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://khodrafresh.vercel.app';
  return `السلام عليكم ورحمة الله أخي/أختي *${order.customer_name}* 🌿

نشكرك جزيل الشكر على تسوقكم من *متجر خُضرة - فاس* (طلب رقم: ${order.order_code})! 🍏🥕🥦

نرجو أن تكون الخضار والفواكه طازجة والتوصيل سريعاً وبالمستوى الذي يرضيكم.
رأيك يهمنا جداً لتطوير وتجويد خدماتنا؛ نرجو التكرم بمشاركتنا تقييمكم لتجربة الشراء وجودة التوصيل:
⭐⭐⭐⭐⭐ (من 1 إلى 5 نجوم)
رابط التقييم المباشر: ${appOrigin}/?review=true

أو يمكنكم الرد مباشرة على هذه الرسالة بملاحظاتكم واقتراحاتكم الكريمة.
شكراً جزيلاً لثقتكم الغالية في متجر خُضرة، وشهية طيبة لكم ولعائلتكم الكريمة! 💚🌟`;
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
    /* تجاهل */
  }
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
  const [, setIsRealtimeActive] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<DbOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<DbOrder | null>(null);
  const [bordereauOrder, setBordereauOrder] = useState<DbOrder | null>(null);

  // تصنيف مراحل تنفيذ الطلب للشاشات الصغيرة
  const [mobileStageView, setMobileStageView] = useState<'all' | 'pending' | 'prepared' | 'delivered'>('all');

  // السائقون وحفظ بياناتهم
  const [expandedDriverCardId, setExpandedDriverCardId] = useState<string | number | null>(null);
  const [dispatchDrafts, setDispatchDrafts] = useState<Record<string, DeliveryDispatchInfo>>({});
  const [savingDispatchId, setSavingDispatchId] = useState<string | number | null>(null);
  const [storeDrivers, setStoreDrivers] = useState<StoreDriver[]>([]);

  // تأكيد الدفع المحفوظ محلياً
  const [paidOrderCodes, setPaidOrderCodes] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAID);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (isOpen || standalone) {
      fetchStoreDrivers()
        .then((res) => setStoreDrivers(res.drivers))
        .catch(() => {});
    }
  }, [isOpen, standalone]);

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
  }, [isOpen, standalone]);

  // إدارة التمرير في الصفحة
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
    }
    return () => {
      try {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.pointerEvents = '';
      } catch {}
    };
  }, [isOpen, standalone]);

  // مفتاح Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirmOrder) setDeleteConfirmOrder(null);
        else if (invoiceOrder) setInvoiceOrder(null);
        else if (bordereauOrder) setBordereauOrder(null);
        else if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleteConfirmOrder, invoiceOrder, bordereauOrder, onClose]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const data = await fetchOrders();
    setOrders(data);
    setIsRefreshing(false);
    showToast('success', `تم تحديث القائمة (${data.length} طلب)`);
  };

  // ─── تغيير الحالة ───
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
      const labels: Record<OrderStatus, string> = {
        pending: 'قيد الإنشاء',
        prepared: 'تم التجهيز',
        delivered: 'تم التسليم',
        cancelled: 'ملغى',
      };
      showToast('success', `تم تحويل الطلب ${previous.order_code} إلى "${labels[newStatus]}"`);
    }
    setUpdatingId(null);
  };

  // ─── نسخ الطلب ───
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
        showToast('error', 'تعذّر النسخ، حاول مجدداً');
      }
    }
  };

  // ─── إشعار الزبون وتأكيد الطلب وشكره ───
  const handleNotifyCustomerThank = (order: DbOrder) => {
    const msg = buildCustomerThankAndConfirmMessage(order);
    const wa = toWhatsApp(order.phone);
    if (wa) {
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
      showToast('success', 'تم فتح واتساب لإشعار الزبون وتأكيد الطلب');
    } else {
      navigator.clipboard.writeText(msg).catch(() => {});
      showToast('success', 'تم نسخ رسالة الشكر والإشعار للحافظة');
    }
  };

  // ─── استدعاء سائق فريق خضرة (أساسي) ───
  const handleCallStoreTeamDriver = (order: DbOrder) => {
    const draft = dispatchDrafts[String(order.id)] || order.delivery_dispatch;
    const msg = buildStoreTeamDriverMessage(order, draft);
    const driverPhone = draft?.driverPhone;
    if (driverPhone) {
      const wa = toWhatsApp(driverPhone);
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
      showToast('success', `تم فتح واتساب مع السائق ${draft.driverName || ''}`);
    } else {
      navigator.clipboard.writeText(msg).catch(() => {});
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      showToast('success', 'تم نسخ رسالة فريق خُضرة وفتح واتساب لاختيار السائق');
    }
  };

  // ─── استدعاء سائق inDrive (احتياطي) ───
  const handleCallInDriveDriver = (order: DbOrder) => {
    const draft = dispatchDrafts[String(order.id)] || order.delivery_dispatch;
    const msg = buildInDriveDriverMessage(order, draft);
    navigator.clipboard.writeText(msg).catch(() => {});
    const driverPhone = draft?.driverPhone;
    if (driverPhone) {
      const wa = toWhatsApp(driverPhone);
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
      showToast('success', 'تم فتح واتساب لإرسال تفاصيل inDrive للسائق');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      showToast('success', 'تم نسخ رسالة inDrive المجهزة وفتح واتساب');
    }
  };

  // ─── إرسال رسالة تقييم الخدمة للعميل ───
  const handleSendCustomerReview = (order: DbOrder) => {
    const msg = buildCustomerReviewMessage(order);
    const wa = toWhatsApp(order.phone);
    if (wa) {
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
      showToast('success', 'تم فتح واتساب لإرسال رابط التقييم للزبون');
    } else {
      navigator.clipboard.writeText(msg).catch(() => {});
      showToast('success', 'تم نسخ نص رسالة التقييم');
    }
  };

  // ─── تأكيد الدفع عند الاستلام ───
  const handleTogglePaymentConfirmation = (order: DbOrder) => {
    const code = order.order_code || String(order.id);
    const updated = new Set(paidOrderCodes);
    if (updated.has(code)) {
      updated.delete(code);
      showToast('success', `تم إلغاء تأكيد الدفع للطلب ${order.order_code}`);
    } else {
      updated.add(code);
      showToast('success', `✅ تم تأكيد استلام المبلغ للطلب ${order.order_code}`);
    }
    setPaidOrderCodes(updated);
    try {
      localStorage.setItem(STORAGE_KEY_PAID, JSON.stringify(Array.from(updated)));
    } catch {}
  };

  // ─── تحديث وحفظ مسودة السائق ───
  const handleUpdateDispatchDraft = (orderId: string | number, patch: Partial<DeliveryDispatchInfo>) => {
    const idKey = String(orderId);
    setDispatchDrafts((prev) => ({
      ...prev,
      [idKey]: {
        ...(prev[idKey] || {
          provider: 'custom',
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
      showToast('success', `تم حفظ بيانات السائق للطلب ${order.order_code}`);
      setExpandedDriverCardId(null);
    } else {
      showToast('error', `فشل الحفظ: ${res.message || 'خطأ غير معروف'}`);
    }
  };

  // ─── تنفيذ الحذف ───
  const handleExecuteDelete = async () => {
    if (!deleteConfirmOrder) return;
    setIsDeleting(true);
    setDeletingId(deleteConfirmOrder.id);
    const res = await deleteOrder(deleteConfirmOrder.id);
    if (res.success) {
      setOrders((prev) =>
        prev.filter(
          (o) => o.id !== deleteConfirmOrder.id && o.order_code !== deleteConfirmOrder.order_code
        )
      );
      showToast('success', `تم حذف الطلب ${deleteConfirmOrder.order_code} بنجاح`);
      setDeleteConfirmOrder(null);
    } else {
      showToast('error', `فشل الحذف: ${res.message || 'خطأ غير معروف'}`);
    }
    setIsDeleting(false);
    setDeletingId(null);
  };

  // ─── تصفية الطلبات والبحث ───
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      if (!o) return false;
      return (
        String(o.order_code || '').toLowerCase().includes(q) ||
        String(o.customer_name || '').toLowerCase().includes(q) ||
        String(o.phone || '').includes(q) ||
        String(o.address || '').toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery]);

  // ─── تقسيم الطلبات حسب المراحل الثلاث (قيد الإنشاء، تم التجهيز، تم التسليم) ───
  const branchPendingOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'pending');
  }, [filteredOrders]);

  const branchPreparedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'prepared');
  }, [filteredOrders]);

  const branchDeliveredOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'delivered');
  }, [filteredOrders]);

  const activeDeliveredOrders = branchDeliveredOrders;

  if (!isOpen && !standalone) return null;

  // ═══════════════════════════════════════════════════════════════
  // ─── 1. بطاقة معلومات الرأس المشتركة (رقم، وقت، اسم، هاتف، إجمالي) ───
  // ═══════════════════════════════════════════════════════════════
  const renderCardTopInfo = (order: DbOrder) => {
    const safeTotal = Number(order.total ?? 0);
    return (
      <div className="space-y-2 mb-3">
        {/* السطر الأول: رقم الطلب | وقت الطلب */}
        <div className="flex items-center justify-between pb-2 border-b border-[#F0E9DA] text-xs">
          <span className="font-black text-[#112616] text-sm tabular-nums tracking-wide">
            {order.order_code}
          </span>
          <span className="text-[11px] font-bold text-[#787163] flex items-center gap-1 bg-[#F7F4EC] px-2 py-0.5 rounded-full border border-[#E8E1D3]">
            <Clock className="w-3 h-3 text-[#C25E12]" />
            <span>{timeAgo(order.created_at)}</span>
          </span>
        </div>

        {/* السطر الثاني: إسم العميل ورقم الهاتف */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#163920]/10 flex items-center justify-center shrink-0">
              <User className="w-3 h-3 text-[#163920]" />
            </div>
            <span className="font-black text-[#112616] truncate text-[13px]">{order.customer_name}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#C25E12]/10 flex items-center justify-center shrink-0">
                <Phone className="w-3 h-3 text-[#C25E12]" />
              </div>
              <a
                href={`tel:${order.phone}`}
                className="font-bold text-[#524B3E] hover:text-[#C25E12] tabular-nums text-[12px]"
                dir="ltr"
              >
                {order.phone}
              </a>
            </div>

            {order.address && (
              <span className="text-[10px] text-[#787163] font-medium truncate max-w-[140px] flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 shrink-0 text-stone-400" />
                <span className="truncate">{order.address}</span>
              </span>
            )}
          </div>
        </div>

        {/* السطر الثالث: الإجمالي البارز */}
        <div className="bg-gradient-to-l from-[#F7F4EC] to-white rounded-xl p-2.5 border border-[#E8E1D3] flex items-center justify-between">
          <span className="text-xs font-black text-[#112616] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>الإجمالي:</span>
          </span>
          <span className="text-base font-black text-[#C25E12] tabular-nums">
            {safeTotal.toFixed(2)} DH
          </span>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // ─── كود الفرع الأيمن: قيد الإنشاء ───
  // ═══════════════════════════════════════════════════════════════
  const renderPendingBranchCards = () => {
    if (branchPendingOrders.length === 0) {
      return (
        <div className="p-8 text-center bg-white/70 rounded-2xl border-2 border-dashed border-amber-200">
          <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-black text-[#787163]">لا توجد طلبات قيد الإنشاء حالياً</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {branchPendingOrders.map((order) => {
          const isCopied = copiedId === order.id;
          const isUpdating = updatingId === order.id;

          return (
            <article
              key={order.id}
              className="bg-white rounded-2xl border-2 border-amber-200/90 shadow-xs hover:border-amber-400 hover:shadow-md p-3.5 transition-all text-right relative overflow-hidden"
            >
              {/* شريط حالة علوي خفيف */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-amber-400 to-amber-500" />

              {/* 1. في البطاقة الأولى: معلومات العميل والإجمالي */}
              {renderCardTopInfo(order)}

              {/* 2. الخطوة الموالية: تصميم grid cols 3 */}
              <div className="pt-2 border-t border-[#F0E9DA] mb-3">
                <div className="grid grid-cols-3 gap-1.5">
                  {/* زر إشعار الزبون بوصول الطلب عبر المتجر + رسالة شكر */}
                  <button
                    type="button"
                    onClick={() => handleNotifyCustomerThank(order)}
                    className="py-2 px-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[11px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                    title="إرسال رسالة شكر وتأكيد استلام الطلب عبر واتساب"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate leading-none">إشعار وشكر</span>
                  </button>

                  {/* زر نسخ الطلب */}
                  <button
                    type="button"
                    onClick={() => handleCopyOrder(order)}
                    className={`py-2 px-1.5 rounded-xl border font-black text-[11px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
                      isCopied
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                        : 'bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#524B3E] border-[#E8E1D3]'
                    }`}
                    title="نسخ تفاصيل الطلب للحافظة"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#524B3E]" />
                    )}
                    <span className="truncate leading-none">{isCopied ? 'تم النسخ' : 'نسخ الطلب'}</span>
                  </button>

                  {/* زر حذف الطلب (حذف نهائي) */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOrder(order)}
                    className="py-2 px-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-black text-[11px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                    title="حذف هذا الطلب نهائياً من قاعدة البيانات"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span className="truncate leading-none">حذف الطلب</span>
                  </button>
                </div>
              </div>

              {/* حالة الطلب وأزرار الانتقال للمرحلة الموالية */}
              <div className="pt-2.5 border-t border-[#F0E9DA]">
                <div className="text-[10px] font-black text-stone-500 mb-1.5 flex items-center justify-between">
                  <span>حالة الطلب:</span>
                  {isUpdating && <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="py-2 px-2 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs border-2 border-amber-500 cursor-default"
                  >
                    <span>قيد الإنشاء</span>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(order.id, 'prepared')}
                    className="py-2 px-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center gap-1.5 border-2 border-blue-300 hover:border-blue-500 transition-all cursor-pointer active:scale-95 shadow-xs"
                    title="تحويل الطلب إلى تم التجهيز"
                  >
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    <span>تحويل للتجهيز</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // ─── كود الفرع الأوسط: تم التجهيز ───
  // ═══════════════════════════════════════════════════════════════
  const renderPreparedBranchCards = () => {
    if (branchPreparedOrders.length === 0) {
      return (
        <div className="p-8 text-center bg-white/70 rounded-2xl border-2 border-dashed border-blue-200">
          <Package className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-black text-[#787163]">لا توجد طلبات تم تجهيزها حالياً</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {branchPreparedOrders.map((order) => {
          const isUpdating = updatingId === order.id;
          const idKey = String(order.id);
          const currentDispatch = order.delivery_dispatch;
          const draft =
            dispatchDrafts[idKey] ||
            currentDispatch || {
              provider: 'custom' as DeliveryProvider,
              driverName: '',
              driverPhone: '',
              deliveryCost: 25,
              dispatchStatus: 'ready_for_pickup' as DeliveryDispatchStatus,
              zone: detectFezZone(order.address),
              packagingType: 'cooler_box',
            };
          const isDriverCardExpanded = expandedDriverCardId === order.id;
          const mapHref =
            order.maps_link ||
            (order.address
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ' فاس')}`
              : '#');

          return (
            <article
              key={order.id}
              className="bg-white rounded-2xl border-2 border-blue-200 shadow-xs hover:border-blue-400 hover:shadow-md p-3.5 transition-all text-right relative overflow-hidden"
            >
              {/* شريط حالة علوي أزرق */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-blue-500 to-indigo-600" />

              {/* 1. في البطاقة الأولى: معلومات العميل والإجمالي */}
              {renderCardTopInfo(order)}

              {/* 2. الخطوة الموالية: بطاقة لتخصيص معلومات السائقين */}
              <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50/40 p-2.5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-blue-950">
                    <Bike className="w-4 h-4 text-blue-700" />
                    <span>تخصيص معلومات السائق</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDriverCardId((prev) => (prev === order.id ? null : order.id))
                    }
                    className="text-[11px] font-bold text-blue-800 hover:text-blue-950 flex items-center gap-0.5 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-blue-200"
                  >
                    <span>{isDriverCardExpanded ? 'إغلاق' : 'تعديل البيانات'}</span>
                    {isDriverCardExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* استعراض السائق المحدد حالياً */}
                {draft.driverName ? (
                  <div className="text-[11px] text-[#112616] font-bold bg-white/80 p-2 rounded-lg border border-blue-100 flex items-center justify-between">
                    <div>
                      <span>السائق: </span>
                      <strong className="text-blue-900">{draft.driverName}</strong>
                      {draft.driverPhone && (
                        <span className="text-stone-500 text-[10px] mr-1.5" dir="ltr">
                          ({draft.driverPhone})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded">
                      {draft.deliveryCost ?? 25} DH
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-amber-800 font-bold bg-amber-50 p-1.5 rounded border border-amber-200">
                    بانتظار تخصيص السائق أو اختيار سائق الفريق
                  </p>
                )}

                {/* حقول تخصيص معلومات السائق عند التوسيع */}
                {isDriverCardExpanded && (
                  <div className="pt-2 border-t border-blue-200 space-y-2">
                    {storeDrivers.length > 0 && (
                      <div>
                        <label className="block text-[10px] font-black text-blue-950 mb-1">
                          🛵 اختيار سريع من فريق المتجر الداخلي:
                        </label>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const sel = storeDrivers.find((d) => d.id === e.target.value);
                            if (sel) {
                              handleUpdateDispatchDraft(order.id, {
                                provider: 'custom',
                                driverName: sel.name,
                                driverPhone: sel.phone,
                                deliveryCost: sel.commissionPerOrder || 25,
                              });
                            }
                          }}
                          className="w-full p-1.5 text-xs rounded-lg border border-blue-300 bg-white font-bold text-stone-900 focus:outline-blue-600"
                        >
                          <option value="" disabled>
                            -- اختر سائقاً من فريق خُضرة --
                          </option>
                          {storeDrivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.phone}) • {d.commissionPerOrder} DH
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[9px] font-black text-stone-600 mb-0.5">
                          اسم السائق:
                        </label>
                        <input
                          type="text"
                          value={draft.driverName || ''}
                          onChange={(e) =>
                            handleUpdateDispatchDraft(order.id, { driverName: e.target.value })
                          }
                          placeholder="مثال: يوسف"
                          className="w-full p-1 text-xs rounded border border-stone-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-stone-600 mb-0.5">
                          هاتف السائق:
                        </label>
                        <input
                          type="tel"
                          value={draft.driverPhone || ''}
                          onChange={(e) =>
                            handleUpdateDispatchDraft(order.id, { driverPhone: e.target.value })
                          }
                          placeholder="06XXXXXXXX"
                          className="w-full p-1 text-xs rounded border border-stone-300 bg-white"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-stone-600">الأجرة (DH):</label>
                        <input
                          type="number"
                          value={draft.deliveryCost ?? 25}
                          onChange={(e) =>
                            handleUpdateDispatchDraft(order.id, {
                              deliveryCost: Number(e.target.value) || 0,
                            })
                          }
                          className="w-16 p-1 text-xs rounded border border-stone-300 font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={savingDispatchId === order.id}
                        onClick={() => handleSaveDispatch(order)}
                        className="py-1 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-black text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        {savingDispatchId === order.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                        <span>حفظ البيانات</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* تضمين زرين الإستدعاء أسفل البطاقة (تصميم grid cols 1) */}
                <div className="pt-2 border-t border-blue-200/80 grid grid-cols-1 gap-1.5">
                  {/* زر استدعاء سائق من فريق متجر خضرة (رسالة مجهزة، خيار أساسي) */}
                  <button
                    type="button"
                    onClick={() => handleCallStoreTeamDriver(order)}
                    className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                    title="استدعاء سائق من فريق متجر خضرة (خيار أساسي)"
                  >
                    <Bike className="w-4 h-4 text-emerald-200" />
                    <span>استدعاء سائق فريق متجر خُضرة (أساسي)</span>
                    <Send className="w-3 h-3 text-emerald-300 mr-auto" />
                  </button>

                  {/* زر استدعاء سائق indrive (رسالة مجهزة، خيار ثانوي احتياطي) */}
                  <button
                    type="button"
                    onClick={() => handleCallInDriveDriver(order)}
                    className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-l from-stone-800 to-stone-900 hover:from-stone-900 hover:to-black text-[#F5D76E] font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer border border-stone-700"
                    title="استدعاء سائق inDrive (خيار ثانوي احتياطي)"
                  >
                    <Car className="w-4 h-4 text-amber-400" />
                    <span>استدعاء سائق inDrive (احتياطي)</span>
                    <Navigation className="w-3 h-3 text-amber-300 mr-auto" />
                  </button>
                </div>
              </div>

              {/* أزرار: ملصق الشحن + الفاتورة + الخريطة (تصميم grid cols 3) */}
              <div className="mb-3 grid grid-cols-3 gap-1.5">
                {/* زر ملصق الشحن (الخاصة بمندوب التوصيل) */}
                <button
                  type="button"
                  onClick={() => setBordereauOrder({ ...order, delivery_dispatch: draft })}
                  className="py-2 px-1 rounded-xl bg-[#163920] hover:bg-[#0E2615] text-white font-black text-[11px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="ملصق الشحن والبوليصة لمندوب التوصيل"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F5D76E]" />
                  <span className="truncate leading-none">ملصق الشحن</span>
                </button>

                {/* زر الفاتورة (الخاصة بالعميل) */}
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(order)}
                  className="py-2 px-1 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-[11px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="فاتورة الطلب للعميل"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-200" />
                  <span className="truncate leading-none">الفاتورة</span>
                </button>

                {/* زر الخريطة (موقع العميل) */}
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-[11px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="موقع العميل على خرائط جوجل"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-200" />
                  <span className="truncate leading-none">موقع العميل</span>
                </a>
              </div>

              {/* حالة الطلب وأزرار الانتقال للمرحلة الموالية */}
              <div className="pt-2.5 border-t border-[#F0E9DA]">
                <div className="text-[10px] font-black text-stone-500 mb-1.5 flex items-center justify-between">
                  <span>حالة الطلب:</span>
                  {isUpdating && <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="py-2 px-2 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs border-2 border-blue-600 cursor-default"
                  >
                    <span>تم التجهيز</span>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(order.id, 'delivered')}
                    className="py-2 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs flex items-center justify-center gap-1.5 border-2 border-emerald-300 hover:border-emerald-500 transition-all cursor-pointer active:scale-95 shadow-xs"
                    title="تحويل الطلب إلى تم التسليم"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تحويل للتسليم</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // ─── المرحلة الثالثة: تم التسليم والتحصيل المالي ───
  // ═══════════════════════════════════════════════════════════════
  const renderDeliveredBranchCards = () => {
    if (activeDeliveredOrders.length === 0) {
      return (
        <div className="p-8 text-center bg-white/70 rounded-2xl border-2 border-dashed border-emerald-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-black text-[#787163]">
            لا توجد طلبات تم تسليمها حالياً
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {activeDeliveredOrders.map((order) => {
          const isUpdating = updatingId === order.id;
          const orderCode = order.order_code || String(order.id);
          const isPaid = paidOrderCodes.has(orderCode);

          return (
            <article
              key={order.id}
              className="bg-white rounded-2xl border-2 border-emerald-200 shadow-xs hover:border-emerald-400 hover:shadow-md p-3.5 transition-all text-right relative overflow-hidden"
            >
              {/* شريط حالة علوي زمردي */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-emerald-500 to-teal-600" />

              {/* 1. في البطاقة الأولى: معلومات العميل والإجمالي */}
              {renderCardTopInfo(order)}

              {/* حالة التسليم المكتملة بدون أي علامات [✓] */}
              <div className="mb-2.5">
                <div className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs border-2 border-emerald-600 cursor-default">
                  <span>تم التسليم</span>
                </div>
              </div>

              {/* 2. أزرار الدفع والتقييم والحذف النهائي */}
              <div className="pt-2 border-t border-[#F0E9DA] mb-2 space-y-2">
                {/* زر تأكيد استلام المبلغ نقداً (COD) */}
                <button
                  type="button"
                  onClick={() => handleTogglePaymentConfirmation(order)}
                  className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-between transition-all active:scale-95 cursor-pointer shadow-xs border-2 ${
                    isPaid
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                  title="تأكيد استلام المبلغ من الزبون عند الاستلام COD"
                >
                  <div className="flex items-center gap-1.5">
                    <Coins className={`w-4 h-4 ${isPaid ? 'text-white' : 'text-amber-600'}`} />
                    <span>
                      {isPaid ? 'تم تأكيد استلام المبلغ (COD)' : 'تأكيد الدفع (استلام المبلغ نقداً)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold opacity-90">
                    {isPaid ? 'مدفوع' : 'غير مؤكد'}
                  </span>
                </button>

                {/* زر: إرسال رسالة تقييم الخدمة للعميل (رقم هاتف العميل وليس السائق) */}
                <button
                  type="button"
                  onClick={() => handleSendCustomerReview(order)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                  title={`إرسال رسالة تقييم الخدمة للعميل عبر واتساب على رقم العميل (${order.phone}) وليس السائق`}
                >
                  <Star className="w-4 h-4 text-amber-100 fill-amber-100" />
                  <span>إرسال رسالة تقييم الخدمة للعميل</span>
                  <MessageCircle className="w-4 h-4 text-white mr-auto" />
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* زر الفاتورة */}
                  <button
                    type="button"
                    onClick={() => setInvoiceOrder(order)}
                    className="py-2 px-2 rounded-xl bg-[#F7F4EC] hover:bg-[#EAE2D2] text-[#524B3E] font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-[#E8E1D3]"
                    title="عرض وطباعة فاتورة العميل"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-700" />
                    <span>فاتورة الطلب</span>
                  </button>

                  {/* استبدال زر أرشفة الطلب بزر حذف الطلب (حذف نهائي) */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOrder(order)}
                    className="py-2 px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border shadow-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                    title="حذف هذا الطلب نهائياً من قاعدة البيانات"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span className="truncate">حذف الطلب (نهائي)</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const panelBody = (
    <>
      <div
        className={`relative bg-[#FBF9F5] w-full ${
          standalone
            ? 'max-w-[98vw] xl:max-w-7xl mx-auto shadow-md rounded-3xl min-h-[700px]'
            : 'w-full max-w-[98vw] xl:max-w-7xl shadow-2xl rounded-[28px] max-h-screen sm:max-h-[94vh]'
        } flex flex-col overflow-hidden text-right border border-[#E8E1D3]`}
      >
        {/* ═══════════ الشريط العلوي المدمج ═══════════ */}
        <div className="px-3 sm:px-5 py-2.5 bg-gradient-to-l from-[#163920] to-[#0E2615] text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/15">
              <ShoppingBag className="w-4 h-4 text-[#F5D76E]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black leading-tight">إدارة الطلبات</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 border border-white/15"
              title="تحديث الطلبات"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer border border-white/15"
                title="إغلاق اللوحة"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ═══════════ Toast ═══════════ */}
        {toast && (
          <div
            className={`px-4 py-2.5 text-xs font-black flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
                : 'bg-red-50 text-red-900 border-b border-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* ═══════════ التبديل بين إدارة الطلبات ومسارات التوصيل ═══════════ */}
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
            <Layers className="w-4 h-4" />
            <span>إدارة الطلبات</span>
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
            <span>مسارات التوصيل والفريق</span>
            <span className="px-2 py-0.5 rounded-full bg-[#C25E12]/15 text-[#C25E12] text-[10px]">
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
              onRefreshOrders={handleRefresh}
            />
          </div>
        ) : (
          <>
            {/* ═══════════ شريط البحث والتصفية ═══════════ */}
            <div className="p-3 sm:p-4 bg-[#F7F4EC] border-b border-[#E8E1D3] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787163] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث برقم الطلب، اسم العميل، الهاتف، أو العنوان..."
                  className="w-full pr-9 pl-9 py-2 rounded-xl border border-[#E8E1D3] bg-white text-xs sm:text-sm focus:outline-none focus:border-[#163920] focus:ring-2 focus:ring-[#163920]/15 text-[#112616] transition-all"
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

              {/* أزرار تنقل مراحل الطلبات للهاتف الصغير */}
              <div className="flex lg:hidden items-center gap-1 overflow-x-auto no-scrollbar py-1">
                <button
                  type="button"
                  onClick={() => setMobileStageView('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black shrink-0 transition-colors ${
                    mobileStageView === 'all'
                      ? 'bg-[#163920] text-white'
                      : 'bg-white text-stone-700 border border-stone-200'
                  }`}
                >
                  الكل ({filteredOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStageView('pending')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black shrink-0 transition-colors ${
                    mobileStageView === 'pending'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-amber-900 border border-amber-300'
                  }`}
                >
                  قيد الإنشاء ({branchPendingOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStageView('prepared')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black shrink-0 transition-colors ${
                    mobileStageView === 'prepared'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-900 border border-blue-300'
                  }`}
                >
                  تم التجهيز ({branchPreparedOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStageView('delivered')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black shrink-0 transition-colors ${
                    mobileStageView === 'delivered'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-emerald-900 border border-emerald-300'
                  }`}
                >
                  تم التسليم ({branchDeliveredOrders.length})
                </button>
              </div>
            </div>

            {/* ═══════════ المراحل الرئيسية (قيد الإنشاء، تم التجهيز، تم التسليم) ═══════════ */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              {isLoading ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-9 h-9 text-[#163920] animate-spin mx-auto mb-3" />
                  <p className="text-xs text-[#787163] font-black">جارٍ تحميل بيانات الطلبات...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                  {/* ──────────────────────────────────────────
                      1. قيد الإنشاء
                  ────────────────────────────────────────── */}
                  <section
                    className={`flex flex-col bg-[#F7F4EC]/60 rounded-3xl border-2 border-amber-200/80 p-3 sm:p-4 min-h-[350px] transition-all ${
                      mobileStageView !== 'all' && mobileStageView !== 'pending' ? 'hidden lg:flex' : 'flex'
                    }`}
                  >
                    {/* رأس قسم قيد الإنشاء */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-amber-300/70">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs font-black text-sm">
                          1
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-[#112616]">قيد الإنشاء</h3>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black tabular-nums">
                        {branchPendingOrders.length}
                      </span>
                    </div>

                    {/* بطاقات قيد الإنشاء */}
                    {renderPendingBranchCards()}
                  </section>

                  {/* ──────────────────────────────────────────
                      2. تم التجهيز
                  ────────────────────────────────────────── */}
                  <section
                    className={`flex flex-col bg-[#F7F4EC]/60 rounded-3xl border-2 border-blue-200/80 p-3 sm:p-4 min-h-[350px] transition-all ${
                      mobileStageView !== 'all' && mobileStageView !== 'prepared' ? 'hidden lg:flex' : 'flex'
                    }`}
                  >
                    {/* رأس قسم تم التجهيز */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-blue-300/70">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs font-black text-sm">
                          2
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-[#112616]">تم التجهيز</h3>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-xs font-black tabular-nums">
                        {branchPreparedOrders.length}
                      </span>
                    </div>

                    {/* بطاقات تم التجهيز */}
                    {renderPreparedBranchCards()}
                  </section>

                  {/* ──────────────────────────────────────────
                      3. تم التسليم
                  ────────────────────────────────────────── */}
                  <section
                    className={`flex flex-col bg-[#F7F4EC]/60 rounded-3xl border-2 border-emerald-200/80 p-3 sm:p-4 min-h-[350px] transition-all ${
                      mobileStageView !== 'all' && mobileStageView !== 'delivered' ? 'hidden lg:flex' : 'flex'
                    }`}
                  >
                    {/* رأس قسم تم التسليم */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-emerald-300/70">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs font-black text-sm">
                          3
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-[#112616]">تم التسليم</h3>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black tabular-nums">
                        {branchDeliveredOrders.length}
                      </span>
                    </div>

                    {/* بطاقات مرحلة تم التسليم */}
                    {renderDeliveredBranchCards()}
                  </section>
                </div>
              )}
            </div>

            {/* ═══════════ شريط أسفل اللوحة (Footer) ═══════════ */}
            <div className="p-3 sm:p-4 bg-white border-t border-[#E8E1D3] flex items-center justify-between gap-2 shrink-0">
              <div className="text-[11px] text-[#787163] font-black flex items-center gap-3">
                <span>
                  إجمالي الطلبات:{' '}
                  <strong className="text-[#112616] text-xs tabular-nums">{orders.length}</strong>
                </span>
                <span>•</span>
                <span className="text-amber-800">قيد الإنشاء: {branchPendingOrders.length}</span>
                <span className="text-blue-800">تم التجهيز: {branchPreparedOrders.length}</span>
                <span className="text-emerald-800">تم التسليم: {branchDeliveredOrders.length}</span>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-gradient-to-l from-[#163920] to-[#0E2615] hover:from-[#0E2615] hover:to-[#071A0C] text-white text-xs font-black cursor-pointer active:scale-95 transition-all border-2 border-[#0E2615] shadow-xs"
                >
                  إغلاق اللوحة
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══════════ مودال تأكيد الحذف ═══════════ */}
      {deleteConfirmOrder && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
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
              <span className="text-red-600 font-black">لا يمكن التراجع عن هذا الإجراء.</span>
            </p>
            <div className="bg-[#F7F4EC] p-3.5 rounded-xl border border-[#E8E1D3] mb-4 text-xs text-[#524B3E] space-y-1.5">
              <div className="flex justify-between">
                <span className="font-black">الهاتف:</span>
                <span className="tabular-nums" dir="ltr">
                  {deleteConfirmOrder.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-black">الإجمالي:</span>
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
    </>
  );

  if (standalone) {
    return (
      <div className="w-full space-y-4">
        {panelBody}
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
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        {panelBody}
      </div>

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
