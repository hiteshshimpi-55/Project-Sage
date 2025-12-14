
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const handleRequest = async (req:any) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const now = new Date()
    console.log(`Processing scheduled messages at ${now.toISOString()}`)

    // Get all due messages
    const { data: dueMessages, error: fetchError } = await supabaseAdmin
      .from('scheduled_messages')
      .select('*')
      .eq('is_active', true)
      .lte('next_scheduled_at', now.toISOString())

    if (fetchError) {
      console.error('Error fetching due messages:', fetchError)
      throw fetchError
    }

    console.log(`Found ${dueMessages?.length || 0} due messages`)

    if (!dueMessages || dueMessages.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No messages due for processing',
          processed: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    let processedCount = 0
    const errors: string[] = []

    // Process each due message
    for (const message of dueMessages) {
      try {
        await processScheduledMessage(supabaseAdmin, message)
        processedCount++
        console.log(`Successfully processed message for user ${message.user_id}`)
      } catch (error) {
        const errorMsg = `Failed to process message for user ${message.user_id}: ${(error as Error)?.message ?? 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: processedCount,
        total: dueMessages.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in process-scheduled-messages function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error)?.message ?? 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function processScheduledMessage(supabaseAdmin: any, scheduledMessage: any) {
  // Send the message via chat system
  await sendMessageViaChat(supabaseAdmin, scheduledMessage)

  // Calculate next message date
  const newMessageCount = scheduledMessage.message_count + 1
  const startDate = new Date(scheduledMessage.schedule_start_date)
  const nextMessageDate = calculateNextMessageDate(startDate, newMessageCount)

  // Update the scheduled message record
  const { error: updateError } = await supabaseAdmin
    .from('scheduled_messages')
    .update({
      message_count: newMessageCount,
      last_sent_at: new Date().toISOString(),
      next_scheduled_at: nextMessageDate.toISOString(),
    })
    .eq('id', scheduledMessage.id)

  if (updateError) {
    throw new Error(`Failed to update scheduled message: ${updateError.message}`)
  }

  console.log(`Message sent to user ${scheduledMessage.user_id}, next message scheduled for ${nextMessageDate.toISOString()}`)
}

async function sendMessageViaChat(supabaseAdmin: any, scheduledMessage: any) {
  console.log(`Attempting to send message from admin ${scheduledMessage.admin_id} to user ${scheduledMessage.user_id}`)
  
  try {
    // Use the same RPC function that your app uses
    console.log('Calling get_or_create_chat RPC function...')
    const { data: chatId, error: chatError } = await supabaseAdmin.rpc('get_or_create_chat', {
      current_user_id: scheduledMessage.admin_id,
      target_user_id: scheduledMessage.user_id,
    });

    if (chatError) {
      console.error('Error from get_or_create_chat RPC:', chatError)
      throw new Error(`Failed to get or create chat: ${JSON.stringify(chatError)}`)
    }

    console.log('Chat ID from RPC:', chatId)

    // Get admin's chat_user_id using the same method as your app
    console.log('Getting admin chat user ID...')
    
    // Try chat_user (singular) first - based on your existing code
    const { data: adminChatUser, error: chatUserError } = await supabaseAdmin
      .from('chat_user')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', scheduledMessage.admin_id)
      .single()

    if (chatUserError || !adminChatUser) {
      console.error('Chat user error:', chatUserError)
      throw new Error(`Failed to get admin chat user ID: ${JSON.stringify(chatUserError)}`)
    }

    console.log('Admin chat user ID:', adminChatUser.id)

    // Send the message using the exact same format as ChatService.sendTextMessage
    console.log('Sending message using your app format...')
    const messageData = {
      chat_id: chatId,
      created_by: adminChatUser.id,  // This is the key difference!
      type: 'scheduled_reminder',
      text: scheduledMessage.message_content,  // 'text' not 'content'
      media_url: '',  // Required field
    }
    
    console.log('Message data:', messageData)
    
    const { error: messageError } = await supabaseAdmin
      .from('message')  // 'message' not 'messages'
      .insert(messageData)

    if (messageError) {
      console.error('Message creation error:', messageError)
      throw new Error(`Failed to send message: ${JSON.stringify(messageError)}`)
    }
    
    console.log('Message sent successfully!')
    
  } catch (error) {
    console.error('Complete sendMessageViaChat error:', error)
    throw error
  }
}

function calculateNextMessageDate(startDate: Date, messageCount: number): Date {
  const nextDate = new Date(startDate)
  
  if (messageCount < 3) {
    // First 3 messages: every 7 days
    nextDate.setDate(startDate.getDate() + (messageCount * 7))
  } else {
    // After 3rd message: 15-day intervals
    // First 3 messages took 21 days (0, 7, 14), then add 15-day intervals
    const daysAfterThirdMessage = (messageCount - 3) * 15
    nextDate.setDate(startDate.getDate() + 21 + daysAfterThirdMessage)
  }
  
  return nextDate
}
