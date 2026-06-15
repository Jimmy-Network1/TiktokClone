-- Create video_views table
CREATE TABLE IF NOT EXISTS video_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Nullable for guest views
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Views are viewable by everyone" ON video_views;
DROP POLICY IF EXISTS "Anyone can insert views" ON video_views;

CREATE POLICY "Views are viewable by everyone" ON video_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert views" ON video_views FOR INSERT WITH CHECK (true);
