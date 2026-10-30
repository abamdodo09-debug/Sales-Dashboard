import { TransactionRecord, ProfitAreaSummary, ProfitItemBreakdown, ProfitStoreItem } from '../types/dashboard';
import { aggregateAreaCost } from './costCalculations';

/**
 * KALKULASI PROFIT AREA (P&L PORTFOLIO):
 * - Realisasi Sell In: Total omset penjualan Sell In area
 * - Margin Kotor: Realisasi Sell In x 55%
 * - Biaya Operasional: Realisasi Sell In x 33%
 * - Biaya Gaji: Total Beban Gaji Karyawan (Gaji Pokok & Insentif Sales + BA)
 * - Total Biaya: Biaya Operasional (33%) + Biaya Gaji Karyawan
 * - Sisa Profit: Margin Kotor - Total Biaya
 * - % Sisa Profit vs Sell In: (Sisa Profit / Realisasi Sell In) x 100%
 * - % Sisa Profit vs Margin: (Sisa Profit / Margin) x 100%
 * - Break-Even Point (BEP) Sell In: Biaya Gaji / (55% - 33%) = Biaya Gaji / 22%
 *
 * PROFITABILITAS PER OUTLET / NAMA STORE:
 * - Memasukkan biaya gaji BA yang ada di toko tersebut (Pokok + Insentif Non-Lavojoy + Insentif Lavojoy 4%)
 * - Beban Toko = Biaya Operasional 33% + Biaya Gaji BA Toko
 * - Sisa Profit Toko = Margin 55% - Beban Toko
 */
