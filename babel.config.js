module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  return {
    presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
    plugins: isTest ? [] : ['react-native-reanimated/plugin'],
  };
};
