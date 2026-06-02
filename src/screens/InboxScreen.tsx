import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Heart, MessageCircle, UserPlus, Send } from 'lucide-react-native';


interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow';
  created_at: string;
  is_read: boolean;
  actor: {
    id: string;
    username: string | null;
    full_name: string | null;
  };
  video_id?: string;
}

interface InboxScreenProps {}

const InboxScreen: React.FC<InboxScreenProps> = () => {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async (isRefreshing = false) => {
    if (!session?.user) return;

    try {
      if (!isRefreshing) setLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          created_at,
          is_read,
          video_id,
          actor:actor_id (id, username, full_name)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map((item: any) => ({
        ...item,
        actor: Array.isArray(item.actor) ? item.actor[0] : item.actor,
      }));

      setNotifications(normalized);
    } catch (error: any) {
      console.error('Inbox load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationPress = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      supabase.from('notifications').update({ is_read: true }).eq('id', notification.id).then();
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    }

    if (notification.type === 'follow') {
      navigation.navigate('PublicProfile', { userId: notification.actor.id });
    } else if (notification.video_id) {
      if (notification.type === 'comment') {
        navigation.navigate('Comments', { videoId: notification.video_id });
      } else {
        navigation.navigate('Home', { initialVideoId: notification.video_id });
      }
    }
  };

  const getMessage = (notification: NotificationItem) => {
    switch (notification.type) {
      case 'like': return "a aimé votre vidéo.";
      case 'comment': return "a commenté votre vidéo.";
      case 'follow': return "a commencé à vous suivre.";
      default: return "";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={14} color="white" fill="#FE2C55" />;
      case 'comment': return <MessageCircle size={14} color="white" fill="#25F4EE" />;
      case 'follow': return <UserPlus size={14} color="white" />;
      default: return null;
    }
  };

  return (
    <View className="flex-1 bg-black">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-white/5">
        <View className="w-10" />
        <Text className="text-white font-bold text-base">Toute l'activité</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Conversations')}
          className="p-1"
        >
           <Send color="white" size={20} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FE2C55" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} tintColor="#fff" />
          }
          contentContainerStyle={[styles.listContent, notifications.length === 0 ? styles.emptyList : null]}
          className="py-2"
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-10">
              <View className="bg-zinc-900 p-6 rounded-full mb-6">
                 <MessageCircle color="#3f3f46" size={48} />
              </View>
              <Text className="text-white font-bold text-xl text-center">Aucune activité pour le moment</Text>
              <Text className="text-zinc-500 text-center mt-2">
                 Les notifications concernant vos likes, commentaires et abonnements apparaîtront ici.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleNotificationPress(item)}
              className="px-5 py-4 flex-row items-center"
            >
              <View className="relative">
                <View className="h-12 w-12 rounded-full bg-zinc-900 items-center justify-center border border-white/5">
                   <Text className="text-white font-bold text-lg">
                      {(item.actor.username || 'U').charAt(0).toUpperCase()}
                   </Text>
                </View>
                <View className="absolute -bottom-1 -right-1 bg-black rounded-full p-1">
                   {getIcon(item.type)}
                </View>
              </View>
              
              <View className="flex-1 ml-4">
                <Text className="text-white text-sm">
                   <Text className="font-bold">@{item.actor.username || 'utilisateur'}</Text> {getMessage(item)}
                </Text>
                <Text className="text-zinc-500 text-[10px] mt-1 uppercase font-medium">
                   {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              
              {!item.is_read && (
                <View className="h-2 w-2 bg-[#FE2C55] rounded-full ml-2" />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    // Other styles if needed
  },
  emptyList: {
    flexGrow: 1,
  },
});

export default InboxScreen;
