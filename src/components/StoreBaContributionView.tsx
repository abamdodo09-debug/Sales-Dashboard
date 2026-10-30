import React, { useState, useMemo, useEffect } from 'react';
import {
  TransactionRecord,
  FilterState,
  StoreBaContributionItem,
} from '../types/dashboard';
import {
  calculateStoreBaContribution,
  exportStoreBaContributionToExcel,
} from '../services/storeBaContributionService';
import { MONTH_NAMES_LIST } from '../services/sellInSellOutService';
import { formatRupiah, formatPercent } from '../utils/analytics';
import {
  Store,
  Sparkles,
  TrendingUp,
  Award,
  Users,
  Building2,
  Calendar,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  X,
  Target,
  ArrowUpRight,
  Layers,
  Zap,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface StoreBaContributionViewProps {
  records: TransactionRecord[];
  filters: FilterState;
}

type StoreFilterType = 'all' | 'ba_only' | 'non_ba_only';

export const StoreBaContributionView: React.FC<StoreBaContributionViewProps> = ({
  records,
  filters,
}) => {
  // State for filters
  const [selectedMonth, setSelectedMonth] = useState<string>('SEPTEMBER');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [storeFilterType, setStoreFilterType] = useState<StoreFilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStoreModal, setSelectedStoreModal] = useState<StoreBaContributionItem | null>(null);

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

  // Available Areas from records
  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.COVER_AREA) set.add(r.COVER_AREA);
    });
    return Array.from(set).sort();
  }, [records]);

  // Compute contribution analytics
  const { stores, summary } = useMemo(() => {
    return calculateStoreBaContribution(
      records,
      selectedMonth,
      selectedYear,
      selectedArea
    );
  }, [records, selectedMonth, selectedYear, selectedArea]);

  // Filter stores by tab & search query
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      if (storeFilterType === 'ba_only' && !s.hasBa) return false;
      if (storeFilterType === 'non_ba_only' && s.hasBa) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.storeName.toLowerCase().includes(q) ||
        s.baName.toLowerCase().includes(q) ||
        s.salesName.toLowerCase().includes(q) ||
        s.coverArea.toLowerCase().includes(q) ||
        s.spvName.toLowerCase().includes(q)
      );
    });
  }, [stores, storeFilterType, searchQuery]);

  // Handle Excel Export
  const handleExport = () => {
    exportStoreBaContributionToExcel(
      filteredStores,
      summary,
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Analisa Kontribusi Toko BA vs Non-BA
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-800 border border-pink-200">
                  Hitung Kontribusi &amp; Jumlah Toko
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Perbandingan porsi omset penjualan, produktivitas per gerai, dan penetrasi produk fokus antara Toko dengan BA vs Toko Tanpa BA
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

        {/* Filter Controls Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Store Type Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto">
            {[
              { id: 'all' as StoreFilterType, label: 'Semua Toko', count: summary.totalStoresCount },
              { id: 'ba_only' as StoreFilterType, label: '💄 Toko dengan BA', count: summary.tokoBaCount },
              { id: 'non_ba_only' as StoreFilterType, label: '🏪 Toko Non-BA', count: summary.tokoNonBaCount },
            ].map((tab) => {
              const isSelected = storeFilterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStoreFilterType(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Dropdown Filters (Month, Year, Area) */}
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
          </div>
        </div>
      </div>

      {/* 2. Head-to-Head Comparison Card: Toko BA vs Toko Non-BA */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              Komparasi Head-to-Head: Toko BA vs Toko Non-BA
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Periode Evaluasi: {selectedMonth} {selectedYear} • Total {summary.totalStoresCount} Gerai Aktif
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
              Total Omset: {formatRupiah(summary.totalAreaRevenue, true)}
            </span>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-5 mt-5 items-center">
          {/* Left Column: Toko BA (3 Cols) */}
          <div className="lg:col-span-3 bg-white/5 border border-pink-500/30 rounded-2xl p-5 backdrop-blur-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">💄</span>
                <div>
                  <h3 className="text-sm font-extrabold text-pink-300 uppercase tracking-wider">
                    Toko dengan BA
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {summary.tokoBaCount} Toko ({summary.tokoBaStorePercent}% dari total gerai)
                  </span>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40">
                Kontribusi {summary.tokoBaRevenuePercent}%
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block">Total Omset Penjualan:</span>
                <span className="text-2xl font-black font-mono text-white tracking-tight">
                  {formatRupiah(summary.tokoBaTotalRevenue, true)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Rata-rata per Toko:</span>
                  <span className="font-mono font-bold text-pink-200 text-sm">
                    {formatRupiah(summary.tokoBaAvgRevenuePerStore, true)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Produk Fokus Terjual:</span>
                  <span className="font-mono font-bold text-emerald-300 text-sm">
                    {summary.tokoBaFocusPcs} pcs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Productivity Lift Multiplier (1 Col) */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center text-center p-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-pink-500/30">
              {summary.productivityMultiplier}x
            </div>
            <span className="text-xs font-extrabold text-amber-300 mt-2 block leading-tight">
              Lebih Produktif
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 leading-snug">
              Toko BA menghasilkan rata-rata {summary.productivityMultiplier}x omset dibanding Non-BA
            </span>
          </div>

          {/* Right Column: Toko Non-BA (3 Cols) */}
          <div className="lg:col-span-3 bg-white/5 border border-blue-500/30 rounded-2xl p-5 backdrop-blur-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏪</span>
                <div>
                  <h3 className="text-sm font-extrabold text-blue-300 uppercase tracking-wider">
                    Toko Non-BA (Tanpa BA)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {summary.tokoNonBaCount} Toko ({summary.tokoNonBaStorePercent}% dari total gerai)
                  </span>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Kontribusi {summary.tokoNonBaRevenuePercent}%
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block">Total Omset Penjualan:</span>
                <span className="text-2xl font-black font-mono text-white tracking-tight">
                  {formatRupiah(summary.tokoNonBaTotalRevenue, true)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Rata-rata per Toko:</span>
                  <span className="font-mono font-bold text-blue-200 text-sm">
                    {formatRupiah(summary.tokoNonBaAvgRevenuePerStore, true)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Produk Fokus Terjual:</span>
                  <span className="font-mono font-bold text-slate-300 text-sm">
                    {summary.tokoNonBaFocusPcs} pcs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Comparative Contribution Bars */}
        <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
          {/* Bar 1: Porsi Omset */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">
                Porsi Kontribusi Nilai Omset (Sell Out):
              </span>
              <span className="font-mono font-bold text-white">
                <span className="text-pink-400">Toko BA {summary.tokoBaRevenuePercent}%</span> vs{' '}
                <span className="text-blue-400">Toko Non-BA {summary.tokoNonBaRevenuePercent}%</span>
              </span>
            </div>
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-500"
                style={{ width: `${summary.tokoBaRevenuePercent}%` }}
                title={`Toko BA: ${summary.tokoBaRevenuePercent}%`}
              />
              <div
                className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full transition-all duration-500"
                style={{ width: `${summary.tokoNonBaRevenuePercent}%` }}
                title={`Toko Non-BA: ${summary.tokoNonBaRevenuePercent}%`}
              />
            </div>
          </div>

          {/* Bar 2: Porsi Jumlah Toko */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">
                Porsi Jumlah Gerai Toko:
              </span>
              <span className="font-mono font-bold text-white">
                <span className="text-pink-400">Toko BA ({summary.tokoBaCount} Toko / {summary.tokoBaStorePercent}%)</span> vs{' '}
                <span className="text-blue-400">Toko Non-BA ({summary.tokoNonBaCount} Toko / {summary.tokoNonBaStorePercent}%)</span>
              </span>
            </div>
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden flex">
              <div
                className="bg-pink-400 h-full transition-all duration-500"
                style={{ width: `${summary.tokoBaStorePercent}%` }}
              />
              <div
                className="bg-blue-400 h-full transition-all duration-500"
                style={{ width: `${summary.tokoNonBaStorePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Strategic Opportunity Alert: Non-BA High-Performing Candidates */}
      {summary.potentialBaCandidateStoresCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 shadow-2xs flex items-start gap-3.5">
          <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-extrabold text-sm block">
              Peluang Ekspansi: Ditemukan {summary.potentialBaCandidateStoresCount} Toko Non-BA Beromset Tinggi yang Sangat Potensial Dipasang BA!
            </span>
            <p className="mt-1 leading-relaxed text-amber-800">
              Toko-toko ini telah mencatatkan omset mandiri di atas Rp 12.000.000 / bulan tanpa didampingi BA. Berdasarkan data komparasi, penempatan 1 Beauty Advisor baru di toko potensial ini berpeluang menaikkan omset sebesar <strong>2.8x lipat</strong> serta melipatgandakan serapan Produk Fokus.
            </p>
          </div>
        </div>
      )}

      {/* 4. Main Store Contribution Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>Peringkat &amp; Daftar Kontribusi Semua Toko ({selectedMonth} {selectedYear})</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {filteredStores.length} Gerai
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Urutan berdasarkan total omset penjualan dan persentase kontribusi terhadap total area
            </p>
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari toko, nama BA, atau sales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
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

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Nama Toko / Outlet</th>
                <th className="py-3 px-3">Nama BA</th>
                <th className="py-3 px-3">Area &amp; SPV</th>
                <th className="py-3 px-3">Sales In-Charge</th>
                <th className="py-3 px-3 text-right">Total Omset (Rp)</th>
                <th className="py-3 px-3 text-center">% Kontribusi</th>
                <th className="py-3 px-3 text-center">Qty / Fokus</th>
                <th className="py-3 px-3 text-center">Klasifikasi Performa</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStores.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    item.hasBa ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  <td className="py-3 px-3 text-center font-bold text-slate-500">
                    {idx + 1}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                        item.hasBa
                          ? 'bg-pink-100 text-pink-800 border border-pink-200'
                          : 'bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {item.hasBa ? '💄 Toko BA' : '🏪 Non-BA'}
                    </span>
                  </td>

                  {/* Store Name */}
                  <td className="py-3 px-3">
                    <span className="font-extrabold text-slate-900 block">
                      {item.storeName}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{item.region}</span>
                  </td>

                  {/* BA Name */}
                  <td className="py-3 px-3">
                    {item.hasBa ? (
                      <div>
                        <span className="font-bold text-pink-700 block">{item.baName}</span>
                        {item.baNumber && (
                          <span className="text-[10px] text-slate-400 block">{item.baNumber}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">- (Tanpa BA)</span>
                    )}
                  </td>

                  {/* Cover Area & SPV */}
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 block">{item.coverArea}</span>
                    <span className="text-[10px] text-slate-400 block">SPV: {item.spvName}</span>
                  </td>

                  {/* Sales */}
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    {item.salesName}
                  </td>

                  {/* Total Omset */}
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                    {formatRupiah(item.totalRevenue, true)}
                  </td>

                  {/* Contribution Percent */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        item.contributionPercent >= 10
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.contributionPercent >= 5
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.contributionPercent}%
                    </span>
                  </td>

                  {/* Qty & Focus Pcs */}
                  <td className="py-3 px-3 text-center font-mono text-[11px]">
                    <span className="text-slate-700">{item.totalQtySold} pcs</span>
                    <span className="text-[10px] text-pink-600 block font-semibold">
                      ({item.focusProductPcs} fokus)
                    </span>
                  </td>

                  {/* Performance Classification */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.performanceClass.includes('Bintang')
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : item.performanceClass.includes('Prioritas')
                          ? 'bg-orange-100 text-orange-900 border border-orange-300'
                          : item.performanceClass.includes('Kandidat')
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.performanceClass}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedStoreModal(item)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg border border-pink-200/80 transition-colors cursor-pointer"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}

              {filteredStores.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    Tidak ada data toko yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Detail Modal */}
      {selectedStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      selectedStoreModal.hasBa
                        ? 'bg-pink-100 text-pink-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {selectedStoreModal.hasBa ? '💄 Toko dengan BA' : '🏪 Toko Non-BA'}
                  </span>
                  <span className="text-xs text-slate-400">
                    • Periode: {selectedMonth} {selectedYear}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedStoreModal.storeName}
                </h3>
                <p className="text-xs text-slate-500">
                  Area: {selectedStoreModal.coverArea} • Sales: {selectedStoreModal.salesName} • SPV: {selectedStoreModal.spvName}
                </p>
              </div>
              <button
                onClick={() => setSelectedStoreModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Metrics */}
            <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Omset Penjualan:</span>
                <span className="font-mono font-black text-base text-slate-900 block mt-0.5">
                  {formatRupiah(selectedStoreModal.totalRevenue, true)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Kontribusi terhadap Area:</span>
                <span className="font-bold text-emerald-700 text-base block mt-0.5">
                  {selectedStoreModal.contributionPercent}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Unit Terjual (Total Qty):</span>
                <span className="font-bold text-slate-800 text-sm block mt-0.5">
                  {selectedStoreModal.totalQtySold} pcs
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Produk Fokus Terjual:</span>
                <span className="font-bold text-pink-600 text-sm block mt-0.5">
                  {selectedStoreModal.focusProductPcs} pcs ({formatRupiah(selectedStoreModal.focusProductValue, true)})
                </span>
              </div>
            </div>

            {/* BA Status Info */}
            <div className="mt-4 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Status Penugasan BA:</span>
              <p className="text-slate-600">
                {selectedStoreModal.hasBa
                  ? `Dikelola oleh BA resmi: ${selectedStoreModal.baName} (${selectedStoreModal.baNumber || 'BA Aktif'}).`
                  : 'Gerai ini belum memiliki BA tetap (hanya dilayani kunjungan Sales Taking Order berkala).'}
              </p>
            </div>

            {/* Strategic Recommendation */}
            <div className="mt-4 p-3.5 bg-pink-50/60 rounded-xl border border-pink-200 text-xs text-pink-950 space-y-1">
              <span className="font-extrabold flex items-center gap-1.5 text-pink-900">
                <CheckCircle2 className="w-4 h-4 text-pink-600" />
                Rekomendasi Manajemen &amp; Ekspansi:
              </span>
              <p className="leading-relaxed font-medium">
                {selectedStoreModal.recommendationNote}
              </p>
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedStoreModal(null)}
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
