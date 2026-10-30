export interface TransactionRecord {
  id: string;
  TANGGAL: string;      // e.g. "9/29/2026" or "2026-09-29"
  BULAN: string;        // e.g. "SEPTEMBER"
  TAHUN: number;        // e.g. 2026
  BA: string;           // Beauty Advisor name
  BA_Number: string;    // BA employee number
  COVER_AREA: string;   // e.g. "AREA BARU", "LUAR KOTA"
  SALES: string;        // e.g. "ILHAMSYAH", "LUAR KOTA"
  SPV: string;          // e.g. "WIDODO"
  BRAND: string;        // e.g. "lavojoy", "Y.O.U", "GLAMFIX", "barenbliss", "DAZZLE ME"
  NO_SKU: string;       // e.g. "18186"
  SPU: string;          // Short SPU name
  SKU: string;          // Full SKU description
  PRODUK_FOCUS: string; // "FOCUS" | "REGULAR"
  PRODUK_NEW: string;   // "NEW" | "EXISTING"
  NAMA_STORE: string;   // e.g. "TOKO ALANA BEAUTY"
  REGION: string;       // e.g. "PEKAN BARU"
  KATEGORI: string;     // e.g. "Body Care", "Lip Makeup", "Sunscreen"
  QTY: number;          // Quantity sold (can be negative for returns)
  VALUE: number;        // Net sales value in IDR (can be negative)
  KET: string;          // "SELL IN" | "SELL OUT" | "RETURN"
  weekNumber?: number;  // 1-52
  STATUS_PRODUK?: string; // Product lifecycle category
}

export type ProductLifecycleStatus =
  | '核心品 - Core Products'
  | '新品 - New Products'
  | '常规品 - Regular Products'
  | '清库品 - Clearance'
  | '淘汰品 - Discontinue Products'
  | '退市品 - Delisted Product'
  | '淘汰品 - Obsolete'
  | string;

export type TimeframeMode = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';

export type ComparisonMode = 'wow' | 'mom' | 'yoy';

export type ActiveTab =
  | 'overview'
  | 'rangkuman_kuartal'
  | 'comparison'
  | 'gap'
  | 'weekly_ba'
  | 'cost'
  | 'profit'
  | 'aging'
  | 'kpi'
  | 'kpi_trainer'
  | 'punishment'
  | 'produk_fokus'
  | 'target_mgmt'
  | 'status_produk'
  | 'sales'
  | 'spv'
  | 'brand'
  | 'category'
  | 'store'
  | 'sku'
  | 'table'
  | 'sell_in_vs_sell_out'
  | 'kontribusi_toko_ba';

export interface AreaTargetItem {
  coverArea: string;
  region: string;
  targetOmzet: number;
  actualSellIn: number;
  actualSellOut: number;
  gapOmzet: number;
  achievementPct: number;
  status: 'achieved' | 'on_track' | 'lagging';
  salesCount: number;
  spvCount: number;
  storeCount: number;
  isCustom: boolean;
}

export interface SpvTargetItem {
  spvName: string;
  regions: string[];
  coverAreas: string[];
  targetOmzet: number;
  actualSellIn: number;
  actualSellOut: number;
  gapOmzet: number;
  achievementPct: number;
  status: 'achieved' | 'on_track' | 'lagging';
  salesCount: number;
  storeCount: number;
  isCustom: boolean;
}

export interface SalesTargetItem {
  salesName: string;
  coverArea: string;
  spv: string;
  targetSellIn: number;
  actualSellIn: number;
  achievementPct: number;
  incentivePercent: number;
  incentiveNominal: number;
  status: 'achieved' | 'on_track' | 'lagging';
  coveredBaCount: number;
  isCustom: boolean;
}

export interface BaTargetItem {
  storeName: string;
  baName: string;
  baNumber: string;
  coverArea: string;
  region: string;
  salesName: string;
  spv: string;
  targetNonLavojoy: number;
  actualNonLavojoy: number;
  achievementNonLavojoyPct: number;
  targetLavojoy: number;
  actualLavojoy: number;
  achievementLavojoyPct: number;
  targetFocusPcs: number;
  actualFocusPcs: number;
  achievementFocusPct: number;
  focusStatus: 'insentif' | 'aman' | 'denda';
  focusIncentive: number;
  focusPenalty: number;
  isCustom: boolean;
}

