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

  useEffect(() => {
    if (!id) return;
    getCustomer(id).then(setCustomer).catch(() => navigate('/'));
    getLoansByCustomer(id).then(setLoans).catch(() => {});
    getCustomerSummary(id).then(setSummary).catch(() => {});
  }, [id]);

  if (!customer) return <p className="p-6 text-gray-400">Yükleniyor...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/')} className="text-blue-600 text-sm hover:underline mb-4 inline-block">
        ← Müşteri Listesi
      </button>

      {/* Müşteri bilgileri */}
      <div className="bg-white border rounded-xl p-6 shadow-sm mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{customer.firstName} {customer.lastName}</h1>
            <p className="text-gray-500 text-sm mt-1">{customer.email}</p>
          </div>
          <Link to={`/customers/${id}/loans/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            + Kredi Başvurusu
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-gray-600">
          <div><span className="font-medium">TC No:</span> {customer.tcNo}</div>
          <div><span className="font-medium">Telefon:</span> {customer.phone ?? '—'}</div>
          <div><span className="font-medium">Doğum:</span> {customer.birthDate}</div>
          {customer.address && (
            <div className="col-span-3"><span className="font-medium">Adres:</span> {customer.address}</div>
          )}
        </div>
      </div>

      {/* Borç Özeti */}
      {summary && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-blue-700">{summary.activeLoanCount}</p>
            <p className="text-xs text-gray-500 mt-1">Aktif Kredi</p>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-800">{summary.totalDebt.toLocaleString('tr-TR')} ₺</p>
            <p className="text-xs text-gray-500 mt-1">Toplam Borç</p>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-600">{summary.remainingPrincipal.toLocaleString('tr-TR')} ₺</p>
            <p className="text-xs text-gray-500 mt-1">Kalan Anapara</p>
          </div>
          <div className={`border rounded-xl p-4 shadow-sm text-center ${summary.overdueInstallmentCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
            <p className={`text-xl font-bold ${summary.overdueInstallmentCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {summary.overdueInstallmentCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">Gecikmiş Taksit</p>
          </div>
          {(() => {
            const score = loans.find(l => l.status === 'Active')?.creditScore
              ?? loans[loans.length - 1]?.creditScore;
            if (!score) return null;
            const color = score >= 700 ? 'text-green-600' : score >= 500 ? 'text-yellow-600' : 'text-red-600';
            const label = score >= 700 ? 'Düşük Risk' : score >= 500 ? 'Orta Risk' : 'Yüksek Risk';
            return (
              <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
                <p className={`text-xl font-bold ${color}`}>{score}</p>
                <p className="text-xs text-gray-500 mt-1">Kredi Puanı</p>
                <p className={`text-xs font-medium mt-0.5 ${color}`}>{label}</p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Taksit özeti bar */}
      {summary && (summary.paidInstallmentCount + summary.unpaidInstallmentCount) > 0 && (
        <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Taksit İlerlemesi</span>
            <span>{summary.paidInstallmentCount} / {summary.paidInstallmentCount + summary.unpaidInstallmentCount} ödendi</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(summary.paidInstallmentCount / (summary.paidInstallmentCount + summary.unpaidInstallmentCount)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Krediler */}
      <h2 className="text-lg font-semibold text-gray-700 mb-3">Krediler</h2>
      {loans.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-gray-400 shadow-sm">
          Henüz kredi başvurusu yok.
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map(loan => (
            <div key={loan.id} className="bg-white border rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={loan.status} />
                  <span className="text-sm font-medium text-gray-700">
                    {loan.loanType === 'Ihtiyac' ? 'İhtiyaç' : loan.loanType === 'Egitim' ? 'Eğitim' : 'Taşıt'} Kredisi
                  </span>
                </div>
                <Link to={`/loans/${loan.id}/installments`} className="text-blue-600 text-xs hover:underline">
                  Taksitler →
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3 text-sm text-gray-600">
                <div><span className="font-medium">Anapara:</span> {loan.principal.toLocaleString('tr-TR')} ₺</div>
                <div><span className="font-medium">Toplam:</span> {loan.totalAmount.toLocaleString('tr-TR')} ₺</div>
                <div><span className="font-medium">Aylık:</span> {loan.monthlyPayment.toLocaleString('tr-TR')} ₺</div>
                <div><span className="font-medium">Vade:</span> {loan.termMonths} ay</div>
              </div>
              {loan.creditScore && (
                <p className="text-xs text-gray-400 mt-2">Kredi Skoru: {loan.creditScore}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
