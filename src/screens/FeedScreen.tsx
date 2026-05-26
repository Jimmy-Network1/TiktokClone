import React, { useState } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import VideoItem from '../components/VideoItem';
import { FeedMode, useVideos } from '../hooks/useVideos';
import { useNavigation } from '@react-navigation/native';

const { height } = Dimensions.get('window');

interface FeedScreenProps {
  isGuest?: boolean;
  session?: Session | null;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ isGuest = false, session = null }) => {
  const [mode, setMode] = useState<FeedMode>('for_you');
  const { videos, loading, error, refresh } = useVideos(isGuest, mode, session?.user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error && videos.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-2xl font-bold text-white">Flux indisponible</Text>
        <Text className="mt-2 text-center text-zinc-400">{error}</Text>
        <TouchableOpacity
          className="mt-6 rounded-full bg-[#FE2C55] px-5 py-3"
          onPress={onRefresh}
        >
          <Text className="font-bold text-white">Reessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && videos.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-2xl font-bold text-white">
          {mode === 'following' ? 'Aucun abonnement actif' : 'Aucune video disponible'}
        </Text>
        <Text className="mt-2 text-center text-zinc-400">
          {mode === 'following'
            ? "Suivez des createurs pour remplir cet onglet avec leurs publications."
            : 'Le feed est vide pour le moment. Revenez apres de nouvelles publications.'}
        </Text>
        {mode === 'following' ? (
          <TouchableOpacity
            className="mt-6 rounded-full bg-[#FE2C55] px-5 py-3"
            onPress={() => navigation.navigate('Discover')}
          >
            <Text className="font-bold text-white">Decouvrir des createurs</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {!isGuest && session?.user ? (
        <View className="absolute left-0 right-0 top-0 z-10 items-center pt-12">
          <View className="flex-row rounded-full border border-white/15 bg-zinc-950/85 p-1">
            <TouchableOpacity
              className={`rounded-full px-5 py-2 ${mode === 'for_you' ? 'bg-white' : ''}`}
              onPress={() => setMode('for_you')}
            >
              <Text className={`text-xs font-bold ${mode === 'for_you' ? 'text-black' : 'text-white'}`}>
                Pour toi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`rounded-full px-5 py-2 ${mode === 'following' ? 'bg-white' : ''}`}
              onPress={() => setMode('following')}
            >
              <Text className={`text-xs font-bold ${mode === 'following' ? 'text-black' : 'text-white'}`}>
                Abonnements
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {isGuest ? (
        <View className="absolute left-0 right-0 top-0 z-10 px-4 pt-4">
          <View className="rounded-3xl border border-white/10 bg-zinc-950/90 px-4 py-3">
            <Text className="text-sm font-semibold text-white">Mode invite</Text>
            <Text className="mt-1 text-xs leading-5 text-zinc-300">
              Vous voyez uniquement une selection de videos publiques. Connectez-vous pour
              publier, acceder au profil et aux autres sections.
            </Text>
            <TouchableOpacity
              className="mt-3 self-start rounded-full bg-[#FE2C55] px-4 py-2"
              onPress={() => navigation.navigate('Auth')}
            >
              <Text className="text-xs font-bold text-white">Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <FlatList
        data={videos}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{ paddingTop: isGuest ? 88 : !isGuest && session?.user ? 76 : 0 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VideoItem 
            video={{
              id: item.id,
              url: item.video_url,
              userId: item.user_id,
              user: item.profiles?.username || 'anonymous',
              fullName: item.profiles?.full_name,
              description: item.caption,
              likes: item.likes || [],
              comments: item.comments || [],
              shares: '0', // Placeholder for now
            }} 
            session={session}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      />
    </View>
  );
};

export default FeedScreen;
