import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import Logo from '../components/Logo';
import NotificationBanner from '../components/NotificationBanner';
import StartupIssueBanner from '../components/StartupIssueBanner';
import { useNotifications } from '../hooks/useNotifications';

const RootNavigation = lazy(() => import('../navigation/RootNavigation'));

type AppShellProps = {
  authReady: boolean;
  error: string | null;
  initAuth: () => void;
};

const AppShell: React.FC<AppShellProps> = ({ authReady, error, initAuth }) => {
  const { latestNotification, clearNotification } = useNotifications();

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }} className="items-center justify-center p-5 bg-black">
        <Text className="text-white text-lg font-bold text-center">{error}</Text>
        <TouchableOpacity onPress={initAuth} className="mt-5 bg-[#FE2C55] px-8 py-3 rounded-full">
          <Text className="text-white font-bold">Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!authReady) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }} className="items-center justify-center bg-black">
        <Logo size="large" />
        <ActivityIndicator size="small" color="#2AF5FF" style={{ marginTop: 20 }} />
        <Text className="text-zinc-500 mt-4 text-xs font-mono tracking-widest uppercase">G4 is loading vibes...</Text>
      </View>
    );
  }

  return (
    <>
      <StartupIssueBanner />
      <Suspense
        fallback={
          <View className="flex-1 items-center justify-center bg-black">
            <Logo size="large" />
            <ActivityIndicator size="small" color="#2AF5FF" style={{ marginTop: 20 }} />
          </View>
        }
      >
        <NavigationContainer>
          <RootNavigation />
        </NavigationContainer>
      </Suspense>
      <NotificationBanner notification={latestNotification} onClear={clearNotification} />
    </>
  );
};

export default AppShell;
