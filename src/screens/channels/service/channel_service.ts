import { User } from '@supabase/supabase-js';
import supabase, { adminAuthClient } from '../../../core/supabase';

export interface Channel {
  id?: string;
  type?: string;
  name?: string;
  last_message?: string;
  last_message_time?: string;
  last_message_type?:string;
  unread_message_count?: number;
}

export class ChannelListingService {
  static convert_chat_users(data: any): Channel[] {
    return data.map((item: any) => {
      return {
        id: item.channel_id,
        type: item.channel_type,
        name: item.channel_name,
        last_message: item.last_message,
        last_message_type: item.last_message_type,
        last_message_time: item.last_message_time,
        unread_message_count: item.unread_count,
      };
    });
  }


  public static async get_user_channels(current_user_id: string) {
    const {data, error} = await supabase.rpc('get_channels', {
        current_user_id: current_user_id,
      });
  
      if (error) {
        console.log('Error:', error);
        throw error;
      } else {
        return this.convert_chat_users(data);
      }
  }
  public static async get_chat_listing_page(current_user_id: string, is_admin:boolean = false) {
    const channels = await this.get_user_channels(current_user_id);
    return channels;
  }

  public static async get_all_users(current_user_id: string) {
    const { data, error } = await adminAuthClient.listUsers();
    if (error) {
      console.error('Error loading users:', error);
      throw error;
    }

    const users = data.users;

    const filteredList: User[] = users.filter((user: any) => user.id !== current_user_id);
    return filteredList;
  }
}
