import supabase from './supabase';
import bcrypt from 'react-native-bcrypt';

// Function to sign up a new user with phone and password
export const signUpWithPhone = async (phone: string, password: string, fullName: string) => {
  try {
    // Check if phone already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      throw new Error('Phone number already registered.');
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Insert user into the `users` table
    const { data, error } = await supabase.from('users').insert([
      { phone, password: hashedPassword, full_name: fullName },
    ]);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
};

// Function to log in the user with phone and password
export const loginWithPhone = async (phone: string, password: string) => {
  try {
    // Fetch the user by phone
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !user) {
      throw new Error('Invalid phone number or password.');
    }

    // Compare the password
    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid phone number or password.');
    }

    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
};
