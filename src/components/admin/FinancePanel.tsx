// ============================================================
// FinancePanel.tsx – اللوحة المالية التفاعلية لمتجر خُضرة
// (نسخة معدلة: تصحيح نقطة التعادل + مبدل اللغة + بيانات متوافقة مع التقرير)
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  X, TrendingUp, DollarSign, Package, Target,
  Download, RotateCcw, Save, BarChart3, LineChart, Percent,
  Info, Sparkles, ChevronDown, ChevronUp, Settings, CheckCircle2, AlertCircle,
  Globe, Copy, Check,
} from 'lucide-react';

export interface FinancePanelProps {
  isOpen?: boolean;
  standalone?: boolean;
  onClose?: () => void;
}

export type FinanceLang = 'fr' | 'ar' | 'en';

// ─── قاموس المصطلحات المالية متعدد اللغات ───
const FINANCE_TRANSLATIONS = {
  fr: {
    title: 'Tableau Financier & Prévisions',
    subtitle: 'Modèle économique Khodra Fès • Prévisions de trésorerie sur 12 mois',
    revenue: "Chiffre d'Affaires (CA)",
    revenueSub: 'MAD sur 12 mois',
    netProfit: 'Bénéfice Net',
    marginSub: 'Marge',
    orders: 'Commandes Totales',
    ordersAvgSub: 'Moyenne',
    ordersPerDaySub: 'cmd/jour',
    avgBasket: 'Panier Moyen (AOV)',
    avgBasketSub: 'MAD / commande',
    breakEvenTitle: '🎯 Seuil de Rentabilité (Point Mort / Break-Even)',
    breakEvenDesc: (orders: number, perDay: number) =>
      `Il vous faut seulement ${orders} commandes/mois (≈ ${perDay} cmd/jour ouvrable) pour couvrir l'ensemble des charges fixes et variables.`,
    assumptionsTitle: '⚙️ Hypothèses de Coûts & Marges (Paramètres)',
    cogs: 'Coût des Marchandises (COGS) %',
    deliveryCost: 'Frais de Livraison (MAD/cmd)',
    fixedCosts: 'Charges Fixes (MAD/mois)',
    taxes: 'Taux Imposition Estimé %',
    tableTitle: 'Tableau Mensuel Détaillé des Revenus, Coûts et Marges',
    thMonth: 'Mois',
    thOrders: 'Commandes',
    thRevenue: 'CA (MAD)',
    thExpenses: 'Dépenses',
    thNetProfit: 'Bénéfice Net',
    thMargin: 'Marge %',
    thTotal: 'Total Annuel',
    chartRevenue: "📈 Évolution du Chiffre d'Affaires Mensuel",
    chartProfit: '📊 Bénéfice Net Mensuel',
    monthsAdjustTitle: 'Ajuster les données mensuelles détaillées (M01 - M12)',
    workingDays: 'Jours ouvrables',
    ordersPerDay: 'cmd/jour',
    exportCsv: 'Exporter CSV (Excel)',
    exportSuccess: 'Fichier CSV exporté avec succès !',
    copyTable: 'Copier les données',
    copySuccess: 'Données copiées dans le presse-papiers !',
    saveSuccess: 'Modifications enregistrées avec succès',
    autoSaveText: 'Sauvegarde automatique activée',
    close: 'Fermer',
    operationalBreakEven: 'Seuil de Rentabilité Opérationnel',
    ordersPerMonth: 'cmd/mois',
  },
  ar: {
    title: 'اللوحة المالية والتوقعات',
    subtitle: 'توقعات نموذج عمل خُضرة فاس • خطة 12 شهراً',
    revenue: 'إجمالي الإيرادات (CA)',
    revenueSub: 'د.م خلال 12 شهر',
    netProfit: 'صافي الربح',
    marginSub: 'هامش',
    orders: 'إجمالي الطلبات',
    ordersAvgSub: 'متوسط',
    ordersPerDaySub: 'طلب/يوم',
    avgBasket: 'متوسط السلة (AOV)',
    avgBasketSub: 'درهم/طلب',
    breakEvenTitle: '🎯 نقطة التعادل (Break-even Point / Seuil de Rentabilité)',
    breakEvenDesc: (orders: number, perDay: number) =>
      `تحتاج فقط إلى ${orders} طلب في الشهر للوصول لنقطة التعادل (≈ ${perDay} طلب/يوم عمل).`,
    assumptionsTitle: '⚙️ الفرضيات الأساسية ونسب التكاليف (Paramètres)',
    cogs: 'تكلفة المنتجات (COGS) %',
    deliveryCost: 'تكلفة التوصيل (د.م/طلب)',
    fixedCosts: 'مصاريف ثابتة (د.م/شهر)',
    taxes: 'الضرائب التقديرية %',
    tableTitle: 'الجدول الشهري التفصيلي للأرباح والتكاليف (Tableau Mensuel)',
    thMonth: 'الشهر',
    thOrders: 'الطلبات',
    thRevenue: 'الإيرادات',
    thExpenses: 'المصاريف',
    thNetProfit: 'الربح الصافي',
    thMargin: 'هامش الربح',
    thTotal: 'المجموع',
    chartRevenue: '📈 نمو الإيرادات الشهرية (CA Mensuel)',
    chartProfit: '📊 صافي الربح الشهري (Bénéfice Net)',
    monthsAdjustTitle: 'تعديل بيانات الأشهر الـ 12 بالتفصيل',
    workingDays: 'أيام العمل',
    ordersPerDay: 'طلب/يوم',
    exportCsv: 'تصدير جدول Excel / CSV',
    exportSuccess: 'تم تصدير ملف CSV بنجاح!',
    copyTable: 'نسخ أرقام الجدول',
    copySuccess: 'تم نسخ أرقام الجدول إلى الحافظة بنجاح!',
    saveSuccess: 'تم حفظ التعديلات بنجاح',
    autoSaveText: 'حفظ تلقائي مفعّل',
    close: 'إغلاق',
    operationalBreakEven: 'نقطة التعادل التشغيلي',
    ordersPerMonth: 'طلب/شهر',
  },
  en: {
    title: 'Financial Dashboard & Forecasts',
    subtitle: 'Khodra Fes Business Model • 12-Month Cashflow Projections',
    revenue: 'Gross Revenue (Turnover)',
    revenueSub: 'MAD over 12 months',
    netProfit: 'Net Profit',
    marginSub: 'Margin',
    orders: 'Total Orders',
    ordersAvgSub: 'Average',
    ordersPerDaySub: 'orders/day',
    avgBasket: 'Average Order Value (AOV)',
    avgBasketSub: 'MAD / order',
    breakEvenTitle: '🎯 Break-Even Point (Seuil de Rentabilité)',
    breakEvenDesc: (orders: number, perDay: number) =>
      `You only need ${orders} orders/month (≈ ${perDay} orders/working day) to reach the break-even point.`,
    assumptionsTitle: '⚙️ Cost Assumptions & Margins (Settings)',
    cogs: 'Cost of Goods Sold (COGS) %',
    deliveryCost: 'Delivery Cost (MAD/order)',
    fixedCosts: 'Fixed Costs (MAD/month)',
    taxes: 'Est. Tax Rate %',
    tableTitle: 'Detailed Monthly Revenue, Expenses & Profit Breakdown',
    thMonth: 'Month',
    thOrders: 'Orders',
    thRevenue: 'Revenue',
    thExpenses: 'Total Expenses',
    thNetProfit: 'Net Profit',
    thMargin: 'Margin %',
    thTotal: 'Annual Total',
    chartRevenue: '📈 Monthly Revenue Growth',
    chartProfit: '📊 Monthly Net Profit',
    monthsAdjustTitle: 'Adjust detailed monthly inputs (M01 - M12)',
    workingDays: 'Working days',
    ordersPerDay: 'orders/day',
    exportCsv: 'Export CSV (Excel)',
    exportSuccess: 'CSV file exported successfully!',
    copyTable: 'Copy Table Data',
    copySuccess: 'Table numbers copied to clipboard!',
    saveSuccess: 'Changes saved successfully',
    autoSaveText: 'Auto-save enabled',
    close: 'Close',
    operationalBreakEven: 'Operational Break-Even Point',
    ordersPerMonth: 'orders/month',
  },
};

