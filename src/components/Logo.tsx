import React from 'react';
import { View, Text } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ size = 'medium' }) => {
  const containerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  };

  const textStyle = {
    fontSize: size === 'small' ? 24 : size === 'medium' ? 42 : 64,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -2,
  };

  const subTextStyle = {
    fontSize: size === 'small' ? 12 : size === 'medium' ? 16 : 24,
    fontWeight: 'bold' as const,
    color: '#FE2C55', // Traditional TikTok pink for continuity
    marginLeft: -2,
    marginTop: size === 'small' ? 10 : size === 'medium' ? 18 : 28,
  };

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>G</Text>
      <View style={{ 
        backgroundColor: '#2AF5FF', // Neon Blue
        paddingHorizontal: size === 'small' ? 4 : 8,
        borderRadius: 4,
        transform: [{ rotate: '-10deg' }],
        marginLeft: -4
      }}>
        <Text style={[textStyle, { color: '#000' }]}>4</Text>
      </View>
      <View className="ml-1 items-start justify-center">
         <View className="h-1.5 w-1.5 rounded-full bg-[#FE2C55]" />
      </View>
    </View>
  );
};

export default Logo;
