# Documentation de l'Architecture - TikTokClone 📱

Ce document explique l'organisation du code et les responsabilités de chaque dossier pour faciliter la compréhension et la présentation du projet.

## 📁 Structure des Dossiers

### 1. `/src/navigation` : Le Cerveau du Flux
- **`RootNavigation.tsx`** : Définit la structure globale.
  - *Tabs* : Navigation principale (Accueil, Découvrir, Inbox, Profil).
  - *Stacks* : Écrans de détail (Chat, Commentaires, Profil Public).

### 2. `/src/screens` : Les Écrans Principaux
- **`FeedScreen.tsx`** : Le flux vertical infini (le cœur de l'app).
- **`DiscoverScreen.tsx`** : Le moteur de recherche et l'algorithme de recommandation.
- **`UploadScreen.tsx`** : Logique de sélection, compression et mise en ligne des vidéos.
- **`ChatScreen.tsx`** : Messagerie privée avec gestion du temps réel.
- **`EditProfileScreen.tsx`** : Modification des infos utilisateurs et photo de profil.

### 3. `/src/components` : Les Éléments Réutilisables
- **`VideoItem.tsx`** : Le composant le plus complexe. Il gère la lecture vidéo, les animations de "Like" (Reanimated), et les interactions sociales.
- **`AuthWall.tsx`** : Composant de protection qui incite à la connexion pour les actions restreintes.

### 4. `/src/hooks` : La Logique Métier (Non-visuelle)
- **`useAuth.ts`** : Gère la session utilisateur avec Supabase.
- **`useVideos.ts`** : Récupère les vidéos depuis la DB avec les filtres (Pour toi / Abonnements).

### 5. `/src/lib` : Configuration Services
- **`supabase.ts`** : Initialisation du client de base de données et du temps réel.

### 6. `/supabase/migrations` : L'Épine Dorsale (Backend)
- Chaque fichier `.sql` représente une étape de construction de la base de données (Tables, Sécurité RLS, Triggers, Algorithmes).

## 🛠️ Technologies Clés utilisées pour la démonstration
- **Moteur Vidéo** : `react-native-video` (Performance fluide).
- **Animations** : `react-native-reanimated` (60 FPS pour les cœurs et transitions).
- **Design** : `NativeWind` (Tailwind CSS) pour un code propre et maintenable.
- **Temps Réel** : `PostgreSQL Listen/Notify` via Supabase pour le Chat et les Notifications.

## 💡 Concept de l'Algorithme (À expliquer lors de la présentation)
L'algorithme de recommandation ne se contente pas de lister les vidéos ; il utilise une **Vue SQL** (`trending_videos`) qui calcule un score de popularité en fonction des interactions (Likes), simulant ainsi l'intelligence du "For You" de TikTok.
