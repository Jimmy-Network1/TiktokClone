import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Radio, Send, UserPlus, Users, Video as VideoIcon, X } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { VideoView, useVideoPlayer, useEvent } from 'react-native-video';
import type { VideoPlayer } from 'react-native-video';

type LiveSession = {
  id: string;
  host_id: string;
  title: string;
  stream_url?: string | null;
  profiles?: {
    username?: string | null;
    avatar_url?: string | null;
  } | Array<{
    username?: string | null;
    avatar_url?: string | null;
  }> | null;
};

const getHostProfile = (live?: LiveSession | null) => {
  const profile = Array.isArray(live?.profiles) ? live?.profiles[0] : live?.profiles;
  return {
    username: profile?.username || 'G4_Live',
    avatarUrl: profile?.avatar_url || null,
  };
};

const LiveScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const initialSessionId = route.params?.sessionId as string | undefined;

  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [selectedLive, setSelectedLive] = useState<LiveSession | null>(null);
  const [loadingLives, setLoadingLives] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [guestRequestStatus, setGuestRequestStatus] = useState<string | null>(null);
  const heartScale = useSharedValue(1);

  const activeSessionId = selectedLive?.id || initialSessionId || null;
  const hostProfile = useMemo(() => getHostProfile(selectedLive), [selectedLive]);

  const hasStreamUrl = !!selectedLive?.stream_url;

  const player = useVideoPlayer(
    hasStreamUrl ? { uri: selectedLive!.stream_url! } : { uri: '' },
    useCallback((player: VideoPlayer) => {
      player.loop = true;
      player.playInBackground = false;
      player.playWhenInactive = false;
    }, []),
  );

  useEvent(player, 'onLoad', () => {
    player.play();
  });

  const fetchLiveSessions = useCallback(async () => {
    setLoadingLives(true);
    try {
      let query = supabase
        .from('live_sessions')
        .select(`
          id,
          host_id,
          title,
          stream_url,
          profiles!live_sessions_host_id_fkey (username, avatar_url)
        `)
        .eq('is_active', true)
        .order('start_time', { ascending: false });

      if (initialSessionId) {
        query = query.eq('id', initialSessionId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const sessions = (data || []) as LiveSession[];
      setLiveSessions(sessions);

      if (initialSessionId) {
        setSelectedLive(sessions[0] || null);
      }
    } catch (error: any) {
      console.error('Live sessions error:', error);
      Alert.alert('Live indisponible', error.message || 'Impossible de charger les lives.');
    } finally {
      setLoadingLives(false);
    }
  }, [initialSessionId]);

  useEffect(() => {
    fetchLiveSessions();
  }, [fetchLiveSessions]);

  useEffect(() => {
    heartScale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      true,
    );
  }, [heartScale]);

  useEffect(() => {
    if (!activeSessionId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('live_messages')
        .select('*')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error) {
        setMessages(data || []);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`live-messages-${activeSessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_messages' }, (payload) => {
        const nextMessage = payload.new as any;
        if (nextMessage.session_id && nextMessage.session_id !== activeSessionId) return;
        setMessages(prev => [...prev, nextMessage].slice(-50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId || !session?.user) return;

    const fetchRequest = async () => {
      const { data } = await supabase
        .from('live_guest_requests')
        .select('status')
        .eq('session_id', activeSessionId)
        .eq('guest_id', session.user.id)
        .maybeSingle();

      setGuestRequestStatus(data?.status || null);
    };

    fetchRequest();

    const channel = supabase
      .channel(`live-guest-request-${activeSessionId}-${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_guest_requests' }, (payload) => {
        const row = (payload.new || payload.old) as any;
        if (row?.session_id === activeSessionId && row?.guest_id === session.user.id) {
          setGuestRequestStatus(row.status || null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId, session?.user]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const sendMessage = async () => {
    const cleanMessage = message.trim();
    if (!cleanMessage) return;
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }
    if (!activeSessionId) return;

    const { error } = await supabase
      .from('live_messages')
      .insert({
        content: cleanMessage,
        user_id: session.user.id,
        session_id: activeSessionId,
      });

    if (error) {
      Alert.alert('Message non envoyé', error.message);
      return;
    }

    setMessage('');
  };

  const requestToJoin = async () => {
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }
    if (!activeSessionId) return;

    const { error } = await supabase
      .from('live_guest_requests')
      .upsert(
        {
          session_id: activeSessionId,
          guest_id: session.user.id,
          status: 'pending',
        },
        { onConflict: 'session_id,guest_id' },
      );

    if (error) {
      Alert.alert('Demande impossible', error.message);
      return;
    }

    setGuestRequestStatus('pending');
    Alert.alert('Demande envoyee', "L'hote peut maintenant vous accepter.");
  };

  const renderLiveSession = ({ item }: { item: LiveSession }) => {
    const profile = getHostProfile(item);

    return (
      <TouchableOpacity
        className="mx-4 mb-3 rounded-2xl border border-white/10 bg-zinc-950 p-4"
        activeOpacity={0.85}
        onPress={() => setSelectedLive(item)}
      >
        <View className="flex-row items-center">
          <View className="h-12 w-12 rounded-full bg-[#FE2C55]/20 items-center justify-center border border-[#FE2C55]/40">
            <Radio color="#FE2C55" size={22} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-white font-bold text-base" numberOfLines={1}>{item.title}</Text>
            <Text className="text-zinc-400 text-xs mt-1" numberOfLines={1}>@{profile.username} est en direct</Text>
          </View>
          <View className="bg-[#FE2C55] px-2 py-1 rounded">
            <Text className="text-white text-[10px] font-black">LIVE</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!selectedLive) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-white text-2xl font-black">Lives</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} className="bg-zinc-900 p-2 rounded-full">
            <X color="white" size={22} />
          </TouchableOpacity>
        </View>

        {loadingLives ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#2AF5FF" />
            <Text className="text-zinc-500 mt-3 text-xs">Chargement des directs...</Text>
          </View>
        ) : (
          <FlatList
            data={liveSessions}
            keyExtractor={(item) => item.id}
            renderItem={renderLiveSession}
            ListEmptyComponent={
              <View className="items-center justify-center px-8 mt-24">
                <VideoIcon color="#52525b" size={42} />
                <Text className="text-white font-bold text-lg mt-4 text-center">Aucun live actif</Text>
                <Text className="text-zinc-500 text-center mt-2">Lancez un live depuis votre compte pour tester la camera, le chat et les demandes d'invite.</Text>
              </View>
            }
            ListFooterComponent={
              <TouchableOpacity
                className="mx-4 mt-4 bg-[#FE2C55] rounded-full p-4 items-center"
                onPress={() => navigation.navigate(session?.user ? 'HostLive' : 'Auth')}
              >
                <Text className="text-white font-bold">Lancer un live</Text>
              </TouchableOpacity>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {hasStreamUrl ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-zinc-950 px-8">
          <View className="h-24 w-24 rounded-full bg-[#FE2C55]/20 items-center justify-center border border-[#FE2C55]/40">
            <Text className="text-white text-3xl font-black">{hostProfile.username.charAt(0).toUpperCase()}</Text>
          </View>
          <Text className="text-white font-black text-xl mt-5 text-center">{selectedLive.title}</Text>
          <Text className="text-zinc-400 text-center mt-3">
            Session live active. Branchez un service WebRTC/Mux et renseignez `stream_url` pour afficher la video distante.
          </Text>
        </View>
      )}

      <SafeAreaView className="flex-1 px-4 justify-between">
        <View className="flex-row justify-between items-center mt-4">
          <View className="flex-row items-center bg-black/50 p-1 rounded-full pr-4 border border-white/10">
            <View className="h-8 w-8 rounded-full bg-zinc-800 border border-[#FE2C55] items-center justify-center">
              <Text className="text-white text-xs font-bold">{hostProfile.username.charAt(0).toUpperCase()}</Text>
            </View>
            <View className="ml-2">
              <Text className="text-white text-[10px] font-bold">LIVE @{hostProfile.username}</Text>
              <Text className="text-zinc-400 text-[8px]">En direct</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} className="bg-black/50 p-2 rounded-full">
            <X color="white" size={24} />
          </TouchableOpacity>
        </View>

        <View className="absolute right-4 bottom-36 items-center">
          <Animated.View style={heartStyle}>
            <TouchableOpacity className="bg-black/30 p-2 rounded-full border border-white/10">
              <Heart color="#FE2C55" size={42} fill="#FE2C55" />
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity className="bg-black/40 p-3 rounded-full border border-white/10 mt-4" onPress={requestToJoin}>
            <UserPlus color={guestRequestStatus === 'accepted' ? '#22c55e' : 'white'} size={24} />
          </TouchableOpacity>
          {guestRequestStatus ? (
            <Text className="text-white text-[10px] mt-1 font-bold">{guestRequestStatus}</Text>
          ) : null}
        </View>

        <View className="mb-6">
          <View className="h-44 w-72 mb-4">
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="bg-black/35 self-start p-2 rounded-lg mb-2 flex-row max-w-72">
                  <Text className="text-[#2AF5FF] font-bold text-xs">@{item.user_id?.slice(0, 5) || 'user'}: </Text>
                  <Text className="text-white text-xs flex-shrink">{item.content}</Text>
                </View>
              )}
            />
          </View>

          <View className="flex-row items-center space-x-3">
            <View className="flex-1 bg-black/50 rounded-full px-4 py-2 flex-row items-center border border-white/10">
              <TextInput
                placeholder="Commenter..."
                placeholderTextColor="#a1a1aa"
                className="flex-1 text-white text-sm"
                value={message}
                onChangeText={setMessage}
                onSubmitEditing={sendMessage}
              />
            </View>
            <TouchableOpacity className="bg-zinc-800 p-3 rounded-full">
              <Users color="white" size={20} />
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#FE2C55] p-3 rounded-full" onPress={sendMessage}>
              <Send color="white" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default LiveScreen;
