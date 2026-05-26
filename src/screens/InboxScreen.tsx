import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Heart, MessageCircle, UserPlus, ChevronRight } from 'lucide-react-native';

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

interface InboxScreenProps {
  session: Session | null;
}

const InboxScreen: React.FC<InboxScreenProps> = ({ session }) => {
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
      Alert.alert('Erreur', error.message || 'Impossible de charger les notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications(true);
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Mark as read in background
    if (!notification.is_read) {
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id)
        .then();
      
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }

    if (notification.type === 'follow') {
      navigation.navigate('PublicProfile', { userId: notification.actor.id });
    } else if (notification.video_id) {
      // In a more complex app, we'd navigate to a single video view or scroll to it.
      // For now, let's at least show something or navigate to comments if it's a comment.
      if (notification.type === 'comment') {
        navigation.navigate('Comments', { videoId: notification.video_id, session });
      } else {
        // For likes, maybe just go to profile for now or alert
        navigation.navigate('PublicProfile', { userId: notification.actor.id });
      }
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} color="#FE2C55" fill="#FE2C55" />;
      case 'comment':
        return <MessageCircle size={20} color="#25F4EE" fill="#25F4EE" />;
      case 'follow':
        return <UserPlus size={20} color="#fff" />;
      default:
        return null;
    }
  };

  const getMessage = (notification: NotificationItem) => {
    const name = notification.actor.username || 'Un utilisateur';
    switch (notification.type) {
      case 'like':
        return <Text><Text className="font-bold text-white">@{name}</Text> a aime votre video.</Text>;
      case 'comment':
        return <Text><Text className="font-bold text-white">@{name}</Text> a commente votre video.</Text>;
      case 'follow':
        return <Text><Text className="font-bold text-white">@{name}</Text> a commence a vous suivre.</Text>;
      default:
        return '';
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="border-b border-white/10 px-5 pb-4 pt-14">
        <Text className="text-2xl font-bold text-white">Activite</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />
        }
        contentContainerStyle={{ padding: 15, flexGrow: notifications.length === 0 ? 1 : 0 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center rounded-[28px] border border-white/10 bg-zinc-950 px-6 py-10">
            <Text className="text-xl font-bold text-white">Aucune activite</Text>
            <Text className="mt-2 text-center text-zinc-400">
              Les interactions avec vos videos et votre profil apparaitront ici.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleNotificationPress(item)}
            className={`mb-3 flex-row items-center rounded-2xl border border-white/5 bg-zinc-950 p-4 ${
              !item.is_read ? 'border-l-4 border-l-[#FE2C55]' : ''
            }`}
          >
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-white/5">
              {renderIcon(item.type)}
            </View>
            <View className="flex-1">
              <Text className="text-sm leading-5 text-zinc-300">
                {getMessage(item)}
              </Text>
              <Text className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <ChevronRight size={16} color="#3f3f46" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default InboxScreen;
