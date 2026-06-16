import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, SectionList, Text, TextInput, TouchableOpacity, View, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Search, TrendingUp, User, Hash, Play, X, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface DiscoverProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url?: string | null;
  bio: string | null;
}

interface DiscoverVideo {
  id: string;
  caption: string | null;
  user_id: string;
  thumbnail_url?: string | null;
  profiles: {
    username: string | null;
    avatar_url?: string | null;
  } | null;
  likes_count?: number;
}

const DiscoverScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'creators' | 'videos'>('all');
  
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<DiscoverVideo[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([
    { tag: 'G4NextGen', count: '1.2M' },
    { tag: 'TikTokClone', count: '850K' },
    { tag: 'Vibes2026', count: '420K' },
    { tag: 'CodingLife', count: '120K' },
  ]);

  const loadData = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const search = searchQuery.trim();
      
      if (!search) {
        // Mode Tendance (par défaut)
        const { data: vids } = await supabase
          .from('videos')
          .select('*, profiles(username, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(10);
        
        const { data: profs } = await supabase
          .from('profiles')
          .select('*')
          .limit(5);

        setTrendingVideos(vids as any || []);
        setProfiles(profs as any || []);
      } else {
        // Mode Recherche
        const { data: profs } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
          .limit(20);

        const { data: vids } = await supabase
          .from('videos')
          .select('*, profiles(username, avatar_url)')
          .ilike('caption', `%${search}%`)
          .limit(20);

        setProfiles(profs as any || []);
        setTrendingVideos(vids as any || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    loadData(debouncedQuery);
  }, [debouncedQuery, loadData]);

  const renderSearchBar = () => (
    <View className="px-5 pb-4 pt-4 bg-black">
      <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 py-3 border border-white/5">
        <Search color="#71717a" size={20} />
        <TextInput
          className="flex-1 ml-3 text-white text-base"
          placeholder="Rechercher sur G4..."
          placeholderTextColor="#71717a"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
             <X color="#71717a" size={18} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View className="flex-row px-5 border-b border-white/5 bg-black">
       {['all', 'creators', 'videos'].map((tab) => (
         <TouchableOpacity 
           key={tab}
           onPress={() => setActiveTab(tab as any)}
           className={`mr-8 pb-3 border-b-2 ${activeTab === tab ? 'border-[#FE2C55]' : 'border-transparent'}`}
         >
            <Text className={`font-bold ${activeTab === tab ? 'text-white' : 'text-zinc-500'}`}>
               {tab === 'all' ? 'Top' : tab === 'creators' ? 'Utilisateurs' : 'Vidéos'}
            </Text>
         </TouchableOpacity>
       ))}
    </View>
  );

  const renderHashtags = () => (
    <View className="mt-6 px-5">
       <View className="flex-row items-center mb-4">
          <TrendingUp color="#FE2C55" size={18} />
          <Text className="text-white font-bold text-lg ml-2">Hashtags du moment</Text>
       </View>
       <View className="flex-row flex-wrap">
          {hashtags.map((h, i) => (
            <TouchableOpacity 
              key={i}
              onPress={() => setQuery(h.tag)}
              className="bg-zinc-900 px-4 py-2 rounded-full mr-2 mb-3 border border-white/5"
            >
               <Text className="text-white font-medium text-sm">#{h.tag}</Text>
               <Text className="text-zinc-600 text-[9px] font-bold uppercase">{h.count} vues</Text>
            </TouchableOpacity>
          ))}
       </View>
    </View>
  );

  const renderCreatorItem = ({ item }: { item: DiscoverProfile }) => (
    <TouchableOpacity 
      className="flex-row items-center justify-between py-4 border-b border-white/5"
      onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}
    >
      <View className="flex-row items-center flex-1">
         <View className="h-12 w-12 rounded-full bg-zinc-800 items-center justify-center overflow-hidden border border-white/10">
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} className="h-full w-full" />
            ) : (
              <Text className="text-white font-bold">{(item.username || 'U').charAt(0).toUpperCase()}</Text>
            )}
         </View>
         <View className="ml-4">
            <Text className="text-white font-bold text-base">@{item.username}</Text>
            <Text className="text-zinc-500 text-xs">{item.full_name || 'G4 Creator'}</Text>
         </View>
      </View>
      <ChevronRight color="#3f3f46" size={20} />
    </TouchableOpacity>
  );

  const renderVideoItem = ({ item }: { item: DiscoverVideo }) => (
    <TouchableOpacity 
      style={{ width: (width - 50) / 2 }}
      className="mb-4 mr-2"
      onPress={() => navigation.navigate('HashtagFeed', { initialVideoId: item.id, mode: 'for_you' })}
    >
       <View className="h-60 bg-zinc-900 rounded-2xl overflow-hidden relative border border-white/5">
          {item.thumbnail_url ? (
            <Image source={{ uri: item.thumbnail_url }} className="h-full w-full" />
          ) : (
            <View className="flex-1 items-center justify-center">
               <Play color="rgba(255,255,255,0.1)" size={40} />
            </View>
          )}
          <View className="absolute bottom-2 left-2 flex-row items-center bg-black/40 px-2 py-1 rounded-md">
             <User color="white" size={10} />
             <Text className="text-white text-[10px] ml-1 font-bold">@{item.profiles?.username}</Text>
          </View>
       </View>
       <Text className="text-white text-xs mt-2 font-medium" numberOfLines={2}>{item.caption || 'Pas de description'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {renderSearchBar()}
      
      {debouncedQuery.length > 0 && renderTabs()}

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View className="pb-20">
            {/* 1. HASHTAGS (Only in "All" or when no search) */}
            {(activeTab === 'all' || !debouncedQuery) && renderHashtags()}

            {/* 2. CREATORS SECTION */}
            {(activeTab === 'all' || activeTab === 'creators') && (
              <View className="mt-8 px-5">
                <View className="flex-row items-center mb-4">
                  <User color="#2AF5FF" size={18} />
                  <Text className="text-white font-bold text-lg ml-2">Créateurs</Text>
                </View>
                {loading ? (
                   <ActivityIndicator color="#FE2C55" className="my-4" />
                ) : (
                  profiles.slice(0, activeTab === 'all' ? 3 : 20).map((p) => (
                    <View key={p.id}>{renderCreatorItem({ item: p })}</View>
                  ))
                )}
                {profiles.length === 0 && !loading && (
                   <Text className="text-zinc-600 text-sm italic">Aucun créateur trouvé.</Text>
                )}
              </View>
            )}

            {/* 3. VIDEOS SECTION */}
            {(activeTab === 'all' || activeTab === 'videos') && (
              <View className="mt-8 px-5">
                <View className="flex-row items-center mb-4">
                  <Hash color="#FE2C55" size={18} />
                  <Text className="text-white font-bold text-lg ml-2">Vidéos populaires</Text>
                </View>
                {loading ? (
                   <ActivityIndicator color="#FE2C55" className="my-4" />
                ) : (
                  <View className="flex-row flex-wrap">
                    {trendingVideos.map((v) => (
                       <View key={v.id}>{renderVideoItem({ item: v })}</View>
                    ))}
                  </View>
                )}
                {trendingVideos.length === 0 && !loading && (
                   <Text className="text-zinc-600 text-sm italic">Aucune vidéo trouvée.</Text>
                )}
              </View>
            )}
          </View>
        }
        refreshing={loading}
        onRefresh={() => loadData(debouncedQuery)}
      />
    </SafeAreaView>
  );
};

export default DiscoverScreen;
