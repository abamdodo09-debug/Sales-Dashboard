import React, { useState, useMemo } from 'react';
import {
  Users,
  Award,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Package,
  Trophy,
  Medal,
  Sliders,
  Edit3,
  X,
  Save,
  Filter,
} from 'lucide-react';
import { TransactionRecord } from '../types/dashboard';
import { aggregateByDimension, formatRupiah, formatNumber, formatPercent } from '../utils/analytics';
import { loadSalesTargets, saveSalesTargets, DEFAULT_SALES_TARGET } from '../services/targetManagementService';

interface SalesAnalysisProps {
  records: TransactionRecord[];
}

const STORAGE_KEY_SALES_SELLOUT_TARGETS = 'salespro_custom_sales_sellout_targets_v1';

function loadSalesSellOutTargets(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SALES_SELLOUT_TARGETS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSalesSellOutTargets(targets: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY_SALES_SELLOUT_TARGETS, JSON.stringify(targets));
  } catch {
    // ignore
  }
}

export const SalesAnalysis: React.FC<SalesAnalysisProps> = ({ records }) => {
  // Filter KET: 'ALL' | 'SELL IN' | 'SELL OUT'
  const [ketFilter, setKetFilter] = useState<'ALL' | 'SELL IN' | 'SELL OUT'>('SELL IN');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Edit Target Modal
  const [editingSalesName, setEditingSalesName] = useState<string | null>(null);
  const [targetSellInInput, setTargetSellInInput] = useState<number>(DEFAULT_SALES_TARGET);
  const [targetSellOutInput, setTargetSellOutInput] = useState<number>(140000000);

  // Custom targets
  const customSellInTargets = useMemo(() => loadSalesTargets(), [refreshKey]);
  const customSellOutTargets = useMemo(() => loadSalesSellOutTargets(), [refreshKey]);

  // Filter records based on KET
  const effectiveRecords = useMemo(() => {
    if (ketFilter === 'ALL') return records;
    return records.filter((r) => {
      const k = (r.KET || '').toUpperCase();
      if (ketFilter === 'SELL IN') return k === 'SELL IN' || !r.KET;
      if (ketFilter === 'SELL OUT') return k === 'SELL OUT';
      return true;
    });
  }, [records, ketFilter]);

  const rawSalesData = useMemo(() => {
    return aggregateByDimension(effectiveRecords, 'SALES');
  }, [effectiveRecords]);

  // Combine with dynamic Target Sell In or Target Sell Out
  const salesData = useMemo(() => {
    return rawSalesData.map((s) => {
      let targetVal: number;
      if (ketFilter === 'SELL OUT') {
        targetVal = customSellOutTargets[s.name] !== undefined ? customSellOutTargets[s.name] : 140000000;
      } else {
        targetVal = customSellInTargets[s.name] !== undefined ? customSellInTargets[s.name] : DEFAULT_SALES_TARGET;
      }

      const achievementPct = targetVal > 0 ? (s.totalValue / targetVal) * 100 : 0;
      return {
        ...s,
        target: targetVal,
        achievementPercent: achievementPct,
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [rawSalesData, ketFilter, customSellInTargets, customSellOutTargets]);

  const handleOpenEdit = (salesName: string) => {
    setEditingSalesName(salesName);
    const curIn = customSellInTargets[salesName] !== undefined ? customSellInTargets[salesName] : DEFAULT_SALES_TARGET;
    const curOut = customSellOutTargets[salesName] !== undefined ? customSellOutTargets[salesName] : 140000000;
    setTargetSellInInput(curIn);
    setTargetSellOutInput(curOut);
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalesName) return;

    const inTargets = loadSalesTargets();
    inTargets[editingSalesName] = targetSellInInput;
    saveSalesTargets(inTargets);

    const outTargets = loadSalesSellOutTargets();
    outTargets[editingSalesName] = targetSellOutInput;
    saveSalesSellOutTargets(outTargets);

    setEditingSalesName(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 mb-8 space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Analisa Pencapaian &amp; Peringkat Sales
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Evaluasi target, kuantitas, kontribusi, dan bauran produk per tenaga penjual ({ketFilter === 'ALL' ? 'Konsolidasi' : ketFilter})
          </p>
        </div>

        {/* Filter KET Pills & Total */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </span>
            {[
              { id: 'SELL IN' as const, label: 'SELL IN' },
              { id: 'SELL OUT' as const, label: 'SELL OUT' },
              { id: 'ALL' as const, label: 'Semua / Gabungan' },
            ].map((tab) => {
              const isActive = ketFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setKetFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs">
            Total: {salesData.length} Sales Person
          </div>
        </div>
      </div>

      {/* Dynamic Notification Ribbon for Filter Mode */}
      <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80 flex flex-wrap items-center justify-between text-xs text-indigo-950 gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span className="font-bold">
            Mode Tampilan: {ketFilter === 'SELL IN' ? 'Pencapaian & Target SELL IN (Distributor)' : ketFilter === 'SELL OUT' ? 'Pencapaian & Target SELL OUT (Kasir Gerai)' : 'Konsolidasi Total'}
          </span>
        </div>
        <span className="text-[11px] text-indigo-800">
          Target dapat diedit bebas per sales dengan klik tombol "Ubah Target" pada masing-masing baris.
        </span>
      </div>

      {/* Leaderboard Cards Grid with Gold, Silver, Bronze */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {salesData.slice(0, 3).map((sales, index) => {
          const podiumStyles = [
            {
              card: 'border-amber-300 bg-gradient-to-br from-white via-amber-50/50 to-yellow-50/40 border-t-4 border-t-amber-500 shadow-md',
              badge: 'bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-300 text-amber-950 shadow-xs border border-amber-300',
              label: 'JUARA 1',
              icon: <Trophy className="w-4 h-4 text-amber-600" />,
            },
            {
              card: 'border-slate-300 bg-gradient-to-br from-white via-slate-50/70 to-blue-50/30 border-t-4 border-t-slate-400 shadow-sm',
              badge: 'bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-900 shadow-xs border border-slate-300',
              label: 'JUARA 2',
              icon: <Medal className="w-4 h-4 text-slate-500" />,
            },
            {
              card: 'border-amber-400/80 bg-gradient-to-br from-white via-orange-50/50 to-amber-50/30 border-t-4 border-t-amber-700 shadow-sm',
              badge: 'bg-gradient-to-tr from-amber-700 to-orange-500 text-white shadow-xs border border-amber-600',
              label: 'JUARA 3',
              icon: <Medal className="w-4 h-4 text-amber-700" />,
            },
          ];

          const p = podiumStyles[index] || podiumStyles[1];

          return (
            <div
              key={sales.name}
              className={`p-5 rounded-2xl border ${p.card} flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-0.5`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      {p.icon}
                      {p.label} SALES
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {sales.name}
                    </h3>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${p.badge}`}>
                    #{index + 1}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white/95 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[11px] font-semibold text-slate-500">
                    {ketFilter === 'SELL IN' ? 'Realisasi Sell In:' : ketFilter === 'SELL OUT' ? 'Realisasi Sell Out:' : 'Total Penjualan:'}
                  </div>
                  <div className="text-xl font-extrabold font-mono text-slate-950 tabular-nums">
                    {formatRupiah(sales.totalValue)}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">
                      Target {ketFilter === 'SELL OUT' ? 'Sell Out' : 'Sell In'}:{' '}
                      <strong>{formatRupiah(sales.target || 0, true)}</strong>
                    </span>
                    <span className="font-mono font-extrabold text-emerald-700 tabular-nums">
                      {formatPercent(sales.achievementPercent || 0, false)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, sales.achievementPercent || 0)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Kuantitas:</span>
                      <span className="font-mono font-bold text-slate-900">{formatNumber(sales.totalQty)} pcs</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Kontribusi:</span>
                      <span className="font-mono font-bold text-indigo-700">{formatPercent(sales.contributionPercent, false)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-end">
                <button
                  onClick={() => handleOpenEdit(sales.name)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3 h-3 text-indigo-600" />
                  <span>Ubah Target</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-bold bg-gradient-to-r from-slate-50 to-indigo-50/30">
              <th className="py-3 px-3">No</th>
              <th className="py-3 px-3">Nama Sales</th>
              <th className="py-3 px-3 text-right">
                {ketFilter === 'SELL IN' ? 'Realisasi Sell In (Rp)' : ketFilter === 'SELL OUT' ? 'Realisasi Sell Out (Rp)' : 'Total Penjualan (Rp)'}
              </th>
              <th className="py-3 px-3 text-right bg-indigo-50/50 text-indigo-950 font-black">
                {ketFilter === 'SELL IN' ? 'Target Sell In (Rp)' : ketFilter === 'SELL OUT' ? 'Target Sell Out (Rp)' : 'Target (Rp)'}
              </th>
              <th className="py-3 px-3 w-40 text-center">Pencapaian (%)</th>
              <th className="py-3 px-3 text-right">Kuantitas (QTY)</th>
              <th className="py-3 px-3 text-right">Transaksi</th>
              <th className="py-3 px-3 text-right">Kontribusi</th>
              <th className="py-3 px-3">Bauran Brand Terbesar</th>
              <th className="py-3 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {salesData.map((item, idx) => {
              const topBrand = item.brandBreakdown
                ? Object.entries(item.brandBreakdown).sort((a, b) => b[1] - a[1])[0]
                : null;

              return (
                <tr key={item.name} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {item.name}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-950 tabular-nums">
                    {formatRupiah(item.totalValue)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-indigo-900 bg-indigo-50/30 tabular-nums">
                    {formatRupiah(item.target || 0)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="grow bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, item.achievementPercent || 0)}%` }}
                        />
                      </div>
                      <span className="font-mono font-extrabold text-xs text-emerald-800 w-12 text-right tabular-nums">
                        {formatPercent(item.achievementPercent || 0, false)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums font-bold">
                    {formatNumber(item.totalQty)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                    {item.transactionCount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-700 tabular-nums font-bold">
                    {formatPercent(item.contributionPercent, false)}
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {topBrand ? (
                      <span className="font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300 text-[11px] shadow-2xs">
                        {topBrand[0]} ({formatRupiah(topBrand[1], true)})
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleOpenEdit(item.name)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1 mx-auto cursor-pointer transition-colors"
                      title="Ubah Target Sell In & Target Sell Out"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Ubah</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Target Sales Modal */}
      {editingSalesName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Edit Target Sales: {editingSalesName}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Atur Target Sell In dan Target Sell Out untuk {editingSalesName}
                </p>
              </div>
              <button
                onClick={() => setEditingSalesName(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Target SELL IN (Distributor / Taking Order)
                </label>
                <input
                  type="number"
                  step="any"
                  value={targetSellInInput}
                  onChange={(e) => setTargetSellInInput(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  Terbilang: {formatRupiah(targetSellInInput)}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Target SELL OUT (Realisasi Kasir Gerai Binaan)
                </label>
                <input
                  type="number"
                  step="any"
                  value={targetSellOutInput}
                  onChange={(e) => setTargetSellOutInput(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  Terbilang: {formatRupiah(targetSellOutInput)}
                </span>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                Nilai target ini otomatis disinkronkan ke tabel peringkat sales dan perhitungan pencapaian.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSalesName(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Target</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
