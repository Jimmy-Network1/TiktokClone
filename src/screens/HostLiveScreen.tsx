import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { X, Camera, Mic, Share2, Users, Heart, MessageCircle, Send } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay, withTiming, runOnJS } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const FloatingHeart = ({ id, onComplete }: { id: string; onComplete: (id: string) => void }) => {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1);
    x.value = withTiming((Math.random() - 0.5) * 100, { duration: 2000 });
    y.value = withTiming(-height * 0.6, { duration: 2000 });
    opacity.value = withDelay(1500, withTiming(0, { duration: 500 }, (finished) => {
      if (finished) {
        runOnJS(onComplete)(id);
      }
    }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value },
      { translateX: x.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
    position: 'absolute',
    bottom: 80,
    right: 30,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Heart size={24} color="#FE2C55" fill="#FE2C55" />
    </Animated.View>
  );
};

const HostLiveScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [hearts, setHearts] = useState<{ id: string }[]>([]);
  const [chatText, setChatText] = useState('');
  
  const channelRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const startLive = async () => {
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Veuillez donner un titre à votre direct.');
      return;
    }

    setLoading(true);
    try {
      const roomName = `live:room_${session?.user?.id}`;
      channelRef.current = supabase.channel(roomName, {
        config: {
          presence: {
            key: session?.user?.id,
          },
        },
      });

      channelRef.current
        .on('presence', { event: 'sync' }, () => {
          const state = channelRef.current.presenceState();
          setViewerCount(Object.keys(state).length);
        })
        .on('broadcast', { event: 'heart' }, () => {
          const id = Math.random().toString(36).substring(7);
          setHearts(prev => [...prev, { id }]);
        })
        .on('broadcast', { event: 'chat' }, ({ payload }: any) => {
          setMessages(prev => [...prev, payload]);
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await channelRef.current.track({
              user_id: session?.user?.id,
              username: session?.user?.email?.split('@')[0],
              is_host: true,
              title: title,
              online_at: new Date().toISOString(),
            });
            setIsLive(true);
            setLoading(false);
          }
        });

      // Simulation de spectateurs qui arrivent
      setTimeout(() => {
        const mockMsg = {
          id: 'mock1',
          username: 'FanDeTikTok',
          text: 'Salut G4 ! Super ton live ! 🔥'
        };
        setMessages(prev => [...prev, mockMsg]);
        const id = Math.random().toString(36).substring(7);
        setHearts(prev => [...prev, { id }]);
      }, 3000);

    } catch (err) {
      console.error('Error starting live:', err);
      Alert.alert('Erreur', 'Impossible de lancer le direct.');
      setLoading(false);
    }
  };

  const endLive = () => {
    Alert.alert(
      'Arrêter le direct',
      'Voulez-vous vraiment terminer ce live ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Terminer', 
          style: 'destructive',
          onPress: () => {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
            }
            setIsLive(false);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleSendChat = () => {
    if (!chatText.trim()) return;
    
    const newMsg = {
      id: Date.now().toString(),
      username: 'Moi (Hôte)',
      text: chatText.trim()
    };
    
    setMessages(prev => [...prev, newMsg]);
    setChatText('');
    
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'chat',
        payload: newMsg
      });
    }
  };

  const removeHeart = (id: string) => {
    setHearts(prev => prev.filter(h => h.id !== id));
  };

  if (!isLive) {
    return (
      <View style={styles.container} className="bg-zinc-950">
        <SafeAreaView className="flex-1">
          <View className="flex-row justify-between items-center px-5 pt-4">
             <TouchableOpacity onPress={() => navigation.goBack()}>
                <X color="white" size={30} />
             </TouchableOpacity>
             <TouchableOpacity>
                <Text className="text-white font-bold">Paramètres</Text>
             </TouchableOpacity>
          </View>

          <View className="flex-1 items-center justify-center px-10">
             <View className="w-32 h-32 rounded-3xl bg-zinc-900 items-center justify-center border border-white/5 mb-8">
                <Camera color="#FE2C55" size={60} />
             </View>
             
             <Text className="text-white text-2xl font-bold mb-2">Lancer un Direct</Text>
             <Text className="text-zinc-500 text-center mb-8">Partagez votre créativité avec le monde entier en temps réel.</Text>

             <TextInput
               className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-white text-lg mb-6"
               placeholder="Donnez un titre à votre LIVE..."
               placeholderTextColor="#52525b"
               value={title}
               onChangeText={setTitle}
               maxLength={50}
             />

             <TouchableOpacity 
               className="w-full bg-[#FE2C55] rounded-xl py-4 items-center justify-center"
               onPress={startLive}
               disabled={loading}
             >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">PASSER AU DIRECT</Text>
                )}
             </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container} className="bg-black">
      {/* Simulation Background (Camera) */}
      <View style={StyleSheet.absoluteFill} className="bg-zinc-900 items-center justify-center">
         <Text className="text-zinc-800 font-black text-6xl opacity-10 rotate-12">LIVE STREAMING</Text>
         <View className="absolute top-1/2 left-1/2 -ml-20 -mt-20 w-40 h-40 rounded-full bg-[#FE2C55]/10 border border-[#FE2C55]/20" />
      </View>

      <SafeAreaView className="flex-1">
        {/* Top Bar */}
        <View className="flex-row justify-between items-center px-4 pt-2">
           <View className="flex-row items-center bg-black/40 rounded-full px-1.5 py-1">
              <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center">
                 <Text className="text-white font-bold text-xs">H</Text>
              </View>
              <View className="mx-2">
                 <Text className="text-white font-bold text-[10px]">@{session?.user?.email?.split('@')[0]}</Text>
                 <Text className="text-white/60 text-[8px]">{viewerCount} spectateurs</Text>
              </View>
              <TouchableOpacity className="bg-[#FE2C55] px-3 py-1.5 rounded-full">
                 <Text className="text-white font-bold text-[10px]">Suivre</Text>
              </TouchableOpacity>
           </View>

           <View className="flex-row items-center space-x-2">
              <View className="bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                 <Text className="text-white font-black text-[10px]">G4 CONNECTED</Text>
              </View>
              <TouchableOpacity 
                onPress={endLive}
                className="bg-black/40 p-2 rounded-full"
              >
                 <X color="white" size={20} />
              </TouchableOpacity>
           </View>
        </View>

        {/* Live Label */}
        <View className="px-4 mt-2">
           <View className="bg-[#FE2C55] self-start px-2 py-0.5 rounded">
              <Text className="text-white font-black text-[10px]">EN DIRECT</Text>
           </View>
           <Text className="text-white font-bold text-lg mt-1">{title}</Text>
        </View>

        {/* Chat Area */}
        <View className="flex-1 justify-end px-4 pb-4">
           <View className="max-h-64 mb-4">
              {messages.map((msg, index) => (
                <View key={index} className="flex-row mb-2 items-start">
                   <View className="bg-black/30 px-3 py-1.5 rounded-2xl border border-white/5">
                      <Text className="text-[#2AF5FF] font-bold text-xs">{msg.username}: <Text className="text-white font-normal">{msg.text}</Text></Text>
                   </View>
                </View>
              ))}
           </View>

           {/* Actions Bar */}
           <View className="flex-row items-center space-x-3">
              <View className="flex-1 flex-row items-center bg-white/10 rounded-full px-4 py-2.5">
                 <TextInput
                   className="flex-1 text-white text-sm"
                   placeholder="Ajouter un commentaire..."
                   placeholderTextColor="#a1a1aa"
                   value={chatText}
                   onChangeText={setChatText}
                   onSubmitEditing={handleSendChat}
                 />
                 <TouchableOpacity onPress={handleSendChat}>
                    <Send color="white" size={18} />
                 </TouchableOpacity>
              </View>

              <TouchableOpacity className="bg-white/10 p-2.5 rounded-full">
                 <Share2 color="white" size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity className="bg-white/10 p-2.5 rounded-full">
                 <Heart color="white" size={20} />
              </TouchableOpacity>
           </View>
        </View>

        {/* Floating Hearts */}
        {hearts.map(heart => (
          <FloatingHeart key={heart.id} id={heart.id} onComplete={removeHeart} />
        ))}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HostLiveScreen;
