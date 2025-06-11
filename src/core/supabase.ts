import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = "https://ihoxqtvcgndxhanutpbe.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlob3hxdHZjZ25keGhhbnV0cGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1OTIzMjAsImV4cCI6MjA2MjE2ODMyMH0.xyJX_YtBXQqD9kKVD0-guN2zzSK3ZE3tJ85jLPTP-o0";

const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    detectSessionInUrl: false
  },
  global:{
    headers:{
      'x-log-level': 'debug',
    }
  }
});

export default supabase;

const admin_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlob3hxdHZjZ25keGhhbnV0cGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU5MjMyMCwiZXhwIjoyMDYyMTY4MzIwfQ.3h99t5J5-MmyPACWrjg8qw6d-GH541y9lsFLVXt86OE";
const admin_supabase = createClient(url, admin_key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Access auth admin api
const adminAuthClient = admin_supabase.auth.admin
export {adminAuthClient}