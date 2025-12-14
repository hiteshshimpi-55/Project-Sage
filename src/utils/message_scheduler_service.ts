import supabase from '../core/supabase';
import { ChatService } from './chat_service';
import { ChatServiceV2 } from '../screens/chats/service/chat_service';

export interface ScheduledMessage {
  id: string;
  user_id: string;
  admin_id: string;
  message_content: string;
  schedule_start_date: string;
  message_count: number;
  last_sent_at?: string;
  next_scheduled_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class MessageSchedulerService {
  private static readonly DEFAULT_MESSAGE = "You have an appointment tomorrow";

  /**
   * Creates a new scheduled message series for a user
   * @param userId - Target user ID
   * @param adminId - Admin user ID who is scheduling
   * @param customMessage - Optional custom message (defaults to appointment reminder)
   * @returns Promise<string> - The scheduled message ID
   */
  public static async createScheduledMessage(
    userId: string,
    adminId: string,
    customMessage?: string
  ): Promise<string> {
    try {
      // Check if user already has an active scheduled message
      const existingSchedule = await this.getActiveScheduleForUser(userId);
      if (existingSchedule) {
        throw new Error('User already has an active scheduled message series');
      }

      const startDate = new Date();
      const messageContent = customMessage || this.DEFAULT_MESSAGE;

      // Create the scheduled message record
      const { data, error } = await supabase
        .from('scheduled_messages')
        .insert({
          user_id: userId,
          admin_id: adminId,
          message_content: messageContent,
          schedule_start_date: startDate.toISOString(),
          message_count: 0,
          next_scheduled_at: startDate.toISOString(), // Set to now for immediate processing
          is_active: true,
        })
        .select('id')
        .single();

      if (error) throw error;

      console.log(`Scheduled message created for user ${userId}, first message scheduled immediately`);

      // Send the first message immediately
      try {
        await this.deliverMessage(adminId, userId, messageContent);
        
        // Update the record after sending the first message
        const secondMessageDate = this.calculateNextMessageDate(startDate, 1);
        await supabase
          .from('scheduled_messages')
          .update({
            message_count: 1,
            last_sent_at: new Date().toISOString(),
            next_scheduled_at: secondMessageDate.toISOString(),
          })
          .eq('id', data.id);

        console.log(`First message sent immediately, next message scheduled for ${secondMessageDate}`);
      } catch (deliveryError) {
        console.error('Error sending first message:', deliveryError);
        // Don't throw error - the schedule is created, first message can be processed later
      }

      return data.id;
    } catch (error) {
      console.error('Error creating scheduled message:', error);
      throw error;
    }
  }

  /**
   * Calculates the next message date based on the scheduling rules:
   * - First 3 messages: every 7 days
   * - Subsequent messages: every 15 days
   */
  private static calculateNextMessageDate(startDate: Date, messageCount: number): Date {
    const nextDate = new Date(startDate);
    
    if (messageCount < 3) {
      // First 3 messages: every 7 days
      nextDate.setDate(startDate.getDate() + (messageCount * 7));
    } else {
      // After 3rd message: 15-day intervals
      // First 3 messages took 21 days (0, 7, 14), then add 15-day intervals
      const daysAfterThirdMessage = (messageCount - 3) * 15;
      nextDate.setDate(startDate.getDate() + 21 + daysAfterThirdMessage);
    }
    
    return nextDate;
  }

  /**
   * Gets active scheduled message for a user
   */
  public static async getActiveScheduleForUser(userId: string): Promise<ScheduledMessage | null> {
    try {
      const { data, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows

      if (error) {
        console.error('Error fetching active schedule:', error);
        return null;
      }
      return data || null;
    } catch (error) {
      console.error('Error fetching active schedule:', error);
      return null;
    }
  }

  /**
   * Gets all scheduled messages for admin dashboard
   */
  public static async getAllScheduledMessages(): Promise<ScheduledMessage[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('is_active', true)
        .order('next_scheduled_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
      throw error;
    }
  }

  /**
   * Processes due messages (this would typically be called by a cron job or edge function)
   */
  public static async processDueMessages(): Promise<{
    success: boolean;
    processed: number;
    total: number;
    errors: string[];
  }> {
    try {
      const now = new Date();
      console.log('Processing due messages at:', now.toISOString());
      
      const { data: dueMessages, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('is_active', true)
        .lte('next_scheduled_at', now.toISOString());

      if (error) {
        console.error('Error fetching due messages:', error);
        throw error;
      }

      console.log(`Found ${dueMessages?.length || 0} due messages`);

      if (!dueMessages || dueMessages.length === 0) {
        return {
          success: true,
          processed: 0,
          total: 0,
          errors: []
        };
      }

      let processedCount = 0;
      const errors: string[] = [];

      for (const message of dueMessages) {
        try {
          console.log(`Processing message for user ${message.user_id}`);
          await this.sendScheduledMessage(message);
          processedCount++;
          console.log(`Successfully processed message for user ${message.user_id}`);
        } catch (error) {
          const errorMsg = `Failed to process message for user ${message.user_id}: ${(error as Error).message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      return {
        success: true,
        processed: processedCount,
        total: dueMessages.length,
        errors
      };
    } catch (error) {
      console.error('Error processing due messages:', error);
      return {
        success: false,
        processed: 0,
        total: 0,
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Sends a scheduled message and updates the schedule
   */
  private static async sendScheduledMessage(scheduledMessage: ScheduledMessage): Promise<void> {
    try {
      // Send the message via chat service
      await this.deliverMessage(
        scheduledMessage.admin_id,
        scheduledMessage.user_id,
        scheduledMessage.message_content
      );

      // Calculate next message date
      const newMessageCount = scheduledMessage.message_count + 1;
      const startDate = new Date(scheduledMessage.schedule_start_date);
      const nextMessageDate = this.calculateNextMessageDate(startDate, newMessageCount);

      // Update the scheduled message record
      const { error } = await supabase
        .from('scheduled_messages')
        .update({
          message_count: newMessageCount,
          last_sent_at: new Date().toISOString(),
          next_scheduled_at: nextMessageDate.toISOString(),
        })
        .eq('id', scheduledMessage.id);

      if (error) throw error;

      console.log(`Message sent to user ${scheduledMessage.user_id}, next message scheduled for ${nextMessageDate}`);
    } catch (error) {
      console.error('Error sending scheduled message:', error);
      throw error;
    }
  }

  /**
   * Delivers the message through the chat system
   */
  private static async deliverMessage(
    adminId: string,
    userId: string,
    messageContent: string
  ): Promise<void> {
    try {
      // Check if chat exists or create one
      const chatResponse = await ChatService.checkIfChatExists(adminId, userId);
      
      let chatId = chatResponse?.chat_id;
      if (!chatId) {
        chatId = await ChatServiceV2.get_or_create_chat(adminId, userId);
      }

      if (!chatId) {
        throw new Error('Failed to create or retrieve chat');
      }

      // Get the chat user ID for the admin
      const chatUserId = await ChatService.getChatUserId(adminId, chatId);
      
      if (typeof chatUserId === 'string') {
        await ChatService.sendTextMessage(
          chatId,
          chatUserId,
          messageContent,
          'scheduled_reminder'
        );
      } else {
        throw new Error('Invalid chat user ID');
      }
    } catch (error) {
      console.error('Failed to deliver scheduled message:', error);
      throw error;
    }
  }

  /**
   * Deactivates scheduled messages for a user
   */
  public static async deactivateScheduledMessage(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      console.log(`Deactivated scheduled messages for user ${userId}`);
    } catch (error) {
      console.error('Error deactivating scheduled message:', error);
      throw error;
    }
  }

  /**
   * Updates the message content for an active schedule
   */
  public static async updateMessageContent(
    userId: string,
    newMessage: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .update({ message_content: newMessage })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      console.log(`Updated message content for user ${userId}`);
    } catch (error) {
      console.error('Error updating message content:', error);
      throw error;
    }
  }

  /**
   * Gets scheduling statistics for admin dashboard
   */
  public static async getSchedulingStats(): Promise<{
    total: number;
    active: number;
    messagesSentToday: number;
    upcomingToday: number;
  }> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const [totalResult, activeResult, sentTodayResult, upcomingTodayResult] = await Promise.all([
        supabase.from('scheduled_messages').select('id', { count: 'exact', head: true }),
        supabase.from('scheduled_messages').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('scheduled_messages').select('id', { count: 'exact', head: true })
          .gte('last_sent_at', startOfDay.toISOString())
          .lte('last_sent_at', endOfDay.toISOString()),
        supabase.from('scheduled_messages').select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .gte('next_scheduled_at', startOfDay.toISOString())
          .lte('next_scheduled_at', endOfDay.toISOString()),
      ]);

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        messagesSentToday: sentTodayResult.count || 0,
        upcomingToday: upcomingTodayResult.count || 0,
      };
    } catch (error) {
      console.error('Error fetching scheduling stats:', error);
      return { total: 0, active: 0, messagesSentToday: 0, upcomingToday: 0 };
    }
  }
}
