-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent crashes
DROP POLICY IF EXISTS "Bookmarks are viewable by everyone." ON bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks." ON bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks." ON bookmarks;

-- Bookmarks policies
CREATE POLICY "Bookmarks are viewable by everyone." ON bookmarks FOR SELECT USING (true);
CREATE POLICY "Users can insert their own bookmarks." ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks." ON bookmarks FOR DELETE USING (auth.uid() = user_id);
