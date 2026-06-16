import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, X, Users, Star } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const LiveScreen = () => {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const heartScale = useSharedValue(1);

  // Écoute réelle des messages dans la table 'live_messages'
  useEffect(() => {
    const channel = supabase
      .channel('live-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new].slice(-20));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    heartScale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      true
    );
  }, [heartScale]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const sendMessage = async () => {
    if (!message.trim() || !session?.user) return;
    
    // Inscription réelle en base
    const { error } = await supabase
      .from('live_messages')
      .insert({ content: message, user_id: session.user.id });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setMessage('');
    }
  };

  return (
    <View className="flex-1 bg-black">
      <Image 
        source={{ uri: 'https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg' }} 
        style={StyleSheet.absoluteFill}
        className="opacity-60"
      />

      <SafeAreaView className="flex-1 px-4 justify-between">
        <View className="flex-row justify-between items-center mt-4">
          <View className="flex-row items-center bg-black/40 p-1 rounded-full pr-4">
            <View className="h-8 w-8 rounded-full bg-zinc-800 border border-[#FE2C55] items-center justify-center">
              <Text className="text-white text-xs font-bold">L</Text>
            </View>
            <View className="ml-2">
              <Text className="text-white text-[10px] font-bold">LIVE G4 Official</Text>
              <Text className="text-zinc-400 text-[8px]">En direct</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} className="bg-black/40 p-2 rounded-full">
            <X color="white" size={24} />
          </TouchableOpacity>
        </View>

        <View className="absolute right-4 bottom-32">
           <Animated.View style={heartStyle}>
              <Heart color="#FE2C55" size={40} fill="#FE2C55" />
           </Animated.View>
        </View>

        <View className="mb-6">
          <View className="h-40 w-64 mb-4">
            <FlatList
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View className="bg-black/20 self-start p-2 rounded-lg mb-2 flex-row">
                   <Text className="text-[#2AF5FF] font-bold text-xs">@{item.user_id?.slice(0,5)}: </Text>
                   <Text className="text-white text-xs">{item.content}</Text>
                </View>
              )}
            />
          </View>

          <View className="flex-row items-center space-x-3">
            <View className="flex-1 bg-black/40 rounded-full px-4 py-2 flex-row items-center">
              <TextInput
                placeholder="Commenter..."
                placeholderTextColor="#a1a1aa"
                className="flex-1 text-white text-sm"
                value={message}
                onChangeText={setMessage}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity>
                 <Star color="white" size={20} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity className="bg-zinc-800 p-3 rounded-full">
               <Users color="white" size={20} />
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#FE2C55] p-3 rounded-full" onPress={sendMessage}>
               <Heart color="white" size={20} fill="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default LiveScreen;
