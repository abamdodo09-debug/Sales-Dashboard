import React from 'react';
import { Building2, Users2, MapPin, Award, CheckCircle } from 'lucide-react';
import { TransactionRecord } from '../types/dashboard';
import { aggregateByDimension, formatRupiah, formatNumber, formatPercent } from '../utils/analytics';

interface SpvAnalysisProps {
  records: TransactionRecord[];
}

export const SpvAnalysis: React.FC<SpvAnalysisProps> = ({ records }) => {
  const spvData = aggregateByDimension(records, 'SPV');

  // Compute team members & regions per SPV
  const spvTeamMap: Record<string, { sales: Set<string>; regions: Set<string>; stores: Set<string> }> = {};
  records.forEach((r) => {
    if (!spvTeamMap[r.SPV]) {
      spvTeamMap[r.SPV] = { sales: new Set(), regions: new Set(), stores: new Set() };
    }
    if (r.SALES) spvTeamMap[r.SPV].sales.add(r.SALES);
    if (r.REGION) spvTeamMap[r.SPV].regions.add(r.REGION);
    if (r.NAMA_STORE) spvTeamMap[r.SPV].stores.add(r.NAMA_STORE);
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              Analisa Pencapaian SPV (Supervisor)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Konsolidasi performa tim penjualan, cakupan wilayah, dan kontribusi per Supervisor
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-purple-900 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 shadow-2xs">
          {spvData.length} Supervisor Aktif
        </div>
      </div>

      {/* SPV Cards Grid with Rich Color Accents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-6">
        {spvData.map((spv) => {
          const teamInfo = spvTeamMap[spv.name] || { sales: new Set(), regions: new Set(), stores: new Set() };
          const salesCount = teamInfo.sales.size;
          const avgPerSales = salesCount > 0 ? spv.totalValue / salesCount : 0;
          const initials = spv.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          return (
            <div
              key={spv.name}
              className="p-5 rounded-2xl border border-purple-200/90 bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/20 border-t-4 border-t-purple-600 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm shadow-purple-500/20">
                      {initials}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                        Supervisor Area
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                        {spv.name}
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
                    {formatPercent(spv.contributionPercent, false)} Share
                  </span>
                </div>

                <div className="mt-4 p-3.5 bg-white/90 rounded-xl border border-purple-100 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Total Omzet Tim:</div>
                  <div className="text-2xl font-black font-mono text-purple-950 tabular-nums">
                    {formatRupiah(spv.totalValue)}
                  </div>
                  <div className="text-xs text-purple-800 font-mono font-medium mt-1">
                    {formatNumber(spv.totalQty)} pcs terjual ({spv.transactionCount} nota)
                  </div>
                </div>

                {/* Team meta */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Users2 className="w-3.5 h-3.5 text-indigo-500" />
                      Anggota Tim Sales:
                    </span>
                    <span className="font-bold text-slate-800">
                      {salesCount} Sales ({Array.from(teamInfo.sales).slice(0, 2).join(', ')}{salesCount > 2 ? '...' : ''})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      Wilayah / Region:
                    </span>
                    <span className="font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[11px]">
                      {Array.from(teamInfo.regions).join(', ') || 'PEKAN BARU'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500 font-medium">Cakupan Gerai:</span>
                    <span className="font-bold text-slate-800">
                      {teamInfo.stores.size} Outlet Aktif
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-purple-100">
                    <span className="text-slate-500 font-medium">Produktivitas / Sales:</span>
                    <span className="font-mono font-extrabold text-indigo-950">
                      {formatRupiah(avgPerSales, true)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-100">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-medium">Pencapaian Kuota Tim</span>
                  <span className="font-mono font-extrabold text-purple-900">
                    {formatPercent(spv.achievementPercent || 90, false)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 h-full rounded-full transition-all duration-500 shadow-2xs"
                    style={{ width: `${Math.min(100, spv.achievementPercent || 90)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
