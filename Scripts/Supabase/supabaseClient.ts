/*
*  For Supabase Initialization:
*  This is the one file that gets imported everywhere in place of localStorage
*  Every other file will eventually get imported from Supabase itself
*/
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);