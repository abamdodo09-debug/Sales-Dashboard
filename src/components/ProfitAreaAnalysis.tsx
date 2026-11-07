import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Percent,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  ArrowUpDown,
  Search,
  Calculator,
  ShieldCheck,
  Building2,
  Users,
  MapPin,
  ChevronDown,
  ChevronUp,
  Wallet,
  Sparkles,
  HelpCircle,
  BarChart2,
  Store,
  Calendar,
  Award,
  Edit3,
  Save,
  RotateCcw,
  RefreshCw,
  X,
} from 'lucide-react';
import { TransactionRecord, DashboardFilters, ProfitItemBreakdown, ProfitStoreItem } from '../types/dashboard';
import { formatRupiah, formatPercent } from '../utils/analytics';
import { calculateProfitArea } from '../utils/profitCalculations';
import * as XLSX from 'xlsx';
import { loadSpvConsolidatedConfig } from '../services/spvSellInSellOutService';

export interface MonthlyPnlCustomOverride {
  sellIn?: number;
  margin?: number;
  opsCost?: number;
  salaryCost?: number;
  netProfit?: number;
  profitPct?: number;
  salesCount?: number;
  baCount?: number;
  trainerCount?: number;
  spvCount?: number;
  sdmCount?: number;
  note?: string;
}

export const STORAGE_KEY_MONTHLY_PNL_OVERRIDES = 'salespro_monthly_pnl_overrides_v2';

interface ProfitAreaAnalysisProps {
  records: TransactionRecord[];
  allRecords?: TransactionRecord[];
  filters: DashboardFilters;
}

