import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, X, Users, Star } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const MESSAGES = [
  { id: '1', user: 'momo_99', text: 'Incroyable ce live ! 🔥' },
  { id: '2', user: 'juju_cool', text: 'G4 est le futur ! ✨' },
  { id: '3', user: 'expert_tech', text: 'Quelle qualité de stream !' },
  { id: '4', user: 'fan_de_g4', text: 'Dédicace stp ! 😍' },
];

const LiveScreen = () => {
  const navigation = useNavigation();
  const [message, setMessage] = useState('');
  const heartScale = useSharedValue(1);

  useEffect(() => {
    const scale = heartScale;
    scale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      true
    );
  }, [heartScale]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  return (
    <View className="flex-1 bg-black">
      {/* Background Simulation */}
      <Image 
        source={{ uri: 'https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg' }} 
        style={StyleSheet.absoluteFill}
        className="opacity-60"
      />

      <SafeAreaView className="flex-1 px-4 justify-between">
        {/* Header */}
        <View className="flex-row justify-between items-center mt-4">
          <View className="flex-row items-center bg-black/40 p-1 rounded-full pr-4">
            <View className="h-8 w-8 rounded-full bg-zinc-800 border border-[#FE2C55] items-center justify-center">
              <Text className="text-white text-xs font-bold">L</Text>
            </View>
            <View className="ml-2">
              <Text className="text-white text-[10px] font-bold">LIVE G4 Official</Text>
              <Text className="text-zinc-400 text-[8px]">1.4K spectateurs</Text>
            </View>
            <TouchableOpacity className="ml-3 bg-[#FE2C55] px-3 py-1 rounded-full">
              <Text className="text-white text-[10px] font-bold">Suivre</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} className="bg-black/40 p-2 rounded-full">
            <X color="white" size={24} />
          </TouchableOpacity>
        </View>

        {/* Floating Hearts Area (Simulation) */}
        <View className="absolute right-4 bottom-32">
           <Animated.View style={heartStyle}>
              <Heart color="#FE2C55" size={40} fill="#FE2C55" />
           </Animated.View>
        </View>

        {/* Footer */}
        <View className="mb-6">
          {/* Chat */}
          <View className="h-40 w-64 mb-4">
            <FlatList
              data={MESSAGES}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View className="bg-black/20 self-start p-2 rounded-lg mb-2 flex-row">
                   <Text className="text-[#2AF5FF] font-bold text-xs">@{item.user}: </Text>
                   <Text className="text-white text-xs">{item.text}</Text>
                </View>
              )}
            />
          </View>

          {/* Interaction Bar */}
          <View className="flex-row items-center space-x-3">
            <View className="flex-1 bg-black/40 rounded-full px-4 py-2 flex-row items-center">
              <TextInput
                placeholder="Commenter..."
                placeholderTextColor="#a1a1aa"
                className="flex-1 text-white text-sm"
                value={message}
                onChangeText={setMessage}
              />
              <TouchableOpacity>
                 <Star color="white" size={20} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity className="bg-zinc-800 p-3 rounded-full">
               <Users color="white" size={20} />
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#FE2C55] p-3 rounded-full" onPress={() => {}}>
               <Heart color="white" size={20} fill="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default LiveScreen;
