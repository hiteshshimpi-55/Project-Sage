import { User } from "@supabase/supabase-js";
import supabase, { adminAuthClient } from "../../core/supabase";


interface CreateUserRequest {
	name: string;
	email: string;
	password: string;
}

interface UpdateUserRequest {
	name?: string;
	email?: string;
}

export interface Message {
    id: string;
    text: string;
    chat_id: string;
    created_by: string;
    created_at: string;
    type: string;
    media_url: string;
  };

export class ChatService {
	// Fetch all users
	public static async getAllUsers(user_id: string): Promise<User[]> {

        const {data,error} = await adminAuthClient.listUsers();

        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }
        
        return data.users.filter(user => user.id !== user_id);

	}

    public static async getChatUserId(userId: string): Promise<string | null> {

        const {data:{user},error} = await supabase.auth.getUser();
        if  (error) {
            console.error('Error fetching user:', error);
            return null;
        }

        const { data, error: fetchError } = await supabase
        .from('chat_user')
        .select('id')
        .eq('user_id', user!.id)
        .single();

        console.log('Fetched user:', data!.id);
    
        if (fetchError) {
          console.error('Error fetching user:', fetchError);
        }

    
        return data?.id || null;
    }
          
}