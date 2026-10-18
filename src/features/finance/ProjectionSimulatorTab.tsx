// ============================================================
// ProjectionSimulatorTab.tsx - محاكي دراسة الجدوى والميزانية التقديرية (12 شهراً)
// مخصص للتخطيط المستقبلي ودراسات الجدوى الاستشرافية (Business Plan Simulation)
// مع تصحيح رياضي كامل لخصم المصاريف الثابتة للمقر (7,800 د.م)
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Settings,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Check,
  TrendingUp,
  Target,
  BarChart3,
  LineChart,
  Percent,
  AlertCircle,
  Save,
  RotateCcw,
} from 'lucide-react';

export interface MonthData {
  month: number;
  ordersPerDay: number;
  workingDays: number;
  avgBasket: number;
}

export interface MonthResult extends MonthData {
  totalOrders: number;
  revenue: number;
  cogs: number;
  deliveryCost: number;
  fixedCosts: number;
  marketing: number;
  packaging: number;
  taxes: number;
  directExpenses: number;
  grossOperatingProfit: number;
  netProfit: number;
  margin: number;
}

export interface Assumptions {
  cogsPercent: number;
  deliveryCostPerOrder: number;
  monthlyFixedOverhead: number;
  taxPercent: number;
}

export const INITIAL_SIMULATOR_MONTHS: MonthData[] = [
  { month: 1, ordersPerDay: 6, workingDays: 26, avgBasket: 115 },
  { month: 2, ordersPerDay: 9, workingDays: 26, avgBasket: 115 },
  { month: 3, ordersPerDay: 12, workingDays: 26, avgBasket: 115 },
  { month: 4, ordersPerDay: 14, workingDays: 26, avgBasket: 115 },
  { month: 5, ordersPerDay: 16, workingDays: 26, avgBasket: 115 },
  { month: 6, ordersPerDay: 18, workingDays: 26, avgBasket: 115 },
  { month: 7, ordersPerDay: 20, workingDays: 26, avgBasket: 116 },
  { month: 8, ordersPerDay: 22, workingDays: 26, avgBasket: 117 },
  { month: 9, ordersPerDay: 24, workingDays: 26, avgBasket: 118 },
  { month: 10, ordersPerDay: 26, workingDays: 26, avgBasket: 119 },
  { month: 11, ordersPerDay: 27, workingDays: 26, avgBasket: 119 },
  { month: 12, ordersPerDay: 28, workingDays: 26, avgBasket: 120 },
];

export const INITIAL_SIMULATOR_ASSUMPTIONS: Assumptions = {
  cogsPercent: 60, // ميثاق خُضرة: سقف تكلفة الشراء 60% لضمان هامش إجمالي 40%
  deliveryCostPerOrder: 18, // متوسط تكلفة التوصيل الواقعية للموصّل
  monthlyFixedOverhead: 7800, // إيجار ومصاريف المقر الثابتة شهرياً
  taxPercent: 1,
};

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

