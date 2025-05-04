import { Placeholder } from 'phosphor-react-native';
import supabase from './supabase';

interface AuthResponse {
  data: any;
  error: Error | null;
}

interface SignUpOptions {
  fullName: string;
  phone: string;
  password: string;
  gender?: string;
  age?: number;
  dob?: string;
  disease?: string;
  place?: string; // Use string for date in YYYY-MM-DD format
}

export const signUp = async ({ phone, password, fullName, gender, age, dob,disease,place }: SignUpOptions): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      phone: `+91${phone}`,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'user',
          status: 'inactive',
          gender: gender || null,
          age: age || null,
          dob: dob || null,
          disease: disease || null,
          place: place || null,
        },
      },
    });
    return { data, error };
  } catch (error) {
    console.error('Unexpected error during sign up:', error);
    return { data: null, error: error as Error };
  }
};

export const login = async (phone: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone: `+91${phone}`,
      password,
    });
    return { data, error };
  } catch (error: any) {
    console.error('Unexpected error during login:', error);
    return { data: null, error: error as Error };
  }
};
