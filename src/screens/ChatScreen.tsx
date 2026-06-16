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
import { Send, ChevronLeft, Check, CheckCheck } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
}

interface ChatScreenProps {}

const ChatScreen: React.FC<ChatScreenProps> = () => {
  const { session } = useAuth();
  const { sendNotification } = useNotifications();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { conversationId, otherUser } = route.params;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

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

  // Handle typing state broadcast
  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    // Broadcast typing = true
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: session?.user?.id, isTyping: text.length > 0 },
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: session?.user?.id, isTyping: false },
        });
      }
    }, 1500);
  };

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

    // 2. Subscribe to Presence and Changes
    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: {
        presence: {
          key: session?.user?.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      // Postgres Changes (Live insert/updates)
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
              if (prev.some(m => m.id === receivedMessage.id)) return prev;
              return [...prev, receivedMessage];
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            
            if (receivedMessage.sender_id !== session?.user?.id) {
               markRead();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as Message;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );
          }
        }
      )
      // Broadcast events (Typing indicator)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, isTyping } = payload.payload;
        if (userId !== session?.user?.id) {
          setIsOtherTyping(isTyping);
        }
      })
      // Presence Sync (Online Status)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineUsers = Object.keys(state);
        setIsOnline(onlineUsers.includes(otherUser.id));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, fetchMessages, session?.user, otherUser.id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !session?.user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Stop typing broadcast
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: session?.user?.id, isTyping: false },
      });
    }

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        content: messageContent,
      });

      if (error) throw error;

      // Notify the recipient
      sendNotification(otherUser.id, {
        type: 'message',
        title: 'Nouveau message !',
        message: `${session.user.email?.split('@')[0]}: ${messageContent}`,
        data: { conversationId, sender: session.user.id }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-black"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 border-b border-white/10 bg-zinc-950">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <View className="flex-1 items-center mr-8">
          <Text className="text-white font-bold text-lg">@{otherUser.username}</Text>
          <View className="flex-row items-center mt-0.5">
            <View className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-green-500' : 'bg-zinc-600'}`} />
            <Text className="text-zinc-500 text-xs">{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#FE2C55" />
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const isMe = item.sender_id === session?.user?.id;
              const isLastMessage = index === messages.length - 1;
              return (
                <View className={`mb-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <View
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      isMe ? 'bg-[#FE2C55] rounded-tr-none' : 'bg-zinc-800 rounded-tl-none'
                    }`}
                  >
                    <Text className="text-white text-base">{item.content}</Text>
                    <View className="flex-row items-center justify-end mt-1 space-x-1">
                      <Text className="text-white/50 text-[10px] mr-1">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      {isMe && (
                        item.read_at ? (
                          <CheckCheck color="#2AF5FF" size={12} />
                        ) : (
                          <Check color="#A1A1AA" size={12} />
                        )
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          
          {isOtherTyping && (
            <View className="px-5 py-2 flex-row items-center">
              <Text className="text-zinc-500 text-xs italic">@{otherUser.username} écrit...</Text>
            </View>
          )}
        </View>
      )}

      {/* Input */}
      <View className="flex-row items-center px-4 py-4 bg-zinc-950 border-t border-white/10">
        <TextInput
          className="flex-1 bg-zinc-900 text-white rounded-full px-4 py-3 mr-3"
          placeholder="Envoyer un message..."
          placeholderTextColor="#71717a"
          value={newMessage}
          onChangeText={handleTyping}
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
