import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createCustomer, deleteCustomer } from '../api/customers';
import type { Customer, CreateCustomerRequest } from '../types';

const empty: CreateCustomerRequest = {
  firstName: '', lastName: '', email: '',
  tcNo: '', birthDate: '', phone: '', address: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CreateCustomerRequest>(empty);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = () => getCustomers().then(setCustomers).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createCustomer(form);
      setForm(empty);
      setShowForm(false);
      await load();
    } catch (err: any) {
      const detail = err.response?.data?.detail ?? err.response?.data?.errors;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) ?? 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Müşteriyi silmek istediğinizden emin misiniz?')) return;
    await deleteCustomer(id);
    await load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Müşteriler</h1>
        <button
          onClick={() => { setShowForm(v => !v); setError(''); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          {showForm ? '✕ İptal' : '+ Yeni Müşteri'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Yeni Müşteri</h2>
          {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Ad" value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input required placeholder="Soyad" value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input required type="email" placeholder="E-posta" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input required placeholder="TC Kimlik No (11 hane)" maxLength={11} value={form.tcNo}
              onChange={e => setForm(f => ({ ...f, tcNo: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Doğum Tarihi</label>
              <input required type="date" value={form.birthDate}
                onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <input placeholder="Telefon" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <button disabled={loading} type="submit"
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      )}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Henüz müşteri yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Ad Soyad</th>
                <th className="text-left px-4 py-3">E-posta</th>
                <th className="text-left px-4 py-3">TC No</th>
                <th className="text-left px-4 py-3">Telefon</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {c.firstName} {c.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">{c.tcNo}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button onClick={() => navigate(`/customers/${c.id}`)}
                      className="text-blue-600 hover:underline text-xs">Detay</button>
                    <button onClick={() => handleDelete(c.id)}
                      className="text-red-500 hover:underline text-xs">Sil</button>
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
