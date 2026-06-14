import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Send, ChevronLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface ChatScreenProps {}

const ChatScreen: React.FC<ChatScreenProps> = () => {
  const { session } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { conversationId, otherUser } = route.params;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();

    // 1. Mark messages as read when entering chat
    const markRead = async () => {
      if (session?.user) {
        await supabase.rpc('mark_messages_as_read', {
          conversation_uuid: conversationId,
          user_uuid: session.user.id
        });
      }
    };
    markRead();

    // 2. Subscribe to new messages and changes
    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: {
        presence: {
          key: session?.user?.id,
        },
      },
    });

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const receivedMessage = payload.new as Message;
            setMessages((prev) => {
              // Avoid duplicates if insert was local
              if (prev.some(m => m.id === receivedMessage.id)) return prev;
              return [...prev, receivedMessage];
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            
            // Mark as read if we are looking at the screen
            if (receivedMessage.sender_id !== session?.user?.id) {
               markRead();
            }
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages, session?.user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !session?.user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        content: messageContent,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-black"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 border-b border-white/10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <View className="flex-1 items-center mr-8">
          <Text className="text-white font-bold text-lg">@{otherUser.username}</Text>
          <Text className="text-zinc-500 text-xs">En ligne</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#FE2C55" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isMe = item.sender_id === session?.user?.id;
            return (
              <View className={`mb-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                <View
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    isMe ? 'bg-[#FE2C55] rounded-tr-none' : 'bg-zinc-800 rounded-tl-none'
                  }`}
                >
                  <Text className="text-white text-base">{item.content}</Text>
                  <Text className="text-white/50 text-[10px] mt-1 text-right">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Input */}
      <View className="flex-row items-center px-4 py-4 bg-black border-t border-white/10">
        <TextInput
          className="flex-1 bg-zinc-900 text-white rounded-full px-4 py-3 mr-3"
          placeholder="Envoyer un message..."
          placeholderTextColor="#71717a"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!newMessage.trim()}
          className={`p-3 rounded-full ${newMessage.trim() ? 'bg-[#FE2C55]' : 'bg-zinc-800'}`}
        >
          <Send color="white" size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
});

export default ChatScreen;
