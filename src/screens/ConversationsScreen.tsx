import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { ChevronLeft, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

interface Conversation {
  id: string;
  last_message_at: string;
  other_user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  last_message?: string;
}

interface ConversationsScreenProps {}

const ConversationsScreen: React.FC<ConversationsScreenProps> = () => {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!session?.user) return;

    try {
      // 1. Get conversations I'm part of
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', session.user.id);

      if (partError) throw partError;

      const conversationIds = participations.map(p => p.conversation_id);
      if (conversationIds.length === 0) {
        setConversations([]);
        return;
      }

      // 2. Get details of those conversations and the OTHER participant
      const { data: others, error: othersError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations (id, last_message_at),
          profiles:user_id (id, username, full_name, avatar_url)
        `)
        .in('conversation_id', conversationIds)
        .neq('user_id', session.user.id);

      if (othersError) throw othersError;

      // 3. Get last message for each conversation
      const convs = await Promise.all((others || []).map(async (item: any) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content')
          .eq('conversation_id', item.conversation_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: item.conversation_id,
          last_message_at: item.conversations.last_message_at,
          other_user: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
          last_message: lastMsg?.content,
        };
      }));

      setConversations(convs.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      ));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 border-b border-white/10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <View className="flex-1 items-center mr-8">
          <Text className="text-white font-bold text-lg">Messages</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#FE2C55" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-10 mt-20">
              <MessageCircle color="#3f3f46" size={64} />
              <Text className="text-white font-bold text-xl mt-6">Pas encore de messages</Text>
              <Text className="text-zinc-500 text-center mt-2">
                Commencez à discuter avec vos amis !
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Chat', { 
                conversationId: item.id, 
                otherUser: item.other_user 
              })}
              className="flex-row items-center px-5 py-4 border-b border-white/5"
            >
              <View className="h-14 w-14 rounded-full bg-zinc-800 items-center justify-center">
                 <Text className="text-white font-bold text-xl">
                    {item.other_user.username.charAt(0).toUpperCase()}
                 </Text>
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-white font-bold text-base">@{item.other_user.username}</Text>
                <Text className="text-zinc-500 text-sm mt-1" numberOfLines={1}>
                  {item.last_message || 'Nouvelle conversation'}
                </Text>
              </View>
              <Text className="text-zinc-600 text-[10px]">
                {new Date(item.last_message_at).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default ConversationsScreen;
