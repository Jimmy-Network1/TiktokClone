import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rlfrpmdxzedlahrifujf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnJwbWR4emVkbGFocmlmdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTY0OTksImV4cCI6MjA5NDMzMjQ5OX0.Bsv_Tm1fUO9MNukNEOw2nlz32UL1auDlwtNPPCHHP7Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Several candidate sources per target (fallbacks if one 403s).
const TARGETS = [
  {
    dest: 'public/test-bigbuckbunny.mp4',
    sources: [
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    ],
  },
  {
    dest: 'public/test-flower.mp4',
    sources: [
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
    ],
  },
  {
    dest: 'public/test-jellyfish.mp4',
    sources: [
      'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_2MB.mp4',
      'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
    ],
  },
];

const results = [];

for (const target of TARGETS) {
  let bytes = null;
  for (const src of target.sources) {
    try {
      console.log('Trying download:', src);
      const r = await fetch(src);
      if (!r.ok) {
        console.log('  -> failed', r.status);
        continue;
      }
      bytes = new Uint8Array(await r.arrayBuffer());
      console.log('  -> OK bytes:', bytes.length);
      break;
    } catch (e) {
      console.log('  -> error', e.message);
    }
  }
  if (!bytes) {
    console.log('Skipping (no source worked):', target.dest);
    continue;
  }

  const { error } = await supabase.storage
    .from('videos')
    .upload(target.dest, bytes, { contentType: 'video/mp4', upsert: true });
  if (error) {
    console.log('Upload error for', target.dest, error.message);
    continue;
  }
  const { data: pub } = supabase.storage.from('videos').getPublicUrl(target.dest);
  console.log('Uploaded:', pub.publicUrl);
  results.push(pub.publicUrl);
}

console.log('\n=== PUBLIC URLS ===');
results.forEach(u => console.log(u));
