import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { recordRuntimeIssue } from '../lib/runtimeDiagnostics';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    recordRuntimeIssue({
      source: 'boundary',
      fatal: false,
      message: error.message,
      stack: error.stack,
    }).catch(() => undefined);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <AlertCircle color="#FE2C55" size={64} />
          <Text style={styles.title}>Oups ! Une petite erreur.</Text>
          <Text style={styles.message}>
             L'application G4 a rencontré un problème inattendu. Ne vous inquiétez pas, vos données sont en sécurité.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <RefreshCw color="white" size={20} style={{ marginRight: 10 }} />
            <Text style={styles.buttonText}>Relancer l'interface</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  message: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#FE2C55',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 30,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ErrorBoundary;
