import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { setAccessToken, setAuthHandlers } from '../api/client';
import { authApi } from '../api/auth';
import { secureStorage } from './secureStorage';

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
      // Tokens are as good as the password — they belong in the Keychain/Keystore, not in a
      // plain file that a rooted device or a backup can hand over.
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.session) {
          setAccessToken(state.session.accessToken);
        }
      },
    },
  ),
);

/**
 * Lets the API client refresh an expired access token on its own. Access tokens are good for
 * 15 minutes, so without this every session would start failing partway through and the sync
 * would report itself as permanently offline.
 */
setAuthHandlers({
  getRefreshToken: () => useSessionStore.getState().session?.refreshToken ?? null,
  onRefreshed: (auth) =>
    useSessionStore.setState((state) =>
      state.session
        ? {
            session: {
              ...state.session,
              accessToken: auth.accessToken,
              refreshToken: auth.refreshToken,
            },
          }
        : state,
    ),
  // Only reached when the refresh token is rejected outright — a network failure leaves the
  // session alone, since being offline is normal here.
  onRefreshFailed: () => useSessionStore.getState().logout(),
});
