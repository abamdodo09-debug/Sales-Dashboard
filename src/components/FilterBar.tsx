import React, { useState } from 'react';
import {
  Filter,
  RotateCcw,
  Search,
  ChevronDown,
  X,
  SlidersHorizontal,
  Calendar,
  Building2,
  Users,
  Layers,
  Store,
  MapPin,
  CheckCircle,
  Package
} from 'lucide-react';
import { DashboardFilters } from '../types/dashboard';

interface FilterBarProps {
  filters: DashboardFilters;
  onChangeFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  onResetFilters: () => void;
  options: {
    months: string[];
    years: string[];
    sales: string[];
    spv: string[];
    brands: string[];
    categories?: string[];
    stores: string[];
    regions: string[];
    ket: string[];
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilter,
  onResetFilters,
  options,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Count active non-default filters
  const activeFiltersCount = [
    filters.BULAN !== 'ALL',
    filters.TAHUN !== 'ALL',
    filters.SALES !== 'ALL',
    filters.SPV !== 'ALL',
    filters.BRAND !== 'ALL',
    Boolean(filters.KATEGORI && filters.KATEGORI !== 'ALL'),
    filters.SKU !== 'ALL',
    filters.NAMA_STORE !== 'ALL',
    filters.REGION !== 'ALL',
    filters.KET !== 'ALL',
    Boolean(filters.searchQuery.trim()),
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm mb-6 overflow-hidden">
      {/* Filter Header & Quick Search Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-lg shadow-2xs">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              Filter Terintegrasi
              {activeFiltersCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs tabular-nums">
                  {activeFiltersCount} Aktif
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sinkron otomatis antar Bulan, Tahun, Sales, SPV, Brand, Store &amp; Region
            </p>
          </div>
        </div>

        {/* Global Search & Reset */}
        <div className="flex items-center gap-2 grow sm:grow-0">
          <div className="relative grow sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SKU, Toko, Sales..."
              value={filters.searchQuery}
              onChange={(e) => onChangeFilter('searchQuery', e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 shadow-2xs"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onChangeFilter('searchQuery', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              title="Reset semua filter ke default"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all border border-rose-200 shadow-2xs shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 bg-white shadow-2xs"
          >
            <span>{isExpanded ? 'Tutup' : 'Buka'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cascading Filter Controls Grid with Colorful Category Labels */}
      {isExpanded && (
        <div className="p-3 sm:p-4 bg-slate-50/60">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* 1. TAHUN (Sky Blue) */}
            <div>
              <label className="text-[11px] font-bold text-sky-900 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                TAHUN
              </label>
              <select
                value={filters.TAHUN}
                onChange={(e) => onChangeFilter('TAHUN', e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors shadow-2xs ${
                  filters.TAHUN !== 'ALL'
                    ? 'border-sky-500 bg-sky-50 font-bold text-sky-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="ALL">Semua Tahun</option>
                {options.years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. BULAN (Sky Blue) */}
            <div>
              <label className="text-[11px] font-bold text-sky-900 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                BULAN
              </label>
              <select
                value={filters.BULAN}
                onChange={(e) => onChangeFilter('BULAN', e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors shadow-2xs ${
                  filters.BULAN !== 'ALL'
                    ? 'border-sky-500 bg-sky-50 font-bold text-sky-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="ALL">Semua Bulan</option>
                {options.months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. SPV (Purple) */}
            <div>
              <label className="text-[11px] font-bold text-purple-900 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                SPV (SUPERVISOR)
              </label>
              <select
                value={filters.SPV}
                onChange={(e) => onChangeFilter('SPV', e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors shadow-2xs ${
                  filters.SPV !== 'ALL'
                    ? 'border-purple-500 bg-purple-50 font-bold text-purple-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="ALL">Semua SPV ({options.spv.length})</option>
                {options.spv.map((spv) => (
                  <option key={spv} value={spv}>
                    {spv}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. SALES (Indigo) */}
            <div>
              <label className="text-[11px] font-bold text-indigo-900 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                SALES
              </label>
              <select
                value={filters.SALES}
                onChange={(e) => onChangeFilter('SALES', e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors shadow-2xs ${
                  filters.SALES !== 'ALL'
                    ? 'border-indigo-500 bg-indigo-50 font-bold text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="ALL">Semua Sales ({options.sales.length})</option>
                {options.sales.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. BRAND (Pink/Rose) */}
            <div>
              <label className="text-[11px] font-bold text-pink-900 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
                BRAND
              </label>
              <select
                value={filters.BRAND}
                onChange={(e) => onChangeFilter('BRAND', e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:ring-2 focus:ring-pink-500 focus:outline-none transition-colors shadow-2xs ${
                  filters.BRAND !== 'ALL'
                    ? 'border-pink-500 bg-pink-50 font-bold text-pink-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="ALL">Semua Brand ({options.brands.length})</option>
                {options.brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. KATEGORI (Fuchsia) */}
            <div>
              <label className="text-[11px] font-bold text-fuchsia-900 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-fuchsia-500 inline-block" />
                KATEGORI
              </label>
              <select
                value={filters.KATEGORI || 'ALL'}
                onChange={(e) => onChangeFilter('KATEGORI', e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-colors shadow-2xs ${
                  filters.KATEGORI && filters.KATEGORI !== 'ALL'
                    ? 'border-fuchsia-500 bg-fuchsia-50 font-bold text-fuchsia-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="ALL">Semua Kategori ({(options.categories || []).length})</option>
                {(options.categories || []).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. NAMA STORE (Amber) */}
            <div>
              <label className="text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                NAMA STORE
              </label>
              <select
                value={filters.NAMA_STORE}
                onChange={(e) => onChangeFilter('NAMA_STORE', e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors shadow-2xs ${
                  filters.NAMA_STORE !== 'ALL'
                    ? 'border-amber-500 bg-amber-50 font-bold text-amber-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="ALL">Semua Store ({options.stores.length})</option>
                {options.stores.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. REGION (Teal) */}
            <div>
              <label className="text-[11px] font-bold text-teal-900 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
                REGION
              </label>
              <select
                value={filters.REGION}
                onChange={(e) => onChangeFilter('REGION', e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors shadow-2xs ${
                  filters.REGION !== 'ALL'
                    ? 'border-teal-500 bg-teal-50 font-bold text-teal-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="ALL">Semua Region ({options.regions.length})</option>
                {options.regions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            {/* 8. KET (Status) */}
            <div>
              <label className="text-[11px] font-bold text-emerald-900 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                KET (STATUS)
              </label>
              <select
                value={filters.KET}
                onChange={(e) => onChangeFilter('KET', e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors shadow-2xs ${
                  filters.KET !== 'ALL'
                    ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="ALL">Semua Keterangan</option>
                {options.ket.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* 9. SKU Filter / Quick Text */}
            <div className="col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-2">
              <label className="text-[11px] font-bold text-violet-900 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                FILTER SKU / PRODUK
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik kata kunci SKU / No SKU..."
                  value={filters.SKU === 'ALL' ? '' : filters.SKU}
                  onChange={(e) => onChangeFilter('SKU', e.target.value || 'ALL')}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:ring-2 focus:ring-violet-500 focus:outline-none shadow-2xs ${
                    filters.SKU !== 'ALL'
                      ? 'border-violet-500 bg-violet-50 font-bold text-violet-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                />
                {filters.SKU !== 'ALL' && (
                  <button
                    onClick={() => onChangeFilter('SKU', 'ALL')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Tags with Colorful Category Backgrounds */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-600 font-bold mr-1">Filter Terpasang:</span>
              {filters.TAHUN !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 font-semibold shadow-2xs">
                  Tahun: {filters.TAHUN}
                  <button onClick={() => onChangeFilter('TAHUN', 'ALL')}><X className="w-3 h-3 hover:text-sky-700" /></button>
                </span>
              )}
              {filters.BULAN !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 font-semibold shadow-2xs">
                  Bulan: {filters.BULAN}
                  <button onClick={() => onChangeFilter('BULAN', 'ALL')}><X className="w-3 h-3 hover:text-sky-700" /></button>
                </span>
              )}
              {filters.SPV !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 font-semibold shadow-2xs">
                  SPV: {filters.SPV}
                  <button onClick={() => onChangeFilter('SPV', 'ALL')}><X className="w-3 h-3 hover:text-purple-700" /></button>
                </span>
              )}
              {filters.SALES !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 font-semibold shadow-2xs">
                  Sales: {filters.SALES}
                  <button onClick={() => onChangeFilter('SALES', 'ALL')}><X className="w-3 h-3 hover:text-indigo-700" /></button>
                </span>
              )}
              {filters.BRAND !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-900 border border-pink-300 font-semibold shadow-2xs">
                  Brand: {filters.BRAND}
                  <button onClick={() => onChangeFilter('BRAND', 'ALL')}><X className="w-3 h-3 hover:text-pink-700" /></button>
                </span>
              )}
              {filters.KATEGORI && filters.KATEGORI !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300 font-semibold shadow-2xs">
                  Kategori: {filters.KATEGORI}
                  <button onClick={() => onChangeFilter('KATEGORI', 'ALL')}><X className="w-3 h-3 hover:text-fuchsia-700" /></button>
                </span>
              )}
              {filters.NAMA_STORE !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-2xs">
                  Store: {filters.NAMA_STORE}
                  <button onClick={() => onChangeFilter('NAMA_STORE', 'ALL')}><X className="w-3 h-3 hover:text-amber-700" /></button>
                </span>
              )}
              {filters.REGION !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300 font-semibold shadow-2xs">
                  Region: {filters.REGION}
                  <button onClick={() => onChangeFilter('REGION', 'ALL')}><X className="w-3 h-3 hover:text-teal-700" /></button>
                </span>
              )}
              {filters.KET !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold shadow-2xs">
                  Ket: {filters.KET}
                  <button onClick={() => onChangeFilter('KET', 'ALL')}><X className="w-3 h-3 hover:text-emerald-700" /></button>
                </span>
              )}
              {filters.SKU !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-900 border border-violet-300 font-semibold shadow-2xs">
                  SKU: "{filters.SKU}"
                  <button onClick={() => onChangeFilter('SKU', 'ALL')}><X className="w-3 h-3 hover:text-violet-700" /></button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
