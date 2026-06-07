import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuth = create(
  persist(
    (set) => ({
      user:  null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout:  () => set({ user: null, token: null })
    }),
    { name: 'crm-auth' }
  )
);

export default useAuth;
