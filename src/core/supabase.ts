import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';

const url = "https://rjcislffmypaeunjupbs.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY2lzbGZmbXlwYWV1bmp1cGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4ODg3OTcsImV4cCI6MjA1MDQ2NDc5N30.YfAvGSM3fs483xfbr8HkU9vJozQUu_tlIyaepkDDp8w";

console.log('SUPABASE_URL:', Config.SUPABASE_URL);

const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    detectSessionInUrl: false
  },
});

export default supabase;

const admin_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY2lzbGZmbXlwYWV1bmp1cGJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDg4ODc5NywiZXhwIjoyMDUwNDY0Nzk3fQ.j9DVBZ3Bx4WFuVnplD25oOQw9E8E6igheIIDRW6t4xw";
const admin_supabase = createClient(url, admin_key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Access auth admin api
const adminAuthClient = admin_supabase.auth.admin
export {adminAuthClient}