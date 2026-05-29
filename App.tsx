import './global.css';
import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigation from './src/navigation/RootNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { supabase } from './src/lib/supabase';
import { Session } from '@supabase/supabase-js';

function App(): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initAuth = useCallback(async () => {
    setError(null);
    setAuthReady(false);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Le serveur ne répond pas (Timeout)')), 8000)
    );

    try {
      const authPromise = supabase.auth.getSession();
      const result = await Promise.race([authPromise, timeoutPromise]) as any;
      setSession(result?.data?.session ?? null);
      setAuthReady(true);
    } catch (err: any) {
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [initAuth]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity 
          onPress={initAuth}
          style={{ marginTop: 20, backgroundColor: '#FE2C55', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!authReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={{ color: '#fff', marginTop: 15, fontSize: 12, opacity: 0.5 }}>Initialisation de TikTok...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <NavigationContainer>
        <RootNavigation session={session} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
