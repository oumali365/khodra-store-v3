// ============================================================
// FinancePanel.tsx – اللوحة المالية التفاعلية لمتجر خُضرة
// modal مستقل يُفتح من البطاقة الصفراء
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  X, TrendingUp, DollarSign, Package, Target,
  Download, RotateCcw, Save, BarChart3, LineChart, Percent,
  Info, Sparkles, ChevronDown, ChevronUp, Settings,
} from 'lucide-react';

interface FinancePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── الأنواع ───
interface MonthData {
  month: number;
  ordersPerDay: number;
  workingDays: number;
  avgBasket: number;
}

interface MonthResult extends MonthData {
  totalOrders: number;
  revenue: number;
  cogs: number;
  deliveryCost: number;
  fixedCosts: number;
  marketing: number;
  packaging: number;
  taxes: number;
  totalExpenses: number;
  netProfit: number;
  margin: number;
}

interface Assumptions {
  cogsPercent: number;
  deliveryCostPerOrder: number;
  fixedCostsPerMonth: number;
  taxPercent: number;
}

// ─── البيانات الأولية ───
const INITIAL_MONTHS: MonthData[] = [
  { month: 1, ordersPerDay: 5, workingDays: 26, avgBasket: 90 },
  { month: 2, ordersPerDay: 8, workingDays: 26, avgBasket: 90 },
  { month: 3, ordersPerDay: 11, workingDays: 26, avgBasket: 95 },
  { month: 4, ordersPerDay: 14, workingDays: 26, avgBasket: 95 },
  { month: 5, ordersPerDay: 16, workingDays: 26, avgBasket: 100 },
  { month: 6, ordersPerDay: 18, workingDays: 26, avgBasket: 100 },
  { month: 7, ordersPerDay: 20, workingDays: 26, avgBasket: 100 },
  { month: 8, ordersPerDay: 21, workingDays: 26, avgBasket: 105 },
  { month: 9, ordersPerDay: 22, workingDays: 26, avgBasket: 105 },
  { month: 10, ordersPerDay: 23, workingDays: 26, avgBasket: 110 },
  { month: 11, ordersPerDay: 24, workingDays: 26, avgBasket: 110 },
  { month: 12, ordersPerDay: 25, workingDays: 26, avgBasket: 115 },
];

const INITIAL_ASSUMPTIONS: Assumptions = {
  cogsPercent: 68,
  deliveryCostPerOrder: 8,
  fixedCostsPerMonth: 550,
  taxPercent: 1,
};

// ─── أدوات مساعدة ───
const fmt = (n: number) => new Intl.NumberFormat('ar-MA', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(n);

const fmtDecimal = (n: number) => new Intl.NumberFormat('ar-MA', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
}).format(n);

const getProfitColor = (profit: number) => {
  if (profit > 10000) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
  if (profit > 3000) return 'text-amber-700 bg-amber-50 border-amber-300';
  if (profit > 0) return 'text-yellow-700 bg-yellow-50 border-yellow-300';
  return 'text-red-700 bg-red-50 border-red-300';
};

