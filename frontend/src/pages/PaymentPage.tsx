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
    type === 'Ihtiyac' ? 'İhtiyaç' : type === 'Egitim' ? 'Eğitim' : 'Taşıt';

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
    if (digits.length < 16) { setCardError('Kart numarası 16 haneli olmalıdır.'); return false; }
    if (!card.cardHolder.trim()) { setCardError('Kart sahibi adı gereklidir.'); return false; }
    if (card.expiryDate.length < 5) { setCardError('Geçerli bir son kullanma tarihi girin.'); return false; }
    if (card.cvv.length < 3) { setCardError('CVV 3 haneli olmalıdır.'); return false; }
    setCardError('');
    return true;
  };

  const handleCardSubmit = () => {
    if (!validateCard()) return;
    setModalStep('verify');
  };

  const handleVerify = async () => {
    if (verifyCode !== VERIFICATION_CODE) {
      setVerifyError('Doğrulama kodu hatalı. Tekrar deneyin.');
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
      setError(typeof d === 'string' ? d : JSON.stringify(d) ?? 'Ödeme başarısız.');
      setShowModal(false);
    }
  };

  if (!loan) return <p className="p-6 text-slate-400">Yükleniyor...</p>;

  const inputCls = 'w-full border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm hover:text-indigo-800 mb-4 inline-flex items-center gap-1 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Geri
      </button>

      <h1 className="text-2xl font-bold text-slate-800 mb-1">Ödeme Yap</h1>
      <p className="text-sm text-slate-400 mb-6">
        {loanTypeLabel(loan.loanType)} Kredisi &middot; {loan.principal.toLocaleString('tr-TR')} TL &middot; {loan.termMonths} ay
      </p>

      {/* Ozet kartlar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-lg font-bold text-slate-800">{totalRemaining.toLocaleString('tr-TR')} TL</p>
          <p className="text-xs text-slate-400 mt-1">Kalan Borç</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-lg font-bold text-indigo-600">
            {nextInstallment ? `#${nextInstallment.installmentNo}` : '-'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Sıradaki Taksit</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-lg font-bold text-amber-600">
            {nextInstallment ? `${nextInstallment.remainingAmount.toLocaleString('tr-TR')} TL` : '-'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Taksit Kalan</p>
        </div>
      </div>

      {/* Ödeme Formu */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Ödeme Tutarı</h2>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="number" step="0.01" min="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className={`${inputCls} px-4 py-2.5`}
            />
            <span className="absolute right-3 top-2.5 text-slate-400 text-sm">TL</span>
          </div>
          <button onClick={openModal} disabled={!amount || parseFloat(amount) <= 0}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200 transition-all">
            Öde
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {nextInstallment && (
            <button onClick={() => setAmount(nextInstallment.remainingAmount.toFixed(2))}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
              Taksit tutarı: {nextInstallment.remainingAmount.toLocaleString('tr-TR')} TL
            </button>
          )}
          {totalRemaining !== nextInstallment?.remainingAmount && (
            <button onClick={() => setAmount(totalRemaining.toFixed(2))}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
              Tüm borç: {totalRemaining.toLocaleString('tr-TR')} TL
            </button>
          )}
        </div>
      </div>

      {/* Hata */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Başarı */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-700 font-bold text-sm">Ödeme Başarılı</span>
            <span className="text-xs text-slate-400 font-mono">Ref: {success.ref}</span>
          </div>
          <p className="text-xs font-medium text-slate-600 mb-2">Mahsup Detayı:</p>
          <div className="space-y-1.5">
            {success.allocations.map((a, i) => (
              <div key={i} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2.5 border border-slate-100">
                <span className="text-slate-600">Taksit #{a.installmentNo}</span>
                <span className="font-semibold text-slate-700">{a.allocatedAmount.toLocaleString('tr-TR')} TL</span>
                <span className={a.status === 'Paid' ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                  {a.status === 'Paid' ? 'Kapandı' : `Kalan: ${a.installmentRemaining.toLocaleString('tr-TR')} TL`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Taksit Tablosu */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-700 px-5 py-3.5 border-b border-slate-100">Taksit Planı</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutar</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ödenen</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kalan</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Son Ödeme</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {installments.map(inst => (
              <tr key={inst.id}
                className={`transition-colors ${
                  inst.status === 'Overdue' ? 'bg-red-50/60' :
                  inst.status === 'Paid' ? 'bg-emerald-50/30' : ''
                }`}>
                <td className="px-5 py-2.5 text-slate-400 font-medium">{inst.installmentNo}</td>
                <td className="px-5 py-2.5 font-semibold text-slate-700">{inst.amount.toLocaleString('tr-TR')} TL</td>
                <td className="px-5 py-2.5 text-emerald-600">
                  {inst.paidAmount > 0 ? `${inst.paidAmount.toLocaleString('tr-TR')} TL` : '-'}
                </td>
                <td className="px-5 py-2.5 text-slate-500">
                  {inst.remainingAmount > 0 ? `${inst.remainingAmount.toLocaleString('tr-TR')} TL` : '-'}
                </td>
                <td className="px-5 py-2.5 text-slate-500">{inst.dueDate}</td>
                <td className="px-5 py-2.5"><StatusBadge status={inst.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ödeme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">

            {/* Adım 1: Kart Bilgileri */}
            {modalStep === 'card' && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-800">Kart Bilgileri</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-2xl p-5 mb-5 text-white shadow-lg shadow-indigo-200">
                  <p className="text-[10px] uppercase tracking-widest opacity-60 mb-3">Kart Numarası</p>
                  <p className="text-lg font-mono tracking-[0.15em] mb-4">
                    {card.cardNumber || '**** **** **** ****'}
                  </p>
                  <div className="flex justify-between text-xs">
                    <div>
                      <p className="opacity-60 text-[10px] uppercase tracking-wider">Kart Sahibi</p>
                      <p className="font-medium uppercase mt-0.5">{card.cardHolder || '...'}</p>
                    </div>
                    <div className="text-right">
                      <p className="opacity-60 text-[10px] uppercase tracking-wider">SKT</p>
                      <p className="font-medium mt-0.5">{card.expiryDate || 'MM/YY'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Kart Numarası</label>
                    <input type="text" value={card.cardNumber}
                      onChange={e => setCard({ ...card, cardNumber: formatCardNumber(e.target.value) })}
                      placeholder="4000 0000 0000 0000" maxLength={19}
                      className={`${inputCls} px-3 py-2.5 font-mono tracking-wider`} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Kart Sahibi</label>
                    <input type="text" value={card.cardHolder}
                      onChange={e => setCard({ ...card, cardHolder: e.target.value.toUpperCase() })}
                      placeholder="AD SOYAD"
                      className={`${inputCls} px-3 py-2.5 uppercase`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Son Kullanma</label>
                      <input type="text" value={card.expiryDate}
                        onChange={e => setCard({ ...card, expiryDate: formatExpiry(e.target.value) })}
                        placeholder="MM/YY" maxLength={5}
                        className={`${inputCls} px-3 py-2.5 text-center font-mono`} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">CVV</label>
                      <input type="password" value={card.cvv}
                        onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                        placeholder="***" maxLength={3}
                        className={`${inputCls} px-3 py-2.5 text-center font-mono`} />
                    </div>
                  </div>
                </div>

                {cardError && <p className="text-xs text-red-600 mt-3">{cardError}</p>}

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-700">{parseFloat(amount).toLocaleString('tr-TR')} TL</span>
                  <button onClick={handleCardSubmit}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all">
                    Devam
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 mt-3 text-center">
                  Test için: 4xxx veya 5xxx ile başlayan kartlar başarılı, 6xxx başarısız olur.
                </p>
              </>
            )}

            {/* Adım 2: Doğrulama Kodu */}
            {modalStep === 'verify' && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-800">3D Secure Doğrulama</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 mb-5 text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-700 font-medium">
                    Kart sahibinin telefonuna doğrulama kodu gönderildi.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Kart: ****{card.cardNumber.replace(/\s/g, '').slice(-4)}
                  </p>
                  <p className="text-xs text-slate-400">
                    Tutar: {parseFloat(amount).toLocaleString('tr-TR')} TL
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Doğrulama Kodu</label>
                  <input type="text" value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6 haneli kod" maxLength={6} autoFocus
                    className={`${inputCls} px-4 py-3 text-center text-lg font-mono tracking-[0.5em]`} />
                </div>

                {verifyError && <p className="text-xs text-red-600 mt-2">{verifyError}</p>}

                <div className="flex gap-3 mt-5">
                  <button onClick={() => { setModalStep('card'); setVerifyCode(''); setVerifyError(''); }}
                    className="flex-1 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                    Geri
                  </button>
                  <button onClick={handleVerify} disabled={verifyCode.length < 6}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-200 transition-all">
                    Onayla
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 mt-3 text-center">
                  Test doğrulama kodu: 123456
                </p>
              </>
            )}

            {/* Adım 3: İşleniyor */}
            {modalStep === 'processing' && (
              <div className="py-10 text-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-slate-700">Ödeme işleniyor...</p>
                <p className="text-xs text-slate-400 mt-1">Lütfen bekleyin.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
