import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInstallmentsByLoan } from '../api/installments';
import type { Installment } from '../types';
import StatusBadge from '../components/StatusBadge';

type Filter = 'Tumu' | 'Pending' | 'Paid' | 'Overdue';

const filterLabels: Record<Filter, string> = {
  Tumu: 'Tümü',
  Pending: 'Bekliyor',
  Paid: 'Ödendi',
  Overdue: 'Gecikmiş',
};

export default function InstallmentsPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [filter, setFilter] = useState<Filter>('Tumu');

  const load = () =>
    getInstallmentsByLoan(loanId!).then(setInstallments).catch(() => navigate(-1));

  useEffect(() => { load(); }, [loanId]);

  const counts = {
    Tumu:    installments.length,
    Pending: installments.filter(i => i.status === 'Pending').length,
    Paid:    installments.filter(i => i.status === 'Paid').length,
    Overdue: installments.filter(i => i.status === 'Overdue').length,
  };

  const filtered = filter === 'Tumu'
    ? installments
    : installments.filter(i => i.status === filter);

  const paidAmount  = installments.reduce((s, i) => s + i.paidAmount, 0);
  const totalAmount = installments.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm hover:text-indigo-800 mb-4 inline-flex items-center gap-1 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Geri
      </button>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-800">Taksit Planı</h1>
        <Link to={`/payments?loanId=${loanId}`}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all">
          Ödeme Yap
        </Link>
      </div>

      {/* Ozet kartlar */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-slate-800">{counts.Paid}/{counts.Tumu}</p>
          <p className="text-xs text-slate-400 mt-1">Ödenen Taksit</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-indigo-600">{paidAmount.toLocaleString('tr-TR')} TL</p>
          <p className="text-xs text-slate-400 mt-1">Ödenen Tutar</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-slate-400">{(totalAmount - paidAmount).toLocaleString('tr-TR')} TL</p>
          <p className="text-xs text-slate-400 mt-1">Kalan Tutar</p>
        </div>
      </div>

      {/* Ilerleme bari */}
      {counts.Tumu > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-5">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>İlerleme</span>
            <span className="font-medium text-slate-600">{Math.round((counts.Paid / counts.Tumu) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
              style={{ width: `${(counts.Paid / counts.Tumu) * 100}%` }} />
            <div className="h-full bg-red-400 transition-all"
              style={{ width: `${(counts.Overdue / counts.Tumu) * 100}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" />Ödendi</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Gecikmiş</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200" />Bekliyor</span>
          </div>
        </div>
      )}

      {/* Filtre sekmeleri */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(filterLabels) as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
            }`}>
            {filterLabels[f]}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              filter === f ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
            }`}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Taksit tablosu */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-slate-400 text-center py-10 text-sm">Bu kategoride taksit yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutar</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ödenen</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kalan</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Son Ödeme</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(inst => (
                <tr key={inst.id} className={`transition-colors ${
                  inst.status === 'Overdue' ? 'bg-red-50/60' :
                  inst.status === 'Paid' ? 'bg-emerald-50/30' : 'hover:bg-slate-50/80'
                }`}>
                  <td className="px-5 py-3 text-slate-400 font-medium">{inst.installmentNo}</td>
                  <td className="px-5 py-3 font-semibold text-slate-700">{inst.amount.toLocaleString('tr-TR')} TL</td>
                  <td className="px-5 py-3 text-emerald-600">
                    {inst.paidAmount > 0 ? `${inst.paidAmount.toLocaleString('tr-TR')} TL` : '-'}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {inst.remainingAmount > 0 ? `${inst.remainingAmount.toLocaleString('tr-TR')} TL` : '-'}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{inst.dueDate}</td>
                  <td className="px-5 py-3"><StatusBadge status={inst.status} /></td>
                  <td className="px-5 py-3 text-slate-300 text-xs font-mono">
                    {inst.payments.length > 0 ? inst.payments[inst.payments.length - 1].paymentRef ?? '-' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
