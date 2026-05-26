import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import AuthWall from '../components/AuthWall';

interface UploadScreenProps {
  session: Session | null;
}

const UploadScreen: React.FC<UploadScreenProps> = ({ session }) => {
  const [video, setVideo] = useState<ImagePickerResponse | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation<any>();

  if (!session) {
    return (
      <AuthWall
        title="Publication reservee"
        message="Creer un compte vous permet d'uploader vos videos, d'ajouter une legende et de publier dans votre feed."
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
      const fileName = `${Date.now()}-${asset.fileName}`;
      const filePath = `public/${fileName}`;

      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // 2. Prepare file data (Handling different platforms might need more logic)
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: asset.type || 'video/mp4',
      } as any);

      // 3. Upload to Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
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
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6 pt-12">
      <Text className="text-2xl font-bold mb-6">Nouvelle publication</Text>
      
      <TouchableOpacity 
        className="w-full h-64 bg-gray-100 rounded-2xl justify-center items-center mb-6 overflow-hidden"
        onPress={pickVideo}
      >
        {video?.assets ? (
          <View className="items-center">
            <Text className="text-green-500 font-bold">Vidéo sélectionnée</Text>
            <Text className="text-gray-500 text-xs">{video.assets[0].fileName}</Text>
          </View>
        ) : (
          <Text className="text-gray-400">Appuyez pour choisir une vidéo</Text>
        )}
      </TouchableOpacity>

      <TextInput
        className="border border-gray-200 rounded-xl p-4 mb-6 h-32 text-top"
        placeholder="Ajouter une légende..."
        multiline
        value={caption}
        onChangeText={setCaption}
      />

      <TouchableOpacity
        className={`rounded-xl p-4 items-center ${uploading ? 'bg-gray-400' : 'bg-black'}`}
        onPress={handleUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Publier</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default UploadScreen;
