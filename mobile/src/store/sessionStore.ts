import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { setAccessToken } from '../api/client';
import { authApi } from '../api/auth';

interface Session {
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
}

interface SessionState {
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      login: async (email, password) => {
        const auth = await authApi.login({ email, password });
        setAccessToken(auth.accessToken);
        set({ session: auth });
      },
      register: async (email, password, name) => {
        const auth = await authApi.register({ email, password, name });
        setAccessToken(auth.accessToken);
        set({ session: auth });
      },
      logout: () => {
        setAccessToken(null);
        set({ session: null });
      },
    }),
    {
      name: 'habittracker.session',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.session) {
          setAccessToken(state.session.accessToken);
        }
      },
    },
  ),
);
