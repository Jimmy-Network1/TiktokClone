module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-community|lucide-react-native|react-native-safe-area-context|react-native-url-polyfill|react-native-image-picker|react-native-video|react-native-worklets|react-native-worklets-core|react-native-reanimated|@supabase|react-native-css-interop|nativewind)/)',
  ],
};
