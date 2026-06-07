import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { fmtDate, roleMap } from '../lib/utils';
import Modal   from '../components/Modal';
import Confirm from '../components/Confirm';
import { PageLoader } from '../components/Spinner';

const EMPTY = { full_name:'', email:'', password:'', role:'manager', is_active:true };

export default function Users() {
  const [rows,  setRows]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [sel,   setSel]   = useState(null);
  const [form,  setForm]  = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [delId,  setDelId]  = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/users')
      .then(r => setRows(r.data))
      .catch(() => toast.error('Xato'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setSel(null); setModal('form'); };
  const openEdit   = (u) => {
    setSel(u);
    setForm({ full_name:u.full_name, email:u.email, password:'', role:u.role, is_active:u.is_active });
    setModal('form');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!sel) {
        await api.post('/users', form);
        toast.success("Foydalanuvchi qo'shildi");
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${sel.id}`, payload);
        toast.success('Yangilandi');
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
      await api.delete(`/users/${delId}`);
      toast.success("O'chirildi");
      setDelId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xato');
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Yangi foydalanuvchi
        </button>
      </div>

      <div className="card">
        {loading ? <PageLoader/> : (
          <div className="table-wrap border-0">
            <table className="table">
              <thead><tr>
                <th>Ism</th><th>Email</th><th>Rol</th><th>Holat</th><th>Sana</th><th></th>
              </tr></thead>
              <tbody>
                {rows.length===0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">Topilmadi</td></tr>}
                {rows.map(u => {
                  const r = roleMap[u.role] || { label: u.role, color: 'bg-slate-100 text-slate-600 border border-slate-200' };
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                            {u.full_name[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="text-slate-500">{u.email}</td>
                      <td><span className={`badge ${r.color}`}>{r.label}</span></td>
                      <td>
                        <span className={`badge ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          {u.is_active ? 'Faol' : "Nofaol"}
                        </span>
                      </td>
                      <td className="text-xs text-slate-400">{fmtDate(u.created_at)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(u)} className="btn-icon btn-secondary btn-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button onClick={() => setDelId(u.id)} className="btn-icon btn-danger btn-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal==='form'} onClose={() => setModal(null)}
        title={sel ? 'Foydalanuvchini tahrirlash' : "Yangi foydalanuvchi qo'shish"}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Ism *</label>
            <input className="input" value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} required/>
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required/>
          </div>
          <div>
            <label className="label">{sel ? 'Yangi parol (ixtiyoriy)' : 'Parol *'}</label>
            <input type="password" className="input" value={form.password}
              onChange={e => setForm(f=>({...f,password:e.target.value}))}
              required={!sel}
              placeholder={sel ? 'O\'zgartirmaslik uchun bo\'sh qoldiring' : ''}
            />
          </div>
          <div>
            <label className="label">Rol *</label>
            <select className="select" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
              <option value="admin">Admin</option>
              <option value="manager">Menejer</option>
              <option value="warehouse">Omborchi</option>
            </select>
          </div>
          {sel && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm(f=>({...f,is_active:e.target.checked}))}
                className="w-4 h-4 accent-blue-600"/>
              <span className="text-sm text-slate-700">Faol</span>
            </label>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Bekor</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>

      <Confirm open={!!delId} onClose={()=>setDelId(null)} onOk={doDelete} loading={delLoading} text="Bu foydalanuvchini o'chirmoqchimisiz?"/>
    </div>
  );
}
