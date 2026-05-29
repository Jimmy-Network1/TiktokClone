import React, { useState, useEffect, useRef } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';

const { height } = Dimensions.get('window');

interface FeedScreenProps {
  isGuest?: boolean;
  session?: Session | null;
  route?: any;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ isGuest = false, session = null, route }) => {
  const [mode, setMode] = useState<FeedMode>('for_you');
  const { videos, loading, error, refresh } = useVideos(isGuest, mode, session?.user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);
  
  const initialVideoId = route?.params?.initialVideoId;

  useEffect(() => {
    if (initialVideoId && videos.length > 0) {
      const index = videos.findIndex(v => v.id === initialVideoId);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false });
        }, 100);
      }
    }
  }, [initialVideoId, videos]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#FE2C55" />
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
          <Text className="font-bold text-white">Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header Tabs */}
      {!isGuest && (
        <View className="absolute left-0 right-0 top-0 z-10 flex-row justify-center items-center pt-14 pb-4 bg-transparent">
          <TouchableOpacity onPress={() => setMode('following')} className="px-4">
            <Text className={`text-base font-bold ${mode === 'following' ? 'text-white' : 'text-zinc-500'}`}>
              Abonnements
            </Text>
            {mode === 'following' && <View className="h-0.5 w-6 bg-white self-center mt-1" />}
          </TouchableOpacity>
          <View className="w-0.5 h-3 bg-white/20" />
          <TouchableOpacity onPress={() => setMode('for_you')} className="px-4">
            <Text className={`text-base font-bold ${mode === 'for_you' ? 'text-white' : 'text-zinc-500'}`}>
              Pour toi
            </Text>
            {mode === 'for_you' && <View className="h-0.5 w-6 bg-white self-center mt-1" />}
          </TouchableOpacity>
        </View>
      )}

      {isGuest && (
        <View className="absolute left-0 right-0 top-0 z-10 flex-row justify-center items-center pt-14 bg-transparent">
           <Text className="text-white font-bold text-lg">Pour toi</Text>
           <View className="h-0.5 w-6 bg-white absolute bottom-[-6px] self-center" />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={videos}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 500);
        }}
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
              shares: '0',
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
