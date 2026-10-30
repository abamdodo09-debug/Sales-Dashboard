import React, { useState, useMemo } from 'react';
import {
  Target,
  Sparkles,
  Award,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  TrendingUp,
  Download,
  Edit3,
  RotateCcw,
  CheckCircle2,
  X,
  Store,
  Users,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  PackageCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { TransactionRecord, DashboardFilters, BaFocusProductItem, BaFocusProductOverride } from '../types/dashboard';
import { formatRupiah, formatNumber, formatPercent } from '../utils/analytics';
import {
  aggregateBaFocusProductData,
  loadFocusOverrides,
  saveFocusOverrides,
  calculateFocusProductIncentivePenalty,
  DEFAULT_FOCUS_TARGET_PCS,
} from '../services/focusProductService';
import * as XLSX from 'xlsx';

interface FocusProductBaManagementProps {
  records: TransactionRecord[];
  filters: DashboardFilters;
  onRefreshCost?: () => void;
}

export const FocusProductBaManagement: React.FC<FocusProductBaManagementProps> = ({
  records,
  filters,
  onRefreshCost,
}) => {
  // State for overrides
  const [overrides, setOverrides] = useState<Record<string, BaFocusProductOverride>>(() => loadFocusOverrides());
  const [defaultTargetPcs, setDefaultTargetPcs] = useState<number>(DEFAULT_FOCUS_TARGET_PCS);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'insentif' | 'aman' | 'denda'>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  // Modal Edit Single BA
  const [editingItem, setEditingItem] = useState<BaFocusProductItem | null>(null);
  const [editTargetPcs, setEditTargetPcs] = useState<number>(120);
  const [editActualPcs, setEditActualPcs] = useState<number>(0);
  const [editOverrideIncentive, setEditOverrideIncentive] = useState<string>('');
  const [editOverridePenalty, setEditOverridePenalty] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');

  // Modal Batch Target
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTargetInput, setBatchTargetInput] = useState<number>(DEFAULT_FOCUS_TARGET_PCS);

  // Info guide toggle
  const [showGuide, setShowGuide] = useState(true);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Aggregated BA Focus Product List
  const baFocusList = useMemo(() => {
    return aggregateBaFocusProductData(records, overrides, defaultTargetPcs);
  }, [records, overrides, defaultTargetPcs]);

  // Unique Areas for filter
  const uniqueAreas = useMemo(() => {
    const areas = new Set<string>();
    baFocusList.forEach((b) => {
      if (b.coverArea && b.coverArea !== '-') areas.add(b.coverArea);
    });
    return Array.from(areas).sort();
  }, [baFocusList]);

  // Filtered List
  const filteredList = useMemo(() => {
    const effectiveSearch = (searchQuery || filters.searchQuery || '').trim().toLowerCase();
    return baFocusList.filter((b) => {
      // Global Sales
      if (filters.SALES && filters.SALES !== 'ALL' && b.salesName.toUpperCase() !== filters.SALES.toUpperCase()) {
        return false;
      }

      // Global SPV
      if (filters.SPV && filters.SPV !== 'ALL' && b.spv.toUpperCase() !== filters.SPV.toUpperCase()) {
        return false;
      }

      // Global Store Name
      if (filters.NAMA_STORE && filters.NAMA_STORE !== 'ALL' && b.storeName.toUpperCase() !== filters.NAMA_STORE.toUpperCase()) {
        return false;
      }

      // Global Region
      if (filters.REGION && filters.REGION !== 'ALL') {
        const reg = filters.REGION.toUpperCase();
        if ((b.region || '').toUpperCase() !== reg && (b.coverArea || '').toUpperCase() !== reg) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      // Area Filter
      if (selectedArea !== 'all' && b.coverArea !== selectedArea) return false;

      // Free Search
      if (effectiveSearch) {
        const matchesSearch =
          b.baName.toLowerCase().includes(effectiveSearch) ||
          b.baNumber.toLowerCase().includes(effectiveSearch) ||
          b.storeName.toLowerCase().includes(effectiveSearch) ||
          b.salesName.toLowerCase().includes(effectiveSearch) ||
          b.spv.toLowerCase().includes(effectiveSearch) ||
          (b.coverArea && b.coverArea.toLowerCase().includes(effectiveSearch)) ||
          (b.region && b.region.toLowerCase().includes(effectiveSearch));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [baFocusList, searchQuery, statusFilter, selectedArea, filters]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const hasActiveFilter =
      statusFilter !== 'all' ||
      selectedArea !== 'all' ||
      (filters.SALES && filters.SALES !== 'ALL') ||
      (filters.SPV && filters.SPV !== 'ALL') ||
      (filters.NAMA_STORE && filters.NAMA_STORE !== 'ALL') ||
      (filters.REGION && filters.REGION !== 'ALL') ||
      Boolean((searchQuery || filters.searchQuery || '').trim());

    const targetList = hasActiveFilter ? filteredList : baFocusList;

    const totalTarget = targetList.reduce((acc, b) => acc + b.targetPcs, 0);
    const totalActual = targetList.reduce((acc, b) => acc + b.actualPcs, 0);
    const totalIncentive = targetList.reduce((acc, b) => acc + b.incentive, 0);
    const totalPenalty = targetList.reduce((acc, b) => acc + b.penalty, 0);
    const netImpact = totalIncentive - totalPenalty;

    const countInsentif = targetList.filter((b) => b.status === 'insentif').length;
    const countAman = targetList.filter((b) => b.status === 'aman').length;
    const countDenda = targetList.filter((b) => b.status === 'denda').length;

    const avgAchievement = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

    return {
      totalTarget,
      totalActual,
      totalIncentive,
      totalPenalty,
      netImpact,
      countInsentif,
      countAman,
      countDenda,
      avgAchievement,
      totalBa: targetList.length,
    };
  }, [baFocusList, filteredList, statusFilter, selectedArea, filters, searchQuery]);

  // Open Edit Modal
  const handleOpenEdit = (item: BaFocusProductItem) => {
    setEditingItem(item);
    setEditTargetPcs(item.targetPcs);
    setEditActualPcs(item.actualPcs);
    const ov = overrides[item.storeName] || overrides[item.baName] || {};
    setEditOverrideIncentive(ov.customIncentive !== undefined ? String(ov.customIncentive) : '');
    setEditOverridePenalty(ov.customPenalty !== undefined ? String(ov.customPenalty) : '');
    setEditNote(ov.note || '');
  };

  // Save Edit Single BA
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const newOverrides = { ...overrides };
    const customInc = editOverrideIncentive.trim() !== '' ? Number(editOverrideIncentive) : undefined;
    const customPen = editOverridePenalty.trim() !== '' ? Number(editOverridePenalty) : undefined;

    newOverrides[editingItem.storeName] = {
      targetPcs: editTargetPcs,
      customActualPcs: editActualPcs,
      customIncentive: customInc,
      customPenalty: customPen,
      note: editNote.trim() || undefined,
    };

    setOverrides(newOverrides);
    saveFocusOverrides(newOverrides);
    setEditingItem(null);
    showNotification(`Target & capaian produk fokus untuk "${editingItem.baName}" berhasil diperbarui!`);

    if (onRefreshCost) onRefreshCost();
  };

  // Reset Single BA Override
  const handleResetSingleOverride = (storeName: string) => {
    const newOverrides = { ...overrides };
    delete newOverrides[storeName];
    setOverrides(newOverrides);
    saveFocusOverrides(newOverrides);
    setEditingItem(null);
    showNotification('Data dikembalikan ke hitungan kalkulasi otomatis.');
    if (onRefreshCost) onRefreshCost();
  };

  // Save Batch Target
  const handleSaveBatchTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchTargetInput <= 0) return;

    setDefaultTargetPcs(batchTargetInput);
    // Also update all existing overrides targetPcs if desired, or let default take effect
    const newOverrides = { ...overrides };
    baFocusList.forEach((b) => {
      if (newOverrides[b.storeName]) {
        newOverrides[b.storeName].targetPcs = batchTargetInput;
      }
    });

    setOverrides(newOverrides);
    saveFocusOverrides(newOverrides);
    setIsBatchModalOpen(false);
    showNotification(`Target default ${batchTargetInput} pcs berhasil diterapkan ke seluruh BA!`);
    if (onRefreshCost) onRefreshCost();
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const dataRows = baFocusList.map((b, idx) => {
        let statusText = 'AMAN (Bebas Denda)';
        if (b.status === 'insentif') statusText = 'Dapat Insentif (>= 80%)';
        if (b.status === 'denda') statusText = 'Denda Penalti (< 70%)';

        return {
          No: idx + 1,
          'Nama BA': b.baName,
          'Nomor BA': b.baNumber,
          'Nama Toko / Counter': b.storeName,
          'Cover Area': b.coverArea,
          Region: b.region,
          Sales: b.salesName,
          SPV: b.spv,
          'Target Produk Fokus (Pcs)': b.targetPcs,
          'Realisasi Penjualan (Pcs)': b.actualPcs,
          '% Pencapaian': `${b.achievementPct.toFixed(1)}%`,
          'Status Portofolio': statusText,
          'Insentif (+Rp 2.000/pcs)': b.incentive,
          'Denda (-Rp 1.000/pcs)': b.penalty,
          'Net Dampak ke Gaji': b.netBonus,
          'Status Override': b.isCustomOverride ? 'Manual Override' : 'Otomatis',
          Keterangan: b.note || '-',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Target & Capaian Produk Fokus');
      XLSX.writeFile(workbook, `Rekap_Produk_Fokus_BA_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showNotification('Laporan Excel Produk Fokus BA berhasil diunduh!');
    } catch (err: any) {
      showNotification('Gagal ekspor Excel: ' + (err.message || 'Error'));
    }
  };

  // Preview calculation in Edit Modal
  const previewCalculation = useMemo(() => {
    if (!editingItem) return null;
    const customInc = editOverrideIncentive.trim() !== '' ? Number(editOverrideIncentive) : undefined;
    const customPen = editOverridePenalty.trim() !== '' ? Number(editOverridePenalty) : undefined;
    return calculateFocusProductIncentivePenalty(
      editTargetPcs,
      editActualPcs,
      customInc,
      customPen
    );
  }, [editingItem, editTargetPcs, editActualPcs, editOverrideIncentive, editOverridePenalty]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div className="px-4 py-3 rounded-xl shadow-xl bg-slate-900 text-white border border-slate-700 flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-48 bottom-0 w-80 h-80 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 border border-teal-300/30 text-teal-200 text-xs font-semibold mb-3">
              <Target className="w-3.5 h-3.5 text-teal-300" />
              <span>Modul Evaluasi Produk Fokus &amp; Komisi BA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Target &amp; Pencapaian Produk Fokus BA</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Monitoring target kuantitas (Pcs) produk unggulan/fokus, pencapaian per gerai, insentif komisi
              <span className="text-teal-300 font-bold"> Rp 2.000 / pcs</span>, status aman, dan denda kekurangan
              <span className="text-rose-300 font-bold"> Rp 1.000 / pcs</span> yang otomatis terhubung ke perhitungan beban gaji cost area.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-teal-300" />
              <span>Set Target Massal</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Ekspor Rekap Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aturan Resmi Insentif & Denda Banner */}
      {showGuide && (
        <div className="bg-gradient-to-br from-white via-teal-50/20 to-sky-50/30 rounded-2xl border border-teal-200 shadow-sm p-5 relative">
          <button
            onClick={() => setShowGuide(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            title="Sembunyikan panduan"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-xl bg-teal-500 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Aturan Resmi Insentif &amp; Denda Produk Fokus BA
              </h3>
              <p className="text-[11px] text-slate-500">
                Formula kompensasi produk fokus toko sesuai standar operasional penjualan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs mt-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pencapaian ≥ 80% (DAPAT INSENTIF)</span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                BA berhak atas <strong className="font-extrabold">Insentif Rp 2.000 / pcs</strong> untuk seluruh kuantitas produk fokus yang terjual.
              </p>
              <div className="mt-2 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-1 rounded">
                Insentif = Realisasi Pcs × Rp 2.000
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50/90 border border-sky-200">
              <div className="flex items-center gap-2 text-sky-800 font-extrabold mb-1">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Pencapaian 70% – 79.9% (STATUS AMAN)</span>
              </div>
              <p className="text-[11px] text-sky-900 leading-relaxed">
                Pencapaian berada di zona toleransi. <strong className="font-extrabold">Bebas denda</strong> (Denda Rp 0) dan tidak mendapat insentif tambahan.
              </p>
              <div className="mt-2 text-[10px] font-mono font-bold text-sky-700 bg-sky-100/70 px-2 py-1 rounded">
                Insentif = Rp 0 | Denda = Rp 0 (Aman)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/90 border border-rose-200">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Pencapaian &lt; 70% (DENDA PENALTI)</span>
              </div>
              <p className="text-[11px] text-rose-900 leading-relaxed">
                BA gerai dikenakan sanksi <strong className="font-extrabold">Denda Rp 1.000 / pcs</strong> dari target yang sudah ditentukan.
              </p>
              <div className="mt-2 text-[10px] font-mono font-bold text-rose-700 bg-rose-100/70 px-2 py-1 rounded">
                Denda = Target Pcs × Rp 1.000
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Target & Realisasi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Target Fokus</span>
            <Target className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {formatNumber(stats.totalTarget)} <span className="text-xs font-normal text-slate-500">pcs</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Realisasi: <strong className="text-slate-900 font-mono">{formatNumber(stats.totalActual)} pcs</strong>
          </div>
        </div>

        {/* Card 2: Rata-rata Pencapaian */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Rata-rata Pencapaian</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {formatPercent(stats.avgAchievement, false)}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                stats.avgAchievement >= 80 ? 'bg-emerald-500' : stats.avgAchievement >= 70 ? 'bg-sky-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, stats.avgAchievement)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Total Insentif */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold">Total Insentif (+Rp)</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            +{formatRupiah(stats.totalIncentive, true)}
          </div>
          <div className="text-[11px] text-emerald-800 mt-1">
            <strong>{stats.countInsentif}</strong> dari {stats.totalBa} BA (≥ 80%)
          </div>
        </div>

        {/* Card 4: Total Denda */}
        <div className="bg-white rounded-2xl border border-rose-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold">Total Denda (-Rp)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700 font-mono">
            -{formatRupiah(stats.totalPenalty, true)}
          </div>
          <div className="text-[11px] text-rose-800 mt-1">
            <strong>{stats.countDenda}</strong> BA di bawah 70%
          </div>
        </div>

        {/* Card 5: Net Dampak Gaji Area */}
        <div className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-semibold">Net Pengaruh Beban</span>
            <PackageCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className={`text-xl font-black font-mono ${stats.netImpact >= 0 ? 'text-indigo-900' : 'text-rose-700'}`}>
            {stats.netImpact >= 0 ? '+' : ''}{formatRupiah(stats.netImpact, true)}
          </div>
          <div className="text-[11px] text-indigo-700 mt-1">
            Masuk ke Cost Gaji Area
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari BA, toko, sales, atau SPV..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: `Semua (${baFocusList.length})` },
            { id: 'insentif', label: `Insentif ≥80% (${stats.countInsentif})`, color: 'text-emerald-700' },
            { id: 'aman', label: `Aman 70-79% (${stats.countAman})`, color: 'text-sky-700' },
            { id: 'denda', label: `Denda <70% (${stats.countDenda})`, color: 'text-rose-700' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className={tab.color}>{tab.label}</span>
            </button>
          ))}

          {/* Area Select */}
          {uniqueAreas.length > 0 && (
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">Semua Area</option>
              {uniqueAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Daftar Evaluasi Produk Fokus Per BA &amp; Gerai
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredList.length} dari {baFocusList.length} Beauty Advisor
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Target Acuan: <span className="font-mono font-bold text-slate-900">{defaultTargetPcs} Pcs</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 text-center">No</th>
                <th className="py-3 px-3.5">Beauty Advisor &amp; No BA</th>
                <th className="py-3 px-3.5">Gerai &amp; Area</th>
                <th className="py-3 px-3.5">Sales &amp; SPV</th>
                <th className="py-3 px-3.5 text-center">Target (Pcs)</th>
                <th className="py-3 px-3.5 text-center">Realisasi (Pcs)</th>
                <th className="py-3 px-3.5 text-center">% Capai</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right text-emerald-800">Insentif (+Rp)</th>
                <th className="py-3 px-3.5 text-right text-rose-800">Denda (-Rp)</th>
                <th className="py-3 px-3.5 text-right">Net ke Gaji</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data BA dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isExpanded = expandedStore === item.storeName;

                  return (
                    <React.Fragment key={item.storeName}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Nama BA */}
                        <td className="py-3 px-3.5">
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{item.baName}</span>
                            {item.isCustomOverride && (
                              <span
                                className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold"
                                title="Target / realisasi diset manual oleh manajemen"
                              >
                                Manual
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.baNumber}
                          </div>
                        </td>

                        {/* Toko & Area */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 truncate max-w-[180px]">
                            {item.storeName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {item.coverArea} • {item.region}
                          </div>
                        </td>

                        {/* Sales & SPV */}
                        <td className="py-3 px-3.5">
                          <div className="font-medium text-slate-800">
                            {item.salesName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            SPV: {item.spv}
                          </div>
                        </td>

                        {/* Target Pcs */}
                        <td className="py-3 px-3.5 text-center">
                          <span className="font-mono font-bold text-slate-900 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                            {item.targetPcs} pcs
                          </span>
                        </td>

                        {/* Realisasi Pcs */}
                        <td className="py-3 px-3.5 text-center">
                          <span className="font-mono font-extrabold text-slate-900 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200">
                            {item.actualPcs} pcs
                          </span>
                        </td>

                        {/* % Capai */}
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex flex-col items-center">
                            <span
                              className={`font-mono font-black text-xs ${
                                item.achievementPct >= 80
                                  ? 'text-emerald-700'
                                  : item.achievementPct >= 70
                                  ? 'text-sky-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {item.achievementPct.toFixed(1)}%
                            </span>
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  item.achievementPct >= 80
                                    ? 'bg-emerald-500'
                                    : item.achievementPct >= 70
                                    ? 'bg-sky-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, item.achievementPct)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3.5 text-center">
                          {item.status === 'insentif' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Insentif 80%+</span>
                            </span>
                          )}
                          {item.status === 'aman' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
                              <ShieldCheck className="w-3 h-3" />
                              <span>AMAN (70-79%)</span>
                            </span>
                          )}
                          {item.status === 'denda' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Denda (&lt; 70%)</span>
                            </span>
                          )}
                        </td>

                        {/* Insentif (+Rp) */}
                        <td className="py-3 px-3.5 text-right font-mono font-extrabold text-emerald-700">
                          {item.incentive > 0 ? `+${formatRupiah(item.incentive, false)}` : '-'}
                        </td>

                        {/* Denda (-Rp) */}
                        <td className="py-3 px-3.5 text-right font-mono font-extrabold text-rose-700">
                          {item.penalty > 0 ? `-${formatRupiah(item.penalty, false)}` : '-'}
                        </td>

                        {/* Net ke Gaji */}
                        <td className="py-3 px-3.5 text-right">
                          <span
                            className={`font-mono font-extrabold px-2 py-0.5 rounded ${
                              item.netBonus > 0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : item.netBonus < 0
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'text-slate-500'
                            }`}
                          >
                            {item.netBonus > 0 ? '+' : ''}{formatRupiah(item.netBonus, false)}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors cursor-pointer"
                              title="Edit target & capaian BA"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {item.focusSkusSold && item.focusSkusSold.length > 0 && (
                              <button
                                onClick={() => setExpandedStore(isExpanded ? null : item.storeName)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="Lihat rincian SKU fokus terjual"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Row: Breakdown SKU Terjual */}
                      {isExpanded && item.focusSkusSold && item.focusSkusSold.length > 0 && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={12} className="p-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-3.5 max-w-3xl">
                              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <PackageCheck className="w-4 h-4 text-teal-600" />
                                  Rincian SKU Produk Fokus Terjual di {item.storeName}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  Total: {item.actualPcs} pcs
                                </span>
                              </div>
                              <div className="divide-y divide-slate-100 text-xs">
                                {item.focusSkusSold.map((skuItem) => (
                                  <div
                                    key={skuItem.sku}
                                    className="py-1.5 flex items-center justify-between"
                                  >
                                    <div>
                                      <span className="font-extrabold text-slate-800">
                                        {skuItem.sku}
                                      </span>
                                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                        {skuItem.brand}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-mono font-bold text-teal-800 mr-3">
                                        {skuItem.qty} pcs
                                      </span>
                                      <span className="font-mono text-slate-500 text-[11px]">
                                        {formatRupiah(skuItem.value, true)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Edit Single BA Target & Actual */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-teal-800 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-teal-300" />
                  Edit Target &amp; Capaian Produk Fokus
                </h3>
                <p className="text-xs text-teal-200 mt-0.5">
                  {editingItem.baName} ({editingItem.baNumber}) • {editingItem.storeName}
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Produk Fokus (Pcs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editTargetPcs}
                    onChange={(e) => setEditTargetPcs(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold text-sm text-slate-900"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Standar default: {defaultTargetPcs} pcs
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Realisasi Penjualan (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editActualPcs}
                    onChange={(e) => setEditActualPcs(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold text-sm text-slate-900"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Bisa disesuaikan jika ada revisi data
                  </span>
                </div>
              </div>

              {/* Live Preview Box */}
              {previewCalculation && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Simulasi Status Otomatis:</span>
                    <span className="font-mono font-extrabold text-slate-900">
                      {previewCalculation.achievementPct.toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold">
                    {previewCalculation.status === 'insentif' && (
                      <div className="flex items-center gap-2 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>DAPAT INSENTIF (≥ 80%)</span>
                      </div>
                    )}
                    {previewCalculation.status === 'aman' && (
                      <div className="flex items-center gap-2 text-sky-800">
                        <ShieldCheck className="w-4 h-4 text-sky-600" />
                        <span>STATUS AMAN (70% - 79.9%)</span>
                      </div>
                    )}
                    {previewCalculation.status === 'denda' && (
                      <div className="flex items-center gap-2 text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>DENDA PENALTI (&lt; 70%)</span>
                      </div>
                    )}

                    <div className="font-mono text-right">
                      {previewCalculation.status === 'insentif' && (
                        <span className="text-emerald-700">+{formatRupiah(previewCalculation.incentive, false)}</span>
                      )}
                      {previewCalculation.status === 'aman' && (
                        <span className="text-slate-500">Rp 0 (Bebas Denda)</span>
                      )}
                      {previewCalculation.status === 'denda' && (
                        <span className="text-rose-700">-{formatRupiah(previewCalculation.penalty, false)}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    {previewCalculation.explanation}
                  </p>
                </div>
              )}

              {/* Managerial Override (Dispensasi) */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Penyesuaian Khusus Manajemen (Dispensasi / Override Nominal)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Override Insentif (Rp)
                    </label>
                    <input
                      type="number"
                      placeholder="Biarkan kosong jika otomatis"
                      value={editOverrideIncentive}
                      onChange={(e) => setEditOverrideIncentive(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Override Denda (Rp)
                    </label>
                    <input
                      type="number"
                      placeholder="0 jika dispensasi denda"
                      value={editOverridePenalty}
                      onChange={(e) => setEditOverridePenalty(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Catatan Alasan / Memo Dispensasi
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Dispensasi disetujui SPV Widodo karena stok tester terlambat datang dari gudang."
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {editingItem.isCustomOverride && (
                  <button
                    type="button"
                    onClick={() => handleResetSingleOverride(editingItem.storeName)}
                    className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-colors cursor-pointer"
                  >
                    Reset ke Sistem
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Set Target Massal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-teal-800 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-300" />
                  Set Target Massal Produk Fokus
                </h3>
                <p className="text-xs text-teal-200 mt-0.5">
                  Terapkan target kuantitas (Pcs) standar ke seluruh BA area
                </p>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchTarget} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Produk Fokus Baru per BA (Pcs)
                </label>
                <input
                  type="number"
                  min="1"
                  value={batchTargetInput}
                  onChange={(e) => setBatchTargetInput(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold text-base text-slate-900"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Nilai ini akan dijadikan target dasar untuk seluruh {baFocusList.length} Beauty Advisor yang bertugas.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {[100, 120, 150, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBatchTargetInput(val)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      batchTargetInput === val
                        ? 'bg-teal-50 border-teal-500 text-teal-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {val} Pcs
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Terapkan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
