import { createClient } from '@supabase/supabase-js';

// Read from Vite's import.meta.env variables.
// These will be configured locally in a .env file and in Vercel's environment variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
