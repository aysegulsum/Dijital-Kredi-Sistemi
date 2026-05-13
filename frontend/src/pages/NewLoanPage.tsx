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

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(`/customers/${customerId}`)}
        className="text-indigo-600 text-sm hover:text-indigo-800 mb-4 inline-flex items-center gap-1 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Müşteri Detayı
      </button>

      <h1 className="text-2xl font-bold text-slate-800 mb-6">Kredi Başvurusu</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">{error}</p>}

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Kredi Türü</label>
          <select value={form.loanType}
            onChange={e => setForm(f => ({ ...f, loanType: e.target.value as any }))}
            className={inputCls}>
            <option value="Ihtiyac">İhtiyaç</option>
            <option value="Egitim">Eğitim</option>
            <option value="Tasit">Taşıt</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Anapara (TL)</label>
          <input type="number" min={1000} step={500} required value={form.principal}
            onChange={e => setForm(f => ({ ...f, principal: +e.target.value }))}
            className={inputCls} />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">
            Aylık Faiz Oranı <span className="text-indigo-600 font-semibold">%{(form.interestRate * 100).toFixed(1)}</span>
          </label>
          <input type="range" min={0.005} max={0.05} step={0.005} value={form.interestRate}
            onChange={e => setForm(f => ({ ...f, interestRate: +e.target.value }))}
            className="w-full accent-indigo-600 h-2" />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>%0.5</span><span>%5.0</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Vade</label>
          <select value={form.termMonths}
            onChange={e => setForm(f => ({ ...f, termMonths: +e.target.value }))}
            className={inputCls}>
            {[3, 6, 12, 18, 24, 36, 48, 60].map(m => (
              <option key={m} value={m}>{m} ay</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Başlangıç Tarihi</label>
          <input type="date" required value={form.startDate}
            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            className={inputCls} />
        </div>

        {/* Onizleme */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
          <p className="font-semibold text-sm text-indigo-800 mb-3">Tahmini Hesap</p>
          <div className="flex justify-between text-sm text-indigo-700">
            <span>Toplam Ödenecek</span>
            <span className="font-bold text-base">{total.toLocaleString('tr-TR')} TL</span>
          </div>
          <div className="flex justify-between text-sm text-indigo-700 mt-2">
            <span>Aylık Taksit</span>
            <span className="font-bold text-base">{monthly.toLocaleString('tr-TR')} TL</span>
          </div>
        </div>

        <button disabled={loading} type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-200 transition-all">
          {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
        </button>
      </form>
    </div>
  );
}
