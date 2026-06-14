/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../src/navigation/RootNavigation', () => {
  return function RootNavigation() {
    return null;
  };
});

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
    },
  },
}));

jest.setTimeout(15000);

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    const component = ReactTestRenderer.create(<App />);
    // Wait for the next tick to allow useEffect and promises to resolve
    await Promise.resolve();
  });
});
