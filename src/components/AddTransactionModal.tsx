import React, { useState } from 'react';
import { X, PlusCircle, Check } from 'lucide-react';
import { TransactionRecord } from '../types/dashboard';
import { MASTER_PRODUCTS, TEAM_STRUCTURE, STORES_BY_REGION } from '../data/initialData';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (record: TransactionRecord) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddRecord,
}) => {
  const [tanggal, setTanggal] = useState('9/30/2026');
  const [bulan, setBulan] = useState('SEPTEMBER');
  const [tahun, setTahun] = useState(2026);
  const [spv, setSpv] = useState('WIDODO');
  const [sales, setSales] = useState('ILHAMSYAH');
  const [region, setRegion] = useState('PEKAN BARU');
  const [store, setStore] = useState('TOKO ALANA BEAUTY');
  const [brand, setBrand] = useState('barenbliss');
  const [selectedSkuIndex, setSelectedSkuIndex] = useState(0);
  const [qty, setQty] = useState(6);
  const [ket, setKet] = useState('SELL IN');

  if (!isOpen) return null;

  const currentProduct = MASTER_PRODUCTS[selectedSkuIndex] || MASTER_PRODUCTS[0];
  const calculatedValue = ket === 'RETURN'
    ? -(Math.abs(qty) * currentProduct.basePrice)
    : qty * currentProduct.basePrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: TransactionRecord = {
      id: `manual-row-${Date.now()}`,
      TANGGAL: tanggal,
      BULAN: bulan,
      TAHUN: Number(tahun),
      BA: 'Siti Rahma',
      BA_Number: 'BA-012',
      COVER_AREA: 'AREA BARU',
      SALES: sales,
      SPV: spv,
      BRAND: currentProduct.brand,
      NO_SKU: currentProduct.noSku,
      SPU: currentProduct.spu,
      SKU: currentProduct.sku,
      PRODUK_FOCUS: currentProduct.produkFocus,
      PRODUK_NEW: currentProduct.produkNew,
      NAMA_STORE: store,
      REGION: region,
      KATEGORI: currentProduct.kategori,
      QTY: Number(qty),
      VALUE: calculatedValue,
      KET: ket,
      weekNumber: 39,
    };

    onAddRecord(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Tambah Transaksi Penjualan Baru
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">TANGGAL</label>
              <input
                type="text"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                placeholder="M/D/YYYY"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">BULAN</label>
              <select
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                {['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">TAHUN</label>
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">SPV (Supervisor)</label>
              <select
                value={spv}
                onChange={(e) => setSpv(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                {TEAM_STRUCTURE.map((t) => (
                  <option key={t.spv} value={t.spv}>{t.spv}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SALES PERSON</label>
              <select
                value={sales}
                onChange={(e) => setSales(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="ILHAMSYAH">ILHAMSYAH</option>
                <option value="LUAR KOTA">LUAR KOTA</option>
                <option value="BUDI SANTOSO">BUDI SANTOSO</option>
                <option value="MAYA SARI">MAYA SARI</option>
                <option value="EKO PRASETYO">EKO PRASETYO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">REGION</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                {Object.keys(STORES_BY_REGION).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">NAMA STORE</label>
              <select
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                {(STORES_BY_REGION[region] || STORES_BY_REGION['PEKAN BARU']).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">PILIH PRODUK / SKU</label>
            <select
              value={selectedSkuIndex}
              onChange={(e) => setSelectedSkuIndex(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              {MASTER_PRODUCTS.map((prod, idx) => (
                <option key={prod.noSku} value={idx}>
                  [{prod.brand}] {prod.sku} (Rp {prod.basePrice.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">KUANTITAS (QTY)</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                min="1"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">KETERANGAN (KET)</label>
              <select
                value={ket}
                onChange={(e) => setKet(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="SELL IN">SELL IN</option>
                <option value="SELL OUT">SELL OUT</option>
                <option value="RETURN">RETURN (Retur)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
            <span className="font-medium text-emerald-800">Total Nilai Otomatis:</span>
            <span className="font-mono font-bold text-emerald-900 text-sm">
              Rp {Math.round(calculatedValue).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