const getMarginColor = (margin: number) => {
  if (margin >= 25) return 'bg-emerald-500';
  if (margin >= 15) return 'bg-amber-500';
  if (margin >= 5) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const FinancePanel: React.FC<FinancePanelProps> = ({ isOpen, onClose }) => {
  // ─── الحالة ───
  const [months, setMonths] = useState<MonthData[]>(() => {
    try {
      const saved = localStorage.getItem('khodra_finance_months');
      return saved ? JSON.parse(saved) : INITIAL_MONTHS;
    } catch {
      return INITIAL_MONTHS;
    }
  });

  const [assumptions, setAssumptions] = useState<Assumptions>(() => {
    try {
      const saved = localStorage.getItem('khodra_finance_assumptions');
      return saved ? JSON.parse(saved) : INITIAL_ASSUMPTIONS;
    } catch {
      return INITIAL_ASSUMPTIONS;
    }
  });

  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showMonths, setShowMonths] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // ─── حفظ تلقائي ───
  useEffect(() => {
    try {
      localStorage.setItem('khodra_finance_months', JSON.stringify(months));
    } catch {}
  }, [months]);

  useEffect(() => {
    try {
      localStorage.setItem('khodra_finance_assumptions', JSON.stringify(assumptions));
    } catch {}
  }, [assumptions]);

  // ─── قفل التمرير ───
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  // ─── Escape للإغلاق ───
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ─── الحسابات ───
  const results: MonthResult[] = useMemo(() => {
    return months.map((m) => {
      const totalOrders = m.ordersPerDay * m.workingDays;
      const revenue = totalOrders * m.avgBasket;
      const cogs = revenue * (assumptions.cogsPercent / 100);
      const deliveryCost = totalOrders * assumptions.deliveryCostPerOrder;
      const fixedCosts = assumptions.fixedCostsPerMonth;
      const marketing = revenue * 0.008;
      const packaging = totalOrders * 2;
      const taxes = revenue * (assumptions.taxPercent / 100);
      const totalExpenses = cogs + deliveryCost + fixedCosts + marketing + packaging + taxes;
      const netProfit = revenue - totalExpenses;
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
        totalExpenses,
        netProfit,
        margin,
      };
    });
  }, [months, assumptions]);

  // ─── الإجماليات ───
  const totals = useMemo(() => {
    const totalRevenue = results.reduce((s, r) => s + r.revenue, 0);
    const totalExpenses = results.reduce((s, r) => s + r.totalExpenses, 0);
    const totalProfit = results.reduce((s, r) => s + r.netProfit, 0);
    const totalOrders = results.reduce((s, r) => s + r.totalOrders, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalRevenue, totalExpenses, totalProfit, totalOrders, avgMargin, avgBasket };
  }, [results]);

  // ─── تعديل شهر ───
  const updateMonth = (index: number, field: keyof MonthData, value: number) => {
    setMonths((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  // ─── إعادة تعيين ───
  const handleReset = () => {
    if (confirm('هل أنت متأكد من إعادة كل الأرقام للحالة الأصلية؟')) {
      setMonths(INITIAL_MONTHS);
      setAssumptions(INITIAL_ASSUMPTIONS);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    }
  };

  // ─── حفظ يدوي ───
  const handleSave = () => {
    try {
      localStorage.setItem('khodra_finance_months', JSON.stringify(months));
      localStorage.setItem('khodra_finance_assumptions', JSON.stringify(assumptions));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch {
      alert('تعذّر الحفظ');
    }
  };

  // ─── تصدير CSV ───
  const handleExportCSV = () => {
    const headers = [
      'الشهر', 'طلبات/يوم', 'أيام العمل', 'إجمالي الطلبات', 'متوسط السلة',
      'الإيرادات', 'تكلفة المنتجات', 'تكلفة التوصيل', 'مصاريف ثابتة',
      'تسويق', 'تغليف', 'ضرائب', 'إجمالي المصاريف', 'صافي الربح', 'الهامش %',
    ];

    const rows = results.map((r) => [
      r.month, r.ordersPerDay, r.workingDays, r.totalOrders, r.avgBasket,
      r.revenue.toFixed(2), r.cogs.toFixed(2), r.deliveryCost.toFixed(2),
      r.fixedCosts.toFixed(2), r.marketing.toFixed(2), r.packaging.toFixed(2),
      r.taxes.toFixed(2), r.totalExpenses.toFixed(2), r.netProfit.toFixed(2),
      r.margin.toFixed(2),
    ]);

    const totalRow = [
      'المجموع', '', '', totals.totalOrders, totals.avgBasket.toFixed(2),
      totals.totalRevenue.toFixed(2), '', '', '', '', '', '',
      totals.totalExpenses.toFixed(2), totals.totalProfit.toFixed(2),
      totals.avgMargin.toFixed(2),
    ];

    const csv = [headers, ...rows, totalRow]
      .map((row) => row.map((c) => `"${c}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khodra_financial_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── نقطة التعادل ───
  const breakEven = useMemo(() => {
    const avgBasket = totals.avgBasket || 100;
    const variableCostPerOrder = (avgBasket * assumptions.cogsPercent) / 100
      + assumptions.deliveryCostPerOrder
      + 2
      + (avgBasket * assumptions.taxPercent) / 100;
    const contribution = avgBasket - variableCostPerOrder;
    if (contribution <= 0) return 999;
    return Math.ceil(assumptions.fixedCostsPerMonth / contribution);
  }, [totals.avgBasket, assumptions]);

  const maxRevenue = Math.max(...results.map((r) => r.revenue), 1);
  const maxProfit = Math.max(...results.map((r) => Math.abs(r.netProfit)), 1);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#FAF8F4] w-full sm:max-w-6xl shadow-2xl z-10 sm:rounded-3xl flex flex-col max-h-screen sm:max-h-[95vh] overflow-hidden text-right">

        {/* ═══════ Header ═══════ */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-[#C25E12] to-[#9C4505] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#F5D76E]" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg flex items-center gap-2">
                <span>اللوحة المالية</span>
                <Sparkles className="w-4 h-4 text-[#F5D76E]" />
              </h2>
              <p className="text-[11px] sm:text-xs text-orange-100/90 font-medium">
                توقعات متجر خُضرة • السنة الأولى
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedFlash && (
              <span className="hidden sm:inline-block text-[11px] bg-emerald-500 text-white px-2 py-1 rounded-lg font-bold">
                ✓ تم
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
              title="حفظ"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
              title="تصدير CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
              title="إعادة تعيين"
            >
              <RotateCcw className="w-4 h-4" />
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

        {/* ═══════ Body ═══════ */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">

          {/* ─── 4 KPI Cards ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="bg-white border-2 border-emerald-200 rounded-2xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
                <span>إجمالي الإيرادات</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-emerald-950 tabular-nums">
                {fmt(totals.totalRevenue)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">د.م خلال 12 شهر</p>
            </div>

            <div className={`border-2 rounded-2xl p-3 sm:p-4 shadow-xs ${getProfitColor(totals.totalProfit)}`}>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>صافي الربح</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-2xl font-black tabular-nums">
                {totals.totalProfit >= 0 ? '+' : ''}{fmt(totals.totalProfit)}
              </div>
              <p className="text-[10px] sm:text-[11px] mt-1 font-medium opacity-75">
                هامش {fmtDecimal(totals.avgMargin)}%
              </p>
            </div>

            <div className="bg-white border-2 border-blue-200 rounded-2xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-blue-800 font-bold mb-1">
                <span>إجمالي الطلبات</span>
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-blue-950 tabular-nums">
                {fmt(totals.totalOrders)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">
                متوسط {fmtDecimal(totals.totalOrders / 12 / 26)} طلب/يوم
              </p>
            </div>

            <div className="bg-white border-2 border-amber-200 rounded-2xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
                <span>متوسط السلة</span>
                <Target className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-amber-950 tabular-nums">
                {fmt(totals.avgBasket)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">
                درهم/طلب
              </p>
            </div>
          </div>

          {/* ─── نقطة التعادل ─── */}
          <div className="bg-gradient-to-l from-emerald-50 to-blue-50 border border-emerald-300 rounded-2xl p-3 sm:p-4 flex items-start gap-3 text-xs sm:text-sm">
            <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-black text-emerald-950 mb-0.5">🎯 نقطة التعادل</div>
              <div className="text-emerald-800 font-semibold leading-relaxed">
                تحتاج فقط إلى <strong className="text-emerald-900 text-base">{breakEven}</strong> طلب في الشهر للوصول لنقطة التعادل
                (≈ <strong className="text-emerald-900">{Math.ceil(breakEven / 26)}</strong> طلب/يوم).
              </div>
            </div>
          </div>

          {/* ─── الفرضيات ─── */}
          <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowAssumptions(!showAssumptions)}
              className="w-full p-3 sm:p-4 flex items-center justify-between gap-2 hover:bg-[#FAF8F4] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#1E4327]" />
                <span className="font-black text-sm text-[#1E4327]">
                  ⚙️ الفرضيات الأساسية
                </span>
              </div>
              {showAssumptions ? <ChevronUp className="w-5 h-5 text-stone-500" /> : <ChevronDown className="w-5 h-5 text-stone-500" />}
            </button>

            {showAssumptions && (
              <div className="border-t border-[#E8E1D3] p-3 sm:p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-[#FAF8F4]">
                <label className="block">
                  <span className="text-xs font-bold text-stone-700 block mb-1">تكلفة المنتجات %</span>
                  <input
                    type="number"
                    value={assumptions.cogsPercent}
                    onChange={(e) => setAssumptions((p) => ({ ...p, cogsPercent: +e.target.value }))}
                    min="0" max="100" step="1"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm font-bold focus:outline-none focus:border-[#1E4327]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-stone-700 block mb-1">تكلفة التوصيل (د.م/طلب)</span>
                  <input
                    type="number"
                    value={assumptions.deliveryCostPerOrder}
                    onChange={(e) => setAssumptions((p) => ({ ...p, deliveryCostPerOrder: +e.target.value }))}
                    min="0" step="1"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm font-bold focus:outline-none focus:border-[#1E4327]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-stone-700 block mb-1">مصاريف ثابتة (د.م/شهر)</span>
                  <input
                    type="number"
                    value={assumptions.fixedCostsPerMonth}
                    onChange={(e) => setAssumptions((p) => ({ ...p, fixedCostsPerMonth: +e.target.value }))}
                    min="0" step="50"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm font-bold focus:outline-none focus:border-[#1E4327]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-stone-700 block mb-1">الضرائب %</span>
                  <input
                    type="number"
                    value={assumptions.taxPercent}
                    onChange={(e) => setAssumptions((p) => ({ ...p, taxPercent: +e.target.value }))}
                    min="0" max="20" step="0.5"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm font-bold focus:outline-none focus:border-[#1E4327]"
                  />
                </label>
              </div>
            )}
          </div>

          {/* ─── تعديل الأشهر ─── */}
          <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowMonths(!showMonths)}
              className="w-full p-3 sm:p-4 flex items-center justify-between gap-2 hover:bg-[#FAF8F4] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1E4327]" />
                <span className="font-black text-sm text-[#1E4327]">
                  📅 بيانات الأشهر الـ 12
                </span>
              </div>
              {showMonths ? <ChevronUp className="w-5 h-5 text-stone-500" /> : <ChevronDown className="w-5 h-5 text-stone-500" />}
            </button>

            {showMonths && (
              <div className="border-t border-[#E8E1D3] p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {months.map((m, i) => (
                  <div key={m.month} className="bg-[#FAF8F4] border border-[#E8E1D3] rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1E4327] text-white flex items-center justify-center font-black text-xs shrink-0">
                      {m.month}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-1.5">
                      <label className="block">
                        <span className="text-[10px] font-bold text-stone-500 block">طلبات/يوم</span>
                        <input
                          type="number"
                          value={m.ordersPerDay}
                          onChange={(e) => updateMonth(i, 'ordersPerDay', +e.target.value)}
                          min="1" max="100"
                          className="w-full px-2 py-1 rounded-md border border-stone-300 bg-white text-xs font-bold focus:outline-none focus:border-[#1E4327]"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold text-stone-500 block">السلة (د.م)</span>
                        <input
                          type="number"
                          value={m.avgBasket}
                          onChange={(e) => updateMonth(i, 'avgBasket', +e.target.value)}
                          min="20" max="500" step="5"
                          className="w-full px-2 py-1 rounded-md border border-stone-300 bg-white text-xs font-bold focus:outline-none focus:border-[#1E4327]"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── الجدول الشهري ─── */}
          <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3 sm:p-4 bg-gradient-to-l from-[#C25E12] to-[#9C4505] text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#F5D76E]" />
              <span className="font-black text-sm">الجدول الشهري التفصيلي</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-[#FAF8F4] border-b border-[#E8E1D3]">
                  <tr className="text-[11px] sm:text-xs font-black text-stone-700">
                    <th className="p-2 text-right">الشهر</th>
                    <th className="p-2 text-center">الطلبات</th>
                    <th className="p-2 text-center">الإيرادات</th>
                    <th className="p-2 text-center">المصاريف</th>
                    <th className="p-2 text-center">الربح</th>
                    <th className="p-2 text-center">الهامش</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.month} className="border-b border-[#F0E9DA] hover:bg-[#FAF8F4]">
                      <td className="p-2 text-right">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#1E4327] text-white font-black text-[11px]">
                          {r.month}
                        </span>
                      </td>
                      <td className="p-2 text-center font-bold text-stone-700 tabular-nums">{fmt(r.totalOrders)}</td>
                      <td className="p-2 text-center font-bold text-emerald-700 tabular-nums">{fmt(r.revenue)}</td>
                      <td className="p-2 text-center font-bold text-stone-600 tabular-nums">{fmt(r.totalExpenses)}</td>
                      <td className={`p-2 text-center font-black tabular-nums ${r.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {r.netProfit >= 0 ? '+' : ''}{fmt(r.netProfit)}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-12 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getMarginColor(r.margin)}`}
                              style={{ width: `${Math.min(100, r.margin * 3)}%` }}
                            />
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold tabular-nums">
                            {fmtDecimal(r.margin)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-l from-[#C25E12]/10 to-[#9C4505]/10 border-t-2 border-[#C25E12] font-black">
                    <td className="p-2 text-right text-[#C25E12]">المجموع</td>
                    <td className="p-2 text-center text-[#C25E12] tabular-nums">{fmt(totals.totalOrders)}</td>
                    <td className="p-2 text-center text-emerald-700 tabular-nums">{fmt(totals.totalRevenue)}</td>
                    <td className="p-2 text-center text-stone-700 tabular-nums">{fmt(totals.totalExpenses)}</td>
                    <td className="p-2 text-center text-emerald-700 tabular-nums">+{fmt(totals.totalProfit)}</td>
                    <td className="p-2 text-center text-emerald-700 tabular-nums">{fmtDecimal(totals.avgMargin)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── المخططات ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl p-3 sm:p-4 shadow-xs">
              <h3 className="font-black text-sm text-[#1E4327] mb-3 flex items-center gap-2">
                <LineChart className="w-4 h-4 text-emerald-600" />
                <span>📈 نمو الإيرادات الشهرية</span>
              </h3>
              <div className="space-y-1.5">
                {results.map((r) => (
                  <div key={r.month} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-500 w-6 text-center">{r.month}</span>
                    <div className="flex-1 h-5 bg-stone-100 rounded-md overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-l from-emerald-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${(r.revenue / maxRevenue) * 100}%` }}
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-white drop-shadow">
                        {fmt(r.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl p-3 sm:p-4 shadow-xs">
              <h3 className="font-black text-sm text-[#1E4327] mb-3 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>📊 صافي الربح الشهري</span>
              </h3>
              <div className="space-y-1.5">
                {results.map((r) => (
                  <div key={r.month} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-500 w-6 text-center">{r.month}</span>
                    <div className="flex-1 h-5 bg-stone-100 rounded-md overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-300 ${
                          r.netProfit >= 0
                            ? 'bg-gradient-to-l from-emerald-500 to-emerald-400'
                            : 'bg-gradient-to-l from-red-500 to-red-400'
                        }`}
                        style={{ width: `${(Math.abs(r.netProfit) / maxProfit) * 100}%` }}
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-800">
                        {r.netProfit >= 0 ? '+' : ''}{fmt(r.netProfit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-stone-500 py-3 border-t border-[#E8E1D3]">
            💾 كل تعديل يُحفظ تلقائياً • 📥 استخدم زر التصدير لفتح الملف في Excel
          </div>
        </div>

        {/* ═══════ Footer ═══════ */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E8E1D3] flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-stone-500 font-medium">
            {savedFlash ? (
              <span className="text-emerald-600 font-bold">✓ تم الحفظ</span>
            ) : (
              <>حفظ تلقائي</>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#C25E12] hover:bg-[#9C4505] text-white text-xs font-black cursor-pointer active:scale-95 transition-all"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};