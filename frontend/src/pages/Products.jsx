import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { fmt } from '../lib/utils';
import useAuth from '../store/auth';
import Modal   from '../components/Modal';
import Confirm from '../components/Confirm';
import { PageLoader } from '../components/Spinner';

const EMPTY = { category_id:'', name:'', sku:'', price:'', quantity:0, unit:'dona' };

export default function Products() {
  const { user } = useAuth();
  const canEdit = ['admin','manager'].includes(user?.role);

  const [rows,  setRows]  = useState([]);
  const [cats,  setCats]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [sel,   setSel]   = useState(null);
  const [form,  setForm]  = useState(EMPTY);
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [delId,  setDelId] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/products', { params: { search: search||undefined, category_id: catFilter||undefined } }),
      api.get('/categories')
    ])
      .then(([p, c]) => { setRows(p.data); setCats(c.data); })
      .catch(() => toast.error('Xato'))
      .finally(() => setLoading(false));
  }, [search, catFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setImgFile(null); setModal('create'); };
  const openEdit   = (p) => {
    setSel(p);
    setForm({ category_id: p.category_id||'', name:p.name, sku:p.sku, price:p.price, quantity:p.quantity, unit:p.unit||'dona' });
    setImgFile(null);
    setModal('edit');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imgFile) fd.append('image', imgFile);

      if (modal === 'create') {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success("Mahsulot qo'shildi");
      } else {
        await api.put(`/products/${sel.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Mahsulot yangilandi');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xato');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/products/${delId}`);
      toast.success("O'chirildi");
      setDelId(null);
      load();
    } catch { toast.error('Xato'); }
    finally { setDelLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
          <input className="input pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="select w-44" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Barcha kategoriya</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Yangi mahsulot
          </button>
        )}
      </div>

      <div className="card">
        {loading ? <PageLoader/> : (
          <div className="table-wrap border-0">
            <table className="table">
              <thead><tr>
                <th>Rasm</th><th>Nom</th><th>SKU</th><th>Kategoriya</th>
                <th>Narx</th><th>Miqdor</th><th></th>
              </tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">Mahsulot topilmadi</td></tr>}
                {rows.map(p => (
                  <tr key={p.id}>
                    <td>
                      {p.image
                        ? <img src={`/uploads/${p.image}`} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100"/>
                        : <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-xs">IMG</div>
                      }
                    </td>
                    <td className="font-medium text-slate-900">{p.name}</td>
                    <td className="font-mono text-xs text-slate-500">{p.sku}</td>
                    <td className="text-slate-500">{p.category_name || '—'}</td>
                    <td className="font-medium">{fmt(p.price)}</td>
                    <td>
                      <span className={`font-bold ${p.quantity === 0 ? 'text-red-500' : p.quantity <= 10 ? 'text-amber-500' : 'text-slate-800'}`}>
                        {p.quantity} {p.unit}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {canEdit && (
                          <button onClick={() => openEdit(p)} className="btn-icon btn-secondary btn-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button onClick={() => setDelId(p.id)} className="btn-icon btn-danger btn-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal==='create'||modal==='edit'} onClose={() => setModal(null)}
        title={modal==='create' ? "Yangi mahsulot" : "Mahsulotni tahrirlash"}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Kategoriya</label>
              <select className="select" value={form.category_id} onChange={e => setForm(f=>({...f,category_id:e.target.value}))}>
                <option value="">Tanlang</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Nom *</label>
              <input className="input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required/>
            </div>
            <div>
              <label className="label">SKU *</label>
              <input className="input font-mono" value={form.sku} onChange={e => setForm(f=>({...f,sku:e.target.value}))} required/>
            </div>
            <div>
              <label className="label">Birlik</label>
              <select className="select" value={form.unit} onChange={e => setForm(f=>({...f,unit:e.target.value}))}>
                {['dona','juft','to\'p','kg','m'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Narx (so'm) *</label>
              <input type="number" min={0} className="input" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} required/>
            </div>
            <div>
              <label className="label">Miqdor</label>
              <input type="number" min={0} className="input" value={form.quantity} onChange={e => setForm(f=>({...f,quantity:e.target.value}))}/>
            </div>
            <div className="col-span-2">
              <label className="label">Rasm</label>
              <input type="file" accept="image/*" className="input py-1.5" onChange={e => setImgFile(e.target.files[0]||null)}/>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Bekor</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
          </div>
        </form>
      </Modal>

      <Confirm open={!!delId} onClose={()=>setDelId(null)} onOk={doDelete} loading={delLoading} text="Bu mahsulotni o'chirmoqchimisiz?"/>
    </div>
  );
}