export interface TrainerTargetItem {
  id: string;
  trainerName: string;
  areaCovered: string;
  region: string;
  targetSellOut: number;
  actualSellOut: number;
  achievementSellOutPct: number;
  targetProdukFokusPcs: number;
  actualProdukFokusPcs: number;
  achievementProdukFokusPct: number;
  status: 'achieved' | 'on_track' | 'lagging';
  baSupervisedCount: number;
  storeSupervisedCount: number;
  monthPeriod?: string;
  notes?: string;
  isCustom: boolean;
}

export interface SalesCoveredBaItem {
  storeName: string;
  baName: string;
  sellOut: number;
  status: 'bonus_1m' | 'bonus_500k' | 'normal' | 'penalty_sp1';
  amount: number;
  description: string;
}

export interface SalesSalaryItem {
  salesName: string;
  coverArea: string;
  spv: string;
  sellInActual: number;
  sellInTarget: number;
  achievementPercent: number;
  tierLabel: string;
  tierColor: string;
  baseSalary: number;
  incentivePercent: number;
  incentiveNominal: number;
  // Insentif & Denda Produktivitas BA yang dicover
  coveredStores: string[];
  coveredBaCount: number;
  coveredBaList: SalesCoveredBaItem[];
  baProductivityBonus: number;     // +Rp 500k (45-54M), +Rp 1M (>=55M)
  baProductivityPenalty: number;   // -Rp 300k (<35M)
  baProductivitySpCount: number;   // Jumlah SP1 yang diterima
  totalSalary: number;             // baseSalary + incentiveNominal + baProductivityBonus - baProductivityPenalty
}

export interface BaSalaryItem {
  baName: string;
  baNumber: string;
  storeName: string;
  coverArea: string;
  region: string;
  salesName: string;
  spv?: string;

  // Non-Lavojoy Brands (Y.O.U, barenbliss, DAZZLE ME, GLAMFIX, HUED, FORMULOGIC)
  sellOutNonLavojoy: number;
  targetNonLavojoy: number;
  achievementNonLavojoyPercent: number;
  baseSalary: number;                  // Rp 3.9M (>=100%), Rp 2.925M (70-99%), Rp 2M (1-25M), Rp 0 (<1M)
  incentiveNonLavojoyPercent: number;  // 2% (>=120%), 1% (100-119%), 0% (<100%)
  incentiveNonLavojoyNominal: number;
  tierLabel: string;
  tierColor: string;

  // Khusus Brand Lavojoy
  sellOutLavojoy: number;
  targetLavojoy: number;
  achievementLavojoyPercent: number;
  isLavojoyTargetMet: boolean;         // >= 100%
  incentiveLavojoyPercent: number;     // 4% jika >= 100%, 0% jika < 100%
  incentiveLavojoyNominal: number;     // 4% x sellOutLavojoy

  // Insentif & Denda Produk Fokus BA
  focusTargetPcs?: number;             // Target penjualan produk fokus (Pcs)
  focusActualPcs?: number;             // Realisasi penjualan produk fokus (Pcs)
  focusAchievementPct?: number;        // (focusActualPcs / focusTargetPcs) * 100
  focusStatus?: 'insentif' | 'aman' | 'denda'; // >=80% Insentif, 70-79% Aman, <70% Denda
  focusIncentive?: number;             // Jika >=80%: actualPcs * 2000
  focusPenalty?: number;               // Jika <70%: (targetPcs - actualPcs) * 1000
  focusNetBonus?: number;              // focusIncentive - focusPenalty

  // Total Keseluruhan
  sellOutActual: number;               // sellOutNonLavojoy + sellOutLavojoy
  sellOutTarget: number;               // targetNonLavojoy + targetLavojoy
  achievementPercent: number;          // Total achievement %
  totalIncentiveNominal: number;       // incentiveNonLavojoyNominal + incentiveLavojoyNominal
  incentiveNominal: number;            // alias for totalIncentiveNominal
  incentivePercent: number;            // effective incentive %
  totalSalary: number;                 // baseSalary + totalIncentiveNominal + focusIncentive - focusPenalty
  isMinSalesMet: boolean;              // sellOutActual >= 1000000
}

