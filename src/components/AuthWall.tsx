import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface AuthWallProps {
  title: string;
  message: string;
  buttonLabel?: string;
  onPress: () => void;
}

const AuthWall: React.FC<AuthWallProps> = ({
  title,
  message,
  buttonLabel = 'Se connecter',
  onPress,
}) => {
  return (
    <View className="flex-1 bg-black px-6 py-10 justify-center">
      <View className="rounded-[32px] border border-white/10 bg-zinc-950 px-6 py-8">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-3xl bg-[#25F4EE]/15">
          <View className="h-8 w-8 rounded-xl bg-[#FE2C55]" />
        </View>
        <Text className="mb-3 text-3xl font-bold text-white">{title}</Text>
        <Text className="mb-8 text-base leading-6 text-zinc-300">{message}</Text>

        <TouchableOpacity
          className="rounded-2xl bg-[#FE2C55] px-5 py-4 items-center"
          onPress={onPress}
        >
          <Text className="text-base font-bold text-white">{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AuthWall;
