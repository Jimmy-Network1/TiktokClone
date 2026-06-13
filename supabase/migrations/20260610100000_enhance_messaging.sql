-- Add read_at and is_read to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Add updated_at to profiles for online status tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_uuid UUID, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages 
  SET read_at = NOW() 
  WHERE conversation_id = conversation_uuid 
  AND sender_id != user_uuid 
  AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
