import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Manrope_400Regular, Manrope_700Bold } from '@expo-google-fonts/manrope';
import RootNavigator from './src/navigation/RootNavigator';
import { useBackgroundSync } from './src/sync/useBackgroundSync';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function App() {
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Manrope_400Regular,
    Manrope_700Bold,
  });

  useBackgroundSync();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
        <StatusBar style="auto" />
      </QueryClientProvider>
    </View>
  );
}
