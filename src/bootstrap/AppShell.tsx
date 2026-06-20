import React, { Suspense, lazy, useState, useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import Logo from '../components/Logo';
import ErrorBoundary from '../components/ErrorBoundary';
import NotificationBanner from '../components/NotificationBanner';
import StartupIssueBanner from '../components/StartupIssueBanner';
import { useNotifications } from '../hooks/useNotifications';
import { X, WifiOff } from 'lucide-react-native';

const RootNavigation = lazy(() => import('../navigation/RootNavigation'));

type AppShellProps = {
  authReady: boolean;
  error: string | null;
  initAuth: () => void;
};

const AppShell: React.FC<AppShellProps> = ({ authReady, error, initAuth }) => {
  const { latestNotification, clearNotification } = useNotifications();
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  useEffect(() => {
    if (error) {
      setShowErrorBanner(true);
      const timer = setTimeout(() => setShowErrorBanner(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!authReady && !error) {
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
      {showErrorBanner && error && (
        <View className="absolute left-4 right-4 top-12 z-[999]">
          <View className="rounded-2xl border border-[#FE2C55]/40 bg-zinc-950/95 p-4 shadow-2xl">
            <View className="flex-row items-start">
              <View className="mr-3 rounded-full bg-[#FE2C55]/15 p-2">
                <WifiOff color="#FE2C55" size={18} />
              </View>
              <View className="flex-1 pr-2">
                <Text className="text-white text-sm font-bold">
                  Problème de connexion
                </Text>
                <Text className="text-zinc-400 text-xs mt-1">
                  {error}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowErrorBanner(false)} className="p-1">
                <X color="#52525b" size={16} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={initAuth} className="mt-3 py-2">
              <Text className="text-[#2AF5FF] text-xs font-bold">Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <StartupIssueBanner />
      <ErrorBoundary>
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
      </ErrorBoundary>
      <NotificationBanner notification={latestNotification} onClear={clearNotification} />
    </>
  );
};

export default AppShell;
