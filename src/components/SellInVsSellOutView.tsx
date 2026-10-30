import React, { useState, useMemo, useEffect } from 'react';
import {
  TransactionRecord,
  FilterState,
  SellInSellOutDimension,
  SellInSellOutItem,
} from '../types/dashboard';
import {
  calculateSellInVsSellOut,
  MONTH_NAMES_LIST,
  exportSellInVsSellOutToExcel,
} from '../services/sellInSellOutService';
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
} from 'lucide-react';

interface SellInVsSellOutViewProps {
  records: TransactionRecord[];
  filters: FilterState;
}

export const SellInVsSellOutView: React.FC<SellInVsSellOutViewProps> = ({
  records,
  filters,
}) => {
  // Dimension & Filter states
  const [activeDimension, setActiveDimension] = useState<SellInSellOutDimension>('store');
  const [selectedMonth, setSelectedMonth] = useState<string>('SEPTEMBER');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [onlyOver20, setOnlyOver20] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemModal, setSelectedItemModal] = useState<SellInSellOutItem | null>(null);

  // Sync with global Filter Terintegrasi
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

  // Available Areas
  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.COVER_AREA) set.add(r.COVER_AREA);
    });
    return Array.from(set).sort();
  }, [records]);

  // Calculate comparison data
  const { items, summary } = useMemo(() => {
    return calculateSellInVsSellOut(
      records,
      activeDimension,
      selectedMonth,
      selectedYear,
      selectedArea
    );
  }, [records, activeDimension, selectedMonth, selectedYear, selectedArea]);

  // Filter items by search query and onlyOver20 toggle
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (onlyOver20 && !item.isOver20Percent) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.secondaryInfo && item.secondaryInfo.toLowerCase().includes(q)) ||
        (item.area && item.area.toLowerCase().includes(q))
      );
    });
  }, [items, onlyOver20, searchQuery]);

  // Dimension metadata labels
  const dimensionMeta: Record<
    SellInSellOutDimension,
    { label: string; icon: React.ReactNode; color: string; desc: string }
  > = {
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
    sales: {
      label: 'Sales Personil',
      icon: <Users className="w-4 h-4" />,
      color: 'blue',
      desc: 'Realisasi taking order (Sell In) vs efektivitas serapan toko binaan',
    },
    trainer: {
      label: 'Trainer',
      icon: <GraduationCap className="w-4 h-4" />,
      color: 'purple',
      desc: 'Stok masuk area training vs hasil penjualan sell out yang dilatih',
    },
    spv: {
      label: 'Supervisor (SPV)',
      icon: <Building2 className="w-4 h-4" />,
      color: 'indigo',
      desc: 'Konsolidasi aliran stok Sell In vs Sell Out di bawah supervisi SPV',
    },
  };

  const currentMeta = dimensionMeta[activeDimension];

  // Handle Export Excel
  const handleExport = () => {
    exportSellInVsSellOutToExcel(
      filteredItems,
      summary,
      currentMeta.label,
      selectedMonth,
      selectedYear
    );
  };

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* 1. Header Toolbar */}
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
                  Selisih Nilai &amp; Deteksi &gt;20%
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Evaluasi selisih nilai barang (value gap), persentase serapan, dan rincian penumpukan stok atau risiko habis barang
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
              title="Download File Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
              title="Cetak Laporan"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Dimension Selector Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto">
            {(['store', 'ba', 'sales', 'trainer', 'spv'] as SellInSellOutDimension[]).map((dim) => {
              const meta = dimensionMeta[dim];
              const isSelected = activeDimension === dim;
              return (
                <button
                  key={dim}
                  onClick={() => setActiveDimension(dim)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {meta.icon}
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Dropdowns (Month, Year, Area, Threshold) */}
          <div className="flex items-center gap-2.5 flex-wrap text-xs">
            {/* Month Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-600">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
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

      {/* 2. Executive KPI Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Sell In */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Sell In (Distributor)
          </span>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900 font-mono block">
              {formatRupiah(summary.totalSellIn, true)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Total pesanan masuk ke outlet
            </span>
          </div>
        </div>

        {/* Card 2: Total Sell Out */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Sell Out (Konsumen)
          </span>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900 font-mono block">
              {formatRupiah(summary.totalSellOut, true)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Total barang terjual di kasir
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
                ? 'Surplus stok toko (Sell In > Sell Out)'
                : 'Defisit stok (Sell Out > Sell In)'}
            </span>
          </div>
        </div>

        {/* Card 4: Rasio Serapan (Sell-Through %) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Rata-rata Rasio Serapan
          </span>
          <div className="mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-slate-900">
                {summary.overallSellThroughPercent}%
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  summary.overallSellThroughPercent >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {summary.avgGapPercent >= 0 ? `+${summary.avgGapPercent}%` : `${summary.avgGapPercent}%`}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Tingkat perputaran produk
            </span>
          </div>
        </div>

        {/* Card 5: Anomali Selisih > 20% */}
        <div
          className={`rounded-2xl border p-4 shadow-xs transition-all ${
            summary.over20Count > 0
              ? 'bg-gradient-to-br from-rose-50/60 to-amber-50/60 border-rose-200'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
              Peringatan Selisih &gt; 20%
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-700 font-mono block">
              {summary.over20Count}{' '}
              <span className="text-xs font-semibold text-slate-600">
                / {summary.totalEntitiesCount} {currentMeta.label}
              </span>
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-slate-600">
              <span className="text-amber-800">
                📦 {summary.overstockCount} Overstock
              </span>
              <span>•</span>
              <span className="text-rose-800">
                🚨 {summary.stockoutRiskCount} Rawan OOS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Anomaly Summary Banner if there are >20% discrepancies */}
      {summary.over20Count > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-extrabold text-sm block">
              Perhatian: Ditemukan {summary.over20Count} entitas {currentMeta.label} dengan perbedaan Sell In vs Sell Out di atas 20%!
            </span>
            <p className="mt-1 leading-relaxed">
              Kondisi perbedaan &gt; 20% menandakan ketidakseimbangan aliran barang: Toko menimbun stok (overstocking) yang berpotensi macet, atau sebaliknya toko kehabisan stok (understocking/OOS) saat permintaan konsumen tinggi. Baris yang memiliki selisih &gt; 20% telah ditandai dengan badge khusus dan rekomendasi tindakan taktis di bawah ini.
            </p>
          </div>
        </div>
      )}

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

          {/* Search bar */}
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
        </div>

        {/* 5. Main Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3">Nama {currentMeta.label}</th>
                <th className="py-3 px-3">Keterangan / Area</th>
                <th className="py-3 px-3 text-right">Value Sell In (Rp)</th>
                <th className="py-3 px-3 text-right">Value Sell Out (Rp)</th>
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
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                      {formatRupiah(item.sellInValue, true)}
                    </td>

                    {/* Sell Out */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(item.sellOutValue, true)}
                    </td>

                    {/* Gap Value (Selisih Nilai) */}
                    <td className="py-3 px-3 text-right font-mono">
                      <span
                        className={`font-black ${
                          item.gapValue > 0
                            ? 'text-indigo-700'
                            : item.gapValue < 0
                            ? 'text-rose-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {item.gapValue > 0 ? '+' : ''}
                        {formatRupiah(item.gapValue, true)}
                      </span>
                    </td>

                    {/* Gap Percent (Persen Perbedaan) */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-black text-[11px] inline-flex items-center gap-0.5 ${
                          isOver20
                            ? item.statusType === 'overstock'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300 ring-1 ring-rose-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.gapPercent > 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-amber-600" />
                        ) : item.gapPercent < 0 ? (
                          <ArrowDownRight className="w-3 h-3 text-rose-600" />
                        ) : null}
                        {item.gapPercent >= 0 ? `+${item.gapPercent}%` : `${item.gapPercent}%`}
                      </span>
                    </td>

                    {/* Sell-Through Percent */}
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {item.sellThroughPercent}%
                    </td>

                    {/* Status & Warning Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-block ${
                          item.statusType === 'overstock'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : item.statusType === 'stockout_risk'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                    </td>

                    {/* Action Button: Rincian Modal */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedItemModal(item)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 mx-auto ${
                          isOver20
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                            : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200/80'
                        }`}
                      >
                        <span>Rincikan</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    Tidak ada data perbandingan yang sesuai dengan filter atau kata kunci pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Drill-down Modal (Rincian Selisih & Rekomendasi Tindakan) */}
      {selectedItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Metrics Box */}
            <div className="mt-4 grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Sell In</span>
                <span className="text-sm font-black font-mono text-slate-900 mt-0.5 block">
                  {formatRupiah(selectedItemModal.sellInValue, true)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Sell Out</span>
                <span className="text-sm font-black font-mono text-slate-900 mt-0.5 block">
                  {formatRupiah(selectedItemModal.sellOutValue, true)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Selisih (Gap)</span>
                <span
                  className={`text-sm font-black font-mono mt-0.5 block ${
                    selectedItemModal.gapValue >= 0 ? 'text-indigo-700' : 'text-rose-600'
                  }`}
                >
                  {selectedItemModal.gapValue >= 0 ? '+' : ''}
                  {formatRupiah(selectedItemModal.gapValue, true)}
                </span>
              </div>
            </div>

            {/* Status Alert Banner */}
            <div
              className={`mt-4 p-3.5 rounded-xl border flex items-start gap-2.5 ${
                selectedItemModal.statusType === 'overstock'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : selectedItemModal.statusType === 'stockout_risk'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-extrabold text-sm block">
                  {selectedItemModal.statusLabel}
                </span>
                <span className="font-medium mt-0.5 block">
                  Rasio Serapan: <strong>{selectedItemModal.sellThroughPercent}%</strong> • Selisih Relatif:{' '}
                  <strong>{selectedItemModal.gapPercent}%</strong>
                </span>
              </div>
            </div>

            {/* Root Cause Analysis */}
            <div className="mt-5 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-600" />
                Rincian Analisis Akar Masalah (Root Cause):
              </h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {selectedItemModal.rootCauseAnalysis}
              </div>
            </div>

            {/* Tactical Recommended Action */}
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Rencana Tindakan Taktis (Action Plan):
              </h4>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed whitespace-pre-line font-medium">
                {selectedItemModal.recommendedAction}
              </div>
            </div>

            {/* Modal Footer */}
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
    </div>
  );
};
