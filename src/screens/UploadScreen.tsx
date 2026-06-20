import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import AuthWall from '../components/AuthWall';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../lib/config';

interface UploadScreenProps {}

const UploadScreen: React.FC<UploadScreenProps> = () => {
  const { session } = useAuth();
  const [video, setVideo] = useState<ImagePickerResponse | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [VideoComponent, setVideoComponent] = useState<any>(null);

  useEffect(() => {
    try {
      setVideoComponent(require('react-native-video').default);
    } catch (e) {
      console.warn('react-native-video not available in UploadScreen');
    }
  }, []);
  
  // Autocut configuration
  const [duration, setDuration] = useState(0);
  const [cutRange, setCutRange] = useState({ start: 0, end: 30 });
  const [selectedPortion, setSelectedPortion] = useState<'start' | 'middle' | 'end'>('start');
  
  const videoPlayerRef = useRef<any>(null);
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
      videoQuality: 'medium',
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
      // Reset duration and cut range on new selection
      setDuration(0);
      setCutRange({ start: 0, end: 30 });
      setSelectedPortion('start');
    }
  };

  const handleVideoLoad = (meta: { duration: number }) => {
    const videoDuration = meta.duration;
    setDuration(videoDuration);
    
    // Auto-calculate portions if video is longer than 30s
    if (videoDuration > 30) {
      handlePortionSelect('start', videoDuration);
    } else {
      setCutRange({ start: 0, end: videoDuration });
    }
  };

  const handlePortionSelect = (portion: 'start' | 'middle' | 'end', customDuration?: number) => {
    const activeDuration = customDuration || duration;
    setSelectedPortion(portion);
    
    if (activeDuration <= 30) return;

    if (portion === 'start') {
      setCutRange({ start: 0, end: 30 });
      videoPlayerRef.current?.seek(0);
    } else if (portion === 'middle') {
      const start = Math.max(0, (activeDuration - 30) / 2);
      setCutRange({ start, end: start + 30 });
      videoPlayerRef.current?.seek(start);
    } else if (portion === 'end') {
      const start = Math.max(0, activeDuration - 30);
      setCutRange({ start, end: activeDuration });
      videoPlayerRef.current?.seek(start);
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
      if (!asset.uri) {
        throw new Error('Le chemin de la vidéo est introuvable.');
      }

      // STEP: Pré-optimisation (Simulation de compression)
      // Dans une app de prod, on utiliserait react-native-video-helper ici
      setUploadProgress(0.1); 
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1500)); // Temps de compression simulé
      setUploadProgress(0.2);

      const extension = asset.uri.split('.').pop() || 'mp4';
      const fileName = `${session?.user.id}-${Date.now()}.${extension}`;
      const filePath = `${session?.user.id}/${fileName}`;

      // 1. Upload to Storage using XMLHttpRequest for real progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/videos/${filePath}`);
        
        xhr.setRequestHeader('Authorization', `Bearer ${session?.access_token}`);
        xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
        xhr.setRequestHeader('Content-Type', asset.type || 'video/mp4');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = event.loaded / event.total;
            setUploadProgress(percentage);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve();
          } else {
            reject(new Error(`Upload failed: Status ${xhr.status} - ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload.'));
        };

        fetch(asset.uri!)
          .then(res => res.blob())
          .then(blob => {
            xhr.send(blob);
          })
          .catch(err => {
            reject(err);
          });
      });

      setUploadProgress(1);

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // 3. Save to Database with Autocut metadata
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: session?.user.id,
          video_url: publicUrl,
          caption: caption.trim(),
          thumbnail_url: null,
          cut_start: duration > 30 ? cutRange.start : 0.0,
          cut_end: duration > 30 ? cutRange.end : duration,
        });

      if (dbError) throw dbError;

      Alert.alert('Succès', 'Votre vidéo est en ligne avec Autocut !');
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

  const selectedAsset = video?.assets?.[0];

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={styles.scrollContent} className="p-6">
          <Text className="text-3xl font-bold mb-6 text-white">Créer</Text>
          
          {selectedAsset && selectedAsset.uri ? (
            <View className="mb-6">
              {/* Live Preview Container */}
              <View className="w-full h-80 bg-zinc-950 rounded-3xl overflow-hidden relative border border-white/10">
                {VideoComponent && (
                  <VideoComponent
                    ref={videoPlayerRef}
                    source={{ uri: selectedAsset.uri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="contain"
                    repeat
                    muted
                    onLoad={handleVideoLoad}
                    onProgress={(data: any) => {
                      if (duration > 30 && data.currentTime >= cutRange.end) {
                        videoPlayerRef.current?.seek(cutRange.start);
                      }
                    }}
                  />
                )}
                
                {/* Reset video picker button */}
                <TouchableOpacity 
                  onPress={pickVideo}
                  className="absolute bottom-4 right-4 bg-black/60 px-4 py-2 rounded-full border border-white/20"
                >
                  <Text className="text-white text-xs font-bold">Changer</Text>
                </TouchableOpacity>
              </View>

              {/* Autocut UI Editor if video is longer than 30 seconds */}
              {duration > 30 ? (
                <View className="mt-4 bg-zinc-950 p-4 rounded-2xl border border-white/5">
                  <Text className="text-[#FE2C55] font-black text-xs uppercase tracking-widest">✂️ Autocut Actif</Text>
                  <Text className="text-zinc-400 text-xs mt-1">
                    Durée totale : {Math.round(duration)}s. Choisissez les 30s à conserver :
                  </Text>
                  
                  <View className="flex-row mt-3 space-x-2">
                    <TouchableOpacity
                      onPress={() => handlePortionSelect('start')}
                      className={`flex-1 py-2.5 rounded-full items-center ${selectedPortion === 'start' ? 'bg-[#FE2C55]' : 'bg-zinc-900 border border-white/10'}`}
                    >
                      <Text className="text-white text-xs font-bold">Début (0s - 30s)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handlePortionSelect('middle')}
                      className={`flex-1 py-2.5 rounded-full items-center ${selectedPortion === 'middle' ? 'bg-[#FE2C55]' : 'bg-zinc-900 border border-white/10'}`}
                    >
                      <Text className="text-white text-xs font-bold">Milieu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handlePortionSelect('end')}
                      className={`flex-1 py-2.5 rounded-full items-center ${selectedPortion === 'end' ? 'bg-[#FE2C55]' : 'bg-zinc-900 border border-white/10'}`}
                    >
                      <Text className="text-white text-xs font-bold">Fin</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View className="mt-4 bg-zinc-950 p-3 rounded-2xl border border-white/5 items-center">
                  <Text className="text-zinc-500 text-xs font-semibold">
                     Format idéal ({Math.round(duration)}s) — Prêt à publier
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity 
              className="w-full h-80 bg-zinc-950 border border-dashed border-white/20 rounded-3xl justify-center items-center mb-6"
              onPress={pickVideo}
            >
              <View className="items-center">
                <View className="bg-white/5 p-6 rounded-full mb-4">
                   <Text className="text-white text-4xl">+</Text>
                </View>
                <Text className="text-zinc-400 font-medium">Sélectionner une vidéo</Text>
                <Text className="text-zinc-600 text-xs mt-2">MP4, MOV jusqu'à 50 Mo</Text>
              </View>
            </TouchableOpacity>
          )}

          <TextInput
            className="bg-zinc-950 border border-white/10 rounded-2xl p-4 mb-6 h-28 text-white"
            placeholder="Légende de la publication..."
            placeholderTextColor="#71717a"
            multiline
            textAlignVertical="top"
            value={caption}
            onChangeText={setCaption}
          />

          <TouchableOpacity
            className={`rounded-full p-5 items-center shadow-xl ${uploading ? 'bg-zinc-800' : 'bg-[#FE2C55]'}`}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <View className="w-full px-4">
                <View className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
                   <View style={{ width: `${uploadProgress * 100}%` }} className="h-full bg-[#2AF5FF]" />
                </View>
                <Text className="text-white font-bold text-center text-xs">Publication en cours... {Math.round(uploadProgress * 100)}%</Text>
              </View>
            ) : (
              <Text className="text-white font-bold text-lg">Partager la vibe</Text>
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
