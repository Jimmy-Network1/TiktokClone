import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Send, ChevronDown } from 'lucide-react-native';

interface CommentItem {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    full_name: string | null;
  } | null;
}

interface CommentsRouteParams {
  videoId: string;
  caption?: string;
  ownerUsername?: string;
  session: Session | null;
}

const CommentsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { videoId, caption, ownerUsername, session } = route.params as CommentsRouteParams;
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (username, full_name)
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalizedComments = ((data || []) as any[]).map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      }));

      setComments(normalizedComments);
    } catch (error: any) {
      console.error('Comments load error:', error);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || !session?.user) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from('comments').insert({
        video_id: videoId,
        user_id: session.user.id,
        content: trimmed,
      });

      if (error) throw error;

      setContent('');
      loadComments();
    } catch (error: any) {
      Alert.alert('Erreur', "Impossible d'envoyer le commentaire.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-zinc-950"
    >
      {/* Header */}
      <View className="items-center py-4 border-b border-white/5">
        <View className="w-10 h-1 bg-zinc-800 rounded-full mb-4" />
        <Text className="text-white font-bold text-sm">
           {comments.length} commentaires
        </Text>
        <TouchableOpacity 
          className="absolute right-5 top-4"
          onPress={() => navigation.goBack()}
        >
           <ChevronDown color="white" size={24} />
        </TouchableOpacity>
      </View>

      {loading && comments.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FE2C55" />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-zinc-500 font-medium">Soyez le premier à commenter.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="flex-row mb-6">
              <View className="h-9 w-9 rounded-full bg-zinc-800 items-center justify-center mr-3">
                 <Text className="text-white font-bold text-xs">
                    {(item.profiles?.username || 'U').charAt(0).toUpperCase()}
                 </Text>
              </View>
              <View className="flex-1">
                <Text className="text-zinc-500 text-xs font-bold mb-1">
                   @{item.profiles?.username || 'utilisateur'}
                </Text>
                <Text className="text-white text-sm leading-5">
                   {item.content}
                </Text>
                <Text className="text-zinc-600 text-[10px] mt-2 font-medium">
                   {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Input Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-zinc-950 border-t border-white/5 px-4 pt-3 pb-8 flex-row items-center">
        <View className="h-9 w-9 rounded-full bg-zinc-800 items-center justify-center mr-3">
           <Text className="text-white font-bold text-xs">
              {(session?.user?.email || 'U').charAt(0).toUpperCase()}
           </Text>
        </View>
        <View className="flex-1 bg-zinc-900 rounded-full px-4 py-2 flex-row items-center">
          <TextInput
            className="flex-1 text-white text-sm"
            placeholder="Ajouter un commentaire..."
            placeholderTextColor="#71717a"
            value={content}
            onChangeText={setContent}
            multiline
          />
          <TouchableOpacity 
            disabled={!content.trim() || submitting}
            onPress={handleSubmit}
            className="ml-2"
          >
            <Send 
              color={content.trim() ? '#FE2C55' : '#3f3f46'} 
              size={20} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CommentsScreen;
