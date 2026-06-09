# 📱 TikTok Clone - Documentation Technique Complète

Bienvenue dans le dépôt de **TikTok Clone**, une application mobile haute performance conçue pour reproduire l'expérience utilisateur de TikTok. Ce projet a été développé avec une attention particulière à la fluidité, à la scalabilité et à l'architecture moderne.

---

## 🚀 Pitch du Projet

"Miguel & El Sonk présentent un clone fonctionnel de TikTok. L'application permet aux utilisateurs de naviguer dans un flux vidéo infini, d'interagir avec le contenu (Likes, Commentaires) et de gérer leur identité sociale. L'objectif technique était de construire une application mobile robuste en utilisant les dernières technologies de développement cross-platform et de backend-as-a-service."

---

## 🛠️ Stack Technologique (Détails)

### ⚛️ Frontend : React Native & TypeScript
*   **React Native (v0.85)** : Choisi pour sa performance quasi-native et sa flexibilité.
*   **TypeScript (v5.8)** : Utilisé pour garantir un code typé, réduire les erreurs d'exécution et faciliter la collaboration.

### 🎨 Design & Styling : NativeWind (Tailwind CSS)
*   **NativeWind** : Permet d'utiliser les classes utilitaires de Tailwind CSS pour un design rapide, cohérent et hautement personnalisable.
*   **Lucide React Native** : Bibliothèque d'icônes vectorielles légères et élégantes.

### ⚡ Backend & Infrastructure : Supabase
*   **Authentification** : Gestion sécurisée des comptes utilisateurs via Supabase Auth.
*   **Base de Données (PostgreSQL)** : Stockage structuré pour les profils, vidéos, likes et commentaires.
*   **Stockage (Storage)** : Hébergement des fichiers vidéo volumineux sur des serveurs optimisés.
*   **Realtime** : Pour les futures fonctionnalités de chat et notifications en direct.

### 🎬 Multimédia : React Native Video
*   **Video Engine** : Lecture fluide, mise en cache et buffering optimisé pour le scrolling vertical.
*   **Reanimated (v4.3)** : Moteur d'animation fluide pour les interactions UI (comme le cœur de like).

---

## 📂 Architecture des Pages (Écrans)

L'application est découpée en plusieurs modules logiques :

### 1. 🏠 FeedScreen (Accueil)
*   **Fonction** : Flux vidéo principal.
*   **Technique** : Utilise une `FlatList` avec `pagingEnabled` pour un effet de "snap" (aimantation) entre les vidéos. Les vidéos se chargent dynamiquement via le hook `useVideos`.

### 2. 🔍 DiscoverScreen (Découvrir)
*   **Fonction** : Permet de trouver des amis et du contenu tendance.
*   **État actuel** : Structure de recherche prête pour l'intégration de l'exploration globale.

### 3. ➕ UploadScreen (Ajouter)
*   **Fonction** : Permet aux utilisateurs d'ajouter de nouvelles vidéos.
*   **Technique** : Intégration de `react-native-image-picker` pour sélectionner des médias depuis la galerie du téléphone.

### 4. 📥 InboxScreen (Boîte de réception)
*   **Fonction** : Centre de notifications et de messagerie.
*   **Technique** : Protection par authentification (redirection vers AuthScreen si non connecté).

### 5. 👤 ProfileScreen (Profil)
*   **Fonction** : Espace personnel de l'utilisateur.
*   **Technique** : Affiche les vidéos postées par l'utilisateur et permet d'accéder aux paramètres (EditProfile).

### 6. 🔐 AuthScreen (Authentification)
*   **Fonction** : Écran de connexion et d'inscription.
*   **Technique** : Formulaires optimisés avec gestion du clavier (`KeyboardAvoidingView`) et liaison directe avec Supabase Auth.

---

## 💎 Points Forts du Code

*   **Surgical Fixes** : Le code a été optimisé pour résoudre les problèmes d'écran blanc et de crash de navigation.
*   **Bundle Autonome** : L'APK générée inclut tout le JavaScript, permettant une utilisation sans serveur de développement.
*   **Gestion des Erreurs** : Intégration de timeouts et de messages d'erreur conviviaux pour la connexion Supabase.

---

## 🚀 Lancement Rapide pour les Camarades

```bash
# 1. Cloner le projet
git clone https://github.com/Jimmy-Network1/TiktokClone.git

# 2. Installer les dépendances
npm install

# 3. Lancer l'application
npm run android   # Pour Android
npm run ios       # Pour iOS (Mac requis)
```

---
*Projet finalisé et stabilisé - Version complète par Miguel & El Sonk*
