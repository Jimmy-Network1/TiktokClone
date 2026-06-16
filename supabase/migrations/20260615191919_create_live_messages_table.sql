CREATE TABLE live_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE live_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by everyone." ON live_messages FOR SELECT USING (true);
CREATE POLICY "Users can post messages." ON live_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE live_messages;
