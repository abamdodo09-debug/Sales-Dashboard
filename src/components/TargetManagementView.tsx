import React, { useState, useMemo } from 'react';
import {
  Target,
  MapPin,
  Building2,
  Users,
  Store,
  GraduationCap,
  Calendar,
  Edit3,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Search,
  ArrowUpDown,
  Calculator,
  Sparkles,
  TrendingUp,
  X,
  Plus,
  HelpCircle,
  Save,
} from 'lucide-react';
import {
  TransactionRecord,
  DashboardFilters,
  AreaTargetItem,
  SpvTargetItem,
  SalesTargetItem,
  BaTargetItem,
  TrainerTargetItem,
} from '../types/dashboard';
import {
  aggregateTargetMatrix,
  saveAreaTargets,
  saveSpvTargets,
  saveSalesTargets,
  saveBaNonLavojoyTargets,
  saveBaLavojoyTargets,
  saveTrainerTargets,
  loadAreaTargets,
  loadSpvTargets,
  loadSalesTargets,
  loadBaNonLavojoyTargets,
  loadBaLavojoyTargets,
  loadTrainerTargets,
  DEFAULT_AREA_TARGET,
  DEFAULT_SPV_TARGET,
  DEFAULT_SALES_TARGET,
  DEFAULT_BA_NON_LAVOJOY_TARGET,
  DEFAULT_BA_LAVOJOY_TARGET,
  DEFAULT_TRAINER_SELL_OUT_TARGET,
  DEFAULT_TRAINER_FOCUS_TARGET_PCS,
} from '../services/targetManagementService';
import {
  loadFocusOverrides,
  saveFocusOverrides,
  DEFAULT_FOCUS_TARGET_PCS,
} from '../services/focusProductService';
import { formatRupiah, formatNumber, formatPercent } from '../utils/analytics';
import * as XLSX from 'xlsx';

interface TargetManagementViewProps {
  records: TransactionRecord[];
  filters: DashboardFilters;
  onTargetUpdated?: () => void;
}

