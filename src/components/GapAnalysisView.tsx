import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  Store,
  Package,
  Layers,
  Users,
  CheckCircle2,
  HelpCircle,
  ArrowDownRight,
  ShieldAlert,
  Compass,
  ArrowRight
} from 'lucide-react';
import { SalesGapDiagnosis, DashboardFilters } from '../types/dashboard';
import { formatRupiah, formatNumber, formatPercent } from '../utils/analytics';

interface GapAnalysisViewProps {
  diagnosis: SalesGapDiagnosis;
  filters: DashboardFilters;
}

export const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({
  diagnosis,
  filters,
}) => {
  const [subTab, setSubTab] = useState<'stores' | 'skus' | 'brands' | 'sales'>('stores');

  const {
    totalTarget,
    actualRevenue,
    gapDeficit,
    gapPercentage,
    previousRevenue,
    deltaVsPrevious,
    primaryDrivers,
    topDroppingStores,
    topDroppingSkus,
    topDroppingBrands,
    topDroppingSales,
    currentPeriodName,
    previousPeriodName,
  } = diagnosis;

  return (
    <div className="space-y-6 mb-8">
      {/* 1. Header Banner & Gap Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Analisa Gap &amp; Diagnosa Penyebab Penjualan Turun
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisis komparatif {currentPeriodName} vs {previousPeriodName} untuk mengidentifikasi kebocoran omzet dan rencana aksi perbaikan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-bold tabular-nums">
              Defisit Gap: {formatRupiah(gapDeficit)} ({formatPercent(gapPercentage, false)})
            </span>
          </div>
        </div>

        {/* 4 Key Gap Metric Cards - Rich Colorful Visuals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-white via-indigo-50/70 to-blue-50/40 border border-indigo-200 border-t-4 border-t-indigo-600 shadow-sm hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-indigo-900 block uppercase tracking-wider">
              Target Kuota Penjualan
            </span>
            <div className="text-2xl font-black text-indigo-950 font-mono tabular-nums mt-0.5">
              {formatRupiah(totalTarget)}
            </div>
            <span className="text-xs text-indigo-800 font-medium mt-1 block">
              Sasaran omzet tim periode ini
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-white via-teal-50/70 to-emerald-50/40 border border-teal-200 border-t-4 border-t-teal-600 shadow-sm hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-teal-900 block uppercase tracking-wider">
              Realisasi Penjualan Aktual
            </span>
            <div className="text-2xl font-black text-teal-950 font-mono tabular-nums mt-0.5">
              {formatRupiah(actualRevenue)}
            </div>
            <span className="text-xs text-teal-800 font-semibold mt-1 block">
              Pencapaian: {formatPercent((actualRevenue / (totalTarget || 1)) * 100, false)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-white via-rose-50 to-red-100/60 border border-rose-300 border-t-4 border-t-rose-600 shadow-sm hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-rose-900 block uppercase tracking-wider">
              Total Gap / Defisit Target
            </span>
            <div className="text-2xl font-black text-rose-700 font-mono tabular-nums mt-0.5">
              - {formatRupiah(gapDeficit)}
            </div>
            <span className="text-xs text-rose-800 font-bold mt-1 block">
              Kekurangan omzet yang harus dikejar
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-white via-amber-50 to-orange-100/50 border border-amber-300 border-t-4 border-t-amber-500 shadow-sm hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-amber-900 block uppercase tracking-wider">
              Perubahan vs Periode Lalu
            </span>
            <div
              className={`text-2xl font-black font-mono tabular-nums mt-0.5 ${
                deltaVsPrevious >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {deltaVsPrevious >= 0 ? '+ ' : ''}
              {formatRupiah(deltaVsPrevious)}
            </div>
            <span className="text-xs text-amber-900 font-medium mt-1 block">
              Baseline: {formatRupiah(previousRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Root Cause Attribution (Kenapa Penjualan Bisa Turun?) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              5 Faktor Utama Penyebab Penurunan Penjualan &amp; Rekomendasi Solusi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Rincian bobot dampak penurunan beserta tindakan perbaikan taktis bagi SPV dan Sales
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {primaryDrivers.map((driver, idx) => (
            <div
              key={driver.factor}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-800 leading-snug">
                    {idx + 1}. {driver.factor}
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0 tabular-nums">
                    {driver.percentageOfGap}% Gap
                  </span>
                </div>

                <div className="text-sm font-mono font-extrabold text-rose-700 tabular-nums my-1.5">
                  - {formatRupiah(driver.impactValue)}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {driver.description}
                </p>
              </div>

              {/* Action plan box */}
              <div className="mt-4 pt-3 border-t border-slate-200/70 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-900 block flex items-center gap-1 mb-1">
                  <Compass className="w-3.5 h-3.5 text-emerald-700" />
                  Rencana Tindakan (Action Plan):
                </span>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  {driver.actionPlan}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Deep-Dive Tables: Stores, SKUs, Brands & Sales yang Drop */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Pemeriksaan Detail Entitas yang Mengalami Penurunan
            </h3>
            <p className="text-xs text-slate-500">
              Fokuskan penanganan pada entitas dengan defisit nominal terbesar
            </p>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setSubTab('stores')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                subTab === 'stores'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Toko Drop ({topDroppingStores.length})
            </button>
            <button
              onClick={() => setSubTab('skus')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                subTab === 'skus'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              SKU Drop ({topDroppingSkus.length})
            </button>
            <button
              onClick={() => setSubTab('brands')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                subTab === 'brands'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Brand Drop ({topDroppingBrands.length})
            </button>
            <button
              onClick={() => setSubTab('sales')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                subTab === 'sales'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Sales Drop ({topDroppingSales.length})
            </button>
          </div>
        </div>

        {/* SUBTAB 1: STORES */}
        {subTab === 'stores' && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-2.5 px-3">Nama Store</th>
                  <th className="py-2.5 px-3">Wilayah &amp; PIC Sales</th>
                  <th className="py-2.5 px-3 text-right">Omzet Periode Lalu</th>
                  <th className="py-2.5 px-3 text-right">Omzet Sekarang</th>
                  <th className="py-2.5 px-3 text-right">Penurunan (Rp)</th>
                  <th className="py-2.5 px-3 text-right">Growth (%)</th>
                  <th className="py-2.5 px-3">Diagnosa Utama Penyebab Turun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topDroppingStores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada toko yang mengalami penurunan pada filter saat ini.
                    </td>
                  </tr>
                ) : (
                  topDroppingStores.map((st) => (
                    <tr key={st.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {st.name}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {st.regionOrSales}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {formatRupiah(st.previousValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatRupiah(st.currentValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 tabular-nums">
                        - {formatRupiah(st.deficitValue)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 tabular-nums">
                          {formatPercent(st.growthPercent)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            st.currentValue === 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {st.primaryReason}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 2: SKUS */}
        {subTab === 'skus' && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-2.5 px-3">Nama SKU / Produk</th>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3 text-right">Penjualan Lalu</th>
                  <th className="py-2.5 px-3 text-right">Penjualan Sekarang</th>
                  <th className="py-2.5 px-3 text-right">Penurunan (Rp)</th>
                  <th className="py-2.5 px-3 text-right">Growth (%)</th>
                  <th className="py-2.5 px-3">Diagnosa Masalah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topDroppingSkus.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada SKU yang mengalami penurunan pada filter saat ini.
                    </td>
                  </tr>
                ) : (
                  topDroppingSkus.map((sku) => (
                    <tr key={sku.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800 max-w-sm truncate" title={sku.name}>
                        {sku.name}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {sku.categoryOrBrand}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {formatRupiah(sku.previousValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatRupiah(sku.currentValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 tabular-nums">
                        - {formatRupiah(sku.deficitValue)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 tabular-nums">
                          {formatPercent(sku.growthPercent)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-medium text-slate-700">
                          {sku.primaryReason}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 3: BRANDS */}
        {subTab === 'brands' && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-2.5 px-3">Nama Brand</th>
                  <th className="py-2.5 px-3 text-right">Penjualan Lalu</th>
                  <th className="py-2.5 px-3 text-right">Penjualan Sekarang</th>
                  <th className="py-2.5 px-3 text-right">Defisit Penurunan (Rp)</th>
                  <th className="py-2.5 px-3 text-right">Growth (%)</th>
                  <th className="py-2.5 px-3">Rekomendasi Manajerial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topDroppingBrands.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Seluruh brand membukukan pertumbuhan positif.
                    </td>
                  </tr>
                ) : (
                  topDroppingBrands.map((b) => (
                    <tr key={b.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 text-sm">
                        {b.name}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {formatRupiah(b.previousValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatRupiah(b.currentValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 tabular-nums">
                        - {formatRupiah(b.deficitValue)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 tabular-nums">
                          {formatPercent(b.growthPercent)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        Buat promo bundling brand {b.name} dengan SKU fast moving untuk menstimulasi pengambilan stok oleh toko.
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 4: SALES */}
        {subTab === 'sales' && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-2.5 px-3">Nama Sales Person</th>
                  <th className="py-2.5 px-3 text-right">Penjualan Lalu</th>
                  <th className="py-2.5 px-3 text-right">Penjualan Sekarang</th>
                  <th className="py-2.5 px-3 text-right">Gap Penurunan (Rp)</th>
                  <th className="py-2.5 px-3 text-right">Growth (%)</th>
                  <th className="py-2.5 px-3">Tindakan Supervisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topDroppingSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Seluruh sales person mencapai atau melampaui omzet periode lalu.
                    </td>
                  </tr>
                ) : (
                  topDroppingSales.map((s) => (
                    <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {s.name}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {formatRupiah(s.previousValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatRupiah(s.currentValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 tabular-nums">
                        - {formatRupiah(s.deficitValue)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 tabular-nums">
                          {formatPercent(s.growthPercent)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        SPV perlu mendampingi rute joint-visit untuk membedah toko yang belum order dan memeriksa kendala penagihan / stok.
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
