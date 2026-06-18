import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import VideoItem from '../components/VideoItem';
import Stories from '../components/Stories';
import Logo from '../components/Logo';
import { FeedMode, useVideos } from '../hooks/useVideos';
import { useAuth } from '../hooks/useAuth';
import { Tv, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { VideoSkeleton } from '../components/Skeleton';
import ErrorBoundary from '../components/ErrorBoundary';

const { height } = Dimensions.get('window');

interface FeedScreenProps {
  route?: any;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ route }) => {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const isGuest = !session?.user;
  const initialMode = route?.params?.mode || 'for_you';
  const initialHashtag = route?.params?.hashtag;
  const initialVideoId = route?.params?.initialVideoId;
  const [mode, setMode] = useState<FeedMode>(initialMode);
  const { videos, loading, loadingMore, hasMore, error, refresh, loadMore } = useVideos(
    isGuest, 
    mode, 
    session?.user?.id,
    10, // Augmentation du pageSize pour plus de fluidité
    mode === 'hashtag' ? initialHashtag : undefined,
    initialVideoId
  );
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (initialVideoId && videos.length > 0) {
      const index = videos.findIndex(v => v.id === initialVideoId);
      if (index !== -1 && index !== activeIndex) {
        setActiveIndex(index);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false });
        }, 100);
      }
    } else if (activeIndex >= videos.length && videos.length > 0) {
      setActiveIndex(0);
    }
  }, [initialVideoId, videos, activeIndex]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const firstVisibleItem = viewableItems.find((item: any) => item.isViewable) || viewableItems[0];
      if (typeof firstVisibleItem.index === 'number') {
        setActiveIndex(firstVisibleItem.index);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  }).current;

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return <VideoSkeleton />;
  }

  return (
    <ErrorBoundary>
      <View className="flex-1 bg-black">
        {/* Header avec Logo et Tabs */}
        <View className="absolute left-0 right-0 top-0 z-10 pt-12 pb-2 bg-black/20">
          <View className="flex-row justify-between items-center px-4 mb-2">
            {navigation.canGoBack() ? (
              <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-black/40 rounded-full">
                <ChevronLeft color="white" size={24} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => navigation.navigate('Live')} className="p-1">
                 <View className="items-center">
                    <Tv color="#FE2C55" size={26} />
                    <Text className="text-[#FE2C55] text-[7px] font-black mt-[-4px]">LIVE</Text>
                 </View>
              </TouchableOpacity>
            )}

            <View className="flex-row items-center">
              {mode === 'hashtag' ? (
                <Text className="text-white font-bold text-lg">#{initialHashtag}</Text>
              ) : initialVideoId ? (
                <Text className="text-white font-bold text-lg">Vidéo</Text>
              ) : (
                <>
                  {!isGuest && (
                    <>
                      <TouchableOpacity onPress={() => setMode('following')} className="px-3">
                        <Text className={`text-base font-bold ${mode === 'following' ? 'text-white' : 'text-zinc-500'}`}>
                          Abonnements
                        </Text>
                      </TouchableOpacity>
                      <View className="w-[1px] h-3 bg-white/20" />
                    </>
                  )}
                  <TouchableOpacity onPress={() => setMode('for_you')} className="px-3">
                    <Text className={`text-base font-bold ${mode === 'for_you' ? 'text-white' : 'text-zinc-500'}`}>
                      Pour toi
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            <TouchableOpacity className="p-1" onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}>
               <Logo size="small" />
            </TouchableOpacity>
          </View>
          
          {/* Stories Horizontal Scroll */}
          {mode !== 'hashtag' && !initialVideoId && <Stories />}
        </View>

        <FlatList
          ref={flatListRef}
          data={videos}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
          keyExtractor={(item) => item.id}
          extraData={activeIndex}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
          onScrollToIndexFailed={({ index }) => {
            setTimeout(() => {
              flatListRef.current?.scrollToOffset({ offset: index * height, animated: false });
            }, 100);
          }}
          renderItem={({ item, index }) => (
            <VideoItem 
              video={item} 
              isActive={index === activeIndex}
              shouldPreload={Math.abs(index - activeIndex) <= 1}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      </View>
    </ErrorBoundary>
  );
};

export default FeedScreen;
