import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncInBackground } from './syncService';
import { useSessionStore } from '../store/sessionStore';

/**
 * Syncs once at launch, whenever the app returns to the foreground, and whenever the user
 * signs in or out. Failures are swallowed by the sync service — offline is a normal state here.
 */
export function useBackgroundSync(): void {
  const session = useSessionStore((state) => state.session);

  useEffect(() => {
    syncInBackground();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') syncInBackground();
    });
    return () => subscription.remove();
  }, [session?.accessToken]);
}
