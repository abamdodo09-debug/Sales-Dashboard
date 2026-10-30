import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PackageCheck,
  Receipt,
  ShoppingCart,
  RotateCcw,
  Target,
  Sparkles,
} from 'lucide-react';
import { MetricSummary, GrowthMetric } from '../types/dashboard';
import { formatRupiah, formatNumber, formatPercent } from '../utils/analytics';

interface KpiCardsProps {
  summary: MetricSummary;
  growth: GrowthMetric;
  comparisonLabel: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  summary,
  growth,
  comparisonLabel,
}) => {
  const isPositiveGrowth = growth.growthPercent >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
      {/* 1. Total Net Sales Value - Emerald Emerald Emerald */}
      <div className="bg-gradient-to-b from-white to-emerald-50/60 p-4 rounded-xl border border-emerald-200/90 shadow-sm border-t-4 border-t-emerald-600 flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
        <div>
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Total Penjualan
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-mono tabular-nums leading-tight">
            {formatRupiah(summary.totalRevenue, true)}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5 truncate font-medium" title={formatRupiah(summary.totalRevenue)}>
            {formatRupiah(summary.totalRevenue)}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 truncate" title={comparisonLabel}>
            vs {comparisonLabel}
          </span>
          <span
            className={`font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.2 rounded tabular-nums ${
              isPositiveGrowth
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {isPositiveGrowth ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {formatPercent(growth.growthPercent)}
          </span>
        </div>
      </div>

      {/* 2. Total Kuantitas (QTY) - Ocean Blue */}
      <div className="bg-gradient-to-b from-white to-blue-50/60 p-4 rounded-xl border border-blue-200/90 shadow-sm border-t-4 border-t-blue-600 flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
        <div>
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Total Unit (QTY)
            </span>
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-950 font-mono tabular-nums leading-tight">
            {formatNumber(summary.totalQty)}
          </div>
          <div className="text-xs text-blue-700 font-medium mt-0.5">
            Pcs terjual
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Volume</span>
          <span
            className={`font-mono font-bold px-1.5 py-0.2 rounded tabular-nums ${
              growth.growthQtyPercent >= 0
                ? 'bg-blue-100 text-blue-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {formatPercent(growth.growthQtyPercent)}
          </span>
        </div>
      </div>

      {/* 3. Total Transaksi - Royal Purple */}
      <div className="bg-gradient-to-b from-white to-purple-50/60 p-4 rounded-xl border border-purple-200/90 shadow-sm border-t-4 border-t-purple-600 flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
        <div>
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
              Total Transaksi
            </span>
            <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-950 font-mono tabular-nums leading-tight">
            {formatNumber(summary.totalTransactions)}
          </div>
          <div className="text-xs text-purple-700 font-medium mt-0.5">
            Nota order tercatat
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
          <span>Keaktifan</span>
          <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">100% Aktif</span>
        </div>
      </div>

      {/* 4. Rata-rata Nilai Order (AOV) - Sunset Amber */}
      <div className="bg-gradient-to-b from-white to-amber-50/60 p-4 rounded-xl border border-amber-200/90 shadow-sm border-t-4 border-t-amber-500 flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
        <div>
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              AOV (Rata-rata)
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-950 font-mono tabular-nums leading-tight">
            {formatRupiah(summary.averageOrderValue, true)}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5 truncate font-medium" title={formatRupiah(summary.averageOrderValue)}>
            {formatRupiah(summary.averageOrderValue)}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center justify-between text-xs text-slate-500">
          <span>Per transaksi</span>
          <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">Net Nilai</span>
        </div>
      </div>

      {/* 5. Nilai & Rasio Retur - Coral Rose */}
      <div className="bg-gradient-to-b from-white to-rose-50/60 p-4 rounded-xl border border-rose-200/90 shadow-sm border-t-4 border-t-rose-600 flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
        <div>
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Nilai Retur
            </span>
            <div className="p-1.5 rounded-lg bg-rose-600 text-white shadow-xs">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600 font-mono tabular-nums leading-tight">
            {formatRupiah(summary.totalReturnRevenue, true)}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5 truncate font-medium" title={formatRupiah(summary.totalReturnRevenue)}>
            {formatRupiah(summary.totalReturnRevenue)}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Rasio Retur</span>
          <span
            className={`font-mono font-bold px-1.5 py-0.2 rounded tabular-nums ${
              summary.returnRatePercent > 3 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {formatPercent(summary.returnRatePercent, false)}
          </span>
        </div>
      </div>

      {/* 6. Pencapaian Target - Radiant Cyan / Teal */}
      <div className="bg-gradient-to-b from-white to-teal-50/60 p-4 rounded-xl border border-teal-200/90 shadow-sm border-t-4 border-t-teal-600 flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
        <div>
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              Pencapaian Target
            </span>
            <div className="p-1.5 rounded-lg bg-teal-600 text-white shadow-xs">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-teal-950 font-mono tabular-nums leading-tight">
            92,4%
          </div>
          <div className="text-xs text-teal-700 font-medium mt-0.5">
            Target: {formatRupiah(summary.totalRevenue * 1.08, true)}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-teal-100">
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 h-full rounded-full transition-all duration-500"
              style={{ width: '92.4%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
