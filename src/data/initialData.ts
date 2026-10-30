import { TransactionRecord } from '../types/dashboard';

export const MASTER_PRODUCTS = [
  {
    noSku: '18186',
    brand: 'lavojoy',
    spu: 'lavojoy Let It Glow',
    sku: 'LAVOJOY LET IT GLOW BODY SERUM BLACK OPIUM',
    kategori: 'Body Care',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 31005.45,
  },
  {
    noSku: '18629',
    brand: 'Y.O.U',
    spu: 'Y.O.U SUNBRELLA',
    sku: 'Y.O.U SUNBRELLA ACNE SHIELD LIGHT SUNSCREEN',
    kategori: 'Sunscreen',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 32720,
  },
  {
    noSku: '115888',
    brand: 'GLAMFIX',
    spu: 'GLAMFIX Glam My Lash',
    sku: 'GLAMFIX GLAM MY LASH CURLER - COMB-IN 1PC/BOX',
    kategori: 'Eye & Lash Tools',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 27920,
  },
  {
    noSku: '672495',
    brand: 'barenbliss',
    spu: 'barenbliss Lily Makes',
    sku: 'BARENBLISS LILY MAKES LUMINOUS GLOW TINT 06',
    kategori: 'Lip Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'NEW',
    basePrice: 63920,
  },
  {
    noSku: '115017',
    brand: 'DAZZLE ME',
    spu: 'DAZZLE ME Ink-Gloss',
    sku: 'DAZZLE ME INK-GLOSS LIP TINT R03 FEMME-INK 2.5',
    kategori: 'Lip Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 20720,
  },
  {
    noSku: '117509',
    brand: 'DAZZLE ME',
    spu: 'DAZZLE ME Ink-Vinyl',
    sku: 'DAZZLE ME INK-VINYL LIP LACQUER 233 MAGIC-IN',
    kategori: 'Lip Makeup',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 31920,
  },
  {
    noSku: '123685',
    brand: 'GLAMFIX',
    spu: 'GLAMFIX Wink Era',
    sku: 'GLAMFIX WINK ERA CLOUD POPPIN GLUE-FREE CLUSTER',
    kategori: 'Eye & Lash Tools',
    produkFocus: 'FOCUS',
    produkNew: 'NEW',
    basePrice: 37520,
  },
  {
    noSku: '21018',
    brand: 'Y.O.U',
    spu: 'Y.O.U SUNBRELLA',
    sku: 'Y.O.U SUNBRELLA SAKURA-NIACINAMIDE SUNSCREEN',
    kategori: 'Sunscreen',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 51920,
  },
  {
    noSku: '15604',
    brand: 'Y.O.U',
    spu: 'Y.O.U Cloud Paint',
    sku: 'Y.O.U CLOUD PAINT MATTE LASTING LIP CREAM R877',
    kategori: 'Lip Makeup',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 51920,
  },
  {
    noSku: '671528',
    brand: 'barenbliss',
    spu: 'barenbliss Apple',
    sku: 'BARENBLISS APPLE MAKES ADORABLE MOUSSE TINT',
    kategori: 'Lip Makeup',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 60720,
  },
  {
    noSku: '673546',
    brand: 'barenbliss',
    spu: 'barenbliss Locklook',
    sku: 'BARENBLISS LOCKLOOK MATTE & BLUR PRIMER 20G',
    kategori: 'Face Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'NEW',
    basePrice: 64720,
  },
  {
    noSku: '898478',
    brand: 'GLAMFIX',
    spu: 'GLAMFIX Maxi Curl',
    sku: 'GLAMFIX MAXI CURL LASH CURLER 1PC/BOX',
    kategori: 'Eye & Lash Tools',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 23920,
  },
  {
    noSku: '118803',
    brand: 'GLAMFIX',
    spu: 'GLAMFIX Wink Era',
    sku: 'GLAMFIX WINK ERA POPPIN GLUE-FREE CLUSTER',
    kategori: 'Eye & Lash Tools',
    produkFocus: 'REGULAR',
    produkNew: 'NEW',
    basePrice: 37520,
  },
  {
    noSku: '673829',
    brand: 'barenbliss',
    spu: 'barenbliss Moist Mochi',
    sku: 'BARENBLISS MOIST MOCHI PASTE PH-CREAM BLUSH',
    kategori: 'Face Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'NEW',
    basePrice: 71920,
  },
  {
    noSku: '1836',
    brand: 'Y.O.U',
    spu: 'Y.O.U Hy! Amino',
    sku: 'Y.O.U HY! AMINO AC-TTACK ANTI-ACNE FACIAL WASH',
    kategori: 'Cleanser & Wash',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 21818.65,
  },
  {
    noSku: '672464',
    brand: 'barenbliss',
    spu: 'barenbliss Lily Makes',
    sku: 'BARENBLISS LILY MAKES LUMINOUS GLOW TINT 03',
    kategori: 'Lip Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'NEW',
    basePrice: 63920,
  },
  {
    noSku: '117479',
    brand: 'DAZZLE ME',
    spu: 'DAZZLE ME Ink-Vinyl',
    sku: 'DAZZLE ME INK-VINYL LIP LACQUER 035 ICON-INK',
    kategori: 'Lip Makeup',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 31920,
  },
  {
    noSku: '676769',
    brand: 'barenbliss',
    spu: 'barenbliss Peach Makes',
    sku: 'BARENBLISS PEACH MAKES PERFECT LIP TINT S14',
    kategori: 'Lip Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 55920,
  },
  {
    noSku: '107432',
    brand: 'DAZZLE ME',
    spu: 'DAZZLE ME Traveler',
    sku: 'DAZZLE ME THE WORLD TRAVELER EYESHADOW PALETTE',
    kategori: 'Eye & Lash Tools',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 38320,
  },
  {
    noSku: '121421',
    brand: 'DAZZLE ME',
    spu: 'DAZZLE ME Cover Me',
    sku: 'DAZZLE ME COVER ME MATTE SERUM CUSHION C01',
    kategori: 'Face Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'NEW',
    basePrice: 79920,
  },
  {
    noSku: '115697',
    brand: 'DAZZLE ME',
    spu: 'DAZZLE ME Lock & Wing',
    sku: 'DAZZLE ME LOCK & WING! HYPER STAY EYELINER',
    kategori: 'Eye & Lash Tools',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 23920,
  },
  {
    noSku: '671573',
    brand: 'barenbliss',
    spu: 'barenbliss Locklook',
    sku: 'BARENBLISS LOCKLOOK DEWY SETTING SPRAY 50ML',
    kategori: 'Face Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 62870,
  },
  {
    noSku: '672747',
    brand: 'barenbliss',
    spu: 'barenbliss Bloomatte',
    sku: 'BARENBLISS BLOOMATTE PERFECT ZOOM COVER CUSHION',
    kategori: 'Face Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 127920,
  },
  {
    noSku: '109634',
    brand: 'DAZZLE ME',
    spu: 'DAZZLE ME Better Than',
    sku: 'DAZZLE ME BETTER THAN FILTER FIXED LOOSE POWDER',
    kategori: 'Face Makeup',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 46320,
  },
  {
    noSku: '673584',
    brand: 'barenbliss',
    spu: 'barenbliss Roll To Length',
    sku: 'BARENBLISS ROLL TO LENGTH STEEL MASCARA 6G',
    kategori: 'Eye & Lash Tools',
    produkFocus: 'FOCUS',
    produkNew: 'NEW',
    basePrice: 71920,
  },
  {
    noSku: '19183',
    brand: 'Y.O.U',
    spu: 'Y.O.U Hy! Amino',
    sku: 'Y.O.U HY! AMINO 20% CENTELLA BARRIER LOW PH',
    kategori: 'Cleanser & Wash',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 31920,
  },
  {
    noSku: '117516',
    brand: 'DAZZLE ME',
    spu: 'DAZZLE ME Ink-Vinyl',
    sku: 'DAZZLE ME INK-VINYL LIP LACQUER 555 FAMOUS-INK',
    kategori: 'Lip Makeup',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 31920,
  },
  {
    noSku: '19176',
    brand: 'Y.O.U',
    spu: 'Y.O.U Hy! Amino',
    sku: 'Y.O.U HY! AMINO 1.5% BHA FIGHT ACNE GEL CLEANSER',
    kategori: 'Cleanser & Wash',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 31920,
  },
  {
    noSku: '3205',
    brand: 'GLAMFIX',
    spu: 'GLAMFIX Flawless',
    sku: 'GLAMFIX FLAWLESS EYEBROW BRUSH 1PC/BOX',
    kategori: 'Eye & Lash Tools',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 13520,
  },
  {
    noSku: '671054',
    brand: 'barenbliss',
    spu: 'barenbliss Peach Makes',
    sku: 'BARENBLISS PEACH MAKES PERFECT LIP TINT 12 FL',
    kategori: 'Lip Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 63920,
  },
  {
    noSku: '670316',
    brand: 'barenbliss',
    spu: 'barenbliss Full Bloom',
    sku: 'BARENBLISS FULL BLOOM TRANSFERPROOF MATTE TINT',
    kategori: 'Lip Makeup',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 54648,
  },
  {
    noSku: '672907',
    brand: 'barenbliss',
    spu: 'barenbliss Moist Mochi',
    sku: 'BARENBLISS MOIST MOCHI PASTE POWDER BLUSH 02',
    kategori: 'Face Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'NEW',
    basePrice: 71920,
  },
  {
    noSku: '674208',
    brand: 'barenbliss',
    spu: 'barenbliss Moist Mochi',
    sku: 'BARENBLISS MOIST MOCHI PASTE POWDER BLUSH 04',
    kategori: 'Face Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'NEW',
    basePrice: 71920,
  },
  {
    noSku: '18315',
    brand: 'Y.O.U',
    spu: 'Y.O.U Radiance',
    sku: 'Y.O.U RADIANCE ANTIOXIDANT BRIGHTENING CREAM',
    kategori: 'Skincare',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 79920,
  },
  {
    noSku: '115482',
    brand: 'DAZZLE ME',
    spu: 'DAZZLE ME Lock & Pop',
    sku: 'DAZZLE ME LOCK & POP! VOLUMAX-ING MASCARA',
    kategori: 'Eye & Lash Tools',
    produkFocus: 'FOCUS',
    produkNew: 'EXISTING',
    basePrice: 31920,
  },
  {
    noSku: '5360',
    brand: 'Y.O.U',
    spu: 'Y.O.U AcnePlus',
    sku: 'Y.O.U ACNEPLUS B5 SOOTHING SHEET MASK 25G',
    kategori: 'Skincare',
    produkFocus: 'REGULAR',
    produkNew: 'EXISTING',
    basePrice: 11120,
  },
  {
    noSku: '672471',
    brand: 'barenbliss',
    spu: 'barenbliss Lily Makes',
    sku: 'BARENBLISS LILY MAKES LUMINOUS GLOW TINT 04',
    kategori: 'Lip Makeup',
    produkFocus: 'FOCUS',
    produkNew: 'NEW',
    basePrice: 63920,
  },
];

