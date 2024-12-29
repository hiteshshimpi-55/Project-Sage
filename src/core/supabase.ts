import 'react-native-url-polyfill/auto'; // Add this line
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';

console.log('SUPABASE_URL:', Config.SUPABASE_URL);
const url = Config.SUPABASE_URL!;
const key = Config.SUPABASE_ANON_KEY!;
const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    detectSessionInUrl: false, // Required for React Native
  },
});

export default supabase;
