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
  dob?: string; // Use string for date in YYYY-MM-DD format
}

export const signUp = async ({ phone, password, fullName, gender, age, dob }: SignUpOptions): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      phone: `+${phone}`,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin', // Default role
          status: 'inactive', // Default status
          gender: gender || null,
          age: age || null,
          dob: dob || null,
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
      phone: `+${phone}`,
      password,
    });
    return { data, error };
  } catch (error: any) {
    console.error('Unexpected error during login:', error);
    return { data: null, error: error as Error };
  }
};
