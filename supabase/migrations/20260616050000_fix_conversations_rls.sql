-- Policy INSERT : tout utilisateur authentifié peut créer une conversation
CREATE POLICY "Authenticated users can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy UPDATE : nécessaire pour le trigger update_last_message_at
CREATE POLICY "Participants can update their conversations"
ON conversations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);
