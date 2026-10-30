import React, { useState, useMemo } from 'react';
import { Calendar, BarChart2, TrendingUp, TrendingDown, Award, Sparkles, LineChart } from 'lucide-react';
import { TimeframeMode } from '../types/dashboard';
import { formatRupiah, formatNumber, formatPercent } from '../utils/analytics';
import { generateForecast, ForecastTrendItem } from '../utils/forecasting';

interface TrendItem {
  label: string;
  subLabel: string;
  value: number;
  qty: number;
  txCount: number;
  dateRef?: string;
}

interface TimeframeTrendChartProps {
  data: TrendItem[];
  mode: TimeframeMode;
  onModeChange: (mode: TimeframeMode) => void;
}

export const TimeframeTrendChart: React.FC<TimeframeTrendChartProps> = ({
  data,
  mode,
  onModeChange,
}) => {
  const [metricType, setMetricType] = useState<'value' | 'qty'>('value');
  const [isForecastEnabled, setIsForecastEnabled] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute linear regression forecasting when enabled
  const forecastAnalysis = useMemo(() => {
    return generateForecast(data, mode, 3);
  }, [data, mode]);

  // Choose between pure historical or combined forecast points
  const displayItems = useMemo<ForecastTrendItem[]>(() => {
    if (isForecastEnabled && forecastAnalysis.combinedItems.length > 0) {
      return forecastAnalysis.combinedItems;
    }
    return data.map((d) => ({ ...d, isForecast: false }));
  }, [isForecastEnabled, forecastAnalysis, data]);

  // Compute period-over-period growth for every display bar
  const itemsWithGrowth = useMemo(() => {
    return displayItems.map((item, idx) => {
      const val = metricType === 'value' ? item.value : item.qty;
      let prevVal = 0;
      let delta = 0;
      let growthPct = 0;
      let hasGrowth = false;

      if (idx > 0) {
        const prevItem = displayItems[idx - 1];
        prevVal = metricType === 'value' ? prevItem.value : prevItem.qty;
        delta = val - prevVal;
        growthPct = prevVal > 0 ? (delta / prevVal) * 100 : 0;
        hasGrowth = true;
      }

      return {
        ...item,
        currentMetricVal: val,
        prevMetricVal: prevVal,
        delta,
        growthPct,
        hasGrowth,
      };
    });
  }, [displayItems, metricType]);

  // Overall timeframe growth momentum summary
  const timeframeGrowthSummary = useMemo(() => {
    if (data.length < 2) {
      return {
        totalGrowthPct: 0,
        totalDelta: 0,
        avgGrowthPct: 0,
        bestPeriod: null,
      };
    }
    const firstVal = metricType === 'value' ? data[0].value : data[0].qty;
    const lastVal = metricType === 'value' ? data[data.length - 1].value : data[data.length - 1].qty;
    const totalDelta = lastVal - firstVal;
    const totalGrowthPct = firstVal > 0 ? (totalDelta / firstVal) * 100 : 0;

    let highestGrowth = -Infinity;
    let bestPeriodLabel = '';
    let sumGrowthPct = 0;
    let countGrowth = 0;

    for (let i = 1; i < data.length; i++) {
      const v = metricType === 'value' ? data[i].value : data[i].qty;
      const prevV = metricType === 'value' ? data[i - 1].value : data[i - 1].qty;
      if (prevV > 0) {
        const pct = ((v - prevV) / prevV) * 100;
        sumGrowthPct += pct;
        countGrowth++;
        if (pct > highestGrowth) {
          highestGrowth = pct;
          bestPeriodLabel = data[i].label;
        }
      }
    }

    return {
      totalGrowthPct,
      totalDelta,
      avgGrowthPct: countGrowth > 0 ? sumGrowthPct / countGrowth : 0,
      bestPeriod: bestPeriodLabel ? { label: bestPeriodLabel, pct: highestGrowth } : null,
    };
  }, [data, metricType]);

  const values = displayItems.map((d) => (metricType === 'value' ? d.value : d.qty));
  const maxValue = Math.max(...values, 1);
  const totalValue = data.reduce((acc, d) => acc + (metricType === 'value' ? d.value : d.qty), 0);
  const avgValue = data.length > 0 ? totalValue / data.length : 0;

  // Find peak index strictly among historical data points
  let peakIndex = 0;
  let peakVal = 0;
  data.forEach((d, idx) => {
    const val = metricType === 'value' ? d.value : d.qty;
    if (val > peakVal) {
      peakVal = val;
      peakIndex = idx;
    }
  });

  const timeframes: { id: TimeframeMode; label: string; desc: string }[] = [
    { id: 'harian', label: 'Harian', desc: 'Per Hari' },
    { id: 'mingguan', label: 'Mingguan', desc: 'W1 - W52' },
    { id: 'bulanan', label: 'Bulanan', desc: 'Jan - Des' },
    { id: 'tahunan', label: 'Tahunan', desc: 'Multi-Tahun' },
  ];

  const activeRegression = metricType === 'value' ? forecastAnalysis.regressionValue : forecastAnalysis.regressionQty;
  const isPacePositive = activeRegression.slope >= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-6">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Tren Pencapaian {timeframes.find((t) => t.id === mode)?.label}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis ritme pertumbuhan {mode === 'harian' ? 'harian' : mode === 'mingguan' ? 'mingguan' : mode === 'bulanan' ? 'bulanan' : 'tahunan'}
          </p>
        </div>

        {/* Timeframe, Metric, and Forecast Switchers */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Timeframe Mode Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg grow sm:grow-0">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => onModeChange(tf.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 grow sm:grow-0 ${
                  mode === tf.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Metric Selector (Value vs QTY) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setMetricType('value')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                metricType === 'value'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nilai (Rp)
            </button>
            <button
              onClick={() => setMetricType('qty')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                metricType === 'qty'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unit (QTY)
            </button>
          </div>

          {/* Forecast Toggle Button */}
          <button
            onClick={() => setIsForecastEnabled(!isForecastEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
              isForecastEnabled
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Prediksi tren penjualan masa depan menggunakan algoritma Regresi Linear"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isForecastEnabled ? 'text-amber-300' : 'text-indigo-600'}`} />
            <span>Forecast</span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                isForecastEnabled ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isForecastEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Summary Micro-Strip with Colorful Gradient Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border border-emerald-200 shadow-2xs">
          <span className="text-emerald-800 font-semibold block text-[11px] uppercase tracking-wide">Total Realisasi Historis:</span>
          <span className="font-extrabold text-emerald-950 font-mono text-base tabular-nums block mt-0.5">
            {metricType === 'value' ? formatRupiah(totalValue) : `${formatNumber(totalValue)} pcs`}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white border border-blue-200 shadow-2xs">
          <span className="text-blue-800 font-semibold block text-[11px] uppercase tracking-wide">
            Rata-rata per {mode === 'harian' ? 'Hari' : mode === 'mingguan' ? 'Minggu' : mode === 'bulanan' ? 'Bulan' : 'Tahun'}:
          </span>
          <span className="font-extrabold text-blue-950 font-mono text-base tabular-nums block mt-0.5">
            {metricType === 'value' ? formatRupiah(avgValue) : `${formatNumber(avgValue)} pcs`}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 via-orange-50/40 to-white border border-amber-200 shadow-2xs">
          <span className="text-amber-800 font-semibold block text-[11px] uppercase tracking-wide flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            Puncak Tertinggi Historis:
          </span>
          <span className="font-extrabold text-amber-950 font-mono text-base tabular-nums block mt-0.5">
            {data[peakIndex]?.label}: {metricType === 'value' ? formatRupiah(peakVal) : `${formatNumber(peakVal)} pcs`}
          </span>
        </div>
      </div>

      {/* Growth Momentum Strip */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-cyan-50/70 border border-emerald-200/90 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-emerald-600 text-white shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-extrabold text-emerald-950 block">
              Indikator Growth ({timeframes.find((t) => t.id === mode)?.label}):
            </span>
            <span className="text-slate-600 text-[11px]">
              Pertumbuhan periode awal ke akhir:{' '}
              <strong className={timeframeGrowthSummary.totalDelta >= 0 ? 'text-emerald-800' : 'text-rose-800'}>
                {timeframeGrowthSummary.totalDelta >= 0 ? '▲ +' : '▼ '}
                {timeframeGrowthSummary.totalGrowthPct.toFixed(1)}% (
                {metricType === 'value'
                  ? formatRupiah(timeframeGrowthSummary.totalDelta)
                  : `${formatNumber(timeframeGrowthSummary.totalDelta)} pcs`}
                )
              </strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-900 font-bold shadow-2xs">
            Laju Rata-rata: {timeframeGrowthSummary.avgGrowthPct >= 0 ? '+' : ''}
            {timeframeGrowthSummary.avgGrowthPct.toFixed(1)}% / {mode === 'mingguan' ? 'minggu' : mode === 'bulanan' ? 'bulan' : 'periode'}
          </span>
          {timeframeGrowthSummary.bestPeriod && (
            <span className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-teal-900 font-bold shadow-2xs">
              Lompatan Tertinggi: {timeframeGrowthSummary.bestPeriod.label} (▲ +{timeframeGrowthSummary.bestPeriod.pct.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Special Forecast Intelligence Panel (When Toggle ON) */}
      {isForecastEnabled && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 via-violet-50/60 to-purple-50/40 border border-indigo-200/90 mb-4 animate-in fade-in duration-200 text-xs shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2.5 border-b border-indigo-200/70">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                <LineChart className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-indigo-950 text-xs block">
                  Proyeksi Tren Regresi Linear (Linear Regression OLS)
                </span>
                <p className="text-[11px] text-indigo-800 font-medium">
                  Model memproyeksikan {forecastAnalysis.projectedPeriodsCount} periode ke depan berdasarkan tren historis data aktif
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-white text-indigo-900 border border-indigo-300 font-bold shadow-2xs">
                Kekuatan Tren (R²): {forecastAnalysis.confidenceScorePercent}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-2.5 rounded-lg bg-white/70 border border-indigo-100">
              <span className="text-indigo-800 font-medium block text-[11px]">Kecepatan Tren (Slope):</span>
              <span
                className={`font-mono font-extrabold text-xs flex items-center gap-1 tabular-nums mt-0.5 ${
                  isPacePositive ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isPacePositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {metricType === 'value'
                  ? `${isPacePositive ? '+' : ''}${formatRupiah(activeRegression.slope)} / periode`
                  : `${isPacePositive ? '+' : ''}${formatNumber(activeRegression.slope)} pcs / periode`}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/70 border border-indigo-100">
              <span className="text-indigo-800 font-medium block text-[11px]">Estimasi Periode Berikutnya:</span>
              <span className="font-mono font-extrabold text-indigo-950 text-xs tabular-nums mt-0.5 block">
                {metricType === 'value'
                  ? formatRupiah(forecastAnalysis.nextPeriodValue)
                  : `${formatNumber(forecastAnalysis.nextPeriodQty)} pcs`}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/70 border border-indigo-100">
              <span className="text-indigo-800 font-medium block text-[11px]">
                Total Akumulasi {forecastAnalysis.projectedPeriodsCount} Periode Depan:
              </span>
              <span className="font-mono font-extrabold text-indigo-950 text-xs tabular-nums mt-0.5 block">
                {metricType === 'value'
                  ? formatRupiah(forecastAnalysis.totalProjectedValue)
                  : `${formatNumber(forecastAnalysis.totalProjectedQty)} pcs`}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/70 border border-indigo-100">
              <span className="text-indigo-800 font-medium block text-[11px]">Arah Proyeksi:</span>
              <span className="font-extrabold text-indigo-950 text-xs mt-0.5 block">
                {activeRegression.trendDirection === 'up'
                  ? '📈 Tren Meningkat (Positif)'
                  : activeRegression.trendDirection === 'down'
                  ? '📉 Tren Menurun (Perlu Waspada)'
                  : '➡️ Tren Mendatar (Stabil)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Responsive SVG Bar & Forecast Visualizer */}
      {displayItems.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm">
          Tidak ada data transaksi untuk rentang filter saat ini.
        </div>
      ) : (
        <div className="relative pt-6">
          {/* Active Hover Tooltip */}
          {hoveredIndex !== null && itemsWithGrowth[hoveredIndex] && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xs text-white px-4 py-2.5 rounded-xl shadow-xl text-xs z-20 pointer-events-none flex items-center gap-3 border border-slate-700">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-100">
                    {itemsWithGrowth[hoveredIndex].subLabel || itemsWithGrowth[hoveredIndex].label}
                  </span>
                  {itemsWithGrowth[hoveredIndex].isForecast && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-2xs">
                      PROYEKSI FORECAST
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-emerald-400 font-mono font-extrabold text-sm tabular-nums">
                    {formatRupiah(itemsWithGrowth[hoveredIndex].value)}
                  </span>
                  <span className="text-slate-300 font-mono text-[11px] tabular-nums">
                    · {formatNumber(itemsWithGrowth[hoveredIndex].qty)} pcs ({itemsWithGrowth[hoveredIndex].txCount} nota est.)
                  </span>
                </div>
                {itemsWithGrowth[hoveredIndex].hasGrowth && (
                  <div className="mt-1 pt-1 border-t border-slate-700/80 flex items-center gap-1.5 text-[11px] font-mono">
                    <span className="text-slate-400">Pertumbuhan vs Sebelumnya:</span>
                    <span
                      className={`font-bold ${
                        itemsWithGrowth[hoveredIndex].delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {itemsWithGrowth[hoveredIndex].delta >= 0 ? '▲ +' : '▼ '}
                      {itemsWithGrowth[hoveredIndex].growthPct.toFixed(1)}% (
                      {metricType === 'value'
                        ? formatRupiah(itemsWithGrowth[hoveredIndex].delta)
                        : `${formatNumber(itemsWithGrowth[hoveredIndex].delta)} pcs`}
                      )
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bar Grid Visualizer with Vibrant Color Gradients & Growth Badges */}
          <div className="flex items-end gap-1.5 sm:gap-2 h-72 w-full pt-10 pb-2 overflow-x-auto no-scrollbar">
            {itemsWithGrowth.map((item, idx) => {
              const val = item.currentMetricVal;
              const heightPercent = maxValue > 0 ? Math.max(4, (val / maxValue) * 100) : 4;
              const isPeak = !item.isForecast && idx === peakIndex;
              const isAboveAvg = !item.isForecast && val >= avgValue;
              const isHovered = idx === hoveredIndex;
              const isForecastBar = Boolean(item.isForecast);

              return (
                <div
                  key={`${item.label}-${idx}`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex-1 min-w-[36px] max-w-[62px] flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Growth Badge on top of each bar */}
                  <div className="mb-1 flex flex-col items-center">
                    {item.hasGrowth ? (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs border leading-none ${
                          item.isForecast
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : item.delta >= 0
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold'
                            : 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold'
                        }`}
                        title={`Pertumbuhan vs periode sebelumnya: ${item.delta >= 0 ? '+' : ''}${item.growthPct.toFixed(1)}%`}
                      >
                        {item.isForecast ? '*' : item.delta >= 0 ? '▲' : '▼'}
                        {item.delta >= 0 ? '+' : ''}{item.growthPct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 leading-none">
                        Base
                      </span>
                    )}

                    {/* Top value badge */}
                    {(isPeak || isHovered || isForecastBar) && (
                      <span
                        className={`text-[10px] font-mono font-bold tabular-nums mt-0.5 truncate max-w-full ${
                          isForecastBar ? 'text-indigo-700' : isPeak ? 'text-emerald-700' : 'text-blue-700'
                        }`}
                      >
                        {metricType === 'value' ? formatRupiah(val, true) : formatNumber(val)}
                      </span>
                    )}
                  </div>

                  {/* Bar column with colorful gradients */}
                  <div className="w-full relative flex items-end justify-center h-full">
                    {isForecastBar ? (
                      // Forecast bar with vibrant purple-indigo gradient
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-md bg-gradient-to-t from-indigo-700 via-indigo-500 to-purple-400 border border-dashed border-indigo-300 hover:brightness-110 shadow-sm shadow-indigo-500/20 transition-all duration-200 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,white_4px,white_8px)]" />
                      </div>
                    ) : isPeak ? (
                      // Peak bar with vibrant emerald-teal gradient
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 shadow-md shadow-emerald-600/25 group-hover:brightness-110 transition-all duration-200"
                      />
                    ) : isAboveAvg ? (
                      // Above average bar with rich ocean blue gradient
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-md bg-gradient-to-t from-blue-600 via-sky-500 to-cyan-400 shadow-xs group-hover:brightness-110 transition-all duration-200"
                      />
                    ) : (
                      // Standard bar with pleasant soft slate-blue gradient
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-md bg-gradient-to-t from-slate-400 via-slate-300 to-sky-200 group-hover:brightness-105 transition-all duration-200"
                      />
                    )}
                  </div>

                  {/* Bottom Label */}
                  <div className="mt-2 text-center w-full">
                    <span
                      className={`block text-[11px] truncate font-bold ${
                        isForecastBar
                          ? 'text-indigo-700'
                          : isPeak
                          ? 'text-emerald-800'
                          : isAboveAvg
                          ? 'text-blue-900'
                          : 'text-slate-600'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend and Status Indicators */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-4 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 border border-emerald-300 text-emerald-900 inline-block font-mono">
                  ▲ +%
                </span>
                Growth Positif
              </span>
              <span className="flex items-center gap-1.5 text-rose-800 font-bold">
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-100 border border-rose-300 text-rose-900 inline-block font-mono">
                  ▼ -%
                </span>
                Growth Negatif
              </span>
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <span className="w-3 h-3 rounded-xs bg-gradient-to-t from-emerald-600 to-teal-400 shadow-2xs inline-block" />
                Puncak Tertinggi ({data[peakIndex]?.label})
              </span>
              <span className="flex items-center gap-1.5 text-blue-800">
                <span className="w-3 h-3 rounded-xs bg-gradient-to-t from-blue-600 to-cyan-400 shadow-2xs inline-block" />
                Di Atas Rata-rata
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-gradient-to-t from-slate-400 to-sky-200 inline-block" />
                Data Historis
              </span>
              {isForecastEnabled && (
                <span className="flex items-center gap-1.5 font-bold text-indigo-700">
                  <span className="w-3 h-3 rounded-xs bg-gradient-to-t from-indigo-600 to-purple-400 border border-dashed border-indigo-700 inline-block shadow-2xs" />
                  Proyeksi Forecast (Regresi Linear)
                </span>
              )}
            </div>
            <span className="font-mono text-slate-600 font-semibold text-xs">
              {displayItems.length} Kolom ({data.length} Realisasi
              {isForecastEnabled ? ` + ${forecastAnalysis.projectedPeriodsCount} Prediksi` : ''})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