export interface BaFocusProductItem {
  baName: string;
  baNumber: string;
  storeName: string;
  coverArea: string;
  region: string;
  salesName: string;
  spv: string;
  targetPcs: number;
  actualPcs: number;
  achievementPct: number;
  status: 'insentif' | 'aman' | 'denda';
  incentive: number;
  penalty: number;
  netBonus: number;
  isCustomOverride?: boolean;
  note?: string;
  focusSkusSold?: { sku: string; brand: string; qty: number; value: number }[];
}

export interface BaFocusProductOverride {
  storeName?: string;
  targetPcs?: number;
  customActualPcs?: number;
  customIncentive?: number;
  customPenalty?: number;
  note?: string;
}

export interface TrainerSalaryItem {
  id: string;
  trainerName: string;
  areaCovered: string;
  region: string;
  baseSalary: number;            // Rp 3.900.000
  transportAllowance: number;    // Rp 500.000 (Tunjangan transportasi dalam kota)
  focusTargetPcs: number;        // Target produk fokus (Pcs)
  focusActualPcs: number;        // Realisasi produk fokus (Pcs)
  focusAchievementPct: number;   // % Capaian produk fokus
  focusStatus: 'insentif_500k' | 'insentif_300k' | 'aman' | 'denda_sp1'; // >=100%: 500k, 80-99%: 300k, 70-79%: aman, <70%: denda 300k + SP1
  focusIncentive: number;        // Insentif Produk Fokus
  focusPenalty: number;          // Denda Produk Fokus (Rp 300.000 jika < 70%)
  hasSp1: boolean;               // True jika capaian produk fokus < 70% atau KPI < 70%
  // Insentif & Denda KPI Trainer (Skala 100 Poin)
  kpiScore: number;              // Poin KPI Trainer (0-100 poin)
  kpiStatus: 'insentif_2jt' | 'insentif_1jt' | 'insentif_500k' | 'aman' | 'denda_sp1'; // 100%: 2Jt, 90-99%: 1Jt, 80-89%: 500k, 70-79%: aman, <70%: SP1 & denda 300k
  kpiIncentive: number;          // Insentif Poin KPI Trainer
  kpiPenalty: number;            // Denda Poin KPI Trainer
  hasKpiSp1: boolean;            // SP1 dari Poin KPI Trainer
  monthPeriod?: string;          // Periode Bulan (e.g. OKTOBER 2026)
  totalSalary: number;           // baseSalary + transportAllowance + focusIncentive - focusPenalty + kpiIncentive - kpiPenalty
  sellOutActual: number;
  sellOutTarget: number;
  isCustom?: boolean;
  notes?: string;
}

export interface AreaCostSummary {
  totalCost: number;
  totalSalesCost: number;
  totalSalesBase: number;
  totalSalesIncentive: number;
  totalBaCost: number;
  totalBaBase: number;
  totalBaIncentive: number;
  totalBaFocusIncentive?: number;
  totalBaFocusPenalty?: number;
  totalBaFocusNetBonus?: number;
  totalTrainerCost?: number;
  totalTrainerBase?: number;
  totalTrainerTransport?: number;
  totalTrainerFocusIncentive?: number;
  totalTrainerFocusPenalty?: number;
  totalTrainerKpiIncentive?: number;
  totalTrainerKpiPenalty?: number;
  totalAreaRevenue: number;
  costToRevenueRatio: number;
  salesCount: number;
  baCount: number;
  trainerCount?: number;
  salesList: SalesSalaryItem[];
  baList: BaSalaryItem[];
  trainerList?: TrainerSalaryItem[];
}

export interface DropEntityItem {
  name: string;
  previousValue: number;
  currentValue: number;
  deficitValue: number;
  growthPercent: number;
  primaryReason: string;
  categoryOrBrand?: string;
  regionOrSales?: string;
}

export interface GapDriverFactor {
  factor: string;
  impactValue: number;
  description: string;
  actionPlan: string;
  percentageOfGap: number;
}

