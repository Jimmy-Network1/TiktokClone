import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
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
  const [uploadProgress, setUploadProgress] = useState(0);
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
      videoQuality: 'medium', // Medium quality for better compression ratio
      selectionLimit: 1,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Erreur', result.errorMessage || 'Erreur lors de la sélection');
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
        Alert.alert('Fichier trop volumineux', 'La limite est de 50 Mo.');
        return;
      }
      setVideo(result);
    }
  };

  const handleUpload = async () => {
    if (!video || !video.assets || video.assets.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner une vidéo');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const asset = video.assets[0];
      const extension = asset.uri.split('.').pop();
      const fileName = `${session?.user.id}-${Date.now()}.${extension}`;
      const filePath = `${session?.user.id}/${fileName}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 0.9 ? prev + 0.1 : prev));
      }, 500);

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, {
          uri: asset.uri,
          name: fileName,
          type: asset.type || 'video/mp4',
        } as any);

      clearInterval(progressInterval);
      setUploadProgress(1);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // 3. Save to Database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: session?.user.id,
          video_url: publicUrl,
          caption: caption.trim(),
          thumbnail_url: null, // Placeholder for future thumbnail generation logic
        });

      if (dbError) throw dbError;

      Alert.alert('Succès', 'Votre vidéo est en ligne !');
      setVideo(null);
      setCaption('');
      navigation.navigate('Home');
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Erreur', err.message || 'Échec du téléchargement. Vérifiez votre connexion.');
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
            className={`rounded-2xl p-5 items-center shadow-xl ${uploading ? 'bg-zinc-800' : 'bg-[#FE2C55]'}`}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <View className="w-full px-4">
                <View className="h-1 bg-white/20 rounded-full overflow-hidden mb-2">
                   <View style={{ width: `${uploadProgress * 100}%` }} className="h-full bg-[#2AF5FF]" />
                </View>
                <Text className="text-white font-bold text-center text-xs">Publication en cours... {Math.round(uploadProgress * 100)}%</Text>
              </View>
            ) : (
              <Text className="text-white font-bold text-lg">Publier la vibe</Text>
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
