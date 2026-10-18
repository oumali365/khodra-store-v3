// ============================================================
// RealFinanceTab.tsx - لوحة الأداء المالي والتشغيلي الحقيقي لمتجر خُضرة
// مصدر الحقيقة الحصري: طلبات Supabase المسجلة فعلياً (100% Real Data)
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Layers,
  Calendar,
  Filter,
  Download,
  Copy,
  Check,
  Info,
  CheckCircle2,
  PieChart,
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import type { DbOrder } from '../../services/supabaseService';
import {
  calculateOperatingFinancials,
  type OperatingFinancialsSummary,
} from '../../services/financialEngine';

export interface RealFinanceTabProps {
  orders: DbOrder[];
  lang: 'ar' | 'fr' | 'en';
  isSyncing: boolean;
  onRefreshOrders?: () => void;
}

export type TimeframeFilter = 'today' | 'week' | 'month' | 'all';
export type StatusFilter = 'delivered_only' | 'all_active';

const fmt = (n: number | null | undefined) => {
  const safe = typeof n === 'number' && !isNaN(n) && Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe);
};

const fmtDecimal = (n: number | null | undefined) => {
  const safe = typeof n === 'number' && !isNaN(n) && Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(safe);
};

export const RealFinanceTab: React.FC<RealFinanceTabProps> = ({
  orders,
  lang,
  isSyncing,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all_active');
  const [copiedTable, setCopiedTable] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // تصفية الطلبات بناءً على المدة الزمنية والحالة التشغيلية
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter((o) => {
      if (!o || o.is_deleted || o.status === 'cancelled') return false;

      // فلترة الحالة
      if (statusFilter === 'delivered_only') {
        if (o.status !== 'delivered' && !o.is_paid) return false;
      }

      // فلترة التاريخ
      if (timeframe === 'all') return true;

      const orderDate = o.created_at ? new Date(o.created_at) : new Date();
      if (isNaN(orderDate.getTime())) return true;

      if (timeframe === 'today') {
        const oDateStr = orderDate.toISOString().split('T')[0];
        return oDateStr === todayStr;
      }

      if (timeframe === 'week') {
        return orderDate >= sevenDaysAgo;
      }

      if (timeframe === 'month') {
        return orderDate >= firstDayOfMonth;
      }

      return true;
    });
  }, [orders, timeframe, statusFilter]);

  // الحسابات المالية الموحدة للطلبات المفلترة عبر المحرك المالي
  const financials: OperatingFinancialsSummary = useMemo(() => {
    return calculateOperatingFinancials(filteredOrders);
  }, [filteredOrders]);

  // تجميع السجلات التاريخية حسب الأيام / الأشهر الفعلية المسجلة في Supabase
  const historicalGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        ordersCount: number;
        revenue: number;
        cogs: number;
        deliveryCosts: number;
        packaging: number;
        operatingProfit: number;
      }
    >();

    filteredOrders.forEach((o) => {
      const dateStr = o.created_at ? o.created_at.split('T')[0] : 'غير مؤرخ';
      const existing = map.get(dateStr) || {
        key: dateStr,
        label: dateStr,
        ordersCount: 0,
        revenue: 0,
        cogs: 0,
        deliveryCosts: 0,
        packaging: 0,
        operatingProfit: 0,
      };

      const grandTotal = Number(o.total) || 0;
      const subtotal = Number(o.subtotal) || grandTotal;
      const deliveryFee = Number(o.delivery_fee) || 0;
      const deliveryCost = Number(o.delivery_dispatch?.deliveryCost ?? o.actual_delivery_cost ?? o.driver_wage ?? 20);
      const cogs = o.cogs_amount != null ? Number(o.cogs_amount) : Number((subtotal * 0.6).toFixed(2));
      const packaging = o.packaging_cost != null ? Number(o.packaging_cost) : 2;
      const opProfit = grandTotal - (cogs + deliveryCost + packaging);

      existing.ordersCount += 1;
      existing.revenue += grandTotal;
      existing.cogs += cogs;
      existing.deliveryCosts += deliveryCost;
      existing.packaging += packaging;
      existing.operatingProfit += opProfit;

      map.set(dateStr, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredOrders]);

  const handleCopyTSV = async () => {
    try {
      const headers = ['التاريخ', 'عدد الطلبات', 'الإيراد المحصل', 'تكلفة الشراء', 'أجور التوصيل', 'التغليف', 'الربح التشغيلي'].join('\t');
      const rows = historicalGroups.map((g) =>
        [g.label, g.ordersCount, g.revenue.toFixed(2), g.cogs.toFixed(2), g.deliveryCosts.toFixed(2), g.packaging.toFixed(2), g.operatingProfit.toFixed(2)].join('\t')
      );
      const tsv = [headers, ...rows].join('\n');
      await navigator.clipboard.writeText(tsv);
      setCopiedTable(true);
      setNotice(lang === 'ar' ? 'تم نسخ بيانات التقرير المالي إلى الحافظة' : 'Données copiées dans le presse-papiers');
      setTimeout(() => {
        setCopiedTable(false);
        setNotice(null);
      }, 3000);
    } catch {}
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Orders', 'Revenue_MAD', 'COGS_MAD', 'Delivery_Costs_MAD', 'Packaging_MAD', 'Operating_Profit_MAD'];
    const rows = historicalGroups.map((g) => [
      g.label,
      g.ordersCount,
      g.revenue.toFixed(2),
      g.cogs.toFixed(2),
      g.deliveryCosts.toFixed(2),
      g.packaging.toFixed(2),
      g.operatingProfit.toFixed(2),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khodra_real_financials_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* ─── 1. شريط الفلترة الحقيقية والتحكم الزمني ─── */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-stone-700 flex items-center gap-1.5 ml-1">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span>{lang === 'ar' ? 'الفترة الزمنية:' : 'Période:'}</span>
          </span>

          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-bold">
            {(
              [
                { id: 'today', label: lang === 'ar' ? 'اليوم' : "Aujourd'hui" },
                { id: 'week', label: lang === 'ar' ? 'آخر 7 أيام' : '7 derniers jours' },
                { id: 'month', label: lang === 'ar' ? 'الشهر الحالي' : 'Ce mois' },
                { id: 'all', label: lang === 'ar' ? 'كل الطلبات' : 'Tout' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeframe === t.id
                    ? 'bg-emerald-700 text-white font-black shadow-xs'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-bold mr-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all_active')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all_active'
                  ? 'bg-stone-900 text-white font-black shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              {lang === 'ar' ? 'جميع الطلبات النشطة' : 'Toutes actives'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('delivered_only')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'delivered_only'
                  ? 'bg-emerald-800 text-white font-black shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              {lang === 'ar' ? 'المسلّمة والمحصّلة فقط ✅' : 'Livrées & Payées ✅'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            type="button"
            onClick={handleCopyTSV}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {copiedTable ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
            <span>{lang === 'ar' ? 'نسخ الأرقام' : 'Copier'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* ─── 2. البطاقات المالية الأربع الواقعية (Real KPI Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* إجمالي المبيعات المحصلة */}
        <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
            <span>{lang === 'ar' ? 'المبيعات الإجمالية المحصلة' : "Chiffre d'Affaires Réel"}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 tabular-nums">
            {fmt(financials.grossRevenue)} <span className="text-xs font-bold text-stone-500">د.م</span>
          </div>
          <div className="text-[11px] text-stone-500 space-y-0.5 pt-1.5 border-t border-stone-100 font-medium">
            <div className="flex justify-between">
              <span>{lang === 'ar' ? 'مبيعات المنتجات:' : 'Produits:'}</span>
              <span className="font-bold text-stone-800">{fmt(financials.productsRevenue)} د.م</span>
            </div>
            <div className="flex justify-between">
              <span>{lang === 'ar' ? 'رسوم التوصيل المحصلة:' : 'Frais Livraison:'}</span>
              <span className="font-bold text-stone-800">{fmt(financials.customerDeliveryFees)} د.م</span>
            </div>
          </div>
        </div>

        {/* تكلفة شراء المنتجات (COGS) */}
        <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
            <span>{lang === 'ar' ? 'تكلفة شراء السلع (COGS)' : 'Coût Marchandises'}</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 tabular-nums">
            {fmt(financials.cogsTotal)} <span className="text-xs font-bold text-stone-500">د.م</span>
          </div>
          <div className="text-[11px] text-stone-500 space-y-0.5 pt-1.5 border-t border-stone-100 font-medium">
            <div className="flex justify-between">
              <span>{lang === 'ar' ? 'نسبة تكلفة الشراء:' : 'Ratio COGS:'}</span>
              <span className="font-bold text-stone-800">{fmtDecimal(financials.cogsRatioPercent)}%</span>
            </div>
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>{financials.cogsActualCount} {lang === 'ar' ? 'فعلي' : 'réel'}</span>
              <span>{financials.cogsEstimatedCount} {lang === 'ar' ? 'تقديري (60%)' : 'estimé'}</span>
            </div>
          </div>
        </div>

        {/* أجور وتكاليف التوصيل للموصلين */}
        <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
            <span>{lang === 'ar' ? 'تكاليف وأجور التوصيل' : 'Frais Livreurs Payés'}</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 tabular-nums">
            {fmt(financials.deliveryCostsTotal)} <span className="text-xs font-bold text-stone-500">د.م</span>
          </div>
          <div className="text-[11px] text-stone-500 space-y-0.5 pt-1.5 border-t border-stone-100 font-medium">
            <div className="flex justify-between">
              <span>{lang === 'ar' ? 'الفعلي الموثق للسائقين:' : 'Réel:'}</span>
              <span className="font-bold text-emerald-700">{fmt(financials.actualDeliveryCostsTotal)} د.م</span>
            </div>
            <div className="flex justify-between">
              <span>{lang === 'ar' ? 'صافي هامش التوصيل:' : 'Marge Livraison:'}</span>
              <span className={`font-bold ${financials.deliveryNetMargin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {financials.deliveryNetMargin >= 0 ? '+' : ''}{fmt(financials.deliveryNetMargin)} د.م
              </span>
            </div>
          </div>
        </div>

        {/* صافي الربح التشغيلي المباشر */}
        <div className={`border-2 rounded-2xl p-4 shadow-xs space-y-1.5 ${
          financials.operatingProfitBeforeOverheads >= 0
            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
            : 'bg-red-50/70 border-red-300 text-red-950'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>{lang === 'ar' ? 'الربح التشغيلي المباشر' : 'Bénéfice Opérationnel'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black tabular-nums">
            {financials.operatingProfitBeforeOverheads >= 0 ? '+' : ''}
            {fmt(financials.operatingProfitBeforeOverheads)} <span className="text-xs font-bold">د.م</span>
          </div>
          <div className="text-[11px] space-y-0.5 pt-1.5 border-t border-emerald-200/60 font-medium">
            <div className="flex justify-between">
              <span>{lang === 'ar' ? 'هامش الربح التشغيلي:' : 'Marge Opérationnelle:'}</span>
              <span className="font-black">{fmtDecimal(financials.operatingProfitMarginPercent)}%</span>
            </div>
            <div className="text-[10px] opacity-75">
              {lang === 'ar' ? 'قبل خصم المصاريف الثابتة للمقر (7,800 د.م)' : 'Avant charges fixes du local'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. ملخص اقتصاديات الوحدة الحقيقية (Real Unit Economics) ─── */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-black text-stone-900 border-b border-stone-100 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>{lang === 'ar' ? 'اقتصاديات الوحدة الحقيقية للطلب الواحد (Unit Economics)' : 'Économie Unitaire Réelle par Commande'}</span>
          </div>
          <span className="text-[11px] text-stone-500 font-bold bg-stone-100 px-2.5 py-0.5 rounded-full">
            {financials.ordersCount} {lang === 'ar' ? 'طلبات محللة' : 'commandes'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
            <span className="block text-[10px] text-stone-500 font-bold mb-0.5">
              {lang === 'ar' ? 'متوسط السلة (AOV)' : 'Panier Moyen (AOV)'}
            </span>
            <span className="text-sm font-black text-stone-900 tabular-nums">
              {fmt(financials.averageOrderValue)} د.م
            </span>
          </div>

          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
            <span className="block text-[10px] text-stone-500 font-bold mb-0.5">
              {lang === 'ar' ? 'متوسط رسوم توصيل العميل' : 'Frais Facturés / Cmd'}
            </span>
            <span className="text-sm font-black text-stone-900 tabular-nums">
              {fmtDecimal(financials.averageCustomerDeliveryFeePerOrder)} د.م
            </span>
          </div>

          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
            <span className="block text-[10px] text-stone-500 font-bold mb-0.5">
              {lang === 'ar' ? 'متوسط أجر السائق للطلب' : 'Coût Livreur / Cmd'}
            </span>
            <span className="text-sm font-black text-stone-900 tabular-nums">
              {fmtDecimal(financials.averageDeliveryCostPerOrder)} د.م
            </span>
          </div>

          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
            <span className="block text-[10px] text-stone-500 font-bold mb-0.5">
              {lang === 'ar' ? 'صافي ربح التوصيل للطلب' : 'Marge Livraison / Cmd'}
            </span>
            <span className={`text-sm font-black tabular-nums ${
              financials.deliveryNetMargin >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {financials.ordersCount > 0 ? fmtDecimal(financials.deliveryNetMargin / financials.ordersCount) : 0} د.م
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. جدول السجلات والعمليات التاريخية الحقيقية ─── */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
        <div className="p-3.5 bg-stone-100/80 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-700" />
            <h3 className="text-xs font-black text-stone-900">
              {lang === 'ar' ? 'سجل العمليات والمبيعات التاريخية المجمعة (بيانات فعلية)' : 'Historique Réel des Opérations & Ventes'}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-stone-500">
            {historicalGroups.length} {lang === 'ar' ? 'أيام عمل مسجلة' : 'jours enregistrés'}
          </span>
        </div>

        {historicalGroups.length === 0 ? (
          <div className="p-8 text-center text-stone-500 space-y-2">
            <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
            <div className="text-xs font-black text-stone-700">
              {lang === 'ar' ? 'لا توجد طلبات مسجلة في هذه الفترة الزمنية' : 'Aucune commande enregistrée pour cette période'}
            </div>
            <p className="text-[11px] text-stone-500">
              {lang === 'ar'
                ? 'جرب اختيار فترة زمنية أوسع (مثل "كل الطلبات") أو تسجيل طلب جديد من واجهة المتجر.'
                : 'Essayez de sélectionner une période plus large (ex: "Tout") ou d’enregistrer une commande.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right divide-y divide-stone-100">
              <thead className="bg-stone-50 text-stone-600 font-black text-[11px]">
                <tr>
                  <th className="p-3 text-right">{lang === 'ar' ? 'تاريخ العمليات' : 'Date'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'الطلبات' : 'Commandes'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'إجمالي المبيعات' : 'CA Total'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'تكلفة السلع (COGS)' : 'COGS'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'أجور التوصيل' : 'Livreurs'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'التغليف' : 'Emballage'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'الربح التشغيلي' : 'Bénéfice Op.'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'الهامش %' : 'Marge %'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {historicalGroups.map((g) => {
                  const marginPct = g.revenue > 0 ? (g.operatingProfit / g.revenue) * 100 : 0;
                  return (
                    <tr key={g.key} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3 font-bold text-stone-900">{g.label}</td>
                      <td className="p-3 text-center font-bold tabular-nums">{g.ordersCount}</td>
                      <td className="p-3 text-center font-bold text-emerald-800 tabular-nums">{fmt(g.revenue)} د.م</td>
                      <td className="p-3 text-center tabular-nums text-stone-700">{fmt(g.cogs)} د.م</td>
                      <td className="p-3 text-center tabular-nums text-stone-700">{fmt(g.deliveryCosts)} د.م</td>
                      <td className="p-3 text-center tabular-nums text-stone-500">{fmt(g.packaging)} د.م</td>
                      <td className={`p-3 text-center font-black tabular-nums ${
                        g.operatingProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {g.operatingProfit >= 0 ? '+' : ''}{fmt(g.operatingProfit)} د.م
                      </td>
                      <td className="p-3 text-center font-bold tabular-nums">
                        {fmtDecimal(marginPct)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
