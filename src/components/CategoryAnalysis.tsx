import React, { useState, useMemo } from 'react';
import {
  Layers,
  TrendingUp,
  Package,
  ShoppingBag,
  Award,
  Filter,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  PieChart,
  BarChart2,
  DollarSign,
  ChevronRight,
  Store
} from 'lucide-react';
import { TransactionRecord } from '../types/dashboard';
import {
  formatRupiah,
  formatNumber,
  formatPercent,
  aggregateCategoryDetails,
  CategoryDetailData,
} from '../utils/analytics';

interface CategoryAnalysisProps {
  records: TransactionRecord[];
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
}

// Category palette mapping for colorful styling
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string; barGradient: string }> = {
  'Lip Makeup': {
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-700',
    border: 'border-fuchsia-200',
    gradient: 'from-fuchsia-600 to-pink-500',
    barGradient: 'from-fuchsia-500 to-pink-400',
  },
  'Body Care': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    gradient: 'from-indigo-600 to-sky-500',
    barGradient: 'from-indigo-500 to-sky-400',
  },
  'Sunscreen': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    gradient: 'from-amber-500 to-orange-500',
    barGradient: 'from-amber-400 to-orange-400',
  },
  'Eye & Lash Tools': {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    gradient: 'from-violet-600 to-purple-500',
    barGradient: 'from-violet-500 to-purple-400',
  },
  'Skincare': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    gradient: 'from-emerald-600 to-teal-500',
    barGradient: 'from-emerald-500 to-teal-400',
  },
  'Hair Care': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    gradient: 'from-cyan-600 to-blue-500',
    barGradient: 'from-cyan-500 to-blue-400',
  },
  'Complexion & Powder': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    gradient: 'from-rose-600 to-pink-500',
    barGradient: 'from-rose-500 to-pink-400',
  },
};

const DEFAULT_CATEGORY_COLOR = {
  bg: 'bg-slate-50',
  text: 'text-slate-700',
  border: 'border-slate-200',
  gradient: 'from-slate-600 to-slate-800',
  barGradient: 'from-teal-500 to-emerald-400',
};

