import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { ChevronLeft, FolderPlus, Folder, Trash2, Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';

const CollectionsScreen = () => {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (err) {
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !session?.user) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          name: newCollectionName.trim(),
          user_id: session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      setCollections([data, ...collections]);
      setModalVisible(false);
      setNewCollectionName('');
      Alert.alert('Succès', 'Collection créée !');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de créer la collection.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer cette collection ? Les vidéos resteront dans vos favoris généraux.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            await supabase.from('collections').delete().eq('id', id);
            setCollections(collections.filter(c => c.id !== id));
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center justify-between border-b border-white/5">
        <View className="flex-row items-center">
           <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
              <ChevronLeft color="white" size={28} />
           </TouchableOpacity>
           <Text className="text-white text-xl font-bold">Mes Collections</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
           <FolderPlus color="#FE2C55" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
           <ActivityIndicator color="#FE2C55" />
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={item => item.id}
          className="px-5 pt-4"
          ListEmptyComponent={
            <View className="py-20 items-center">
               <Folder color="#27272a" size={80} />
               <Text className="text-zinc-500 mt-4 text-center">Organisez vos vidéos favorites dans des dossiers thématiques.</Text>
               <TouchableOpacity 
                 onPress={() => setModalVisible(true)}
                 className="mt-6 bg-zinc-900 px-6 py-3 rounded-full border border-white/10"
               >
                  <Text className="text-white font-bold">Créer ma première collection</Text>
               </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              className="flex-row items-center justify-between bg-zinc-950/50 p-4 rounded-2xl mb-3 border border-white/5"
              onPress={() => navigation.navigate('CollectionDetail', { collection: item })}
            >
               <View className="flex-row items-center flex-1">
                  <View className="bg-[#FE2C55]/10 p-3 rounded-xl mr-4">
                     <Folder color="#FE2C55" size={24} />
                  </View>
                  <View>
                     <Text className="text-white font-bold text-base">{item.name}</Text>
                     <Text className="text-zinc-500 text-xs mt-1">
                        Dossier privé
                     </Text>
                  </View>
               </View>
               <TouchableOpacity onPress={() => handleDeleteCollection(item.id)}>
                  <Trash2 color="#3f3f46" size={18} />
               </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* New Collection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/80 items-center justify-center px-8">
           <View className="bg-zinc-900 w-full rounded-3xl p-6 border border-white/10">
              <Text className="text-white text-xl font-bold mb-4">Nouvelle collection</Text>
              <TextInput
                className="bg-black border border-white/10 rounded-xl p-4 text-white mb-6"
                placeholder="Nom (ex: Recettes, Sport...)"
                placeholderTextColor="#52525b"
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                autoFocus
              />
              <View className="flex-row space-x-3">
                 <TouchableOpacity 
                   className="flex-1 bg-zinc-800 py-4 rounded-xl items-center"
                   onPress={() => setModalVisible(false)}
                 >
                    <Text className="text-white font-bold">Annuler</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   className="flex-1 bg-[#FE2C55] py-4 rounded-xl items-center"
                   onPress={handleCreateCollection}
                   disabled={creating || !newCollectionName.trim()}
                 >
                    {creating ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Créer</Text>}
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CollectionsScreen;
