import { TimeframeMode } from '../types/dashboard';
import { MONTH_NAMES_ID, MONTH_ORDER } from './analytics';

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  trendDirection: 'up' | 'down' | 'flat';
}

export interface ForecastTrendItem {
  label: string;
  subLabel: string;
  value: number;
  qty: number;
  txCount: number;
  dateRef?: string;
  isForecast?: boolean;
  trendlineValue?: number;
}

export interface ForecastAnalysis {
  regressionValue: RegressionResult;
  regressionQty: RegressionResult;
  combinedItems: ForecastTrendItem[];
  projectedPeriodsCount: number;
  totalProjectedValue: number;
  totalProjectedQty: number;
  nextPeriodValue: number;
  nextPeriodQty: number;
  confidenceScorePercent: number;
}

/**
 * Computes Ordinary Least Squares (OLS) Linear Regression:
 * y = slope * x + intercept
 */
export function calculateLinearRegression(yValues: number[]): RegressionResult {
  const n = yValues.length;
  if (n < 2) {
    return {
      slope: 0,
      intercept: yValues[0] || 0,
      rSquared: 0,
      trendDirection: 'flat',
    };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = yValues[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return {
      slope: 0,
      intercept: sumY / n,
      rSquared: 0,
      trendDirection: 'flat',
    };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared (coefficient of determination)
  const meanY = sumY / n;
  let ssTotal = 0;
  let ssResidual = 0;

  for (let i = 0; i < n; i++) {
    const y = yValues[i];
    const predictedY = slope * i + intercept;
    ssTotal += Math.pow(y - meanY, 2);
    ssResidual += Math.pow(y - predictedY, 2);
  }

  let rSquared = ssTotal > 0 ? Math.max(0, Math.min(1, 1 - ssResidual / ssTotal)) : 0;

  let trendDirection: 'up' | 'down' | 'flat' = 'flat';
  if (Math.abs(slope) > 0.001) {
    trendDirection = slope > 0 ? 'up' : 'down';
  }

  return {
    slope,
    intercept,
    rSquared,
    trendDirection,
  };
}

/**
 * Generate future labels based on current timeframe mode and last historical item
 */
function generateFutureLabels(
  lastItem: ForecastTrendItem,
  mode: TimeframeMode,
  stepIndex: number
): { label: string; subLabel: string } {
  const step = stepIndex + 1;

  if (mode === 'harian') {
    if (lastItem.dateRef) {
      const d = new Date(lastItem.dateRef);
      if (!isNaN(d.getTime())) {
        const nextDate = new Date(d);
        nextDate.setDate(d.getDate() + step);
        const dayStr = nextDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const weekdayStr = nextDate.toLocaleDateString('id-ID', { weekday: 'short' });
        return {
          label: `${dayStr}*`,
          subLabel: `Est. ${weekdayStr} (+${step}h)`,
        };
      }
    }
    return {
      label: `+${step} Hari*`,
      subLabel: `Estimasi Hari +${step}`,
    };
  }

  if (mode === 'mingguan') {
    // Attempt to extract week number
    const match = lastItem.label.match(/\d+/);
    const lastWeek = match ? parseInt(match[0], 10) : 39;
    const nextWeek = lastWeek + step;
    return {
      label: `W${nextWeek}*`,
      subLabel: `Proyeksi Week ${nextWeek}`,
    };
  }

  if (mode === 'bulanan') {
    const rawMonth = (lastItem.subLabel || lastItem.label).toUpperCase();
    let monthIdx = MONTH_ORDER[rawMonth];
    if (!monthIdx) {
      const foundKey = Object.keys(MONTH_ORDER).find((k) => k.startsWith(rawMonth.slice(0, 3)));
      monthIdx = foundKey ? MONTH_ORDER[foundKey] : 9;
    }
    const nextMonthIdx = ((monthIdx - 1 + step) % 12) + 1;
    const nextMonthName = MONTH_NAMES_ID[nextMonthIdx - 1];
    return {
      label: `${nextMonthName.slice(0, 3)}*`,
      subLabel: `Proyeksi ${nextMonthName}`,
    };
  }

  // Tahunan
  const match = lastItem.label.match(/\d+/);
  const lastYear = match ? parseInt(match[0], 10) : 2026;
  const nextYear = lastYear + step;
  return {
    label: `${nextYear}*`,
    subLabel: `Proyeksi Tahun ${nextYear}`,
  };
}

/**
 * Predicts future trend points based on linear regression
 */
export function generateForecast(
  data: ForecastTrendItem[],
  mode: TimeframeMode,
  forecastSteps: number = 3
): ForecastAnalysis {
  if (data.length === 0) {
    const emptyReg: RegressionResult = { slope: 0, intercept: 0, rSquared: 0, trendDirection: 'flat' };
    return {
      regressionValue: emptyReg,
      regressionQty: emptyReg,
      combinedItems: [],
      projectedPeriodsCount: 0,
      totalProjectedValue: 0,
      totalProjectedQty: 0,
      nextPeriodValue: 0,
      nextPeriodQty: 0,
      confidenceScorePercent: 0,
    };
  }

  const values = data.map((d) => d.value);
  const quantities = data.map((d) => d.qty);

  const regressionValue = calculateLinearRegression(values);
  const regressionQty = calculateLinearRegression(quantities);

  // Historical items with calculated trendline values
  const historicalItems: ForecastTrendItem[] = data.map((item, idx) => ({
    ...item,
    isForecast: false,
    trendlineValue: Math.max(0, regressionValue.slope * idx + regressionValue.intercept),
  }));

  // Determine forecast step count based on mode
  let steps = forecastSteps;
  if (mode === 'tahunan') steps = Math.min(2, forecastSteps);
  if (mode === 'harian') steps = Math.min(4, Math.max(2, forecastSteps));

  const n = data.length;
  const lastItem = data[data.length - 1];
  const projectedItems: ForecastTrendItem[] = [];

  let totalProjectedValue = 0;
  let totalProjectedQty = 0;

  for (let s = 0; s < steps; s++) {
    const futureIndex = n + s;
    const projectedValue = Math.max(0, Math.round(regressionValue.slope * futureIndex + regressionValue.intercept));
    const projectedQty = Math.max(0, Math.round(regressionQty.slope * futureIndex + regressionQty.intercept));
    const { label, subLabel } = generateFutureLabels(lastItem, mode, s);

    totalProjectedValue += projectedValue;
    totalProjectedQty += projectedQty;

    projectedItems.push({
      label,
      subLabel,
      value: projectedValue,
      qty: projectedQty,
      txCount: Math.round(lastItem.txCount * (projectedQty / (lastItem.qty || 1))),
      isForecast: true,
      trendlineValue: projectedValue,
    });
  }

  const nextPeriodValue = projectedItems[0]?.value || 0;
  const nextPeriodQty = projectedItems[0]?.qty || 0;

  const confidenceScorePercent = Math.round(regressionValue.rSquared * 100);

  return {
    regressionValue,
    regressionQty,
    combinedItems: [...historicalItems, ...projectedItems],
    projectedPeriodsCount: steps,
    totalProjectedValue,
    totalProjectedQty,
    nextPeriodValue,
    nextPeriodQty,
    confidenceScorePercent,
  };
}