export interface SalesGapDiagnosis {
  totalTarget: number;
  actualRevenue: number;
  gapDeficit: number;
  gapPercentage: number;
  previousRevenue: number;
  deltaVsPrevious: number;
  primaryDrivers: GapDriverFactor[];
  topDroppingStores: DropEntityItem[];
  topDroppingSkus: DropEntityItem[];
  topDroppingBrands: DropEntityItem[];
  topDroppingSales: DropEntityItem[];
  returnSpikeImpact: number;
  lostStoresCount: number;
  lowOrderStoresCount: number;
  currentPeriodName: string;
  previousPeriodName: string;
}

export interface DashboardFilters {
  BULAN: string;        // 'ALL' or month name
  TAHUN: string;        // 'ALL' or year string
  SALES: string;        // 'ALL' or sales name
  SPV: string;          // 'ALL' or SPV name
  BRAND: string;        // 'ALL' or brand name
  KATEGORI: string;     // 'ALL' or category name
  SKU: string;          // search or 'ALL'
  NAMA_STORE: string;   // 'ALL' or store name
  REGION: string;       // 'ALL' or region name
  KET: string;          // 'ALL' or 'SELL IN' / 'SELL OUT' / 'RETURN'
  STATUS_PRODUK?: string; // 'ALL' or product lifecycle status
  searchQuery: string;  // free text search
}

export type FilterState = DashboardFilters;

export interface ProductStatusMetricItem {
  status: string;
  labelCn: string;
  labelEn: string;
  color: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  totalValue: number;
  totalQty: number;
  skuCount: number;
  transactionCount: number;
  valueSharePercent: number;
  qtySharePercent: number;
  averagePrice: number;
  actionStrategy: string;
  topSkus: { sku: string; brand: string; value: number; qty: number }[];
}

export interface ProductStatusSummary {
  totalValue: number;
  totalQty: number;
  totalSkuCount: number;
  statuses: ProductStatusMetricItem[];
  topCoreSkus: { sku: string; brand: string; value: number; qty: number }[];
  topNewSkus: { sku: string; brand: string; value: number; qty: number }[];
  clearanceObsoleteValue: number;
  clearanceObsoleteShare: number;
}

// ----------------- DAFTAR TAGIHAN TOKO & AGING PIUTANG -----------------
export type AgingCategory =
  | 'current'      // <= 30 Hari (Berjalan / Belum Jatuh Tempo)
  | 'up_30'        // 31 - 35 Hari: Sudah Jatuh Tempo Harus di Follow-Up Sales
  | 'up_35'        // 36 - 45 Hari: Tidak Bisa Melakukan Pengorderan
  | 'up_45'        // 46 - 51 Hari: Harus SPV Kejar ke Toko
  | 'up_52'        // 52 - 60 Hari: Sales/SPV Wajib Melakukan Penarikan Barang
  | 'up_60';       // > 60 Hari: Status Waspada: Jadi Customer Cash

export interface StoreInvoiceBillItem {
  id: string;
  invoiceNumber: string;
  storeName: string;
  coverArea: string;
  region: string;
  salesName: string;
  spvName: string;
  sellInDate: string;        // YYYY-MM-DD
  dueDate: string;           // YYYY-MM-DD (standard 30 days after Sell In)
  paymentDate?: string;      // YYYY-MM-DD (when paid)
  isPaid: boolean;
  amount: number;            // Invoice Sell In value (IDR)
  brandCategory?: string;
  agingDays: number;
  agingCategory: AgingCategory;
  actionRequired: string;
  notes?: string;
  dispensationGranted?: boolean;
  dispensationReason?: string;
}

export interface StoreViolationSummary {
  storeName: string;
  coverArea: string;
  region: string;
  salesName: string;
  spvName: string;
  up30Count: number;
  up35Count: number;
  up45Count: number;
  up60Count: number;
  totalUnpaidAmount: number;
  oldestAgingDays: number;
  statusBadge: 'aman' | 'perhatian' | 'peringatan_spv' | 'customer_cash';
}

export interface SalesSpvDendaSummary {
  personName: string;
  role: 'sales' | 'spv';
  monthPeriod: string;
  storesUp60Count: number;
  dendaToko60Nominal: number;      // Sales: Rp 200k/toko, SPV: Rp 300k/toko
  invoices45to59Count: number;     // Only for sales
  totalNominalSellIn45to59: number;// Only for sales
  dendaPercent45to59Nominal: number; // 0.2% * totalNominalSellIn45to59
  totalFrequencyDenda: number;
  totalDendaNominal: number;
}

