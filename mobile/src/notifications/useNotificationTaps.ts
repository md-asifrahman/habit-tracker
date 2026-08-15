import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';

/**
 * Opens the challenge a reminder was for. Every scheduled reminder already carries its
 * `challengeId`; without this the notification just dumps you on whatever screen you left,
 * which for a "tick this off" prompt is the wrong place.
 */
export function useNotificationTaps(navigationRef: NavigationContainerRef<RootStackParamList> | null) {
  useEffect(() => {
    if (!navigationRef) return;

    function open(response: Notifications.NotificationResponse | null) {
      const challengeId = response?.notification.request.content.data?.challengeId;
      if (typeof challengeId !== 'string' || !navigationRef?.isReady()) return;
      navigationRef.navigate('Tabs', { screen: 'Today', params: { challengeId } });
    }

    // A tap that launched the app from cold start is waiting here.
    Notifications.getLastNotificationResponseAsync().then(open).catch(() => undefined);

    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [navigationRef]);
}
