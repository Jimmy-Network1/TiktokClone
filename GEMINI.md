# Guide de Compilation G4 📱

Ce projet a été standardisé pour assurer que tous les membres de l'équipe puissent compiler sans erreurs.

## Prérequis
- **Node.js** : >= 22.11.0
- **Android SDK** : 34 (ou 35)
- **Min SDK** : 24
- **Target SDK** : 34

## Commandes à utiliser
- **Nettoyage complet** : `npm run god-mode`
- **Lancement Android** : `npm run android`
- **Lancement Metro** : `npx react-native start --reset-cache`

## Résolution des erreurs courantes
- **"G4 has not been registered"** : 
  1. Fermez le serveur Metro.
  2. Lancez `npm run android` pour réinstaller le binaire.
  3. Relancez Metro avec `npm start -- --reset-cache`.
- **"Invariant Violation: TurboModuleRegistry"** : Assurez-vous d'avoir bien fait le `npm install` et que le binaire natif a été recompilé.

## Sécurité
- Ne jamais ajouter de fichiers `.apk` sur Git.
- Utilisez le mode démo (Mock Videos) pour les tests sans connexion.
