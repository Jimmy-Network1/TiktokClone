import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
} from 'react-native-reanimated';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ size = 'medium' }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
    
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const fontSize = size === 'small' ? 28 : size === 'medium' ? 48 : 72;
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: scale.value * 1.2 }],
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Background Glow Simulation */}
      <Animated.View 
        style={[
          glowStyle,
          {
            position: 'absolute',
            width: fontSize * 1.5,
            height: fontSize * 1.5,
            borderRadius: fontSize,
            backgroundColor: '#2AF5FF',
          }
        ]} 
        className="opacity-20"
      />

      <Animated.View style={[animatedStyle, { flexDirection: 'row', alignItems: 'center' }]}>
        <Text style={[styles.text, { fontSize, color: '#FFF' }]}>G</Text>
        <View style={[styles.box, { 
          paddingHorizontal: size === 'small' ? 6 : 10,
          borderRadius: size === 'small' ? 6 : 12,
        }]}>
          <Text style={[styles.text, { fontSize, color: '#000' }]}>4</Text>
        </View>
        
        {/* Animated Dot */}
        <View style={{ 
          width: fontSize / 6, 
          height: fontSize / 6, 
          borderRadius: fontSize / 12, 
          backgroundColor: '#FE2C55',
          marginLeft: 4,
          marginTop: fontSize / 2
        }} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: '900',
    fontStyle: 'italic',
  },
  box: {
    backgroundColor: '#2AF5FF',
    marginLeft: -2,
    transform: [{ rotate: '-5deg' }],
  }
});

export default Logo;
