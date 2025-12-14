# Scheduled Messages Feature - Setup Guide

## Overview

This feature allows admin users to schedule automated messages for active users with the following pattern:
- **1st Message**: Immediately when scheduled
- **2nd Message**: After 7 days  
- **3rd Message**: After 14 days (7 days after 2nd)
- **4th+ Messages**: Every 15 days thereafter

## 🗄️ Database Setup

### Step 1: Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create scheduled_messages table
CREATE TABLE scheduled_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL DEFAULT 'You have an appointment tomorrow',
    schedule_start_date TIMESTAMPTZ NOT NULL,
    message_count INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    next_scheduled_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_scheduled_messages_next_scheduled ON scheduled_messages(next_scheduled_at) WHERE is_active = true;
CREATE INDEX idx_scheduled_messages_user_id ON scheduled_messages(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_messages_updated_at 
    BEFORE UPDATE ON scheduled_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Admin users can manage all scheduled messages" ON scheduled_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Users can view their own scheduled messages" ON scheduled_messages
    FOR SELECT USING (user_id = auth.uid());
```

## 🔧 Supabase Edge Function Setup

### Step 2: Deploy Edge Function

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Replace `YOUR_PROJECT_REF` with your actual Supabase project reference.

4. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy process-scheduled-messages
   ```

### Step 3: Set Up Automatic Processing (Cron Job)

1. **Enable pg_cron extension** in Supabase Dashboard:
   - Go to Database > Extensions
   - Enable "pg_cron"

2. **Schedule the function to run every hour**:
   ```sql
   SELECT cron.schedule(
     'process-scheduled-messages',
     '0 * * * *', -- Every hour at minute 0
     $$
     SELECT
       net.http_post(
         url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-scheduled-messages',
         headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
         body:='{}'::jsonb
       ) as request_id;
     $$
   );
   ```
   
   Replace:
   - `YOUR_PROJECT_REF` with your Supabase project reference
   - `YOUR_ANON_KEY` with your Supabase anon key

## 📱 How to Use the Feature

### For Admin Users:

1. **Navigate to Admin Dashboard**
   - Log in as an admin user
   - Go to the Admin Dashboard

2. **Schedule Messages for a User**
   - Find an active user in the user list
   - Click the "Schedule Messages" button
   - Enter a custom message or use the default
   - Confirm to start scheduling

3. **Manage Scheduled Messages**
   - Click "Manage Scheduled Messages" button in Admin Dashboard
   - View all active schedules
   - See statistics (active schedules, messages sent today, etc.)
   - Stop scheduling for specific users
   - Manually trigger message processing

4. **Update or Stop Scheduling**
   - For users with active schedules, click "Manage Schedule"
   - Choose to stop scheduling or update message content

### Message Schedule Pattern:

```
User Activation → Schedule Created
Day 0: 1st Message sent immediately
Day 7: 2nd Message sent
Day 14: 3rd Message sent  
Day 29: 4th Message sent (15 days after 3rd)
Day 44: 5th Message sent (15 days after 4th)
...and so on every 15 days
```

## 🔧 Technical Architecture

### Services Created:

1. **MessageSchedulerService** (`src/utils/message_scheduler_service.ts`)
   - Core service for managing scheduled messages
   - Handles CRUD operations for schedules
   - Calculates next message dates
   - Integrates with chat system

2. **ScheduledMessageProcessor** (`src/utils/scheduled_message_processor.ts`)
   - Handles manual triggering of message processing
   - Calls Supabase Edge Function
   - Provides fallback processing methods

3. **Edge Function** (`supabase/functions/process-scheduled-messages/index.ts`)
   - Automated message processing
   - Runs on schedule via cron job
   - Sends messages and updates schedules

### UI Components Updated:

1. **UserCard Component**
   - Added "Schedule Messages" / "Manage Schedule" button
   - Shows visual indicator for users with active schedules

2. **AdminDashboard**
   - Integrated scheduling functionality
   - Added navigation to scheduled messages management
   - Enhanced user management with scheduling options

3. **ScheduledMessagesScreen** (New)
   - Dedicated screen for managing all scheduled messages
   - Statistics dashboard
   - Manual message processing trigger
   - Individual schedule management

## 🧪 Testing the Feature

### Manual Testing Steps:

1. **Create a Schedule**:
   - Login as admin
   - Go to Admin Dashboard
   - Find an active user
   - Click "Schedule Messages"
   - Enter a test message
   - Confirm creation

2. **Verify Schedule Creation**:
   - Click "Manage Scheduled Messages"
   - Verify the new schedule appears
   - Check that next message is scheduled for today

3. **Test Message Processing**:
   - In Scheduled Messages screen, click "Process Due Messages"
   - Check that the message was sent in the chat
   - Verify next message is scheduled for 7 days later

4. **Test Schedule Management**:
   - Go back to Admin Dashboard
   - Find the same user (should now show "Manage Schedule")
   - Test updating message content
   - Test stopping the schedule

### Automated Testing:

The Edge Function will automatically process messages every hour. You can monitor this in:
- Supabase Dashboard > Edge Functions > Logs
- Scheduled Messages screen statistics

## 🚨 Important Notes

1. **User Deactivation**: When a user is deactivated, their scheduled messages are automatically stopped.

2. **Message Delivery**: Messages are sent through the existing chat system, creating chats between admin and user if they don't exist.

3. **Timezone Considerations**: All times are stored in UTC. The scheduling logic uses the server timezone.

4. **Error Handling**: The system includes comprehensive error handling and logging for debugging.

5. **Performance**: The system is designed to handle multiple scheduled messages efficiently with proper database indexing.

## 🔍 Monitoring and Maintenance

### Check System Health:

1. **Database Queries**:
   ```sql
   -- Check active schedules
   SELECT COUNT(*) FROM scheduled_messages WHERE is_active = true;
   
   -- Check overdue messages
   SELECT COUNT(*) FROM scheduled_messages 
   WHERE is_active = true AND next_scheduled_at < NOW();
   
   -- Check recent activity
   SELECT COUNT(*) FROM scheduled_messages 
   WHERE last_sent_at > NOW() - INTERVAL '24 hours';
   ```

2. **Edge Function Logs**:
   - Monitor in Supabase Dashboard > Edge Functions
   - Check for processing errors or performance issues

3. **Cron Job Status**:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-scheduled-messages';
   ```

This feature provides a robust, scalable solution for automated user engagement through scheduled messaging while maintaining clean architecture and comprehensive error handling.
