import React from 'react';
import { Store, TrendingUp, Award, MapPin, Building } from 'lucide-react';
import { TransactionRecord } from '../types/dashboard';
import { aggregateByDimension, formatRupiah, formatNumber, formatPercent } from '../utils/analytics';

interface StoreAnalysisProps {
  records: TransactionRecord[];
}

export const StoreAnalysis: React.FC<StoreAnalysisProps> = ({ records }) => {
  const storeData = aggregateByDimension(records, 'NAMA_STORE');

  // Compute region and sales servicing each store
  const storeMetaMap: Record<string, { region: string; sales: Set<string> }> = {};
  records.forEach((r) => {
    if (!storeMetaMap[r.NAMA_STORE]) {
      storeMetaMap[r.NAMA_STORE] = { region: r.REGION, sales: new Set() };
    }
    if (r.SALES) storeMetaMap[r.NAMA_STORE].sales.add(r.SALES);
  });

  // Calculate cumulative Pareto share
  let runningTotal = 0;
  const grandTotal = storeData.reduce((acc, s) => acc + s.totalValue, 0);

  const enrichedStores = storeData.map((store) => {
    runningTotal += store.totalValue;
    const cumulativePct = grandTotal > 0 ? (runningTotal / grandTotal) * 100 : 0;
    let paretoClass = 'Kelas A (Pilar)';
    let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';

    if (cumulativePct > 95) {
      paretoClass = 'Kelas C';
      badgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
    } else if (cumulativePct > 80) {
      paretoClass = 'Kelas B';
      badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
    }

    return {
      ...store,
      cumulativePct,
      paretoClass,
      badgeColor,
      meta: storeMetaMap[store.name] || { region: 'PEKAN BARU', sales: new Set() },
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              Analisa Performa &amp; Klasifikasi Store (Toko)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Analisis Pareto 80/20, kontribusi omzet per gerai kosmetik dan DC ritel
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs">
          {storeData.length} Store Terdaftar
        </div>
      </div>

      {/* Pareto Classification Highlights - Vibrant Dual Tones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="p-4 rounded-2xl border border-amber-300 bg-gradient-to-br from-white via-amber-50/60 to-yellow-50/40 border-t-4 border-t-amber-500 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Kelas A (Pilar 80%)
            </span>
            <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-amber-300 text-amber-900 shadow-2xs">
              Top Kontributor
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Store penyumbang volume dan omzet utama. Prioritas pelayanan dan ketersediaan stok produk focus.
          </p>
          <div className="mt-3 font-mono font-black text-2xl text-amber-950">
            {enrichedStores.filter((s) => s.paretoClass.includes('Kelas A')).length} Store
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-blue-300 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/40 border-t-4 border-t-blue-600 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              Kelas B (15% Berikutnya)
            </span>
            <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-blue-300 text-blue-900 shadow-2xs">
              Potensial Berkembang
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Store dengan potensi upselling bauran brand baru (barenbliss, lavojoy, DAZZLE ME).
          </p>
          <div className="mt-3 font-mono font-black text-2xl text-blue-950">
            {enrichedStores.filter((s) => s.paretoClass === 'Kelas B').length} Store
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-purple-300 bg-gradient-to-br from-white via-purple-50/60 to-fuchsia-50/40 border-t-4 border-t-purple-600 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
              Kelas C (Long Tail)
            </span>
            <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-purple-300 text-purple-900 shadow-2xs">
              Perlu Evaluasi
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Store dengan frekuensi transaksi rendah. Perlu evaluasi rute kunjungan sales atau penyesuaian SKU.
          </p>
          <div className="mt-3 font-mono font-black text-2xl text-purple-950">
            {enrichedStores.filter((s) => s.paretoClass === 'Kelas C').length} Store
          </div>
        </div>
      </div>

      {/* Store Ranking Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50/80">
              <th className="py-2.5 px-3">No</th>
              <th className="py-2.5 px-3">Nama Store</th>
              <th className="py-2.5 px-3">Region</th>
              <th className="py-2.5 px-3">Klasifikasi</th>
              <th className="py-2.5 px-3 text-right">Total Penjualan (Rp)</th>
              <th className="py-2.5 px-3 text-right">Kuantitas (QTY)</th>
              <th className="py-2.5 px-3 text-right">Transaksi</th>
              <th className="py-2.5 px-3 text-right">Kontribusi</th>
              <th className="py-2.5 px-3">Sales PIC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {enrichedStores.map((store, idx) => (
              <tr key={store.name} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3">
                  <span className={`w-6 h-6 rounded-lg font-mono text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                    idx === 0
                      ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 shadow-2xs border border-amber-300'
                      : idx === 1
                      ? 'bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-900 shadow-2xs border border-slate-300'
                      : idx === 2
                      ? 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-2xs border border-amber-500'
                      : 'bg-slate-100 text-slate-600 font-bold'
                  }`}>
                    {idx + 1}
                  </span>
                </td>
                <td className="py-3 px-3 font-extrabold text-slate-900">
                  {store.name}
                </td>
                <td className="py-3 px-3 text-slate-600 font-medium">
                  {store.meta.region}
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${store.badgeColor}`}>
                    {store.paretoClass}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                  {formatRupiah(store.totalValue)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                  {formatNumber(store.totalQty)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                  {store.transactionCount}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums font-semibold">
                  {formatPercent(store.contributionPercent, false)}
                </td>
                <td className="py-3 px-3 text-slate-600">
                  {Array.from(store.meta.sales).join(', ') || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
