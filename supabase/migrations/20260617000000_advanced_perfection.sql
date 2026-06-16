-- 1. Sécurité accrue pour les conversations
-- Seuls les participants peuvent ajouter des participants s'ils sont déjà dans la conversation (sauf pour la création initiale)
DROP POLICY IF EXISTS "Users can add participants." ON public.conversation_participants;
CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants FOR INSERT
WITH CHECK (
  auth.uid() = user_id -- On peut s'ajouter soi-même
  OR 
  EXISTS ( -- Ou on est déjà dedans et on ajoute quelqu'un
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conversation_participants.conversation_id
    AND user_id = auth.uid()
  )
);

-- 2. Algorithme Smart Feed V2 (Scoring pondéré)
-- On crée une vue qui calcule un score basé sur la récence et le nombre d'interactions
CREATE OR REPLACE VIEW smart_feed AS
SELECT 
    v.*,
    p.username,
    p.avatar_url,
    (
        COALESCE(like_counts.count, 0) * 10 + -- Poids fort pour les likes
        COALESCE(comment_counts.count, 0) * 5 + -- Poids moyen pour les commentaires
        EXTRACT(EPOCH FROM (v.created_at - '2026-01-01'::timestamp)) / 100000 -- Poids pour la récence
    ) as algorithmic_score
FROM videos v
LEFT JOIN profiles p ON v.user_id = p.id
LEFT JOIN (
    SELECT video_id, COUNT(*) as count FROM likes GROUP BY video_id
) like_counts ON v.id = like_counts.video_id
LEFT JOIN (
    SELECT video_id, COUNT(*) as count FROM comments GROUP BY video_id
) comment_counts ON v.id = comment_counts.video_id
ORDER BY algorithmic_score DESC;

-- Fonction pour récupérer le feed personnalisé via RPC
CREATE OR REPLACE FUNCTION get_smart_feed(user_uuid UUID, limit_val INT, offset_val INT)
RETURNS SETOF smart_feed AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM smart_feed
  LIMIT limit_val OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
