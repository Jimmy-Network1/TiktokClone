import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ErrorBoundary caught:', error.message);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View className="flex-1 items-center justify-center bg-black px-8">
          <Text className="text-white text-lg font-bold mb-2">Oups !</Text>
          <Text className="text-zinc-400 text-sm text-center mb-6">
            Un problème est survenu. Pas de panique, ça arrive même aux meilleurs.
          </Text>
          {this.state.error && (
            <Text className="text-zinc-600 text-xs mb-6 text-center" numberOfLines={2}>
              {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity
            onPress={this.handleRetry}
            className="bg-[#2AF5FF] px-8 py-3 rounded-full"
          >
            <Text className="text-black font-bold text-sm">Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
