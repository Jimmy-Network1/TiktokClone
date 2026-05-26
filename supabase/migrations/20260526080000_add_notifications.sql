-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- The recipient
  type TEXT NOT NULL, -- 'like', 'comment', 'follow'
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- The sender
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE, -- Optional
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- Optional
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications." ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications." ON notifications
  FOR INSERT WITH CHECK (true); -- In a real app, you might want more restriction or use SECURITY DEFINER functions

CREATE POLICY "Users can update their own notifications (mark as read)." ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger function for likes
CREATE OR REPLACE FUNCTION public.handle_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  video_owner_id UUID;
BEGIN
  SELECT user_id INTO video_owner_id FROM public.videos WHERE id = NEW.video_id;
  
  -- Don't notify if the user likes their own video
  IF video_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, video_id)
    VALUES (video_owner_id, 'like', NEW.user_id, NEW.video_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for likes
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_like_notification();

-- Trigger function for comments
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  video_owner_id UUID;
BEGIN
  SELECT user_id INTO video_owner_id FROM public.videos WHERE id = NEW.video_id;
  
  -- Don't notify if the user comments on their own video
  IF video_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, video_id, comment_id)
    VALUES (video_owner_id, 'comment', NEW.user_id, NEW.video_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comments
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_comment_notification();

-- Trigger function for follows
CREATE OR REPLACE FUNCTION public.handle_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, actor_id)
  VALUES (NEW.following_id, 'follow', NEW.follower_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for follows
CREATE TRIGGER on_follow_created
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE PROCEDURE public.handle_follow_notification();