export const TEAM_STRUCTURE = [
  {
    spv: 'WIDODO',
    region: 'PEKAN BARU',
    salesReps: [
      { name: 'ILHAMSYAH', area: 'AREA BARU' },
      { name: 'LUAR KOTA', area: 'LUAR KOTA' },
      { name: 'BUDI SANTOSO', area: 'AREA BARU' },
    ],
  },
  {
    spv: 'HENDRA GUNAWAN',
    region: 'DUMAI',
    salesReps: [
      { name: 'MAYA SARI', area: 'AREA BARU' },
      { name: 'EKO PRASETYO', area: 'LUAR KOTA' },
    ],
  },
  {
    spv: 'SISKA MELINDA',
    region: 'BATAM',
    salesReps: [
      { name: 'RINA WATI', area: 'AREA BARU' },
      { name: 'ANDI WIJAYA', area: 'LUAR KOTA' },
    ],
  },
];

export const STORES_BY_REGION: Record<string, string[]> = {
  'PEKAN BARU': [
    'TOKO ALANA BEAUTY',
    'SYMPHONY KOSMETIK',
    'I.C.A COSMETIK',
    'Alfamart_DC PEKANBARU',
    'TOKO CANTIK RIAU',
    'SENTOSA JAYA KOSMETIK',
    'MAJU BERSAMA BEAUTY',
    'MUTIARA KOSMETIK',
  ],
  'DUMAI': [
    'DUMAI BEAUTY CENTER',
    'MAHKOTA KOSMETIK DUMAI',
    'TOKO CITRA ASRI',
    'Indomaret_DC DUMAI',
  ],
  'BATAM': [
    'NAGAYA BEAUTY STORE',
    'BATAM COSMETICS HUB',
    'MEGA MALL BEAUTY CORNER',
    'Alfamart_DC BATAM',
  ],
};

