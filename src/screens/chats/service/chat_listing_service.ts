import { User } from '@supabase/supabase-js';
import supabase, {adminAuthClient} from '../../../core/supabase';

export interface ChatUser {
  chat_id?: string;
  chat_type?: string;
  chat_name?: string;
  user_id: string;
  chat_user_id?: string;
  last_message?: string;
  last_message_time?: string;
  last_message_type?:string;
  phone_number: string;
  unread_message_count?: number;
  name: string;
}

export class ChatListingService {
  static convert_chat_users(data: any): ChatUser[] {
    return data.map((item: any) => {
      return {
        chat_id: item.chat_id,
        chat_type: item.chat_type,
        chat_name: item.chat_name,
        user_id: item.user_id,
        chat_user_id: item.chat_user_id,
        last_message: item.last_message,
        last_message_type: item.last_message_type,
        last_message_time: item.last_message_time,
        phone_number: item.phone_number,
        unread_message_count: item.unread_count,
        name: item.userdata.full_name,
      };
    });
  }


  public static async get_user_ongoing_chats(current_user_id: string){
    const {data, error} = await supabase.rpc('get_user_chats', {
        current_user_id: current_user_id
      });
  
      if (error) {
        throw error;
      } else {
        return this.convert_chat_users(data);
      }
  }

  public static async get_users(current_user_id: string) {
    const { data, error } = await adminAuthClient.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    let filteredUsers = data.users
      .filter(user => user.id !== current_user_id)
      .map((user: User) => ({
        user_id: user.id,
        chat_type: 'one-to-one',
        name: user.user_metadata?.full_name || 'Unknown',
        phone_number: user.phone || 'N/A'
      }));

    return filteredUsers;
    
  }
  public static async get_chat_listing_page(current_user_id: string, is_admin:boolean = false) {

    const ongoing_chats = await this.get_user_ongoing_chats(current_user_id);
    const ongoing_chat_ids = ongoing_chats.map(chat => chat.user_id);
    if (!is_admin) {
      return ongoing_chats;
    }
    const users = await this.get_users(current_user_id);
    const filteredUsers = users.filter(user => !ongoing_chat_ids.includes(user.user_id));
    return [...ongoing_chats, ...filteredUsers];
  }
}
