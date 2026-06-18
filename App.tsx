import './global.css';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import AppShell from './src/bootstrap/AppShell';
import { useAppBootstrap } from './src/bootstrap/useAppBootstrap';

function App(): React.JSX.Element {
  const { authReady, error, initAuth } = useAppBootstrap();

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <AuthProvider>
          <AppShell authReady={authReady} error={error} initAuth={initAuth} />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default App;
