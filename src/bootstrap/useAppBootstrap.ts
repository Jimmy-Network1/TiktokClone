import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { installRuntimeDiagnostics } from '../lib/runtimeDiagnostics';

export const useAppBootstrap = () => {
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initAuth = useCallback(async () => {
    setError(null);
    setAuthReady(false);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Le serveur ne répond pas (Timeout)')), 8000);
    });

    try {
      const authPromise = supabase.auth.getSession();
      await Promise.race([authPromise, timeoutPromise]);
      setAuthReady(true);
    } catch (err: any) {
      console.error('Supabase auth initialization error:', err.message || err);
      if (err.message?.includes('Timeout') || err.message?.includes('Network')) {
        setError('Erreur de connexion. Vérifiez votre réseau.');
      } else {
        setAuthReady(true);
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }, []);

  useEffect(() => {
    installRuntimeDiagnostics();
    initAuth();
  }, [initAuth]);

  return { authReady, error, initAuth };
};
