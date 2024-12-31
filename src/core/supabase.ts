import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';

console.log('SUPABASE_URL:', Config.SUPABASE_URL);
const url = "https://rjcislffmypaeunjupbs.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY2lzbGZmbXlwYWV1bmp1cGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4ODg3OTcsImV4cCI6MjA1MDQ2NDc5N30.YfAvGSM3fs483xfbr8HkU9vJozQUu_tlIyaepkDDp8w";
const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    detectSessionInUrl: false, // Required for React Native
  },
});

export default supabase;
