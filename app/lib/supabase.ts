import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cplgujwewkujpighzhsn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwbGd1andld2t1anBpZ2h6aHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNzYxNzgsImV4cCI6MjA2MDY1MjE3OH0.sNBGZI1Pm0lT9y6XaJ4je45i_1v-ZnNSFSwuILX9Zuc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 