export const TargetManagementView: React.FC<TargetManagementViewProps> = ({
  records,
  filters,
  onTargetUpdated,
}) => {
  // Active sub-tab: area | spv | sales | ba | trainer
  const [subTab, setSubTab] = useState<'area' | 'spv' | 'sales' | 'ba' | 'trainer'>('sales');

  // Selected Target Month (Setiap bulan memiliki target tersendiri untuk sales, ba, dan trainer)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Trigger re-render when local storage updates
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Search & Status filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'achieved' | 'on_track' | 'lagging'>('all');

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'target' | 'actual' | 'pct' | 'gap'>('actual');
  const [sortAsc, setSortAsc] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Modals
  // 1. Edit Area Modal
  const [editingArea, setEditingArea] = useState<AreaTargetItem | null>(null);
  const [areaTargetInput, setAreaTargetInput] = useState<number>(DEFAULT_AREA_TARGET);

  // 2. Edit SPV Modal
  const [editingSpv, setEditingSpv] = useState<SpvTargetItem | null>(null);
  const [spvTargetInput, setSpvTargetInput] = useState<number>(DEFAULT_SPV_TARGET);

  // 3. Edit Sales Modal
  const [editingSales, setEditingSales] = useState<SalesTargetItem | null>(null);
  const [salesTargetInput, setSalesTargetInput] = useState<number>(DEFAULT_SALES_TARGET);

  // 4. Edit BA Modal
  const [editingBa, setEditingBa] = useState<BaTargetItem | null>(null);
  const [baNonLavojoyInput, setBaNonLavojoyInput] = useState<number>(DEFAULT_BA_NON_LAVOJOY_TARGET);
  const [baLavojoyInput, setBaLavojoyInput] = useState<number>(DEFAULT_BA_LAVOJOY_TARGET);
  const [baFocusInput, setBaFocusInput] = useState<number>(DEFAULT_FOCUS_TARGET_PCS);

  // 5. Edit Trainer Modal
  const [editingTrainer, setEditingTrainer] = useState<TrainerTargetItem | null>(null);
  const [trainerSellOutInput, setTrainerSellOutInput] = useState<number>(DEFAULT_TRAINER_SELL_OUT_TARGET);
  const [trainerFocusInput, setTrainerFocusInput] = useState<number>(DEFAULT_TRAINER_FOCUS_TARGET_PCS);
  const [trainerNotesInput, setTrainerNotesInput] = useState<string>('');

  // 6. Batch Target Modal
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchTargetType, setBatchTargetType] = useState<
    'area' | 'spv' | 'sales' | 'ba_non' | 'ba_lav' | 'ba_focus' | 'trainer_so' | 'trainer_focus'
  >('sales');
  const [batchTargetValue, setBatchTargetValue] = useState<number>(150000000);

  // Aggregate target matrix data respecting selectedMonth
  const matrixData = useMemo(() => {
    return aggregateTargetMatrix(records, selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, selectedMonth, refreshKey]);

  // Handlers for Saving Single Targets
  const handleSaveAreaTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea) return;
    const current = loadAreaTargets();
    current[editingArea.coverArea] = areaTargetInput;
    saveAreaTargets(current);
    setEditingArea(null);
    setRefreshKey((k) => k + 1);
    if (onTargetUpdated) onTargetUpdated();
    showNotification(`Target Area "${editingArea.coverArea}" berhasil diupdate: ${formatRupiah(areaTargetInput)}`);
  };

  const handleSaveSpvTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpv) return;
    const current = loadSpvTargets();
    current[editingSpv.spvName] = spvTargetInput;
    saveSpvTargets(current);
    setEditingSpv(null);
    setRefreshKey((k) => k + 1);
    if (onTargetUpdated) onTargetUpdated();
    showNotification(`Target SPV "${editingSpv.spvName}" berhasil diupdate: ${formatRupiah(spvTargetInput)}`);
  };

  const handleSaveSalesTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSales) return;
    const current = loadSalesTargets(selectedMonth);
    current[editingSales.salesName] = salesTargetInput;
    saveSalesTargets(current, selectedMonth);
    setEditingSales(null);
    setRefreshKey((k) => k + 1);
    if (onTargetUpdated) onTargetUpdated();
    showNotification(`Target Sell In Sales "${editingSales.salesName}" (${selectedMonth}) berhasil diupdate: ${formatRupiah(salesTargetInput)}`);
  };

  const handleSaveBaTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBa) return;
    const currentNon = loadBaNonLavojoyTargets(selectedMonth);
    const currentLav = loadBaLavojoyTargets(selectedMonth);
    const currentFocus = loadFocusOverrides();

    currentNon[editingBa.storeName] = baNonLavojoyInput;
    currentLav[editingBa.storeName] = baLavojoyInput;

    if (!currentFocus[editingBa.storeName]) {
      currentFocus[editingBa.storeName] = { storeName: editingBa.storeName };
    }
    currentFocus[editingBa.storeName].targetPcs = baFocusInput;

    saveBaNonLavojoyTargets(currentNon, selectedMonth);
    saveBaLavojoyTargets(currentLav, selectedMonth);
    saveFocusOverrides(currentFocus);

    setEditingBa(null);
    setRefreshKey((k) => k + 1);
    if (onTargetUpdated) onTargetUpdated();
    showNotification(`Target Toko/BA "${editingBa.storeName}" (${selectedMonth}) berhasil diperbarui!`);
  };

  // 5. Handler for Saving Trainer Target
  const handleSaveTrainerTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer) return;
    const current = loadTrainerTargets(selectedMonth);
    current[editingTrainer.id] = {
      targetSellOut: trainerSellOutInput,
      targetProdukFokusPcs: trainerFocusInput,
      notes: trainerNotesInput,
    };
    saveTrainerTargets(current, selectedMonth);
    setEditingTrainer(null);
    setRefreshKey((k) => k + 1);
    if (onTargetUpdated) onTargetUpdated();
    showNotification(
      `Target Trainer "${editingTrainer.trainerName}" (${selectedMonth}) berhasil disimpan: SO ${formatRupiah(trainerSellOutInput)} & Fokus ${trainerFocusInput} pcs`
    );
  };

  // Handler for Batch Target Setting
  const handleApplyBatchTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchTargetType === 'area') {
      const current: Record<string, number> = {};
      matrixData.areas.forEach((a) => {
        current[a.coverArea] = batchTargetValue;
      });
      saveAreaTargets(current);
      showNotification(`Target serentak ${formatRupiah(batchTargetValue)} diterapkan ke ${matrixData.areas.length} Area!`);
    } else if (batchTargetType === 'spv') {
      const current: Record<string, number> = {};
      matrixData.spvs.forEach((s) => {
        current[s.spvName] = batchTargetValue;
      });
      saveSpvTargets(current);
      showNotification(`Target serentak ${formatRupiah(batchTargetValue)} diterapkan ke ${matrixData.spvs.length} SPV!`);
    } else if (batchTargetType === 'sales') {
      const current: Record<string, number> = {};
      matrixData.sales.forEach((sl) => {
        current[sl.salesName] = batchTargetValue;
      });
      saveSalesTargets(current, selectedMonth);
      showNotification(`Target serentak ${formatRupiah(batchTargetValue)} (${selectedMonth}) diterapkan ke ${matrixData.sales.length} Sales!`);
    } else if (batchTargetType === 'ba_non') {
      const current: Record<string, number> = {};
      matrixData.bas.forEach((b) => {
        current[b.storeName] = batchTargetValue;
      });
      saveBaNonLavojoyTargets(current, selectedMonth);
      showNotification(`Target Non-Lavojoy serentak ${formatRupiah(batchTargetValue)} (${selectedMonth}) diterapkan ke ${matrixData.bas.length} Toko BA!`);
    } else if (batchTargetType === 'ba_lav') {
      const current: Record<string, number> = {};
      matrixData.bas.forEach((b) => {
        current[b.storeName] = batchTargetValue;
      });
      saveBaLavojoyTargets(current, selectedMonth);
      showNotification(`Target Lavojoy serentak ${formatRupiah(batchTargetValue)} (${selectedMonth}) diterapkan ke ${matrixData.bas.length} Toko BA!`);
    } else if (batchTargetType === 'ba_focus') {
      const current = loadFocusOverrides();
      matrixData.bas.forEach((b) => {
        if (!current[b.storeName]) current[b.storeName] = { storeName: b.storeName };
        current[b.storeName].targetPcs = batchTargetValue;
      });
      saveFocusOverrides(current);
      showNotification(`Target Produk Fokus serentak ${batchTargetValue} pcs diterapkan ke seluruh BA!`);
    } else if (batchTargetType === 'trainer_so') {
      const current = loadTrainerTargets(selectedMonth);
      matrixData.trainers.forEach((t) => {
        if (!current[t.id]) current[t.id] = {};
        current[t.id].targetSellOut = batchTargetValue;
      });
      saveTrainerTargets(current, selectedMonth);
      showNotification(`Target Trainer Sell Out serentak ${formatRupiah(batchTargetValue)} (${selectedMonth}) diterapkan ke seluruh Trainer!`);
    } else if (batchTargetType === 'trainer_focus') {
      const current = loadTrainerTargets(selectedMonth);
      matrixData.trainers.forEach((t) => {
        if (!current[t.id]) current[t.id] = {};
        current[t.id].targetProdukFokusPcs = batchTargetValue;
      });
      saveTrainerTargets(current, selectedMonth);
      showNotification(`Target Trainer Produk Fokus serentak ${batchTargetValue} pcs (${selectedMonth}) diterapkan ke seluruh Trainer!`);
    }

    setIsBatchOpen(false);
    setRefreshKey((k) => k + 1);
    if (onTargetUpdated) onTargetUpdated();
  };

  // Auto-Sum from Team
  const handleAutoSumSpvFromSales = (spvItem: SpvTargetItem) => {
    // Sum target of all sales belonging to this SPV
    const teamSales = matrixData.sales.filter((s) => s.spv === spvItem.spvName);
    const sumTarget = teamSales.reduce((acc, s) => acc + s.targetSellIn, 0);
    const targetToSet = sumTarget > 0 ? sumTarget : DEFAULT_SPV_TARGET;

    const current = loadSpvTargets();
    current[spvItem.spvName] = targetToSet;
    saveSpvTargets(current);
    setRefreshKey((k) => k + 1);
    if (onTargetUpdated) onTargetUpdated();
    showNotification(`Target SPV "${spvItem.spvName}" dihitung otomatis dari total target tim (${teamSales.length} sales): ${formatRupiah(targetToSet)}`);
  };

  const handleAutoSumAreaFromSales = (areaItem: AreaTargetItem) => {
    const areaSales = matrixData.sales.filter((s) => s.coverArea === areaItem.coverArea);
    const sumTarget = areaSales.reduce((acc, s) => acc + s.targetSellIn, 0);
    const targetToSet = sumTarget > 0 ? sumTarget : DEFAULT_AREA_TARGET;

    const current = loadAreaTargets();
    current[areaItem.coverArea] = targetToSet;
    saveAreaTargets(current);
    setRefreshKey((k) => k + 1);
    if (onTargetUpdated) onTargetUpdated();
    showNotification(`Target Area "${areaItem.coverArea}" dihitung otomatis dari total target tim sales (${areaSales.length} sales): ${formatRupiah(targetToSet)}`);
  };

  // Reset Everything to Default
  const handleResetAllTargets = () => {
    if (!window.confirm('Reset semua target (Area, SPV, Sales, BA & Produk Fokus) ke default bawaan sistem?')) {
      return;
    }
    localStorage.removeItem('salespro_custom_area_targets');
    localStorage.removeItem('salespro_custom_spv_targets');
    localStorage.removeItem('salespro_custom_sales_targets');
    localStorage.removeItem('salespro_custom_ba_non_lavojoy_targets');
    localStorage.removeItem('salespro_custom_ba_lavojoy_targets');
    localStorage.removeItem('salespro_ba_focus_overrides_v2');

    setRefreshKey((k) => k + 1);
    if (onTargetUpdated) onTargetUpdated();
    showNotification('Seluruh target Area, SPV, Sales, dan BA berhasil direset ke default!', 'info');
  };

  // Export Target Matrix to Excel
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Target Area
      const areaRows = matrixData.areas.map((a, idx) => ({
        No: idx + 1,
        'Cover Area': a.coverArea,
        Region: a.region,
        'Target Omzet (IDR)': a.targetOmzet,
        'Realisasi Sell In (IDR)': a.actualSellIn,
        'Realisasi Sell Out (IDR)': a.actualSellOut,
        'Gap Omzet (IDR)': a.gapOmzet,
        '% Pencapaian': `${a.achievementPct.toFixed(1)}%`,
        Status: a.status === 'achieved' ? 'Tercapai (≥100%)' : a.status === 'on_track' ? 'On Track (80-99%)' : 'Belum Capai (<80%)',
        'Jumlah Sales': a.salesCount,
        'Jumlah Toko': a.storeCount,
      }));
      const wsArea = XLSX.utils.json_to_sheet(areaRows);
      XLSX.utils.book_append_sheet(wb, wsArea, 'Target Area');

      // Sheet 2: Target SPV
      const spvRows = matrixData.spvs.map((s, idx) => ({
        No: idx + 1,
        'Nama SPV': s.spvName,
        'Wilayah Cover': s.coverAreas.join(', '),
        'Target Tim SPV (IDR)': s.targetOmzet,
        'Realisasi Sell In (IDR)': s.actualSellIn,
        'Gap Omzet (IDR)': s.gapOmzet,
        '% Pencapaian': `${s.achievementPct.toFixed(1)}%`,
        Status: s.status === 'achieved' ? 'Tercapai (≥100%)' : s.status === 'on_track' ? 'On Track (80-99%)' : 'Belum Capai (<80%)',
        'Jumlah Sales': s.salesCount,
        'Jumlah Toko': s.storeCount,
      }));
      const wsSpv = XLSX.utils.json_to_sheet(spvRows);
      XLSX.utils.book_append_sheet(wb, wsSpv, 'Target SPV');

      // Sheet 3: Target Sales
      const salesRows = matrixData.sales.map((sl, idx) => ({
        No: idx + 1,
        'Nama Sales': sl.salesName,
        'Cover Area': sl.coverArea,
        Supervisor: sl.spv,
        'Target Sell In (IDR)': sl.targetSellIn,
        'Realisasi Sell In (IDR)': sl.actualSellIn,
        '% Pencapaian': `${sl.achievementPct.toFixed(1)}%`,
        'Skema Insentif': `${sl.incentivePercent}% (≥100%: 4% | 80-99%: 0.2%)`,
        'Estimasi Insentif (IDR)': sl.incentiveNominal,
        Status: sl.status === 'achieved' ? 'Tercapai (≥100%)' : sl.status === 'on_track' ? 'On Track (80-99%)' : 'Belum Capai (<80%)',
      }));
      const wsSales = XLSX.utils.json_to_sheet(salesRows);
      XLSX.utils.book_append_sheet(wb, wsSales, 'Target Sales');

      // Sheet 4: Target BA
      const baRows = matrixData.bas.map((b, idx) => ({
        No: idx + 1,
        'Nama BA': b.baName,
        'Nama Toko': b.storeName,
        Area: b.coverArea,
        Sales: b.salesName,
        'Target Non-Lavojoy (IDR)': b.targetNonLavojoy,
        'Sell Out Non-Lavojoy (IDR)': b.actualNonLavojoy,
        '% Capai Non-Lavojoy': `${b.achievementNonLavojoyPct.toFixed(1)}%`,
        'Target Lavojoy (IDR)': b.targetLavojoy,
        'Sell Out Lavojoy (IDR)': b.actualLavojoy,
        '% Capai Lavojoy': `${b.achievementLavojoyPct.toFixed(1)}%`,
        'Target Produk Fokus (Pcs)': b.targetFocusPcs,
        'Realisasi Produk Fokus (Pcs)': b.actualFocusPcs,
        '% Capai Fokus': `${b.achievementFocusPct.toFixed(1)}%`,
        'Status Evaluasi Fokus': b.focusStatus.toUpperCase(),
        'Insentif Fokus (Rp 2rb)': b.focusIncentive,
        'Denda Fokus (Rp 1rb)': b.focusPenalty,
      }));
      const wsBa = XLSX.utils.json_to_sheet(baRows);
      XLSX.utils.book_append_sheet(wb, wsBa, 'Target BA & Gerai');

      XLSX.writeFile(wb, `Matrix_Kelola_Target_SalesPro_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showNotification('File Excel Rekap Matrix Target berhasil diunduh!');
    } catch (err: any) {
      showNotification('Gagal unduh Excel: ' + (err.message || 'Error'), 'error');
    }
  };

  // Filtered lists according to search and status
  const filteredAreas = useMemo(() => {
    return matrixData.areas.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchQ = a.coverArea.toLowerCase().includes(q) || a.region.toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || a.status === statusFilter;
      return matchQ && matchS;
    });
  }, [matrixData.areas, searchQuery, statusFilter]);

  const filteredSpvs = useMemo(() => {
    return matrixData.spvs.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchQ =
        s.spvName.toLowerCase().includes(q) ||
        s.coverAreas.some((c) => c.toLowerCase().includes(q));
      const matchS = statusFilter === 'all' || s.status === statusFilter;
      return matchQ && matchS;
    });
  }, [matrixData.spvs, searchQuery, statusFilter]);

  const filteredSales = useMemo(() => {
    return matrixData.sales.filter((sl) => {
      const q = searchQuery.toLowerCase();
      const matchQ =
        sl.salesName.toLowerCase().includes(q) ||
        sl.coverArea.toLowerCase().includes(q) ||
        sl.spv.toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || sl.status === statusFilter;
      return matchQ && matchS;
    });
  }, [matrixData.sales, searchQuery, statusFilter]);

  const filteredBas = useMemo(() => {
    return matrixData.bas.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchQ =
        b.baName.toLowerCase().includes(q) ||
        b.storeName.toLowerCase().includes(q) ||
        b.coverArea.toLowerCase().includes(q) ||
        b.salesName.toLowerCase().includes(q);
      const matchS =
        statusFilter === 'all' ||
        (statusFilter === 'achieved' && b.achievementNonLavojoyPct >= 100) ||
        (statusFilter === 'on_track' && b.achievementNonLavojoyPct >= 80 && b.achievementNonLavojoyPct < 100) ||
        (statusFilter === 'lagging' && b.achievementNonLavojoyPct < 80);
      return matchQ && matchS;
    });
  }, [matrixData.bas, searchQuery, statusFilter]);

  const filteredTrainers = useMemo(() => {
    return (matrixData.trainers || []).filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchQ =
        t.trainerName.toLowerCase().includes(q) ||
        t.areaCovered.toLowerCase().includes(q) ||
        t.region.toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || t.status === statusFilter;
      return matchQ && matchS;
    });
  }, [matrixData.trainers, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all animate-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-950/20'
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700 shadow-rose-950/20'
              : 'bg-indigo-900 text-white border-indigo-700 shadow-indigo-950/20'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {toast.type === 'info' && <Sliders className="w-4 h-4 text-cyan-300" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* HEADER SECTION: Top Banner & Primary Action Buttons */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                  Target &amp; Performance Control Center
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Pusat Kelola Target (Area, SPV, Sales &amp; BA)
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Modul terintegrasi untuk menetapkan target omzet berjenjang, mengontrol pencapaian tim, dan menyinkronkan
              otomatis ke perhitungan <strong>Gaji Sales (Insentif 4% saat capai ≥100%)</strong>, <strong>Cost Area</strong>, serta <strong>Produk Fokus BA</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* FILTER BULAN TARGET PERIODE */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-xs backdrop-blur-xs transition-colors">
              <Calendar className="w-4 h-4 text-cyan-300" />
              <span className="text-[11px] text-indigo-200 font-bold">Target Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  showNotification(`Beralih mengelola target periode ${e.target.value}`);
                }}
                className="bg-transparent font-black text-white focus:outline-hidden cursor-pointer"
              >
                <option value="2026-10" className="text-slate-900">Oktober 2026 (Aktif)</option>
                <option value="2026-09" className="text-slate-900">September 2026</option>
                <option value="2026-08" className="text-slate-900">Agustus 2026</option>
                <option value="ALL" className="text-slate-900">Semua Bulan (Baseline Global)</option>
              </select>
            </div>

            <button
              onClick={() => {
                setBatchTargetType(
                  subTab === 'area'
                    ? 'area'
                    : subTab === 'spv'
                    ? 'spv'
                    : subTab === 'sales'
                    ? 'sales'
                    : subTab === 'trainer'
                    ? 'trainer_so'
                    : 'ba_non'
                );
                setBatchTargetValue(
                  subTab === 'area'
                    ? DEFAULT_AREA_TARGET
                    : subTab === 'spv'
                    ? DEFAULT_SPV_TARGET
                    : subTab === 'sales'
                    ? DEFAULT_SALES_TARGET
                    : subTab === 'trainer'
                    ? DEFAULT_TRAINER_SELL_OUT_TARGET
                    : DEFAULT_BA_NON_LAVOJOY_TARGET
                );
                setIsBatchOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-cyan-300" />
              <span>Atur Target Massal</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              title="Unduh rekapitulasi seluruh target ke Excel"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Matrix (.xlsx)</span>
            </button>

            <button
              onClick={handleResetAllTargets}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
              title="Kembalikan semua target ke nilai default sistem"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Default</span>
            </button>
          </div>
        </div>

        {/* 5 SUMMARY STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-6 pt-5 border-t border-indigo-900/60">
          {/* Card 1: Target Area */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-cyan-300">
                <MapPin className="w-3.5 h-3.5" />
                Target Seluruh Area
              </span>
              <span className={`px-2 py-0.2 rounded font-mono text-[10px] ${
                matrixData.summary.areaAchievementPct >= 100
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {matrixData.summary.areaAchievementPct.toFixed(1)}% Capai
              </span>
            </div>
            <div className="text-xl font-black font-mono text-white tabular-nums">
              {formatRupiah(matrixData.summary.totalAreaTarget, true)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center justify-between">
              <span>Realisasi: {formatRupiah(matrixData.summary.totalAreaActual, true)}</span>
              <span>{matrixData.areas.length} Area</span>
            </div>
          </div>

          {/* Card 2: Target SPV */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-purple-300">
                <Building2 className="w-3.5 h-3.5" />
                Target Seluruh SPV
              </span>
              <span className={`px-2 py-0.2 rounded font-mono text-[10px] ${
                matrixData.summary.spvAchievementPct >= 100
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {matrixData.summary.spvAchievementPct.toFixed(1)}% Capai
              </span>
            </div>
            <div className="text-xl font-black font-mono text-white tabular-nums">
              {formatRupiah(matrixData.summary.totalSpvTarget, true)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center justify-between">
              <span>Realisasi: {formatRupiah(matrixData.summary.totalSpvActual, true)}</span>
              <span>{matrixData.spvs.length} SPV</span>
            </div>
          </div>

          {/* Card 3: Target Sales */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-indigo-300">
                <Users className="w-3.5 h-3.5" />
                Target Sell In Sales
              </span>
              <span className={`px-2 py-0.2 rounded font-mono text-[10px] ${
                matrixData.summary.salesAchievementPct >= 100
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {matrixData.summary.salesAchievementPct.toFixed(1)}% Capai
              </span>
            </div>
            <div className="text-xl font-black font-mono text-white tabular-nums">
              {formatRupiah(matrixData.summary.totalSalesTarget, true)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center justify-between">
              <span>Realisasi: {formatRupiah(matrixData.summary.totalSalesActual, true)}</span>
              <span className="text-emerald-400 font-bold">
                Insentif: {formatRupiah(matrixData.summary.totalSalesIncentiveEst, true)}
              </span>
            </div>
          </div>

          {/* Card 4: Target BA Toko */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-teal-300">
                <Store className="w-3.5 h-3.5" />
                Target BA Toko
              </span>
              <span className={`px-2 py-0.2 rounded font-mono text-[10px] ${
                matrixData.summary.baAchievementPct >= 100
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {matrixData.summary.baAchievementPct.toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-black font-mono text-white tabular-nums">
              {formatRupiah(matrixData.summary.totalBaTarget, true)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center justify-between">
              <span>Fokus Target: {matrixData.summary.totalBaFocusTargetPcs} pcs</span>
              <span className="text-teal-300 font-bold">
                Capai: {matrixData.summary.totalBaFocusActualPcs} pcs
              </span>
            </div>
          </div>

          {/* Card 5: Target Trainer (Sell Out & Produk Fokus) */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-amber-300">
                <GraduationCap className="w-3.5 h-3.5" />
                Target Trainer
              </span>
              <span className={`px-2 py-0.2 rounded font-mono text-[10px] ${
                matrixData.summary.trainerSellOutAchievementPct >= 100
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {matrixData.summary.trainerSellOutAchievementPct.toFixed(1)}% SO
              </span>
            </div>
            <div className="text-xl font-black font-mono text-white tabular-nums">
              {formatRupiah(matrixData.summary.totalTrainerTargetSellOut, true)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center justify-between">
              <span>Fokus Target: {matrixData.summary.totalTrainerTargetFocusPcs} pcs</span>
              <span className="text-amber-300 font-bold">
                Capai: {matrixData.summary.totalTrainerActualFocusPcs} pcs ({matrixData.summary.trainerFocusAchievementPct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS: Area | SPV | Sales | BA | Trainer */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('area')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === 'area'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>1. Target Area ({matrixData.areas.length})</span>
          </button>

          <button
            onClick={() => setSubTab('spv')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === 'spv'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>2. Target SPV ({matrixData.spvs.length})</span>
          </button>

          <button
            onClick={() => setSubTab('sales')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === 'sales'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Target Sales &amp; Insentif 4% ({matrixData.sales.length})</span>
          </button>

          <button
            onClick={() => setSubTab('ba')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === 'ba'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>4. Target BA Toko &amp; Produk Fokus ({matrixData.bas.length})</span>
          </button>

          <button
            onClick={() => setSubTab('trainer')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === 'trainer'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>5. Target Trainer ({matrixData.trainers?.length || 0})</span>
          </button>
        </div>

        {/* Search & Month Indicator */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Periode: <strong>{selectedMonth === 'ALL' ? 'Semua Bulan' : selectedMonth}</strong></span>
          </span>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, area, atau toko..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* SUBTAB 1: TARGET AREA */}
      {/* ========================================================================================= */}
      {subTab === 'area' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-600" />
                Daftar Target &amp; Realisasi Penjualan per Cover Area
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target omzet wilayah operasional penjualan. Anda dapat mengubah nominal secara manual atau klik "Hitung dari Akumulasi Tim".
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600">
              Total Target Area:{' '}
              <strong className="text-cyan-700 font-bold">{formatRupiah(matrixData.summary.totalAreaTarget)}</strong>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3.5">No</th>
                  <th className="py-3 px-3.5">Nama Cover Area</th>
                  <th className="py-3 px-3.5">Region</th>
                  <th className="py-3 px-3.5 text-right font-black text-cyan-950">Target Omzet Area (IDR)</th>
                  <th className="py-3 px-3.5 text-right">Realisasi Sell In</th>
                  <th className="py-3 px-3.5 text-right">Gap (IDR)</th>
                  <th className="py-3 px-3.5 text-center">% Capai</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-center">Personil Sales</th>
                  <th className="py-3 px-3.5 text-center">Aksi Pengaturan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAreas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Tidak ada area yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredAreas.map((item, idx) => (
                    <tr key={item.coverArea} className="hover:bg-cyan-50/20 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-black text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.coverArea}</span>
                          {item.isCustom && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                              Custom
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">{item.region}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-black text-cyan-950 text-sm bg-cyan-50/30">
                        {formatRupiah(item.targetOmzet)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.actualSellIn)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold">
                        {item.gapOmzet >= 0 ? (
                          <span className="text-emerald-700">+{formatRupiah(item.gapOmzet, true)}</span>
                        ) : (
                          <span className="text-rose-700">{formatRupiah(item.gapOmzet, true)}</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            item.achievementPct >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.achievementPct >= 80
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.achievementPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {item.status === 'achieved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Tercapai
                          </span>
                        )}
                        {item.status === 'on_track' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            <TrendingUp className="w-3 h-3 text-blue-600" />
                            On Track
                          </span>
                        )}
                        {item.status === 'lagging' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Kurang
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-slate-700">
                        {item.salesCount} Sales ({item.storeCount} Toko)
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingArea(item);
                              setAreaTargetInput(item.targetOmzet);
                            }}
                            className="p-1.5 rounded-lg border border-cyan-300 text-cyan-700 hover:bg-cyan-50 transition-colors shadow-2xs cursor-pointer font-bold flex items-center gap-1"
                            title="Edit Target Area Ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Ubah</span>
                          </button>
                          <button
                            onClick={() => handleAutoSumAreaFromSales(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                            title="Hitung Otomatis dari Total Target Tim Sales di Area Ini"
                          >
                            <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* SUBTAB 2: TARGET SPV */}
      {/* ========================================================================================= */}
      {subTab === 'spv' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                Daftar Target &amp; Realisasi Tim Supervisor (SPV)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengaturan target omzet bulanan untuk seluruh tim di bawah naungan Supervisor.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600">
              Total Target SPV:{' '}
              <strong className="text-purple-700 font-bold">{formatRupiah(matrixData.summary.totalSpvTarget)}</strong>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3.5">No</th>
                  <th className="py-3 px-3.5">Nama Supervisor (SPV)</th>
                  <th className="py-3 px-3.5">Cakupan Wilayah / Area</th>
                  <th className="py-3 px-3.5 text-right font-black text-purple-950">Target Tim SPV (IDR)</th>
                  <th className="py-3 px-3.5 text-right">Realisasi Tim</th>
                  <th className="py-3 px-3.5 text-right">Gap Omzet</th>
                  <th className="py-3 px-3.5 text-center">% Capai</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-center">Jumlah Tim</th>
                  <th className="py-3 px-3.5 text-center">Aksi Pengaturan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSpvs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Tidak ada data SPV yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSpvs.map((item, idx) => (
                    <tr key={item.spvName} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-black text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.spvName}</span>
                          {item.isCustom && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                              Custom
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">{item.coverAreas.join(', ')}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-black text-purple-950 text-sm bg-purple-50/30">
                        {formatRupiah(item.targetOmzet)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.actualSellIn)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold">
                        {item.gapOmzet >= 0 ? (
                          <span className="text-emerald-700">+{formatRupiah(item.gapOmzet, true)}</span>
                        ) : (
                          <span className="text-rose-700">{formatRupiah(item.gapOmzet, true)}</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            item.achievementPct >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.achievementPct >= 80
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.achievementPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {item.status === 'achieved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Tercapai
                          </span>
                        )}
                        {item.status === 'on_track' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            <TrendingUp className="w-3 h-3 text-purple-600" />
                            On Track
                          </span>
                        )}
                        {item.status === 'lagging' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Kurang
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-slate-700">
                        {item.salesCount} Sales ({item.storeCount} Toko)
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingSpv(item);
                              setSpvTargetInput(item.targetOmzet);
                            }}
                            className="p-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 transition-colors shadow-2xs cursor-pointer font-bold flex items-center gap-1"
                            title="Edit Target SPV Ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Ubah</span>
                          </button>
                          <button
                            onClick={() => handleAutoSumSpvFromSales(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                            title="Hitung Otomatis dari Total Target Seluruh Sales yang Dibawahi"
                          >
                            <Calculator className="w-3.5 h-3.5 text-purple-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* SUBTAB 3: TARGET SALES (SELL IN & INSENTIF 4%) */}
      {/* ========================================================================================= */}
      {subTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Daftar Target Sell In Sales &amp; Skema Insentif 4% (Saat Capai ≥ 100%)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Sell In menentukan pencapaian individu. Sales yang mencapai <strong className="text-emerald-700">≥ 100%</strong> otomatis berhak atas <strong>Insentif 4% × Realisasi Penjualan</strong>!
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600">
              Total Target Sales:{' '}
              <strong className="text-indigo-700 font-bold">{formatRupiah(matrixData.summary.totalSalesTarget)}</strong>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3.5">No</th>
                  <th className="py-3 px-3.5">Nama Sales</th>
                  <th className="py-3 px-3.5">Area &amp; SPV</th>
                  <th className="py-3 px-3.5 text-right font-black text-indigo-950 bg-indigo-50/50">Target Sell In (IDR)</th>
                  <th className="py-3 px-3.5 text-right">Realisasi Sell In</th>
                  <th className="py-3 px-3.5 text-center">% Capai</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right text-indigo-900 font-bold">Skema Insentif</th>
                  <th className="py-3 px-3.5 text-right text-emerald-800 font-black">Estimasi Insentif (IDR)</th>
                  <th className="py-3 px-3.5 text-center">Toko Ber-BA</th>
                  <th className="py-3 px-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      Tidak ada data sales yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((item, idx) => (
                    <tr key={item.salesName} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-black text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.salesName}</span>
                          {item.isCustom && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                              Custom
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {item.coverArea} ({item.spv})
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-black text-indigo-950 text-sm bg-indigo-50/30">
                        {formatRupiah(item.targetSellIn)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.actualSellIn)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            item.achievementPct >= 100
                              ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                              : item.achievementPct >= 80
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.achievementPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {item.achievementPct >= 100 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Dapat 4%
                          </span>
                        ) : item.achievementPct >= 80 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Dapat 0,2%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Rp 0 (&lt;80%)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-indigo-700">
                        {item.incentivePercent}%
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-black text-emerald-700 text-sm">
                        {item.incentiveNominal > 0 ? (
                          <span>+{formatRupiah(item.incentiveNominal)}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Rp 0</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-slate-600">
                        {item.coveredBaCount} Gerai
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => {
                            setEditingSales(item);
                            setSalesTargetInput(item.targetSellIn);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer font-bold flex items-center gap-1 mx-auto"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Ubah Target</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* SUBTAB 4: TARGET BA & GERAI */}
      {/* ========================================================================================= */}
      {subTab === 'ba' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-teal-600" />
                Daftar Target Beauty Advisor (Non-Lavojoy, Lavojoy &amp; Produk Fokus Pcs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target per toko ber-BA: Target Non-Lavojoy (30 Jt), Target Lavojoy 4% (5 Jt), dan Target Produk Fokus (120 pcs).
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600">
              Total Gerai BA: <strong className="text-teal-700 font-bold">{matrixData.bas.length}</strong>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama BA &amp; Toko</th>
                  <th className="py-3 px-3">Area / Sales</th>
                  {/* Non-Lavojoy */}
                  <th className="py-3 px-3 text-right bg-teal-50/60 font-bold">Target Non-Lavojoy</th>
                  <th className="py-3 px-3 text-right bg-teal-50/60">Sell Out Non-Lav</th>
                  <th className="py-3 px-3 text-center bg-teal-50/60">% Capai</th>
                  {/* Lavojoy */}
                  <th className="py-3 px-3 text-right bg-purple-50/60 font-bold">Target Lavojoy (4%)</th>
                  <th className="py-3 px-3 text-right bg-purple-50/60">Sell Out Lavojoy</th>
                  <th className="py-3 px-3 text-center bg-purple-50/60">% Capai</th>
                  {/* Produk Fokus Pcs */}
                  <th className="py-3 px-3 text-center bg-amber-50/60 font-bold">Target Fokus (Pcs)</th>
                  <th className="py-3 px-3 text-center bg-amber-50/60">Realisasi (Pcs)</th>
                  <th className="py-3 px-3 text-center bg-amber-50/60">% Capai</th>
                  <th className="py-3 px-3 text-right bg-amber-50/60">Kompensasi Fokus</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBas.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-400">
                      Tidak ada data BA yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredBas.map((item, idx) => (
                    <tr key={item.storeName} className="hover:bg-teal-50/20 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900">{item.baName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{item.storeName}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div>{item.coverArea}</div>
                        <div className="text-[10px] text-slate-400">{item.salesName}</div>
                      </td>

                      {/* Non-Lavojoy */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-teal-900 bg-teal-50/20">
                        {formatRupiah(item.targetNonLavojoy)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 bg-teal-50/20">
                        {formatRupiah(item.actualNonLavojoy)}
                      </td>
                      <td className="py-3 px-3 text-center bg-teal-50/20">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                            item.achievementNonLavojoyPct >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.achievementNonLavojoyPct >= 70
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.achievementNonLavojoyPct.toFixed(1)}%
                        </span>
                      </td>

                      {/* Lavojoy */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-purple-900 bg-purple-50/20">
                        {formatRupiah(item.targetLavojoy)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 bg-purple-50/20">
                        {formatRupiah(item.actualLavojoy)}
                      </td>
                      <td className="py-3 px-3 text-center bg-purple-50/20">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                            item.achievementLavojoyPct >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.achievementLavojoyPct.toFixed(1)}%
                        </span>
                      </td>

                      {/* Produk Fokus */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-900 bg-amber-50/20">
                        {item.targetFocusPcs} pcs
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-900 bg-amber-50/20">
                        {item.actualFocusPcs} pcs
                      </td>
                      <td className="py-3 px-3 text-center bg-amber-50/20">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                            item.focusStatus === 'insentif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.focusStatus === 'aman'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.achievementFocusPct.toFixed(1)}% ({item.focusStatus === 'insentif' ? '≥80%' : item.focusStatus === 'aman' ? 'AMAN' : '<70%'})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold bg-amber-50/20">
                        {item.focusStatus === 'insentif' && (
                          <span className="text-emerald-700">+{formatRupiah(item.focusIncentive)}</span>
                        )}
                        {item.focusStatus === 'aman' && (
                          <span className="text-slate-400 font-normal">Rp 0 (Aman)</span>
                        )}
                        {item.focusStatus === 'denda' && (
                          <span className="text-rose-700">-{formatRupiah(item.focusPenalty)}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            setEditingBa(item);
                            setBaNonLavojoyInput(item.targetNonLavojoy);
                            setBaLavojoyInput(item.targetLavojoy);
                            setBaFocusInput(item.targetFocusPcs);
                          }}
                          className="px-2 py-1 rounded-lg border border-teal-300 text-teal-700 hover:bg-teal-50 transition-colors shadow-2xs cursor-pointer font-bold flex items-center gap-1 mx-auto"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Ubah Target</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* SUBTAB 5: TARGET TRAINER (SELL OUT & PRODUK FOKUS)                                        */}
      {/* ========================================================================================= */}
      {subTab === 'trainer' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-600" />
                Daftar Target Trainer: Sell Out &amp; Produk Fokus ({selectedMonth === 'ALL' ? 'Semua Bulan' : selectedMonth})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target bulanan yang dapat diedit untuk Trainer mencakup <strong>Target Sell Out (Rp)</strong> dan <strong>Target Produk Fokus (Pcs)</strong>.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600">
              Menampilkan: <strong className="text-slate-900">{filteredTrainers.length}</strong> Trainer | Target Periode:{' '}
              <strong className="text-amber-700 font-bold">{selectedMonth}</strong>
            </div>
          </div>

          {/* Quick Guide Card for Trainer Targets */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-yellow-50/60 rounded-xl border border-amber-200 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-amber-950">Skema &amp; Evaluasi Produktivitas Trainer:</span>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Pencapaian dihitung otomatis dari gerai dan BA binaan di area masing-masing
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-amber-200/60 text-[11px] text-amber-900">
              <div>
                • <strong>Pilar 1: Target Sell Out (Rp):</strong> Pembinaan penjualan gerai &amp; omzet tim BA multi-brand.
              </div>
              <div>
                • <strong>Pilar 2: Target Produk Fokus (Pcs):</strong> Penetrasi SKU hero/fokus (barenbliss, lavojoy, Y.O.U, DAZZLE ME).
              </div>
            </div>
          </div>

          {/* Trainer Target Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Trainer</th>
                  <th className="py-3 px-3">Wilayah Binaan &amp; Region</th>
                  <th className="py-3 px-2 text-center">BA Binaan</th>
                  {/* Sell Out Group */}
                  <th className="py-3 px-3 text-right bg-amber-50/50 text-amber-950">Target Sell Out (Rp)</th>
                  <th className="py-3 px-3 text-right bg-amber-50/50 text-amber-950">Realisasi Sell Out (Rp)</th>
                  <th className="py-3 px-2 text-center bg-amber-50/50 text-amber-950">% Capai SO</th>
                  {/* Focus Group */}
                  <th className="py-3 px-3 text-center bg-yellow-50/50 text-yellow-950">Target Fokus (Pcs)</th>
                  <th className="py-3 px-3 text-center bg-yellow-50/50 text-yellow-950">Realisasi Fokus (Pcs)</th>
                  <th className="py-3 px-2 text-center bg-yellow-50/50 text-yellow-950">% Capai Fokus</th>
                  <th className="py-3 px-3 text-center">Status Capai</th>
                  <th className="py-3 px-3">Catatan / Spesialisasi</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrainers.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada data trainer yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredTrainers.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                          <span>{item.trainerName}</span>
                          {item.isCustom && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Custom
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium">{item.areaCovered}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Region: {item.region}</div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-700">
                        {item.baSupervisedCount} BA
                      </td>

                      {/* Sell Out */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-950 bg-amber-50/20">
                        {formatRupiah(item.targetSellOut)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 bg-amber-50/20">
                        {formatRupiah(item.actualSellOut)}
                      </td>
                      <td className="py-3 px-2 text-center bg-amber-50/20">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                            item.achievementSellOutPct >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.achievementSellOutPct >= 80
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.achievementSellOutPct.toFixed(1)}%
                        </span>
                      </td>

                      {/* Fokus */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-yellow-950 bg-yellow-50/20">
                        {item.targetProdukFokusPcs} pcs
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-900 bg-yellow-50/20">
                        {item.actualProdukFokusPcs} pcs
                      </td>
                      <td className="py-3 px-2 text-center bg-yellow-50/20">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                            item.achievementProdukFokusPct >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.achievementProdukFokusPct >= 80
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.achievementProdukFokusPct.toFixed(1)}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            item.status === 'achieved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.status === 'on_track'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {item.status === 'achieved'
                            ? 'Target Capai'
                            : item.status === 'on_track'
                            ? 'On Track'
                            : 'Lagging'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[150px] truncate" title={item.notes}>
                        {item.notes || '-'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            setEditingTrainer(item);
                            setTrainerSellOutInput(item.targetSellOut);
                            setTrainerFocusInput(item.targetProdukFokusPcs);
                            setTrainerNotesInput(item.notes || '');
                          }}
                          className="px-2.5 py-1 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer font-bold flex items-center gap-1 mx-auto"
                        >
                          <Edit3 className="w-3 h-3 text-amber-700" />
                          <span>Ubah Target</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 5: EDIT TARGET TRAINER (SELL OUT & PRODUK FOKUS)                                    */}
      {/* ========================================================================================= */}
      {editingTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-amber-700 via-orange-800 to-amber-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-300" />
                  Edit Target Trainer ({selectedMonth === 'ALL' ? 'Semua Periode' : selectedMonth})
                </h3>
                <p className="text-xs text-amber-200 mt-0.5">
                  Trainer: <strong>{editingTrainer.trainerName}</strong> ({editingTrainer.areaCovered})
                </p>
              </div>
              <button
                onClick={() => setEditingTrainer(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTrainerTarget} className="p-5 space-y-4 text-xs">
              {/* Target Sell Out */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Sell Out Trainer (Rp)</label>
                <input
                  type="number"
                  step="1000000"
                  value={trainerSellOutInput}
                  onChange={(e) => setTrainerSellOutInput(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  Terbilang: {formatRupiah(trainerSellOutInput)}
                </span>
              </div>

              {/* Target Produk Fokus */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Produk Fokus Trainer (Pcs)</label>
                <input
                  type="number"
                  step="10"
                  value={trainerFocusInput}
                  onChange={(e) => setTrainerFocusInput(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  Target produk hero/fokus yang harus dicapai tim binaan
                </span>
              </div>

              {/* Catatan / Spesialisasi */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan / Wilayah Binaan</label>
                <input
                  type="text"
                  value={trainerNotesInput}
                  onChange={(e) => setTrainerNotesInput(e.target.value)}
                  placeholder="e.g. Trainer Area Pekanbaru & Dumai - Fokus barenbliss"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1 text-slate-700">
                <div className="flex justify-between font-mono">
                  <span>Realisasi Sell Out Terkini:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(editingTrainer.actualSellOut)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Proyeksi % Capai Sell Out:</span>
                  <span className="font-bold text-amber-800">
                    {((editingTrainer.actualSellOut / (trainerSellOutInput || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between font-mono pt-1 border-t border-amber-200/50">
                  <span>Realisasi Fokus Pcs Terkini:</span>
                  <span className="font-bold text-slate-900">{editingTrainer.actualProdukFokusPcs} pcs</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Proyeksi % Capai Fokus:</span>
                  <span className="font-bold text-amber-800">
                    {((editingTrainer.actualProdukFokusPcs / (trainerFocusInput || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrainer(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Target Trainer ({selectedMonth})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 1: EDIT TARGET AREA */}
      {/* ========================================================================================= */}
      {editingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-cyan-800 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-300" />
                  Edit Target Omzet Area
                </h3>
                <p className="text-xs text-cyan-200 mt-0.5">Area: {editingArea.coverArea} ({editingArea.region})</p>
              </div>
              <button
                onClick={() => setEditingArea(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAreaTarget} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Omzet Area (Rp)</label>
                <input
                  type="number"
                  step="1000000"
                  value={areaTargetInput}
                  onChange={(e) => setAreaTargetInput(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  required
                />
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  Terbilang: {formatRupiah(areaTargetInput)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Realisasi Penjualan:</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(editingArea.actualSellIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Proyeksi Capai:</span>
                  <span className="font-mono font-bold text-cyan-700">
                    {((editingArea.actualSellIn / (areaTargetInput || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingArea(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Target Area</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 2: EDIT TARGET SPV */}
      {/* ========================================================================================= */}
      {editingSpv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-300" />
                  Edit Target Tim Supervisor
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">Supervisor: {editingSpv.spvName}</p>
              </div>
              <button
                onClick={() => setEditingSpv(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpvTarget} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Tim SPV (Rp)</label>
                <input
                  type="number"
                  step="1000000"
                  value={spvTargetInput}
                  onChange={(e) => setSpvTargetInput(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  required
                />
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  Terbilang: {formatRupiah(spvTargetInput)}
                </span>
              </div>

              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Realisasi Tim SPV:</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(editingSpv.actualSellIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Proyeksi Capai:</span>
                  <span className="font-mono font-bold text-purple-700">
                    {((editingSpv.actualSellIn / (spvTargetInput || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSpv(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Target SPV</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 3: EDIT TARGET SALES */}
      {/* ========================================================================================= */}
      {editingSales && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-indigo-800 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-300" />
                  Edit Target Sell In Sales
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">{editingSales.salesName} • {editingSales.coverArea}</p>
              </div>
              <button
                onClick={() => setEditingSales(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalesTarget} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Sell In Sales (Rp)</label>
                <input
                  type="number"
                  step="1000000"
                  value={salesTargetInput}
                  onChange={(e) => setSalesTargetInput(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  Terbilang: {formatRupiah(salesTargetInput)}
                </span>
              </div>

              {/* Simulation card of 4% incentive */}
              {(() => {
                const projPct = (editingSales.actualSellIn / (salesTargetInput || 1)) * 100;
                const incPct = projPct >= 100 ? 4.0 : projPct >= 80 ? 0.2 : 0;
                const estInc = Math.round((incPct / 100) * editingSales.actualSellIn);

                return (
                  <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200 space-y-2 text-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-indigo-900">Proyeksi Capai:</span>
                      <span className="font-mono font-black text-sm text-indigo-950">
                        {projPct.toFixed(1)}% ({projPct >= 100 ? 'Memenuhi 4%' : projPct >= 80 ? '0,2%' : '0%'})
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>Skema Insentif:</span>
                      <span className="font-mono font-bold text-slate-900">{incPct}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-indigo-100">
                      <span className="font-bold text-emerald-800">Estimasi Insentif Diterima:</span>
                      <span className="font-mono font-black text-emerald-700 text-sm">
                        +{formatRupiah(estInc)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSales(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Target Sales</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 4: EDIT TARGET BA TOKO */}
      {/* ========================================================================================= */}
      {editingBa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-teal-800 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Store className="w-4 h-4 text-teal-300" />
                  Edit Target BA Toko &amp; Produk Fokus
                </h3>
                <p className="text-xs text-teal-200 mt-0.5">
                  {editingBa.baName} ({editingBa.baNumber}) • {editingBa.storeName}
                </p>
              </div>
              <button
                onClick={() => setEditingBa(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBaTarget} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Non-Lavojoy */}
                <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/30">
                  <label className="block text-teal-950 font-bold mb-1">Target Non-Lavojoy (Rp)</label>
                  <input
                    type="number"
                    step="1000000"
                    value={baNonLavojoyInput}
                    onChange={(e) => setBaNonLavojoyInput(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    {formatRupiah(baNonLavojoyInput)}
                  </span>
                </div>

                {/* Lavojoy */}
                <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/30">
                  <label className="block text-purple-950 font-bold mb-1">Target Lavojoy 4% (Rp)</label>
                  <input
                    type="number"
                    step="500000"
                    value={baLavojoyInput}
                    onChange={(e) => setBaLavojoyInput(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    {formatRupiah(baLavojoyInput)}
                  </span>
                </div>
              </div>

              {/* Produk Fokus Pcs */}
              <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-amber-950 font-black flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-600" />
                    Target Produk Fokus (Pcs)
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Insentif Rp 2rb / Denda Rp 1rb
                  </span>
                </div>
                <input
                  type="number"
                  step="1"
                  value={baFocusInput}
                  onChange={(e) => setBaFocusInput(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-black rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500"
                  required
                />
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  • Capai ≥ 80%: Insentif <strong>+Rp 2.000 / pcs</strong>
                  <br />• Capai 70-79%: <strong>AMAN (Rp 0)</strong>
                  <br />• Capai &lt; 70%: Denda <strong>-Rp 1.000 × Target ({baFocusInput} pcs) = -{formatRupiah(baFocusInput * 1000)}</strong>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBa(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md shadow-teal-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Target Toko</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 5: BATCH TARGET SETTING (ATUR MASSAL) */}
      {/* ========================================================================================= */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Atur Target Serentak (Batch Update)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">Terapkan nominal target seragam ke seluruh personil/wilayah</p>
              </div>
              <button
                onClick={() => setIsBatchOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyBatchTarget} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pilih Kategori Target</label>
                <select
                  value={batchTargetType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setBatchTargetType(val);
                    if (val === 'area') setBatchTargetValue(DEFAULT_AREA_TARGET);
                    if (val === 'spv') setBatchTargetValue(DEFAULT_SPV_TARGET);
                    if (val === 'sales') setBatchTargetValue(DEFAULT_SALES_TARGET);
                    if (val === 'ba_non') setBatchTargetValue(DEFAULT_BA_NON_LAVOJOY_TARGET);
                    if (val === 'ba_lav') setBatchTargetValue(DEFAULT_BA_LAVOJOY_TARGET);
                    if (val === 'ba_focus') setBatchTargetValue(DEFAULT_FOCUS_TARGET_PCS);
                    if (val === 'trainer_so') setBatchTargetValue(DEFAULT_TRAINER_SELL_OUT_TARGET);
                    if (val === 'trainer_focus') setBatchTargetValue(DEFAULT_TRAINER_FOCUS_TARGET_PCS);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                >
                  <option value="sales">Target Sell In Sales (Rp)</option>
                  <option value="area">Target Omzet Area (Rp)</option>
                  <option value="spv">Target Tim SPV (Rp)</option>
                  <option value="ba_non">Target BA Non-Lavojoy (Rp)</option>
                  <option value="ba_lav">Target BA Lavojoy (Rp)</option>
                  <option value="ba_focus">Target Produk Fokus BA (Pcs)</option>
                  <option value="trainer_so">Target Trainer Sell Out (Rp)</option>
                  <option value="trainer_focus">Target Trainer Produk Fokus (Pcs)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nominal / Kuantitas Target Baru {(batchTargetType === 'ba_focus' || batchTargetType === 'trainer_focus') ? '(Pcs)' : '(Rp)'}
                </label>
                <input
                  type="number"
                  step={(batchTargetType === 'ba_focus' || batchTargetType === 'trainer_focus') ? '1' : '1000000'}
                  value={batchTargetValue}
                  onChange={(e) => setBatchTargetValue(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-black rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  {(batchTargetType === 'ba_focus' || batchTargetType === 'trainer_focus')
                    ? `${batchTargetValue} unit pcs`
                    : formatRupiah(batchTargetValue)}
                </span>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Perhatian:</strong> Target serentak ini akan diterapkan langsung ke seluruh baris terpilih dan
                otomatis disimpan di LocalStorage serta memengaruhi modul Cost Area, KPI, dan P&amp;L.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBatchOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Terapkan ke Semua</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
