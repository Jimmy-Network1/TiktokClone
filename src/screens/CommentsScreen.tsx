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
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Send, ChevronDown, Heart } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

interface CommentItem {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string | null;
  profiles: {
    username: string | null;
    full_name: string | null;
  } | null;
  comment_likes?: { user_id: string }[];
  replies?: CommentItem[];
}

interface CommentsRouteParams {
  videoId: string;
}

const CommentsScreen = () => {
  const { session } = useAuth();
  const { sendNotification } = useNotifications();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { videoId } = route.params as CommentsRouteParams;
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);

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
          parent_id,
          profiles (username, full_name),
          comment_likes (user_id)
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const rawComments = ((data || []) as any[]).map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        comment_likes: item.comment_likes || [],
        replies: [],
      }));

      // Build hierarchy
      const commentMap: { [key: string]: CommentItem } = {};
      const rootComments: CommentItem[] = [];

      rawComments.forEach(comment => {
        commentMap[comment.id] = comment;
      });

      rawComments.forEach(comment => {
        if (comment.parent_id && commentMap[comment.parent_id]) {
          const parent = commentMap[comment.parent_id];
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        } else {
          rootComments.push(comment);
        }
      });

      // Sort root comments: newest first
      rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Sort replies: chronological
      rootComments.forEach(c => {
        if (c.replies) {
          c.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }
      });

      setComments(rootComments);
    } catch (error: any) {
      console.error('Comments load error:', error);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Real-time comments subscription
  useEffect(() => {
    const channel = supabase.channel(`comments:${videoId}`);
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `video_id=eq.${videoId}`,
        },
        async (payload) => {
          const newCommentRaw = payload.new;
          
          if (newCommentRaw.user_id === session?.user?.id) return;
          
          const { data: prof } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', newCommentRaw.user_id)
            .single();
            
          const completeComment: CommentItem = {
            id: newCommentRaw.id,
            content: newCommentRaw.content,
            created_at: newCommentRaw.created_at,
            user_id: newCommentRaw.user_id,
            parent_id: newCommentRaw.parent_id,
            profiles: {
              username: prof?.username || 'utilisateur',
              full_name: prof?.full_name || 'Utilisateur',
            },
            comment_likes: [],
            replies: [],
          };
          
          setComments(prev => {
            if (newCommentRaw.parent_id) {
              return prev.map(c => {
                if (c.id === newCommentRaw.parent_id) {
                  if (c.replies?.some(r => r.id === completeComment.id)) return c;
                  return {
                    ...c,
                    replies: [...(c.replies || []), completeComment]
                  };
                }
                return c;
              });
            } else {
              if (prev.some(c => c.id === completeComment.id)) return prev;
              return [completeComment, ...prev];
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId, session?.user?.id]);

  const handleLikeComment = async (commentId: string, parentId?: string | null) => {
    if (!session?.user) {
      navigation.navigate('Auth');
      return;
    }

    const currentUserId = session.user.id;
    
    let commentToToggle: CommentItem | undefined;
    if (parentId) {
      const parent = comments.find(c => c.id === parentId);
      commentToToggle = parent?.replies?.find(r => r.id === commentId);
    } else {
      commentToToggle = comments.find(c => c.id === commentId);
    }

    if (!commentToToggle) return;

    const likesList = commentToToggle.comment_likes || [];
    const isLiked = likesList.some(l => l.user_id === currentUserId);
    const prevLikes = likesList;

    const nextLikes = isLiked
      ? likesList.filter(l => l.user_id !== currentUserId)
      : [...likesList, { user_id: currentUserId }];

    const updateCommentsState = (list: CommentItem[]) => {
      return list.map(c => {
        if (c.id === commentId) {
          return { ...c, comment_likes: nextLikes };
        }
        if (c.id === parentId) {
          return {
            ...c,
            replies: (c.replies || []).map(r => r.id === commentId ? { ...r, comment_likes: nextLikes } : r)
          };
        }
        return c;
      });
    };

    setComments(prev => updateCommentsState(prev));

    try {
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId);
      } else {
        await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: currentUserId });
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      const rollbackCommentsState = (list: CommentItem[]) => {
        return list.map(c => {
          if (c.id === commentId) {
            return { ...c, comment_likes: prevLikes };
          }
          if (c.id === parentId) {
            return {
              ...c,
              replies: (c.replies || []).map(r => r.id === commentId ? { ...r, comment_likes: prevLikes } : r)
            };
          }
          return c;
        });
      };
      setComments(prev => rollbackCommentsState(prev));
    }
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || !session?.user) return;

    setContent('');
    setSubmitting(true);

    let profileInfo = { username: 'moi', full_name: 'Moi' };
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', session.user.id)
        .single();
      if (prof) {
        profileInfo = {
          username: prof.username || 'moi',
          full_name: prof.full_name || 'Moi'
        };
      }
    } catch (e) {
      console.warn('Could not fetch user profile for optimistic comment:', e);
    }

    const tempId = `temp-${Date.now()}`;
    const newComment: CommentItem = {
      id: tempId,
      content: trimmed,
      created_at: new Date().toISOString(),
      user_id: session.user.id,
      parent_id: replyingTo ? replyingTo.id : null,
      profiles: profileInfo,
      comment_likes: [],
      replies: [],
    };

    const parentId = replyingTo ? replyingTo.id : null;
    setReplyingTo(null);

    // Optimistic UI updates
    if (parentId) {
      setComments(prev => 
        prev.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment]
            };
          }
          return c;
        })
      );
    } else {
      setComments(prev => [newComment, ...prev]);
    }

    try {
      const { data, error: insertError } = await supabase
        .from('comments')
        .insert({
          video_id: videoId,
          user_id: session.user.id,
          content: trimmed,
          parent_id: parentId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Notify video owner
      try {
        const { data: videoData } = await supabase
          .from('videos')
          .select('user_id')
          .eq('id', videoId)
          .single();
        
        if (videoData) {
          sendNotification(videoData.user_id, {
            type: 'comment',
            title: 'Nouveau commentaire !',
            message: `${profileInfo.username} a commenté votre vidéo.`,
            data: { videoId }
          });
        }

        // Also notify parent comment owner if it's a reply
        if (replyingTo && replyingTo.user_id !== videoData?.user_id) {
          sendNotification(replyingTo.user_id, {
            type: 'comment',
            title: 'Nouvelle réponse !',
            message: `${profileInfo.username} a répondu à votre commentaire.`,
            data: { videoId, commentId: data.id }
          });
        }
      } catch (notifErr) {
        console.warn('Could not send comment notification:', notifErr);
      }

      // Replace tempId with actual DB comment
      if (parentId) {
        setComments(prev => 
          prev.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: (c.replies || []).map(r => r.id === tempId ? { ...r, id: data.id, created_at: data.created_at } : r)
              };
            }
            return c;
          })
        );
      } else {
        setComments(prev => 
          prev.map(c => c.id === tempId ? { ...c, id: data.id, created_at: data.created_at } : c)
        );
      }
    } catch (err) {
      console.error('Error inserting comment:', err);
      // Rollback
      if (parentId) {
        setComments(prev => 
          prev.map(c => c.id === parentId ? { ...c, replies: (c.replies || []).filter(r => r.id !== tempId) } : c)
        );
      } else {
        setComments(prev => prev.filter(c => c.id !== tempId));
      }
      Alert.alert('Erreur', "Impossible d'envoyer le commentaire.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCommentItem = (item: CommentItem, parentId?: string | null) => {
    const isLiked = session?.user && item.comment_likes?.some(l => l.user_id === session.user.id);
    const likeCount = item.comment_likes?.length || 0;

    return (
      <View className={`flex-row mb-5 ${parentId ? 'mt-3 pl-2' : ''}`}>
        {/* Avatar */}
        <View className="h-8 w-8 rounded-full bg-zinc-800 items-center justify-center mr-3">
           <Text className="text-white font-bold text-xs">
              {(item.profiles?.username || 'U').charAt(0).toUpperCase()}
           </Text>
        </View>

        {/* Content Area */}
        <View className="flex-1">
          <Text className="text-zinc-500 text-xs font-bold mb-1">
             @{item.profiles?.username || 'utilisateur'}
          </Text>
          <Text className="text-white text-sm leading-5">
             {item.content}
          </Text>
          <View className="flex-row items-center mt-2 space-x-4">
            <Text className="text-zinc-600 text-[10px] font-medium">
               {new Date(item.created_at).toLocaleDateString()}
            </Text>
            
            <TouchableOpacity onPress={() => setReplyingTo(parentId ? comments.find(c => c.id === parentId) || item : item)}>
               <Text className="text-zinc-400 text-xs font-bold">Répondre</Text>
            </TouchableOpacity>
          </View>

          {/* Render nested replies */}
          {!parentId && item.replies && item.replies.length > 0 && (
            <View className="mt-2 border-l border-zinc-800 pl-2">
              {item.replies.map(reply => (
                <View key={reply.id}>
                  {renderCommentItem(reply, item.id)}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Like Button */}
        <View className="items-center justify-center pl-2">
          <TouchableOpacity onPress={() => handleLikeComment(item.id, parentId)}>
            <Heart 
              color={isLiked ? '#FE2C55' : '#52525b'} 
              fill={isLiked ? '#FE2C55' : 'transparent'} 
              size={15} 
            />
          </TouchableOpacity>
          <Text className="text-zinc-500 text-[9px] mt-1 font-bold">
            {likeCount > 0 ? likeCount : ''}
          </Text>
        </View>
      </View>
    );
  };

  // Calculate total comment count (including replies)
  const totalCommentsCount = comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-zinc-950"
    >
      {/* Header */}
      <View className="items-center py-4 border-b border-white/5 bg-zinc-950">
        <View className="w-10 h-1 bg-zinc-800 rounded-full mb-4" />
        <Text className="text-white font-bold text-sm">
           {totalCommentsCount} commentaires
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
          contentContainerStyle={styles.listContent}
          className="px-4 pt-4 flex-1"
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-zinc-500 font-medium">Soyez le premier à commenter.</Text>
            </View>
          }
          renderItem={({ item }) => renderCommentItem(item)}
        />
      )}

      {/* Reply Banner */}
      {replyingTo && (
        <View className="bg-zinc-900/95 px-4 py-2.5 flex-row justify-between items-center border-t border-white/5">
          <Text className="text-zinc-400 text-xs font-semibold">
            En réponse à @{replyingTo.profiles?.username}
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Text className="text-[#FE2C55] text-xs font-bold">Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar */}
      <View className="bg-zinc-950 border-t border-white/5 px-4 pt-3 pb-8 flex-row items-center">
        <View className="h-9 w-9 rounded-full bg-zinc-800 items-center justify-center mr-3">
           <Text className="text-white font-bold text-xs">
              {(session?.user?.email || 'U').charAt(0).toUpperCase()}
           </Text>
        </View>
        <View className="flex-1 bg-zinc-900 rounded-full px-4 py-2 flex-row items-center">
          <TextInput
            className="flex-1 text-white text-sm"
            placeholder={replyingTo ? `Répondre à @${replyingTo.profiles?.username}...` : "Ajouter un commentaire..."}
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

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 150,
  },
});

export default CommentsScreen;
