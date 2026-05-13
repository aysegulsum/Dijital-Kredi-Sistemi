import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInstallmentsByLoan } from '../api/installments';
import { createPayment } from '../api/payments';
import type { Installment } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function InstallmentsPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [paying, setPaying] = useState<string | null>(null); // installment id
  const [error, setError] = useState('');
  const [loadingPay, setLoadingPay] = useState(false);

  const load = () =>
    getInstallmentsByLoan(loanId!).then(setInstallments).catch(() => navigate(-1));

  useEffect(() => { load(); }, [loanId]);

  const paidCount = installments.filter(i => i.status === 'Paid').length;
  const totalAmount = installments.reduce((s, i) => s + i.amount, 0);
  const paidAmount = installments.filter(i => i.payment).reduce((s, i) => s + (i.payment?.amountPaid ?? 0), 0);

  const handlePay = async (inst: Installment) => {
    setError('');
    setLoadingPay(true);
    try {
      await createPayment(inst.id, inst.amount);
      setPaying(null);
      await load();
    } catch (err: any) {
      const detail = err.response?.data?.detail ?? err.response?.data?.errors;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) ?? 'Ödeme başarısız.');
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="text-blue-600 text-sm hover:underline mb-4 inline-block">
        ← Geri
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">Taksit Planı</h1>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-800">{paidCount}/{installments.length}</p>
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

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
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
            {installments.map(inst => (
              <tr key={inst.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{inst.installmentNo}</td>
                <td className="px-4 py-3 font-medium">{inst.amount.toLocaleString('tr-TR')} ₺</td>
                <td className="px-4 py-3 text-gray-600">{inst.dueDate}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={inst.status} />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {inst.payment?.paymentRef ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {inst.status === 'Pending' || inst.status === 'Overdue' ? (
                    paying === inst.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">{inst.amount.toLocaleString('tr-TR')} ₺ ödenecek</span>
                        <button
                          onClick={() => handlePay(inst)}
                          disabled={loadingPay}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50">
                          {loadingPay ? '...' : 'Onayla'}
                        </button>
                        <button onClick={() => setPaying(null)}
                          className="text-gray-400 text-xs hover:text-gray-600">İptal</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setPaying(inst.id); setError(''); }}
                        className="text-blue-600 text-xs hover:underline">
                        Öde
                      </button>
                    )
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