export const ProfitAreaAnalysis: React.FC<ProfitAreaAnalysisProps> = ({
  records,
  allRecords,
  filters,
}) => {
  // Configurable rates (default: 55% margin and 33% operating cost)
  const [marginPercent, setMarginPercent] = useState<number>(55);
  const [operatingCostPercent, setOperatingCostPercent] = useState<number>(33);
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [showFormulaGuide, setShowFormulaGuide] = useState(true);

  // Sub-tabs: 'area' | 'store' | 'sales' | 'region' | 'simulator'
  const [activeSubTab, setActiveSubTab] = useState<'area' | 'store' | 'sales' | 'region' | 'simulator'>('area');

  // Search & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'profit' | 'sellin' | 'margin' | 'salary' | 'pct'>('profit');
  const [sortAsc, setSortAsc] = useState(false);

  // Interactive Simulator State
  const [simSellIn, setSimSellIn] = useState<number>(250000000);
  const [simSalary, setSimSalary] = useState<number>(18000000);
  const [simMarginPct, setSimMarginPct] = useState<number>(55);
  const [simOpsCostPct, setSimOpsCostPct] = useState<number>(33);

  // Calculate Profit Area Summary
  const profitSummary = useMemo(() => {
    return calculateProfitArea(
      records,
      marginPercent / 100,
      operatingCostPercent / 100
    );
  }, [records, marginPercent, operatingCostPercent]);

  // Selected Month for 12-Month Graphic Inspection
  const [selectedPnlMonth, setSelectedPnlMonth] = useState<string>(() => {
    return filters.BULAN && filters.BULAN !== 'ALL' ? filters.BULAN.toUpperCase() : 'OKTOBER';
  });

  // Custom Overrides for Monthly P&L (Bisa diedit untuk semua bulan: Jan - Des)
  const [monthlyPnlOverrides, setMonthlyPnlOverrides] = useState<Record<string, MonthlyPnlCustomOverride>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MONTHLY_PNL_OVERRIDES);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load monthlyPnlOverrides from localStorage', e);
    }
    return {};
  });

  // Modal Edit Kinerja P&L & Tim Bulanan
  const [editingPnlMonthKey, setEditingPnlMonthKey] = useState<string | null>(null);
  const [editPnlSellIn, setEditPnlSellIn] = useState<number>(0);
  const [editPnlSalary, setEditPnlSalary] = useState<number>(0);
  const [editPnlMargin, setEditPnlMargin] = useState<number>(0);
  const [editPnlOpsCost, setEditPnlOpsCost] = useState<number>(0);
  const [editPnlProfit, setEditPnlProfit] = useState<number>(0);
  const [editPnlSalesCount, setEditPnlSalesCount] = useState<number>(6);
  const [editPnlBaCount, setEditPnlBaCount] = useState<number>(17);
  const [editPnlTrainerCount, setEditPnlTrainerCount] = useState<number>(2);
  const [editPnlSpvCount, setEditPnlSpvCount] = useState<number>(1);
  const [editPnlNote, setEditPnlNote] = useState<string>('');

  // 12-Month P&L & Headcount Trend (Januari - Desember)
  const monthlyPnlData = useMemo(() => {
    const months = [
      { key: 'JANUARI', label: 'Jan', fullName: 'Januari' },
      { key: 'FEBRUARI', label: 'Feb', fullName: 'Februari' },
      { key: 'MARET', label: 'Mar', fullName: 'Maret' },
      { key: 'APRIL', label: 'Apr', fullName: 'April' },
      { key: 'MEI', label: 'Mei', fullName: 'Mei' },
      { key: 'JUNI', label: 'Jun', fullName: 'Juni' },
      { key: 'JULI', label: 'Jul', fullName: 'Juli' },
      { key: 'AGUSTUS', label: 'Agu', fullName: 'Agustus' },
      { key: 'SEPTEMBER', label: 'Sep', fullName: 'September' },
      { key: 'OKTOBER', label: 'Okt', fullName: 'Oktober' },
      { key: 'NOVEMBER', label: 'Nov', fullName: 'November' },
      { key: 'DESEMBER', label: 'Des', fullName: 'Desember' },
    ];

    const allRecs = allRecords && allRecords.length > 0 ? allRecords : records;

    const data = months.map((m) => {
      const monthRecs = allRecs.filter(
        (r) => (r.BULAN || '').toUpperCase() === m.key
      );

      // Consolidated Sell In (includes KA & DAZZLE ME MG)
      const spvConfig = loadSpvConsolidatedConfig(allRecs, m.key, 2026);

      let mSummary;
      if (monthRecs.length > 0) {
        mSummary = calculateProfitArea(
          monthRecs,
          marginPercent / 100,
          operatingCostPercent / 100
        );
      }

      // Check User Override for this month
      const ov = monthlyPnlOverrides[m.key] || {};

      // Sell In
      const baseSellIn =
        spvConfig.totalSellIn > 0
          ? spvConfig.totalSellIn
          : mSummary && mSummary.sellInActual > 0
          ? mSummary.sellInActual
          : 750000000;
      const sellIn = ov.sellIn !== undefined ? ov.sellIn : baseSellIn;

      // Margin 55% & Biaya Operasional 33%
      const margin = ov.margin !== undefined ? ov.margin : Math.round(sellIn * (marginPercent / 100));
      const opsCost = ov.opsCost !== undefined ? ov.opsCost : Math.round(sellIn * (operatingCostPercent / 100));

      // Salary cost: Sales + BA + Trainer + SPV
      const baseSalaryCost =
        mSummary && mSummary.salaryCost > 0
          ? mSummary.salaryCost
          : Math.round(92000000 + (sellIn > 800000000 ? 12500000 : 7500000));
      const salaryCost = ov.salaryCost !== undefined ? ov.salaryCost : baseSalaryCost;

      const totalExpense = opsCost + salaryCost;
      const netProfit = ov.netProfit !== undefined ? ov.netProfit : (margin - totalExpense);
      const profitPct = sellIn > 0 ? (netProfit / sellIn) * 100 : 0;
      const marginPct = margin > 0 ? (netProfit / margin) * 100 : 0;

      // SDM count (Sales + BA + Trainer + SPV)
      const baseSales = mSummary?.profitBySales?.length || 6;
      const salesCount = ov.salesCount !== undefined ? ov.salesCount : baseSales;
      const baCount = ov.baCount !== undefined ? ov.baCount : 17; // standard BA tim binaan Widodo
      const trainerCount = ov.trainerCount !== undefined ? ov.trainerCount : 2; // Ara & Ratih
      const spvCount = ov.spvCount !== undefined ? ov.spvCount : 1; // Widodo
      const sdmCount = ov.sdmCount !== undefined ? ov.sdmCount : (salesCount + baCount + trainerCount + spvCount);
      const isCustomEdited = Object.keys(ov).length > 0;
      const note = ov.note || '';

      return {
        key: m.key,
        label: m.label,
        fullName: m.fullName,
        sellIn,
        margin,
        opsCost,
        salaryCost,
        totalExpense,
        netProfit,
        profitPct,
        marginPct,
        sdmCount,
        salesCount,
        baCount,
        trainerCount,
        spvCount,
        isCustomEdited,
        note,
        hasData: monthRecs.length > 0,
      };
    });

    let maxProfit = -Infinity;
    let maxProfitItem = data[0];
    let maxSalary = -Infinity;
    let maxSalaryItem = data[0];
    let maxSellIn = 0;

    data.forEach((d) => {
      if (d.netProfit > maxProfit) {
        maxProfit = d.netProfit;
        maxProfitItem = d;
      }
      if (d.salaryCost > maxSalary) {
        maxSalary = d.salaryCost;
        maxSalaryItem = d;
      }
      if (d.sellIn > maxSellIn) {
        maxSellIn = d.sellIn;
      }
    });

    const totalYearlySellIn = data.reduce((acc, d) => acc + d.sellIn, 0);
    const totalYearlySalary = data.reduce((acc, d) => acc + d.salaryCost, 0);
    const totalYearlyProfit = data.reduce((acc, d) => acc + d.netProfit, 0);
    const avgMonthlyProfit = totalYearlyProfit / 12;
    const avgMonthlySalary = totalYearlySalary / 12;
    const avgNetMarginPct = totalYearlySellIn > 0 ? (totalYearlyProfit / totalYearlySellIn) * 100 : 0;

    return {
      monthlyList: data,
      maxProfitItem,
      maxSalaryItem,
      maxSellIn,
      totalYearlySellIn,
      totalYearlySalary,
      totalYearlyProfit,
      avgMonthlyProfit,
      avgMonthlySalary,
      avgNetMarginPct,
    };
  }, [records, allRecords, marginPercent, operatingCostPercent, monthlyPnlOverrides]);

  // Handlers for Editing Monthly P&L
  const openEditPnlModal = (monthKey: string) => {
    const target = monthlyPnlData.monthlyList.find((m) => m.key === monthKey);
    if (!target) return;
    setEditingPnlMonthKey(monthKey);
    setEditPnlSellIn(target.sellIn);
    setEditPnlSalary(target.salaryCost);
    setEditPnlMargin(target.margin);
    setEditPnlOpsCost(target.opsCost);
    setEditPnlProfit(target.netProfit);
    setEditPnlSalesCount(target.salesCount);
    setEditPnlBaCount(target.baCount);
    setEditPnlTrainerCount(target.trainerCount);
    setEditPnlSpvCount(target.spvCount || 1);
    setEditPnlNote(target.note || '');
  };

  const handleAutoCalculatePnlInputs = (newSellIn?: number, newSalary?: number) => {
    const sIn = newSellIn !== undefined ? newSellIn : editPnlSellIn;
    const sal = newSalary !== undefined ? newSalary : editPnlSalary;
    const mg = Math.round(sIn * (marginPercent / 100));
    const ops = Math.round(sIn * (operatingCostPercent / 100));
    setEditPnlMargin(mg);
    setEditPnlOpsCost(ops);
    setEditPnlProfit(mg - ops - sal);
  };

  const handleSavePnlMonth = () => {
    if (!editingPnlMonthKey) return;
    const finalSales = Number(editPnlSalesCount) || 0;
    const finalBa = Number(editPnlBaCount) || 0;
    const finalTrainer = Number(editPnlTrainerCount) || 0;
    const finalSpv = Number(editPnlSpvCount) || 1;
    const totalSdm = finalSales + finalBa + finalTrainer + finalSpv;

    const sellIn = Number(editPnlSellIn) || 0;
    const margin = Number(editPnlMargin) || Math.round(sellIn * (marginPercent / 100));
    const opsCost = Number(editPnlOpsCost) || Math.round(sellIn * (operatingCostPercent / 100));
    const salaryCost = Number(editPnlSalary) || 0;
    const netProfit = Number(editPnlProfit) !== undefined ? Number(editPnlProfit) : margin - opsCost - salaryCost;
    const profitPct = sellIn > 0 ? (netProfit / sellIn) * 100 : 0;

    const updated: Record<string, MonthlyPnlCustomOverride> = {
      ...monthlyPnlOverrides,
      [editingPnlMonthKey]: {
        sellIn,
        margin,
        opsCost,
        salaryCost,
        netProfit,
        profitPct,
        salesCount: finalSales,
        baCount: finalBa,
        trainerCount: finalTrainer,
        spvCount: finalSpv,
        sdmCount: totalSdm,
        note: editPnlNote.trim(),
      },
    };
    setMonthlyPnlOverrides(updated);
    try {
      localStorage.setItem(STORAGE_KEY_MONTHLY_PNL_OVERRIDES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save monthlyPnlOverrides', e);
    }
    setEditingPnlMonthKey(null);
  };

  const handleResetPnlMonth = (monthKey: string) => {
    const updated = { ...monthlyPnlOverrides };
    delete updated[monthKey];
    setMonthlyPnlOverrides(updated);
    try {
      localStorage.setItem(STORAGE_KEY_MONTHLY_PNL_OVERRIDES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to reset monthlyPnlOverrides', e);
    }
    if (editingPnlMonthKey === monthKey) {
      setEditingPnlMonthKey(null);
    }
  };

  const handleResetAllPnlMonths = () => {
    setMonthlyPnlOverrides({});
    try {
      localStorage.removeItem(STORAGE_KEY_MONTHLY_PNL_OVERRIDES);
    } catch (e) {
      console.warn(e);
    }
    setEditingPnlMonthKey(null);
  };

  // Simulator calculation
  const simResult = useMemo(() => {
    const sMargin = Math.round(simSellIn * (simMarginPct / 100));
    const sOps = Math.round(simSellIn * (simOpsCostPct / 100));
    const sTotalExp = sOps + simSalary;
    const sProfit = sMargin - sTotalExp;
    const sProfitPct = simSellIn > 0 ? (sProfit / simSellIn) * 100 : 0;
    const sMarginPct = sMargin > 0 ? (sProfit / sMargin) * 100 : 0;
    const spread = (simMarginPct - simOpsCostPct) / 100;
    const bep = spread > 0 ? Math.round(simSalary / spread) : 0;

    return {
      margin: sMargin,
      opsCost: sOps,
      totalExpense: sTotalExp,
      profit: sProfit,
      profitPct: sProfitPct,
      marginPct: sMarginPct,
      bep,
    };
  }, [simSellIn, simSalary, simMarginPct, simOpsCostPct]);

  // Sorting helper
  const sortItems = (items: ProfitItemBreakdown[]) => {
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.coverArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.spvOrRegion.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'profit') {
        valA = a.remainingProfitValue;
        valB = b.remainingProfitValue;
      } else if (sortField === 'sellin') {
        valA = a.sellInActual;
        valB = b.sellInActual;
      } else if (sortField === 'margin') {
        valA = a.marginValue;
        valB = b.marginValue;
      } else if (sortField === 'salary') {
        valA = a.salaryCost;
        valB = b.salaryCost;
      } else if (sortField === 'pct') {
        valA = a.remainingProfitPercentSellIn;
        valB = b.remainingProfitPercentSellIn;
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  };

  const sortedAreaList = useMemo(() => sortItems(profitSummary.profitByArea), [profitSummary.profitByArea, searchQuery, sortField, sortAsc]);
  const sortedSalesList = useMemo(() => sortItems(profitSummary.profitBySales), [profitSummary.profitBySales, searchQuery, sortField, sortAsc]);
  const sortedRegionList = useMemo(() => sortItems(profitSummary.profitByRegion), [profitSummary.profitByRegion, searchQuery, sortField, sortAsc]);

  const sortedStoreList = useMemo(() => {
    const stores = profitSummary.profitByStore || [];
    const filtered = stores.filter((item) =>
      item.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.coverArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.salesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.baName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'profit') {
        valA = a.remainingProfitValue;
        valB = b.remainingProfitValue;
      } else if (sortField === 'sellin') {
        valA = a.sellInActual;
        valB = b.sellInActual;
      } else if (sortField === 'margin') {
        valA = a.marginValue;
        valB = b.marginValue;
      } else if (sortField === 'salary') {
        valA = a.baSalaryCost;
        valB = b.baSalaryCost;
      } else if (sortField === 'pct') {
        valA = a.remainingProfitPercentSellIn;
        valB = b.remainingProfitPercentSellIn;
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [profitSummary.profitByStore, searchQuery, sortField, sortAsc]);

  const toggleSort = (field: 'profit' | 'sellin' | 'margin' | 'salary' | 'pct') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan Profit Area (P&L)
    const summaryRows: (string | number)[][] = [
      ['LAPORAN ANALISA PROFIT AREA (P&L PORTFOLIO)'],
      ['Waktu Cetak:', new Date().toLocaleString('id-ID')],
      ['Filter Bulan:', filters.BULAN],
      ['Filter Tahun:', filters.TAHUN],
      ['Filter Region:', filters.REGION],
      ['Filter Sales:', filters.SALES],
      [''],
      ['KOMPONEN P&L', 'NILAI (IDR)', 'RASIO TERHADAP SELL IN', 'KETERANGAN'],
      ['1. Realisasi Sell In', profitSummary.sellInActual, '100.00%', 'Total Omset Penjualan Sell In'],
      ['2. Margin Kotor', profitSummary.marginValue, `${profitSummary.marginPercent.toFixed(1)}%`, 'Margin Penjualan Produk (55%)'],
      ['3. Biaya Operasional', profitSummary.operatingCostValue, `${profitSummary.operatingCostPercent.toFixed(1)}%`, 'Beban Operasional Area (33%)'],
      ['4. Beban Gaji Karyawan', profitSummary.salaryCost, `${((profitSummary.salaryCost / (profitSummary.sellInActual || 1)) * 100).toFixed(2)}%`, 'Total Gaji Pokok & Insentif (Sales + BA)'],
      ['   - Gaji & Insentif Sales', profitSummary.totalSalesSalary, '-', 'Beban Tenaga Penjual Sales'],
      ['   - Gaji & Insentif BA', profitSummary.totalBaSalary, '-', 'Beban Beauty Advisor Toko'],
      ['5. Total Biaya Pengurang', profitSummary.totalExpense, `${((profitSummary.totalExpense / (profitSummary.sellInActual || 1)) * 100).toFixed(2)}%`, 'Biaya 33% + Biaya Gaji'],
      ['6. SISA PROFIT TERSEDIA', profitSummary.remainingProfitValue, `${profitSummary.remainingProfitPercentSellIn.toFixed(2)}%`, 'Margin - Total Biaya (Net Profit)'],
      ['   - Rasio Sisa Profit vs Margin', `${profitSummary.remainingProfitPercentMargin.toFixed(2)}%`, '-', 'Persentase terhadap Gross Margin'],
      ['   - Titik Impas (BEP) Sell In', profitSummary.breakEvenPointSellIn, '-', 'Batas Omset Minimal Agar Tidak Defisit'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan P&L');

    // Sheet 2: Profit per Area
    const areaHeader = [
      'No',
      'Area',
      'Region',
      'Realisasi Sell In',
      'Margin (55%)',
      'Biaya Ops (33%)',
      'Beban Gaji Area',
      'Total Biaya',
      'Sisa Profit (IDR)',
      '% Profit vs Sell In',
      '% Profit vs Margin',
      'Status Profit',
    ];
    const areaRows = profitSummary.profitByArea.map((item, idx) => [
      idx + 1,
      item.name,
      item.spvOrRegion,
      item.sellInActual,
      item.marginValue,
      item.operatingCostValue,
      item.salaryCost,
      item.totalExpense,
      item.remainingProfitValue,
      `${item.remainingProfitPercentSellIn.toFixed(2)}%`,
      `${item.remainingProfitPercentMargin.toFixed(2)}%`,
      item.profitStatus === 'excellent' ? 'Sangat Sehat' : item.profitStatus === 'healthy' ? 'Sehat' : item.profitStatus === 'warning' ? 'Waspada' : 'Defisit',
    ]);
    const wsArea = XLSX.utils.aoa_to_sheet([areaHeader, ...areaRows]);
    XLSX.utils.book_append_sheet(wb, wsArea, 'Profit per Area');

    // Sheet 3: Profit per Sales
    const salesHeader = [
      'No',
      'Nama Sales',
      'Area',
      'SPV',
      'Realisasi Sell In',
      'Margin (55%)',
      'Biaya Ops (33%)',
      'Gaji & Insentif Sales',
      'Total Beban Sales',
      'Kontribusi Profit (IDR)',
      '% Profit vs Sell In',
      'Status Profit',
    ];
    const salesRows = profitSummary.profitBySales.map((item, idx) => [
      idx + 1,
      item.name,
      item.coverArea,
      item.spvOrRegion,
      item.sellInActual,
      item.marginValue,
      item.operatingCostValue,
      item.salaryCost,
      item.totalExpense,
      item.remainingProfitValue,
      `${item.remainingProfitPercentSellIn.toFixed(2)}%`,
      item.profitStatus === 'excellent' ? 'Sangat Sehat' : item.profitStatus === 'healthy' ? 'Sehat' : item.profitStatus === 'warning' ? 'Waspada' : 'Defisit',
    ]);
    const wsSales = XLSX.utils.aoa_to_sheet([salesHeader, ...salesRows]);
    XLSX.utils.book_append_sheet(wb, wsSales, 'Profit per Sales');

    // Sheet 4: Profit per Toko / Outlet
    const storeHeader = [
      'No',
      'Nama Toko / Outlet',
      'Area',
      'Region',
      'Sales',
      'Status BA',
      'Nama BA',
      'Realisasi Sell In',
      'Margin (55%)',
      'Biaya Ops (33%)',
      'Biaya Gaji BA Toko',
      'Total Beban Toko',
      'Sisa Profit Toko (IDR)',
      '% Net Margin',
      'Status Profit',
    ];
    const storeRows = (profitSummary.profitByStore || []).map((item, idx) => [
      idx + 1,
      item.storeName,
      item.coverArea,
      item.region,
      item.salesName,
      item.hasBa ? 'Ada BA' : 'Non-BA',
      item.baName || '-',
      item.sellInActual,
      item.marginValue,
      item.operatingCostValue,
      item.baSalaryCost,
      item.totalExpense,
      item.remainingProfitValue,
      `${item.remainingProfitPercentSellIn.toFixed(2)}%`,
      item.profitStatus === 'excellent' ? 'Sangat Sehat' : item.profitStatus === 'healthy' ? 'Sehat' : item.profitStatus === 'warning' ? 'Waspada' : 'Defisit',
    ]);
    const wsStore = XLSX.utils.aoa_to_sheet([storeHeader, ...storeRows]);
    XLSX.utils.book_append_sheet(wb, wsStore, 'Profit per Toko');

    XLSX.writeFile(
      wb,
      `SalesPro_Laporan_Profit_Area_${filters.BULAN}_${filters.TAHUN}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Status Styling Helpers
  const getStatusBadge = (status: 'excellent' | 'healthy' | 'warning' | 'deficit', pct: number) => {
    if (status === 'excellent') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Sangat Sehat ({formatPercent(pct, true)})
        </span>
      );
    }
    if (status === 'healthy') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
          <CheckCircle2 className="w-3 h-3 text-teal-600" />
          Sehat ({formatPercent(pct, true)})
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Waspada/Tipis ({formatPercent(pct, true)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
        <AlertTriangle className="w-3 h-3 text-rose-600" />
        Defisit/Rugi ({formatPercent(pct, true)})
      </span>
    );
  };

  return (
    <div className="space-y-6 mb-8 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-white via-emerald-50/30 via-teal-50/20 to-cyan-50/30 rounded-2xl border border-emerald-200/90 shadow-sm p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-600/20">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Analisa Profit Area (P&amp;L &amp; Sisa Keuntungan)</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Net Margin: {profitSummary.netMarginDiffPercent.toFixed(0)}% Spread
                  </span>
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Kalkulasi: <strong>Realisasi Sell In × {marginPercent}% (Margin)</strong> dikurangi{' '}
              <strong>Biaya Operasional {operatingCostPercent}%</strong> + <strong>Beban Gaji Area (Sales &amp; BA)</strong>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setIsSettingOpen(!isSettingOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Atur % Margin &amp; Biaya</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Excel P&amp;L</span>
            </button>
          </div>
        </div>

        {/* Collapsible Rate Settings Drawer */}
        {isSettingOpen && (
          <div className="mt-4 p-4 rounded-xl bg-white/95 border border-emerald-200 shadow-inner grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Persentase Margin Penjualan (% Sell In)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.5"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Default Perusahaan: <strong>55%</strong>
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Persentase Biaya Operasional (% Sell In)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={operatingCostPercent}
                  onChange={(e) => setOperatingCostPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Default Perusahaan: <strong>33%</strong>
              </span>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setMarginPercent(55);
                  setOperatingCostPercent(33);
                }}
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Reset Standar (55% &amp; 33%)
              </button>
            </div>
          </div>
        )}

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Realisasi Sell In */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                1. Realisasi Sell In Area
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                100%
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {formatRupiah(profitSummary.sellInActual)}
            </div>
            <div className="text-xs text-slate-500 mt-2 font-medium">
              Basis acuan omset terfilter penjualan ke toko/distribusi
            </div>
          </div>

          {/* Card 2: Margin Kotor (55%) */}
          <div className="bg-white p-4 rounded-xl border border-blue-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                2. Margin Kotor ({profitSummary.marginPercent}%)
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                × {profitSummary.marginPercent}%
              </span>
            </div>
            <div className="text-2xl font-black text-blue-950 font-mono tabular-nums">
              {formatRupiah(profitSummary.marginValue)}
            </div>
            <div className="text-xs text-blue-700 mt-2 font-medium flex items-center justify-between font-mono">
              <span>Gross Profit Pool</span>
              <span className="font-bold">{profitSummary.marginPercent.toFixed(1)}% dari Sell In</span>
            </div>
          </div>

          {/* Card 3: Total Beban Pengurang */}
          <div className="bg-white p-4 rounded-xl border border-amber-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                3. Total Beban Pengurang
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                {(
                  (profitSummary.totalExpense / (profitSummary.sellInActual || 1)) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="text-2xl font-black text-amber-950 font-mono tabular-nums">
              {formatRupiah(profitSummary.totalExpense)}
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex flex-col gap-0.5 font-mono">
              <div className="flex justify-between">
                <span>Biaya 33%:</span>
                <span className="font-bold text-slate-700">{formatRupiah(profitSummary.operatingCostValue, true)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gaji Area:</span>
                <span className="font-bold text-slate-700">{formatRupiah(profitSummary.salaryCost, true)}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Sisa Profit yang Tersedia */}
          <div
            className={`p-4 rounded-xl border shadow-xs hover:-translate-y-0.5 transition-all ${
              profitSummary.remainingProfitValue >= 0
                ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white border-emerald-400'
                : 'bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 text-white border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                4. Sisa Profit Tersedia
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs font-mono">
                {profitSummary.remainingProfitValue >= 0 ? 'NET PROFIT' : 'DEFISIT'}
              </span>
            </div>
            <div className="text-2xl font-black font-mono tabular-nums">
              {formatRupiah(profitSummary.remainingProfitValue)}
            </div>
            <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
              <span>% vs Sell In:</span>
              <span className="font-mono font-black text-sm">
                {formatPercent(profitSummary.remainingProfitPercentSellIn, true)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/80 font-mono mt-0.5">
              <span>% vs Margin:</span>
              <span className="font-bold">
                {formatPercent(profitSummary.remainingProfitPercentMargin, true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP-BY-STEP WATERFALL VISUAL FLOW CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              Alur Perhitungan Laba Bersih Area (Waterfall P&amp;L)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dekomposisi bertahap dari Realisasi Sell In menjadi Sisa Profit Bersih yang tersedia untuk perusahaan
            </p>
          </div>
          <div className="text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            Titik Impas (BEP) Sell In:{' '}
            <strong className="text-emerald-700 font-bold">
              {formatRupiah(profitSummary.breakEvenPointSellIn)}
            </strong>
          </div>
        </div>

        {/* Visual Step Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
          {/* Step 1: Realisasi Sell In */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 relative">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Langkah 1: Omset
            </span>
            <div className="text-sm font-extrabold text-slate-900 truncate">
              Realisasi Sell In
            </div>
            <div className="text-base font-black text-slate-900 font-mono mt-1">
              {formatRupiah(profitSummary.sellInActual)}
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500 mt-1 block">
              Porsi: 100.0%
            </span>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-400">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Step 2: Margin Kotor (+55%) */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 relative">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
              Langkah 2: Margin (+55%)
            </span>
            <div className="text-sm font-extrabold text-blue-950 truncate">
              Gross Margin
            </div>
            <div className="text-base font-black text-blue-900 font-mono mt-1">
              +{formatRupiah(profitSummary.marginValue)}
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-700 mt-1 block">
              +55.0% dari Sell In
            </span>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-400">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Step 3: Biaya Operasional (-33%) */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 relative">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
              Langkah 3: Biaya 33%
            </span>
            <div className="text-sm font-extrabold text-amber-950 truncate">
              Biaya Operasional
            </div>
            <div className="text-base font-black text-amber-900 font-mono mt-1">
              -{formatRupiah(profitSummary.operatingCostValue)}
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-700 mt-1 block">
              -33.0% dari Sell In
            </span>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-400">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Step 4: Biaya Gaji Area */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 relative">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
              Langkah 4: Gaji Area
            </span>
            <div className="text-sm font-extrabold text-purple-950 truncate">
              Gaji &amp; Insentif (Sales+BA)
            </div>
            <div className="text-base font-black text-purple-900 font-mono mt-1">
              -{formatRupiah(profitSummary.salaryCost)}
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-700 mt-1 block">
              -{(
                (profitSummary.salaryCost / (profitSummary.sellInActual || 1)) *
                100
              ).toFixed(1)}
              % dari Sell In
            </span>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-400">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Step 5: Sisa Profit */}
          <div
            className={`p-3.5 rounded-xl border ${
              profitSummary.remainingProfitValue >= 0
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-rose-50 border-rose-300'
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                profitSummary.remainingProfitValue >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              Hasil Akhir: Sisa Profit
            </span>
            <div
              className={`text-sm font-extrabold truncate ${
                profitSummary.remainingProfitValue >= 0 ? 'text-emerald-950' : 'text-rose-950'
              }`}
            >
              Net Profit Tersedia
            </div>
            <div
              className={`text-base font-black font-mono mt-1 ${
                profitSummary.remainingProfitValue >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatRupiah(profitSummary.remainingProfitValue)}
            </div>
            <span
              className={`text-[11px] font-mono font-bold mt-1 block ${
                profitSummary.remainingProfitValue >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              = {formatPercent(profitSummary.remainingProfitPercentSellIn, true)} Net Margin
            </span>
          </div>
        </div>

        {/* Break-Even & Safety Margin Insight Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/60 via-teal-50/50 to-blue-50/60 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-700 font-medium">
              <strong>Analisa Batas Aman (Break-Even Point):</strong> Dengan margin {marginPercent}% dan biaya operasional{' '}
              {operatingCostPercent}%, sisa spread adalah <strong>{profitSummary.netMarginDiffPercent.toFixed(0)}%</strong>.
              Untuk menutup total beban gaji karyawan sebesar <strong>{formatRupiah(profitSummary.salaryCost)}</strong>, area
              wajib mencetak minimal Sell In{' '}
              <strong className="text-emerald-800">{formatRupiah(profitSummary.breakEvenPointSellIn)}</strong>.
            </span>
          </div>
          <div className="shrink-0 font-mono font-bold">
            {profitSummary.sellInActual >= profitSummary.breakEvenPointSellIn ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Surplus +{formatRupiah(profitSummary.sellInActual - profitSummary.breakEvenPointSellIn)} di atas BEP
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                Defisit -{formatRupiah(profitSummary.breakEvenPointSellIn - profitSummary.sellInActual)} di bawah BEP
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 12-MONTH MONTHLY GRAPHIC: JANUARI - DESEMBER (BIAYA GAJI, PROFIT BERSIH, SDM) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-xs">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Grafik Bulanan Profit, Beban Gaji &amp; Kapasitas SDM (Januari – Desember 2026)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi komparatif 12 bulan: Sisa profit bersih yang didapat, biaya gaji yang dikeluarkan, dan total personil SDM aktif
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
              Coverage: Area Riau (SPV Widodo)
            </span>
          </div>
        </div>

        {/* 4 Highlight Cards: Highest Profit Month, Highest Salary Cost Month, Active Personnel, Total YTD Profit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Bulan Profit Terbesar */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-300 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Bulan Profit Terbesar
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                PUNCAK LABA
              </span>
            </div>
            <div className="text-lg font-black text-emerald-950 font-mono mt-1">
              {monthlyPnlData.maxProfitItem.fullName}
            </div>
            <div className="text-sm font-bold text-emerald-700 font-mono">
              {formatRupiah(monthlyPnlData.maxProfitItem.netProfit)}
            </div>
            <div className="text-[11px] text-emerald-800 font-medium mt-1">
              Net Margin: <strong>{monthlyPnlData.maxProfitItem.profitPct.toFixed(1)}%</strong> dari Sell In ({formatRupiah(monthlyPnlData.maxProfitItem.sellIn, true)})
            </div>
          </div>

          {/* Card 2: Bulan Biaya Gaji Terbesar */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-transparent border border-rose-300 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Bulan Beban Gaji Terbesar
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                BIAYA TERTINGGI
              </span>
            </div>
            <div className="text-lg font-black text-rose-950 font-mono mt-1">
              {monthlyPnlData.maxSalaryItem.fullName}
            </div>
            <div className="text-sm font-bold text-rose-700 font-mono">
              {formatRupiah(monthlyPnlData.maxSalaryItem.salaryCost)}
            </div>
            <div className="text-[11px] text-rose-800 font-medium mt-1">
              Menanggung <strong>{monthlyPnlData.maxSalaryItem.sdmCount} SDM Aktif</strong> (Sales + BA + Trainer + SPV)
            </div>
          </div>

          {/* Card 3: Rata-rata Personil SDM */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-transparent border border-indigo-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Kapasitas SDM Aktif
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                TIM COVERAGE
              </span>
            </div>
            <div className="text-lg font-black text-indigo-950 font-mono mt-1">
              26 Personil SDM
            </div>
            <div className="text-xs text-indigo-700 font-semibold mt-0.5">
              6 Sales • 17 BA • 2 Trainer • 1 SPV
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Rata-rata beban gaji bulanan: <strong>{formatRupiah(monthlyPnlData.avgMonthlySalary, true)}/bln</strong>
            </div>
          </div>

          {/* Card 4: Akumulasi Profit Tahunan (YTD) */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-teal-500/10 via-cyan-500/10 to-transparent border border-teal-300 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                Total Profit Tahunan (12 Bln)
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                TAHUN 2026
              </span>
            </div>
            <div className="text-lg font-black text-teal-950 font-mono mt-1">
              {formatRupiah(monthlyPnlData.totalYearlyProfit)}
            </div>
            <div className="text-xs text-teal-700 font-semibold mt-0.5">
              Rata-rata: {formatRupiah(monthlyPnlData.avgMonthlyProfit)} / bulan
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Akumulasi Sell In: <strong>{formatRupiah(monthlyPnlData.totalYearlySellIn, true)}</strong> (Avg Margin: {monthlyPnlData.avgNetMarginPct.toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* 12-Month Dual-Bar Graphic (Januari - Desember) */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span>Grafik Komparasi Bulanan:</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500"></span> Profit Bersih (Laba)
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
                  <span className="w-3 h-3 rounded-xs bg-rose-500"></span> Beban Gaji Karyawan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Klik salah satu kolom bulan untuk melihat rincian detail P&amp;L bulan tersebut
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                🌟 Bulan Profit Terbesar: {monthlyPnlData.maxProfitItem.fullName}
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                ⚠️ Biaya Terbesar: {monthlyPnlData.maxSalaryItem.fullName}
              </span>
              <button
                type="button"
                onClick={() => openEditPnlModal(selectedPnlMonth)}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                title={`Edit data P&L, Gaji & SDM Bulan ${selectedPnlMonth}`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Bulan {selectedPnlMonth}</span>
              </button>
            </div>
          </div>

          {/* Interactive Bar Chart Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 pt-2">
            {monthlyPnlData.monthlyList.map((m) => {
              const isSelected = selectedPnlMonth === m.key;
              const isMaxProfit = m.key === monthlyPnlData.maxProfitItem.key;
              const isMaxSalary = m.key === monthlyPnlData.maxSalaryItem.key;

              // Proportional Heights (max reference 250M)
              const maxRef = Math.max(monthlyPnlData.maxProfitItem.netProfit, monthlyPnlData.maxSalaryItem.salaryCost, 180000000);
              const profitHeight = Math.max(12, Math.round((Math.max(0, m.netProfit) / maxRef) * 110));
              const salaryHeight = Math.max(12, Math.round((m.salaryCost / maxRef) * 110));

              return (
                <div
                  key={m.key}
                  onClick={() => setSelectedPnlMonth(m.key)}
                  className={`flex flex-col items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40 -translate-y-1'
                      : isMaxProfit
                      ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-400 hover:bg-white'
                      : isMaxSalary
                      ? 'bg-rose-50/50 border-rose-300 hover:border-rose-400 hover:bg-white'
                      : 'bg-white/80 border-slate-200/90 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  {/* Top Indicators: SDM Badge & Special Badges */}
                  <div className="w-full flex flex-col items-center gap-1 mb-2">
                    {isMaxProfit && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono shadow-xs">
                        TOP LABA
                      </span>
                    )}
                    {isMaxSalary && !isMaxProfit && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono shadow-xs">
                        BIAYA MAX
                      </span>
                    )}
                    {m.isCustomEdited && (
                      <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                        Edited
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5 text-slate-500" />
                      {m.sdmCount}
                    </span>
                  </div>

                  {/* Dual Bars Area */}
                  <div className="h-32 w-full flex items-end justify-center gap-1.5 px-1 py-1 bg-slate-100/60 rounded-lg">
                    {/* Profit Bar (Emerald) */}
                    <div
                      title={`Profit ${m.fullName}: ${formatRupiah(m.netProfit)}`}
                      style={{ height: `${profitHeight}px` }}
                      className={`w-3.5 sm:w-4 rounded-t-sm transition-all flex items-start justify-center ${
                        m.netProfit >= 0
                          ? isSelected || isMaxProfit
                            ? 'bg-emerald-600 shadow-xs'
                            : 'bg-emerald-500'
                          : 'bg-red-400'
                      }`}
                    ></div>

                    {/* Salary Bar (Rose) */}
                    <div
                      title={`Beban Gaji ${m.fullName}: ${formatRupiah(m.salaryCost)}`}
                      style={{ height: `${salaryHeight}px` }}
                      className={`w-3.5 sm:w-4 rounded-t-sm transition-all flex items-start justify-center ${
                        isSelected || isMaxSalary
                          ? 'bg-rose-600 shadow-xs'
                          : 'bg-rose-400'
                      }`}
                    ></div>
                  </div>

                  {/* Profit Nominal Label */}
                  <div className="text-[10px] font-mono font-extrabold text-emerald-800 mt-2 text-center truncate w-full">
                    {formatRupiah(m.netProfit, true)}
                  </div>

                  {/* Salary Nominal Label */}
                  <div className="text-[9px] font-mono font-medium text-rose-700 text-center truncate w-full">
                    Gaji: {formatRupiah(m.salaryCost, true)}
                  </div>

                  {/* Net Margin % */}
                  <div className="text-[9px] font-mono font-bold text-slate-600 mt-1 px-1 py-0.5 rounded bg-slate-100">
                    +{m.profitPct.toFixed(1)}%
                  </div>

                  {/* Month Label */}
                  <div
                    className={`mt-2 text-xs font-black uppercase text-center ${
                      isSelected ? 'text-emerald-700 font-extrabold' : 'text-slate-800'
                    }`}
                  >
                    {m.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Month Detail Card (When Clicked) */}
        {(() => {
          const sel =
            monthlyPnlData.monthlyList.find((m) => m.key === selectedPnlMonth) ||
            monthlyPnlData.monthlyList[9];
          return (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-sm font-black text-emerald-950">
                    Rincian Kinerja P&amp;L &amp; Tim: Bulan {sel.fullName} 2026
                  </h4>
                  {sel.isCustomEdited && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 font-mono">
                      ✓ Diedit Manual
                    </span>
                  )}
                  {sel.key === monthlyPnlData.maxProfitItem.key && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white font-mono">
                      🏆 Bulan Profit Tertinggi
                    </span>
                  )}
                  {sel.key === monthlyPnlData.maxSalaryItem.key && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white font-mono">
                      ⚠️ Bulan Biaya Gaji Tertinggi
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openEditPnlModal(sel.key)}
                    className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title={`Edit data P&L, Gaji & SDM Bulan ${sel.fullName} 2026`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Kinerja Bulan {sel.fullName}</span>
                  </button>
                  <div className="text-xs font-mono font-bold text-emerald-900 bg-white/80 px-3 py-1 rounded-xl border border-emerald-200">
                    Total SDM: {sel.sdmCount} Personil ({sel.salesCount} Sales, {sel.baCount} BA, {sel.trainerCount} Trainer, {sel.spvCount || 1} SPV)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Realisasi Sell In</span>
                  <div className="text-sm font-black text-slate-900 font-mono mt-0.5">{formatRupiah(sel.sellIn)}</div>
                  <span className="text-[10px] text-slate-500">Basis 100%</span>
                </div>

                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">2. Margin Kotor (55%)</span>
                  <div className="text-sm font-black text-blue-950 font-mono mt-0.5">{formatRupiah(sel.margin)}</div>
                  <span className="text-[10px] text-blue-700 font-mono">55.0% Omset</span>
                </div>

                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">3. Biaya Ops (33%)</span>
                  <div className="text-sm font-black text-amber-950 font-mono mt-0.5">-{formatRupiah(sel.opsCost)}</div>
                  <span className="text-[10px] text-amber-800 font-mono">33.0% Omset</span>
                </div>

                <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200 bg-rose-50/40">
                  <span className="text-[10px] font-bold text-rose-800 uppercase block">4. Beban Gaji SDM</span>
                  <div className="text-sm font-black text-rose-950 font-mono mt-0.5">-{formatRupiah(sel.salaryCost)}</div>
                  <span className="text-[10px] text-rose-700 font-mono">{sel.sdmCount} Personil Area</span>
                </div>

                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">5. Sisa Profit Bersih</span>
                  <div className="text-sm font-black text-emerald-700 font-mono mt-0.5">{formatRupiah(sel.netProfit)}</div>
                  <span className="text-[10px] text-emerald-800 font-bold font-mono">Net Margin: {sel.profitPct.toFixed(1)}%</span>
                </div>

                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-teal-800 uppercase block">6. Status Profit</span>
                  <div className="mt-1">
                    {getStatusBadge(sel.profitPct >= 10 ? 'excellent' : sel.profitPct >= 5 ? 'healthy' : sel.profitPct >= 0 ? 'warning' : 'deficit', sel.profitPct)}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 12-Month Detailed Table (Januari - Desember) */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Bulan</th>
                <th className="py-2.5 px-3 text-right">Realisasi Sell In (IDR)</th>
                <th className="py-2.5 px-3 text-right">Margin 55% (IDR)</th>
                <th className="py-2.5 px-3 text-right">Biaya Ops 33% (IDR)</th>
                <th className="py-2.5 px-3 text-right">Beban Gaji SDM (IDR)</th>
                <th className="py-2.5 px-3 text-right">Sisa Profit Bersih (IDR)</th>
                <th className="py-2.5 px-3 text-center">% Net Margin</th>
                <th className="py-2.5 px-3 text-center">Jumlah SDM</th>
                <th className="py-2.5 px-3 text-center">Keterangan Evaluasi</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyPnlData.monthlyList.map((m, idx) => {
                const isMaxProfit = m.key === monthlyPnlData.maxProfitItem.key;
                const isMaxSalary = m.key === monthlyPnlData.maxSalaryItem.key;
                return (
                  <tr
                    key={m.key}
                    onClick={() => setSelectedPnlMonth(m.key)}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedPnlMonth === m.key
                        ? 'bg-emerald-50/60 font-semibold'
                        : isMaxProfit
                        ? 'bg-emerald-50/30'
                        : isMaxSalary
                        ? 'bg-rose-50/30'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 flex items-center gap-1.5">
                      {m.fullName}
                      {m.isCustomEdited && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          Custom
                        </span>
                      )}
                      {isMaxProfit && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Top Profit 🏆
                        </span>
                      )}
                      {isMaxSalary && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300">
                          Biaya Max ⚠️
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">{formatRupiah(m.sellIn)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-900">{formatRupiah(m.margin)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-900">-{formatRupiah(m.opsCost)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">-{formatRupiah(m.salaryCost)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">
                      {formatRupiah(m.netProfit)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      +{m.profitPct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100">
                        <Users className="w-3 h-3 text-slate-500" />
                        {m.sdmCount} SDM
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {m.note ? (
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md max-w-[150px] truncate inline-block" title={m.note}>
                          {m.note}
                        </span>
                      ) : (
                        getStatusBadge(
                          m.profitPct >= 10 ? 'excellent' : m.profitPct >= 5 ? 'healthy' : m.profitPct >= 0 ? 'warning' : 'deficit',
                          m.profitPct
                        )
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openEditPnlModal(m.key)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded-lg cursor-pointer transition-all flex items-center gap-1 mx-auto"
                        title={`Edit P&L & SDM Bulan ${m.fullName}`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-900 text-xs">
                <td colSpan={2} className="py-3 px-3 uppercase tracking-wider">
                  Total Akumulasi Tahunan (12 Bulan)
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-900">
                  {formatRupiah(monthlyPnlData.totalYearlySellIn)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-blue-950">
                  {formatRupiah(Math.round(monthlyPnlData.totalYearlySellIn * (marginPercent / 100)))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-950">
                  -{formatRupiah(Math.round(monthlyPnlData.totalYearlySellIn * (operatingCostPercent / 100)))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-rose-800">
                  -{formatRupiah(monthlyPnlData.totalYearlySalary)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-800 text-sm">
                  {formatRupiah(monthlyPnlData.totalYearlyProfit)}
                </td>
                <td className="py-3 px-3 text-center font-mono text-emerald-800">
                  +{monthlyPnlData.avgNetMarginPct.toFixed(1)}%
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  26 SDM
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Sangat Sehat
                  </span>
                </td>
                <td className="py-3 px-3 text-center font-mono text-slate-400">
                  -
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Formula & Rule Guide (Collapsible) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowFormulaGuide(!showFormulaGuide)}
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
              Formula Resmi Penghitungan Profit Area Perusahaan
            </h4>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            {showFormulaGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFormulaGuide && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-700 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">1. Gross Margin (55%)</span>
                <p className="text-[11px] text-slate-600 font-mono">
                  Margin = Realisasi Sell In × 55%
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Margin kotor sebelum dikurangi biaya operasional &amp; gaji.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">2. Total Pengurang (33% + Gaji)</span>
                <p className="text-[11px] text-slate-600 font-mono">
                  Beban = (Sell In × 33%) + Total Gaji Area
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Menggabungkan biaya logistik/operasional 33% dan seluruh gaji Sales &amp; BA.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="font-bold text-emerald-950 block mb-1">3. Sisa Profit Bersih</span>
                <p className="text-[11px] text-emerald-800 font-mono font-bold">
                  Sisa Profit = Margin - Total Beban
                </p>
                <p className="text-[10px] text-emerald-700 mt-1">
                  = (Sell In × 22%) - Total Gaji Area. Tersedia dalam nominal &amp; persentase.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('area')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'area'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Profit per Area ({profitSummary.profitByArea.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('store')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'store'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Profit per Outlet ({profitSummary.profitByStore?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'sales'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Profit per Sales ({profitSummary.profitBySales.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('region')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'region'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Profit per Region ({profitSummary.profitByRegion.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'simulator'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Simulator What-If Profit</span>
          </button>
        </div>

        {/* Search Input for Tables */}
        {activeSubTab !== 'simulator' && (
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama area / personil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* TAB CONTENT: TABEL PER AREA */}
      {activeSubTab === 'area' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Daftar Profitabilitas Berdasarkan Cover Area
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Menggabungkan beban gaji Sales dan BA di masing-masing area operasional
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total Area: <strong className="text-slate-800">{profitSummary.profitByArea.length}</strong> | Sisa Profit:{' '}
              <strong className="text-emerald-700 font-bold">
                {formatRupiah(profitSummary.remainingProfitValue)}
              </strong>
            </div>
          </div>

          <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Area</th>
                  <th className="py-3 px-3">Region</th>
                  <th
                    onClick={() => toggleSort('sellin')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Realisasi Sell In</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('margin')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Margin (55%)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Biaya Ops (33%)</th>
                  <th
                    onClick={() => toggleSort('salary')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Beban Gaji Area</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Total Biaya</th>
                  <th
                    onClick={() => toggleSort('profit')}
                    className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100 bg-emerald-50/70"
                  >
                    <div className="flex items-center justify-end gap-1 font-black text-emerald-950">
                      <span>Sisa Profit (IDR)</span>
                      <ArrowUpDown className="w-3 h-3 text-emerald-600" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('pct')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1 font-bold">
                      <span>% Net Margin</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Status Kesehatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedAreaList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada data area yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  sortedAreaList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3 text-slate-600">{item.spvOrRegion}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.sellInActual)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-700 font-bold">
                        {formatRupiah(item.marginValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-800">
                        {formatRupiah(item.operatingCostValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-purple-700 font-bold">
                        {formatRupiah(item.salaryCost)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatRupiah(item.totalExpense)}
                      </td>
                      <td
                        className={`py-3 px-3.5 text-right font-mono font-black text-sm ${
                          item.remainingProfitValue >= 0
                            ? 'bg-emerald-50/40 text-emerald-950'
                            : 'bg-rose-50/40 text-rose-800'
                        }`}
                      >
                        {formatRupiah(item.remainingProfitValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            item.remainingProfitPercentSellIn >= 10
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.remainingProfitPercentSellIn >= 5
                              ? 'bg-teal-100 text-teal-800'
                              : item.remainingProfitPercentSellIn >= 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {formatPercent(item.remainingProfitPercentSellIn, true)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(item.profitStatus, item.remainingProfitPercentSellIn)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TABEL PER TOKO / OUTLET */}
      {activeSubTab === 'store' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                Profitabilitas per Outlet / Nama Toko
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Kalkulasi Laba Toko: Realisasi Sell In × 55% Margin - [Biaya Operasional 33% + Biaya Gaji BA Toko]
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total Outlet: <strong className="text-slate-800">{profitSummary.profitByStore?.length || 0}</strong> Toko
            </div>
          </div>

          <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Toko / Outlet</th>
                  <th className="py-3 px-3">Area &amp; Region</th>
                  <th className="py-3 px-3">Sales Person</th>
                  <th className="py-3 px-3">Status BA</th>
                  <th
                    onClick={() => toggleSort('sellin')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Sell In Toko</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Margin (55%)</th>
                  <th className="py-3 px-3 text-right">Biaya Ops (33%)</th>
                  <th
                    onClick={() => toggleSort('salary')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Beban Gaji BA</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Total Beban</th>
                  <th
                    onClick={() => toggleSort('profit')}
                    className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100 bg-blue-50/70"
                  >
                    <div className="flex items-center justify-end gap-1 font-black text-blue-950">
                      <span>Sisa Profit Toko</span>
                      <ArrowUpDown className="w-3 h-3 text-blue-600" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('pct')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>% Net Margin</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedStoreList.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada data toko yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  sortedStoreList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">{item.storeName}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {item.coverArea} <span className="text-[11px] text-slate-400">({item.region})</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{item.salesName}</td>
                      <td className="py-3 px-3">
                        {item.hasBa ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 w-fit">
                              <Sparkles className="w-2.5 h-2.5 text-purple-600" /> Ada BA
                            </span>
                            <span className="text-[11px] text-slate-600 font-medium mt-0.5">{item.baName}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Non-BA
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.sellInActual)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-700 font-medium">
                        {formatRupiah(item.marginValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-800">
                        {formatRupiah(item.operatingCostValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-purple-700 font-bold">
                        {item.baSalaryCost > 0 ? (
                          formatRupiah(item.baSalaryCost)
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatRupiah(item.totalExpense)}
                      </td>
                      <td
                        className={`py-3 px-3.5 text-right font-mono font-black text-sm ${
                          item.remainingProfitValue >= 0
                            ? 'bg-blue-50/40 text-blue-950'
                            : 'bg-rose-50/40 text-rose-800'
                        }`}
                      >
                        {formatRupiah(item.remainingProfitValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            item.remainingProfitPercentSellIn >= 15
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.remainingProfitPercentSellIn >= 5
                              ? 'bg-teal-100 text-teal-800'
                              : item.remainingProfitPercentSellIn >= 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {formatPercent(item.remainingProfitPercentSellIn, true)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(item.profitStatus, item.remainingProfitPercentSellIn)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TABEL PER SALES */}
      {activeSubTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Kontribusi Profit per Personil Sales
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Kalkulasi margin 55% dikurangi biaya operasional 33% dan beban gaji personil sales
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total Sales: <strong className="text-slate-800">{profitSummary.profitBySales.length}</strong> Personil
            </div>
          </div>

          <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Sales</th>
                  <th className="py-3 px-3">Cover Area</th>
                  <th className="py-3 px-3">SPV</th>
                  <th
                    onClick={() => toggleSort('sellin')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Realisasi Sell In</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Margin (55%)</th>
                  <th className="py-3 px-3 text-right">Biaya Ops (33%)</th>
                  <th className="py-3 px-3 text-right">Gaji Sales (THP)</th>
                  <th
                    onClick={() => toggleSort('profit')}
                    className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100 bg-indigo-50/70"
                  >
                    <div className="flex items-center justify-end gap-1 font-black text-indigo-950">
                      <span>Sisa Profit (IDR)</span>
                      <ArrowUpDown className="w-3 h-3 text-indigo-600" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('pct')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>% Margin</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedSalesList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada data sales yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  sortedSalesList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3 text-slate-600">{item.coverArea}</td>
                      <td className="py-3 px-3 text-slate-600">{item.spvOrRegion}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.sellInActual)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-700">
                        {formatRupiah(item.marginValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-800">
                        {formatRupiah(item.operatingCostValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-700 font-bold">
                        {formatRupiah(item.salaryCost)}
                      </td>
                      <td
                        className={`py-3 px-3.5 text-right font-mono font-black text-sm ${
                          item.remainingProfitValue >= 0
                            ? 'bg-indigo-50/40 text-indigo-950'
                            : 'bg-rose-50/40 text-rose-800'
                        }`}
                      >
                        {formatRupiah(item.remainingProfitValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            item.remainingProfitPercentSellIn >= 10
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.remainingProfitPercentSellIn >= 5
                              ? 'bg-teal-100 text-teal-800'
                              : item.remainingProfitPercentSellIn >= 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {formatPercent(item.remainingProfitPercentSellIn, true)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(item.profitStatus, item.remainingProfitPercentSellIn)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TABEL PER REGION */}
      {activeSubTab === 'region' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Profitabilitas Berdasarkan Wilayah / Region
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Konsolidasi kinerja laba per distrik/wilayah operasional
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total Region: <strong className="text-slate-800">{profitSummary.profitByRegion.length}</strong>
            </div>
          </div>

          <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Region</th>
                  <th className="py-3 px-3 text-right">Realisasi Sell In</th>
                  <th className="py-3 px-3 text-right">Margin (55%)</th>
                  <th className="py-3 px-3 text-right">Biaya Ops (33%)</th>
                  <th className="py-3 px-3 text-right">Total Beban Gaji</th>
                  <th className="py-3 px-3.5 text-right bg-teal-50/70 font-black text-teal-950">
                    Sisa Profit (IDR)
                  </th>
                  <th className="py-3 px-3 text-right">% Net Margin</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRegionList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada data region yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  sortedRegionList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-teal-50/20 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.sellInActual)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-700">
                        {formatRupiah(item.marginValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-800">
                        {formatRupiah(item.operatingCostValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-purple-700 font-bold">
                        {formatRupiah(item.salaryCost)}
                      </td>
                      <td
                        className={`py-3 px-3.5 text-right font-mono font-black text-sm ${
                          item.remainingProfitValue >= 0
                            ? 'bg-teal-50/40 text-teal-950'
                            : 'bg-rose-50/40 text-rose-800'
                        }`}
                      >
                        {formatRupiah(item.remainingProfitValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            item.remainingProfitPercentSellIn >= 10
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.remainingProfitPercentSellIn >= 5
                              ? 'bg-teal-100 text-teal-800'
                              : item.remainingProfitPercentSellIn >= 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {formatPercent(item.remainingProfitPercentSellIn, true)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(item.profitStatus, item.remainingProfitPercentSellIn)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SIMULATOR WHAT-IF INTERAKTIF */}
      {activeSubTab === 'simulator' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Simulator Cepat (What-If Sisa Profit Area)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Uji langsung berbagai skenario omset Sell In, estimasi biaya gaji, dan persentase margin untuk melihat proyeksi nominal dan persentase laba bersih yang tersisa.
              </p>
            </div>

            {/* Input Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Simulasi Realisasi Sell In Area (Rp)
                </label>
                <input
                  type="number"
                  step="any"
                  value={simSellIn}
                  onChange={(e) => setSimSellIn(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Nilai: {formatRupiah(simSellIn)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Simulasi Total Beban Gaji Karyawan (Rp)
                </label>
                <input
                  type="number"
                  step="any"
                  value={simSalary}
                  onChange={(e) => setSimSalary(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Nilai: {formatRupiah(simSalary)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Margin Penjualan (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={simMarginPct}
                  onChange={(e) => setSimMarginPct(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Standar: <strong>55%</strong>
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Biaya Operasional (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={simOpsCostPct}
                  onChange={(e) => setSimOpsCostPct(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Standar: <strong>33%</strong>
                </span>
              </div>
            </div>

            {/* Simulation Results Display Card */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                simResult.profit >= 0
                  ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 border-emerald-300'
                  : 'bg-gradient-to-br from-rose-50 via-white to-red-50/50 border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-600">
                    Proyeksi Hasil Simulasi Profit
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                    Sisa Profit:{' '}
                    <span
                      className={`font-mono ${
                        simResult.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatRupiah(simResult.profit)}
                    </span>
                  </h4>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-black border ${
                    simResult.profit >= 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {formatPercent(simResult.profitPct, true)} Net Margin
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Margin ({simMarginPct}%):
                  </span>
                  <span className="text-sm font-bold text-blue-700 font-mono">
                    {formatRupiah(simResult.margin)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Biaya Ops ({simOpsCostPct}%):
                  </span>
                  <span className="text-sm font-bold text-amber-800 font-mono">
                    {formatRupiah(simResult.opsCost)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Total Beban:</span>
                  <span className="text-sm font-bold text-purple-700 font-mono">
                    {formatRupiah(simResult.totalExpense)}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl text-white shadow-xs ${
                    simResult.profit >= 0 ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  <span className="text-[11px] text-white/80 font-medium block">
                    Sisa Profit Bersih:
                  </span>
                  <span className="text-base font-black font-mono">
                    {formatRupiah(simResult.profit)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>
                  Titik Impas (BEP) Penjualan Minimum:{' '}
                  <strong className="text-slate-900 font-mono">{formatRupiah(simResult.bep)}</strong>
                </span>
                <span className="font-bold">
                  {simSellIn >= simResult.bep ? (
                    <span className="text-emerald-700">
                      ✓ Penjualan aman {formatRupiah(simSellIn - simResult.bep)} di atas BEP
                    </span>
                  ) : (
                    <span className="text-rose-700">
                      ⚠️ Penjualan kurang {formatRupiah(simResult.bep - simSellIn)} untuk mencapai BEP
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT KINERJA P&L & TIM BULANAN */}
      {editingPnlMonthKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Edit3 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    Edit Kinerja P&L & Tim:{' '}
                    <span className="text-amber-300 underline underline-offset-4 decoration-amber-400">
                      Bulan{' '}
                      {monthlyPnlData.monthlyList.find((m) => m.key === editingPnlMonthKey)?.fullName ||
                        editingPnlMonthKey}{' '}
                      2026
                    </span>
                  </h3>
                  <p className="text-xs text-blue-100 font-medium mt-0.5">
                    Ubah angka realisasi Sell In, Margin, Biaya Operasional, Beban Gaji, dan komposisi SDM.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPnlMonthKey(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Month Switcher Strip */}
            <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                Pilih Bulan:
              </span>
              {monthlyPnlData.monthlyList.map((m) => {
                const isCurrent = m.key === editingPnlMonthKey;
                const isOverridden = Boolean(monthlyPnlOverrides[m.key]);
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => openEditPnlModal(m.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isOverridden
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {m.fullName}
                    {isOverridden && <span className="ml-1 text-[10px]">★</span>}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Seksi 1: Finansial & Omset */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    1. Finansial & Realisasi Penjualan
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAutoCalculatePnlInputs()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors w-fit"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Hitung Otomatis Margin & Biaya Ops
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Realisasi Sell In */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Realisasi Sell In (Rp):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editPnlSellIn || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditPnlSellIn(val);
                        handleAutoCalculatePnlInputs(val, undefined);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Preview: {formatRupiah(editPnlSellIn)}
                    </span>
                  </div>

                  {/* Margin Kotor */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Margin Kotor (Rp):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editPnlMargin || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditPnlMargin(val);
                        setEditPnlProfit(val - editPnlOpsCost - editPnlSalary);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Preview: {formatRupiah(editPnlMargin)} ({editPnlSellIn > 0 ? ((editPnlMargin / editPnlSellIn) * 100).toFixed(1) : '0'}%)
                    </span>
                  </div>

                  {/* Biaya Operasional */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Biaya Operasional (Rp):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editPnlOpsCost || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditPnlOpsCost(val);
                        setEditPnlProfit(editPnlMargin - val - editPnlSalary);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Preview: {formatRupiah(editPnlOpsCost)} ({editPnlSellIn > 0 ? ((editPnlOpsCost / editPnlSellIn) * 100).toFixed(1) : '0'}%)
                    </span>
                  </div>

                  {/* Beban Gaji SDM */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Beban Gaji SDM (Rp):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editPnlSalary || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditPnlSalary(val);
                        setEditPnlProfit(editPnlMargin - editPnlOpsCost - val);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Preview: {formatRupiah(editPnlSalary)}
                    </span>
                  </div>
                </div>

                {/* Sisa Keuntungan Bersih (Net Profit) Preview */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    editPnlProfit >= 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold uppercase block tracking-wider">
                      Sisa Keuntungan Bersih (Net Profit):
                    </span>
                    <span className="text-xl font-black font-mono">
                      {formatRupiah(editPnlProfit)}
                    </span>
                    <span className="text-xs font-semibold ml-2">
                      ({editPnlSellIn > 0 ? ((editPnlProfit / editPnlSellIn) * 100).toFixed(2) : '0.00'}% Net Margin)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600">Override Manual:</label>
                    <input
                      type="number"
                      step="any"
                      value={editPnlProfit || ''}
                      onChange={(e) => setEditPnlProfit(parseFloat(e.target.value) || 0)}
                      className="w-36 px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-900 font-mono font-bold text-xs"
                      placeholder="Net Profit"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 2: Komposisi Tim & SDM */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    2. Kekuatan Tim & Jumlah SDM Aktif
                  </span>
                  <span className="text-xs font-bold text-slate-600 bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Total:{' '}
                    {(Number(editPnlSalesCount) || 0) +
                      (Number(editPnlBaCount) || 0) +
                      (Number(editPnlTrainerCount) || 0) +
                      (Number(editPnlSpvCount) || 0)}{' '}
                    SDM
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sales Aktif:
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editPnlSalesCount}
                      onChange={(e) => setEditPnlSalesCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">Default: 6</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      BA Aktif:
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editPnlBaCount}
                      onChange={(e) => setEditPnlBaCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">Default: 17</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Trainer Aktif:
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editPnlTrainerCount}
                      onChange={(e) => setEditPnlTrainerCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">Default: 2</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      SPV Aktif:
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editPnlSpvCount}
                      onChange={(e) => setEditPnlSpvCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">Default: 1</span>
                  </div>
                </div>
              </div>

              {/* Seksi 3: Catatan Evaluasi Kinerja */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Evaluasi / Keterangan Kinerja:
                </label>
                <textarea
                  rows={2}
                  value={editPnlNote}
                  onChange={(e) => setEditPnlNote(e.target.value)}
                  placeholder="Contoh: Realisasi sell in melampaui estimasi berkat promo KA dan ekspansi toko..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleResetPnlMonth(editingPnlMonthKey)}
                className="text-xs text-rose-700 hover:text-rose-900 font-bold hover:underline transition-colors order-2 sm:order-1"
              >
                Reset ke Hitungan Otomatis Sistem
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingPnlMonthKey(null)}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePnlMonth}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