export function calculateProfitArea(
  records: TransactionRecord[],
  marginRate: number = 0.55,
  operatingCostRate: number = 0.33,
  customSalesTargets: Record<string, number> = {},
  customBaNonLavojoyTargets: Record<string, number> = {},
  customBaLavojoyTargets: Record<string, number> = {},
  customSalesBonuses: Record<string, number> = {},
  customSalesPenalties: Record<string, number> = {},
  defaultSalesTarget: number = 150000000,
  defaultBaNonLavojoyTarget: number = 30000000,
  defaultBaLavojoyTarget: number = 5000000
): ProfitAreaSummary {
  // 1. Dapatkan agregasi beban gaji dari modul Cost Area
  const costData = aggregateAreaCost(
    records,
    customSalesTargets,
    customBaNonLavojoyTargets,
    customBaLavojoyTargets,
    customSalesBonuses,
    customSalesPenalties,
    defaultSalesTarget,
    defaultBaNonLavojoyTarget,
    defaultBaLavojoyTarget
  );

  // 2. Hitung Realisasi Sell In
  const sellInRecords = records.filter((r) => r.KET === 'SELL IN');
  const sellInFromRecords = sellInRecords.reduce((acc, r) => acc + (r.VALUE || 0), 0);
  const salesSellInSum = costData.salesList.reduce((acc, s) => acc + s.sellInActual, 0);

  // Gunakan nilai Sell In riil yang paling akurat
  const sellInActual = sellInFromRecords > 0
    ? sellInFromRecords
    : salesSellInSum > 0
    ? salesSellInSum
    : costData.totalAreaRevenue;

  // 3. Margin 55%
  const marginPercent = marginRate * 100;
  const marginValue = Math.round(sellInActual * marginRate);

  // 4. Biaya Operasional 33%
  const operatingCostPercent = operatingCostRate * 100;
  const operatingCostValue = Math.round(sellInActual * operatingCostRate);

  // 5. Beban Gaji Karyawan Area (Sales + BA)
  const salaryCost = costData.totalCost;
  const totalSalesSalary = costData.totalSalesCost;
  const totalBaSalary = costData.totalBaCost;

  // 6. Total Beban Pengurang = Biaya 33% + Biaya Gaji
  const totalExpense = operatingCostValue + salaryCost;

  // 7. Sisa Profit yang Tersedia
  const remainingProfitValue = marginValue - totalExpense;

  // 8. Persentase Sisa Profit
  const remainingProfitPercentSellIn = sellInActual > 0
    ? (remainingProfitValue / sellInActual) * 100
    : 0;

  const remainingProfitPercentMargin = marginValue > 0
    ? (remainingProfitValue / marginValue) * 100
    : 0;

  // 9. Titik Impas (Break-Even Point) Sell In
  const netMarginDiffPercent = (marginRate - operatingCostRate) * 100; // 22%
  const netSpreadRate = marginRate - operatingCostRate;
  const breakEvenPointSellIn = netSpreadRate > 0
    ? Math.round(salaryCost / netSpreadRate)
    : 0;

  // 10. Status Profitabilitas
  let profitStatus: 'excellent' | 'healthy' | 'warning' | 'deficit' = 'deficit';
  if (remainingProfitPercentSellIn >= 10) {
    profitStatus = 'excellent';
  } else if (remainingProfitPercentSellIn >= 5) {
    profitStatus = 'healthy';
  } else if (remainingProfitPercentSellIn >= 0) {
    profitStatus = 'warning';
  } else {
    profitStatus = 'deficit';
  }

  // 11. Breakdown Profit per Sales Representative
  const profitBySales: ProfitItemBreakdown[] = costData.salesList.map((sales) => {
    const sSellIn = sales.sellInActual;
    const sMargin = Math.round(sSellIn * marginRate);
    const sOpsCost = Math.round(sSellIn * operatingCostRate);
    const sSalary = sales.totalSalary;
    const sTotalExp = sOpsCost + sSalary;
    const sProfit = sMargin - sTotalExp;
    const sProfitPct = sSellIn > 0 ? (sProfit / sSellIn) * 100 : 0;
    const sMarginPct = sMargin > 0 ? (sProfit / sMargin) * 100 : 0;

    let sStatus: 'excellent' | 'healthy' | 'warning' | 'deficit' = 'deficit';
    if (sProfitPct >= 10) sStatus = 'excellent';
    else if (sProfitPct >= 5) sStatus = 'healthy';
    else if (sProfitPct >= 0) sStatus = 'warning';

    return {
      id: sales.salesName,
      name: sales.salesName,
      coverArea: sales.coverArea,
      spvOrRegion: sales.spv,
      sellInActual: sSellIn,
      marginPercent,
      marginValue: sMargin,
      operatingCostPercent,
      operatingCostValue: sOpsCost,
      salaryCost: sSalary,
      totalExpense: sTotalExp,
      remainingProfitValue: sProfit,
      remainingProfitPercentSellIn: sProfitPct,
      remainingProfitPercentMargin: sMarginPct,
      profitStatus: sStatus,
    };
  });

  // 12. Breakdown Profit per Cover Area
  const areaMap: Record<
    string,
    {
      sellIn: number;
      salesSalary: number;
      baSalary: number;
      region: string;
    }
  > = {};

  for (const s of costData.salesList) {
    const area = s.coverArea || 'Area Lain';
    if (!areaMap[area]) {
      areaMap[area] = { sellIn: 0, salesSalary: 0, baSalary: 0, region: '-' };
    }
    areaMap[area].sellIn += s.sellInActual;
    areaMap[area].salesSalary += s.totalSalary;
  }

  for (const b of costData.baList) {
    const area = b.coverArea || 'Area Lain';
    if (!areaMap[area]) {
      areaMap[area] = { sellIn: 0, salesSalary: 0, baSalary: 0, region: b.region || '-' };
    }
    areaMap[area].baSalary += b.totalSalary;
    if (areaMap[area].region === '-') {
      areaMap[area].region = b.region || '-';
    }
  }

  const profitByArea: ProfitItemBreakdown[] = Object.entries(areaMap)
    .map(([areaName, data]) => {
      const aSellIn = data.sellIn;
      const aMargin = Math.round(aSellIn * marginRate);
      const aOpsCost = Math.round(aSellIn * operatingCostRate);
      const aSalary = data.salesSalary + data.baSalary;
      const aTotalExp = aOpsCost + aSalary;
      const aProfit = aMargin - aTotalExp;
      const aProfitPct = aSellIn > 0 ? (aProfit / aSellIn) * 100 : 0;
      const aMarginPct = aMargin > 0 ? (aProfit / aMargin) * 100 : 0;

      let aStatus: 'excellent' | 'healthy' | 'warning' | 'deficit' = 'deficit';
      if (aProfitPct >= 10) aStatus = 'excellent';
      else if (aProfitPct >= 5) aStatus = 'healthy';
      else if (aProfitPct >= 0) aStatus = 'warning';

      return {
        id: areaName,
        name: areaName,
        coverArea: areaName,
        spvOrRegion: data.region,
        sellInActual: aSellIn,
        marginPercent,
        marginValue: aMargin,
        operatingCostPercent,
        operatingCostValue: aOpsCost,
        salaryCost: aSalary,
        totalExpense: aTotalExp,
        remainingProfitValue: aProfit,
        remainingProfitPercentSellIn: aProfitPct,
        remainingProfitPercentMargin: aMarginPct,
        profitStatus: aStatus,
      };
    })
    .sort((a, b) => b.sellInActual - a.sellInActual);

  // 13. Breakdown Profit per Region
  const regionMap: Record<
    string,
    {
      sellIn: number;
      salary: number;
    }
  > = {};

  for (const item of profitByArea) {
    const reg = item.spvOrRegion && item.spvOrRegion !== '-' ? item.spvOrRegion : 'Region Utama';
    if (!regionMap[reg]) {
      regionMap[reg] = { sellIn: 0, salary: 0 };
    }
    regionMap[reg].sellIn += item.sellInActual;
    regionMap[reg].salary += item.salaryCost;
  }

  const profitByRegion: ProfitItemBreakdown[] = Object.entries(regionMap)
    .map(([regName, data]) => {
      const rSellIn = data.sellIn;
      const rMargin = Math.round(rSellIn * marginRate);
      const rOpsCost = Math.round(rSellIn * operatingCostRate);
      const rSalary = data.salary;
      const rTotalExp = rOpsCost + rSalary;
      const rProfit = rMargin - rTotalExp;
      const rProfitPct = rSellIn > 0 ? (rProfit / rSellIn) * 100 : 0;
      const rMarginPct = rMargin > 0 ? (rProfit / rMargin) * 100 : 0;

      let rStatus: 'excellent' | 'healthy' | 'warning' | 'deficit' = 'deficit';
      if (rProfitPct >= 10) rStatus = 'excellent';
      else if (rProfitPct >= 5) rStatus = 'healthy';
      else if (rProfitPct >= 0) rStatus = 'warning';

      return {
        id: regName,
        name: regName,
        coverArea: '-',
        spvOrRegion: regName,
        sellInActual: rSellIn,
        marginPercent,
        marginValue: rMargin,
        operatingCostPercent,
        operatingCostValue: rOpsCost,
        salaryCost: rSalary,
        totalExpense: rTotalExp,
        remainingProfitValue: rProfit,
        remainingProfitPercentSellIn: rProfitPct,
        remainingProfitPercentMargin: rMarginPct,
        profitStatus: rStatus,
      };
    })
    .sort((a, b) => b.sellInActual - a.sellInActual);

  // 14. Breakdown Profit per Outlet / Nama Store (Memasukkan Biaya Gaji BA Toko)
  const storeMap: Record<
    string,
    {
      sellIn: number;
      coverArea: string;
      region: string;
      salesName: string;
      hasBa: boolean;
      baName: string;
      baSalary: number;
    }
  > = {};

  for (const r of records) {
    const sName = r.NAMA_STORE;
    if (!sName) continue;
    if (!storeMap[sName]) {
      storeMap[sName] = {
        sellIn: 0,
        coverArea: r.COVER_AREA || '-',
        region: r.REGION || '-',
        salesName: r.SALES || '-',
        hasBa: false,
        baName: '-',
        baSalary: 0,
      };
    }
    storeMap[sName].sellIn += (r.VALUE || 0);
  }

  // Masukkan data BA dan gaji BA ke toko
  for (const ba of costData.baList) {
    if (storeMap[ba.storeName]) {
      storeMap[ba.storeName].hasBa = true;
      storeMap[ba.storeName].baName = ba.baName;
      storeMap[ba.storeName].baSalary = ba.totalSalary;
      if (ba.coverArea !== '-') storeMap[ba.storeName].coverArea = ba.coverArea;
      if (ba.region !== '-') storeMap[ba.storeName].region = ba.region;
      if (ba.salesName !== '-') storeMap[ba.storeName].salesName = ba.salesName;
    } else {
      storeMap[ba.storeName] = {
        sellIn: ba.sellOutActual,
        coverArea: ba.coverArea,
        region: ba.region,
        salesName: ba.salesName,
        hasBa: true,
        baName: ba.baName,
        baSalary: ba.totalSalary,
      };
    }
  }

  const profitByStore: ProfitStoreItem[] = Object.entries(storeMap)
    .map(([sName, data]) => {
      const sSellIn = data.sellIn;
      const sMargin = Math.round(sSellIn * marginRate);
      const sOpsCost = Math.round(sSellIn * operatingCostRate);
      const sBaSalary = data.baSalary;
      const sTotalExp = sOpsCost + sBaSalary;
      const sProfit = sMargin - sTotalExp;
      const sProfitPct = sSellIn > 0 ? (sProfit / sSellIn) * 100 : 0;
      const sMarginPct = sMargin > 0 ? (sProfit / sMargin) * 100 : 0;

      let sStatus: 'excellent' | 'healthy' | 'warning' | 'deficit' = 'deficit';
      if (sProfitPct >= 10) sStatus = 'excellent';
      else if (sProfitPct >= 5) sStatus = 'healthy';
      else if (sProfitPct >= 0) sStatus = 'warning';

      return {
        id: sName,
        storeName: sName,
        coverArea: data.coverArea,
        region: data.region,
        salesName: data.salesName,
        hasBa: data.hasBa,
        baName: data.baName,
        sellInActual: sSellIn,
        marginPercent,
        marginValue: sMargin,
        operatingCostPercent,
        operatingCostValue: sOpsCost,
        baSalaryCost: sBaSalary,
        totalExpense: sTotalExp,
        remainingProfitValue: sProfit,
        remainingProfitPercentSellIn: sProfitPct,
        remainingProfitPercentMargin: sMarginPct,
        profitStatus: sStatus,
      };
    })
    .sort((a, b) => b.sellInActual - a.sellInActual);

  return {
    sellInActual,
    marginPercent,
    marginValue,
    operatingCostPercent,
    operatingCostValue,
    salaryCost,
    totalSalesSalary,
    totalBaSalary,
    totalExpense,
    remainingProfitValue,
    remainingProfitPercentSellIn,
    remainingProfitPercentMargin,
    breakEvenPointSellIn,
    netMarginDiffPercent,
    profitStatus,
    profitBySales,
    profitByArea,
    profitByRegion,
    profitByStore,
  };
}
