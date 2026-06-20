import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, Dimensions, ActivityIndicator, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Play, ChevronLeft, Folder } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

const CollectionDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { collection } = route.params;
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          video:videos (
            id,
            caption,
            created_at,
            video_url,
            thumbnail_url,
            likes (id),
            comments (id),
            video_views (id)
          )
        `)
        .eq('collection_id', collection.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos((data || []).map((d: any) => d.video).filter(Boolean));
    } catch (err) {
      console.error('Error fetching collection videos:', err);
    } finally {
      setLoading(false);
    }
  }, [collection.id]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="px-5 py-4 flex-row items-center border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
           <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <View className="flex-row items-center">
           <Folder color="#FE2C55" size={20} className="mr-2" />
           <Text className="text-white text-xl font-bold">{collection.name}</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
           <ActivityIndicator color="#FE2C55" />
        </View>
      ) : (
        <FlatList
          data={videos}
          numColumns={3}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH * 1.4 }}
              className="border-[0.5px] border-black bg-zinc-900 overflow-hidden relative"
              onPress={() => navigation.navigate('HashtagFeed', { initialVideoId: item.id, mode: 'for_you' })}
            >
              {item.thumbnail_url ? (
                <Image source={{ uri: item.thumbnail_url }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                   <Play color="rgba(255,255,255,0.2)" size={40} />
                </View>
              )}
               <View className="absolute bottom-1 left-1 flex-row items-center">
                  <Play color="white" size={12} fill="white" />
                  <Text className="text-white text-[10px] font-bold ml-1">
                     {item.video_views?.length || 0}
                  </Text>
               </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="py-20 items-center">
               <Text className="text-zinc-500 font-medium">Aucune vidéo dans cette collection.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default CollectionDetailScreen;