export const ProjectionSimulatorTab: React.FC<{ lang: 'ar' | 'fr' | 'en' }> = ({ lang }) => {
  const [months, setMonths] = useState<MonthData[]>(() => {
    try {
      const saved = localStorage.getItem('khodra_simulator_months_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 12) return parsed;
      }
    } catch {}
    return INITIAL_SIMULATOR_MONTHS;
  });

  const [assumptions, setAssumptions] = useState<Assumptions>(() => {
    try {
      const saved = localStorage.getItem('khodra_simulator_assumptions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Number.isFinite(parsed.cogsPercent)) return parsed;
      }
    } catch {}
    return INITIAL_SIMULATOR_ASSUMPTIONS;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showMonthsEditor, setShowMonthsEditor] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const results: MonthResult[] = useMemo(() => {
    return months.map((m) => {
      const totalOrders = m.ordersPerDay * m.workingDays;
      const revenue = totalOrders * m.avgBasket;
      const cogs = revenue * (assumptions.cogsPercent / 100);
      const deliveryCost = totalOrders * assumptions.deliveryCostPerOrder;
      const fixedCosts = assumptions.monthlyFixedOverhead;
      const marketing = revenue * 0.01;
      const packaging = totalOrders * 2;
      const taxes = revenue * (assumptions.taxPercent / 100);

      const directExpenses = cogs + deliveryCost + marketing + packaging + taxes;
      const grossOperatingProfit = revenue - directExpenses;

      // ⚠️ التصحيح الرياضي المحاسبي الحقيقي: خصم المصاريف الثابتة للمقر (7,800 د.م)
      const netProfit = grossOperatingProfit - fixedCosts;
      const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return {
        ...m,
        totalOrders,
        revenue,
        cogs,
        deliveryCost,
        fixedCosts,
        marketing,
        packaging,
        taxes,
        directExpenses,
        grossOperatingProfit,
        netProfit,
        margin,
      };
    });
  }, [months, assumptions]);

  const totals = useMemo(() => {
    const totalOrders = results.reduce((s, r) => s + r.totalOrders, 0);
    const totalRevenue = results.reduce((s, r) => s + r.revenue, 0);
    const totalDirectExpenses = results.reduce((s, r) => s + r.directExpenses, 0);
    const totalFixedCosts = results.reduce((s, r) => s + r.fixedCosts, 0);
    const totalGrossProfit = results.reduce((s, r) => s + r.grossOperatingProfit, 0);
    const totalNetProfit = results.reduce((s, r) => s + r.netProfit, 0);
    const avgMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    const avgBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      totalRevenue,
      totalDirectExpenses,
      totalFixedCosts,
      totalGrossProfit,
      totalNetProfit,
      avgMargin,
      avgBasket,
    };
  }, [results]);

  // حساب نقطة التعادل الدقيقة بناءً على هامش المساهمة الحقيقي للطلب الواحد
  const breakEven = useMemo(() => {
    const firstMonth = months[0] || INITIAL_SIMULATOR_MONTHS[0];
    const aov = firstMonth.avgBasket || 115;
    const varCostPerOrder =
      (aov * assumptions.cogsPercent) / 100 +
      assumptions.deliveryCostPerOrder +
      2 + // التغليف
      (aov * 0.01) + // التسويق
      (aov * assumptions.taxPercent) / 100;

    const unitContribution = aov - varCostPerOrder;
    if (unitContribution <= 0) {
      return { orders: 999, perDay: 39, workingDays: 26 };
    }

    const ordersNeeded = Math.ceil(assumptions.monthlyFixedOverhead / unitContribution);
    const workingDays = firstMonth.workingDays || 26;
    const perDayNeeded = Math.ceil(ordersNeeded / workingDays);

    return { orders: ordersNeeded, perDay: perDayNeeded, workingDays };
  }, [months, assumptions]);

  const updateMonth = (idx: number, field: keyof MonthData, val: number) => {
    const safe = Number.isFinite(val) && val > 0 ? val : 1;
    setMonths((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: safe } : m)));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('khodra_simulator_months_v2', JSON.stringify(months));
      localStorage.setItem('khodra_simulator_assumptions_v2', JSON.stringify(assumptions));
      setNotice('تم حفظ تعديلات المحاكي بنجاح');
      setTimeout(() => setNotice(null), 3000);
    } catch {}
  };

  const handleReset = () => {
    setMonths(INITIAL_SIMULATOR_MONTHS);
    setAssumptions(INITIAL_SIMULATOR_ASSUMPTIONS);
    try {
      localStorage.removeItem('khodra_simulator_months_v2');
      localStorage.removeItem('khodra_simulator_assumptions_v2');
    } catch {}
    setNotice('تمت استعادة الفرضيات القياسية لدراسة الجدوى');
    setTimeout(() => setNotice(null), 3000);
  };

  const maxRevenue = Math.max(...results.map((r) => r.revenue), 1);
  const maxProfit = Math.max(...results.map((r) => Math.abs(r.netProfit)), 1);

  return (
    <div className="space-y-4 text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* ─── تنبيه مالي توضيحي صريح ─── */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-xs flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 leading-relaxed font-medium">
          <strong className="block font-black text-amber-900 mb-0.5">
            {lang === 'ar' ? 'نموذج محاكاة دراسة الجدوى والميزانية التقديرية (12 شهراً):' : 'Modèle de Simulation Prévisionnelle (12 Mois):'}
          </strong>
          {lang === 'ar'
            ? 'هذه الأرقام استشرافية تخطيطية مبنية على فرضيات خطة العمل (Pitch Deck) وتتضمن خصم المصاريف الثابتة للمقر (7,800 د.م شهرياً). لا تمثل هذه الشاشة رصيد الخزينة الحالي للمتجر.'
            : 'Ces chiffres sont des projections basées sur le modèle économique (Pitch Deck) et déduisent les charges fixes du local (7 800 MAD/mois).'}
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* ─── 4 بطاقات KPI للمحاكاة السنوية ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-stone-500 mb-1">
            {lang === 'ar' ? 'الإيرادات التقديرية السنوية' : 'CA Prévisionnel Annuel'}
          </div>
          <div className="text-2xl font-black text-stone-900 tabular-nums">
            {fmt(totals.totalRevenue)} <span className="text-xs font-bold text-stone-500">د.م</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 font-medium">
            {fmt(totals.totalOrders)} {lang === 'ar' ? 'طلب خلال 12 شهراً' : 'commandes sur 12 mois'}
          </p>
        </div>

        <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-stone-500 mb-1">
            {lang === 'ar' ? 'المصاريف الثابتة التراكمية' : 'Charges Fixes Annuelles'}
          </div>
          <div className="text-2xl font-black text-stone-900 tabular-nums">
            {fmt(totals.totalFixedCosts)} <span className="text-xs font-bold text-stone-500">د.م</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 font-medium">
            7,800 د.م/شهر للمقر
          </p>
        </div>

        <div className={`border-2 rounded-2xl p-4 shadow-xs ${
          totals.totalNetProfit >= 0 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-red-50/70 border-red-300 text-red-950'
        }`}>
          <div className="text-xs font-bold mb-1">
            {lang === 'ar' ? 'صافي الربح الحقيقي السنوي' : 'Bénéfice Net Annuel'}
          </div>
          <div className="text-2xl font-black tabular-nums">
            {totals.totalNetProfit >= 0 ? '+' : ''}{fmt(totals.totalNetProfit)} <span className="text-xs font-bold">د.م</span>
          </div>
          <p className="text-[11px] mt-1 font-bold">
            {lang === 'ar' ? 'الهامش الصافي الحقيقي:' : 'Marge Nette:'} {fmtDecimal(totals.avgMargin)}%
          </p>
        </div>

        {/* نقطة التعادل */}
        <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 shadow-xs text-center">
          <div className="text-xs font-bold text-stone-500 mb-1 flex items-center justify-center gap-1.5">
            <Target className="w-4 h-4 text-amber-700" />
            <span>{lang === 'ar' ? 'نقطة التعادل التشغيلي' : 'Point Mort (Break-Even)'}</span>
          </div>
          <div className="text-2xl font-black text-amber-800 tabular-nums">
            {breakEven.perDay} <span className="text-xs font-bold text-stone-600">{lang === 'ar' ? 'طلب/يوم' : 'cmd/jour'}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 font-medium">
            ({breakEven.orders} {lang === 'ar' ? 'طلب/شهر لتغطية المصاريف' : 'cmd/mois'})
          </p>
        </div>
      </div>

      {/* ─── الفرضيات القابلة للتعديل ─── */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-700" />
            <span className="font-black text-xs text-stone-900">
              {lang === 'ar' ? 'فرضيات ومعايير المحاكاة المالية (Paramètres)' : 'Paramètres du Modèle'}
            </span>
          </div>
          {showSettings ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
        </button>

        {showSettings && (
          <div className="p-4 border-t border-stone-200 bg-stone-50/50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {lang === 'ar' ? 'سقف تكلفة الشراء %:' : 'COGS %:'}
                </label>
                <input
                  type="number"
                  value={assumptions.cogsPercent}
                  onChange={(e) => setAssumptions({ ...assumptions, cogsPercent: Number(e.target.value) || 60 })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {lang === 'ar' ? 'تكلفة التوصيل/طلب (د.م):' : 'Coût Livreur / Cmd:'}
                </label>
                <input
                  type="number"
                  value={assumptions.deliveryCostPerOrder}
                  onChange={(e) => setAssumptions({ ...assumptions, deliveryCostPerOrder: Number(e.target.value) || 20 })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {lang === 'ar' ? 'المصاريف الثابتة شهرياً (د.م):' : 'Charges Fixes / Mois:'}
                </label>
                <input
                  type="number"
                  value={assumptions.monthlyFixedOverhead}
                  onChange={(e) => setAssumptions({ ...assumptions, monthlyFixedOverhead: Number(e.target.value) || 7800 })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {lang === 'ar' ? 'الضرائب التقديرية %:' : 'Taux Impôts %:'}
                </label>
                <input
                  type="number"
                  value={assumptions.taxPercent}
                  onChange={(e) => setAssumptions({ ...assumptions, taxPercent: Number(e.target.value) || 1 })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer"
              >
                {lang === 'ar' ? 'استعادة الافتراضي' : 'Réinitialiser'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                {lang === 'ar' ? 'حفظ الفرضيات' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── جدول الأشهر الـ 12 مع خصم مصاريف المقر ─── */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 bg-stone-100/80 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-stone-700" />
            <h3 className="text-xs font-black text-stone-900">
              {lang === 'ar' ? 'جدول المحاكاة والتوقعات الشهرية المفصل (مع خصم المقر)' : 'Tableau Prévisionnel Mensuel (Avec Charges Fixes)'}
            </h3>
          </div>
          <span className="text-[11px] text-stone-500 font-bold">12 {lang === 'ar' ? 'شهراً' : 'mois'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right divide-y divide-stone-100">
            <thead className="bg-stone-50 text-stone-600 font-black text-[11px]">
              <tr>
                <th className="p-3 text-right">{lang === 'ar' ? 'الشهر' : 'Mois'}</th>
                <th className="p-3 text-center">{lang === 'ar' ? 'طلبات/يوم' : 'Cmd/J'}</th>
                <th className="p-3 text-center">{lang === 'ar' ? 'الطلبات' : 'Total Cmd'}</th>
                <th className="p-3 text-center">{lang === 'ar' ? 'الإيرادات' : 'CA'}</th>
                <th className="p-3 text-center">{lang === 'ar' ? 'تكاليف مباشرة' : 'Directes'}</th>
                <th className="p-3 text-center">{lang === 'ar' ? 'المقر الثابت' : 'Fixes'}</th>
                <th className="p-3 text-center">{lang === 'ar' ? 'صافي الربح' : 'Bénéfice Net'}</th>
                <th className="p-3 text-center">{lang === 'ar' ? 'الهامش %' : 'Marge %'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
              {results.map((r) => (
                <tr key={r.month} className="hover:bg-stone-50/70 transition-colors">
                  <td className="p-3 font-bold text-stone-900">M{String(r.month).padStart(2, '0')}</td>
                  <td className="p-3 text-center tabular-nums">{r.ordersPerDay}</td>
                  <td className="p-3 text-center tabular-nums font-bold">{r.totalOrders}</td>
                  <td className="p-3 text-center tabular-nums font-bold text-emerald-800">{fmt(r.revenue)} د.م</td>
                  <td className="p-3 text-center tabular-nums text-stone-600">{fmt(r.directExpenses)} د.م</td>
                  <td className="p-3 text-center tabular-nums text-stone-500">{fmt(r.fixedCosts)} د.م</td>
                  <td className={`p-3 text-center font-black tabular-nums ${
                    r.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {r.netProfit >= 0 ? '+' : ''}{fmt(r.netProfit)} د.م
                  </td>
                  <td className="p-3 text-center font-bold tabular-nums">{fmtDecimal(r.margin)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
