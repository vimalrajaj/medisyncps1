import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
    process.exit(1);
  }

  const supabase = createClient(url, anonKey);

  try {
    const { data, error } = await supabase.from('terminology_mappings').select('id').limit(1);

    if (error) {
      console.error('Supabase responded with an error:', error.message);
      process.exit(1);
    }

    console.log(`Supabase connection successful. Sample row count: ${data?.length ?? 0}`);
  } catch (err) {
    console.error('Unexpected error while querying Supabase:', err.message);
    process.exit(1);
  }
}

main();
