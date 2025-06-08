import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bfixtegrzudvitsotfgr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmaXh0ZWdyenVkdml0c290ZmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzOTE5NDUsImV4cCI6MjA2NDk2Nzk0NX0.Fuq_d2cSjkL4GhlSaJ0sC-1kuO9Pkls1lG8ACOvSjQQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
