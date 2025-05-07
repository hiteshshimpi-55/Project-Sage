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


  public static async get_user_channels(current_user_id: string,limit:number = 20, offset:number = 1) {
    const {data, error} = await supabase.rpc('get_channels', {
        current_user_id: current_user_id,
        page_limit: limit,
        page_offset: offset
      });
  
      if (error) {
        console.log('Error:', error);
        throw error;
      } else {
        return this.convert_chat_users(data);
      }
  }

  public static async get_channel_details(channel_id: string) {
    const { data, error } = await supabase
      .from('chat')
      .select('*, chat_user(user_id)')
      .eq('id', channel_id)
      .single();

    if (error) {
      console.error('Error loading channel details:', error);
      throw error;
    } else {
      console.log('Channel details:', data);
      const chatName = data.name;
      const userIds = data.chat_user.map((u: any) => u.user_id);
      return {
        name: chatName,
        userIds: userIds,
      }
    }
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
