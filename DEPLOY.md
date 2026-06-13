<<<<<<< HEAD
# Guide de Déploiement G4 🚀
=======
# Guide de Déploiement TikTokClone 🚀
>>>>>>> miguel

Ce document résume les étapes pour passer de l'environnement de développement à la production.

## 1. Base de données (Supabase)
Assurez-vous d'avoir exécuté toutes les migrations :
- `supabase db push`

Vérifiez que les **Storage Buckets** suivants sont créés et en mode "Public" :
- `videos` : Pour les fichiers mp4.
- `avatars` : Pour les photos de profil.

## 2. Configuration Environnement
Le fichier `.env` doit contenir vos clés de production.
```
SUPABASE_URL=votre_url_de_production
SUPABASE_ANON_KEY=votre_cle_anon_de_production
```

## 3. Build Android (Production APK/AAB)
1. Générez le bundle :
   `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res`
2. Allez dans le dossier android :
   `cd android`
3. Créez l'APK de release :
   `./gradlew assembleRelease`
   *L'APK se trouvera dans `android/app/build/outputs/apk/release/app-release.apk`*

## 4. Points de contrôle avant publication
- [ ] L'upload compresse bien les vidéos.
- [ ] Le mode invité permet de voir le feed sans crash.
- [ ] Les notifications de likes fonctionnent.
- [ ] La messagerie temps réel est fluide.

---
**Note sur le Debug :** 
Pour débugger en temps réel, utilisez `npm run android` et secouez l'appareil (ou `Cmd+M`) pour ouvrir le menu de développement et activer "Debug with Chrome".
