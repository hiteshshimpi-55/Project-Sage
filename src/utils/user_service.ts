import { User } from "@supabase/supabase-js";
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
  }

  public static async deactivateUser(userId: string): Promise<void> {
    const { error } = await adminAuthClient.updateUserById(userId, {
      user_metadata: { status: 'inactive' },
    });
    if (error) throw error;
  }

  public static async makeAdmin(userId: string): Promise<void> {
    const { error } = await adminAuthClient.updateUserById(userId, {
      user_metadata: { role: 'admin', status: 'active'},
    });
    if (error) throw error;
  }

  public static transformUserContext(user: User): any {
    const metadata = user.user_metadata
    return {
      id: user.id!,
      fullName: metadata.full_name!,
      phone: user.phone!,
      role: metadata.role!,
      status: metadata.status,
      gender: metadata.gender,
      age: metadata.age,
      dob: metadata.dob,
      isAdmin: metadata.role === 'admin',
    };
  }
}
