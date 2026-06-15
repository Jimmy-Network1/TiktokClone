# Guide des Fonctionnalités G4 📱

Ce document est votre feuille de route pour expliquer le projet **G4**. Chaque section indique la fonctionnalité et le fichier correspondant pour une navigation rapide lors de votre présentation.

---

## 1. Authentification
*   **Fonctionnalité** : Permet aux utilisateurs de créer un compte et de se connecter sans vérification d'e-mail contraignante.
*   **Fichiers clés** :
    *   `src/screens/AuthScreen.tsx` : Interface et logique de connexion/inscription.
    *   `src/context/AuthContext.tsx` : Gestion de l'état de session utilisateur.

## 2. Flux Vidéo (Le "Feed")
*   **Fonctionnalité** : Affichage dynamique des vidéos avec lecture automatique et mode démo en cas d'absence de connexion.
*   **Fichiers clés** :
    *   `src/screens/FeedScreen.tsx` : Le conteneur principal du flux.
    *   `src/components/VideoItem.tsx` : Le lecteur vidéo individuel (inclut l'animation du disque rotatif).
    *   `src/hooks/useVideos.ts` : Récupération des données depuis Supabase avec mode démo.

## 3. Social & Interactions
*   **Fonctionnalité** : "Liker", commenter et partager des vidéos.
*   **Fichiers clés** :
    *   `src/components/VideoItem.tsx` : Gestion des "Likes" avec retour haptique et animation de cœur.
    *   `src/screens/CommentsScreen.tsx` : Interface de gestion des commentaires.

## 4. Création de Contenu (Upload)
*   **Fonctionnalité** : Choix de vidéo, saisie de légende et publication vers Supabase.
*   **Fichiers clés** :
    *   `src/screens/UploadScreen.tsx` : Interface d'upload avec barre de progression de téléversement.

## 5. Fonctionnalité "Live"
*   **Fonctionnalité** : Simulation d'un flux en direct avec chat dynamique.
*   **Fichiers clés** :
    *   `src/screens/LiveScreen.tsx` : Interface Live avec simulation de cœurs flottants et chat.

## 6. Navigation
*   **Fonctionnalité** : Passage entre les différentes sections de l'application.
*   **Fichiers clés** :
    *   `src/navigation/RootNavigation.tsx` : Structure globale de la navigation (Tabs et Stack).

---


---

## 💡 Questions Pièges et Défenses Techniques (La "God-Mode" Defense)

Votre enseignant risque de vouloir tester vos connaissances. Préparez-vous avec ces arguments :

### 1. Sur la fonctionnalité "Live"
*   **Question** : "Est-ce un vrai Live ?"
*   **Défense** : "C'est une interface de simulation de Live haute fidélité. Elle démontre notre capacité à gérer le chat en temps réel et les animations synchronisées. Un vrai live professionnel demanderait une infrastructure type WebRTC ou RTMP, ce qui est hors périmètre pour une app de démonstration mobile, mais notre UI est prête à accueillir ce flux."

### 2. Sur la synchronisation des commentaires
*   **Question** : "Comment les commentaires apparaissent-ils sans recharger l'app ?"
*   **Défense** : "Nous utilisons Supabase Realtime avec des *Subscriptions*. Dès qu'un commentaire est inséré dans la base de données, il est poussé via WebSockets vers tous les clients connectés. C'est du vrai temps réel."

### 3. Sur la stabilité (les Crashs)
*   **Question** : "Que se passe-t-il si l'app rencontre une erreur inattendue ?"
*   **Défense** : "Nous avons implémenté un `ErrorBoundary` global. Au lieu de crash (écran blanc ou fermeture), l'app intercepte l'erreur, la logue, et propose à l'utilisateur de relancer l'interface proprement. C'est un standard industriel."

### 4. Sur le Passage à l'échelle (Scalabilité)
*   **Question** : "Si 1 million d'utilisateurs utilisent G4 en même temps, comment gérer ?"
*   **Défense** : "Le choix de Supabase/PostgreSQL est stratégique. Nous avons défini des index SQL sur nos tables principales (likes, commentaires) et utilisé les politiques RLS (Row Level Security) pour que chaque utilisateur n'interroge que ses propres données, garantissant des requêtes ultra-rapides."

### 5. Sur le renommage en G4
*   **Question** : "Pourquoi G4 ?"
*   **Défense** : "G4 est une identité forte, tournée vers la Génération 4. C'est plus qu'un clone, c'est une ré-imagination du contenu court avec une emphase sur la fluidité et le retour tactile (haptique) que les utilisateurs actuels exigent."

