import React, { useState, useMemo, useEffect } from 'react';
import {
  TransactionRecord,
  FilterState,
  QuarterPeriodKey,
  SalesQuarterlySummaryItem,
  BaQuarterlySummaryItem,
  TrainerQuarterlySummaryItem,
} from '../types/dashboard';
import {
  calculateQuarterlySummary,
  QUARTER_MONTHS,
  exportQuarterlyToExcel,
} from '../services/quarterlySummaryService';
import { formatRupiah, formatPercent } from '../utils/analytics';
import {
  Award,
  TrendingUp,
  Users,
  Sparkles,
  Search,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  Target,
  FileSpreadsheet,
  Medal,
  Crown,
  Building2,
  Store,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface QuarterlySummaryViewProps {
  records: TransactionRecord[];
  allRecords?: TransactionRecord[];
  filters: FilterState;
}

type SubTabKey = 'all' | 'sales' | 'ba' | 'trainer';

export const QuarterlySummaryView: React.FC<QuarterlySummaryViewProps> = ({
  records,
  allRecords,
  filters,
}) => {
  // Use full records if available to ensure historical quarter months (e.g. Q3: Jul-Sep) are present
  const sourceRecords = allRecords && allRecords.length > 0 ? allRecords : records;

  // State for Quarter, Year, Sub-tab, Search, and Detail Modal
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterPeriodKey>('Q3');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedSpv, setSelectedSpv] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalPerson, setModalPerson] = useState<{
    type: 'sales' | 'ba' | 'trainer';
    data: SalesQuarterlySummaryItem | BaQuarterlySummaryItem | TrainerQuarterlySummaryItem;
  } | null>(null);

  // Sync automatically with global Filter Terintegrasi
  useEffect(() => {
    if (filters.BULAN && filters.BULAN !== 'ALL') {
      const b = filters.BULAN.toUpperCase();
      if (['JANUARI', 'FEBRUARI', 'MARET'].includes(b)) setSelectedQuarter('Q1');
      else if (['APRIL', 'MEI', 'JUNI'].includes(b)) setSelectedQuarter('Q2');
      else if (['JULI', 'AGUSTUS', 'SEPTEMBER'].includes(b)) setSelectedQuarter('Q3');
      else if (['OKTOBER', 'NOVEMBER', 'DESEMBER'].includes(b)) setSelectedQuarter('Q4');
    }
  }, [filters.BULAN]);

  useEffect(() => {
    if (filters.TAHUN && filters.TAHUN !== 'ALL') {
      const y = parseInt(filters.TAHUN, 10);
      if (!isNaN(y)) setSelectedYear(y);
    }
  }, [filters.TAHUN]);

  useEffect(() => {
    if (filters.SPV && filters.SPV !== 'ALL') {
      setSelectedSpv(filters.SPV);
    } else if (filters.SPV === 'ALL') {
      setSelectedSpv('ALL');
    }
  }, [filters.SPV]);

  useEffect(() => {
    if (filters.REGION && filters.REGION !== 'ALL') {
      setSelectedArea(filters.REGION);
    }
  }, [filters.REGION]);

  // Extract distinct areas & SPVs for dropdowns
  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    sourceRecords.forEach((r) => {
      if (r.COVER_AREA) set.add(r.COVER_AREA);
      if (r.REGION) set.add(r.REGION);
    });
    return Array.from(set).sort();
  }, [sourceRecords]);

  const availableSpvs = useMemo(() => {
    const set = new Set<string>();
    sourceRecords.forEach((r) => {
      if (r.SPV) set.add(r.SPV);
    });
    return Array.from(set).sort();
  }, [sourceRecords]);

  // Compute quarterly calculations
  const rawSummaryData = useMemo(() => {
    return calculateQuarterlySummary(
      sourceRecords,
      selectedQuarter,
      selectedYear,
      selectedArea,
      selectedSpv
    );
  }, [sourceRecords, selectedQuarter, selectedYear, selectedArea, selectedSpv]);

  const { overall: baseOverall, salesList, baList, trainerList } = rawSummaryData;

  // Filtered lists based on global filters and search queries
  const effectiveSearch = (searchQuery || filters.searchQuery || '').trim().toLowerCase();

  const filteredSales = useMemo(() => {
    return salesList.filter((s) => {
      if (filters.SALES && filters.SALES !== 'ALL' && s.salesName.toUpperCase() !== filters.SALES.toUpperCase()) return false;
      if (filters.SPV && filters.SPV !== 'ALL' && s.spvName.toUpperCase() !== filters.SPV.toUpperCase()) return false;
      if (filters.REGION && filters.REGION !== 'ALL' && (s.region || '').toUpperCase() !== filters.REGION.toUpperCase() && (s.coverArea || '').toUpperCase() !== filters.REGION.toUpperCase()) return false;
      if (!effectiveSearch) return true;
      return (
        s.salesName.toLowerCase().includes(effectiveSearch) ||
        s.coverArea.toLowerCase().includes(effectiveSearch) ||
        s.spvName.toLowerCase().includes(effectiveSearch) ||
        (s.region && s.region.toLowerCase().includes(effectiveSearch))
      );
    });
  }, [salesList, effectiveSearch, filters.SALES, filters.SPV, filters.REGION]);

  const filteredBa = useMemo(() => {
    return baList.filter((b) => {
      if (filters.SPV && filters.SPV !== 'ALL' && b.spvName && b.spvName.toUpperCase() !== filters.SPV.toUpperCase()) return false;
      if (filters.NAMA_STORE && filters.NAMA_STORE !== 'ALL' && b.storeName.toUpperCase() !== filters.NAMA_STORE.toUpperCase()) return false;
      if (filters.REGION && filters.REGION !== 'ALL' && (b.region || '').toUpperCase() !== filters.REGION.toUpperCase() && (b.coverArea || '').toUpperCase() !== filters.REGION.toUpperCase()) return false;
      if (!effectiveSearch) return true;
      return (
        b.baName.toLowerCase().includes(effectiveSearch) ||
        b.storeName.toLowerCase().includes(effectiveSearch) ||
        b.coverArea.toLowerCase().includes(effectiveSearch) ||
        b.baNumber.toLowerCase().includes(effectiveSearch) ||
        (b.spvName && b.spvName.toLowerCase().includes(effectiveSearch))
      );
    });
  }, [baList, effectiveSearch, filters.SPV, filters.NAMA_STORE, filters.REGION]);

  const filteredTrainer = useMemo(() => {
    return trainerList.filter((t) => {
      if (filters.REGION && filters.REGION !== 'ALL' && (t.areaCovered || '').toUpperCase() !== filters.REGION.toUpperCase() && (t.region || '').toUpperCase() !== filters.REGION.toUpperCase()) return false;
      if (!effectiveSearch) return true;
      return (
        t.trainerName.toLowerCase().includes(effectiveSearch) ||
        t.areaCovered.toLowerCase().includes(effectiveSearch)
      );
    });
  }, [trainerList, effectiveSearch, filters.REGION]);

  // Dynamically recalculated overall KPI summary cards for the filtered subset
  const overall = useMemo(() => {
    // If no sales or BA filter is active, return base overall
    const hasActivePersonnelFilter =
      (filters.SALES && filters.SALES !== 'ALL') ||
      (filters.SPV && filters.SPV !== 'ALL') ||
      (filters.REGION && filters.REGION !== 'ALL') ||
      (filters.NAMA_STORE && filters.NAMA_STORE !== 'ALL') ||
      Boolean(effectiveSearch);

    if (!hasActivePersonnelFilter) return baseOverall;

    const totalTargetArea = filteredSales.reduce((acc, s) => acc + s.quarterTarget, 0);
    const totalActualArea = filteredSales.reduce((acc, s) => acc + s.quarterActual, 0);
    const areaAchievementPercent = totalTargetArea > 0 ? (totalActualArea / totalTargetArea) * 100 : 0;

    const avgSalesScore = filteredSales.length > 0 ? filteredSales.reduce((acc, s) => acc + s.avgKpiScore, 0) / filteredSales.length : 0;
    const avgTrainerScore = filteredTrainer.length > 0 ? filteredTrainer.reduce((acc, t) => acc + t.avgKpiScore, 0) / filteredTrainer.length : 0;

    return {
      ...baseOverall,
      totalTargetArea,
      totalActualArea,
      areaAchievementPercent,
      totalSalesCount: filteredSales.length,
      totalBaCount: filteredBa.length,
      totalTrainerCount: filteredTrainer.length,
      avgSalesKpiScore: avgSalesScore,
      avgTrainerKpiScore: avgTrainerScore,
    };
  }, [baseOverall, filteredSales, filteredBa, filteredTrainer, filters, effectiveSearch]);

  const summaryData = useMemo(() => {
    return {
      overall,
      salesList: filteredSales,
      baList: filteredBa,
      trainerList: filteredTrainer,
    };
  }, [overall, filteredSales, filteredBa, filteredTrainer]);

  // Handle Excel export
  const handleExport = () => {
    exportQuarterlyToExcel(summaryData, selectedQuarter, selectedYear);
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* 1. Header Toolbar: Quarter Selector, Filters, and Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Achieve Quartal (Executive Summary)
                  </h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                    Sales • BA • Trainer
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Konsolidasi performa pencapaian omset, produk fokus, dan skor KPI Scorecard selama 3 bulan
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons: Excel & Print */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
              title="Download File Excel Lengkap (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
              title="Cetak atau Simpan PDF Laporan"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Quarter & Filter Pill Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quarter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto">
            {(['Q1', 'Q2', 'Q3', 'Q4'] as QuarterPeriodKey[]).map((qKey) => {
              const info = QUARTER_MONTHS[qKey];
              const isSelected = selectedQuarter === qKey;
              return (
                <button
                  key={qKey}
                  onClick={() => setSelectedQuarter(qKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className="mr-1.5">{info.label}</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    ({info.monthNames.map((m) => m.slice(0, 3)).join('-')})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="flex items-center gap-2.5 flex-wrap text-xs">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-600">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            {/* Area Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-600">Area:</span>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer max-w-[120px] truncate"
              >
                <option value="ALL">Semua Area</option>
                {availableAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* SPV Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-600">SPV:</span>
              <select
                value={selectedSpv}
                onChange={(e) => setSelectedSpv(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer max-w-[120px] truncate"
              >
                <option value="ALL">Semua SPV</option>
                {availableSpvs.map((spv) => (
                  <option key={spv} value={spv}>
                    {spv}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Executive KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Omset Area Kuartal */}
        <div className="bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 rounded-2xl border border-indigo-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Total Omset Kuartal
            </span>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {formatRupiah(overall.totalActualArea, true)}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                  overall.areaAchievementPercent >= 100
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {overall.areaAchievementPercent >= 100 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {formatPercent(overall.areaAchievementPercent)}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex justify-between">
              <span>Target: {formatRupiah(overall.totalTargetArea, true)}</span>
              <span className="font-semibold text-slate-700">
                Gap: {formatRupiah(overall.totalActualArea - overall.totalTargetArea, true)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 border border-slate-200/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overall.areaAchievementPercent >= 100
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, overall.areaAchievementPercent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Kinerja Tim Sales */}
        <div className="bg-gradient-to-br from-white via-blue-50/20 to-sky-50/20 rounded-2xl border border-blue-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Kinerja Tim Sales
            </span>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-white shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {overall.totalSalesCount} <span className="text-sm font-semibold text-slate-500">Sales</span>
              </span>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                Avg KPI: {overall.avgSalesKpiScore} Poin
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Total Komisi Kuartal:</span>
                <span className="font-bold font-mono text-emerald-700">
                  {formatRupiah(overall.totalSalesCommission, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Top Performer:</span>
                <span className="font-bold text-slate-900 truncate max-w-[120px]">
                  {overall.topSales?.name || '-'} ({overall.topSales?.percent || 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Kinerja Tim Beauty Advisor (BA) */}
        <div className="bg-gradient-to-br from-white via-pink-50/20 to-rose-50/20 rounded-2xl border border-pink-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-pink-100">
            <span className="text-xs font-bold text-pink-900 uppercase tracking-wider">
              Kinerja Tim BA
            </span>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {overall.totalBaCount} <span className="text-sm font-semibold text-slate-500">BA</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Off: Bebas Denda
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Est. Total THP Kuartal:</span>
                <span className="font-bold font-mono text-slate-900">
                  {formatRupiah(overall.totalBaTakeHomePay, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Top BA Star:</span>
                <span className="font-bold text-pink-700 truncate max-w-[130px]">
                  {overall.topBa?.name || '-'} ({overall.topBa?.percent || 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Kinerja Tim Trainer */}
        <div className="bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/20 rounded-2xl border border-purple-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
              Kinerja Tim Trainer
            </span>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {overall.totalTrainerCount} <span className="text-sm font-semibold text-slate-500">Trainer</span>
              </span>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                Avg KPI: {overall.avgTrainerKpiScore} Poin
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Insentif Netto Kuartal:</span>
                <span className="font-bold font-mono text-purple-700">
                  {formatRupiah(overall.totalTrainerIncentive, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Aturan Insentif:</span>
                <span className="font-semibold text-slate-700">
                  Tier 80-100% / SP1 &lt;70%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Hall of Fame / Podium Top 3 Performer Kuartal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Hall of Fame • Juara Terhebat {overall.quarterLabel}
              </h3>
              <p className="text-[11px] text-slate-400">
                Apresiasi personil berkinerja tertinggi pada omset, kepatuhan, dan pencapaian KPI
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
            {overall.dateRangeLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* Top Sales */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Medal className="w-4 h-4 text-blue-400" />
                Top Sales Champion
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Peringkat 1
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-base font-extrabold text-white">
                {overall.topSales?.name || 'Tidak ada data'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Omset Kuartal: <span className="font-bold text-amber-300 font-mono">{formatRupiah(overall.topSales?.actual || 0, true)}</span>
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">Pencapaian:</span>
                <span className="font-black text-emerald-400">
                  {formatPercent(overall.topSales?.percent || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Top BA */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                <Medal className="w-4 h-4 text-pink-400" />
                Top Beauty Advisor Star
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
                Peringkat 1
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-base font-extrabold text-white truncate">
                {overall.topBa?.name || 'Tidak ada data'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                Outlet: <span className="font-bold text-pink-300">{overall.topBa?.store || '-'}</span>
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">Pencapaian:</span>
                <span className="font-black text-emerald-400">
                  {formatPercent(overall.topBa?.percent || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Top Trainer */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Medal className="w-4 h-4 text-purple-400" />
                Top Trainer of The Quarter
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                Peringkat 1
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-base font-extrabold text-white">
                {overall.topTrainer?.name || 'Tidak ada data'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Evaluasi KPI Scorecard: <span className="font-bold text-purple-300">{overall.topTrainer?.score || 0} Poin</span>
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">Status Insentif:</span>
                <span className="font-black text-emerald-400">
                  Tier Maksimal
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sub-Tab Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-x-auto">
          {[
            { id: 'all' as SubTabKey, label: 'Ringkasan Eksekutif (Semua)', count: null },
            { id: 'sales' as SubTabKey, label: 'Rangkuman Sales', count: salesList.length },
            { id: 'ba' as SubTabKey, label: 'Rangkuman BA', count: baList.length },
            { id: 'trainer' as SubTabKey, label: 'Rangkuman Trainer', count: trainerList.length },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, toko, atau area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 5. Sub-Tab Content */}

      {/* === SUB-TAB 1: ALL (RINGKASAN EKSEKUTIF SEMUA) === */}
      {activeSubTab === 'all' && (
        <div className="space-y-6">
          {/* Quick Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Sales Pillar Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Pilar Kinerja Sales</h4>
                      <p className="text-[11px] text-slate-500">Omset &amp; KPI Scorecard</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('sales')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    Detail <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Total Personil Sales:</span>
                    <span className="font-bold text-slate-900">{salesList.length} Orang</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Rata-rata Skor KPI:</span>
                    <span className="font-bold text-indigo-700">{overall.avgSalesKpiScore} / 100 Poin</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Total Komisi Kuartal:</span>
                    <span className="font-bold font-mono text-emerald-700">
                      {formatRupiah(overall.totalSalesCommission, true)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Mencapai Target (≥100%):</span>
                    <span className="font-bold text-emerald-700">
                      {salesList.filter((s) => s.quarterAchievementPercent >= 100).length} Sales
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  * Evaluasi mencakup target kuartalan dan 4 pilar KPI Scorecard.
                </span>
              </div>
            </div>

            {/* BA Pillar Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-pink-100 text-pink-800">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Pilar Kinerja BA</h4>
                      <p className="text-[11px] text-slate-500">Sell Out, Fokus &amp; Disiplin</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('ba')}
                    className="text-xs font-bold text-pink-600 hover:text-pink-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    Detail <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Total Beauty Advisor:</span>
                    <span className="font-bold text-slate-900">{baList.length} Personil</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Total THP Kuartal:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {formatRupiah(overall.totalBaTakeHomePay, true)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Rata-rata Disiplin:</span>
                    <span className="font-bold text-emerald-700">
                      {Math.round(
                        baList.reduce((acc, b) => acc + b.disciplineRatePercent, 0) / (baList.length || 1)
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Hari Off Bebas Denda:</span>
                    <span className="font-bold text-slate-700">
                      {baList.reduce((acc, b) => acc + b.totalOffDays, 0)} Hari (Rp 0 Denda)
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  * Hari off resmi tidak dikenakan denda nihil Rp 25.000.
                </span>
              </div>
            </div>

            {/* Trainer Pillar Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Pilar Kinerja Trainer</h4>
                      <p className="text-[11px] text-slate-500">KPI 100 Poin &amp; Insentif</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('trainer')}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    Detail <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Total Personil Trainer:</span>
                    <span className="font-bold text-slate-900">{trainerList.length} Orang</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Rata-rata Skor KPI:</span>
                    <span className="font-bold text-purple-700">{overall.avgTrainerKpiScore} / 100 Poin</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Total Insentif Netto:</span>
                    <span className="font-bold font-mono text-purple-700">
                      {formatRupiah(overall.totalTrainerIncentive, true)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Status Evaluasi:</span>
                    <span className="font-bold text-emerald-700">
                      {trainerList.filter((t) => t.spStatus === 'Aman').length} Aman •{' '}
                      {trainerList.filter((t) => t.spStatus !== 'Aman').length} SP1
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  * 100%: Rp 2jt, 90-99%: Rp 1jt, 80-89%: Rp 500rb, &lt;70%: SP1 &amp; denda Rp 300rb.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Preview Table: Top 5 Sales & Top 5 BA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Sales Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  Top Pencapaian Sales Kuartal
                </h4>
                <button
                  onClick={() => setActiveSubTab('sales')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Lihat Semua ({salesList.length})
                </button>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {salesList.slice(0, 5).map((s, idx) => (
                  <div key={s.salesName} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900">{s.salesName}</span>
                        <span className="text-[10px] text-slate-400 block">{s.coverArea}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(s.quarterActual, true)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 ${
                          s.quarterAchievementPercent >= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {formatPercent(s.quarterAchievementPercent)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top BA Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  Top Pencapaian BA Kuartal
                </h4>
                <button
                  onClick={() => setActiveSubTab('ba')}
                  className="text-xs font-bold text-pink-600 hover:underline cursor-pointer"
                >
                  Lihat Semua ({baList.length})
                </button>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {baList.slice(0, 5).map((b) => (
                  <div key={b.baName} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-[10px]">
                        {b.rank}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900">{b.baName}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                          {b.storeName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(b.quarterActual, true)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 ${
                          b.quarterAchievementPercent >= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {formatPercent(b.quarterAchievementPercent)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === SUB-TAB 2: SALES (RANGKUMAN SALES) === */}
      {activeSubTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Daftar Rangkuman Kuartal Personil Sales
              </h3>
              <p className="text-xs text-slate-500">
                Pencapaian omset, komisi, dan evaluasi 4 pilar KPI Scorecard selama 3 bulan
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
              {filteredSales.length} Personil
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">Nama Sales</th>
                  <th className="py-3 px-3">Area</th>
                  <th className="py-3 px-3 text-right">Target Kuartal</th>
                  <th className="py-3 px-3 text-right">Realisasi Kuartal</th>
                  <th className="py-3 px-3 text-center">% Ach</th>
                  <th className="py-3 px-3 text-center">Avg KPI</th>
                  <th className="py-3 px-3 text-center">Grade KPI</th>
                  <th className="py-3 px-3 text-right">Total Komisi</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={s.salesName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{s.salesName}</td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{s.coverArea}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {formatRupiah(s.quarterTarget, true)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(s.quarterActual, true)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          s.quarterAchievementPercent >= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.quarterAchievementPercent >= 80
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {formatPercent(s.quarterAchievementPercent)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-indigo-700">
                      {s.avgKpiScore} Poin
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                          s.kpiGrade === 'Grade A'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : s.kpiGrade === 'Grade B'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {s.kpiGrade}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatRupiah(s.totalCommission, true)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.statusBadge === 'Melampaui Target'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.statusBadge === 'Mencapai Target'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.statusBadge}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setModalPerson({ type: 'sales', data: s })}
                        className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200/80 transition-colors cursor-pointer"
                      >
                        Rincian 3 Bulan
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Tidak ada data sales yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === SUB-TAB 3: BEAUTY ADVISOR (RANGKUMAN BA) === */}
      {activeSubTab === 'ba' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2 bg-slate-50/60">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Daftar Rangkuman Kuartal Beauty Advisor (BA)
              </h3>
              <p className="text-xs text-slate-500">
                Pencapaian sell out, target produk fokus, kepatuhan absensi (hari off resmi bebas denda), dan THP
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Hari Off = Bebas Denda
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-100 text-pink-800">
                {filteredBa.length} BA
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-3">Nama BA &amp; Toko</th>
                  <th className="py-3 px-3">Area / SPV</th>
                  <th className="py-3 px-3 text-right">Target Kuartal</th>
                  <th className="py-3 px-3 text-right">Realisasi Kuartal</th>
                  <th className="py-3 px-3 text-center">% Ach</th>
                  <th className="py-3 px-3 text-center">Fokus (Target/Real)</th>
                  <th className="py-3 px-3 text-center">% Fokus</th>
                  <th className="py-3 px-3 text-center">Nihil / Off</th>
                  <th className="py-3 px-3 text-right">Denda Nihil</th>
                  <th className="py-3 px-3 text-right">Est. THP Kuartal</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBa.map((b) => (
                  <tr key={b.baName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-extrabold text-slate-700">
                      <span className="w-6 h-6 rounded-full bg-slate-100 inline-flex items-center justify-center text-[11px]">
                        {b.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{b.baName}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[170px] block">
                        {b.storeName}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{b.coverArea}</span>
                      <span className="text-[10px] text-slate-400 block">SPV: {b.spvName}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {formatRupiah(b.quarterTarget, true)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(b.quarterActual, true)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          b.quarterAchievementPercent >= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.quarterAchievementPercent >= 80
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {formatPercent(b.quarterAchievementPercent)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-[11px]">
                      <span className="text-slate-500">{b.focusTargetPcs}</span> /{' '}
                      <span className="font-bold text-slate-900">{b.focusActualPcs} pcs</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          b.focusAchievementPercent >= 100
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {formatPercent(b.focusAchievementPercent)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-[11px]">
                      <span className="text-rose-600 font-bold" title="Hari Nihil dikenai denda">
                        {b.totalNihilDays} Nihil
                      </span>{' '}
                      /{' '}
                      <span className="text-emerald-700 font-semibold" title="Hari Off Resmi BEBAS denda">
                        {b.totalOffDays} Off
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-rose-600">
                      {b.totalDendaNominal > 0 ? `-${formatRupiah(b.totalDendaNominal, true)}` : 'Rp 0'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(b.totalTakeHomePay, true)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setModalPerson({ type: 'ba', data: b })}
                        className="px-2.5 py-1 text-[11px] font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg border border-pink-200/80 transition-colors cursor-pointer"
                      >
                        Rincian 3 Bulan
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBa.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400">
                      Tidak ada data BA yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === SUB-TAB 4: TRAINER (RANGKUMAN TRAINER) === */}
      {activeSubTab === 'trainer' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2 bg-slate-50/60">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Daftar Rangkuman Kuartal Trainer (Pencapaian Area &amp; Insentif KPI)
              </h3>
              <p className="text-xs text-slate-500">
                Pencapaian sell out area, produk fokus area, skor Balanced Scorecard 100 Poin, serta insentif/denda SP1
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                {filteredTrainer.length} Trainer
              </span>
            </div>
          </div>

          {/* Rule banner reminder */}
          <div className="p-3 bg-purple-50/60 border-b border-purple-100 text-xs text-purple-900 flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">
              📋 Skema Insentif Kuartalan Trainer:
            </span>
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="bg-white px-2 py-0.5 rounded border border-purple-200 font-bold text-emerald-800">
                100%: +Rp 2.000.000 / bln (+Rp 6.000.000 / Q)
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-purple-200 font-bold text-blue-800">
                90-99%: +Rp 1.000.000 / bln (+Rp 3.000.000 / Q)
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-purple-200 font-bold text-indigo-800">
                80-89%: +Rp 500.000 / bln (+Rp 1.500.000 / Q)
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-rose-200 font-bold text-rose-800">
                &lt;70%: SP1 &amp; Denda Rp 300.000 / bln
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">Nama Trainer</th>
                  <th className="py-3 px-3">Area Covered</th>
                  <th className="py-3 px-3 text-right">Target Area (Q)</th>
                  <th className="py-3 px-3 text-right">Realisasi Area (Q)</th>
                  <th className="py-3 px-3 text-center">% Ach Area</th>
                  <th className="py-3 px-3 text-center">Fokus Area (Pcs)</th>
                  <th className="py-3 px-3 text-center">Avg Skor KPI</th>
                  <th className="py-3 px-3 text-right">Insentif Tier</th>
                  <th className="py-3 px-3 text-right">Denda SP1</th>
                  <th className="py-3 px-3 text-right">Insentif Netto</th>
                  <th className="py-3 px-3 text-center">Status SP1</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrainer.map((t) => (
                  <tr key={t.trainerName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{t.trainerName}</td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{t.areaCovered}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {formatRupiah(t.quarterTarget, true)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(t.quarterActual, true)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          t.quarterAchievementPercent >= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {formatPercent(t.quarterAchievementPercent)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className="font-bold text-slate-900">{t.focusActualPcs}</span> /{' '}
                      <span className="text-slate-500">{t.focusTargetPcs} pcs</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-extrabold text-purple-700 text-sm">
                        {t.avgKpiScore}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/ 100 Poin</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatRupiah(t.totalIncentive, true)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-rose-600">
                      {t.totalDendaSP1 > 0 ? `-${formatRupiah(t.totalDendaSP1, true)}` : 'Rp 0'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-purple-900">
                      {formatRupiah(t.netIncentive, true)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.spStatus === 'Aman'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {t.spStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setModalPerson({ type: 'trainer', data: t })}
                        className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200/80 transition-colors cursor-pointer"
                      >
                        Rincian 3 Bulan
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTrainer.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400">
                      Tidak ada data trainer yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Modal Detail 3 Bulan (Bulan 1, 2, 3 Breakdown) */}
      {modalPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {modalPerson.type === 'sales'
                      ? 'Sales Scorecard'
                      : modalPerson.type === 'ba'
                      ? 'Beauty Advisor Performance'
                      : 'Trainer Evaluation'}
                  </span>
                  <span className="text-xs text-slate-400">• {overall.quarterLabel}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {modalPerson.type === 'sales'
                    ? (modalPerson.data as SalesQuarterlySummaryItem).salesName
                    : modalPerson.type === 'ba'
                    ? (modalPerson.data as BaQuarterlySummaryItem).baName
                    : (modalPerson.data as TrainerQuarterlySummaryItem).trainerName}
                </h3>
                <p className="text-xs text-slate-500">
                  {modalPerson.type === 'sales'
                    ? `Area: ${(modalPerson.data as SalesQuarterlySummaryItem).coverArea}`
                    : modalPerson.type === 'ba'
                    ? `Toko: ${(modalPerson.data as BaQuarterlySummaryItem).storeName} • Area: ${(modalPerson.data as BaQuarterlySummaryItem).coverArea}`
                    : `Area: ${(modalPerson.data as TrainerQuarterlySummaryItem).areaCovered}`}
                </p>
              </div>
              <button
                onClick={() => setModalPerson(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Monthly Breakdown Table */}
            <div className="mt-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Rincian Performa Tiap Bulan ({overall.quarterLabel})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Bulan</th>
                      <th className="py-2.5 px-3 text-right">Target (IDR)</th>
                      <th className="py-2.5 px-3 text-right">Realisasi (IDR)</th>
                      <th className="py-2.5 px-3 text-center">% Pencapaian</th>
                      {modalPerson.type === 'ba' && (
                        <>
                          <th className="py-2.5 px-3 text-center">Fokus (Pcs)</th>
                          <th className="py-2.5 px-3 text-center">Nihil / Off</th>
                        </>
                      )}
                      {modalPerson.type === 'trainer' && (
                        <>
                          <th className="py-2.5 px-3 text-center">Fokus (Pcs)</th>
                          <th className="py-2.5 px-3 text-center">Skor KPI</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modalPerson.data.monthlyBreakdown.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{m.monthName}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatRupiah(m.target ?? m.targetSellOut ?? 0, true)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(m.actual ?? m.actualSellOut ?? 0, true)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              m.achievementPercent >= 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {formatPercent(m.achievementPercent)}
                          </span>
                        </td>
                        {modalPerson.type === 'ba' && (
                          <>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {m.focusActualPcs} / {m.focusTargetPcs}
                            </td>
                            <td className="py-2.5 px-3 text-center text-[10px]">
                              <span className="text-rose-600 font-bold">{m.nihilDays || 0} Nihil</span> •{' '}
                              <span className="text-emerald-700 font-semibold">{m.offDays || 0} Off</span>
                            </td>
                          </>
                        )}
                        {modalPerson.type === 'trainer' && (
                          <>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {m.focusActualPcs} pcs
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-purple-700">
                              {m.kpiScore || 0} Poin
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Consolidation Footer */}
            <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Total Pencapaian Kuartal:</span>
              <div className="text-right">
                <span className="font-mono font-black text-sm text-slate-900">
                  {formatRupiah(modalPerson.data.quarterActual, true)}
                </span>
                <span className="text-slate-500 ml-2 font-bold">
                  ({formatPercent(modalPerson.data.quarterAchievementPercent)})
                </span>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalPerson(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
