// ============================================================
// AdminOrdersPanel.tsx – نافذة إدارة الطلبات للمدير
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Package, Clock, CheckCircle2, XCircle, Search, Loader2,
  Phone, MapPin, MessageCircle, RefreshCw, ShoppingBag, ExternalLink,
  User, TrendingUp, Calendar, AlertCircle, Inbox,
} from 'lucide-react';
import {
  fetchOrders,
  updateOrderStatus,
  DbOrder,
  OrderStatus,
} from '../services/supabaseService';

interface AdminOrdersPanelProps {
  isOpen: boolean;
  onClose: () => void;
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

// تنظيف رقم الهاتف لرابط واتساب
function toWhatsApp(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('212')) return digits;
  if (digits.startsWith('0')) return '212' + digits.slice(1);
  return digits;
}

// الوقت النسبي
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

export const AdminOrdersPanel: React.FC<AdminOrdersPanelProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // جلب الطلبات عند الفتح
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
    return () => { mounted = false; };
  }, [isOpen]);

  // منع التمرير عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const data = await fetchOrders();
    setOrders(data);
    setIsRefreshing(false);
    setToast({ type: 'success', message: `تم تحديث القائمة (${data.length} طلب)` });
    setTimeout(() => setToast(null), 2500);
  };

  const handleStatusChange = async (orderId: string | number, newStatus: OrderStatus) => {
    const previous = orders.find((o) => o.id === orderId);
    if (!previous || previous.status === newStatus) return;

    // تحديث متفائل (Optimistic)
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    setUpdatingId(orderId);

    const res = await updateOrderStatus(orderId, newStatus);

    if (!res.success) {
      // إرجاع الحالة السابقة عند الفشل
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: previous.status } : o)));
      setToast({ type: 'error', message: `فشل التحديث: ${res.message || 'خطأ غير معروف'}` });
    } else {
      setToast({
        type: 'success',
        message: `تم تحديث الطلب ${previous.order_code} إلى "${STATUS_CONFIG[newStatus].label}"`,
      });
    }
    setUpdatingId(null);
    setTimeout(() => setToast(null), 3000);
  };

  // إحصائيات
  const stats = useMemo(() => {
    const counts = { pending: 0, prepared: 0, delivered: 0, cancelled: 0 };
    orders.forEach((o) => { counts[o.status]++; });
    return counts;
  }, [orders]);

  // الطلبات المفلترة
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
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#FAF8F4] w-full sm:max-w-4xl shadow-2xl z-10 sm:rounded-3xl flex flex-col max-h-screen sm:max-h-[92vh] overflow-hidden text-right">

        {/* ─── Header ─── */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-[#1E4327] to-[#2E5336] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#F5D76E]" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg">إدارة الطلبات</h2>
              <p className="text-[11px] sm:text-xs text-emerald-100/90 font-medium">
                {orders.length} طلب مسجل على المتجر
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              title="تحديث"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Toast ─── */}
        {toast && (
          <div className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-900 border-b border-emerald-300' : 'bg-red-100 text-red-900 border-b border-red-300'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* ─── Stats Row ─── */}
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
                  isActive ? `${cfg.buttonActive}` : 'bg-[#FAF8F4] border-[#E8E1D3] hover:border-[#D4C8B5]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? '' : 'text-stone-600'}`} />
                <div className="text-right flex-1 min-w-0">
                  <div className={`text-[10px] sm:text-[11px] font-bold truncate ${isActive ? '' : 'text-stone-600'}`}>
                    {cfg.label}
                  </div>
                  <div className={`text-base sm:text-lg font-black leading-none ${isActive ? '' : 'text-[#112616]'}`}>
                    {stats[s]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── Search + Filter status ─── */}
        <div className="p-3 sm:p-4 bg-[#FAF8F4] border-b border-[#E8E1D3] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الطلب، الاسم، الهاتف، أو العنوان..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-[#D4C8B5] bg-white text-xs sm:text-sm focus:outline-none focus:border-[#1E4327] text-[#112616]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3 h-3 text-stone-600" />
              </button>
            )}
          </div>

          {filterStatus !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className="px-3 py-2 rounded-xl bg-white border border-[#D4C8B5] text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer flex items-center gap-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>مسح الفلتر</span>
            </button>
          )}
        </div>

        {/* ─── Orders List ─── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-[#1E4327] animate-spin mx-auto mb-3" />
              <p className="text-xs text-stone-500 font-bold">جارٍ تحميل الطلبات...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <Inbox className="w-8 h-8 text-stone-400" />
              </div>
              <p className="text-sm font-black text-stone-700 mb-1">
                {orders.length === 0 ? 'لا توجد طلبات بعد' : 'لا توجد نتائج مطابقة'}
              </p>
              <p className="text-xs text-stone-500">
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
              const wa = toWhatsApp(order.phone);
              const itemsCount = order.items.reduce((s, i) => s + (Number(i.qty) || 1), 0);

              return (
                <article
                  key={order.id}
                  className={`bg-white rounded-2xl border-2 p-3.5 sm:p-4 transition-all ${
                    isUpdating ? 'border-amber-400 shadow-md' : 'border-[#E8E1D3] hover:border-[#D4C8B5]'
                  }`}
                >
                  {/* Row 1: Order code + Status badge + time */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-[#F0E9DA]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm sm:text-base font-black text-[#112616] shrink-0">
                        {order.order_code}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-black shrink-0 ${cfg.pill}`}>
                        <PillIcon className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </span>
                      {isUpdating && <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium shrink-0 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {timeAgo(order.created_at)}
                    </span>
                  </div>

                  {/* Row 2: Customer info + total */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {/* Left: customer */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#C25E12] shrink-0" />
                        <span className="font-black text-[#112616] truncate">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#C25E12] shrink-0" />
                        <span className="font-medium text-stone-700" dir="ltr">{order.phone}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C25E12] shrink-0 mt-0.5" />
                        <span className="font-medium text-stone-700 leading-snug line-clamp-2">{order.address}</span>
                      </div>
                    </div>

                    {/* Right: order summary */}
                    <div className="bg-[#FAF8F4] rounded-xl p-2.5 border border-[#E8E1D3]">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-stone-600 font-bold flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          المنتجات:
                        </span>
                        <span className="font-black text-[#112616]">{itemsCount} قطعة</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-stone-600 font-bold">التوصيل:</span>
                        <span className="font-black text-[#112616]">{order.delivery_fee.toFixed(2)} DH</span>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#E8E1D3]">
                        <span className="text-xs font-black text-[#112616] flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          الإجمالي:
                        </span>
                        <span className="text-sm font-black text-[#C25E12]">{order.total.toFixed(2)} DH</span>
                      </div>
                    </div>
                  </div>

                  {/* Note (delivery slot / payment method / notes) */}
                  {order.note && (
                    <div className="mb-3 p-2 rounded-lg bg-amber-50/50 border border-amber-200 text-[11px] text-amber-950 space-y-0.5">
                      {order.note.split(' | ').map((part, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600 shrink-0">•</span>
                          <span className="leading-snug">{part}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick actions: WhatsApp + Maps */}
                  <div className="flex items-center gap-2 mb-3">
                    {wa && (
                      <a
                        href={`https://wa.me/${wa}?text=${encodeURIComponent(`السلام عليكم ${order.customer_name}، بخصوص طلبكم ${order.order_code} من متجر خُضرة:`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>
                    )}
                    {order.maps_link && (
                      <a
                        href={order.maps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>الخريطة</span>
                      </a>
                    )}
                    <span className="text-[10px] text-stone-400 mr-auto font-medium" title={formatDateTime(order.created_at)}>
                      {formatDateTime(order.created_at)}
                    </span>
                  </div>

                  {/* ─── Status change buttons ─── */}
                  <div className="pt-3 border-t border-[#F0E9DA]">
                    <div className="text-[11px] font-black text-stone-600 mb-2 flex items-center gap-1">
                      <span>تغيير الحالة إلى:</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {STATUS_ORDER.map((s) => {
                        const sCfg = STATUS_CONFIG[s];
                        const SIcon = sCfg.Icon;
                        const isActive = order.status === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={isActive || isUpdating}
                            onClick={() => handleStatusChange(order.id, s)}
                            className={`py-2 px-2 rounded-lg border-2 text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all active:scale-95 touch-manipulation ${
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

        {/* ─── Footer ─── */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E8E1D3] flex items-center justify-between gap-2 shrink-0">
          <p className="text-[11px] text-stone-500 font-medium">
            عرض {filteredOrders.length} من أصل {orders.length} طلب
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1E4327] hover:bg-[#112616] text-white text-xs font-black cursor-pointer active:scale-95 transition-all"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};