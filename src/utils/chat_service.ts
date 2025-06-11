import {User} from '@supabase/supabase-js';
import RNFS from 'react-native-fs';
import supabase, {adminAuthClient} from '../core/supabase';
import {useUser} from '@hooks/UserContext';
import { decode } from 'base64-arraybuffer';

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
}

export class ChatService {
  // Fetch all users

  public static async getCurrentUserId(): Promise<string | null> {
    const {
      data: {user},
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    return user?.id || null;
  }

  public static async getAllUsers(
    user_id: string,
    is_admin: boolean,
  ): Promise<ChatListUser[]> {
    const {data, error} = await adminAuthClient.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    let filteredUsers = data.users
      .filter(user => user.id !== user_id)
      .map((user: User) => ({
        id: user.id,
        type: 'one-to-one',
        name: user.user_metadata?.full_name || 'Unknown',
        phone: user.phone || 'N/A',
      }));

    // Step 1: Fetch chat_user records for the current user
    const {data: chatUserData, error: chatUserError} = await supabase
      .from('chat_user')
      .select('*')
      .eq('user_id', user_id);

    if (chatUserError) {
      console.error('Error fetching chat_user data:', chatUserError);
      return [];
    }

    // Extract chat IDs from the chat_user records
    const chatIds = chatUserData.map((chat: any) => chat.chat_id);

    if (chatIds.length === 0) {
      console.log('No chats found for the user.');
      // For admins, return all users with empty chat data
      if (is_admin) {
        return filteredUsers.map(user => ({
          ...user,
          latest_message: '',
          latest_message_time: '',
          unread_count: 0,
        }));
      }
      return [];
    }

    // Step 2: Fetch chats using the extracted chat IDs
    const {data: chatData, error: chatError} = await supabase
      .from('chat')
      .select('*')
      .in('id', chatIds)
      .eq('type', 'one-to-one');

    if (chatError) {
      console.error('Error fetching chats:', chatError);
      return filteredUsers;
    }

    // Step 3: Get all users that are in the same one-to-one chats as the current user
    const {data: chatUsers, error: chatUsersError} = await supabase
      .from('chat_user')
      .select('*')
      .in('chat_id', chatIds)
      .neq('user_id', user_id);

    if (chatUsersError) {
      console.error('Error fetching other chat users:', chatUsersError);
      return filteredUsers;
    }

    // Create a map of userId to chatId for quick lookup
    const userChatMap: any = {};
    chatUsers.forEach(cu => {
      userChatMap[cu.user_id] = cu.chat_id;
    });

    // Map users with their latest chat and unread messages
    let final_data = await Promise.all(
      filteredUsers.map(async user => {
        // Get the chat ID this user shares with the current user
        const chatId = userChatMap[user.id];

        // If no shared chat and not admin, skip this user
        if (!chatId && !is_admin) {
        }

        // For admins or users with chats
        if (chatId) {
          const latestMessage = await this.getLastMessageOfChat(chatId);
          const unreadCount = await this.getUnreadMessagesCount(
            chatId,
            user_id,
          );

          return {
            ...user,
            chat_id: chatId,
            latest_message: latestMessage?.text || '',
            latest_message_time: latestMessage?.created_at || '',
            unread_count: unreadCount || 0,
          };
        } else {
          // For admins with users that don't have chats
          return {
            ...user,
            latest_message: '',
            latest_message_time: '',
            unread_count: 0,
          };
        }
      }),
    );

    // Filter out null values (users without chats for non-admins)
    final_data = final_data.filter(user => user !== null);

    return final_data || [];
  }
  public static async getAllUsersFromSystemWithChatUserId(
    chat_id: string,
  ): Promise<Record<string, string>> {
    try {
      // Fetch all users from the authentication system
      const {data: authData, error: authError} =
        await adminAuthClient.listUsers();
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
      const {data: chatUserData, error: chatUserError} = await supabase
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

  public static async getChatUserId(
    userId: string,
    chatId: string,
  ): Promise<string | null> {
    try {
      const {data, error} = await supabase
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

  public static async createChatUser(
    userId: string,
    chatId: string,
  ): Promise<string | null> {
    try {
      const payload = {
        chat_id: chatId,
        user_id: userId,
      };
      console.log('Payload', payload);

      const {data, error} = await supabase
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

  public static async checkIfChatExists(
    currentUserId: string,
    user_id: string,
  ): Promise<ChatsCheckResponse | null> {
    const {data: existingChats, error: fetchError} = await supabase
      .from('chat')
      .select('id,created_by')
      .or(
        `and(created_by.eq.${currentUserId},name.eq.${user_id}),and(created_by.eq.${user_id},name.eq.${currentUserId})`,
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
        created_by: existingChats.created_by,
      };
    } else {
      console.log('Chat does not exist. Creating a new one...');
      return null;
    }
  }

  public static async createOneToOneChat(
    user_id: string,
    currentUserId: string,
  ): Promise<string | null> {
    const payload = {
      name: user_id,
      created_by: currentUserId,
      type: 'one-to-one',
    };
    const {data, error} = await supabase
      .from('chat')
      .insert(payload)
      .select('id')
      .single();
    if (error) {
      console.error('Error creating chat:', error);
      return null;
    }
    return data?.id;
  }

  public static async createGroupChat(
    currentUserId: string,
    groupName: string,
  ): Promise<string | null> {
    const payload = {
      name: groupName,
      created_by: currentUserId,
      type: 'one-to-many',
    };
    console.log('Creating group chat:', payload);

    const {data, error} = await supabase
      .from('chat')
      .insert(payload)
      .select('id')
      .single();
    if (error) {
      console.error('Error creating chat:', error);
      return null;
    }

    const {data: chatCreateData, error: chatUserError} = await supabase
      .from('chat_user')
      .insert({chat_id: data?.id, user_id: currentUserId})
      .select('id')
      .single();
    if (chatUserError) {
      console.error('Error creating chat user:', chatUserError);
      return null;
    }
    return chatCreateData?.id;
  }

  public static async getGroups(
    currentUserId: string,
  ): Promise<ChatListUser[]> {
    try {
      // Step 1: Fetch chat_user records for the current user
      const {data: chatUserData, error: chatUserError} = await supabase
        .from('chat_user')
        .select('*')
        .eq('user_id', currentUserId);

      if (chatUserError) {
        console.error('Error fetching chat_user data:', chatUserError);
        return [];
      }

      // Extract chat IDs from the chat_user records
      const chatIds = chatUserData.map((chat: any) => chat.chat_id);

      if (chatIds.length === 0) {
        console.log('No chats found for the user.');
        return [];
      }

      // Step 2: Fetch chats using the extracted chat IDs
      const {data: chatData, error: chatError} = await supabase
        .from('chat')
        .select('*')
        .in('id', chatIds)
        .eq('type', 'one-to-many');

      if (chatError) {
        console.error('Error fetching chats:', chatError);
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
        chatData.map(async chat => {
          const latestMessage = await this.getLastMessageOfChat(chat.id);
          const unreadCount = await this.getUnreadMessagesCount(
            chat.id,
            currentUserId,
          );

          return {
            ...chat,
            latest_message: latestMessage?.text || '',
            latest_message_time: latestMessage?.created_at || '',
            unread_count: unreadCount || 0,
          };
        }),
      );
      return final_data || [];
    } catch (error) {
      console.error('Unexpected error in getGroups:', error);
      return [];
    }
  }

  static async createGroupWithUsers(
    createdBy: string,
    groupName: string,
    userIds: string[],
  ): Promise<string> {
    try {
      console.log('Creating group with users:', createdBy, groupName, userIds);
      const final_user_ids = [...userIds, createdBy];
      const {data, error} = await supabase.rpc('create_group_with_users', {
        created_by: createdBy,
        group_name: groupName,
        user_ids: final_user_ids,
      });

      if (error) {
        console.error('Error creating group with users:', error);
        throw new Error(error.message);
      }
      console.log('Group created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating group with users:', error);
      throw error;
    }
  }

  static async updateGroup(
    channel_id: string,
    createdBy: string,
    groupName: string,
    userIds: string[],
  ): Promise<string> {
    try {
      console.log('Updating group with users:', createdBy, groupName, userIds);
      const final_user_ids = [...userIds];
      const {data, error} = await supabase.rpc('update_channel', {
        p_chat_id: channel_id,
        p_created_by: createdBy,
        p_group_name: groupName,
        p_user_ids: final_user_ids,
      });

      if (error) {
        console.error('Error creating group with users:', error);
        throw new Error(error.message);
      }
      console.log('Group created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating group with users:', error);
      throw error;
    }
  }

  static async markAsRead(chatId: string, userId: string) {
    try {
      const now = new Date().toISOString();
      await supabase
        .from('chat_user')
        .update({last_read_at: now})
        .eq('chat_id', chatId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  }

  static async getChatDetails(
    currentUserId: string,
    targetUserId: string,
    chatType: string,
  ): Promise<{chatId: string | null; chatUserId: string | null} | null> {
    try {
      let chatId: string | null = null;
      let chatUserId: string | null = null;

      if (chatType === 'one-to-one') {
        const existingChat = await this.checkIfChatExists(
          currentUserId,
          targetUserId,
        );

        if (existingChat?.chat_id) {
          chatId = existingChat.chat_id;
          chatUserId =
            (await this.getChatUserId(currentUserId, chatId)) ??
            (await this.createChatUser(currentUserId, chatId));
        } else {
          chatId = await this.createOneToOneChat(targetUserId, currentUserId);
          if (chatId) {
            chatUserId = await this.createChatUser(currentUserId, chatId);
          }
        }
      } else {
        chatId = targetUserId; // In group chat, chatId is already provided
        chatUserId = await ChatService.getChatUserId(currentUserId, chatId);
      }

      if (!chatId || !chatUserId) throw new Error('Failed to initialize chat.');

      await this.markAsRead(chatId, currentUserId);
      return {chatId, chatUserId};
    } catch (error) {
      console.error('Error getting chat details:', error);
      return null;
    }
  }

  static async getLastMessageOfChat(chatId: string): Promise<Message | null> {
    try {
      const {data, error} = await supabase
        .from('message')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', {ascending: false})
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

  static async getChatUserLastReadTime(
    chatId: string,
    userId: string,
  ): Promise<string | null> {
    try {
      const {data, error} = await supabase
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

  static async getUnreadMessagesCount(
    chatId: string,
    userId: string,
  ): Promise<number> {
    try {
      const {data, error} = await supabase
        .from('message')
        .select('count', {count: 'exact'})
        .eq('chat_id', chatId)
        .gt(
          'created_at',
          (await this.getChatUserLastReadTime(chatId, userId)) ||
            '1970-01-01T00:00:00Z',
        );

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

  static async deleteMessage(messageId: string) {
    const {data, error} = await supabase
      .from('message')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  static async sendTextMessage(
    chatId: string,
    chatUserId: string,
    text: string,
  ) {
    try {
      console.log('Sending text message:', chatId, chatUserId, text);
      const message = {
        chat_id: chatId,
        created_by: chatUserId,
        type: 'text',
        text: text,
        media_url: '',
      };

      const {data, error} = await supabase.from('message').insert(message);
      if (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error('Error sending text message:', error);
      throw error;
    }
  }

  static async sendAudioMessage(
    chatId: string,
    userId: string,
    localPath: string,
  ) {
    // ── 1. Prep meta ───────────────────────────────────────────────────────────────
    const ext  = (localPath.split('.').pop() || 'm4a').toLowerCase();
    const mime = ext === 'mp3' ? 'audio/mpeg' : `audio/${ext}`;
    const objectName = `${Date.now()}.${ext}`;       // e.g. 1714729458123.m4a
  
    // ── 2. Read the file & decode to ArrayBuffer ───────────────────────────────────
    const base64 = await RNFS.readFile(localPath, 'base64');          // <-- small files only (≤ ~6 MB)
    const arrayBuffer = decode(base64);                               // returns Uint8Array-compatible buffer
  
    // ── 3. Upload to Storage (bucket = voice_messages) ─────────────────────────────
    const { error: uploadErr } = await supabase
      .storage
      .from('voice-messages')          // bucket ID, not a path!
      .upload(objectName, arrayBuffer, {
        contentType: mime,
        upsert: false,
      });
  
    if (uploadErr) {
      console.error(uploadErr);
      throw uploadErr;
    }
  
    // ── 4. Get a public URL ────────────────────────────────────────────────────────
    const {
      data: { publicUrl },
    } = supabase.storage.from('voice-messages').getPublicUrl(objectName);
  
    // ── 5. Insert message row ──────────────────────────────────────────────────────
    const { error: insertErr } = await supabase
      .from('message')
      .insert({
        chat_id: chatId,
        created_by: userId,
        type: 'audio',
        text: '',
        media_url: publicUrl,
      })
      .single();
  
    if (insertErr) {
      console.error(insertErr);
      throw insertErr;
    }
  }

  static async sendImageMessage(
    chatId: string,
    userId: string,
    imageSystemPath: string,
  ) {
    try {
      // Step 1: Prepare file information
      const fileExt = imageSystemPath.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      // Read the image file as a base64 string
      const base64File = await RNFS.readFile(imageSystemPath, 'base64');

      console.log('Base64 File Size:', base64File.length);

      // Convert base64 to binary data (Uint8Array)
      const binaryString = atob(base64File);
      const byteArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
      }

      // Upload the binary data to Supabase Storage
      const {data: uploadData, error: uploadError} = await supabase.storage
        .from('chat-images')
        .upload(filePath, byteArray, {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Step 2: Get the public URL of the uploaded image
      const {data: publicUrlData} = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // Step 3: Send the image URL as a message
      const message = {
        chat_id: chatId,
        created_by: userId,
        text: '',
        type: 'image',
        media_url: imageUrl,
      };

      // Insert the message into your messages table
      const {data: messageData, error: messageError} = await supabase
        .from('message')
        .insert(message);

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
