import React from 'react';
import { Layers, Sparkles, TrendingUp, Package, BarChart2, Star } from 'lucide-react';
import { TransactionRecord } from '../types/dashboard';
import { aggregateByDimension, formatRupiah, formatNumber, formatPercent } from '../utils/analytics';

interface BrandAnalysisProps {
  records: TransactionRecord[];
}

export const BrandAnalysis: React.FC<BrandAnalysisProps> = ({ records }) => {
  const brandData = aggregateByDimension(records, 'BRAND');
  const maxBrandValue = Math.max(...brandData.map((b) => b.totalValue), 1);

  // Vibrant Brand visual themes
  const brandThemes: Record<string, {
    cardBg: string;
    text: string;
    barGradient: string;
    badgeGradient: string;
    borderTop: string;
    borderColor: string;
    tagline: string;
  }> = {
    'barenbliss': {
      cardBg: 'bg-gradient-to-br from-white via-rose-50/50 to-pink-100/40',
      text: 'text-rose-950',
      barGradient: 'bg-gradient-to-r from-rose-500 to-pink-500',
      badgeGradient: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white',
      borderTop: 'border-t-rose-500',
      borderColor: 'border-rose-200 hover:border-rose-300',
      tagline: 'K-Beauty Joyful & Clean',
    },
    'Y.O.U': {
      cardBg: 'bg-gradient-to-br from-white via-blue-50/50 to-indigo-100/40',
      text: 'text-blue-950',
      barGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      badgeGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
      borderTop: 'border-t-blue-600',
      borderColor: 'border-blue-200 hover:border-blue-300',
      tagline: 'Radiant Skincare & Makeup',
    },
    'DAZZLE ME': {
      cardBg: 'bg-gradient-to-br from-white via-amber-50/50 to-orange-100/40',
      text: 'text-amber-950',
      barGradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
      badgeGradient: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      borderTop: 'border-t-amber-500',
      borderColor: 'border-amber-200 hover:border-amber-300',
      tagline: 'Bold & Trendy Expression',
    },
    'GLAMFIX': {
      cardBg: 'bg-gradient-to-br from-white via-purple-50/50 to-fuchsia-100/40',
      text: 'text-purple-950',
      barGradient: 'bg-gradient-to-r from-purple-600 to-fuchsia-600',
      badgeGradient: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white',
      borderTop: 'border-t-purple-600',
      borderColor: 'border-purple-200 hover:border-purple-300',
      tagline: 'Beauty Tools & Lash Specialist',
    },
    'lavojoy': {
      cardBg: 'bg-gradient-to-br from-white via-emerald-50/50 to-teal-100/40',
      text: 'text-emerald-950',
      barGradient: 'bg-gradient-to-r from-emerald-600 to-teal-500',
      badgeGradient: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
      borderTop: 'border-t-emerald-600',
      borderColor: 'border-emerald-200 hover:border-emerald-300',
      tagline: 'Botanical Body & Hair Care',
    },
  };

  // Find top SKU per brand
  const topSkuPerBrand: Record<string, { sku: string; value: number }> = {};
  records.forEach((r) => {
    if (!topSkuPerBrand[r.BRAND] || (r.VALUE || 0) > topSkuPerBrand[r.BRAND].value) {
      topSkuPerBrand[r.BRAND] = { sku: r.SKU, value: r.VALUE || 0 };
    }
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              Analisa Pangsa &amp; Performa Brand Kosmetik
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Evaluasi bauran portofolio brand kosmetik: barenbliss, Y.O.U, DAZZLE ME, GLAMFIX, lavojoy
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-slate-700 bg-gradient-to-r from-slate-100 to-pink-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          {brandData.length} Brand Kosmetik Aktif
        </div>
      </div>

      {/* Visual Brand Market Share Segment Bar */}
      <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Komposisi Pangsa Pasar (Market Share Portofolio)
          </span>
          <span className="text-slate-500 font-mono font-bold">100% Total Kontribusi</span>
        </div>
        <div className="h-7 w-full rounded-xl overflow-hidden flex shadow-inner bg-slate-200 p-0.5 gap-0.5">
          {brandData.map((brand) => {
            const theme = brandThemes[brand.name] || { barGradient: 'bg-slate-500' };
            const pct = brand.contributionPercent;
            if (pct < 1) return null;
            return (
              <div
                key={brand.name}
                style={{ width: `${pct}%` }}
                className={`${theme.barGradient} h-full rounded-lg transition-all duration-300 relative group flex items-center justify-center shadow-xs cursor-pointer hover:brightness-110`}
                title={`${brand.name}: ${formatPercent(pct, false)} (${formatRupiah(brand.totalValue)})`}
              >
                {pct >= 8 && (
                  <span className="text-[11px] font-extrabold text-white tracking-wide truncate px-1 drop-shadow-xs">
                    {brand.name} ({pct.toFixed(0)}%)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand Cards Grid with Full Vibrant Identities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {brandData.map((brand) => {
          const theme = brandThemes[brand.name] || {
            cardBg: 'bg-white',
            text: 'text-slate-900',
            barGradient: 'bg-slate-600',
            badgeGradient: 'bg-slate-700 text-white',
            borderTop: 'border-t-slate-500',
            borderColor: 'border-slate-200',
            tagline: 'Brand Kosmetik',
          };
          const topSku = topSkuPerBrand[brand.name]?.sku || '-';
          const avgPrice = brand.totalQty > 0 ? brand.totalValue / brand.totalQty : 0;

          return (
            <div
              key={brand.name}
              className={`p-5 rounded-2xl border ${theme.borderColor} ${theme.cardBg} border-t-4 ${theme.borderTop} flex flex-col justify-between shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                      {brand.name}
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {theme.tagline}
                    </span>
                  </div>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${theme.badgeGradient} shadow-2xs`}>
                    {formatPercent(brand.contributionPercent, false)} Share
                  </span>
                </div>

                <div className="mt-4 p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Penjualan:</div>
                  <div className="text-2xl font-extrabold font-mono text-slate-950 tabular-nums">
                    {formatRupiah(brand.totalValue)}
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5 font-medium">
                    {formatNumber(brand.totalQty)} pcs · {brand.transactionCount} transaksi
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                    <span className="text-slate-500 font-medium">Rata-rata Harga / Pcs:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatRupiah(avgPrice)}
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500 font-medium block mb-1">SKU Terlaris (Hero):</span>
                    <span className="text-slate-900 font-bold block truncate text-[11px] bg-white/70 px-2 py-1 rounded border border-slate-200/60" title={topSku}>
                      {topSku}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-2">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                  <span>Kontribusi Relatif</span>
                  <span className="font-mono">{formatPercent((brand.totalValue / maxBrandValue) * 100, false)}</span>
                </div>
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`${theme.barGradient} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${(brand.totalValue / maxBrandValue) * 100}%` }}
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
