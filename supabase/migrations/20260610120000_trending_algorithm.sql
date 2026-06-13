-- Create a view for trending videos based on like count
CREATE OR REPLACE VIEW trending_videos AS
SELECT 
  v.*,
  p.username,
  p.avatar_url,
  COUNT(l.id) as like_count
FROM videos v
LEFT JOIN profiles p ON v.user_id = p.id
LEFT JOIN likes l ON v.id = l.video_id
GROUP BY v.id, p.id
ORDER BY like_count DESC, v.created_at DESC
LIMIT 50;

-- Function to get personalized recommendations (basic: excluding viewed videos could be added later)
CREATE OR REPLACE FUNCTION get_recommended_videos(user_uuid UUID)
RETURNS SETOF videos AS $$
BEGIN
  RETURN QUERY
  SELECT v.*
  FROM videos v
  -- Simplified algorithm: Most liked videos first
  LEFT JOIN likes l ON v.id = l.video_id
  GROUP BY v.id
  ORDER BY COUNT(l.id) DESC, v.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
