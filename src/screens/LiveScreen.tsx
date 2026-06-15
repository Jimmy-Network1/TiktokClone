import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, X, Users, Star, Send } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface LiveMessage {
  id: string;
  user: string;
  text: string;
}

const LiveScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation();
  const [message, setMessage] = useState('');
  const [spectatorsCount, setSpectatorsCount] = useState(1);
  const [messages, setMessages] = useState<LiveMessage[]>([
    { id: '1', user: 'G4_Bot', text: 'Bienvenue sur le LIVE officiel de G4 ! 🚀' }
  ]);
  
  const heartScale = useSharedValue(1);
  const flatListRef = useRef<FlatList>(null);
  
  // Animation loop for ambient heart pulse
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

  // Setup Real-time Live Interaction Channel
  useEffect(() => {
    const channel = supabase.channel('live:g4_official', {
      config: {
        presence: {
          key: session?.user?.id || `guest-${Math.random().toString(36).substring(7)}`,
        },
      },
    });

    channel
      // 1. Live Chat messages broadcast
      .on('broadcast', { event: 'chat' }, (payload) => {
        const newMessage: LiveMessage = {
          id: Math.random().toString(),
          user: payload.payload.user,
          text: payload.payload.text,
        };
        setMessages((prev) => [...prev, newMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      })
      // 2. Live hearts broadcast
      .on('broadcast', { event: 'heart' }, (payload) => {
        // Pulse local heart when someone likes
        heartScale.value = withSequence(
          withTiming(1.5, { duration: 150 }),
          withSpring(1)
        );
        Vibration.vibrate(50);
      })
      // 3. Spectators tracking with Presence
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        // Simulating some baseline viewers + real users to look premium
        setSpectatorsCount(count + 42); 
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user metadata
          const username = session?.user?.email?.split('@')[0] || 'Visiteur';
          await channel.track({
            online_at: new Date().toISOString(),
            username: username
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user]);

  // Send message on the live chat
  const handleSendMessage = () => {
    if (!message.trim()) return;

    const username = session?.user?.email?.split('@')[0] || 'Visiteur';
    const textToSend = message.trim();
    setMessage('');

    // Prepend locally
    const localMsg: LiveMessage = {
      id: Math.random().toString(),
      user: username,
      text: textToSend,
    };
    setMessages((prev) => [...prev, localMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // Broadcast to other users in live
    const channel = supabase.channel('live:g4_official');
    channel.send({
      type: 'broadcast',
      event: 'chat',
      payload: { user: username, text: textToSend },
    });
  };

  // Send a heart to the live stream
  const handleSendHeart = () => {
    // Animate locally
    heartScale.value = withSequence(
      withTiming(1.6, { duration: 150 }),
      withSpring(1)
    );
    Vibration.vibrate(80);

    // Broadcast heart to everyone
    const channel = supabase.channel('live:g4_official');
    channel.send({
      type: 'broadcast',
      event: 'heart',
      payload: { clicker: session?.user?.id || 'guest' }
    });
  };

  return (
    <View className="flex-1 bg-black">
      {/* Background Simulation */}
      <Image 
        source={{ uri: 'https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg' }} 
        style={StyleSheet.absoluteFill}
        className="opacity-70"
      />

      <SafeAreaView className="flex-1 px-4 justify-between" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row justify-between items-center mt-2">
          <View className="flex-row items-center bg-black/40 p-1 rounded-full pr-4 border border-white/5">
            <View className="h-8 w-8 rounded-full bg-[#FE2C55] items-center justify-center">
              <Text className="text-white text-xs font-black">G4</Text>
            </View>
            <View className="ml-2">
              <Text className="text-white text-[10px] font-bold">LIVE G4 Official</Text>
              <Text className="text-[#2AF5FF] text-[8px] font-semibold">{spectatorsCount} spectateurs</Text>
            </View>
            <TouchableOpacity className="ml-3 bg-[#FE2C55] px-3 py-1 rounded-full">
              <Text className="text-white text-[10px] font-bold">Suivre</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} className="bg-black/40 p-2 rounded-full border border-white/5">
            <X color="white" size={20} />
          </TouchableOpacity>
        </View>

        {/* Floating Hearts Area (Simulation) */}
        <View className="absolute right-4 bottom-32">
           <Animated.View style={heartStyle}>
              <TouchableOpacity onPress={handleSendHeart}>
                <Heart color="#FE2C55" size={44} fill="#FE2C55" />
              </TouchableOpacity>
           </Animated.View>
        </View>

        {/* Footer */}
        <View className="mb-4">
          {/* Chat */}
          <View className="h-44 w-72 mb-4 bg-transparent">
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View className="bg-black/35 self-start px-3 py-1.5 rounded-full mb-1.5 flex-row border border-white/5">
                   <Text className="text-[#2AF5FF] font-bold text-xs">@{item.user}: </Text>
                   <Text className="text-white text-xs font-medium">{item.text}</Text>
                </View>
              )}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          </View>

          {/* Interaction Bar */}
          <View className="flex-row items-center space-x-3">
            <View className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-1 flex-row items-center">
              <TextInput
                placeholder="Commenter en direct..."
                placeholderTextColor="#a1a1aa"
                className="flex-1 text-white text-sm"
                value={message}
                onChangeText={setMessage}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity onPress={handleSendMessage} disabled={!message.trim()}>
                 <Send color={message.trim() ? '#FE2C55' : '#71717a'} size={18} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity className="bg-zinc-800 p-3 rounded-full border border-white/5" onPress={handleSendHeart}>
               <Star color="white" size={20} />
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#FE2C55] p-3 rounded-full border border-white/5" onPress={handleSendHeart}>
               <Heart color="white" size={20} fill="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default LiveScreen;