// ─── الأنواع والواجهات ───
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
  totalExpenses: number;
  netProfit: number;
  margin: number;
}

export interface Assumptions {
  cogsPercent: number;
  deliveryCostPerOrder: number;
  fixedCostsPerMonth: number;
  taxPercent: number;
}

// ─── البيانات الأولية (تم تحديثها لتتطابق مع الجدول في الصورة) ───
export const INITIAL_MONTHS: MonthData[] = [
  { month: 1, ordersPerDay: 6, workingDays: 26, avgBasket: 115 },  // الشهر 1: 6 طلبات
  { month: 2, ordersPerDay: 9, workingDays: 26, avgBasket: 115 },
  { month: 3, ordersPerDay: 12, workingDays: 26, avgBasket: 115 }, // الشهر 3: 12 طلب
  { month: 4, ordersPerDay: 14, workingDays: 26, avgBasket: 115 },
  { month: 5, ordersPerDay: 16, workingDays: 26, avgBasket: 115 },
  { month: 6, ordersPerDay: 18, workingDays: 26, avgBasket: 115 }, // الشهر 6: 18 طلب
  { month: 7, ordersPerDay: 20, workingDays: 26, avgBasket: 116 },
  { month: 8, ordersPerDay: 22, workingDays: 26, avgBasket: 117 },
  { month: 9, ordersPerDay: 24, workingDays: 26, avgBasket: 118 },
  { month: 10, ordersPerDay: 26, workingDays: 26, avgBasket: 119 },
  { month: 11, ordersPerDay: 27, workingDays: 26, avgBasket: 119 },
  { month: 12, ordersPerDay: 28, workingDays: 26, avgBasket: 120 }, // الشهر 12: 28 طلب
];

