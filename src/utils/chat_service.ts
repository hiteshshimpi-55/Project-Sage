import { User } from "@supabase/supabase-js";
import RNFS from 'react-native-fs';
import supabase, { adminAuthClient } from "../core/supabase";


interface ChatsCheckResponse {
  chat_id: string;
  created_by: string;
}

export interface ChatListUser {
  id?: string;
  type?: string;
  name?: string;
  phone?: string;
  latest_message?: string;
  latest_message_time?: string;
  unread_count?: number;
}

export interface ChatUserMapping {
  chatUserId: string;
  username: string;
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

  public static async getCurrentUserId(): Promise<string | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    return user?.id || null;
  }
  public static async getAllUsers(user_id: string): Promise<ChatListUser[]> {

    const { data, error } = await adminAuthClient.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    const filteredUsers = data.users.filter(user => user.id !== user_id);

    return filteredUsers.map((user: User) => ({
      id: user.id,
      type: 'one-to-one',
      name: user.user_metadata?.full_name || 'Unknown',
      phone: user.phone || 'N/A',
    }));
  }

  public static async getAllUsersFromSystemWithChatUserId(chat_id: string): Promise<Record<string, string>> {
    try {
      // Fetch all users from the authentication system
      const { data: authData, error: authError } = await adminAuthClient.listUsers();
      if (authError) {
        console.error('Error fetching users from adminAuthClient:', authError);
        return {};
      }

      // Map authentication user data
      const userData = authData.users.map((user: User) => ({
        id: user.id,
        name: user.user_metadata?.full_name || 'Unknown',
        phone: user.phone || 'N/A',
      }));

      // Fetch chat user mappings from the database
      const { data: chatUserData, error: chatUserError } = await supabase
        .from('chat_user')
        .select('id, user_id')
        .eq('chat_id', chat_id); // Filter by the given chat_id

      if (chatUserError) {
        console.error('Error fetching chat_user data:', chatUserError);
        return {};
      }

      // Create a map { chatUserId: username }
      const result: Record<string, string> = {};
      chatUserData.forEach(chatUser => {
        const user = userData.find(u => u.id === chatUser.user_id);
        result[chatUser.id] = user?.name || 'Unknown';
      });

      return result;
    } catch (error) {
      console.error('Unexpected error:', error);
      return {};
    }
  }



  public static async getChatUserId(userId: string, chatId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('chat_user')
        .select('id')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .single();

      if (error) {
        console.error('Error fetching chat user:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Unexpected error during fetching chat user:', error);
      return null;
    }
  }

  public static async createChatUser(userId: string, chatId: string): Promise<string | null> {
    try {
      const payload = {
        chat_id: chatId,
        user_id: userId,
      };
      console.log("Payload", payload)

      const { data, error } = await supabase
        .from('chat_user')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating chat user:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Unexpected error during creating chat user:', error);
      return null;
    }
  }


  public static async checkIfChatExists(currentUserId: string, user_id: string): Promise<ChatsCheckResponse | null> {

    const { data: existingChats, error: fetchError } = await supabase
      .from('chat')
      .select('id,created_by')
      .or(
        `and(created_by.eq.${currentUserId},name.eq.${user_id}),and(created_by.eq.${user_id},name.eq.${currentUserId})`
      )
      .single();


    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking chat existence:', fetchError);
      return null;
    }

    if (existingChats) {
      console.log('Chat already exists:', existingChats.id);
      return {
        chat_id: existingChats.id,
        created_by: existingChats.created_by
      };
    } else {
      console.log('Chat does not exist. Creating a new one...');
      return null;
    }
  }

  public static async createOneToOneChat(user_id: string, currentUserId: string): Promise<string | null> {

    const payload = {
      name: user_id,
      created_by: currentUserId,
      type: 'one-to-one'
    }
    const { data, error } = await supabase.from('chat').insert(payload).select('id').single();
    if (error) {
      console.error('Error creating chat:', error);
      return null;
    }
    return data?.id;
  }

  public static async createGroupChat(currentUserId: string, groupName: string): Promise<string | null> {
    const payload = {
      name: groupName,
      created_by: currentUserId,
      type: 'one-to-many'
    }
    console.log('Creating group chat:', payload);

    const { data, error } = await supabase.from('chat').insert(payload).select('id').single();
    if (error) {
      console.error('Error creating chat:', error);
      return null;
    }

    const { data: chatCreateData, error: chatUserError } = await supabase.from('chat_user').insert({ chat_id: data?.id, user_id: currentUserId }).select('id').single();
    if (chatUserError) {
      console.error('Error creating chat user:', chatUserError);
      return null;
    }
    return chatCreateData?.id;
  }

  public static async getGroups(currentUserId: string): Promise<ChatListUser[]> {
    try {
      // Step 1: Fetch chat_user records for the current user
      const { data: chatUserData, error: chatUserError } = await supabase
        .from('chat_user')
        .select('*')
        .eq('user_id', currentUserId);

      if (chatUserError) {
        console.error("Error fetching chat_user data:", chatUserError);
        return [];
      }

      // Extract chat IDs from the chat_user records
      const chatIds = chatUserData.map((chat: any) => chat.chat_id);

      if (chatIds.length === 0) {
        console.log("No chats found for the user.");
        return [];
      }

      // Step 2: Fetch chats using the extracted chat IDs
      const { data: chatData, error: chatError } = await supabase
        .from('chat')
        .select('*')
        .in('id', chatIds)
        .eq('type', 'one-to-many');

      if (chatError) {
        console.error("Error fetching chats:", chatError);
        return [];
      }
      // const final_data = chatData.map((chat: any) => {
      //     return {
      //         id: chat.id,
      //         name: chat.name,
      //         type:'one-to-many',
      //     }
      // })
      let final_data = await Promise.all(
        chatData.map(async (chat) => {
          const latestMessage = await this.getLastMessageOfChat(chat.id);
          const unreadCount = await this.getUnreadMessagesCount(chat.id, currentUserId);

          return {
            ...chat,
            latest_message: latestMessage?.text || '',
            latest_message_time: latestMessage?.created_at || '',
            unread_count: unreadCount || 0,
          };
        })
      );
      return final_data || [];
    } catch (error) {
      console.error("Unexpected error in getGroups:", error);
      return [];
    }
  }

  static async createGroupWithUsers(createdBy: string, groupName: string, userIds: string[]): Promise<string> {
    try {
      console.log("Creating group with users:", createdBy, groupName, userIds);
      const final_user_ids = [...userIds, createdBy]
      const { data, error } = await supabase.rpc('create_group_with_users', {
        created_by: createdBy,
        group_name: groupName,
        user_ids: final_user_ids,
      });

      if (error) {
        console.error("Error creating group with users:", error);
        throw new Error(error.message);
      }
      console.log("Group created successfully:", data);
      return data;
    } catch (error) {
      console.error("Error creating group with users:", error);
      throw error;
    }
  }

  static async markAsRead(chatId: string, userId: string) {
    try {
      const now = new Date().toISOString();
      await supabase.from('chat_user').update({ last_read_at: now }).eq('chat_id', chatId).eq('user_id', userId);
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  }

  static async getChatDetails(currentUserId: string, targetUserId: string, chatType: string): Promise<{ chatId: string | null; chatUserId: string | null; } | null> {
    try {
      let chatId: string | null = null;
      let chatUserId: string | null = null;

      if (chatType === 'one-to-one') {
        const existingChat = await ChatService.checkIfChatExists(currentUserId, targetUserId);

        if (existingChat?.chat_id) {
          chatId = existingChat.chat_id;
          chatUserId = await ChatService.getChatUserId(currentUserId, chatId)
            ?? await ChatService.createChatUser(currentUserId, chatId);
        } else {
          chatId = await ChatService.createOneToOneChat(targetUserId, currentUserId);
          if (chatId) {
            chatUserId = await ChatService.createChatUser(currentUserId, chatId);
          }
        }
      } else {
        chatId = targetUserId; // In group chat, chatId is already provided
        chatUserId = await ChatService.getChatUserId(currentUserId, chatId);
      }

      if (!chatId || !chatUserId) throw new Error("Failed to initialize chat.");

      await this.markAsRead(chatId, currentUserId)
      return { chatId, chatUserId };
    } catch (error) {
      console.error('Error getting chat details:', error);
      return null;
    }
  };

  static async getLastMessageOfChat(chatId: string): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('message')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching last message:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Unexpected error fetching last message:', error);
      return null;
    }
  }

  static async getChatUserLastReadTime(chatId: string, userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('chat_user')
        .select('last_read_at')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching last read time:', error);
        return null;
      }

      return data?.last_read_at || null;
    } catch (error) {
      console.error('Unexpected error fetching last read time:', error);
      return null;
    }
  }

  static async getUnreadMessagesCount(chatId: string, userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('message')
        .select('count', { count: 'exact' })
        .eq('chat_id', chatId)
        .gt('created_at', (await this.getChatUserLastReadTime(chatId, userId)) || '1970-01-01T00:00:00Z');

      if (error) {
        console.error('Error fetching unread messages count:', error);
        return 0;
      }

      return data[0]?.count || 0;
    } catch (error) {
      console.error('Unexpected error fetching unread messages count:', error);
      return 0;
    }
  }

  static async sendImageMessage(chatId: string, userId: string, imageSystemPath: string) {
    try {
      // Step 1: Prepare file information
      const fileExt = imageSystemPath.split('.').pop(); // Get file extension
      const fileName = `${userId}-${Date.now()}.${fileExt}`; // Create a unique file name
      const filePath = `chat-images/${fileName}`; // Path in Supabase Storage

      // Read the image file as a base64 string
      const base64File = await RNFS.readFile(imageSystemPath, 'base64');

      console.log('Base64 File Size:', base64File.length);

      // Create a Blob using base64 data (Supabase accepts base64 directly)
      const base64Blob = `data:image/${fileExt};base64,${base64File}`;

      // Upload the base64 file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, base64Blob, {
          contentType: `image/${fileExt}`,
          upsert: true, // Overwrite if file already exists (optional)
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Step 2: Get the public URL of the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // Step 3: Send the image URL as a message
      const message = {
        chat_id: chatId,
        user_id: userId,
        message_type: 'image',
        content: imageUrl, // Use the public URL of the image
        timestamp: new Date().toISOString(),
      };

      // Insert the message into your messages table
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert([message]);

      if (messageError) {
        throw new Error(`Failed to send message: ${messageError.message}`);
      }

      console.log('Image message sent successfully:', messageData);
      return messageData;
    } catch (error) {
      console.error('Error sending image message:', error);
      throw error;
    }
  }


}