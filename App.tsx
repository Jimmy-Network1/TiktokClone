import './global.css';
import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigation from './src/navigation/RootNavigation';
import Logo from './src/components/Logo';
import ErrorBoundary from './src/components/ErrorBoundary';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { supabase } from './src/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { AuthProvider } from './src/context/AuthContext';

function App(): React.JSX.Element {
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('App starting: authReady =', authReady);

  const initAuth = useCallback(async () => {
    console.log('Initializing Auth...');
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
      console.log('Auth session received');
      setAuthReady(true);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Supabase auth initialization error:', err.message || err);
      if (err.message?.includes('Timeout') || err.message?.includes('Network')) {
        setError("Erreur de connexion. Vérifiez votre réseau.");
      } else {
        setAuthReady(true);
      }
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }} className="flex-1 bg-black items-center justify-center p-5">
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
      <View style={{ flex: 1, backgroundColor: 'black' }} className="flex-1 bg-black items-center justify-center">
        <Logo size="large" />
        <ActivityIndicator size="small" color="#2AF5FF" style={{ marginTop: 20 }} />
        <Text className="text-zinc-500 mt-4 text-xs font-mono tracking-widest uppercase">G4 is loading vibes...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <AuthProvider>
          <NavigationContainer>
            <RootNavigation />
          </NavigationContainer>
          {error && (
            <View className="absolute top-14 left-0 right-0 items-center z-[100]">
               <View className="bg-red-600 px-4 py-2 rounded-full shadow-lg flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
                  <Text className="text-white font-bold text-xs">Mode Hors-ligne — Contenu limité</Text>
               </View>
            </View>
          )}
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default App;
