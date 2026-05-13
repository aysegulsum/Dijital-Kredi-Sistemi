import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getLoan } from '../api/loans';
import { getInstallmentsByLoan } from '../api/installments';
import { createPayment } from '../api/payments';
import type { Loan, Installment, PaymentAllocation, CardInfo } from '../types';
import StatusBadge from '../components/StatusBadge';

const VERIFICATION_CODE = '123456';

type ModalStep = 'card' | 'verify' | 'processing';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const loanId = searchParams.get('loanId');

  const [loan, setLoan] = useState<Loan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ ref: string; allocations: PaymentAllocation[] } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('card');
  const [card, setCard] = useState<CardInfo>({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [cardError, setCardError] = useState('');

  useEffect(() => {
    if (!loanId) { navigate(-1); return; }
    getLoan(loanId).then(setLoan).catch(() => navigate(-1));
    getInstallmentsByLoan(loanId).then(setInstallments).catch(() => {});
  }, [loanId]);

  const loanTypeLabel = (type: string) =>
    type === 'Ihtiyac' ? 'Ihtiyac' : type === 'Egitim' ? 'Egitim' : 'Tasit';

  const unpaid = installments.filter(i => i.status !== 'Paid');
  const nextInstallment = unpaid[0];
  const totalRemaining = unpaid.reduce((s, i) => s + i.remainingAmount, 0);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const openModal = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setCard({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
    setVerifyCode('');
    setVerifyError('');
    setCardError('');
    setModalStep('card');
    setShowModal(true);
  };

  const validateCard = (): boolean => {
    const digits = card.cardNumber.replace(/\s/g, '');
    if (digits.length < 16) { setCardError('Kart numarasi 16 haneli olmalidir.'); return false; }
    if (!card.cardHolder.trim()) { setCardError('Kart sahibi adi gereklidir.'); return false; }
    if (card.expiryDate.length < 5) { setCardError('Gecerli bir son kullanma tarihi girin.'); return false; }
    if (card.cvv.length < 3) { setCardError('CVV 3 haneli olmalidir.'); return false; }
    setCardError('');
    return true;
  };

  const handleCardSubmit = () => {
    if (!validateCard()) return;
    setModalStep('verify');
  };

  const handleVerify = async () => {
    if (verifyCode !== VERIFICATION_CODE) {
      setVerifyError('Dogrulama kodu hatali. Tekrar deneyin.');
      return;
    }
    setVerifyError('');
    setModalStep('processing');

    try {
      const result = await createPayment(loanId!, parseFloat(amount), card);
      setSuccess({ ref: result.paymentRef ?? '-', allocations: result.allocations });
      setAmount('');
      setError('');
      setShowModal(false);
      getInstallmentsByLoan(loanId!).then(setInstallments);
      getLoan(loanId!).then(setLoan);
    } catch (err: any) {
      const d = err.response?.data?.detail ?? err.response?.data?.errors;
      setError(typeof d === 'string' ? d : JSON.stringify(d) ?? 'Odeme basarisiz.');
      setShowModal(false);
    }
  };

  const maskedCard = card.cardNumber.replace(/\s/g, '').replace(/.(?=.{4})/g, '*');

  if (!loan) return <p className="p-6 text-gray-400">Yukleniyor...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-blue-600 text-sm hover:underline mb-4 inline-block">
        &larr; Geri
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Odeme Yap</h1>
      <p className="text-sm text-gray-500 mb-6">
        {loanTypeLabel(loan.loanType)} Kredisi &middot; {loan.principal.toLocaleString('tr-TR')} TL &middot; {loan.termMonths} ay
      </p>

      {/* Ozet kartlar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <p className="text-lg font-bold text-gray-800">{totalRemaining.toLocaleString('tr-TR')} TL</p>
          <p className="text-xs text-gray-500 mt-1">Kalan Borc</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <p className="text-lg font-bold text-blue-700">
            {nextInstallment ? `#${nextInstallment.installmentNo}` : '-'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Siradaki Taksit</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <p className="text-lg font-bold text-orange-600">
            {nextInstallment ? `${nextInstallment.remainingAmount.toLocaleString('tr-TR')} TL` : '-'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Taksit Kalan</p>
        </div>
      </div>

      {/* Odeme Formu */}
      <div className="bg-white border rounded-xl p-6 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Odeme Tutari</h2>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="absolute right-3 top-2.5 text-gray-400 text-sm">TL</span>
          </div>
          <button
            onClick={openModal}
            disabled={!amount || parseFloat(amount) <= 0}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ode
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {nextInstallment && (
            <button
              onClick={() => setAmount(nextInstallment.remainingAmount.toFixed(2))}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200"
            >
              Taksit tutari: {nextInstallment.remainingAmount.toLocaleString('tr-TR')} TL
            </button>
          )}
          {totalRemaining !== nextInstallment?.remainingAmount && (
            <button
              onClick={() => setAmount(totalRemaining.toFixed(2))}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200"
            >
              Tum borc: {totalRemaining.toLocaleString('tr-TR')} TL
            </button>
          )}
        </div>
      </div>

      {/* Hata */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Basari */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 font-bold text-sm">Odeme Basarili</span>
            <span className="text-xs text-gray-500">Ref: {success.ref}</span>
          </div>
          <p className="text-xs font-medium text-gray-600 mb-2">Mahsup Detayi:</p>
          <div className="space-y-1">
            {success.allocations.map((a, i) => (
              <div key={i} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2 border">
                <span>Taksit #{a.installmentNo}</span>
                <span className="font-medium">{a.allocatedAmount.toLocaleString('tr-TR')} TL</span>
                <span className={a.status === 'Paid' ? 'text-green-600' : 'text-orange-600'}>
                  {a.status === 'Paid' ? 'Kapandi' : `Kalan: ${a.installmentRemaining.toLocaleString('tr-TR')} TL`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Taksit Tablosu */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-700 px-4 py-3 border-b bg-gray-50">Taksit Plani</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Tutar</th>
              <th className="text-left px-4 py-2">Odenen</th>
              <th className="text-left px-4 py-2">Kalan</th>
              <th className="text-left px-4 py-2">Son Odeme</th>
              <th className="text-left px-4 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {installments.map(inst => (
              <tr key={inst.id}
                className={`border-b last:border-0 ${
                  inst.status === 'Overdue' ? 'bg-red-50' :
                  inst.status === 'Paid' ? 'bg-green-50/30' : ''
                }`}>
                <td className="px-4 py-2.5 text-gray-500">{inst.installmentNo}</td>
                <td className="px-4 py-2.5 font-medium">{inst.amount.toLocaleString('tr-TR')} TL</td>
                <td className="px-4 py-2.5 text-green-700">
                  {inst.paidAmount > 0 ? `${inst.paidAmount.toLocaleString('tr-TR')} TL` : '-'}
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {inst.remainingAmount > 0 ? `${inst.remainingAmount.toLocaleString('tr-TR')} TL` : '-'}
                </td>
                <td className="px-4 py-2.5 text-gray-600">{inst.dueDate}</td>
                <td className="px-4 py-2.5"><StatusBadge status={inst.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Odeme Modali */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">

            {/* Adim 1: Kart Bilgileri */}
            {modalStep === 'card' && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-800">Kart Bilgileri</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-5 mb-5 text-white">
                  <p className="text-xs opacity-70 mb-3">Kart Numarasi</p>
                  <p className="text-lg font-mono tracking-widest mb-4">
                    {card.cardNumber || '**** **** **** ****'}
                  </p>
                  <div className="flex justify-between text-xs">
                    <div>
                      <p className="opacity-70">Kart Sahibi</p>
                      <p className="font-medium uppercase">{card.cardHolder || '...'}</p>
                    </div>
                    <div className="text-right">
                      <p className="opacity-70">SKT</p>
                      <p className="font-medium">{card.expiryDate || 'MM/YY'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Kart Numarasi</label>
                    <input
                      type="text"
                      value={card.cardNumber}
                      onChange={e => setCard({ ...card, cardNumber: formatCardNumber(e.target.value) })}
                      placeholder="4000 0000 0000 0000"
                      maxLength={19}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Kart Sahibi</label>
                    <input
                      type="text"
                      value={card.cardHolder}
                      onChange={e => setCard({ ...card, cardHolder: e.target.value.toUpperCase() })}
                      placeholder="AD SOYAD"
                      className="w-full border rounded-lg px-3 py-2.5 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Son Kullanma</label>
                      <input
                        type="text"
                        value={card.expiryDate}
                        onChange={e => setCard({ ...card, expiryDate: formatExpiry(e.target.value) })}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm text-center font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                      <input
                        type="password"
                        value={card.cvv}
                        onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                        placeholder="***"
                        maxLength={3}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm text-center font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {cardError && (
                  <p className="text-xs text-red-600 mt-3">{cardError}</p>
                )}

                <div className="flex items-center justify-between mt-5 pt-4 border-t">
                  <span className="text-sm font-bold text-gray-700">{parseFloat(amount).toLocaleString('tr-TR')} TL</span>
                  <button
                    onClick={handleCardSubmit}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Devam
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 mt-3 text-center">
                  Test icin: 4xxx veya 5xxx ile baslayan kartlar basarili, 6xxx basarisiz olur.
                </p>
              </>
            )}

            {/* Adim 2: Dogrulama Kodu */}
            {modalStep === 'verify' && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-800">3D Secure Dogrulama</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-5 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">
                    Kart sahibinin telefonuna dogrulama kodu gonderildi.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Kart: ****{card.cardNumber.replace(/\s/g, '').slice(-4)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Tutar: {parseFloat(amount).toLocaleString('tr-TR')} TL
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Dogrulama Kodu</label>
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6 haneli kod"
                    maxLength={6}
                    className="w-full border rounded-lg px-4 py-3 text-center text-lg font-mono tracking-[0.5em] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>

                {verifyError && (
                  <p className="text-xs text-red-600 mt-2">{verifyError}</p>
                )}

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => { setModalStep('card'); setVerifyCode(''); setVerifyError(''); }}
                    className="flex-1 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Geri
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={verifyCode.length < 6}
                    className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Onayla
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 mt-3 text-center">
                  Test dogrulama kodu: 123456
                </p>
              </>
            )}

            {/* Adim 3: Isleniyor */}
            {modalStep === 'processing' && (
              <div className="py-10 text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-700">Odeme isleniyor...</p>
                <p className="text-xs text-gray-400 mt-1">Lutfen bekleyin.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
