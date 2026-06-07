import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../store/auth';
import toast from 'react-hot-toast';

const TITLES = {
  '/':           'Dashboard',
  '/customers':  'Mijozlar',
  '/products':   'Mahsulotlar',
  '/orders':     'Buyurtmalar',
  '/inventory':  'Ombor',
  '/users':      'Foydalanuvchilar',
};

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // handle /orders/123
  const base = '/' + pathname.split('/')[1];
  const title = TITLES[base] || 'CRM';

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
      <h1 className="font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">
          Xush kelibsiz, <b className="text-slate-800 font-medium">{user?.full_name}</b>
        </span>
        <button
          onClick={() => { logout(); toast.success('Chiqish muvaffaqiyatli'); navigate('/login'); }}
          className="btn-secondary btn-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Chiqish
        </button>
      </div>
    </header>
  );
}
