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
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import supabase from '../../core/supabase';
import { ChatService, Message } from '../../utils/chat_service';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from 'src/App';
import theme from '@utils/theme';
import { PaperPlaneTilt, CaretLeft, Image as ImageIcon } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';

// Types
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

interface ChatScreenProps {
  route: ChatScreenRouteProp;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatUserId, setCurrentChatUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<{ [key: string]: string }>({});
  const [chatUserName, setChatUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false); // Loader state

  const initialize = useCallback(async () => {
    try {
      const currentUserId = await ChatService.getCurrentUserId();
      if (!currentUserId) return;
      const chatDetails = await ChatService.getChatDetails(currentUserId, route.params.id, route.params.type);
      if (!chatDetails) return;
      const { chatId, chatUserId } = chatDetails;
      if (!chatId || !chatUserId) return;
      setCurrentChatId(chatId);
      setCurrentChatUserId(chatUserId);
      setCurrentUserId(currentUserId);
      setChatUserName(route.params.name);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  }, [route.params.id, route.params.name]);

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

  const fetchAndSetUsernames = useCallback(async () => {
    if (!currentChatId) return;

    try {
      const userMap = await ChatService.getAllUsersFromSystemWithChatUserId(currentChatId);
      setUsernames(userMap);
    } catch (error) {
      console.error('Error fetching usernames:', error);
    }
  }, [currentChatId]);

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

  const handleSend = async () => {
    if (!inputText.trim() || !currentChatId || !currentUserId) return;
    await ChatService.sendTextMessage(currentChatId, currentChatUserId!, inputText.trim())
    .then(() => {
      setInputText('')
    })
    .catch((error) => {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message);
    });
  };

  const handleSendImage = async (imageUri: string) => {
    if (!currentChatId || !currentChatUserId || !currentUserId) return;
    setIsLoading(true)
    await ChatService.sendImageMessage(currentChatId, currentChatUserId, imageUri)
    .then(() => {
      setIsLoading(false)
    })
    .catch((error) => {
      setIsLoading(false)
      console.error('Error sending image:', error);
      Alert.alert('Error', error.message);
    });
  };

  const handleImagePicker = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      if (imageUri) {
        await handleSendImage(imageUri);
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.created_by === currentChatUserId;
    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
      >
        {route.params.type === 'one-to-many' && !isCurrentUser && usernames[item.created_by] && (
          <Text style={styles.username}>{usernames[item.created_by]}</Text>
        )}
        {item.type === 'image' ? (
          <Image source={{ uri: item.media_url }} style={styles.imageMessage} />
        ) : (
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText,
            ]}
          >
            {item.text}
          </Text>
        )}
        <Text style={isCurrentUser ? styles.currentUserTimeText : styles.otherUserTimeText}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    fetchMessages();
    fetchAndSetUsernames();
  }, [fetchMessages, fetchAndSetUsernames]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <CaretLeft size={24} color={theme.colors.text_700} weight="bold" />
        </TouchableOpacity>
        <Image source={{ uri: 'https://picsum.photos/200/300' }} style={styles.profileImage} />
        <Text style={styles.appBarText}>{chatUserName}</Text>
      </View>
      <View style={styles.divider} />
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
          <TouchableOpacity onPress={handleImagePicker} style={styles.imageButton}>
            <ImageIcon size={24} color={theme.colors.primary_600} />
          </TouchableOpacity>
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
            <PaperPlaneTilt weight="fill" size={32} color={theme.colors.primary_600} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary_600} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  appBarText: {
    fontSize: 18,
    fontFamily: theme.fonts.satoshi_bold,
    fontWeight: 'semibold',
    color: theme.colors.text_700,
  },
  divider: {
    height: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.grey_100,
  },
  currentUserTimeText: {
    fontSize: 10,
    fontFamily: theme.fonts.satoshi_regular,
    color: theme.colors.white,
  },
  otherUserTimeText: {
    fontSize: 10,
    fontFamily: theme.fonts.satoshi_regular,
    color: theme.colors.text_500,
  },
  messageList: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    minWidth: '20%',
    padding: 10,
    borderRadius: 15,
    marginVertical: 4,
  },
  currentUserBubble: {
    backgroundColor: theme.colors.primary_600,
    alignSelf: 'flex-end',
    alignItems: 'flex-start',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: theme.colors.grey_100,
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: theme.fonts.satoshi_regular,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: theme.colors.text_900,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary_600,
    marginBottom: 4,
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
    bottom: 0,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.grey_300,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: theme.fonts.satoshi_regular,
    maxHeight: 100,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  imageButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default ChatScreen;