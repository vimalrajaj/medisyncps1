/**
 * Supabase Connection Test
 * Simple test to verify Supabase connectivity
 */

import { supabase } from '../lib/supabase';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase Connection...');
  
  try {
    // Test 1: Check if client is initialized
    console.log('✅ Supabase client initialized:', !!supabase);
    
    // Test 2: Check environment variables
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    
    console.log('✅ Environment variables:');
    console.log('  - VITE_SUPABASE_URL:', supabaseUrl);
    console.log('  - VITE_SUPABASE_ANON_KEY:', supabaseKey ? '***PRESENT***' : '❌ MISSING');
    
    // Test 3: Simple health check
    console.log('🔍 Testing connection...');
    const { data, error } = await supabase?.auth?.getSession();
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Connection successful! Session data:', data);
    return { success: true, session: data };
    
  } catch (error) {
    console.error('❌ Connection test exception:', error);
    return { success: false, error: error.message };
  }
};

// Auto-run test in development
if (import.meta.env?.DEV) {
  console.log('🚀 Running Supabase connection test...');
  testSupabaseConnection().then(result => {
    if (result.success) {
      console.log('✅ Supabase connection test passed!');
    } else {
      console.error('❌ Supabase connection test failed:', result.error);
    }
  });
}