-- Add autocut start and end fields to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS cut_start FLOAT DEFAULT 0.0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS cut_end FLOAT;
