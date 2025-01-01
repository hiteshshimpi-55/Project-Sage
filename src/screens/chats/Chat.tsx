import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import supabase from '../../core/supabase';
import { ChatService, Message } from './service';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from 'src/App';

// Types

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

interface ChatScreenProps {
  route: ChatScreenRouteProp;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatUserId, setCurrentChatUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initialize chat and user states
  const initialize = useCallback(async () => {
    try {
      const _currentUserId = await ChatService.getCurrentUserId();
      if (!_currentUserId) {
        throw new Error('Unable to fetch current user ID.');
      }
      setCurrentUserId(_currentUserId);

      const existingChat = await ChatService.checkIfChatExists(
        _currentUserId,
        route.params.id
      );

      if (existingChat?.chat_id) {
        console.log('Existing chat found:', existingChat);
        const chatUserId = await ChatService.getChatUserId(
          _currentUserId,
          existingChat.chat_id
        );
        if (chatUserId) {
          console.log('Chat user ID:', chatUserId);
          setCurrentChatId(existingChat.chat_id);
          setCurrentChatUserId(chatUserId);
        } else {
          const newChatUserId = await ChatService.createChatUser(
            _currentUserId,
            existingChat.chat_id
          );
          console.log('New chat user ID:', newChatUserId);
          setCurrentChatId(existingChat.chat_id);
          setCurrentChatUserId(newChatUserId);
        }
      } else {
        const newChatId = await ChatService.createOneToOneChat(
          route.params.id,
          _currentUserId
        );

        if (newChatId) {
          console.log('New chat ID:', newChatId);
          const newChatUserId = await ChatService.createChatUser(
            _currentUserId,
            newChatId
          );
          setCurrentChatId(newChatId);
          setCurrentChatUserId(newChatUserId);
        } else {
          throw new Error('Failed to create a new chat.');
        }
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  }, [route.params.id]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!currentChatId) return;

    try {
      const { data, error } = await supabase
        .from('message')
        .select('*')
        .eq('chat_id', currentChatId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [currentChatId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentChatId) return;

    const channel = supabase
      .channel('realtime:message')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message',
          filter: `chat_id=eq.${currentChatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prevMessages) => [newMessage, ...prevMessages]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChatId]);

  // Handle sending a message
  const handleSend = async () => {
    if (!inputText.trim() || !currentChatId || !currentUserId) return;

    try {
      const { error } = await supabase.from('message').insert({
        text: inputText.trim(),
        chat_id: currentChatId,
        created_by: currentChatUserId,
        type: 'text',
        media_url: '',
      });

      if (error) {
        console.error('Error sending message:', error);
      } else {
        setInputText('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Render a single message
  const renderMessage = ({ item }: { item: Message }) => {

    const isCurrentUser = item.created_by === currentChatUserId;

    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText,
          ]}
        >
          {item.text}
        </Text>
        <Text style={styles.timeText}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  // Initial setup
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          style={styles.messageList}
          contentContainerStyle={styles.messageList}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginVertical: 4,
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#E8E8E8',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#000000',
  },
  timeText: {
    fontSize: 10,
    color: '#888888',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatScreen;
