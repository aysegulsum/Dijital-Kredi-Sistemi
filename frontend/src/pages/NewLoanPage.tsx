import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createLoan } from '../api/loans';
import type { CreateLoanRequest } from '../types';

export default function NewLoanPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Omit<CreateLoanRequest, 'customerId'>>({
    principal: 10000,
    interestRate: 0.02,
    termMonths: 12,
    loanType: 'Ihtiyac',
    startDate: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Önizleme hesabı (flat-rate)
  const total = +(form.principal * (1 + form.interestRate * form.termMonths)).toFixed(2);
  const monthly = +(total / form.termMonths).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createLoan({ ...form, customerId: customerId! });
      navigate(`/customers/${customerId}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail ?? err.response?.data?.errors;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) ?? 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(`/customers/${customerId}`)}
        className="text-blue-600 text-sm hover:underline mb-4 inline-block">
        ← Müşteri Detayı
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Kredi Başvurusu</h1>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Kredi Türü</label>
          <select value={form.loanType}
            onChange={e => setForm(f => ({ ...f, loanType: e.target.value as any }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="Ihtiyac">İhtiyaç</option>
            <option value="Egitim">Eğitim</option>
            <option value="Tasit">Taşıt</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Anapara (₺)</label>
          <input type="number" min={1000} step={500} required value={form.principal}
            onChange={e => setForm(f => ({ ...f, principal: +e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Aylık Faiz Oranı ({(form.interestRate * 100).toFixed(1)}%)
          </label>
          <input type="range" min={0.005} max={0.05} step={0.005} value={form.interestRate}
            onChange={e => setForm(f => ({ ...f, interestRate: +e.target.value }))}
            className="w-full accent-blue-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0.5%</span><span>5.0%</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Vade (Ay)</label>
          <select value={form.termMonths}
            onChange={e => setForm(f => ({ ...f, termMonths: +e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            {[3, 6, 12, 18, 24, 36, 48, 60].map(m => (
              <option key={m} value={m}>{m} ay</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Başlangıç Tarihi</label>
          <input type="date" required value={form.startDate}
            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>

        {/* Önizleme */}
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Tahmini Hesap</p>
          <div className="flex justify-between">
            <span>Toplam Ödenecek</span>
            <span className="font-bold">{total.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Aylık Taksit</span>
            <span className="font-bold">{monthly.toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>

        <button disabled={loading} type="submit"
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
        </button>
      </form>
    </div>
  );
}
