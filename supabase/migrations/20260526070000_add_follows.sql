-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone." ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow from own account." ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow from own account." ON follows FOR DELETE USING (auth.uid() = follower_id);
