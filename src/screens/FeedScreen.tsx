import React, { useState } from 'react';
import { View, FlatList, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import VideoItem from '../components/VideoItem';
import { useVideos } from '../hooks/useVideos';

const { height } = Dimensions.get('window');

const FeedScreen = () => {
  const { videos, loading, refresh } = useVideos();
  const [refreshing, setRefreshing] = useState(false);

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
      <FlatList
        data={videos}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
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
