import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

api.interceptors.request.use(cfg => {
  const s = localStorage.getItem('crm-auth');
  if (s) {
    const { state } = JSON.parse(s);
    if (state?.token) cfg.headers.Authorization = `Bearer ${state.token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('crm-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
