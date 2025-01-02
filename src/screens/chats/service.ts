import { User } from "@supabase/supabase-js";
import supabase, { adminAuthClient } from "../../core/supabase";


interface ChatsCheckResponse {
    chat_id: string;
    created_by: string;
}

export interface ChatListUser {
    id?: string;
    type?: string;
    name?: string;
    phone?: string;
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

    public static async getCurrentUserId() : Promise<string | null> {
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
    
    
    public static async checkIfChatExists(currentUserId: string,user_id: string): Promise<ChatsCheckResponse| null> {

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

    public static async createOneToOneChat(user_id:string,currentUserId: string): Promise<string | null> {

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

        const {data:chatCreateData,error: chatUserError} = await supabase.from('chat_user').insert({chat_id: data?.id,user_id: currentUserId}).select('id').single();
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
    
            console.log('Fetched groups:', chatData);

            const final_data = chatData.map((chat: any) => {
                return {
                    id: chat.id,
                    name: chat.name,
                    type:'one-to-many',
                }
            })
            return final_data || [];
        } catch (error) {
            console.error("Unexpected error in getGroups:", error);
            return [];
        }
    }
    

}