// Generates rich, authentic records mirroring the user's uploaded Google Sheet image
function generateSeedData(): TransactionRecord[] {
  const records: TransactionRecord[] = [];
  let idCounter = 1;

  // Base snapshot directly from the user's screenshot
  const directSnapshot = [
    {
      tanggal: '9/30/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: '-', baNo: '-', coverArea: 'AREA BARU',
      sales: 'ILHAMSYAH', spv: 'WIDODO', brand: 'lavojoy', noSku: '18186', spu: 'lavojoy Let It Glc',
      sku: 'LAVOJOY LET IT GLOW BODY SERUM BLACK OPIUM', produkFocus: 'FOCUS', produkNew: 'NO',
      store: 'Alfamart_DC PEKANBARU', region: 'PEKAN BARU', kategori: 'Body Care', qty: -1, value: -31005.45, ket: 'RETURN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: 'Siti Rahma', baNo: 'BA-012', coverArea: 'AREA BARU',
      sales: 'ILHAMSYAH', spv: 'WIDODO', brand: 'Y.O.U', noSku: '18629', spu: 'Y.O.U SUNBRELL',
      sku: 'Y.O.U SUNBRELLA ACNE SHIELD LIGHT SUNSCREEN', produkFocus: 'FOCUS', produkNew: 'EXISTING',
      store: 'TOKO ALANA BEAUTY', region: 'PEKAN BARU', kategori: 'Sunscreen', qty: 12, value: 392640, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: 'Siti Rahma', baNo: 'BA-012', coverArea: 'AREA BARU',
      sales: 'ILHAMSYAH', spv: 'WIDODO', brand: 'GLAMFIX', noSku: '115888', spu: 'GLAMFIX Glam M',
      sku: 'GLAMFIX GLAM MY LASH CURLER - COMB-IN 1PC/BOX', produkFocus: 'REGULAR', produkNew: 'EXISTING',
      store: 'TOKO ALANA BEAUTY', region: 'PEKAN BARU', kategori: 'Eye & Lash Tools', qty: 12, value: 335040, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: '-', baNo: '-', coverArea: 'AREA BARU',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'barenbliss', noSku: '672495', spu: 'barenbliss Lily M',
      sku: 'BARENBLISS LILY MAKES LUMINOUS GLOW TINT 06', produkFocus: 'FOCUS', produkNew: 'NEW',
      store: 'TOKO CANTIK RIAU', region: 'PEKAN BARU', kategori: 'Lip Makeup', qty: 6, value: 383520, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: 'Siti Rahma', baNo: 'BA-012', coverArea: 'AREA BARU',
      sales: 'ILHAMSYAH', spv: 'WIDODO', brand: 'DAZZLE ME', noSku: '115017', spu: 'DAZZLE ME Ink-C',
      sku: 'DAZZLE ME INK-GLOSS LIP TINT R03 FEMME-INK 2.5', produkFocus: 'FOCUS', produkNew: 'EXISTING',
      store: 'TOKO ALANA BEAUTY', region: 'PEKAN BARU', kategori: 'Lip Makeup', qty: 12, value: 248640, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: '-', baNo: '-', coverArea: 'LUAR KOTA',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'DAZZLE ME', noSku: '117509', spu: 'DAZZLE ME Ink-V',
      sku: 'DAZZLE ME INK-VINYL LIP LACQUER 233 MAGIC-IN', produkFocus: 'REGULAR', produkNew: 'EXISTING',
      store: 'TOKO CANTIK RIAU', region: 'PEKAN BARU', kategori: 'Lip Makeup', qty: 12, value: 383040, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: 'Nur Aini', baNo: 'BA-045', coverArea: 'AREA BARU',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'GLAMFIX', noSku: '123685', spu: 'GLAMFIX Wink E',
      sku: 'GLAMFIX WINK ERA CLOUD POPPIN GLUE-FREE CLUSTER', produkFocus: 'FOCUS', produkNew: 'NEW',
      store: 'SYMPHONY KOSMETIK', region: 'PEKAN BARU', kategori: 'Eye & Lash Tools', qty: 6, value: 225120, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: 'Nur Aini', baNo: 'BA-045', coverArea: 'AREA BARU',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'Y.O.U', noSku: '21018', spu: 'Y.O.U SUNBRELL',
      sku: 'Y.O.U SUNBRELLA SAKURA-NIACINAMIDE SUNSCREEN', produkFocus: 'FOCUS', produkNew: 'EXISTING',
      store: 'SYMPHONY KOSMETIK', region: 'PEKAN BARU', kategori: 'Sunscreen', qty: 3, value: 155760, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: '-', baNo: '-', coverArea: 'AREA BARU',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'Y.O.U', noSku: '15604', spu: 'Y.O.U Cloud Pain',
      sku: 'Y.O.U CLOUD PAINT MATTE LASTING LIP CREAM R877', produkFocus: 'REGULAR', produkNew: 'EXISTING',
      store: 'I.C.A COSMETIK', region: 'PEKAN BARU', kategori: 'Lip Makeup', qty: 3, value: 155760, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: 'Nur Aini', baNo: 'BA-045', coverArea: 'AREA BARU',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'barenbliss', noSku: '671528', spu: 'barenbliss Apple',
      sku: 'BARENBLISS APPLE MAKES ADORABLE MOUSSE TINT', produkFocus: 'REGULAR', produkNew: 'EXISTING',
      store: 'SYMPHONY KOSMETIK', region: 'PEKAN BARU', kategori: 'Lip Makeup', qty: 2, value: 121440, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: '-', baNo: '-', coverArea: 'LUAR KOTA',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'barenbliss', noSku: '673546', spu: 'barenbliss Lockl',
      sku: 'BARENBLISS LOCKLOOK MATTE & BLUR PRIMER 20G', produkFocus: 'FOCUS', produkNew: 'NEW',
      store: 'TOKO CANTIK RIAU', region: 'PEKAN BARU', kategori: 'Face Makeup', qty: 6, value: 388320, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: 'Nur Aini', baNo: 'BA-045', coverArea: 'AREA BARU',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'GLAMFIX', noSku: '898478', spu: 'GLAMFIX Maxi C',
      sku: 'GLAMFIX MAXI CURL LASH CURLER 1PC/BOX', produkFocus: 'REGULAR', produkNew: 'EXISTING',
      store: 'SYMPHONY KOSMETIK', region: 'PEKAN BARU', kategori: 'Eye & Lash Tools', qty: 12, value: 287040, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: '-', baNo: '-', coverArea: 'AREA BARU',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'GLAMFIX', noSku: '118803', spu: 'GLAMFIX Wink E',
      sku: 'GLAMFIX WINK ERA POPPIN GLUE-FREE CLUSTER', produkFocus: 'REGULAR', produkNew: 'NEW',
      store: 'I.C.A COSMETIK', region: 'PEKAN BARU', kategori: 'Eye & Lash Tools', qty: 4, value: 150080, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: 'Siti Rahma', baNo: 'BA-012', coverArea: 'AREA BARU',
      sales: 'ILHAMSYAH', spv: 'WIDODO', brand: 'barenbliss', noSku: '673829', spu: 'barenbliss Moist',
      sku: 'BARENBLISS MOIST MOCHI PASTE PH-CREAM BLUSH', produkFocus: 'FOCUS', produkNew: 'NEW',
      store: 'TOKO ALANA BEAUTY', region: 'PEKAN BARU', kategori: 'Face Makeup', qty: 6, value: 431520, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: '-', baNo: '-', coverArea: 'AREA BARU',
      sales: 'ILHAMSYAH', spv: 'WIDODO', brand: 'Y.O.U', noSku: '1836', spu: 'Y.O.U Hy! Amino',
      sku: 'Y.O.U HY! AMINO AC-TTACK ANTI-ACNE FACIAL WASH', produkFocus: 'FOCUS', produkNew: 'EXISTING',
      store: 'Alfamart_DC PEKANBARU', region: 'PEKAN BARU', kategori: 'Cleanser & Wash', qty: 320, value: 6981968, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: 'Siti Rahma', baNo: 'BA-012', coverArea: 'AREA BARU',
      sales: 'ILHAMSYAH', spv: 'WIDODO', brand: 'DAZZLE ME', noSku: '115048', spu: 'DAZZLE ME Ink-C',
      sku: 'DAZZLE ME INK-GLOSS LIP TINT 006 FRESH-INK 2.5', produkFocus: 'FOCUS', produkNew: 'EXISTING',
      store: 'TOKO ALANA BEAUTY', region: 'PEKAN BARU', kategori: 'Lip Makeup', qty: 12, value: 248640, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: 'Siti Rahma', baNo: 'BA-012', coverArea: 'AREA BARU',
      sales: 'ILHAMSYAH', spv: 'WIDODO', brand: 'barenbliss', noSku: '672464', spu: 'barenbliss Lily M',
      sku: 'BARENBLISS LILY MAKES LUMINOUS GLOW TINT 03', produkFocus: 'FOCUS', produkNew: 'NEW',
      store: 'TOKO ALANA BEAUTY', region: 'PEKAN BARU', kategori: 'Lip Makeup', qty: 6, value: 383520, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: '-', baNo: '-', coverArea: 'AREA BARU',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'DAZZLE ME', noSku: '117479', spu: 'DAZZLE ME Ink-V',
      sku: 'DAZZLE ME INK-VINYL LIP LACQUER 035 ICON-INK', produkFocus: 'REGULAR', produkNew: 'EXISTING',
      store: 'SYMPHONY KOSMETIK', region: 'PEKAN BARU', kategori: 'Lip Makeup', qty: 2, value: 63840, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: '-', baNo: '-', coverArea: 'LUAR KOTA',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'barenbliss', noSku: '676769', spu: 'barenbliss Peach',
      sku: 'BARENBLISS PEACH MAKES PERFECT LIP TINT S14', produkFocus: 'FOCUS', produkNew: 'EXISTING',
      store: 'I.C.A COSMETIK', region: 'PEKAN BARU', kategori: 'Lip Makeup', qty: 6, value: 335520, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: 'Siti Rahma', baNo: 'BA-012', coverArea: 'AREA BARU',
      sales: 'ILHAMSYAH', spv: 'WIDODO', brand: 'DAZZLE ME', noSku: '107432', spu: 'DAZZLE ME The',
      sku: 'DAZZLE ME THE WORLD TRAVELER EYESHADOW PALETTE', produkFocus: 'REGULAR', produkNew: 'EXISTING',
      store: 'TOKO ALANA BEAUTY', region: 'PEKAN BARU', kategori: 'Eye & Lash Tools', qty: 12, value: 459840, ket: 'SELL IN'
    },
    {
      tanggal: '9/29/2026', bulan: 'SEPTEMBER', tahun: 2026, ba: '-', baNo: '-', coverArea: 'LUAR KOTA',
      sales: 'LUAR KOTA', spv: 'WIDODO', brand: 'GLAMFIX', noSku: '123708', spu: 'GLAMFIX Wink E',
      sku: 'GLAMFIX WINK ERA CLOUD POPPIN GLUE-FREE CLUSTER', produkFocus: 'FOCUS', produkNew: 'NEW',
      store: 'I.C.A COSMETIK', region: 'PEKAN BARU', kategori: 'Eye & Lash Tools', qty: 12, value: 450240, ket: 'SELL IN'
    },
  ];

  // Add the direct snapshot items
  directSnapshot.forEach((d) => {
    records.push({
      id: `row-${idCounter++}`,
      TANGGAL: d.tanggal,
      BULAN: d.bulan,
      TAHUN: d.tahun,
      BA: d.ba,
      BA_Number: d.baNo,
      COVER_AREA: d.coverArea,
      SALES: d.sales,
      SPV: d.spv,
      BRAND: d.brand,
      NO_SKU: d.noSku,
      SPU: d.spu,
      SKU: d.sku,
      PRODUK_FOCUS: d.produkFocus,
      PRODUK_NEW: d.produkNew,
      NAMA_STORE: d.store,
      REGION: d.region,
      KATEGORI: d.kategori,
      QTY: d.qty,
      VALUE: d.value,
      KET: d.ket,
      weekNumber: 39,
    });
  });

  // Seed broader historical and multi-period data across 2025 and 2026
  // This allows accurate calculations for:
  // - Harian (day-by-day in September 2026)
  // - Mingguan (Weeks 36, 37, 38, 39, 40)
  // - Bulanan (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep)
  // - Tahunan (2025 vs 2026)
  // - WoW (Week 39 vs Week 38)
  // - MoM (September vs August)
  // - YoY (2026 vs 2025)

  const monthNames = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];

  // Deterministic PRNG for consistent realistic data
  let seed = 42;
  function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  // Generate records for both 2025 and 2026
  const simulationConfigs = [
    // 2026: Active Year, heavy September data + Jan-Aug monthly trends
    { year: 2026, months: [0, 1, 2, 3, 4, 5, 6, 7, 8], growthFactor: 1.22 },
    // 2025: Baseline Year for YoY comparison
    { year: 2025, months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], growthFactor: 1.0 },
  ];

  simulationConfigs.forEach(({ year, months, growthFactor }) => {
    months.forEach((mIndex) => {
      const monthName = monthNames[mIndex];
      // Number of transactions per month (higher in Sep 2026)
      const isSep2026 = year === 2026 && mIndex === 8;
      const txCount = isSep2026 ? 85 : 22;

      for (let i = 0; i < txCount; i++) {
        // Pick team & sales rep
        const team = TEAM_STRUCTURE[Math.floor(random() * TEAM_STRUCTURE.length)];
        const salesRep = team.salesReps[Math.floor(random() * team.salesReps.length)];
        const stores = STORES_BY_REGION[team.region] || STORES_BY_REGION['PEKAN BARU'];
        const store = stores[Math.floor(random() * stores.length)];
        const product = MASTER_PRODUCTS[Math.floor(random() * MASTER_PRODUCTS.length)];

        // Calculate realistic date
        const day = isSep2026
          ? Math.floor(random() * 30) + 1
          : Math.floor(random() * 28) + 1;
        const dateStr = `${mIndex + 1}/${day}/${year}`;

        // Calculate approximate week number
        const approxWeek = Math.min(52, Math.max(1, Math.floor((mIndex * 30.5 + day) / 7)));

        // Quantities: mostly 2, 3, 6, 12, 24, occasionally 60 or bulk 120 (Alfamart/Indomaret)
        let qty = [2, 3, 6, 12, 12, 24][Math.floor(random() * 6)];
        if (store.includes('DC') && random() > 0.6) {
          qty = [60, 120, 180, 240][Math.floor(random() * 4)];
        }

        // Return rate ~2.5%
        const isReturn = random() < 0.025;
        let ket = 'SELL IN';
        if (isReturn) {
          ket = 'RETURN';
          qty = -Math.max(1, Math.floor(qty / 4));
        } else if (random() < 0.15) {
          ket = 'SELL OUT';
        }

        const unitValue = Math.round(product.basePrice * growthFactor);
        const totalValue = isReturn ? -(Math.abs(qty) * unitValue) : (qty * unitValue);

        records.push({
          id: `row-${idCounter++}`,
          TANGGAL: dateStr,
          BULAN: monthName,
          TAHUN: year,
          BA: random() > 0.4 ? 'Siti Rahma' : '-',
          BA_Number: random() > 0.4 ? 'BA-012' : '-',
          COVER_AREA: salesRep.area,
          SALES: salesRep.name,
          SPV: team.spv,
          BRAND: product.brand,
          NO_SKU: product.noSku,
          SPU: product.spu,
          SKU: product.sku,
          PRODUK_FOCUS: product.produkFocus,
          PRODUK_NEW: product.produkNew,
          NAMA_STORE: store,
          REGION: team.region,
          KATEGORI: product.kategori,
          QTY: qty,
          VALUE: totalValue,
          KET: ket,
          weekNumber: approxWeek,
        });
      }
    });
  });

  return records;
}

export const INITIAL_DATA: TransactionRecord[] = generateSeedData();