// ----------------- KPI SALES BALANCED SCORECARD (100 POIN) -----------------
export interface KpiSalesScorecardItem {
  id?: string;
  salesName: string;
  coverArea: string;
  spv: string;
  monthPeriod: string;
  notes?: string;
  // Pilar 1: Poin Sell Out (40 pt)
  sellOutTarget: number;
  sellOutActual: number;
  sellOutAchievementPct: number;
  pointSellOut: number;          // >=100%: 40, 80-90%: 30, 70-79%: 25, <70%: 20
  // Pilar 2: Poin Tagihan Up 45 Hari (30 pt)
  overdueStoresUp45Count: number;
  pointTagihan45H: number;       // 0 toko: 30, 1 toko: 25, 2 toko: 20, 3 toko: 15, >=4 toko: 10
  // Pilar 3: Report Kunjungan & Follow Up (10 pt)
  visitLogsCount: number;
  pointKunjungan: number;        // >90 kunjungan: 10, 30-89: 5, 1-29: 3, 0: 0
  // Pilar 4: Monitoring BA (10 pt)
  baReportWeeklyPct: number;
  pointBaReportWeekly: number;   // 100%: 5, 80-99%: 3, <80%: 2
  baStockOpnameAppPct: number;
  pointBaStockOpname: number;    // 100%: 5, 80-99%: 3, <80%: 2
  pointMonitoringBa: number;     // Total Pilar 4 (maks 10)
  // Pilar 5: Buffer Stock (10 pt)
  storesUsingBufferAppPct: number;
  pointBufferStock: number;      // 100%: 10, 80-99%: 5, <80%: 3
  // Total Akumulasi
  totalScore: number;            // 0 - 100
  grade: 'A' | 'B' | 'C' | 'D';  // A >=90, B 80-89, C 70-79, D <70
  // Insentif & Denda KPI
  kpiIncentive: number;          // 100pt: +2M, 90-99pt: +1M, 80-89pt: +500k, <80pt: 0
  kpiPenalty: number;            // <70pt: -300k, >=70pt: 0
  hasSp1: boolean;               // true if < 70pt
  // Take Home Pay Integration
  baseSalary: number;            // Rp 4.9M
  sellInIncentive: number;
  baBonus: number;
  baPenalty: number;
  tagihanPenalty: number;
  finalTakeHomePay: number;
  // Manual overrides
  isManualOverride?: boolean;
}

// ----------------- PUNISHMENT BA (DENDA NIHIL SELL OUT RP 25.000) -----------------
export interface BaNihilIncidentRecord {
  id: string;
  baName: string;
  baNumber: string;
  storeName: string;
  brand: string;
  date: string;
  dendaNominal: number;          // Rp 25.000
  reason: string;
  isDispensation: boolean;
  dispensationNote?: string;
  approvedBy?: string;
  isOffDay?: boolean;           // BA off / libur resmi / cuti (denda tidak dihitung)
  offNote?: string;             // Catatan izin off
  customDendaNominal?: number;
}

export interface BaPunishmentSummaryItem {
  baName: string;
  baNumber: string;
  storeName: string;
  coverArea: string;
  region: string;
  salesName: string;
  spvName: string;
  brand: string;
  totalNihilDays: number;
  totalOffDays?: number;         // Total hari BA off (denda Rp 0)
  totalDendaNominal: number;     // totalNihilDays * 25.000 (excluding dispensation & off days)
  disciplineBadge: 'tertib' | 'peringatan_1' | 'peringatan_2' | 'peringatan_sp';
  incidents: BaNihilIncidentRecord[];
  sellOutActual: number;
  baseSalary: number;
  totalTakeHomePay: number;
  isManualSalaryEdited?: boolean;
  customBaseSalary?: number;
  customDendaTotal?: number;
}

export interface MetricSummary {
  totalRevenue: number;
  totalQty: number;
  totalTransactions: number;
  averageOrderValue: number;
  totalReturnRevenue: number;
  returnRatePercent: number;
  grossRevenue: number;
}

export interface GrowthMetric {
  currentValue: number;
  previousValue: number;
  deltaValue: number;
  growthPercent: number;
  currentQty: number;
  previousQty: number;
  growthQtyPercent: number;
}

