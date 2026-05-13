import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCustomer, getCustomerSummary } from '../api/customers';
import { getLoansByCustomer, updateLoan } from '../api/loans';
import type { Customer, Loan, CustomerSummary } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [editLoanType, setEditLoanType] = useState<string>('');

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

  if (!customer) return <p className="p-6 text-slate-400">Yükleniyor...</p>;

  const activeLoans = loans.filter(l => l.status === 'Active');

  const scoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'text-slate-400';
    if (score === 0)    return 'text-slate-500';
    if (score <= 699)  return 'text-red-600';
    if (score <= 1099) return 'text-orange-500';
    if (score <= 1499) return 'text-amber-600';
    if (score <= 1699) return 'text-blue-600';
    return 'text-emerald-600';
  };
  const riskLabel = (score?: number) => {
    if (score === undefined || score === null) return '—';
    if (score === 0)    return 'Puanı Yok';
    if (score <= 699)  return 'En Riskli';
    if (score <= 1099) return 'Orta Riskli';
    if (score <= 1499) return 'Az Riskli';
    if (score <= 1699) return 'İyi';
    return 'Çok İyi';
  };

  const loanTypeLabel = (type: string) =>
    type === 'Ihtiyac' ? 'İhtiyaç' : type === 'Egitim' ? 'Eğitim' : 'Taşıt';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/')} className="text-indigo-600 text-sm hover:text-indigo-800 mb-4 inline-flex items-center gap-1 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Müşteri Listesi
      </button>

      {/* Musteri bilgileri */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200">
              {customer.firstName[0]}{customer.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{customer.firstName} {customer.lastName}</h1>
              <p className="text-slate-400 text-sm mt-0.5">{customer.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeLoans.length > 0 && (
              <button
                onClick={() => setShowPayModal(true)}
                className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all">
                Ödeme Yap
              </button>
            )}
            <Link to={`/customers/${id}/loans/new`}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all">
              + Kredi Başvurusu
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100 text-sm text-slate-500">
          <div><span className="font-medium text-slate-700">TC No:</span> <span className="font-mono">{customer.tcNo}</span></div>
          <div><span className="font-medium text-slate-700">Telefon:</span> {customer.phone ?? '—'}</div>
          <div><span className="font-medium text-slate-700">Doğum:</span> {customer.birthDate}</div>
          {customer.address && (
            <div className="col-span-3"><span className="font-medium text-slate-700">Adres:</span> {customer.address}</div>
          )}
        </div>
      </div>

      {/* Borc Ozeti */}
      {summary && (
        <div className="grid grid-cols-6 gap-3 mb-5">
          {[
            { value: `${customer.balance.toLocaleString('tr-TR')} TL`, label: 'Bakiye', color: 'text-emerald-600' },
            { value: summary.activeLoanCount, label: 'Aktif Kredi', color: 'text-indigo-600' },
            { value: `${summary.totalDebt.toLocaleString('tr-TR')} TL`, label: 'Toplam Borç', color: 'text-slate-800' },
            { value: `${summary.remainingPrincipal.toLocaleString('tr-TR')} TL`, label: 'Kalan Anapara', color: 'text-slate-600' },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-slate-400 mt-1">{item.label}</p>
            </div>
          ))}
          <div className={`border rounded-xl p-4 shadow-sm text-center ${summary.overdueInstallmentCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <p className={`text-xl font-bold ${summary.overdueInstallmentCount > 0 ? 'text-red-600' : 'text-slate-300'}`}>
              {summary.overdueInstallmentCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">Gecikmiş Taksit</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
            <p className={`text-xl font-bold ${scoreColor(customer.creditScore)}`}>
              {customer.creditScore ?? '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Kredi Puanı</p>
            {customer.creditScore != null && (
              <p className={`text-xs font-medium mt-0.5 ${scoreColor(customer.creditScore)}`}>
                {riskLabel(customer.creditScore)}
              </p>
            )}
            {customer.creditScoreUpdatedAt && (
              <p className="text-[10px] text-slate-300 mt-1">
                {new Date(customer.creditScoreUpdatedAt).toLocaleDateString('tr-TR')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Taksit ilerleme bari */}
      {summary && (summary.paidInstallmentCount + summary.unpaidInstallmentCount) > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Taksit İlerlemesi</span>
            <span className="font-medium text-slate-600">{summary.paidInstallmentCount} / {summary.paidInstallmentCount + summary.unpaidInstallmentCount} ödendi</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all"
              style={{ width: `${(summary.paidInstallmentCount / (summary.paidInstallmentCount + summary.unpaidInstallmentCount)) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Krediler */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-700">Krediler</h2>
        <span className="text-xs text-slate-400">{loans.length} kredi</span>
      </div>
      {loans.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-slate-400 text-sm">Henüz kredi başvurusu yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map(loan => (
            <div key={loan.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={loan.status} />
                  <span className="text-sm font-semibold text-slate-700">
                    {loanTypeLabel(loan.loanType)} Kredisi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {loan.status === 'Active' && (
                    <button
                      onClick={() => { setEditLoan(loan); setEditLoanType(loan.loanType); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      Düzenle
                    </button>
                  )}
                  <Link to={`/loans/${loan.id}/installments`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                    Taksitler →
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-50 text-sm text-slate-500">
                <div><span className="font-medium text-slate-600">Anapara:</span> {loan.principal.toLocaleString('tr-TR')} TL</div>
                <div><span className="font-medium text-slate-600">Toplam:</span> {loan.totalAmount.toLocaleString('tr-TR')} TL</div>
                <div><span className="font-medium text-slate-600">Aylık:</span> {loan.monthlyPayment.toLocaleString('tr-TR')} TL</div>
                <div><span className="font-medium text-slate-600">Vade:</span> {loan.termMonths} ay</div>
              </div>
              {loan.creditScore && (
                <p className="text-xs text-slate-300 mt-2">Başvuru Anı Kredi Skoru: {loan.creditScore}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Kredi Düzenleme Modali */}
      {editLoan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Kredi Düzenle</h2>
              <button onClick={() => setEditLoan(null)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Kredi Türü</label>
              <select
                value={editLoanType}
                onChange={e => setEditLoanType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow"
              >
                <option value="Ihtiyac">İhtiyaç</option>
                <option value="Egitim">Eğitim</option>
                <option value="Tasit">Taşıt</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditLoan(null)}
                className="flex-1 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  await updateLoan(editLoan.id, editLoanType);
                  setEditLoan(null);
                  load();
                }}
                className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kredi Seçim Modalı */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Ödeme yapılacak krediyi seçin</h2>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="space-y-2">
              {activeLoans.map(loan => (
                <button
                  key={loan.id}
                  onClick={() => navigate(`/payments?loanId=${loan.id}`)}
                  className="w-full text-left border border-slate-200 rounded-xl p-4 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">
                      {loanTypeLabel(loan.loanType)} Kredisi
                    </span>
                    <span className="text-xs text-slate-400">{loan.termMonths} ay</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500">
                      Anapara: {loan.principal.toLocaleString('tr-TR')} TL
                    </span>
                    <span className="text-xs font-medium text-emerald-600">
                      Aylık: {loan.monthlyPayment.toLocaleString('tr-TR')} TL
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
