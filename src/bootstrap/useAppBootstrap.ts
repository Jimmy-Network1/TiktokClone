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
      timeoutId = setTimeout(() => reject(new Error('Timeout')), 4000);
    });

    try {
      const authPromise = supabase.auth.getSession();
      await Promise.race([authPromise, timeoutPromise]);
      setAuthReady(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error('Supabase auth initialization error:', msg);
      // On laisse passer l'utilisateur même si l'auth échoue (mode invité)
      setAuthReady(true);
      if (msg.includes('Timeout') || msg.includes('Network')) {
        setError('Erreur de connexion. Vérifiez votre réseau.');
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
