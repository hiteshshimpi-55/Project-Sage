import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatService } from './chat_service';
import { ChatServiceV2 } from '../screens/chats/service/chat_service';
import { UserService } from './user_service';

export class ActivationCheckService {
  // Check if user needs activation date message
  public static shouldSendActivationMessage(activationDate: string | undefined): boolean {
    if (!activationDate) {
      return false;
    }

    const activationTime = new Date(activationDate);
    const now = new Date();
    const timeDifference = now.getTime() - activationTime.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

    // Send message on specific days: 1, 3, 7, 14, 30 days after activation
    const messageDays = [7, 14];
    return messageDays.includes(daysDifference);
  }

  // Get the appropriate message based on days since activation
  public static getActivationMessage(activationDate: string): string {
    const activationTime = new Date(activationDate);
    const now = new Date();
    const timeDifference = now.getTime() - activationTime.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

    const messages = {
      1: "Welcome to Project Sage! 🎉 We're excited to have you on board. How are you finding the app so far?",
      3: "Hi there! It's been 3 days since you joined us. Do you have any questions about using the app? We're here to help! 😊",
      7: "A week has passed since you joined Project Sage! We hope you're enjoying the experience. Is there anything specific you'd like to know more about?",
      14: "Two weeks with Project Sage! 🌟 We'd love to hear your feedback. How has your experience been? Any suggestions for improvement?",
      30: "It's been a month since you joined us! 🎊 Thank you for being part of the Project Sage community. We value your participation and would love to hear about your journey so far."
    };

    return messages[daysDifference as keyof typeof messages] || "Thank you for being part of Project Sage! We're here if you need any assistance. 💙";
  }

  // Send activation follow-up message from admin
  public static async sendActivationFollowUp(userId: string, activationDate: string): Promise<void> {
    try {
      // Get admin user ID (assuming there's at least one admin)
      const adminUserId = await this.getAdminUserId();
      if (!adminUserId) {
        console.log('No admin user found to send activation message');
        return;
      }

      // Check if chat exists or create one between admin and user
      const chatResponse = await ChatService.checkIfChatExists(adminUserId, userId);
      
      let chatId = chatResponse?.chat_id;
      if (!chatId) {
        chatId = await ChatServiceV2.get_or_create_chat(adminUserId, userId);
      }

      if (!chatId) {
        throw new Error('Failed to create or retrieve chat');
      }

      // Get the chat user ID for the admin
      const chatUserId = await ChatService.getChatUserId(adminUserId, chatId);
      
      if (typeof chatUserId === 'string') {
        const message = this.getActivationMessage(activationDate);
        await ChatService.sendTextMessage(
          chatId,
          chatUserId,
          message,
          'activation_followup'
        );
        console.log('Activation follow-up message sent successfully');
      } else {
        throw new Error('Invalid chat user ID');
      }
    } catch (error) {
      console.error('Failed to send activation follow-up message:', error);
      // Don't throw error to prevent app crashes - this is a background feature
    }
  }

  // Get the first admin user ID from the system
  private static async getAdminUserId(): Promise<string | null> {
    try {
      return await UserService.getFirstAdminUserId();
    } catch (error) {
      console.error('Error getting admin user ID:', error);
      return null;
    }
  }

  // Check and send activation message if needed
  public static async checkAndSendActivationMessage(userId: string, activationDate: string | undefined): Promise<void> {
    if (!activationDate || !this.shouldSendActivationMessage(activationDate)) {
      return;
    }

    // Check if we've already sent a message for this specific day
    const messageKey = `activation_message_${userId}_${activationDate}`;
    const lastMessageDate = await this.getLastMessageDate(messageKey);
    
    const today = new Date().toDateString();
    if (lastMessageDate === today) {
      // Already sent message today
      return;
    }

    await this.sendActivationFollowUp(userId, activationDate);
    await this.setLastMessageDate(messageKey, today);
  }

  // AsyncStorage-based tracking for message dates
  private static async getLastMessageDate(key: string): Promise<string | null> {
    try {
      const storedDate = await AsyncStorage.getItem(key);
      return storedDate;
    } catch (error) {
      console.error('Error retrieving message date:', error);
      return null;
    }
  }

  private static async setLastMessageDate(key: string, date: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, date);
      console.log(`Stored message date: ${key} = ${date}`);
    } catch (error) {
      console.error('Error storing message date:', error);
    }
  }
}
