import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/customers';
import { getLoans } from '../api/loans';
import type { Customer, CreateCustomerRequest, Loan } from '../types';

const emptyCreate: CreateCustomerRequest = {
  firstName: '', lastName: '', email: '',
  tcNo: '', birthDate: '', phone: '', address: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateCustomerRequest>(emptyCreate);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    getCustomers().then(setCustomers).catch(() => {});
    getLoans().then(setLoans).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await createCustomer(createForm);
      setCreateForm(emptyCreate); setShowCreate(false);
      await load();
    } catch (err: any) {
      const d = err.response?.data?.detail ?? err.response?.data?.errors;
      setError(typeof d === 'string' ? d : JSON.stringify(d) ?? 'Bir hata oluştu.');
    } finally { setLoading(false); }
  };

  const startEdit = (c: Customer) => {
    setEditingId(c.id);
    setEditForm({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone ?? '', address: c.address ?? '' });
    setError('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError(''); setLoading(true);
    try {
      await updateCustomer(editingId, editForm);
      setEditingId(null);
      await load();
    } catch (err: any) {
      const d = err.response?.data?.detail ?? err.response?.data?.errors;
      setError(typeof d === 'string' ? d : JSON.stringify(d) ?? 'Bir hata oluştu.');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Müşteriyi silmek istediğinizden emin misiniz?')) return;
    await deleteCustomer(id);
    await load();
  };

  const inputCls = 'border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Hero aciklama alani */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-500 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-indigo-200/50 text-center">
        <h1 className="text-2xl font-bold">Dijital Kredi ve Geri Ödeme Yönetim Sistemi</h1>
        <p className="text-indigo-100 text-sm mt-1.5 mx-auto max-w-xl">
          Müşteri kayıtlarını yönetin, kredi başvurularını takip edin, taksit planlarını görüntüleyin ve ödemeleri güvenli şekilde gerçekleştirin.
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
            <p className="text-xl font-bold">{customers.length}</p>
            <p className="text-[11px] text-indigo-200">Toplam Müşteri</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
            <p className="text-xl font-bold">{loans.length}</p>
            <p className="text-[11px] text-indigo-200">Toplam Kredi</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
            <p className="text-xl font-bold">{loans.filter(l => l.status === 'Active').length}</p>
            <p className="text-[11px] text-indigo-200">Aktif Kredi</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Müşteri Listesi</h2>
        <button onClick={() => { setShowCreate(v => !v); setError(''); setEditingId(null); }}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
            showCreate
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
          }`}>
          {showCreate ? 'İptal' : '+ Yeni Müşteri'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4 text-slate-700">Yeni Müşteri</h2>
          {error && <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-100 p-3 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Ad" value={createForm.firstName}
              onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))}
              className={inputCls} />
            <input required placeholder="Soyad" value={createForm.lastName}
              onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))}
              className={inputCls} />
            <input required type="email" placeholder="E-posta" value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              className={inputCls} />
            <input required placeholder="TC Kimlik No (11 hane)" maxLength={11} value={createForm.tcNo}
              onChange={e => setCreateForm(f => ({ ...f, tcNo: e.target.value }))}
              className={inputCls} />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 font-medium">Doğum Tarihi</label>
              <input required type="date" value={createForm.birthDate}
                onChange={e => setCreateForm(f => ({ ...f, birthDate: e.target.value }))}
                className={inputCls} />
            </div>
            <input placeholder="Telefon" value={createForm.phone}
              onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
              className={inputCls} />
          </div>
          <button disabled={loading} type="submit"
            className="mt-5 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-200 transition-all">
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">Henüz müşteri yok.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider">Ad Soyad</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider">E-posta</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider">TC No</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider">Telefon</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.map(c => (
                <React.Fragment key={c.id}>
                  <tr className="even:bg-indigo-50/30 hover:bg-indigo-50/60 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-200">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <span className="font-medium text-slate-800">{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{c.email}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{c.tcNo}</td>
                    <td className="px-5 py-3.5 text-slate-500">{c.phone ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/customers/${c.id}`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                          Detay
                        </button>
                        <button onClick={() => editingId === c.id ? setEditingId(null) : startEdit(c)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors">
                          {editingId === c.id ? 'İptal' : 'Düzenle'}
                        </button>
                        <button onClick={() => handleDelete(c.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editingId === c.id && (
                    <tr key={`${c.id}-edit`} className="bg-amber-50/50">
                      <td colSpan={5} className="px-5 py-4">
                        <form onSubmit={handleUpdate}>
                          {error && <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-100 p-2.5 rounded-lg">{error}</p>}
                          <div className="grid grid-cols-3 gap-3">
                            <input required placeholder="Ad" value={editForm.firstName}
                              onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                              className={inputCls} />
                            <input required placeholder="Soyad" value={editForm.lastName}
                              onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                              className={inputCls} />
                            <input required type="email" placeholder="E-posta" value={editForm.email}
                              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                              className={inputCls} />
                            <input placeholder="Telefon" value={editForm.phone}
                              onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                              className={inputCls} />
                            <input placeholder="Adres" value={editForm.address}
                              onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                              className={`${inputCls} col-span-2`} />
                          </div>
                          <button disabled={loading} type="submit"
                            className="mt-3 bg-amber-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 shadow-sm transition-all">
                            {loading ? 'Kaydediliyor...' : 'Güncelle'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
