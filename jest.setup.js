const { jest: jestGlobal } = require('@jest/globals');

jestGlobal.mock('react-native-reanimated');
jestGlobal.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