export interface EntityProductAnalysisItem {
  name: string;
  // Total Sales
  current: number;
  previous: number;
  delta: number;
  growth: number;
  currentQty: number;
  previousQty: number;

  // Produk Fokus (Focus Product)
  currentFocus: number;
  previousFocus: number;
  focusDelta: number;
  focusGrowth: number;
  focusShareCurrent: number;   // % of current total sales
  focusSharePrevious: number;  // % of previous total sales
  focusQtyCurrent: number;
  focusQtyPrevious: number;

  // Produk New (New Product)
  currentNew: number;
  previousNew: number;
  newDelta: number;
  newGrowth: number;
  newShareCurrent: number;     // % of current total sales
  newSharePrevious: number;    // % of previous total sales
  newQtyCurrent: number;
  newQtyPrevious: number;

  // Produk Regular/Existing
  currentRegular: number;
  previousRegular: number;

  // Top SKUs breakdown
  topFocusSkus?: { sku: string; brand: string; value: number; qty: number }[];
  topNewSkus?: { sku: string; brand: string; value: number; qty: number }[];
}

export interface FocusNewOverallSummary {
  current: number;
  previous: number;
  delta: number;
  growth: number;
  shareCurrent: number;
  sharePrevious: number;
  currentQty: number;
  previousQty: number;
}

export interface ComparisonGrowthResult {
  overall: GrowthMetric;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  focusSummary: FocusNewOverallSummary;
  newSummary: FocusNewOverallSummary;
  bySales: EntityProductAnalysisItem[];
  bySpv: EntityProductAnalysisItem[];
  byBrand: EntityProductAnalysisItem[];
  byStore: EntityProductAnalysisItem[];
  byCategory: EntityProductAnalysisItem[];
  byTrainer?: EntityProductAnalysisItem[];
}

// ----------------- KPI TRAINER BALANCED SCORECARD (100 POIN) -----------------
export interface KpiTrainerScorecardItem {
  id: string;
  trainerName: string;
  areaCovered: string;
  region: string;
  monthPeriod: string;
  notes?: string;

  // Indikator 1: Sell Out (Maks 40 Poin)
  // >=100%: 40 pt, 90-99%: 35 pt, 80-89%: 30 pt, <80%: 0 pt
  sellOutTarget: number;
  sellOutActual: number;
  sellOutAchievementPct: number;
  pointSellOut: number;

  // Indikator 2: Jumlah Event & Omset Event (Maks 30 Poin)
  // >=100%: 30 pt, 90-99%: 25 pt, 80-89%: 20 pt, <80%: 0 pt
  eventOmsetTarget: number;
  eventOmsetActual: number;
  eventOmsetAchievementPct: number;
  pointEvent: number;
  eventCountTarget?: number;
  eventCountActual?: number;

  // Indikator 3: Absensi & Report Kunjungan (Maks 10 Poin)
  // >=100%: 10 pt, 90-99%: 5 pt, 80-89%: -5 pt, <80%: -5 pt
  visitTarget: number;
  visitActual: number;
  visitAchievementPct: number;
  pointKunjungan: number;

  // Indikator 4: Jumlah Training (Maks 10 Poin)
  // >=100%: 10 pt, 90-99%: 5 pt, 80-89%: -5 pt, <80%: -5 pt
  trainingTarget: number;
  trainingActual: number;
  trainingAchievementPct: number;
  pointTraining: number;

  // Indikator 5: Report & Produktivitas BA (Maks 10 Poin)
  // >=100%: 10 pt, 90-99%: 5 pt, 80-89%: -5 pt, <80%: -5 pt
  baProductivityTarget: number;
  baProductivityActual: number;
  baProductivityAchievementPct: number;
  pointBaProductivity: number;

  // Total Skor (0 - 100 Poin)
  totalScore: number;
  grade: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang (SP1)';
  scoreCategory: '80-100' | '70-79' | '10-69';
  hasSp1: boolean;
  isCustom?: boolean;
}

export interface DimensionPerformance {
  name: string;
  totalValue: number;
  totalQty: number;
  transactionCount: number;
  contributionPercent: number;
  target?: number;
  achievementPercent?: number;
  previousValue?: number;
  growthPercent?: number;
  brandBreakdown?: { [brand: string]: number };
}

