const ReactNative = require('react-native');

const Animated = ReactNative.Animated;

const makeSharedValue = (initialValue) => ({ value: initialValue });
const makeNoopAnimation = (value) => value;
const makeAnimatedStyle = (mapper) => (typeof mapper === 'function' ? mapper() : {});
const runOnJS = (fn) => fn;

module.exports = {
  __esModule: true,
  default: Animated,
  Animated,
  Easing: {
    linear: (value) => value,
  },
  runOnJS,
  useAnimatedStyle: makeAnimatedStyle,
  useSharedValue: makeSharedValue,
  withDelay: (_delay, animation) => animation,
  withRepeat: (animation) => animation,
  withSequence: (...animations) => animations[animations.length - 1],
  withSpring: makeNoopAnimation,
  withTiming: makeNoopAnimation,
};
