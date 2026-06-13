-- Force Realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- Optimization: Ensure indexes for messaging
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Profile last_seen update trigger (Security Definer)
CREATE OR REPLACE FUNCTION update_profile_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET last_seen_at = NOW() WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_seen_at on message send
CREATE TRIGGER trigger_update_last_seen
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE PROCEDURE update_profile_last_seen();
