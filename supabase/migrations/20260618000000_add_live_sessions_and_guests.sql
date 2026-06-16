-- Create live_sessions table to track active live streams
CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Optional: for future integration with streaming platforms
    stream_key TEXT UNIQUE,
    stream_url TEXT
);

-- RLS for live_sessions
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active live sessions
CREATE POLICY "Anyone can view active live sessions"
ON public.live_sessions FOR SELECT
USING (is_active = TRUE);

-- Host can create and update their own live sessions
CREATE POLICY "Host can manage their own live sessions"
ON public.live_sessions FOR ALL
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);


-- Create live_guest_requests table for "demander à monter" feature
CREATE TABLE IF NOT EXISTS public.live_guest_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
    guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    request_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    
    UNIQUE(session_id, guest_id) -- A user can only request once per session
);

-- RLS for live_guest_requests
ALTER TABLE public.live_guest_requests ENABLE ROW LEVEL SECURITY;

-- Host can view requests for their session
CREATE POLICY "Host can view guest requests for their session"
ON public.live_guest_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.live_sessions
    WHERE live_sessions.id = session_id AND live_sessions.host_id = auth.uid()
  )
);

-- Spectator can create requests
CREATE POLICY "Spectator can create guest requests"
ON public.live_guest_requests FOR INSERT
WITH CHECK (auth.uid() = guest_id);

-- Host can update request status (accept/reject)
CREATE POLICY "Host can update guest request status"
ON public.live_guest_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.live_sessions
    WHERE live_sessions.id = session_id AND live_sessions.host_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.live_sessions
    WHERE live_sessions.id = session_id AND live_sessions.host_id = auth.uid()
  )
);

-- Spectator can delete their own requests
CREATE POLICY "Spectator can delete their own guest requests"
ON public.live_guest_requests FOR DELETE
USING (auth.uid() = guest_id);
