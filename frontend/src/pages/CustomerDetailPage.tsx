import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCustomer, getCustomerSummary } from '../api/customers';
import { getLoansByCustomer } from '../api/loans';
import type { Customer, Loan, CustomerSummary } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const load = async () => {
    if (!id) return;
    const [c, l, s] = await Promise.all([
      getCustomer(id).catch(() => { navigate('/'); return null; }),
      getLoansByCustomer(id).catch(() => [] as Loan[]),
      getCustomerSummary(id).catch(() => null),
    ]);
    if (c) setCustomer(c);
    setLoans(l as Loan[]);
    if (s) setSummary(s);
  };

  useEffect(() => { load(); }, [id]);

  if (!customer) return <p className="p-6 text-gray-400">Yukleniyor...</p>;

  const activeLoans = loans.filter(l => l.status === 'Active');

  const scoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'text-gray-400';
    if (score === 0)    return 'text-gray-500';
    if (score <= 699)  return 'text-red-600';
    if (score <= 1099) return 'text-orange-500';
    if (score <= 1499) return 'text-yellow-600';
    if (score <= 1699) return 'text-blue-600';
    return 'text-green-600';
  };
  const riskLabel = (score?: number) => {
    if (score === undefined || score === null) return '—';
    if (score === 0)    return 'Puani Yok';
    if (score <= 699)  return 'En Riskli';
    if (score <= 1099) return 'Orta Riskli';
    if (score <= 1499) return 'Az Riskli';
    if (score <= 1699) return 'Iyi';
    return 'Cok Iyi';
  };

  const loanTypeLabel = (type: string) =>
    type === 'Ihtiyac' ? 'Ihtiyac' : type === 'Egitim' ? 'Egitim' : 'Tasit';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/')} className="text-blue-600 text-sm hover:underline mb-4 inline-block">
        &larr; Musteri Listesi
      </button>

      {/* Musteri bilgileri */}
      <div className="bg-white border rounded-xl p-6 shadow-sm mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{customer.firstName} {customer.lastName}</h1>
            <p className="text-gray-500 text-sm mt-1">{customer.email}</p>
          </div>
          <div className="flex gap-2">
            {activeLoans.length > 0 && (
              <button
                onClick={() => setShowPayModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                Odeme Yap
              </button>
            )}
            <Link to={`/customers/${id}/loans/new`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              + Kredi Basvurusu
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-gray-600">
          <div><span className="font-medium">TC No:</span> {customer.tcNo}</div>
          <div><span className="font-medium">Telefon:</span> {customer.phone ?? '—'}</div>
          <div><span className="font-medium">Dogum:</span> {customer.birthDate}</div>
          {customer.address && (
            <div className="col-span-3"><span className="font-medium">Adres:</span> {customer.address}</div>
          )}
        </div>
      </div>

      {/* Borc Ozeti */}
      {summary && (
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-blue-700">{summary.activeLoanCount}</p>
            <p className="text-xs text-gray-500 mt-1">Aktif Kredi</p>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-800">{summary.totalDebt.toLocaleString('tr-TR')} TL</p>
            <p className="text-xs text-gray-500 mt-1">Toplam Borc</p>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-600">{summary.remainingPrincipal.toLocaleString('tr-TR')} TL</p>
            <p className="text-xs text-gray-500 mt-1">Kalan Anapara</p>
          </div>
          <div className={`border rounded-xl p-4 shadow-sm text-center ${summary.overdueInstallmentCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
            <p className={`text-xl font-bold ${summary.overdueInstallmentCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {summary.overdueInstallmentCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">Gecikmis Taksit</p>
          </div>

          {/* Kredi Puani karti */}
          <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
            <p className={`text-xl font-bold ${scoreColor(customer.creditScore)}`}>
              {customer.creditScore ?? '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Kredi Puani</p>
            {customer.creditScore != null && (
              <p className={`text-xs font-medium mt-0.5 ${scoreColor(customer.creditScore)}`}>
                {riskLabel(customer.creditScore)}
              </p>
            )}
            {customer.creditScoreUpdatedAt && (
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(customer.creditScoreUpdatedAt).toLocaleDateString('tr-TR')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Taksit ilerleme bari */}
      {summary && (summary.paidInstallmentCount + summary.unpaidInstallmentCount) > 0 && (
        <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Taksit Ilerlemesi</span>
            <span>{summary.paidInstallmentCount} / {summary.paidInstallmentCount + summary.unpaidInstallmentCount} odendi</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(summary.paidInstallmentCount / (summary.paidInstallmentCount + summary.unpaidInstallmentCount)) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Krediler */}
      <h2 className="text-lg font-semibold text-gray-700 mb-3">Krediler</h2>
      {loans.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-gray-400 shadow-sm">
          Henuz kredi basvurusu yok.
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map(loan => (
            <div key={loan.id} className="bg-white border rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={loan.status} />
                  <span className="text-sm font-medium text-gray-700">
                    {loanTypeLabel(loan.loanType)} Kredisi
                  </span>
                </div>
                <Link to={`/loans/${loan.id}/installments`} className="text-blue-600 text-xs hover:underline">
                  Taksitler &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3 text-sm text-gray-600">
                <div><span className="font-medium">Anapara:</span> {loan.principal.toLocaleString('tr-TR')} TL</div>
                <div><span className="font-medium">Toplam:</span> {loan.totalAmount.toLocaleString('tr-TR')} TL</div>
                <div><span className="font-medium">Aylik:</span> {loan.monthlyPayment.toLocaleString('tr-TR')} TL</div>
                <div><span className="font-medium">Vade:</span> {loan.termMonths} ay</div>
              </div>
              {loan.creditScore && (
                <p className="text-xs text-gray-400 mt-2">Basvuru Ani Kredi Skoru: {loan.creditScore}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Kredi Secim Modali */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Odeme yapilacak krediyi secin</h2>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="space-y-2">
              {activeLoans.map(loan => (
                <button
                  key={loan.id}
                  onClick={() => navigate(`/payments?loanId=${loan.id}`)}
                  className="w-full text-left border rounded-xl p-4 hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {loanTypeLabel(loan.loanType)} Kredisi
                    </span>
                    <span className="text-xs text-gray-400">{loan.termMonths} ay</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      Anapara: {loan.principal.toLocaleString('tr-TR')} TL
                    </span>
                    <span className="text-xs font-medium text-green-700">
                      Aylik: {loan.monthlyPayment.toLocaleString('tr-TR')} TL
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
