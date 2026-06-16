-- Créer le bucket storage pour les stories
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques de stockage
CREATE POLICY "Stories are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'stories');

CREATE POLICY "Authenticated users can upload stories" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'stories' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own stories"
ON storage.objects FOR DELETE
USING (bucket_id = 'stories' AND auth.uid() = owner);

-- Créer la table stories
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    media_type VARCHAR(10) DEFAULT 'image' NOT NULL, -- 'image' ou 'video'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habiliter la sécurité au niveau des lignes (RLS) sur stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table stories
CREATE POLICY "Anyone can view stories" 
ON public.stories FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create stories" 
ON public.stories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" 
ON public.stories FOR DELETE 
USING (auth.uid() = user_id);
