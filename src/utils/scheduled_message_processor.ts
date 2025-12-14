import { MessageSchedulerService } from './message_scheduler_service';

export class ScheduledMessageProcessor {
  /**
   * Manually trigger processing of due scheduled messages
   * This can be used for testing or as a fallback
   */
  public static async processDueMessages(): Promise<{
    success: boolean;
    processed: number;
    errors: string[];
  }> {
    try {
      console.log('Starting manual processing of due messages...');
      
      // Use the MessageSchedulerService to process messages
      const result = await MessageSchedulerService.processDueMessages();
      
      return {
        success: result.success,
        processed: result.processed,
        errors: result.errors
      };
    } catch (error) {
      console.error('Error processing due messages:', error);
      return {
        success: false,
        processed: 0,
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Call the Supabase Edge Function to process messages
   */
  public static async triggerEdgeFunction(): Promise<{
    success: boolean;
    processed: number;
    total?: number;
    errors?: string[];
  }> {
    try {
      const supabaseUrl = "https://ihoxqtvcgndxhanutpbe.supabase.co";
      const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlob3hxdHZjZ25keGhhbnV0cGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1OTIzMjAsImV4cCI6MjA2MjE2ODMyMH0.xyJX_YtBXQqD9kKVD0-guN2zzSK3ZE3tJ85jLPTP-o0";
      
      const response = await fetch(`${supabaseUrl}/functions/v1/process-scheduled-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Edge function result:', result);
      
      return result;
    } catch (error) {
      console.error('Error calling edge function:', error);
      return {
        success: false,
        processed: 0,
        errors: [(error as Error).message]
      };
    }
  }
}
