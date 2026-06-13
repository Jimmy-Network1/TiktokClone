import './global.css';
import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigation from './src/navigation/RootNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { supabase } from './src/lib/supabase';
import { Session } from '@supabase/supabase-js';

function App(): React.JSX.Element {
  const [_, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initAuth = useCallback(async () => {
    setError(null);
    setAuthReady(false);

    let timeoutId: any;
    const timeoutPromise = new Promise((__unused, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Le serveur ne répond pas (Timeout)')), 8000);
    });

    try {
      const authPromise = supabase.auth.getSession();
      const result = await Promise.race([authPromise, timeoutPromise]) as any;
      clearTimeout(timeoutId);
      setSession(result?.data?.session ?? null);
      setAuthReady(true);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Supabase auth initialization error:', err);
      // We still set authReady to true but maybe show a guest mode warning later
      // or if it's a critical network error, we show the retry UI
      if (err.message.includes('Timeout') || err.message.includes('Network')) {
        setError("Erreur de connexion. Vérifiez votre réseau.");
      } else {
        setAuthReady(true); // Proceed as guest if it's just a session error
      }
    }
  }, []);

  useEffect(() => {
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      setSession(_session);
    });

    return () => subscription.unsubscribe();
  }, [initAuth]);

  if (error) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-5">
        <Text className="text-white text-lg font-bold text-center">{error}</Text>
        <TouchableOpacity 
          onPress={initAuth}
          className="mt-5 bg-[#FE2C55] px-8 py-3 rounded-full"
        >
          <Text className="text-white font-bold">Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!authReady) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text className="text-white mt-4 text-xs opacity-50">Initialisation de TikTok...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <NavigationContainer>
        <RootNavigation />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
