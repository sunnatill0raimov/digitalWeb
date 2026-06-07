import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { fmtDate } from '../lib/utils';
import useAuth from '../store/auth';
import Modal from '../components/Modal';
import { PageLoader } from '../components/Spinner';

export default function Inventory() {
  const { user } = useAuth();
  const canIn  = ['admin','manager','warehouse'].includes(user?.role);
  const canOut = ['admin','manager'].includes(user?.role);

  const [logs,     setLogs]     = useState([]);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal]   = useState(null); // 'in' | 'out'
  const [form,  setForm]    = useState({ product_id:'', quantity:1, note:'' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/inventory/logs', { params: { type: typeFilter||undefined } }),
      api.get('/products')
    ])
      .then(([l, p]) => { setLogs(l.data); setProducts(p.data); })
      .catch(() => toast.error('Xato'))
      .finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const openModal = (type) => {
    setForm({ product_id:'', quantity:1, note:'' });
    setModal(type);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const endpoint = modal === 'in' ? '/inventory/in' : '/inventory/out';
      await api.post(endpoint, form);
      toast.success(modal==='in' ? 'Kirim qayd etildi' : 'Chiqim qayd etildi');
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xato');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {products.filter(p => p.quantity <= 10).length > 0 && (
          <div className="card p-4 border-red-100 bg-red-50/50 col-span-2 xl:col-span-4 flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-red-500 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <p className="text-sm text-red-700 font-medium">
              {products.filter(p=>p.quantity<=10).length} ta mahsulot kam qolgan:{' '}
              {products.filter(p=>p.quantity<=10).map(p=>`${p.name} (${p.quantity})`).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <select className="select w-36" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Hammasi</option>
          <option value="in">Kirim</option>
          <option value="out">Chiqim</option>
        </select>
        <div className="flex gap-2 ml-auto">
          {canIn && (
            <button onClick={() => openModal('in')} className="btn-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Kirim
            </button>
          )}
          {canOut && (
            <button onClick={() => openModal('out')} className="btn-danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"/>
              </svg>
              Chiqim
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <PageLoader/> : (
          <div className="table-wrap border-0">
            <table className="table">
              <thead><tr>
                <th>Sana</th><th>Mahsulot</th><th>SKU</th>
                <th>Tur</th><th>Miqdor</th><th>Izoh</th><th>Kim</th>
              </tr></thead>
              <tbody>
                {logs.length===0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">Yozuvlar topilmadi</td></tr>}
                {logs.map(l => (
                  <tr key={l.id}>
                    <td className="text-xs text-slate-400">{fmtDate(l.created_at)}</td>
                    <td className="font-medium">{l.product_name || '—'}</td>
                    <td className="font-mono text-xs text-slate-400">{l.sku}</td>
                    <td>
                      <span className={`badge ${l.type==='in' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {l.type==='in' ? '↑ Kirim' : '↓ Chiqim'}
                      </span>
                    </td>
                    <td className={`font-bold ${l.type==='in' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {l.type==='in' ? '+' : '-'}{l.quantity}
                    </td>
                    <td className="text-xs text-slate-500">{l.note || '—'}</td>
                    <td className="text-xs text-slate-400">{l.user_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal==='in' ? 'Kirim qayd etish' : 'Chiqim qayd etish'}
        size="sm"
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Mahsulot *</label>
            <select className="select" value={form.product_id} onChange={e => setForm(f=>({...f,product_id:e.target.value}))} required>
              <option value="">Tanlang</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.quantity} ta)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Miqdor *</label>
            <input type="number" min={1} className="input" value={form.quantity}
              onChange={e => setForm(f=>({...f,quantity:+e.target.value}))} required/>
          </div>
          <div>
            <label className="label">Izoh</label>
            <input className="input" value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))}/>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Bekor</button>
            <button type="submit" disabled={saving}
              className={modal==='in' ? 'btn btn-success' : 'btn btn-danger'}>
              {saving ? 'Saqlanmoqda...' : (modal==='in' ? 'Kirim' : 'Chiqim')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
