/**
 * Central configuration for the application.
 */

export const SUPABASE_URL = 'https://rlfrpmdxzedlahrifujf.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnJwbWR4emVkbGFocmlmdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTY0OTksImV4cCI6MjA5NDMzMjQ5OX0.Bsv_Tm1fUO9MNukNEOw2nlz32UL1auDlwtNPPCHHP7Q';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('sb_')) {
  console.warn(
    'Warning: Supabase keys are missing or seem to be placeholders. ' +
    'Please check your src/lib/config.ts or .env file.'
  );
}
