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
import VideoItem from '../components/VideoItem';
import { useVideos } from '../hooks/useVideos';
import { useNavigation } from '@react-navigation/native';

const { height } = Dimensions.get('window');

interface FeedScreenProps {
  isGuest?: boolean;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ isGuest = false }) => {
  const { videos, loading, refresh } = useVideos(isGuest);
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

  return (
    <View className="flex-1 bg-black">
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
        contentContainerStyle={{ paddingTop: isGuest ? 88 : 0 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VideoItem 
            video={{
              id: item.id,
              url: item.video_url,
              user: item.profiles?.username || 'anonymous',
              description: item.caption,
              likes: item.likes?.[0]?.count?.toString() || '0',
              comments: item.comments?.[0]?.count?.toString() || '0',
              shares: '0', // Placeholder for now
            }} 
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
