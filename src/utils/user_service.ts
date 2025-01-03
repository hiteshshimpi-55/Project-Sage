import supabase, { adminAuthClient } from "../core/supabase";

export class UserService {
  public static async getAllUsers(currentUserId: string): Promise<any[]> {
    const { data, error } = await adminAuthClient.listUsers();
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    return data.users.map((user) => ({
      id: user.id,
      full_name: user.user_metadata?.full_name || 'Unknown',
      phone: user.phone || 'N/A',
      age: user.user_metadata?.age || 0,
      dob: user.user_metadata?.dob || 'N/A',
      gender: user.user_metadata?.gender || 'N/A',
      status: user.user_metadata?.status || 'inactive',
    }));
  }

  public static async activateUser(userId: string, activationTimestamp: string): Promise<void> {
    const { error } = await adminAuthClient.updateUserById(userId, {
      user_metadata: { status: 'active', activation_date: activationTimestamp },
    });
    if (error) throw error;
  
    // Optionally, update the custom_users table if you're using it
    const { error: customError } = await supabase
      .from('custom_users')
      .update({ status: 'active', activation_date: activationTimestamp })
      .eq('id', userId);
    if (customError) throw customError;
  }

  public static async makeAdmin(userId: string): Promise<void> {
    const { error } = await adminAuthClient.updateUserById(userId, {
      user_metadata: { role: 'admin' },
    });
    if (error) throw error;
  }
}
