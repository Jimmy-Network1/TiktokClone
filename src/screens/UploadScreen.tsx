import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import AuthWall from '../components/AuthWall';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';

interface UploadScreenProps {}

const UploadScreen: React.FC<UploadScreenProps> = () => {
  const { session } = useAuth();
  const [video, setVideo] = useState<ImagePickerResponse | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation<any>();

  if (!session) {
    return (
      <AuthWall
        title="Publication réservée"
        message="Créer un compte vous permet d'uploader vos vidéos, d'ajouter une légende et de publier dans votre feed."
        onPress={() => navigation.navigate('Auth')}
      />
    );
  }

  const pickVideo = async () => {
    const result = await launchImageLibrary({
      mediaType: 'video',
      videoQuality: 'high',
    });

    if (result.assets && result.assets.length > 0) {
      setVideo(result);
    }
  };

  const handleUpload = async () => {
    if (!video || !video.assets || video.assets.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner une vidéo');
      return;
    }

    setUploading(true);
    try {
      const asset = video.assets[0];
      const fileName = `${Date.now()}-${asset.fileName || 'video.mp4'}`;
      const filePath = `public/${fileName}`;

      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // 2. Prepare file data
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: asset.type || 'video/mp4',
      } as any);

      // 3. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, formData);

      if (uploadError) throw uploadError;

      // 4. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // 5. Save to Database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          caption: caption,
        });

      if (dbError) throw dbError;

      Alert.alert('Succès', 'Vidéo publiée !');
      navigation.navigate('Home');
      setVideo(null);
      setCaption('');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Le téléchargement a échoué.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={styles.scrollContent} className="p-6">
          <Text className="text-3xl font-bold mb-8 text-white">Nouvelle publication</Text>
          
          <TouchableOpacity 
            className="w-full h-80 bg-zinc-950 border border-dashed border-white/20 rounded-3xl justify-center items-center mb-8 overflow-hidden"
            onPress={pickVideo}
          >
            {video?.assets ? (
              <View className="items-center px-4">
                <View className="bg-green-500/10 p-4 rounded-full mb-3">
                   <Text className="text-green-500 text-lg">✓</Text>
                </View>
                <Text className="text-green-500 font-bold text-center">Vidéo sélectionnée</Text>
                <Text className="text-zinc-500 text-xs mt-1 text-center" numberOfLines={1}>
                  {video.assets[0].fileName || 'vidéo sélectionnée'}
                </Text>
              </View>
            ) : (
              <View className="items-center">
                <View className="bg-white/5 p-6 rounded-full mb-4">
                   <Text className="text-white text-4xl">+</Text>
                </View>
                <Text className="text-zinc-400 font-medium">Appuyez pour choisir une vidéo</Text>
                <Text className="text-zinc-600 text-xs mt-2">MP4, MOV jusqu'à 50 Mo</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            className="bg-zinc-950 border border-white/10 rounded-2xl p-4 mb-8 h-32 text-white"
            placeholder="Ajouter une légende..."
            placeholderTextColor="#71717a"
            multiline
            textAlignVertical="top"
            value={caption}
            onChangeText={setCaption}
          />

          <TouchableOpacity
            className={`rounded-2xl p-5 items-center ${uploading ? 'bg-zinc-800' : 'bg-[#FE2C55]'}`}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Publier maintenant</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
});

export default UploadScreen;
