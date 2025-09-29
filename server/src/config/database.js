import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('terminology_mappings')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    return { success: true, message: 'Supabase connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};