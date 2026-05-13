import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInstallmentsByLoan } from '../api/installments';
import { createPayment } from '../api/payments';
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
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loadingPay, setLoadingPay] = useState(false);

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

  const paidAmount  = installments.filter(i => i.payment).reduce((s, i) => s + (i.payment?.amountPaid ?? 0), 0);
  const totalAmount = installments.reduce((s, i) => s + i.amount, 0);

  const handlePay = async (inst: Installment) => {
    setError(''); setLoadingPay(true);
    try {
      await createPayment(inst.id, inst.amount);
      setPaying(null);
      await load();
    } catch (err: any) {
      const d = err.response?.data?.detail ?? err.response?.data?.errors;
      setError(typeof d === 'string' ? d : JSON.stringify(d) ?? 'Ödeme başarısız.');
    } finally { setLoadingPay(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-blue-600 text-sm hover:underline mb-4 inline-block">
        ← Geri
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">Taksit Planı</h1>

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-800">{counts.Paid}/{counts.Tumu}</p>
          <p className="text-xs text-gray-500 mt-1">Ödenen Taksit</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-700">{paidAmount.toLocaleString('tr-TR')} ₺</p>
          <p className="text-xs text-gray-500 mt-1">Ödenen Tutar</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-400">{(totalAmount - paidAmount).toLocaleString('tr-TR')} ₺</p>
          <p className="text-xs text-gray-500 mt-1">Kalan Tutar</p>
        </div>
      </div>

      {/* İlerleme barı */}
      {counts.Tumu > 0 && (
        <div className="bg-white border rounded-xl p-4 shadow-sm mb-5">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>İlerleme</span>
            <span>{Math.round((counts.Paid / counts.Tumu) * 100)}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-blue-500 transition-all"
              style={{ width: `${(counts.Paid / counts.Tumu) * 100}%` }} />
            <div className="h-full bg-red-400 transition-all"
              style={{ width: `${(counts.Overdue / counts.Tumu) * 100}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Ödendi</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Gecikmiş</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />Bekliyor</span>
          </div>
        </div>
      )}

      {/* Filtre sekmeleri */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(filterLabels) as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-600 hover:border-blue-400'
            }`}>
            {filterLabels[f]}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              filter === f ? 'bg-blue-500' : 'bg-gray-100 text-gray-500'
            }`}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

      {/* Taksit tablosu */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-10 text-sm">Bu kategoride taksit yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Tutar</th>
                <th className="text-left px-4 py-3">Son Ödeme</th>
                <th className="text-left px-4 py-3">Durum</th>
                <th className="text-left px-4 py-3">Ödeme Ref</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inst => (
                <>
                  <tr key={inst.id} className={`border-b last:border-0 ${inst.status === 'Overdue' ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 text-gray-500">{inst.installmentNo}</td>
                    <td className="px-4 py-3 font-medium">{inst.amount.toLocaleString('tr-TR')} ₺</td>
                    <td className="px-4 py-3 text-gray-600">{inst.dueDate}</td>
                    <td className="px-4 py-3"><StatusBadge status={inst.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{inst.payment?.paymentRef ?? '—'}</td>
                    <td className="px-4 py-3">
                      {(inst.status === 'Pending' || inst.status === 'Overdue') && paying !== inst.id && (
                        <button onClick={() => { setPaying(inst.id); setError(''); }}
                          className="text-blue-600 text-xs hover:underline">Öde</button>
                      )}
                      {paying === inst.id && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{inst.amount.toLocaleString('tr-TR')} ₺</span>
                          <button onClick={() => handlePay(inst)} disabled={loadingPay}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50">
                            {loadingPay ? '...' : 'Onayla'}
                          </button>
                          <button onClick={() => setPaying(null)} className="text-gray-400 text-xs hover:text-gray-600">
                            İptal
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