export const CategoryAnalysis: React.FC<CategoryAnalysisProps> = ({
  records,
  onSelectCategory,
  selectedCategory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'value' | 'qty' | 'avgPrice' | 'contribution'>('value');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [activeCategoryModal, setActiveCategoryModal] = useState<CategoryDetailData | null>(null);

  // Aggregate rich category details
  const categoryDetails = useMemo(() => {
    return aggregateCategoryDetails(records);
  }, [records]);

  // Overall metrics
  const totalRevenue = useMemo(() => {
    return categoryDetails.reduce((acc, c) => acc + c.totalValue, 0);
  }, [categoryDetails]);

  const totalQty = useMemo(() => {
    return categoryDetails.reduce((acc, c) => acc + c.totalQty, 0);
  }, [categoryDetails]);

  const topCategory = categoryDetails[0] || null;
  const topVolumeCategory = useMemo(() => {
    return [...categoryDetails].sort((a, b) => b.totalQty - a.totalQty)[0] || null;
  }, [categoryDetails]);

  const overallAvgPrice = totalQty > 0 ? totalRevenue / totalQty : 0;

  // Filtered and sorted list
  const filteredCategories = useMemo(() => {
    return categoryDetails
      .filter((cat) => cat.category.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        let valA = a.totalValue;
        let valB = b.totalValue;
        if (sortField === 'qty') {
          valA = a.totalQty;
          valB = b.totalQty;
        } else if (sortField === 'avgPrice') {
          valA = a.avgPrice;
          valB = b.avgPrice;
        } else if (sortField === 'contribution') {
          valA = a.contributionPercent;
          valB = b.contributionPercent;
        }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [categoryDetails, searchTerm, sortField, sortOrder]);

  const handleSort = (field: 'value' | 'qty' | 'avgPrice' | 'contribution') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Distinct brand list for Brand vs Category cross matrix
  const allBrandsInDataset = useMemo(() => {
    const brandsSet = new Set<string>();
    records.forEach((r) => {
      if (r.BRAND) brandsSet.add(r.BRAND);
    });
    return Array.from(brandsSet).sort();
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Active Category Filter Callout if filtered */}
      {selectedCategory && selectedCategory !== 'ALL' && (
        <div className="p-4 rounded-2xl border border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 via-pink-50 to-white flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white rounded-xl shadow-xs">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-fuchsia-950">
                Filter Kategori Aktif: <span className="font-extrabold text-fuchsia-700 uppercase">{selectedCategory}</span>
              </p>
              <p className="text-[11px] text-fuchsia-800">
                Dashboard sedang menampilkan data khusus untuk kategori terpilih ini.
              </p>
            </div>
          </div>
          {onSelectCategory && (
            <button
              onClick={() => onSelectCategory('ALL')}
              className="px-3 py-1.5 text-xs font-bold bg-white text-fuchsia-700 hover:bg-fuchsia-100 rounded-lg border border-fuchsia-200 transition-colors shadow-2xs"
            >
              Tampilkan Semua Kategori
            </button>
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-fuchsia-600 via-pink-600 to-purple-600 text-white shadow-md shadow-fuchsia-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                Analisa Kategori Produk (Category Performance)
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
                  {categoryDetails.length} Kategori
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Distribusi kontribusi omset, volume unit, harga rata-rata, komposisi brand, dan produk pilar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-slate-800 shadow-2xs"
            />
          </div>
        </div>

        {/* 4 Category Metric KPI Cards with Rich Vibrant Styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Total Kategori & Revenue */}
          <div className="p-4 rounded-xl border border-fuchsia-200/90 bg-gradient-to-br from-white via-fuchsia-50/50 to-pink-50/30 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fuchsia-900">Total Nilai Kategori</span>
              <div className="p-1.5 bg-fuchsia-100 text-fuchsia-700 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
              {formatRupiah(totalRevenue)}
            </p>
            <p className="text-[11px] text-fuchsia-700 mt-1 font-semibold">
              Dari {categoryDetails.length} kategori aktif terpilih
            </p>
          </div>

          {/* Card 2: Top Revenue Category */}
          <div className="p-4 rounded-xl border border-indigo-200/90 bg-gradient-to-br from-white via-indigo-50/50 to-sky-50/30 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900">Kategori Terlaris (#1 Value)</span>
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-base font-extrabold text-slate-900 mt-2 truncate">
              {topCategory?.category || '-'}
            </p>
            <p className="text-[11px] text-indigo-800 mt-1 font-bold">
              {topCategory ? `${formatRupiah(topCategory.totalValue)} (${formatPercent(topCategory.contributionPercent, false)})` : '-'}
            </p>
          </div>

          {/* Card 3: Top Volume Category */}
          <div className="p-4 rounded-xl border border-amber-200/90 bg-gradient-to-br from-white via-amber-50/50 to-orange-50/30 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">Volume Terbesar (#1 Qty)</span>
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-base font-extrabold text-slate-900 mt-2 truncate">
              {topVolumeCategory?.category || '-'}
            </p>
            <p className="text-[11px] text-amber-800 mt-1 font-bold">
              {topVolumeCategory ? `${formatNumber(topVolumeCategory.totalQty)} pcs terjual` : '-'}
            </p>
          </div>

          {/* Card 4: Average Unit Price (AUP) */}
          <div className="p-4 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/30 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">Rata-rata Harga/Item (AUP)</span>
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
              {formatRupiah(overallAvgPrice)}
            </p>
            <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
              Rata-rata tertimbang per item
            </p>
          </div>
        </div>

        {/* Visual Category Contribution Stacked Bar */}
        <div className="mt-8 p-4 rounded-xl border border-slate-200/80 bg-slate-50/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-fuchsia-600" />
              Peta Kontribusi Kategori terhadap Total Omset
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Hover bar untuk melihat detail persentase
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-6 w-full rounded-lg bg-slate-200 overflow-hidden flex shadow-inner">
            {categoryDetails.map((cat) => {
              const palette = CATEGORY_COLORS[cat.category] || DEFAULT_CATEGORY_COLOR;
              const width = Math.max(cat.contributionPercent, 0.5);
              return (
                <div
                  key={cat.category}
                  style={{ width: `${width}%` }}
                  title={`${cat.category}: ${formatRupiah(cat.totalValue)} (${formatPercent(cat.contributionPercent, false)})`}
                  className={`h-full bg-gradient-to-r ${palette.barGradient} border-r border-white/20 transition-all hover:opacity-90 relative group`}
                />
              );
            })}
          </div>

          {/* Category Badges Legend */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2">
            {categoryDetails.map((cat) => {
              const palette = CATEGORY_COLORS[cat.category] || DEFAULT_CATEGORY_COLOR;
              const isSelected = selectedCategory === cat.category;
              return (
                <button
                  key={cat.category}
                  onClick={() => onSelectCategory && onSelectCategory(isSelected ? 'ALL' : cat.category)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    isSelected
                      ? `bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-fuchsia-400`
                      : `${palette.bg} ${palette.text} ${palette.border} hover:scale-105`
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${palette.barGradient}`} />
                  <span>{cat.category}</span>
                  <span className="font-mono text-[10px] opacity-80">
                    {formatPercent(cat.contributionPercent, false)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Category Cards Grid */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-fuchsia-600" />
              Detail Kartu Analisa Setiap Kategori
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Klik "Filter Kategori Ini" untuk isolasi data di seluruh dashboard
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((cat, idx) => {
              const palette = CATEGORY_COLORS[cat.category] || DEFAULT_CATEGORY_COLOR;
              const isCurrentFilter = selectedCategory === cat.category;

              return (
                <div
                  key={cat.category}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
                    isCurrentFilter
                      ? 'border-fuchsia-500 ring-2 ring-fuchsia-400/50 shadow-md bg-white'
                      : 'border-slate-200/90 hover:border-fuchsia-300 hover:shadow-md bg-white'
                  }`}
                >
                  {/* Card Header Banner */}
                  <div className={`p-4 border-b border-slate-100 bg-gradient-to-r ${palette.bg} flex items-start justify-between gap-3`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-lg text-white font-mono text-xs font-extrabold flex items-center justify-center shrink-0 bg-gradient-to-r ${palette.gradient} shadow-2xs`}>
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {cat.category}
                        </h4>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-400" />
                          Tersebar di {cat.storeCount} gerai
                        </span>
                      </div>
                    </div>
                    <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-white text-slate-800 border border-slate-200 shadow-2xs tabular-nums">
                      {formatPercent(cat.contributionPercent, false)}
                    </span>
                  </div>

                  {/* Card Body Metrics */}
                  <div className="p-4 space-y-3 grow">
                    {/* Revenue & Qty */}
                    <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total Omset</span>
                        <p className="text-sm font-extrabold text-slate-900 font-mono tabular-nums">
                          {formatRupiah(cat.totalValue)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total Unit Terjual</span>
                        <p className="text-sm font-extrabold text-slate-900 font-mono tabular-nums">
                          {formatNumber(cat.totalQty)} pcs
                        </p>
                      </div>
                    </div>

                    {/* AUP & Focus vs Regular Split */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Harga Rata-rata (AUP):</span>
                      <span className="font-extrabold font-mono text-slate-800">
                        {formatRupiah(cat.avgPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Porsi Produk Focus:</span>
                      <span className={`font-extrabold font-mono ${cat.focusPercent >= 70 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {formatPercent(cat.focusPercent, false)}
                      </span>
                    </div>

                    {/* Brand Breakdown Pills */}
                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                        Distribusi Brand Dominan:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.brandBreakdown.map((b) => (
                          <span
                            key={b.brand}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 border border-slate-200"
                          >
                            <span>{b.brand}:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatPercent(b.percent, false)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Top Selling SKU in Category */}
                    {cat.topSkus.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          SKU Terlaris:
                        </span>
                        <div className="p-2 rounded-lg bg-slate-50 text-[11px] font-medium text-slate-700 border border-slate-100">
                          <p className="font-bold text-slate-900 truncate">
                            {cat.topSkus[0].sku}
                          </p>
                          <div className="flex items-center justify-between mt-0.5 text-[10px] text-slate-500">
                            <span>{cat.topSkus[0].brand}</span>
                            <span className="font-mono font-bold text-slate-800">
                              {formatRupiah(cat.topSkus[0].value)} ({cat.topSkus[0].qty} pcs)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action Button */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {cat.txCount} Transaksi
                    </span>
                    {onSelectCategory && (
                      <button
                        onClick={() => onSelectCategory(isCurrentFilter ? 'ALL' : cat.category)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                          isCurrentFilter
                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            : 'bg-white text-fuchsia-700 hover:bg-fuchsia-50 border border-fuchsia-200 shadow-2xs'
                        }`}
                      >
                        <span>{isCurrentFilter ? 'Hapus Filter' : 'Filter Kategori Ini'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Performance Data Table */}
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-fuchsia-600" />
                Tabel Komparasi Kinerja Kategori
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Klik judul kolom untuk mengubah urutan (sort)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">Rank</th>
                  <th className="py-3 px-3">Nama Kategori</th>
                  <th
                    onClick={() => handleSort('value')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    Nilai Penjualan (IDR) {sortField === 'value' ? (sortOrder === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('qty')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    Volume (QTY) {sortField === 'qty' ? (sortOrder === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('avgPrice')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    AUP (Harga Rata2) {sortField === 'avgPrice' ? (sortOrder === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('contribution')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    Kontribusi % {sortField === 'contribution' ? (sortOrder === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th className="py-3 px-3">Brand Dominan</th>
                  <th className="py-3 px-3 text-center">Coverage Toko</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat, idx) => {
                  const palette = CATEGORY_COLORS[cat.category] || DEFAULT_CATEGORY_COLOR;
                  const isCurrentFilter = selectedCategory === cat.category;

                  return (
                    <tr
                      key={cat.category}
                      className={`hover:bg-fuchsia-50/40 transition-colors ${
                        isCurrentFilter ? 'bg-fuchsia-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-mono text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 font-extrabold shadow-2xs'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700/60 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-slate-900 block">
                          {cat.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cat.txCount} Transaksi
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                        {formatRupiah(cat.totalValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800 tabular-nums">
                        {formatNumber(cat.totalQty)} pcs
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                        {formatRupiah(cat.avgPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-fuchsia-700 tabular-nums">
                        {formatPercent(cat.contributionPercent, false)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {cat.brandBreakdown[0]?.brand || '-'} ({formatPercent(cat.brandBreakdown[0]?.percent || 0, false)})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-mono">
                        {cat.storeCount} toko
                      </td>
                      <td className="py-3 px-3 text-center">
                        {onSelectCategory && (
                          <button
                            onClick={() => onSelectCategory(isCurrentFilter ? 'ALL' : cat.category)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                              isCurrentFilter
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                : 'bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 border border-fuchsia-200'
                            }`}
                          >
                            {isCurrentFilter ? 'Hapus' : 'Filter'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cross-Analysis: Brand vs Category Matrix */}
        <div className="mt-10 p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Matriks Distribusi: Kategori vs Brand Portfolio
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Menganalisis brand mana yang memimpin di setiap kategori produk kosmetik & FMCG
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left bg-white rounded-xl border border-slate-200 overflow-hidden">
              <thead className="bg-slate-100 font-extrabold text-slate-700 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kategori Produk</th>
                  {allBrandsInDataset.map((brand) => (
                    <th key={brand} className="py-2.5 px-3 text-right">
                      {brand}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900">Total Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryDetails.map((cat) => {
                  const brandMap: Record<string, number> = {};
                  cat.brandBreakdown.forEach((b) => {
                    brandMap[b.brand] = b.value;
                  });

                  return (
                    <tr key={cat.category} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">
                        {cat.category}
                      </td>
                      {allBrandsInDataset.map((brand) => {
                        const val = brandMap[brand] || 0;
                        return (
                          <td key={brand} className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {val > 0 ? (
                              <span className="font-semibold text-slate-800">
                                {formatRupiah(val, true)}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-fuchsia-700 tabular-nums bg-fuchsia-50/30">
                        {formatRupiah(cat.totalValue, true)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