export interface GasConfig {
  webAppUrl: string;
  sheetName: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
  syncIntervalMinutes: number;
  status: 'idle' | 'syncing' | 'connected' | 'error';
  errorMessage?: string;
  dataSourceType: 'sample' | 'google_sheet' | 'imported_csv';
}

export interface ProfitItemBreakdown {
  id: string;
  name: string;
  coverArea: string;
  spvOrRegion: string;
  sellInActual: number;
  marginPercent: number;
  marginValue: number;
  operatingCostPercent: number;
  operatingCostValue: number;
  salaryCost: number;
  totalExpense: number;
  remainingProfitValue: number;
  remainingProfitPercentSellIn: number;
  remainingProfitPercentMargin: number;
  profitStatus: 'excellent' | 'healthy' | 'warning' | 'deficit';
}

export interface ProfitStoreItem {
  id: string;
  storeName: string;
  coverArea: string;
  region: string;
  salesName: string;
  hasBa: boolean;
  baName: string;
  sellInActual: number;
  marginPercent: number;
  marginValue: number;
  operatingCostPercent: number;
  operatingCostValue: number;
  baSalaryCost: number;               // Biaya gaji BA di toko ini
  totalExpense: number;               // operatingCostValue + baSalaryCost
  remainingProfitValue: number;       // marginValue - totalExpense
  remainingProfitPercentSellIn: number;
  remainingProfitPercentMargin: number;
  profitStatus: 'excellent' | 'healthy' | 'warning' | 'deficit';
}

export interface ProfitAreaSummary {
  sellInActual: number;
  marginPercent: number;
  marginValue: number;
  operatingCostPercent: number;
  operatingCostValue: number;
  salaryCost: number;
  totalSalesSalary: number;
  totalBaSalary: number;
  totalExpense: number;
  remainingProfitValue: number;
  remainingProfitPercentSellIn: number;
  remainingProfitPercentMargin: number;
  breakEvenPointSellIn: number;
  netMarginDiffPercent: number;
  profitStatus: 'excellent' | 'healthy' | 'warning' | 'deficit';
  profitBySales: ProfitItemBreakdown[];
  profitByArea: ProfitItemBreakdown[];
  profitByRegion: ProfitItemBreakdown[];
  profitByStore: ProfitStoreItem[];
}

// -------------------------------------------------------------
// RANGKUMAN KUARTAL (SALES, BA & TRAINER)
// -------------------------------------------------------------
export type QuarterPeriodKey = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface QuarterlyMonthDetail {
  monthName: string;
  monthIndex: number; // 0-11
  targetSellOut: number;
  actualSellOut: number;
  target?: number;
  actual?: number;
  achievementPercent: number;
  kpiScore?: number;
  focusActualPcs?: number;
  focusTargetPcs?: number;
  nihilDays?: number;
  offDays?: number;
}

export interface SalesQuarterlySummaryItem {
  salesName: string;
  coverArea: string;
  region: string;
  spvName: string;
  quarterTarget: number;
  quarterActual: number;
  quarterAchievementPercent: number;
  avgKpiScore: number;
  kpiGrade: 'Grade A' | 'Grade B' | 'Grade C' | 'Grade D';
  totalCommission: number;
  statusBadge: 'Melampaui Target' | 'Mencapai Target' | 'Perlu Ditingkatkan';
  monthlyBreakdown: QuarterlyMonthDetail[];
}

export interface BaQuarterlySummaryItem {
  baName: string;
  baNumber: string;
  storeName: string;
  coverArea: string;
  region: string;
  spvName: string;
  quarterTarget: number;
  quarterActual: number;
  quarterAchievementPercent: number;
  focusTargetPcs: number;
  focusActualPcs: number;
  focusAchievementPercent: number;
  totalNihilDays: number;
  totalOffDays: number;
  disciplineRatePercent: number;
  totalDendaNominal: number;
  totalTakeHomePay: number;
  rank: number;
  monthlyBreakdown: QuarterlyMonthDetail[];
}

