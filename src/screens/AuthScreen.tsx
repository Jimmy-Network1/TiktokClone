import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import Logo from '../components/Logo';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation<any>();

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir votre email et mot de passe.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Succès', 'Compte créé ! Connectez-vous.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={styles.scrollContent} className="p-8">
          {navigation.canGoBack() ? (
            <TouchableOpacity className="absolute left-6 top-2 z-10 p-2" onPress={() => navigation.goBack()}>
              <Text className="text-sm font-bold text-zinc-500">Annuler</Text>
            </TouchableOpacity>
          ) : null}

          <View className="items-center mb-12 mt-4">
             <Logo size="medium" />
             <Text className="text-zinc-500 mt-2 text-xs font-mono tracking-widest uppercase">G4 Network</Text>
          </View>
          
          <Text className="text-3xl font-black mb-2 text-white">
            {isSignUp ? 'Créer un compte' : 'Bon retour !'}
          </Text>
          <Text className="text-zinc-500 mb-10">
            {isSignUp ? 'Rejoignez la communauté G4 dès maintenant.' : 'Connectez-vous pour voir vos vibes.'}
          </Text>

          {isSignUp && (
            <View className="flex-row items-center rounded-2xl border border-white/10 bg-zinc-950 p-4 mb-4">
              <User color="#52525b" size={20} />
              <TextInput
                className="flex-1 text-white ml-3"
                placeholder="Nom d'utilisateur"
                placeholderTextColor="#71717a"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          )}

          <View className="flex-row items-center rounded-2xl border border-white/10 bg-zinc-950 p-4 mb-4">
            <Mail color="#52525b" size={20} />
            <TextInput
              className="flex-1 text-white ml-3"
              placeholder="Email"
              placeholderTextColor="#71717a"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="flex-row items-center rounded-2xl border border-white/10 bg-zinc-950 p-4 mb-8">
            <Lock color="#52525b" size={20} />
            <TextInput
              className="flex-1 text-white ml-3"
              placeholder="Mot de passe"
              placeholderTextColor="#71717a"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
               {showPassword ? <EyeOff color="#52525b" size={20} /> : <Eye color="#52525b" size={20} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`rounded-2xl p-5 items-center shadow-lg ${loading ? 'bg-zinc-800' : 'bg-[#FE2C55]'}`}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {isSignUp ? "S'inscrire" : 'Se connecter'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-8 items-center"
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text className="text-zinc-500">
              {isSignUp ? 'Déjà un compte ? ' : "Pas encore de compte ? "}
              <Text className="text-[#2AF5FF] font-bold">
                 {isSignUp ? 'Se connecter' : "S'inscrire"}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});

export default AuthScreen;
