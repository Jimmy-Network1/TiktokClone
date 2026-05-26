import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import AuthWall from '../components/AuthWall';

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

      if (error) {
        throw error;
      }

      const normalizedComments = ((data || []) as any[]).map(item => ({
        id: item.id,
        content: item.content,
        created_at: item.created_at,
        user_id: item.user_id,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] || null : item.profiles || null,
      }));

      setComments(normalizedComments);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de charger les commentaires.');
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('comments').insert({
        video_id: videoId,
        user_id: session.user.id,
        content: trimmed,
      });

      if (error) {
        throw error;
      }

      setContent('');
      await loadComments();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de publier ce commentaire.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) {
        throw error;
      }

      setComments(current => current.filter(comment => comment.id !== commentId));
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Suppression impossible.');
    }
  };

  if (!session) {
    return (
      <AuthWall
        title="Commentaires reserves"
        message="Connectez-vous pour participer a la conversation et reagir aux videos."
        onPress={() => navigation.navigate('Auth')}
      />
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="border-b border-white/10 px-5 pb-4 pt-14">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-sm font-bold text-zinc-400">Fermer</Text>
        </TouchableOpacity>
        <Text className="mt-4 text-2xl font-bold text-white">Commentaires</Text>
        {caption ? (
          <Text className="mt-2 text-sm leading-5 text-zinc-400">
            @{ownerUsername || 'createur'} - {caption}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, flexGrow: comments.length === 0 ? 1 : 0 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center rounded-[28px] border border-white/10 bg-zinc-950 px-6 py-10">
              <Text className="text-xl font-bold text-white">Aucun commentaire</Text>
              <Text className="mt-2 text-center text-zinc-400">
                Soyez le premier a lancer la discussion sur cette video.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const canDelete = item.user_id === session.user.id;
            return (
              <View className="mb-4 rounded-[24px] border border-white/10 bg-zinc-950 px-4 py-4">
                <View className="flex-row items-start justify-between">
                  <View className="mr-4 flex-1">
                    <Text className="text-sm font-bold text-white">
                      @{item.profiles?.username || item.profiles?.full_name || 'utilisateur'}
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-zinc-300">{item.content}</Text>
                  </View>
                  {canDelete ? (
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Text className="text-xs font-bold text-[#FE2C55]">Supprimer</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}

      <View className="border-t border-white/10 px-4 pb-8 pt-4">
        <View className="flex-row items-end rounded-[24px] border border-white/10 bg-zinc-950 px-4 py-3">
          <TextInput
            className="flex-1 pr-3 text-white"
            placeholder="Ecrire un commentaire..."
            placeholderTextColor="#71717a"
            multiline
            value={content}
            onChangeText={setContent}
          />
          <TouchableOpacity disabled={submitting || !content.trim()} onPress={handleSubmit}>
            <Text
              className={`font-bold ${submitting || !content.trim() ? 'text-zinc-600' : 'text-[#25F4EE]'}`}
            >
              Publier
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CommentsScreen;
