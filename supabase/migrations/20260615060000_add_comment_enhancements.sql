-- Add parent_id to comments for reply threads
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- Enable RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Comment likes viewable by everyone" ON comment_likes;
DROP POLICY IF EXISTS "Users can toggle comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can remove their comment likes" ON comment_likes;

CREATE POLICY "Comment likes viewable by everyone" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can toggle comment likes" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their comment likes" ON comment_likes FOR DELETE USING (auth.uid() = user_id);
