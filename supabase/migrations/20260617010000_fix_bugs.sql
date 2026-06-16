-- 1. Fix stories relationship with profiles
ALTER TABLE public.stories 
DROP CONSTRAINT IF EXISTS stories_user_id_fkey,
ADD CONSTRAINT stories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Fix infinite recursion in conversation_participants
-- First, drop the recursive policies
DROP POLICY IF EXISTS "Users can view participants of their conversations." ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON conversation_participants;

-- Create a security definer function to check participation without recursion
CREATE OR REPLACE FUNCTION public.check_is_participant(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-implement policies using the function
CREATE POLICY "Users can view participants of their conversations." 
ON conversation_participants FOR SELECT 
USING (public.check_is_participant(conversation_id));

CREATE POLICY "Users can add participants to their conversations"
ON conversation_participants FOR INSERT
WITH CHECK (
  auth.uid() = user_id -- Can add self
  OR 
  public.check_is_participant(conversation_id) -- Or is already a participant
);

-- 3. Fix recursion in conversations table as well
DROP POLICY IF EXISTS "Users can view conversations they are part of." ON conversations;
DROP POLICY IF EXISTS "Participants can update their conversations" ON conversations;

CREATE POLICY "Users can view conversations they are part of." 
ON conversations FOR SELECT 
USING (public.check_is_participant(id));

CREATE POLICY "Participants can update their conversations"
ON conversations FOR UPDATE
USING (public.check_is_participant(id));

-- 4. Fix recursion in messages
DROP POLICY IF EXISTS "Users can view messages in their conversations." ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations." ON messages;

CREATE POLICY "Users can view messages in their conversations."
ON messages FOR SELECT
USING (public.check_is_participant(conversation_id));

CREATE POLICY "Users can send messages to their conversations."
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  public.check_is_participant(conversation_id)
);
