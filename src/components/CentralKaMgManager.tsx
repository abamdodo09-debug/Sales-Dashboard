import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Edit2,
  Save,
  RotateCcw,
  Calendar,
  Building2,
  Store,
  Layers,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Percent,
  X,
} from 'lucide-react';
import { TransactionRecord, DashboardFilters } from '../types/dashboard';
import {
  loadAllMonthlyConfigs,
  saveSpvMonthConfig,
  resetSpvMonthConfig,
  loadSpvConsolidatedConfig,
  MONTHLY_DEFAULTS_SPV,
  OFFICIAL_SPV_WIDODO,
} from '../services/spvSellInSellOutService';
import { saveKaMgSalesOverride } from '../services/masterStoreService';
import { formatRupiah, formatPercent } from '../utils/analytics';
import * as XLSX from 'xlsx';

interface CentralKaMgManagerProps {
  records: TransactionRecord[];
  filters: DashboardFilters;
  onDataUpdated?: () => void;
}

export const CentralKaMgManager: React.FC<CentralKaMgManagerProps> = ({
  records,
  filters,
  onDataUpdated,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return filters.BULAN && filters.BULAN !== 'ALL' ? filters.BULAN.toUpperCase() : 'OKTOBER';
  });
  const [selectedYear] = useState<number>(2026);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal Edit Single Month
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [inputRegularSellIn, setInputRegularSellIn] = useState<number>(0);
  const [inputKaSellIn, setInputKaSellIn] = useState<number>(0);
  const [inputDazzleMeMgSellIn, setInputDazzleMeMgSellIn] = useState<number>(0);
  const [inputSellOut, setInputSellOut] = useState<number>(0);
  const [inputTarget, setInputTarget] = useState<number>(0);
  const [inputNotes, setInputNotes] = useState<string>('');

  // Notification Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const monthsList = [
    { key: 'JANUARI', label: 'Januari', short: 'Jan' },
    { key: 'FEBRUARI', label: 'Februari', short: 'Feb' },
    { key: 'MARET', label: 'Maret', short: 'Mar' },
    { key: 'APRIL', label: 'April', short: 'Apr' },
    { key: 'MEI', label: 'Mei', short: 'Mei' },
    { key: 'JUNI', label: 'Juni', short: 'Jun' },
    { key: 'JULI', label: 'Juli', short: 'Jul' },
    { key: 'AGUSTUS', label: 'Agustus', short: 'Agu' },
    { key: 'SEPTEMBER', label: 'September', short: 'Sep' },
    { key: 'OKTOBER', label: 'Oktober', short: 'Okt' },
    { key: 'NOVEMBER', label: 'November', short: 'Nov' },
    { key: 'DESEMBER', label: 'Desember', short: 'Des' },
  ];

  // 12-Month Consolidated History Data
  const historyData = useMemo(() => {
    return monthsList.map((m) => {
      const cfg = loadSpvConsolidatedConfig(records, m.key, selectedYear);
      return {
        key: m.key,
        label: m.label,
        short: m.short,
        ...cfg,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, selectedYear, refreshKey]);

  // Totals for all 12 months
  const yearlyTotals = useMemo(() => {
    const totalReguler = historyData.reduce((acc, h) => acc + h.spvRegularSellIn, 0);
    const totalKa = historyData.reduce((acc, h) => acc + h.kaSellInValue, 0);
    const totalMg = historyData.reduce((acc, h) => acc + h.dazzleMeMgSellInValue, 0);
    const totalSellIn = totalReguler + totalKa + totalMg;
    const totalSellOut = historyData.reduce((acc, h) => acc + h.totalSellOut, 0);
    const totalTarget = historyData.reduce((acc, h) => acc + h.target, 0);
    const avgAchievement = totalTarget > 0 ? (totalSellIn / totalTarget) * 100 : 0;

    return {
      totalReguler,
      totalKa,
      totalMg,
      totalSellIn,
      totalSellOut,
      totalTarget,
      avgAchievement,
    };
  }, [historyData]);

  // Selected Month's current active record
  const currentMonthData = useMemo(() => {
    if (selectedMonth === 'ALL') {
      return {
        key: 'ALL',
        label: 'Semua Bulan (YTD 2026)',
        short: 'YTD',
        spvRegularSellIn: yearlyTotals.totalReguler,
        kaSellInValue: yearlyTotals.totalKa,
        dazzleMeMgSellInValue: yearlyTotals.totalMg,
        totalSellIn: yearlyTotals.totalSellIn,
        totalSellOut: yearlyTotals.totalSellOut,
        target: yearlyTotals.totalTarget,
        achievementPercent: yearlyTotals.avgAchievement,
        isManual: false,
        notes: 'Agregasi seluruh bulan Januari s/d Desember 2026',
      };
    }
    const found = historyData.find((h) => h.key === selectedMonth);
    return found || historyData[9]; // default Oktober
  }, [historyData, selectedMonth, yearlyTotals]);

  // Open Edit Modal for a specific month
  const handleOpenEdit = (monthKey: string) => {
    const m = monthKey === 'ALL' ? 'OKTOBER' : monthKey;
    const cfg = loadSpvConsolidatedConfig(records, m, selectedYear);
    setEditingMonth(m);
    setInputRegularSellIn(cfg.spvRegularSellIn);
    setInputKaSellIn(cfg.kaSellInValue);
    setInputDazzleMeMgSellIn(cfg.dazzleMeMgSellInValue);
    setInputSellOut(cfg.totalSellOut);
    setInputTarget(cfg.target);
    setInputNotes(cfg.notes || '');
  };

  // Save Single Month Edits
  const handleSaveMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMonth) return;

    const totalSellIn = inputRegularSellIn + inputKaSellIn + inputDazzleMeMgSellIn;

    // 1. Save to SPV Consolidated Storage (controls all area, SPV Widodo, and chart achievements)
    saveSpvMonthConfig({
      periodMonth: editingMonth,
      periodYear: selectedYear,
      isManual: true,
      spvName: OFFICIAL_SPV_WIDODO.spvName,
      region: OFFICIAL_SPV_WIDODO.region,
      salesTeam: OFFICIAL_SPV_WIDODO.salesTeam,
      spvRegularSellIn: inputRegularSellIn,
      kaSellInValue: inputKaSellIn,
      dazzleMeMgSellInValue: inputDazzleMeMgSellIn,
      totalSellIn,
      totalSellOut: inputSellOut,
      target: inputTarget,
      notes: inputNotes || `Edit manual pencapaian Sell In KA & DAZZLE ME MG bulan ${editingMonth}`,
    });

    // 2. Also sync to KA/MG sales override so StoreBaContributionView follows immediately
    saveKaMgSalesOverride({
      isManual: true,
      spvSalesValue: inputRegularSellIn,
      kaSalesValue: inputKaSellIn,
      mgSalesValue: inputDazzleMeMgSellIn,
      dazzleMeMgSalesValue: inputDazzleMeMgSellIn,
      notes: inputNotes || `Sinkronisasi terpusat bulan ${editingMonth}`,
    });

    setEditingMonth(null);
    setRefreshKey((k) => k + 1);
    if (onDataUpdated) onDataUpdated();

    showNotification(
      `Pencapaian ${editingMonth} berhasil diperbarui: KA ${formatRupiah(inputKaSellIn, true)} • DAZZLE ME MG ${formatRupiah(inputDazzleMeMgSellIn, true)} • Total ${formatRupiah(totalSellIn, true)}`
    );
  };

  // Reset a single month to automatic defaults
  const handleResetMonth = (monthKey: string) => {
    if (confirm(`Kembalikan data pencapaian bulan ${monthKey} ke hitungan otomatis data sheet?`)) {
      resetSpvMonthConfig(monthKey, selectedYear);
      setRefreshKey((k) => k + 1);
      if (onDataUpdated) onDataUpdated();
      showNotification(`Bulan ${monthKey} berhasil dikembalikan ke kalkulasi otomatis.`);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = historyData.map((h, idx) => ({
      No: idx + 1,
      Bulan: h.label,
      'Sell In Reguler (6 Sales)': h.spvRegularSellIn,
      'Sell In KA (Modern Trade)': h.kaSellInValue,
      'Sell In DAZZLE ME MG (General Trade)': h.dazzleMeMgSellInValue,
      'Total Sell In Area & SPV WIDODO': h.totalSellIn,
      'Total Sell Out (Konsumen)': h.totalSellOut,
      Target: h.target,
      '% Pencapaian': `${h.achievementPercent.toFixed(1)}%`,
      Status: h.isManual ? 'Manual Edit' : 'Otomatis Sheet',
      Catatan: h.notes || '',
    }));

    // Add totals row
    rows.push({
      No: 13,
      Bulan: 'TOTAL AKUMULASI TAHUNAN (YTD)',
      'Sell In Reguler (6 Sales)': yearlyTotals.totalReguler,
      'Sell In KA (Modern Trade)': yearlyTotals.totalKa,
      'Sell In DAZZLE ME MG (General Trade)': yearlyTotals.totalMg,
      'Total Sell In Area & SPV WIDODO': yearlyTotals.totalSellIn,
      'Total Sell Out (Konsumen)': yearlyTotals.totalSellOut,
      Target: yearlyTotals.totalTarget,
      '% Pencapaian': `${yearlyTotals.avgAchievement.toFixed(1)}%`,
      Status: 'YTD 12 Bulan',
      Catatan: 'Seluruh riwayat Januari s/d Desember 2026',
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Sell In KA & MG');
    XLSX.writeFile(wb, `SalesPro_Riwayat_SellIn_KA_MG_2026_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showNotification('File Excel riwayat pencapaian berhasil diunduh!');
  };

  return (
    <div className="space-y-6 mb-8 animate-in fade-in duration-200">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                  Pusat Edit Manual Terpusat
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Kelola &amp; Riwayat Sell In KA &amp; DAZZLE ME MG (Januari – Desember)
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Satu tempat kontrol terintegrasi untuk menetapkan dan mengubah pencapaian <strong>Sell In KA</strong> dan{' '}
              <strong>Sell In DAZZLE ME MG</strong>. Seluruh menu dashboard (Pencapaian Area, SPV WIDODO, Indikator Pertumbuhan, dan Kontribusi Gerai)
              akan <strong>otomatis sinkron dan mengikuti perubahan</strong> dari modul ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Edit Current Selected Month */}
            <button
              onClick={() => handleOpenEdit(selectedMonth === 'ALL' ? 'OKTOBER' : selectedMonth)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Pencapaian ({selectedMonth})</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              title="Unduh seluruh riwayat Januari s/d Desember ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export History (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards for Selected View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-indigo-900/60">
          {/* Card 1: Sell In KA */}
          <div className="p-4 rounded-2xl bg-white/5 border border-purple-400/20 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 mb-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                Pencapaian Sell In KA
              </span>
              <span className="px-2 py-0.2 rounded font-mono text-[10px] bg-purple-500/20 text-purple-300">
                MODERN TRADE
              </span>
            </div>
            <div className="text-xl font-black font-mono text-white tabular-nums">
              {formatRupiah(currentMonthData.kaSellInValue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Porsi: <strong>{((currentMonthData.kaSellInValue / (currentMonthData.totalSellIn || 1)) * 100).toFixed(1)}%</strong> dari total
            </div>
          </div>

          {/* Card 2: Sell In DAZZLE ME MG */}
          <div className="p-4 rounded-2xl bg-white/5 border border-emerald-400/20 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 mb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Pencapaian Sell In DAZZLE ME MG
              </span>
              <span className="px-2 py-0.2 rounded font-mono text-[10px] bg-emerald-500/20 text-emerald-300">
                GENERAL TRADE
              </span>
            </div>
            <div className="text-xl font-black font-mono text-white tabular-nums">
              {formatRupiah(currentMonthData.dazzleMeMgSellInValue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Porsi: <strong>{((currentMonthData.dazzleMeMgSellInValue / (currentMonthData.totalSellIn || 1)) * 100).toFixed(1)}%</strong> dari total
            </div>
          </div>

          {/* Card 3: Sell In Reguler (6 Sales) */}
          <div className="p-4 rounded-2xl bg-white/5 border border-cyan-400/20 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300 mb-1">
              <span className="flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-cyan-400" />
                Sell In Reguler (6 Sales)
              </span>
              <span className="px-2 py-0.2 rounded font-mono text-[10px] bg-cyan-500/20 text-cyan-300">
                DISTRIBUTOR
              </span>
            </div>
            <div className="text-xl font-black font-mono text-white tabular-nums">
              {formatRupiah(currentMonthData.spvRegularSellIn)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Taking order 6 sales tim binaan SPV WIDODO
            </div>
          </div>

          {/* Card 4: Total Konsolidasi Sell In SPV WIDODO & Area */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/40 via-purple-600/30 to-teal-600/30 border border-cyan-400/40 backdrop-blur-xs shadow-md">
            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-200 mb-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                Total Pencapaian Sell In SPV &amp; Area
              </span>
              <span className="px-2 py-0.2 rounded font-mono text-[10px] bg-cyan-400/20 text-cyan-200 font-extrabold">
                {currentMonthData.achievementPercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-cyan-300 tabular-nums">
              {formatRupiah(currentMonthData.totalSellIn)}
            </div>
            <div className="text-[11px] text-slate-300 mt-1 font-mono flex items-center justify-between">
              <span>Target: {formatRupiah(currentMonthData.target, true)}</span>
              <span className="text-cyan-300 font-bold">{selectedMonth}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Month Filter Selector Pills */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
              Pilih Bulan untuk Analisa &amp; Pengaturan:
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 font-medium">
            Tahun Evaluasi: <strong>2026</strong> • Total 12 Bulan Aktif
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-13 gap-1.5 mt-3">
          <button
            onClick={() => setSelectedMonth('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedMonth === 'ALL'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Semua (YTD)
          </button>
          {monthsList.map((m) => {
            const isSelected = selectedMonth === m.key;
            const data = historyData.find((h) => h.key === m.key);
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMonth(m.key)}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <div className="truncate">{m.short}</div>
                {data && (
                  <div
                    className={`text-[9px] font-mono mt-0.5 truncate ${
                      isSelected ? 'text-cyan-100' : 'text-slate-500'
                    }`}
                  >
                    {formatRupiah(data.totalSellIn, true)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 12-Month Historical Bar Graph */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Grafik Komparasi Riwayat Sell In 12 Bulan (Januari – Desember 2026)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Komposisi berjenjang: Sell In Reguler (Biru), Sell In KA (Ungu), dan Sell In DAZZLE ME MG (Hijau)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-cyan-500" /> Reguler 6 Sales
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-purple-500" /> Sell In KA
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" /> DAZZLE ME MG
            </span>
          </div>
        </div>

        {/* Bar Graphic Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 pt-2">
          {historyData.map((h) => {
            const isSelected = selectedMonth === h.key;
            const maxVal = 1000000000; // 1M ref
            const regHeight = Math.max(8, Math.round((h.spvRegularSellIn / maxVal) * 90));
            const kaHeight = Math.max(6, Math.round((h.kaSellInValue / maxVal) * 90));
            const mgHeight = Math.max(6, Math.round((h.dazzleMeMgSellInValue / maxVal) * 90));

            return (
              <div
                key={h.key}
                onClick={() => setSelectedMonth(h.key)}
                className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-400 shadow-md ring-2 ring-indigo-400/40 -translate-y-1'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Total Sell In Badge */}
                <span className="text-[10px] font-mono font-bold text-slate-700 truncate w-full text-center">
                  {formatRupiah(h.totalSellIn, true)}
                </span>

                {/* Stacked Vertical Bars */}
                <div className="h-32 w-full flex items-end justify-center gap-1 px-1 py-1 bg-slate-100/70 rounded-lg my-2">
                  <div
                    title={`Reguler: ${formatRupiah(h.spvRegularSellIn)}`}
                    style={{ height: `${regHeight}px` }}
                    className="w-2.5 sm:w-3 bg-cyan-500 rounded-t-xs"
                  />
                  <div
                    title={`KA: ${formatRupiah(h.kaSellInValue)}`}
                    style={{ height: `${kaHeight}px` }}
                    className="w-2.5 sm:w-3 bg-purple-500 rounded-t-xs"
                  />
                  <div
                    title={`DAZZLE ME MG: ${formatRupiah(h.dazzleMeMgSellInValue)}`}
                    style={{ height: `${mgHeight}px` }}
                    className="w-2.5 sm:w-3 bg-emerald-500 rounded-t-xs"
                  />
                </div>

                {/* Ach % */}
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    h.achievementPercent >= 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {h.achievementPercent.toFixed(1)}%
                </span>

                {/* Month Name */}
                <span
                  className={`text-xs font-black uppercase mt-1 ${
                    isSelected ? 'text-indigo-700 font-extrabold' : 'text-slate-800'
                  }`}
                >
                  {h.short}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12-Month Historical Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Tabel Riwayat Pencapaian Sell In (Januari s/d Desember 2026)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik tombol &quot;Edit Nilai&quot; pada baris bulan mana pun untuk memperbarui nominal Sell In KA &amp; DAZZLE ME MG
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            Area Riau • SPV Widodo
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Bulan</th>
                <th className="py-3 px-3 text-right bg-cyan-50/50 text-cyan-950 font-bold">Sell In Reguler (6 Sales)</th>
                <th className="py-3 px-3 text-right bg-purple-50/50 text-purple-950 font-bold">Sell In KA (Modern Trade)</th>
                <th className="py-3 px-3 text-right bg-emerald-50/50 text-emerald-950 font-bold">Sell In DAZZLE ME MG</th>
                <th className="py-3 px-3 text-right bg-indigo-50/60 text-indigo-950 font-black">Total Sell In Area &amp; SPV</th>
                <th className="py-3 px-3 text-right">Sell Out (Konsumen)</th>
                <th className="py-3 px-3 text-right">Target</th>
                <th className="py-3 px-3 text-center">% Capai</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyData.map((row, idx) => {
                const isSelected = selectedMonth === row.key;
                return (
                  <tr
                    key={row.key}
                    className={`hover:bg-indigo-50/20 transition-colors ${
                      isSelected ? 'bg-indigo-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{row.label}</span>
                        {row.isManual && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            Custom
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Reguler */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-cyan-900 bg-cyan-50/20">
                      {formatRupiah(row.spvRegularSellIn)}
                    </td>

                    {/* KA */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-purple-900 bg-purple-50/20">
                      {formatRupiah(row.kaSellInValue)}
                    </td>

                    {/* MG */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-900 bg-emerald-50/20">
                      {formatRupiah(row.dazzleMeMgSellInValue)}
                    </td>

                    {/* Total Konsolidasi */}
                    <td className="py-3 px-3 text-right font-mono font-black text-indigo-950 bg-indigo-50/30">
                      {formatRupiah(row.totalSellIn)}
                    </td>

                    {/* Sell Out */}
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {formatRupiah(row.totalSellOut)}
                    </td>

                    {/* Target */}
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {formatRupiah(row.target)}
                    </td>

                    {/* % Capai */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                          row.achievementPercent >= 100
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {row.achievementPercent.toFixed(1)}%
                      </span>
                    </td>

                    {/* Status Mode */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          row.isManual
                            ? 'bg-purple-100 text-purple-800 font-bold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.isManual ? 'Manual Edit' : 'Auto Sheet'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(row.key)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title={`Edit pencapaian bulan ${row.label}`}
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Nilai</span>
                        </button>
                        {row.isManual && (
                          <button
                            onClick={() => handleResetMonth(row.key)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                            title={`Reset ${row.label} ke otomatis`}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Row Footer */}
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-900 text-xs">
                <td colSpan={2} className="py-3.5 px-3 uppercase tracking-wider">
                  Total Akumulasi Tahunan (12 Bulan 2026)
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-cyan-950">
                  {formatRupiah(yearlyTotals.totalReguler)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-purple-950">
                  {formatRupiah(yearlyTotals.totalKa)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-emerald-950">
                  {formatRupiah(yearlyTotals.totalMg)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-indigo-950 text-sm">
                  {formatRupiah(yearlyTotals.totalSellIn)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono">
                  {formatRupiah(yearlyTotals.totalSellOut)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono">
                  {formatRupiah(yearlyTotals.totalTarget)}
                </td>
                <td className="py-3.5 px-3 text-center font-mono text-emerald-800">
                  {yearlyTotals.avgAchievement.toFixed(1)}%
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Konsolidasi YTD
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL EDIT SINGLE MONTH PENCAPAIAN SELL IN KA & MG */}
      {editingMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                  Satu Tempat Edit Terintegrasi
                </span>
                <h3 className="text-base font-extrabold flex items-center gap-2 mt-0.5">
                  <Edit2 className="w-4 h-4 text-cyan-300" />
                  Edit Pencapaian Sell In Bulan {editingMonth} 2026
                </h3>
              </div>
              <button
                onClick={() => setEditingMonth(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMonth} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed">
                💡 <strong>Catatan Penting:</strong> Perubahan nominal di sini langsung terhubung ke seluruh ringkasan:
                <strong> Pencapaian Sell In SPV WIDODO, Pencapaian Sell In Area, Indikator Growth, dan Analisa Kontribusi Gerai</strong>.
              </div>

              {/* 1. Sell In KA */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40">
                <label className="block text-purple-950 font-bold mb-1">
                  1. Pencapaian Sell In KA (Modern Trade) - Format IDR
                </label>
                <input
                  type="number"
                  step="any"
                  value={inputKaSellIn}
                  onChange={(e) => setInputKaSellIn(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-purple-300 bg-white focus:ring-2 focus:ring-purple-500"
                  required
                />
                <span className="text-[11px] text-purple-800 font-mono mt-1 block">
                  Terbilang: {formatRupiah(inputKaSellIn)}
                </span>
              </div>

              {/* 2. Sell In DAZZLE ME MG */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <label className="block text-emerald-950 font-bold mb-1">
                  2. Pencapaian Sell In DAZZLE ME MG (General Trade) - Format IDR
                </label>
                <input
                  type="number"
                  step="any"
                  value={inputDazzleMeMgSellIn}
                  onChange={(e) => setInputDazzleMeMgSellIn(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[11px] text-emerald-800 font-mono mt-1 block">
                  Terbilang: {formatRupiah(inputDazzleMeMgSellIn)}
                </span>
              </div>

              {/* 3. Sell In Reguler (6 Sales) */}
              <div className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/40">
                <label className="block text-cyan-950 font-bold mb-1">
                  3. Sell In Reguler (Taking Order Tim 6 Sales) - Format IDR
                </label>
                <input
                  type="number"
                  step="any"
                  value={inputRegularSellIn}
                  onChange={(e) => setInputRegularSellIn(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-cyan-300 bg-white focus:ring-2 focus:ring-cyan-500"
                  required
                />
                <span className="text-[11px] text-cyan-800 font-mono mt-1 block">
                  Terbilang: {formatRupiah(inputRegularSellIn)}
                </span>
              </div>

              {/* Live Preview Total Calculation */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>TOTAL PENCAPAIAN SELL IN AREA &amp; SPV:</span>
                  <span className="text-cyan-300 font-mono">
                    {inputTarget > 0 ? (( (inputRegularSellIn + inputKaSellIn + inputDazzleMeMgSellIn) / inputTarget) * 100).toFixed(1) : 0}% Target
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-cyan-300">
                  {formatRupiah(inputRegularSellIn + inputKaSellIn + inputDazzleMeMgSellIn)}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Formula: {formatRupiah(inputRegularSellIn, true)} (Reguler) + {formatRupiah(inputKaSellIn, true)} (KA) + {formatRupiah(inputDazzleMeMgSellIn, true)} (DAZZLE ME MG)
                </p>
              </div>

              {/* Target & Sell Out */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Sell In Bulan Ini (Rp)</label>
                  <input
                    type="number"
                    step="any"
                    value={inputTarget}
                    onChange={(e) => setInputTarget(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    {formatRupiah(inputTarget)}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Realisasi Sell Out Konsumen (Rp)</label>
                  <input
                    type="number"
                    step="any"
                    value={inputSellOut}
                    onChange={(e) => setInputSellOut(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    {formatRupiah(inputSellOut)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan / Keterangan Edit</label>
                <input
                  type="text"
                  value={inputNotes}
                  onChange={(e) => setInputNotes(e.target.value)}
                  placeholder="e.g. Penyesuaian closing faktur KA & Dazzle Me MG"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMonth(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan &amp; Sinkronkan ke Semua Menu ({editingMonth})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
