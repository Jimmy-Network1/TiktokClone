-- Clean existing seed data to start fresh
DELETE FROM comment_likes;
DELETE FROM comments;
DELETE FROM likes;
DELETE FROM video_views;
DELETE FROM bookmarks;
DELETE FROM videos;

-- Remove profiles and auth users that were created by previous seed runs
DELETE FROM profiles WHERE id IN (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f'
);

DELETE FROM auth.users WHERE id IN (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f'
);

-- Insert premium auth users (which automatically populates profiles via the db trigger)
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES 
  (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 
    'dancer@g4.app', 
    '{"provider":"email","providers":["email"]}', 
    '{"username":"neon_dancer","full_name":"Elena Neon","avatar_url":"https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200"}', 
    now(), 
    now(), 
    'authenticated', 
    'authenticated'
  ),
  (
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 
    'skater@g4.app', 
    '{"provider":"email","providers":["email"]}', 
    '{"username":"skate_master","full_name":"Alex Skate","avatar_url":"https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200"}', 
    now(), 
    now(), 
    'authenticated', 
    'authenticated'
  ),
  (
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 
    'travel@g4.app', 
    '{"provider":"email","providers":["email"]}', 
    '{"username":"travel_guru","full_name":"Sophia Travel","avatar_url":"https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=200"}', 
    now(), 
    now(), 
    'authenticated', 
    'authenticated'
  );

-- Insert premium vertical videos into the database (valid hex UUIDs)
INSERT INTO videos (id, user_id, video_url, thumbnail_url, caption, created_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://images.pexels.com/photos/3532540/pexels-photo-3532540.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=400',
    'Neon vibes only! Danser toute la nuit dans ma bulle. #Neon #Dance #Vibes #G4',
    now() - interval '2 hours'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://images.pexels.com/photos/1651166/pexels-photo-1651166.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=400',
    'Nouvelle figure aujourd''hui ! Le skate c''est la vie. #Skate #Sport #Animation #Sunset',
    now() - interval '1 hour'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=400',
    'Briller meme dans le noir. Le pouvoir d''une etincelle. #Sparkler #Night #Art #Vibes',
    now()
  );

-- Pre-populate comments to test thread reply layout
INSERT INTO comments (id, video_id, user_id, content, created_at, parent_id)
VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'Incroyable cette chorégraphie ! 🔥 Tu danses depuis combien de temps ?',
    now() - interval '1 hour',
    NULL
  ),
  (
    'c1111111-1111-1111-1111-111111111112',
    '11111111-1111-1111-1111-111111111111',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    '@skate_master Merci beaucoup ! Ça fait maintenant 5 ans 😊',
    now() - interval '45 minutes',
    'c1111111-1111-1111-1111-111111111111'
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'Trop propre la figure ! 🛹 Le sunset derrière est magnifique.',
    now() - interval '30 minutes',
    NULL
  );

-- Pre-populate comment likes
INSERT INTO comment_likes (comment_id, user_id)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f'),
  ('c2222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');

-- Pre-populate video likes
INSERT INTO likes (video_id, user_id)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e'),
  ('11111111-1111-1111-1111-111111111111', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f'),
  ('22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');
