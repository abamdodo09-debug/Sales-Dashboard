import React, { useState, useMemo, useEffect } from 'react';
import {
  TransactionRecord,
  FilterState,
  DashboardFilters,
  SellInSellOutDimension,
  SellInSellOutItem,
  SellInSellOutSummary,
} from '../types/dashboard';
import {
  calculateSellInVsSellOut,
  MONTH_NAMES_LIST,
  exportSellInVsSellOutToExcel,
  saveBaEvaluationOverride,
  loadBaEvaluationOverrides,
} from '../services/sellInSellOutService';
import {
  loadSpvConsolidatedConfig,
  saveSpvMonthConfig,
  resetSpvMonthConfig,
  OFFICIAL_SPV_WIDODO,
} from '../services/spvSellInSellOutService';
import { saveKaMgSalesOverride } from '../services/masterStoreService';
import { formatRupiah, formatPercent } from '../utils/analytics';
import {
  ArrowLeftRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  X,
  ChevronRight,
  Store,
  Users,
  Building2,
  GraduationCap,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Edit2,
  Save,
  RotateCcw,
} from 'lucide-react';

interface SellInVsSellOutViewProps {
  records: TransactionRecord[];
  allRecords?: TransactionRecord[];
  filters: FilterState;
  onFilterChange?: (key: keyof DashboardFilters, value: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SellInVsSellOutView: React.FC<SellInVsSellOutViewProps> = ({
  records,
  allRecords,
  filters,
  onFilterChange,
  onNavigateTab,
}) => {
  const sourceRecords = allRecords && allRecords.length > 0 ? allRecords : records;

  // Dimension & Filter states (Default ke OKTOBER 2026 sesuai instruksi user)
  const [activeDimension, setActiveDimension] = useState<SellInSellOutDimension>('spv');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (filters.BULAN && filters.BULAN !== 'ALL') return filters.BULAN.toUpperCase();
    return 'OKTOBER';
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (filters.TAHUN && filters.TAHUN !== 'ALL') {
      const parsed = parseInt(filters.TAHUN, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 2026;
  });
  const [selectedArea, setSelectedArea] = useState<string>(() => {
    if (filters.REGION && filters.REGION !== 'ALL') return filters.REGION;
    return 'ALL';
  });
  const [onlyOver20, setOnlyOver20] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemModal, setSelectedItemModal] = useState<SellInSellOutItem | null>(null);

  // Modal Edit SPV, Sell In / Out, KA & DAZZLE ME MG
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [modalMonth, setModalMonth] = useState<string>('OKTOBER');
  const [refreshVersion, setRefreshVersion] = useState<number>(0);

  // Form edit states (Khusus Sell In SPV WIDODO & Area Riau)
  const [editRegularSellIn, setEditRegularSellIn] = useState<number>(0);
  const [editKaSellIn, setEditKaSellIn] = useState<number>(0);
  const [editDazzleMeMgSellIn, setEditDazzleMeMgSellIn] = useState<number>(0);
  const [editSellOut, setEditSellOut] = useState<number>(0);
  const [editTarget, setEditTarget] = useState<number>(850000000);
  const [editNotes, setEditNotes] = useState<string>('');

  // Form edit states khusus Evaluasi Beauty Advisor (BA)
  const [editingBaItem, setEditingBaItem] = useState<SellInSellOutItem | null>(null);
  const [editBaSellIn, setEditBaSellIn] = useState<number>(0);
  const [editBaSellOut, setEditBaSellOut] = useState<number>(0);
  const [editBaTarget, setEditBaTarget] = useState<number>(35000000);
  const [editBaStore, setEditBaStore] = useState<string>('');

  const openEditBaModal = (item: SellInSellOutItem) => {
    setEditingBaItem(item);
    setEditBaSellIn(item.sellInValue);
    setEditBaSellOut(item.sellOutValue);
    setEditBaTarget(item.target || 35000000);
    setEditBaStore(item.storeName || '');
  };

  const handleSaveBaEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBaItem) return;
    saveBaEvaluationOverride({
      baName: editingBaItem.name,
      storeName: editBaStore,
      sellIn: editBaSellIn,
      sellOut: editBaSellOut,
      target: editBaTarget,
    });
    setRefreshVersion((v) => v + 1);
    setEditingBaItem(null);
  };

  // Sinkronisasi dua arah dengan Global Integrated Filter Bar
  useEffect(() => {
    if (filters.BULAN && filters.BULAN !== 'ALL') {
      setSelectedMonth(filters.BULAN.toUpperCase());
    } else if (filters.BULAN === 'ALL') {
      setSelectedMonth('ALL');
    }
  }, [filters.BULAN]);

  useEffect(() => {
    if (filters.TAHUN && filters.TAHUN !== 'ALL') {
      const y = parseInt(filters.TAHUN, 10);
      if (!isNaN(y)) setSelectedYear(y);
    }
  }, [filters.TAHUN]);

  useEffect(() => {
    if (filters.REGION && filters.REGION !== 'ALL') {
      setSelectedArea(filters.REGION);
    } else if (filters.REGION === 'ALL') {
      setSelectedArea('ALL');
    }
  }, [filters.REGION]);

  // Handler perubahan filter yang otomatis menyinkronkan FilterBar atas
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    if (onFilterChange) {
      onFilterChange('BULAN', newMonth);
    }
  };

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    if (onFilterChange) {
      onFilterChange('TAHUN', newYear.toString());
    }
  };

  const handleAreaChange = (newArea: string) => {
    setSelectedArea(newArea);
    if (onFilterChange) {
      onFilterChange('REGION', newArea);
    }
  };

  // Available Areas
  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    sourceRecords.forEach((r) => {
      if (r.COVER_AREA) set.add(r.COVER_AREA);
      if (r.REGION) set.add(r.REGION);
    });
    return Array.from(set).sort();
  }, [sourceRecords]);

  // Hitung data komparasi terintegrasi (sinkron dengan filter global & SPV)
  const { items: rawItems, summary: baseSummary } = useMemo(() => {
    return calculateSellInVsSellOut(
      sourceRecords,
      activeDimension,
      selectedMonth,
      selectedYear,
      selectedArea,
      filters
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceRecords, activeDimension, selectedMonth, selectedYear, selectedArea, filters, refreshVersion]);

  // Data konsolidasi resmi SPV WIDODO & Area Riau dari Google Sheet
  const spvConsolidated = useMemo(() => {
    return loadSpvConsolidatedConfig(sourceRecords, selectedMonth, selectedYear);
  }, [sourceRecords, selectedMonth, selectedYear, refreshVersion]);

  const effectiveSearch = (searchQuery || filters.searchQuery || '').trim().toLowerCase();

  // Filter items by search query, onlyOver20 toggle, and global filters
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      if (onlyOver20 && !item.isOver20Percent) return false;

      // Global Sales Filter
      if (filters.SALES && filters.SALES !== 'ALL') {
        const targetSales = filters.SALES.toUpperCase();
        if (activeDimension === 'sales') {
          if (item.name.toUpperCase() !== targetSales) return false;
        } else if (item.salesName) {
          if (item.salesName.toUpperCase() !== targetSales) return false;
        }
      }

      // Global SPV Filter
      if (filters.SPV && filters.SPV !== 'ALL') {
        const targetSpv = filters.SPV.toUpperCase();
        if (activeDimension === 'spv') {
          if (item.name.toUpperCase() !== targetSpv) return false;
        } else if (item.spvName) {
          if (item.spvName.toUpperCase() !== targetSpv) return false;
        }
      }

      // Global Store Filter
      if (filters.NAMA_STORE && filters.NAMA_STORE !== 'ALL') {
        const targetStore = filters.NAMA_STORE.toUpperCase();
        if (activeDimension === 'store') {
          if (item.name.toUpperCase() !== targetStore) return false;
        } else if (item.storeName) {
          if (item.storeName.toUpperCase() !== targetStore) return false;
        }
      }

      // Free Search
      if (effectiveSearch) {
        const match =
          item.name.toLowerCase().includes(effectiveSearch) ||
          (item.secondaryInfo && item.secondaryInfo.toLowerCase().includes(effectiveSearch)) ||
          (item.area && item.area.toLowerCase().includes(effectiveSearch)) ||
          (item.region && item.region.toLowerCase().includes(effectiveSearch)) ||
          (item.storeName && item.storeName.toLowerCase().includes(effectiveSearch)) ||
          (item.salesName && item.salesName.toLowerCase().includes(effectiveSearch)) ||
          (item.trainerName && item.trainerName.toLowerCase().includes(effectiveSearch)) ||
          (item.spvName && item.spvName.toLowerCase().includes(effectiveSearch));
        if (!match) return false;
      }

      return true;
    });
  }, [rawItems, onlyOver20, effectiveSearch, filters, activeDimension]);

  // Recalculated summary KPIs from filteredItems
  const summary: SellInSellOutSummary = useMemo(() => {
    const hasFilter =
      (filters.SALES && filters.SALES !== 'ALL') ||
      (filters.SPV && filters.SPV !== 'ALL') ||
      (filters.NAMA_STORE && filters.NAMA_STORE !== 'ALL') ||
      (filters.REGION && filters.REGION !== 'ALL') ||
      Boolean(effectiveSearch) ||
      onlyOver20;

    if (!hasFilter) return baseSummary;

    const totalSellIn = filteredItems.reduce((acc, i) => acc + i.sellInValue, 0);
    const totalSellOut = filteredItems.reduce((acc, i) => acc + i.sellOutValue, 0);
    const totalGapValue = totalSellIn - totalSellOut;
    const avgGapPercent = totalSellIn > 0 ? (totalGapValue / totalSellIn) * 100 : 0;
    const overallSellThroughPercent = totalSellIn > 0 ? (totalSellOut / totalSellIn) * 100 : 0;
    const over20Count = filteredItems.filter((i) => i.isOver20Percent).length;
    const overstockCount = filteredItems.filter((i) => i.statusType === 'overstock').length;
    const stockoutRiskCount = filteredItems.filter((i) => i.statusType === 'stockout_risk').length;
    const healthyCount = filteredItems.filter((i) => i.statusType === 'healthy').length;

    return {
      periodMonth: selectedMonth,
      periodYear: selectedYear,
      totalSellIn,
      totalSellOut,
      totalGapValue,
      avgGapPercent,
      overallSellThroughPercent,
      totalEntitiesCount: filteredItems.length,
      over20Count,
      overstockCount,
      stockoutRiskCount,
      healthyCount,
      spvTotalSellIn: baseSummary.spvTotalSellIn,
      spvTotalSellOut: baseSummary.spvTotalSellOut,
      kaSalesValue: baseSummary.kaSalesValue,
      dazzleMeMgSalesValue: baseSummary.dazzleMeMgSalesValue,
      totalPenjualanConsolidated: baseSummary.totalPenjualanConsolidated,
      isManualOverride: baseSummary.isManualOverride,
    };
  }, [baseSummary, filteredItems, filters, effectiveSearch, onlyOver20, selectedMonth, selectedYear]);

  // Muat data bulan tertentu ke modal edit
  const loadMonthDataIntoModal = (monthToLoad: string) => {
    const cfg = loadSpvConsolidatedConfig(sourceRecords, monthToLoad, selectedYear);
    setModalMonth(monthToLoad);
    setEditRegularSellIn(cfg.spvRegularSellIn);
    setEditKaSellIn(cfg.kaSellInValue);
    setEditDazzleMeMgSellIn(cfg.dazzleMeMgSellInValue);
    setEditSellOut(cfg.totalSellOut);
    setEditTarget(cfg.target);
    setEditNotes(cfg.notes || '');
  };

  // Buka Modal Edit SPV & Penjualan Sell In
  const openEditModal = (initialMonth?: string) => {
    const targetMonth = initialMonth || selectedMonth || 'OKTOBER';
    loadMonthDataIntoModal(targetMonth);
    setIsEditModalOpen(true);
  };

  // Simpan data edit ke localStorage khusus bulan yang dipilih di modal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const liveTotalSellIn = editRegularSellIn + editKaSellIn + editDazzleMeMgSellIn;
    saveSpvMonthConfig({
      periodMonth: modalMonth,
      periodYear: selectedYear,
      isManual: true,
      spvName: OFFICIAL_SPV_WIDODO.spvName,
      region: OFFICIAL_SPV_WIDODO.region,
      salesTeam: OFFICIAL_SPV_WIDODO.salesTeam,
      spvRegularSellIn: editRegularSellIn,
      kaSellInValue: editKaSellIn,
      dazzleMeMgSellInValue: editDazzleMeMgSellIn,
      totalSellIn: liveTotalSellIn,
      totalSellOut: editSellOut,
      target: editTarget,
      notes: editNotes.trim(),
    });

    // Simpan juga ke ka_mg_sales_override agar sinkron penuh dengan Analisa Kontribusi Toko
    saveKaMgSalesOverride({
      isManual: true,
      spvSalesValue: liveTotalSellIn,
      kaSalesValue: editKaSellIn,
      mgSalesValue: editDazzleMeMgSellIn,
      dazzleMeMgSalesValue: editDazzleMeMgSellIn,
      notes: editNotes.trim(),
    });

    setRefreshVersion((v) => v + 1);
    setIsEditModalOpen(false);
  };

  // Reset bulan tertentu ke data awal transaksi
  const handleResetMonthToAuto = () => {
    resetSpvMonthConfig(modalMonth, selectedYear);
    loadMonthDataIntoModal(modalMonth);
    setRefreshVersion((v) => v + 1);
  };

  // Dimension metadata labels
  const dimensionMeta: Record<
    SellInSellOutDimension,
    { label: string; icon: React.ReactNode; color: string; desc: string }
  > = {
    spv: {
      label: 'Supervisor (SPV)',
      icon: <Building2 className="w-4 h-4" />,
      color: 'indigo',
      desc: 'SPV Tunggal Area Riau: WIDODO (Membawahi 6 Sales • Seluruh Penjualan KA & DAZZLE ME MG Masuk ke Pencapaian SPV & Area)',
    },
    sales: {
      label: 'Sales Personil',
      icon: <Users className="w-4 h-4" />,
      color: 'blue',
      desc: 'Realisasi taking order (Sell In) vs efektivitas serapan toko binaan 6 Sales',
    },
    store: {
      label: 'Toko / Outlet',
      icon: <Store className="w-4 h-4" />,
      color: 'amber',
      desc: 'Perbandingan pemesanan stok toko (Sell In) vs serapan konsumen (Sell Out)',
    },
    ba: {
      label: 'Beauty Advisor (BA)',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'pink',
      desc: 'Evaluasi stok masuk counter vs realisasi penjualan harian oleh BA',
    },
    trainer: {
      label: 'Trainer',
      icon: <GraduationCap className="w-4 h-4" />,
      color: 'purple',
      desc: 'Stok masuk area training vs hasil penjualan sell out yang dilatih',
    },
  };

  const currentMeta = dimensionMeta[activeDimension];

  // Hitung live total di dalam modal edit
  const modalLiveTotalSellIn =
    Number(editRegularSellIn || 0) + Number(editKaSellIn || 0) + Number(editDazzleMeMgSellIn || 0);
  const modalLiveAchievementPercent =
    editTarget > 0 ? Math.round((modalLiveTotalSellIn / editTarget) * 1000) / 10 : 0;
  const modalLiveGap = modalLiveTotalSellIn - Number(editSellOut || 0);
  const modalLiveSellThrough =
    modalLiveTotalSellIn > 0 ? Math.round((Number(editSellOut || 0) / modalLiveTotalSellIn) * 1000) / 10 : 0;

  // Nilai-nilai konsolidasi SELL IN SPV WIDODO & Area Riau
  const spvTotalSellIn = summary.totalSellIn;
  const regularSellInTotal = summary.spvRegularSellIn || 0;
  const kaSellInTotal = summary.kaSellInValue || 0;
  const dazzleMeMgSellInTotal = summary.dazzleMeMgSellInValue || 0;
  const targetAreaSpv = summary.targetSellIn || 850000000;
  const overallAchPercent =
    targetAreaSpv > 0 ? Math.round((spvTotalSellIn / targetAreaSpv) * 1000) / 10 : 0;

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* 1. Header Toolbar & Sincronisasi Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Perbandingan Sell In vs Sell Out
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  SPV WIDODO Tunggal • Sell In KA &amp; DAZZLE ME MG Masuk
                </span>
                {summary.isManualOverride && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 border border-amber-300">
                    Manual Edit ({selectedMonth})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                SPV Area Riau hanya 1 (WIDODO). Formula Pencapaian Sell In: Sell In Reguler (6 Sales) + Sell In KA + Sell In DAZZLE ME MG.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tombol Akses Cepat Master Data & Coverage */}
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('pengaturan_master')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 shadow-xs transition-all cursor-pointer"
                title="Buka Menu Master Data Toko, Sales, BA, SPV & Trainer (Satu Tempat)"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Master Data &amp; Tim Coverage</span>
              </button>
            )}

            {/* Tombol Edit Nilai SPV & Penjualan Sell In Bulan Bebas */}
            <button
              onClick={() => openEditModal(selectedMonth)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-all cursor-pointer"
              title="Edit manual nominal Sell In Reguler, Sell In KA, Sell In DAZZLE ME MG, dan Target untuk bulan apa saja"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Pencapaian Sell In (Pilih Bulan)</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={() =>
                exportSellInVsSellOutToExcel(
                  filteredItems,
                  summary,
                  currentMeta.label,
                  selectedMonth,
                  selectedYear
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer print:hidden"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Bar Terintegrasi & Sinkron */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Dimension Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80">
            {(Object.keys(dimensionMeta) as SellInSellOutDimension[]).map((dim) => {
              const meta = dimensionMeta[dim];
              const isActive = activeDimension === dim;
              return (
                <button
                  key={dim}
                  onClick={() => setActiveDimension(dim)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Synchronized Month, Year, Area Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-600">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                {MONTH_NAMES_LIST.map((m) => (
                  <option key={m} value={m}>
                    {m === 'ALL' ? 'Semua Bulan' : m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <span className="font-semibold text-slate-600">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
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
                onChange={(e) => handleAreaChange(e.target.value)}
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

            {/* Threshold Toggle: Only > 20% */}
            <button
              onClick={() => setOnlyOver20(!onlyOver20)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                onlyOver20
                  ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${onlyOver20 ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Hanya Selisih &gt; 20% ({summary.over20Count})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Cards (Sinkron Total Sell In & Pencapaian SPV WIDODO / Area) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Pencapaian Sell In (Distributor) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Sell In (Distributor)
            </span>
            <button
              onClick={() => openEditModal(selectedMonth)}
              className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900 font-mono block">
              {formatRupiah(spvConsolidated.totalSellIn, true)}
            </span>
            <span className="text-[10px] text-indigo-700 font-bold mt-0.5 block truncate">
              Reguler ({formatRupiah(spvConsolidated.spvRegularSellIn, true)}) + KA ({formatRupiah(spvConsolidated.kaSellInValue, true)}) + MG ({formatRupiah(spvConsolidated.dazzleMeMgSellInValue, true)})
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Pencapaian Area &amp; SPV WIDODO dari Google Sheet ({selectedMonth} {selectedYear})
            </span>
          </div>
        </div>

        {/* Card 2: TOTAL SELL OUT (KONSUMEN KASIR) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
              TOTAL SELL OUT (KONSUMEN)
            </span>
            <button
              onClick={() => openEditModal(selectedMonth)}
              className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-indigo-950 font-mono block">
              {formatRupiah(summary.totalSellOut, true)}
            </span>
            <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
              Realisasi Serapan Kasir Area
            </span>
          </div>
        </div>

        {/* Card 3: Selisih Nilai (Gap IDR) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Selisih Nilai (Value Gap)
          </span>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-xl font-black font-mono ${
                  summary.totalGapValue >= 0 ? 'text-indigo-700' : 'text-rose-600'
                }`}
              >
                {summary.totalGapValue >= 0 ? '+' : ''}
                {formatRupiah(summary.totalGapValue, true)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {summary.totalGapValue >= 0
                ? 'Surplus stok outlet (Sell In > Sell Out)'
                : 'Defisit stok (Sell Out > Sell In)'}
            </span>
          </div>
        </div>

        {/* Card 4: Rasio Serapan (Sell-Through %) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Rasio Serapan (Sell-Through)
          </span>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xl font-black font-mono ${
                  summary.overallSellThroughPercent >= 80 && summary.overallSellThroughPercent <= 120
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}
              >
                {summary.overallSellThroughPercent}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-medium">
                (Gap: {summary.avgGapPercent >= 0 ? '+' : ''}
                {summary.avgGapPercent}%)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Ideal serapan sehat: 80% - 120%
            </span>
          </div>
        </div>

        {/* Card 5: Pencapaian Target Sell In SPV WIDODO */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Pencapaian Target Sell In SPV
          </span>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xl font-black font-mono ${
                  overallAchPercent >= 100 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {overallAchPercent}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Target: {formatRupiah(targetAreaSpv, true)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              SPV Tunggal WIDODO (Area Riau)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Strip Formula Konsolidasi: SELL IN SPV WIDODO & AREA (Reguler + KA + DAZZLE ME MG) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-white/10 gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-white flex items-center gap-2">
                <span>Formula Pencapaian Sell In SPV WIDODO &amp; Area Riau ({selectedMonth} {selectedYear})</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {overallAchPercent}% Target
                </span>
              </h3>
              <span className="text-[11px] text-slate-300">
                Formula Resmi: Total Sell In = Sell In Reguler (6 Sales) + Sell In KA + Sell In DAZZLE ME MG
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openEditModal(selectedMonth)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-pink-300" />
              <span>Edit Pencapaian Sell In ({selectedMonth})</span>
            </button>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('pengaturan_master')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-bold border border-emerald-500/40 transition-all cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Master Data &amp; Tim Coverage</span>
              </button>
            )}
            <span className="text-xs font-black font-mono px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
              Total Sell In: {formatRupiah(spvTotalSellIn, true)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs font-mono">
          {/* Komponen 1: Sell In Reguler Tim 6 Sales */}
          <div className="bg-white/5 border border-blue-500/30 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-blue-300 font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                1. SELL IN REGULER (6 SALES)
              </span>
              <span className="text-[10px] text-blue-400 font-bold">Tim SPV WIDODO</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-base font-black text-white">
                {formatRupiah(regularSellInTotal, true)}
              </span>
              <span className="text-[11px] text-blue-300 font-bold">
                {spvTotalSellIn > 0 ? Math.round((regularSellInTotal / spvTotalSellIn) * 1000) / 10 : 0}%
              </span>
            </div>
            <span className="text-[10px] text-slate-300 font-sans block mt-1">
              Albert, Ilhamsyah, Tiwi, Abdul Rahim, Pareto, Luar Kota
            </span>
          </div>

          {/* Komponen 2: Sell In KA */}
          <div className="bg-white/5 border border-purple-500/30 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-purple-300 font-bold flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                2. SELL IN KA (KEY ACCOUNT)
              </span>
              <span className="text-[10px] text-purple-300 font-bold">Modern Trade</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-base font-black text-white">
                {formatRupiah(kaSellInTotal, true)}
              </span>
              <span className="text-[11px] text-purple-300 font-bold">
                {spvTotalSellIn > 0 ? Math.round((kaSellInTotal / spvTotalSellIn) * 1000) / 10 : 0}%
              </span>
            </div>
            <span className="text-[10px] text-slate-300 font-sans block mt-1">
              Guardian, Watson, Miss Glam, Swalayan &amp; Mall Modern
            </span>
          </div>

          {/* Komponen 3: SELL IN DAZZLE ME MG */}
          <div className="bg-white/5 border border-emerald-500/30 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                3. SELL IN DAZZLE ME MG
              </span>
              <span className="text-[10px] text-emerald-300 font-bold">Market Group</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-base font-black text-white">
                {formatRupiah(dazzleMeMgSellInTotal, true)}
              </span>
              <span className="text-[11px] text-emerald-300 font-bold">
                {spvTotalSellIn > 0 ? Math.round((dazzleMeMgSellInTotal / spvTotalSellIn) * 1000) / 10 : 0}%
              </span>
            </div>
            <span className="text-[10px] text-slate-300 font-sans block mt-1">
              Toko General Trade / Grosir Dazzle Me Riau
            </span>
          </div>
        </div>
      </div>

      {/* 4. Table Header & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>Daftar Evaluasi {currentMeta.label} ({selectedMonth} {selectedYear})</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {filteredItems.length} Data
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{currentMeta.desc}</p>
          </div>

          {/* Search bar & quick edit */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Cari nama ${currentMeta.label.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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

            {activeDimension === 'spv' && (
              <button
                onClick={() => openEditModal(selectedMonth)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit SPV WIDODO</span>
              </button>
            )}
          </div>
        </div>

        {/* 5. Main Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3">Nama {currentMeta.label}</th>
                <th className="py-3 px-3">Keterangan / Wilayah</th>
                <th className="py-3 px-3 text-right">Value Sell In (Rp)</th>
                <th className="py-3 px-3 text-right">Value Sell Out (Rp)</th>
                {activeDimension === 'spv' && (
                  <>
                    <th className="py-3 px-3 text-right">Target SPV &amp; Area (Rp)</th>
                    <th className="py-3 px-3 text-center">% Pencapaian</th>
                  </>
                )}
                <th className="py-3 px-3 text-right">Nilai Selisih (Gap)</th>
                <th className="py-3 px-3 text-center">Persen Selisih</th>
                <th className="py-3 px-3 text-center">Sell-Through</th>
                <th className="py-3 px-3 text-center">Status &amp; Tanda &gt; 20%</th>
                <th className="py-3 px-3 text-center">Aksi &amp; Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => {
                const isOver20 = item.isOver20Percent;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isOver20
                        ? item.statusType === 'overstock'
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : 'bg-rose-50/40 hover:bg-rose-50/70'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>

                    {/* Entity Name */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {isOver20 && (
                          <AlertTriangle
                            className={`w-4 h-4 shrink-0 ${
                              item.statusType === 'overstock' ? 'text-amber-600' : 'text-rose-600'
                            }`}
                          />
                        )}
                        <div>
                          <span className="font-extrabold text-slate-900 block">
                            {item.name}
                          </span>
                          {item.storeName && activeDimension !== 'store' && (
                            <span className="text-[10px] text-slate-500 block">
                              Outlet: {item.storeName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Secondary Info */}
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {item.secondaryInfo || '-'}
                    </td>

                    {/* Sell In */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(item.sellInValue, true)}
                    </td>

                    {/* Sell Out */}
                    <td className="py-3 px-3 text-right font-mono font-black text-indigo-900">
                      {formatRupiah(item.sellOutValue, true)}
                    </td>

                    {/* Target & Pencapaian SPV */}
                    {activeDimension === 'spv' && (
                      <>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatRupiah(item.target || 850000000, true)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              (item.achievementPercent || 0) >= 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : (item.achievementPercent || 0) >= 85
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.achievementPercent || 0}%
                          </span>
                        </td>
                      </>
                    )}

                    {/* Gap Value */}
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={item.gapValue >= 0 ? 'text-indigo-700' : 'text-rose-600'}>
                        {item.gapValue >= 0 ? '+' : ''}
                        {formatRupiah(item.gapValue, true)}
                      </span>
                    </td>

                    {/* Gap Percent */}
                    <td className="py-3 px-3 text-center font-mono">
                      <span
                        className={`font-extrabold px-2 py-0.5 rounded text-[11px] ${
                          isOver20
                            ? item.statusType === 'overstock'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.gapPercent >= 0 ? '+' : ''}
                        {item.gapPercent}%
                      </span>
                    </td>

                    {/* Sell-Through */}
                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      {item.sellThroughPercent}%
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-block ${
                          isOver20
                            ? item.statusType === 'overstock'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {activeDimension === 'spv' && (
                          <button
                            onClick={() => openEditModal(selectedMonth)}
                            className="px-2 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                        {activeDimension === 'ba' && (
                          <button
                            onClick={() => openEditBaModal(item)}
                            className="px-2 py-1 text-[11px] font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg border border-pink-200 transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit target, Sell In & Sell Out BA"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit BA</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedItemModal(item)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg border border-cyan-200 transition-colors cursor-pointer"
                        >
                          Rincian
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={activeDimension === 'spv' ? 12 : 10} className="py-10 text-center text-slate-400">
                    Tidak ada data yang cocok dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Detail Modal */}
      {selectedItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                    {currentMeta.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    • Periode: {selectedMonth} {selectedYear}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedItemModal.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedItemModal.secondaryInfo}</p>
              </div>
              <button
                onClick={() => setSelectedItemModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Sell In:</span>
                <span className="font-mono font-black text-slate-900 block mt-0.5">
                  {formatRupiah(selectedItemModal.sellInValue, true)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Sell Out (Pencapaian):</span>
                <span className="font-mono font-black text-indigo-900 block mt-0.5">
                  {formatRupiah(selectedItemModal.sellOutValue, true)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Selisih Nilai (Gap):</span>
                <span
                  className={`font-mono font-bold block mt-0.5 ${
                    selectedItemModal.gapValue >= 0 ? 'text-indigo-700' : 'text-rose-600'
                  }`}
                >
                  {selectedItemModal.gapValue >= 0 ? '+' : ''}
                  {formatRupiah(selectedItemModal.gapValue, true)} ({selectedItemModal.gapPercent}%)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sell-Through Rate:</span>
                <span className="font-mono font-bold text-slate-800 block mt-0.5">
                  {selectedItemModal.sellThroughPercent}%
                </span>
              </div>
            </div>

            {/* Root Cause Analysis */}
            <div className="mt-4 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 block flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-600" />
                Diagnosa &amp; Analisis Aliran Barang:
              </span>
              <p className="text-slate-600 leading-relaxed">
                {selectedItemModal.rootCauseAnalysis}
              </p>
            </div>

            {/* Action Plan */}
            <div className="mt-4 p-3.5 bg-cyan-50/60 rounded-xl border border-cyan-200 text-xs text-cyan-950 space-y-1">
              <span className="font-extrabold flex items-center gap-1.5 text-cyan-900">
                <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                Rekomendasi Rencana Tindak Lanjut:
              </span>
              <p className="leading-relaxed font-medium whitespace-pre-line">
                {selectedItemModal.recommendedAction}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedItemModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Edit Nilai SPV WIDODO, KA & DAZZLE ME MG (Dukungan Filter Bulan Bebas) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-600" />
                  Edit Pencapaian SPV WIDODO, KA &amp; DAZZLE ME MG
                </h3>
                <span className="text-xs text-slate-500">
                  SPV Tunggal: WIDODO • Penjualan KA &amp; DAZZLE ME MG masuk penuh ke Pencapaian SPV &amp; Area
                </span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
              {/* Filter Bulan di Modal untuk Edit Bulan Berapa Aja */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-700" />
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs block">
                      Pilih Bulan yang Ingin Diedit:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Anda dapat mengubah dan menyimpan pencapaian untuk bulan apa saja secara fleksibel
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={modalMonth}
                    onChange={(e) => loadMonthDataIntoModal(e.target.value)}
                    className="font-bold text-indigo-900 bg-white border border-indigo-300 rounded-lg px-3 py-1.5 shadow-2xs cursor-pointer text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {MONTH_NAMES_LIST.map((m) => (
                      <option key={m} value={m}>
                        {m === 'ALL' ? 'Semua Bulan (ALL)' : m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Input 1: Sell In Reguler Tim Sales */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    1. Sell In Reguler Tim Sales Binaan SPV WIDODO (6 Sales):
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Format IDR</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={editRegularSellIn}
                    onChange={(e) => setEditRegularSellIn(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono block">
                  {formatRupiah(editRegularSellIn)} (Membawahi: ALBERT FERNANDO, ILHAMSYAH, TIWI, ABDUL RAHIM, PARETO, LUAR KOTA)
                </span>
              </div>

              {/* Form Input 2 & 3: Sell In KA & Sell In DAZZLE ME MG */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sell In KA */}
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-1.5">
                  <label className="text-[11px] font-bold text-purple-900 block flex items-center justify-between">
                    <span>2. Sell In KA (Key Account):</span>
                    <span className="text-[10px] text-purple-600 font-mono">IDR</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-purple-400 font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={editKaSellIn}
                      onChange={(e) => setEditKaSellIn(Number(e.target.value))}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-purple-200 bg-white font-mono font-bold text-xs focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-purple-700 font-mono block">
                    {formatRupiah(editKaSellIn)}
                  </span>
                  <span className="text-[9px] text-purple-600 block">
                    * Otomatis dihitung masuk ke Pencapaian SELL IN SPV WIDODO &amp; Area
                  </span>
                </div>

                {/* Sell In DAZZLE ME MG */}
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5">
                  <label className="text-[11px] font-bold text-emerald-900 block flex items-center justify-between">
                    <span className="font-extrabold">3. Sell In DAZZLE ME MG:</span>
                    <span className="text-[10px] text-emerald-600 font-mono">IDR</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-emerald-400 font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={editDazzleMeMgSellIn}
                      onChange={(e) => setEditDazzleMeMgSellIn(Number(e.target.value))}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-emerald-200 bg-white font-mono font-bold text-xs focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-emerald-700 font-mono block">
                    {formatRupiah(editDazzleMeMgSellIn)}
                  </span>
                  <span className="text-[9px] text-emerald-600 block">
                    * Otomatis dihitung masuk ke Pencapaian SELL IN SPV WIDODO &amp; Area
                  </span>
                </div>
              </div>

              {/* Form Input 4 & 5: Sell Out Konsumen & Target Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    4. Total Sell Out (Konsumen Kasir Area):
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={editSellOut}
                      onChange={(e) => setEditSellOut(Number(e.target.value))}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {formatRupiah(editSellOut)}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    5. Target Sell In SPV WIDODO &amp; Area Riau:
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={editTarget}
                      onChange={(e) => setEditTarget(Number(e.target.value))}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {formatRupiah(editTarget)}
                  </span>
                </div>
              </div>

              {/* Live Preview Strip: Formula Total Pencapaian Sell In */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Formula Total Pencapaian Sell In ({modalMonth}):
                  </span>
                  <span className="text-xs text-amber-300 font-bold">
                    Sell In Reguler (6 Sales) + Sell In KA + Sell In DAZZLE ME MG
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Sell In (Distributor):</span>
                    <span className="font-bold text-cyan-300 block">
                      {formatRupiah(modalLiveTotalSellIn, true)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Target Sell In:</span>
                    <span className="font-bold text-slate-200 block">
                      {formatRupiah(editTarget, true)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">% Pencapaian:</span>
                    <span className="font-bold text-emerald-400 block">
                      {modalLiveAchievementPercent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Selisih (Gap):</span>
                    <span
                      className={`font-bold block ${
                        modalLiveGap >= 0 ? 'text-cyan-300' : 'text-rose-400'
                      }`}
                    >
                      {modalLiveGap >= 0 ? '+' : ''}
                      {formatRupiah(modalLiveGap, true)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Catatan Penyesuaian:</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Keterangan perubahan..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetMonthToAuto}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Bulan Ini ({modalMonth})</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Pencapaian {modalMonth}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal Edit Evaluasi Beauty Advisor (BA) */}
      {editingBaItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-pink-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-pink-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Edit Evaluasi BA: {editingBaItem.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingBaItem.storeName ? `Outlet: ${editingBaItem.storeName}` : 'Pencapaian BA Toko'} • {selectedMonth} {selectedYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingBaItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBaEdit} className="space-y-4 mt-4 text-xs">
              {/* Toko */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Toko / Outlet Counter:
                </label>
                <input
                  type="text"
                  value={editBaStore}
                  onChange={(e) => setEditBaStore(e.target.value)}
                  placeholder="Contoh: TOKO ALANA BEAUTY"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Target Sell Out BA */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Target Sell Out BA (Rp):
                </label>
                <input
                  type="number"
                  step="any"
                  value={editBaTarget || ''}
                  onChange={(e) => setEditBaTarget(Number(e.target.value) || 0)}
                  placeholder="35000000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Value Sell Out (Konsumen) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Realisasi Sell Out (Konsumen) (Rp):
                </label>
                <input
                  type="number"
                  step="any"
                  value={editBaSellOut || ''}
                  onChange={(e) => setEditBaSellOut(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-pink-50/50 font-mono font-bold text-xs text-pink-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Value Sell In (Distributor) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Pasokan Stok Masuk / Sell In Counter (Rp):
                </label>
                <input
                  type="number"
                  step="any"
                  value={editBaSellIn || ''}
                  onChange={(e) => setEditBaSellIn(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/50 font-mono font-bold text-xs text-blue-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Summary Live Preview */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pencapaian Target:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {editBaTarget > 0 ? Math.round((editBaSellOut / editBaTarget) * 1000) / 10 : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selisih Stok (Sell In - Sell Out):</span>
                  <span className="font-bold font-mono text-indigo-700">
                    {formatRupiah(editBaSellIn - editBaSellOut)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBaItem(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Data BA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
