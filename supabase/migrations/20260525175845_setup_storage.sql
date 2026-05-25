-- Create a new bucket for videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'videos' );

CREATE POLICY "Anyone can upload a video"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'videos' );

CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'videos' AND auth.uid() = owner );