export const INITIAL_ASSUMPTIONS: Assumptions = {
  cogsPercent: 68,
  deliveryCostPerOrder: 8,
  fixedCostsPerMonth: 7800, // ⚠️ تم رفعه من 550 إلى 7800 ليتوافق مع نقطة التعادل 10-12 طلب/يوم
  taxPercent: 1,
};

// ─── أدوات التنسيق الرقمي ───
const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtDecimal = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
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

export const FinancePanel: React.FC<FinancePanelProps> = ({
  isOpen = false,
  standalone = false,
  onClose,
}) => {
  const [lang, setLang] = useState<FinanceLang>('ar');

  const [months, setMonths] = useState<MonthData[]>(() => {
    try {
      const saved = localStorage.getItem('khodra_finance_months');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 12) {
          const valid = parsed.every(
            (m) =>
              m &&
              Number.isFinite(m.month) &&
              Number.isFinite(m.ordersPerDay) &&
              m.ordersPerDay > 0 &&
              Number.isFinite(m.workingDays) &&
              Number.isFinite(m.avgBasket)
          );
          if (valid) return parsed;
        }
      }
    } catch {}
    return INITIAL_MONTHS;
  });

  const [assumptions, setAssumptions] = useState<Assumptions>(() => {
    try {
      const saved = localStorage.getItem('khodra_finance_assumptions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          Number.isFinite(parsed.cogsPercent) &&
          Number.isFinite(parsed.deliveryCostPerOrder) &&
          Number.isFinite(parsed.fixedCostsPerMonth) &&
          Number.isFinite(parsed.taxPercent)
        ) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_ASSUMPTIONS;
  });

  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showMonths, setShowMonths] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [copiedTable, setCopiedTable] = useState(false);

  const t = FINANCE_TRANSLATIONS[lang] || FINANCE_TRANSLATIONS.ar;

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

  // ⚠️ قفل تمرير الصفحة فقط في وضع النافذة المنبثقة وليس في الصفحة المستقلة لتجنب تجمد الشاشة
  useEffect(() => {
    if (isOpen && !standalone) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen, standalone]);

  useEffect(() => {
    if (!isOpen || standalone) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, standalone, onClose]);

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

  const totals = useMemo(() => {
    const totalRevenue = results.reduce((s, r) => s + r.revenue, 0);
    const totalExpenses = results.reduce((s, r) => s + r.totalExpenses, 0);
    const totalProfit = results.reduce((s, r) => s + r.netProfit, 0);
    const totalOrders = results.reduce((s, r) => s + r.totalOrders, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalRevenue, totalExpenses, totalProfit, totalOrders, avgMargin, avgBasket };
  }, [results]);

  const updateMonth = (index: number, field: keyof MonthData, value: number) => {
    const safeVal = Number.isFinite(value) && value > 0 ? value : 1;
    setMonths((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: safeVal } : m))
    );
  };

  const handleConfirmReset = () => {
    setMonths(INITIAL_MONTHS);
    setAssumptions(INITIAL_ASSUMPTIONS);
    try {
      localStorage.removeItem('khodra_finance_months');
      localStorage.removeItem('khodra_finance_assumptions');
    } catch {}
    setConfirmingReset(false);
    setSavedFlash(true);
    setFeedbackMessage('Données réinitialisées aux valeurs d’origine');
    setTimeout(() => {
      setSavedFlash(false);
      setFeedbackMessage(null);
    }, 2500);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('khodra_finance_months', JSON.stringify(months));
      localStorage.setItem('khodra_finance_assumptions', JSON.stringify(assumptions));
      setSavedFlash(true);
      setFeedbackMessage('Modifications enregistrées avec succès');
      setTimeout(() => {
        setSavedFlash(false);
        setFeedbackMessage(null);
      }, 2500);
    } catch {
      setFeedbackMessage('Erreur lors de la sauvegarde locale');
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const handleExportCSV = () => {
    let headers: string[];
    let totalLabel: string;

    if (lang === 'fr') {
      headers = [
        'Mois', 'Commandes/Jour', 'Jours Ouvres', 'Commandes Totales', 'Panier Moyen (MAD)',
        'Chiffre Affaires (MAD)', 'Cout Marchandises (COGS)', 'Frais Livraison', 'Charges Fixes',
        'Marketing', 'Emballage', 'Taxes', 'Depenses Totales', 'Benefice Net', 'Marge %',
      ];
      totalLabel = 'Total Annuel';
    } else if (lang === 'en') {
      headers = [
        'Month', 'Orders/Day', 'Working Days', 'Total Orders', 'AOV (MAD)',
        'Gross Revenue (MAD)', 'COGS', 'Delivery Cost', 'Fixed Costs',
        'Marketing', 'Packaging', 'Taxes', 'Total Expenses', 'Net Profit', 'Margin %',
      ];
      totalLabel = 'Annual Total';
    } else {
      headers = [
        'الشهر', 'طلبات/يوم', 'أيام العمل', 'إجمالي الطلبات', 'متوسط السلة',
        'الإيرادات (درهم)', 'تكلفة المنتجات', 'تكلفة التوصيل', 'مصاريف ثابتة',
        'تسويق', 'تغليف', 'ضرائب', 'إجمالي المصاريف', 'صافي الربح', 'الهامش %',
      ];
      totalLabel = 'المجموع';
    }

    const rows = results.map((r) => [
      lang === 'fr' ? `M${String(r.month).padStart(2, '0')}` : r.month,
      r.ordersPerDay, r.workingDays, r.totalOrders, r.avgBasket,
      r.revenue.toFixed(2), r.cogs.toFixed(2), r.deliveryCost.toFixed(2),
      r.fixedCosts.toFixed(2), r.marketing.toFixed(2), r.packaging.toFixed(2),
      r.taxes.toFixed(2), r.totalExpenses.toFixed(2), r.netProfit.toFixed(2),
      r.margin.toFixed(2),
    ]);

    const totalRow = [
      totalLabel, '', '', totals.totalOrders, totals.avgBasket.toFixed(2),
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
    a.download = `khodra_previsions_financieres_12_mois_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMessage(t.exportSuccess || 'Fichier CSV exporté avec succès !');
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  const handleCopyTableTSV = async () => {
    try {
      const headers = ['Mois', 'Commandes', 'CA', 'Depenses', 'Benefice_Net', 'Marge_%'].join('\t');
      const rows = results.map((r) =>
        [r.month, r.totalOrders, r.revenue.toFixed(0), r.totalExpenses.toFixed(0), r.netProfit.toFixed(0), r.margin.toFixed(1)].join('\t')
      );
      const total = ['Total', totals.totalOrders, totals.totalRevenue.toFixed(0), totals.totalExpenses.toFixed(0), totals.totalProfit.toFixed(0), totals.avgMargin.toFixed(1)].join('\t');
      const tsv = [headers, ...rows, total].join('\n');
      await navigator.clipboard.writeText(tsv);
      setCopiedTable(true);
      setFeedbackMessage(t.copySuccess);
      setTimeout(() => {
        setCopiedTable(false);
        setFeedbackMessage(null);
      }, 3000);
    } catch {}
  };

  // ⚠️ تصحيح حساب نقطة التعادل لتعتمد على بيانات الشهر الأول والفرضيات المحدثة مع حماية من القسمة على صفر أو القيم غير المحددة
  const breakEven = useMemo(() => {
    const firstMonth = months[0] || INITIAL_MONTHS[0];
    const targetAOV = Number.isFinite(firstMonth?.avgBasket) && (firstMonth?.avgBasket ?? 0) > 0 ? firstMonth.avgBasket : 115;
    const cogsPct = Number.isFinite(assumptions.cogsPercent) ? assumptions.cogsPercent : 68;
    const deliveryCost = Number.isFinite(assumptions.deliveryCostPerOrder) ? assumptions.deliveryCostPerOrder : 8;
    const taxPct = Number.isFinite(assumptions.taxPercent) ? assumptions.taxPercent : 1;
    const fixedCosts = Number.isFinite(assumptions.fixedCostsPerMonth) ? assumptions.fixedCostsPerMonth : 7800;

    const variableCostPerOrder =
      (targetAOV * cogsPct) / 100 +
      deliveryCost +
      2 + // Packaging cost
      (targetAOV * taxPct) / 100;
    const contribution = targetAOV - variableCostPerOrder;
    if (!Number.isFinite(contribution) || contribution <= 0) {
      return { orders: 999, perDay: 38, workingDays: 26 };
    }
    
    const breakevenOrders = Math.max(1, Math.ceil(fixedCosts / contribution));
    const workingDays = Number.isFinite(firstMonth?.workingDays) && (firstMonth?.workingDays ?? 0) > 0 ? firstMonth.workingDays : 26;
    const breakevenPerDay = Math.max(1, Math.ceil(breakevenOrders / workingDays));
    
    return { orders: breakevenOrders, perDay: breakevenPerDay, workingDays };
  }, [months, assumptions]);

  const maxRevenue = Math.max(...results.map((r) => (Number.isFinite(r.revenue) ? r.revenue : 0)), 1);
  const maxProfit = Math.max(...results.map((r) => (Number.isFinite(r.netProfit) ? Math.abs(r.netProfit) : 0)), 1);

  if (!isOpen && !standalone) return null;

  const panelBody = (
    <div
      lang={lang}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`relative bg-[#FAF8F4] w-full ${
        standalone
          ? 'max-w-7xl mx-auto shadow-md rounded-3xl'
          : 'sm:max-w-6xl shadow-2xl sm:rounded-3xl max-h-screen sm:max-h-[95vh] flex flex-col overflow-hidden'
      } text-left border border-[#E8E1D3]`}
    >

        {/* ═══════ Header ═══════ */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#C25E12] to-[#9C4505] text-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-md">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner shrink-0">
              <BarChart3 className="w-5 h-5 text-[#F5D76E]" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg flex items-center gap-2">
                <span>{t.title}</span>
                <Sparkles className="w-4 h-4 text-[#F5D76E]" />
              </h2>
              <p className="text-[11px] sm:text-xs text-orange-100/90 font-medium">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
            {/* Language Switcher */}
            <div className="flex items-center bg-black/25 rounded-xl border border-white/20 p-0.5">
              {(['fr', 'ar', 'en'] as FinanceLang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 text-[10px] font-black rounded-lg transition-colors cursor-pointer ${
                    lang === l ? 'bg-white text-[#C25E12]' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-black text-amber-200 shadow-xs">
              <span>Norme Comptable Marocaine (MAD)</span>
            </div>

            {savedFlash && (
              <span className="hidden sm:inline-block text-[11px] bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold shadow-xs">
                ✓
              </span>
            )}

            <button
              type="button"
              onClick={handleCopyTableTSV}
              className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
              title={t.copyTable}
            >
              {copiedTable ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span className="hidden md:inline">{t.copyTable}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
              title={t.exportCsv}
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">CSV</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
              title="Enregistrer"
            >
              <Save className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
              title="Réinitialiser"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ═══════ إشعار تنبيهي أو تأكيد ═══════ */}
        {feedbackMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedbackMessage}</span>
            </div>
            <button type="button" onClick={() => setFeedbackMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ═══════ شريط تأكيد الاستعادة ═══════ */}
        {confirmingReset && (
          <div className="bg-amber-50 border-b border-amber-300 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-amber-950">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Voulez-vous vraiment réinitialiser les prévisions aux valeurs d’origine ?</span>
            </div>
            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-xs cursor-pointer active:scale-95"
              >
                Oui, réinitialiser
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold text-xs cursor-pointer hover:bg-stone-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* ═══════ المحتوى الرئيسي ═══════ */}
        <div className={`${standalone ? 'p-3 sm:p-5 space-y-4' : 'flex-1 overflow-y-auto p-3 sm:p-5 space-y-4'}`}>

          {/* ─── 4 بطاقات مؤشرات أداء رئيسية KPI Cards ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="bg-white border-2 border-emerald-200 rounded-2xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
                <span>{t.revenue}</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-emerald-950 tabular-nums">
                {fmt(totals.totalRevenue)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">{t.revenueSub}</p>
            </div>

            <div className={`border-2 rounded-2xl p-3 sm:p-4 shadow-xs ${getProfitColor(totals.totalProfit)}`}>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>{t.netProfit}</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-2xl font-black tabular-nums">
                {totals.totalProfit >= 0 ? '+' : ''}{fmt(totals.totalProfit)}
              </div>
              <p className="text-[10px] sm:text-[11px] mt-1 font-medium opacity-75">
                {t.marginSub} {fmtDecimal(totals.avgMargin)}%
              </p>
            </div>

            <div className="bg-white border-2 border-blue-200 rounded-2xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-blue-800 font-bold mb-1">
                <span>{t.orders}</span>
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-blue-950 tabular-nums">
                {fmt(totals.totalOrders)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">
                {t.ordersAvgSub} {fmtDecimal(totals.totalOrders / 12 / 26)} {t.ordersPerDaySub}
              </p>
            </div>

            <div className="bg-white border-2 border-amber-200 rounded-2xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
                <span>{t.avgBasket}</span>
                <Target className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-amber-950 tabular-nums">
                {fmt(totals.avgBasket)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">
                {t.avgBasketSub}
              </p>
            </div>
          </div>

          {/* ─── بطاقة نقطة التعادل (تم إعادة تصميمها لتشبه الصورة) ─── */}
          <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 opacity-50"></div>
            <div className="relative z-10">
              <div className="text-xs font-black text-stone-500 mb-2 flex items-center justify-center gap-1.5">
                <Target className="w-4 h-4 text-[#C25E12]" />
                {t.operationalBreakEven}
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#C25E12] tabular-nums">
                  {breakEven.perDay}
                </span>
                <span className="text-sm font-bold text-stone-600">
                  {t.ordersPerDay}
                </span>
              </div>
              <div className="text-xs font-bold text-stone-400 mt-1">
                ({breakEven.orders} {t.ordersPerMonth})
              </div>
            </div>
          </div>

          {/* ─── الفرضيات الأساسية القابلة للتعديل ─── */}
          <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowAssumptions(!showAssumptions)}
              className="w-full p-3 sm:p-4 flex items-center justify-between gap-2 hover:bg-[#FAF8F4] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#1E4327]" />
                <span className="font-black text-sm text-[#1E4327]">
                  {t.assumptionsTitle}
                </span>
              </div>
              {showAssumptions ? <ChevronUp className="w-5 h-5 text-stone-500" /> : <ChevronDown className="w-5 h-5 text-stone-500" />}
            </button>

            {showAssumptions && (
              <div className="border-t border-[#E8E1D3] p-3 sm:p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-[#FAF8F4]">
                <label className="block">
                  <span className="text-xs font-bold text-stone-700 block mb-1">{t.cogs}</span>
                  <input
                    type="number"
                    value={assumptions.cogsPercent}
                    onChange={(e) => setAssumptions((p) => ({ ...p, cogsPercent: +e.target.value }))}
                    min="0" max="100" step="1"
                    inputMode="decimal"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm font-bold text-stone-900 focus:outline-none focus:border-[#1E4327] focus:ring-2 focus:ring-[#1E4327]/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-stone-700 block mb-1">{t.deliveryCost}</span>
                  <input
                    type="number"
                    value={assumptions.deliveryCostPerOrder}
                    onChange={(e) => setAssumptions((p) => ({ ...p, deliveryCostPerOrder: +e.target.value }))}
                    min="0" step="1"
                    inputMode="decimal"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm font-bold text-stone-900 focus:outline-none focus:border-[#1E4327] focus:ring-2 focus:ring-[#1E4327]/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-stone-700 block mb-1">{t.fixedCosts}</span>
                  <input
                    type="number"
                    value={assumptions.fixedCostsPerMonth}
                    onChange={(e) => setAssumptions((p) => ({ ...p, fixedCostsPerMonth: +e.target.value }))}
                    min="0" step="50"
                    inputMode="decimal"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm font-bold text-stone-900 focus:outline-none focus:border-[#1E4327] focus:ring-2 focus:ring-[#1E4327]/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-stone-700 block mb-1">{t.taxes}</span>
                  <input
                    type="number"
                    value={assumptions.taxPercent}
                    onChange={(e) => setAssumptions((p) => ({ ...p, taxPercent: +e.target.value }))}
                    min="0" max="20" step="0.5"
                    inputMode="decimal"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm font-bold text-stone-900 focus:outline-none focus:border-[#1E4327] focus:ring-2 focus:ring-[#1E4327]/20"
                  />
                </label>
              </div>
            )}
          </div>

          {/* ─── محرر بيانات الأشهر الـ 12 ─── */}
          <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowMonths(!showMonths)}
              className="w-full p-3 sm:p-4 flex items-center justify-between gap-2 hover:bg-[#FAF8F4] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1E4327]" />
                <span className="font-black text-sm text-[#1E4327]">
                  {t.monthsAdjustTitle}
                </span>
              </div>
              {showMonths ? <ChevronUp className="w-5 h-5 text-stone-500" /> : <ChevronDown className="w-5 h-5 text-stone-500" />}
            </button>

            {showMonths && (
              <div className="border-t border-[#E8E1D3] p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {months.map((m, i) => (
                  <div key={m.month} className="bg-[#FAF8F4] border border-[#E8E1D3] rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1E4327] text-white flex items-center justify-center font-black text-xs shrink-0 font-mono">
                      M{String(m.month).padStart(2, '0')}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-1.5">
                      <label className="block">
                        <span className="text-[10px] font-bold text-stone-500 block">{t.ordersPerDay}</span>
                        <input
                          type="number"
                          value={m.ordersPerDay}
                          onChange={(e) => updateMonth(i, 'ordersPerDay', +e.target.value)}
                          min="1" max="100"
                          inputMode="decimal"
                          className="w-full px-2 py-1 rounded-md border border-stone-300 bg-white text-xs font-bold text-stone-900 focus:outline-none focus:border-[#1E4327] focus:ring-2 focus:ring-[#1E4327]/20"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold text-stone-500 block">{t.avgBasket}</span>
                        <input
                          type="number"
                          value={m.avgBasket}
                          onChange={(e) => updateMonth(i, 'avgBasket', +e.target.value)}
                          min="20" max="500" step="5"
                          inputMode="decimal"
                          className="w-full px-2 py-1 rounded-md border border-stone-300 bg-white text-xs font-bold text-stone-900 focus:outline-none focus:border-[#1E4327] focus:ring-2 focus:ring-[#1E4327]/20"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── الجدول الشهري التفصيلي ─── */}
          <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3 sm:p-4 bg-gradient-to-r from-[#C25E12] to-[#9C4505] text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#F5D76E]" />
                <span className="font-black text-sm">{t.tableTitle}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyTableTSV}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedTable ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTable ? t.copySuccess : t.copyTable}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-[#FAF8F4] border-b border-[#E8E1D3]">
                  <tr className="text-[11px] sm:text-xs font-black text-stone-700">
                    <th className="p-2 text-left">{t.thMonth}</th>
                    <th className="p-2 text-center">{t.thOrders}</th>
                    <th className="p-2 text-center">{t.thRevenue}</th>
                    <th className="p-2 text-center">{t.thExpenses}</th>
                    <th className="p-2 text-center">{t.thNetProfit}</th>
                    <th className="p-2 text-center">{t.thMargin}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.month} className="border-b border-[#F0E9DA] hover:bg-[#FAF8F4] transition-colors">
                      <td className="p-2 text-left">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-[#1E4327] text-white font-mono font-black text-[11px]">
                          {lang === 'fr' ? `M${String(r.month).padStart(2, '0')}` : r.month}
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
                              style={{ width: `${Math.min(100, Math.max(0, r.margin * 3))}%` }}
                            />
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold tabular-nums">
                            {fmtDecimal(r.margin)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-r from-[#C25E12]/10 to-[#9C4505]/10 border-t-2 border-[#C25E12] font-black">
                    <td className="p-2 text-left text-[#C25E12]">{t.thTotal}</td>
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

          {/* ─── المخططات البيانية ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl p-3 sm:p-4 shadow-xs">
              <h3 className="font-black text-sm text-[#1E4327] mb-3 flex items-center gap-2">
                <LineChart className="w-4 h-4 text-emerald-600" />
                <span>{t.chartRevenue}</span>
              </h3>
              <div className="space-y-1.5">
                {results.map((r) => (
                  <div key={r.month} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-500 w-8 text-center font-mono">
                      {lang === 'fr' ? `M${String(r.month).padStart(2, '0')}` : r.month}
                    </span>
                    <div className="flex-1 h-5 bg-stone-100 rounded-md overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${(r.revenue / maxRevenue) * 100}%` }}
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-white drop-shadow">
                        {fmt(r.revenue)} MAD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border-2 border-[#E8E1D3] rounded-2xl p-3 sm:p-4 shadow-xs">
              <h3 className="font-black text-sm text-[#1E4327] mb-3 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>{t.chartProfit}</span>
              </h3>
              <div className="space-y-1.5">
                {results.map((r) => (
                  <div key={r.month} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-500 w-8 text-center font-mono">
                      {lang === 'fr' ? `M${String(r.month).padStart(2, '0')}` : r.month}
                    </span>
                    <div className="flex-1 h-5 bg-stone-100 rounded-md overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-300 ${
                          r.netProfit >= 0
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                            : 'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                        style={{ width: `${(Math.abs(r.netProfit) / maxProfit) * 100}%` }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-800">
                        {r.netProfit >= 0 ? '+' : ''}{fmt(r.netProfit)} MAD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-stone-500 py-2 border-t border-[#E8E1D3]">
            💾 {t.autoSaveText} • 📥 {t.exportCsv}
          </div>
        </div>

        {/* ═══════ Footer ═══════ */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E8E1D3] flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-stone-500 font-medium">
            {savedFlash ? (
              <span className="text-emerald-600 font-bold">✓ {t.saveSuccess}</span>
            ) : (
              <>{t.autoSaveText}</>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#C25E12] hover:bg-[#9C4505] text-white text-xs font-black cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              {t.close}
            </button>
          )}
        </div>

      </div>
  );

  if (standalone) {
    return (
      <div className="w-full space-y-4">
        {panelBody}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      {panelBody}
    </div>
  );
};

export default FinancePanel;