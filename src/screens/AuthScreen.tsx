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

  const normalizeUsername = (value: string) => {
    return value
      .trim()
      .replace(/^@+/, '')
      .replace(/[^a-zA-Z0-9_.]/g, '_')
      .slice(0, 24);
  };

  const getFriendlyAuthError = (message: string) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('invalid login') || lowerMessage.includes('invalid credentials')) {
      return 'Email ou mot de passe incorrect.';
    }
    if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
      return 'Un compte existe déjà avec cet email.';
    }
    if (lowerMessage.includes('password')) {
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Connexion impossible. Vérifiez internet puis réessayez.';
    }
    return message || 'Une erreur est survenue.';
  };

  const ensureProfile = async (userId: string, userEmail?: string, preferredUsername?: string) => {
    const { data: existingOwnProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingOwnProfile) {
      return;
    }

    const fallbackUsername = userEmail?.split('@')[0] || `user_${userId.slice(0, 6)}`;
    const cleanUsername = normalizeUsername(preferredUsername || fallbackUsername);

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          username: cleanUsername,
          full_name: cleanUsername,
          avatar_url: null,
        },
        { onConflict: 'id' },
      );

    if (error) {
      console.warn('Profile upsert skipped:', error.message);
    }
  };

  async function handleAuth() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = normalizeUsername(username || normalizedEmail.split('@')[0] || '');

    if (!normalizedEmail || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir votre email et mot de passe.');
      return;
    }

    if (isSignUp && normalizedUsername.length < 3) {
      Alert.alert('Pseudo requis', 'Choisissez un pseudo simple avec au moins 3 caractères.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Utilisez au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', normalizedUsername)
          .maybeSingle();

        if (existingProfile) {
          Alert.alert('Pseudo indisponible', 'Ce pseudo est déjà utilisé. Essayez une variante.');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              username: normalizedUsername,
              full_name: normalizedUsername,
              avatar_url: null,
            },
          },
        });
        if (error) throw error;

        if (data.session?.user) {
          await ensureProfile(data.session.user.id, normalizedEmail, normalizedUsername);
          navigation.navigate('Main');
        } else {
          Alert.alert('Compte créé', 'Vérifiez votre email si Supabase demande une confirmation, puis connectez-vous.');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        if (data.user) {
          await ensureProfile(data.user.id, normalizedEmail);
        }
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Main');
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', getFriendlyAuthError(error.message));
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
        <ScrollView contentContainerStyle={styles.scrollContent} className="p-8" keyboardShouldPersistTaps="handled">
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
                placeholder="Pseudo"
                placeholderTextColor="#71717a"
                value={username}
                onChangeText={(value) => setUsername(normalizeUsername(value))}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
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
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
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
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={isSignUp ? 'new-password' : 'password'}
              textContentType={isSignUp ? 'newPassword' : 'password'}
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
                {isSignUp ? 'Créer le compte' : 'Se connecter'}
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
