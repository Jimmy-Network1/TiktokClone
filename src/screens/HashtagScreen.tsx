import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Hash, Play } from 'lucide-react-native';
import { useVideos } from '../hooks/useVideos';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

const HashtagScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { hashtag } = route.params;

  const { videos, loading } = useVideos(false, 'hashtag', undefined, 30, hashtag);

  const renderVideoItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => {
          navigation.navigate('HashtagFeed', {
            mode: 'hashtag',
            hashtag: hashtag,
            initialVideoId: item.id,
          });
        }}
      >
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Play color="rgba(255,255,255,0.4)" size={30} />
          </View>
        )}
        <View style={styles.likesOverlay}>
          <Play color="white" size={10} style={{ marginRight: 4 }} />
          <Text style={styles.likesText}>{item.likes?.length || 0}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 border-b border-white/10 bg-zinc-950">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-2">
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">Hashtag</Text>
      </View>

      {/* Hashtag Info Banner */}
      <View className="p-6 flex-row items-center border-b border-white/5 bg-zinc-950/50">
        <View className="h-16 w-16 rounded-full bg-zinc-900 items-center justify-center border border-white/10 mr-4">
          <Hash color="#2AF5FF" size={30} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-black text-2xl">#{hashtag}</Text>
          <Text className="text-zinc-500 text-sm mt-1">{videos.length} vidéos associées</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#FE2C55" size="large" />
        </View>
      ) : videos.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Hash color="#52525b" size={60} />
          <Text className="text-zinc-500 text-lg font-bold mt-4">Aucune vidéo</Text>
          <Text className="text-zinc-600 text-sm mt-2 text-center">
            Soyez le premier à publier une vidéo avec le hashtag #{hashtag} !
          </Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 40,
  },
  gridItem: {
    width: COLUMN_WIDTH - 1,
    height: COLUMN_WIDTH * 1.4,
    margin: 0.5,
    backgroundColor: '#18181b',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
  },
  likesOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  likesText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default HashtagScreen;
