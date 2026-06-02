-- Drop existing tables to ensure a clean state if they were partially created
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Create conversations table to group messages
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation_participants to link users to conversations
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies: only participants can see conversations
CREATE POLICY "Users can view conversations they are part of." 
ON conversations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Participants policies
CREATE POLICY "Users can view participants of their conversations." 
ON conversation_participants FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants AS internal 
    WHERE internal.conversation_id = conversation_participants.conversation_id 
    AND internal.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants."
ON conversation_participants FOR INSERT
WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations."
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations."
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = messages.conversation_id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Update last_message_at on conversations when a new message is inserted
CREATE OR REPLACE FUNCTION update_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE PROCEDURE update_last_message_at();
