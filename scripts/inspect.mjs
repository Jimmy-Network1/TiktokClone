import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rlfrpmdxzedlahrifujf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnJwbWR4emVkbGFocmlmdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTY0OTksImV4cCI6MjA5NDMzMjQ5OX0.Bsv_Tm1fUO9MNukNEOw2nlz32UL1auDlwtNPPCHHP7Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data: profiles, error: pErr } = await supabase
  .from('profiles')
  .select('id, username, full_name')
  .limit(20);
console.log('--- PROFILES ---');
console.log(pErr || profiles);

const { data: videos, error: vErr } = await supabase
  .from('videos')
  .select('id, caption, video_url, user_id')
  .limit(20);
console.log('--- VIDEOS ---');
console.log(vErr || videos);

const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
console.log('--- BUCKETS ---');
console.log(bErr || buckets);

const { data: files, error: fErr } = await supabase.storage
  .from('videos')
  .list('public', { limit: 20 });
console.log('--- FILES in videos/public ---');
console.log(fErr || files);
