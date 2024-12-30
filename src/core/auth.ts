import supabase from './supabase';

interface SignupParams {
  phone: string;
  password: string;
  fullName: string;
}

export const signupWithPhone = async ({ phone, password, fullName }: SignupParams) => {
  console.log('Attempting signup with:', { phone, password, fullName }); // Log inputs
  try {
    const { data, error } = await supabase.auth.signUp({
      phone,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    console.log('Supabase signup response:', { data, error }); // Log response

    if (error) throw new Error(error.message); // Proper error handling
    return data; // Return user data if successful
  } catch (err: any) {
    console.error('Signup error:', err.message || err); // Log error
    throw new Error(err.message || 'Signup failed');
  }
};

export const loginWithPhone = async (phone: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Login failed');
  }
};
