import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { X, Camera, Check, Star, Send, User } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay, withTiming, runOnJS } from 'react-native-reanimated';
import { Camera as VisionCamera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

const { width, height } = Dimensions.get('window');

const HostLiveScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  const [isLive, setIsLive] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestRequests, setGuestRequests] = useState<any[]>([]);
  const [currentGuest, setCurrentGuest] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  // Fetch guest requests
  useEffect(() => {
    if (!isLive || !sessionId) return;

    const fetchRequests = async () => {
       const { data } = await supabase
         .from('live_guest_requests')
         .select('id, guest_id, profiles(username)')
         .eq('session_id', sessionId)
         .eq('status', 'pending');
       setGuestRequests(data || []);
    };

    fetchRequests();
    
    // Subscribe to new requests
    const channel = supabase.channel('requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_guest_requests' }, () => fetchRequests())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [isLive, sessionId]);

  const startLive = async () => {
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Veuillez donner un titre à votre direct.');
      return;
    }

    setLoading(true);
    try {
      // Create live session in DB
      const { data: sessionData, error } = await supabase
        .from('live_sessions')
        .insert({ host_id: session?.user?.id, title })
        .select()
        .single();
      
      if (error) throw error;
      setSessionId(sessionData.id);
      setIsLive(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      Alert.alert('Erreur', 'Impossible de démarrer le live');
    }
  };

  const acceptGuest = async (request: any) => {
    await supabase.from('live_guest_requests').update({ status: 'accepted' }).eq('id', request.id);
    setCurrentGuest(request.profiles.username);
    setGuestRequests(prev => prev.filter(r => r.id !== request.id));
  };

  if (!isLive) {
    return (
      <View style={styles.container} className="bg-zinc-950">
        <SafeAreaView className="flex-1">
          <Text className="text-white text-2xl font-bold text-center mt-10">Lancer votre LIVE</Text>
          {device && hasPermission ? (
            <VisionCamera style={StyleSheet.absoluteFill} device={device} isActive={true} />
          ) : (
             <View className="w-full h-80 bg-zinc-900 items-center justify-center">
                <Text className="text-white">Caméra non disponible</Text>
             </View>
          )}
          <TextInput
               className="mx-5 bg-black/50 border border-white/10 rounded-xl p-4 text-white text-lg mt-10"
               placeholder="Titre du live..."
               placeholderTextColor="#a1a1aa"
               value={title}
               onChangeText={setTitle}
             />
          <TouchableOpacity 
               className="mx-5 bg-[#FE2C55] rounded-xl py-4 mt-5 items-center"
               onPress={startLive}
             >
                <Text className="text-white font-bold text-lg">DÉMARRER</Text>
             </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container} className="bg-black">
      {/* Live UI */}
      {device && hasPermission && <VisionCamera style={StyleSheet.absoluteFill} device={device} isActive={true} />}
      
      {currentGuest && (
        <View className="absolute top-20 right-5 w-24 h-32 bg-zinc-800 rounded-lg border-2 border-white items-center justify-center">
           <Text className="text-white font-bold">INVITÉ</Text>
           <Text className="text-white text-xs">@{currentGuest}</Text>
        </View>
      )}

      <SafeAreaView className="flex-1 justify-between p-5">
        <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={() => { setIsLive(false); navigation.goBack(); }} className="bg-black/50 p-2 rounded-full">
               <X color="white" size={24} />
            </TouchableOpacity>
        </View>

        {/* Guest Requests UI */}
        {guestRequests.length > 0 && (
          <View className="bg-black/80 p-4 rounded-xl border border-white/10">
             <Text className="text-white font-bold mb-2">Demandes de participation</Text>
             {guestRequests.map(req => (
               <View key={req.id} className="flex-row items-center justify-between py-2 border-t border-white/5">
                 <Text className="text-white">@{req.profiles.username}</Text>
                 <TouchableOpacity className="bg-green-600 p-2 rounded-full" onPress={() => acceptGuest(req)}>
                   <Check color="white" size={16} />
                 </TouchableOpacity>
               </View>
             ))}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 } });
export default HostLiveScreen;
