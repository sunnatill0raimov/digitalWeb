import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuth from '../store/auth';

export default function Login() {
  const [form, setForm] = useState({ email: 'admin@crm.uz', password: 'admin123' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.user, data.token);
      toast.success(`Xush kelibsiz, ${data.user.full_name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Top bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"/>
          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
                <span className="text-white font-bold text-lg tracking-tight">CRM</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">DigitalCRM</h1>
              <p className="text-sm text-slate-400 mt-1">Kiyim-kechak savdo tizimi</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@company.uz"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Parol</label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Kirish...</>
                  : 'Kirish'}
              </button>
            </form>
          </div>
        </div>
        {/* <p className="text-center text-xs text-slate-400 mt-4">
          Default: admin@crm.uz / admin123
        </p> */}
      </div>
    </div>
  );
}
