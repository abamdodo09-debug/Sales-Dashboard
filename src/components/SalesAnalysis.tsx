import React from 'react';
import { Users, Award, TrendingUp, CheckCircle2, DollarSign, Package, Trophy, Medal } from 'lucide-react';
import { TransactionRecord } from '../types/dashboard';
import { aggregateByDimension, formatRupiah, formatNumber, formatPercent } from '../utils/analytics';

interface SalesAnalysisProps {
  records: TransactionRecord[];
}

export const SalesAnalysis: React.FC<SalesAnalysisProps> = ({ records }) => {
  const salesData = aggregateByDimension(records, 'SALES');

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              Analisa Pencapaian &amp; Peringkat Sales
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Evaluasi target, kuantitas, kontribusi, dan bauran produk per tenaga penjual
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs">
          Total: {salesData.length} Sales Person
        </div>
      </div>

      {/* Leaderboard Cards Grid with Gold, Silver, Bronze */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-6">
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
                  <div className="text-[11px] font-semibold text-slate-500">Pencapaian Realisasi:</div>
                  <div className="text-xl font-extrabold font-mono text-slate-950 tabular-nums">
                    {formatRupiah(sales.totalValue)}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Target: {formatRupiah(sales.target || 0, true)}</span>
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
            </div>
          );
        })}
      </div>

      {/* Comprehensive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-gradient-to-r from-slate-50 to-indigo-50/30">
              <th className="py-2.5 px-3">No</th>
              <th className="py-2.5 px-3">Nama Sales</th>
              <th className="py-2.5 px-3 text-right">Total Penjualan (Rp)</th>
              <th className="py-2.5 px-3 text-right">Target (Rp)</th>
              <th className="py-2.5 px-3 w-40">Pencapaian (%)</th>
              <th className="py-2.5 px-3 text-right">Kuantitas (QTY)</th>
              <th className="py-2.5 px-3 text-right">Transaksi</th>
              <th className="py-2.5 px-3 text-right">Kontribusi</th>
              <th className="py-2.5 px-3">Bauran Brand Terbesar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {salesData.map((item, idx) => {
              const topBrand = item.brandBreakdown
                ? Object.entries(item.brandBreakdown).sort((a, b) => b[1] - a[1])[0]
                : null;

              return (
                <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {item.name}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-950 tabular-nums">
                    {formatRupiah(item.totalValue)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500 tabular-nums">
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