export interface TrainerQuarterlySummaryItem {
  trainerName: string;
  areaCovered: string;
  region: string;
  quarterTarget: number;
  quarterActual: number;
  quarterAchievementPercent: number;
  focusTargetPcs: number;
  focusActualPcs: number;
  focusAchievementPercent: number;
  avgKpiScore: number;
  totalIncentive: number;
  totalDendaSP1: number;
  netIncentive: number;
  spStatus: 'Aman' | 'Peringatan SP1';
  coveredBaCount: number;
  trainingSessionCount: number;
  monthlyBreakdown: QuarterlyMonthDetail[];
}

export interface QuarterlyOverallSummary {
  quarter: QuarterPeriodKey;
  year: number;
  quarterLabel: string;
  dateRangeLabel: string;
  totalTargetArea: number;
  totalActualArea: number;
  areaAchievementPercent: number;
  totalSalesCount: number;
  totalBaCount: number;
  totalTrainerCount: number;
  totalSalesCommission: number;
  totalBaTakeHomePay: number;
  totalTrainerIncentive: number;
  avgSalesKpiScore: number;
  avgTrainerKpiScore: number;
  topSales: { name: string; actual: number; percent: number } | null;
  topBa: { name: string; store: string; actual: number; percent: number } | null;
  topTrainer: { name: string; score: number } | null;
}

export type SellInSellOutDimension = 'store' | 'ba' | 'sales' | 'trainer' | 'spv';

export interface SellInSellOutItem {
  id: string;
  name: string;
  secondaryInfo?: string;
  dimension: SellInSellOutDimension;
  sellInValue: number;
  sellOutValue: number;
  gapValue: number;
  absGapValue: number;
  gapPercent: number;
  sellThroughPercent: number;
  isOver20Percent: boolean;
  statusType: 'overstock' | 'healthy' | 'stockout_risk';
  statusLabel: string;
  rootCauseAnalysis: string;
  recommendedAction: string;
  area?: string;
  region?: string;
  storeName?: string;
  baName?: string;
  salesName?: string;
  trainerName?: string;
  spvName?: string;
}

export interface SellInSellOutSummary {
  periodMonth: string;
  periodYear: number;
  totalSellIn: number;
  totalSellOut: number;
  totalGapValue: number;
  avgGapPercent: number;
  overallSellThroughPercent: number;
  totalEntitiesCount: number;
  over20Count: number;
  overstockCount: number;
  stockoutRiskCount: number;
  healthyCount: number;
}

export type StoreBaCategory = 'toko_ba' | 'toko_non_ba';

export interface StoreBaContributionItem {
  id: string;
  storeName: string;
  hasBa: boolean;
  baName: string;
  baNumber?: string;
  coverArea: string;
  region: string;
  salesName: string;
  spvName: string;
  trainerName: string;
  totalRevenue: number;         // Total Sell Out dalam IDR
  contributionPercent: number;  // % terhadap total omset area
  totalQtySold: number;
  focusProductPcs: number;
  focusProductValue: number;
  transactionCount: number;
  averageBasketSize: number;
  performanceClass: string;     // e.g. 'Pilar Utama', 'Sangat Produktif', 'Potensial Pasang BA', 'Gerai Reguler'
  recommendationNote: string;
}

export interface StoreBaContributionSummary {
  periodMonth: string;
  periodYear: number;
  totalAreaRevenue: number;
  totalAreaQty: number;
  totalStoresCount: number;

  // Toko BA Metrics
  tokoBaCount: number;
  tokoBaStorePercent: number;
  tokoBaTotalRevenue: number;
  tokoBaRevenuePercent: number;
  tokoBaAvgRevenuePerStore: number;
  tokoBaTotalQty: number;
  tokoBaFocusPcs: number;

  // Toko Non-BA Metrics
  tokoNonBaCount: number;
  tokoNonBaStorePercent: number;
  tokoNonBaTotalRevenue: number;
  tokoNonBaRevenuePercent: number;
  tokoNonBaAvgRevenuePerStore: number;
  tokoNonBaTotalQty: number;
  tokoNonBaFocusPcs: number;

  // Comparative Lift Factor
  productivityMultiplier: number; // e.g. 2.8x (Avg Omset Toko BA / Avg Omset Toko Non BA)
  potentialBaCandidateStoresCount: number; // Non-BA stores with high volume ripe for BA
}
