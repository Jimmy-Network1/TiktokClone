ALTER TABLE public.live_messages
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS live_messages_session_id_created_at_idx
ON public.live_messages (session_id, created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'live_guest_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_guest_requests;
  END IF;
END $$;
