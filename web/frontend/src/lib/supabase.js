/**
 * Supabase Client Configuration
 * 
 * This client is used to interact with the Supabase backend
 * for database operations, authentication, and storage.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient = null;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables!');
    console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.');
} else {
    try {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
    }
}

export const supabase = supabaseClient;
export default supabase;
