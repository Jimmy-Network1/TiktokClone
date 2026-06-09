-- =====================================================================
-- SEED : vidéos de test
-- À exécuter dans le SQL Editor du dashboard Supabase.
-- (S'exécute en tant qu'admin -> contourne la RLS, donc l'insert passe.)
--
-- Les vidéos sont rattachées à des profils EXISTANTS, car la table
-- `videos.user_id` référence `profiles.id` qui référence `auth.users`.
-- =====================================================================

insert into public.videos (user_id, video_url, thumbnail_url, caption)
values
  (
    '44fa8316-a804-4beb-a943-8b5b7c6dfed6', -- faouz
    'https://rlfrpmdxzedlahrifujf.supabase.co/storage/v1/object/public/videos/public/test-bigbuckbunny.mp4',
    null,
    'Big Buck Bunny - vidéo de test #demo'
  ),
  (
    '44fa8316-a804-4beb-a943-8b5b7c6dfed6', -- faouz
    'https://rlfrpmdxzedlahrifujf.supabase.co/storage/v1/object/public/videos/public/test-flower.mp4',
    null,
    'Une jolie fleur qui s''ouvre 🌸 #nature'
  ),
  (
    'c8c723d5-0dd8-448f-9982-1c1879c2b02d', -- NJIMOLUH
    'https://rlfrpmdxzedlahrifujf.supabase.co/storage/v1/object/public/videos/public/test-jellyfish.mp4',
    null,
    'Méduses hypnotiques 🪼 #ocean'
  );

-- Vérification
select id, caption, video_url, user_id, created_at
from public.videos
order by created_at desc;
