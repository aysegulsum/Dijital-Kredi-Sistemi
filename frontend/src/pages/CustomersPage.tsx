import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/customers';
import type { Customer, CreateCustomerRequest } from '../types';

const emptyCreate: CreateCustomerRequest = {
  firstName: '', lastName: '', email: '',
  tcNo: '', birthDate: '', phone: '', address: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateCustomerRequest>(emptyCreate);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = () => getCustomers().then(setCustomers).catch(() => {});
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Müşteriler</h1>
        <button onClick={() => { setShowCreate(v => !v); setError(''); setEditingId(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          {showCreate ? '✕ İptal' : '+ Yeni Müşteri'}
        </button>
      </div>

      {/* Yeni müşteri formu */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Yeni Müşteri</h2>
          {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Ad" value={createForm.firstName}
              onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input required placeholder="Soyad" value={createForm.lastName}
              onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input required type="email" placeholder="E-posta" value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input required placeholder="TC Kimlik No (11 hane)" maxLength={11} value={createForm.tcNo}
              onChange={e => setCreateForm(f => ({ ...f, tcNo: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Doğum Tarihi</label>
              <input required type="date" value={createForm.birthDate}
                onChange={e => setCreateForm(f => ({ ...f, birthDate: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <input placeholder="Telefon" value={createForm.phone}
              onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
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
                <>
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.firstName} {c.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600">{c.tcNo}</td>
                    <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 flex gap-3 justify-end">
                      <button onClick={() => navigate(`/customers/${c.id}`)}
                        className="text-blue-600 hover:underline text-xs">Detay</button>
                      <button onClick={() => editingId === c.id ? setEditingId(null) : startEdit(c)}
                        className="text-yellow-600 hover:underline text-xs">
                        {editingId === c.id ? 'İptal' : 'Güncelle'}
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:underline text-xs">Sil</button>
                    </td>
                  </tr>

                  {/* Inline güncelleme formu */}
                  {editingId === c.id && (
                    <tr key={`${c.id}-edit`} className="bg-yellow-50 border-b">
                      <td colSpan={5} className="px-4 py-4">
                        <form onSubmit={handleUpdate}>
                          {error && <p className="text-red-600 text-sm mb-3 bg-red-100 p-2 rounded">{error}</p>}
                          <div className="grid grid-cols-3 gap-3">
                            <input required placeholder="Ad" value={editForm.firstName}
                              onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            <input required placeholder="Soyad" value={editForm.lastName}
                              onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            <input required type="email" placeholder="E-posta" value={editForm.email}
                              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            <input placeholder="Telefon" value={editForm.phone}
                              onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            <input placeholder="Adres" value={editForm.address}
                              onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 col-span-2" />
                          </div>
                          <button disabled={loading} type="submit"
                            className="mt-3 bg-yellow-500 text-white px-5 py-1.5 rounded-lg text-sm hover:bg-yellow-600 disabled:opacity-50">
                            {loading ? 'Kaydediliyor...' : 'Güncelle'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
