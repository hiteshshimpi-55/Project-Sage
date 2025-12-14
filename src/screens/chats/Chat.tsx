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
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import supabase from '../../core/supabase';
import { ChatService, Message } from '../../utils/chat_service';
import { ChatServiceV2 } from './service/chat_service';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from 'src/App';
import theme from '@utils/theme';
import {
  PaperPlaneTilt,
  Trash,
  Play,
  Pause,
  Microphone,
  Stop,
  CaretLeft,
  Image as ImageIcon,
  Info,
  X,
} from 'phosphor-react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import AudioPlayer from '@components/molecules/Chat/AudioPlayer';
import { useUser } from '@hooks/UserContext';
import { Linking } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import DeviceInfo from 'react-native-device-info';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

// Types
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

const audioRecorderPlayer = new AudioRecorderPlayer();

interface ChatScreenProps {
  route: ChatScreenRouteProp;
}

// Utility function to format message timestamp
const formatMessageTime = (timestamp: string): string => {
  const messageDate = new Date(timestamp);
  const now = new Date();

  // Get start of today
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get start of this week (Sunday)
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  // Format time consistently
  const time = messageDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Check if message is from today
  if (messageDate >= startOfToday) {
    // Current day: Show time like 7:30 AM
    return time;
  }

  // Check if message is from this week (excluding today)
  if (messageDate >= startOfWeek) {
    // Current week excluding current day: Show Monday 7:30 AM
    const dayName = messageDate.toLocaleDateString([], { weekday: 'long' });
    return `${dayName} ${time}`;
  }

  // Check if message is from current year
  if (messageDate.getFullYear() === now.getFullYear()) {
    // Apart from current week but same year: Show Jun 18, 7:30 AM
    const month = messageDate.toLocaleDateString([], { month: 'short' });
    const day = messageDate.getDate();
    return `${month} ${day}, ${time}`;
  }

  // Apart from current year: Show Jun 18, 2024, 7:30 AM
  const month = messageDate.toLocaleDateString([], { month: 'short' });
  const day = messageDate.getDate();
  const year = messageDate.getFullYear();
  return `${month} ${day}, ${year}, ${time}`;
};

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user: userContext } = useUser();

  // Animation values
  const pulseAnimation = useState(new Animated.Value(1))[0];
  const inputWidthAnimation = useState(new Animated.Value(1))[0];

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatUserId, setCurrentChatUserId] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<{ [key: string]: string }>({});
  const [chatUserName, setChatUserName] = useState<string>(route.params.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState('0:00');
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showRecordingControls, setShowRecordingControls] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
      Animated.timing(inputWidthAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(inputWidthAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isRecording, pulseAnimation, inputWidthAnimation]);

  const handleImagePress = (imageUrl: string) => {
    setExpandedImage(imageUrl);
  };

  const closeModal = () => {
    setExpandedImage(null);
  };

  const initialize = useCallback(async () => {
    if (!userContext?.id) return;
    try {
      let chat_id: any = null;
      if (route.params.type === 'one-to-many') {
        chat_id = route.params.id;
      } else {
        chat_id = await ChatServiceV2.get_or_create_chat(userContext.id, route.params.id);
      }
      const chat_user_id = await ChatService.getChatUserId(userContext.id, chat_id);
      if (chat_user_id === null) {
        throw new Error('Chat User ID not found');
      }
      setCurrentChatId(chat_id);
      setCurrentChatUserId(chat_user_id);
      await ChatServiceV2.markAsRead(chat_user_id!);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  }, [userContext?.id, route.params.id]);

  const loadMessages = useCallback(async (loadMore = false) => {
    if (!currentChatId || (loadMore && !hasMore) || (loadMore && isLoadingMore)) return;

    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        // Only set main loading state if we don't have messages yet
        // or if we want to show a clear refresh
        if (messages.length === 0) setIsLoading(true);
      }

      let query = supabase
        .from('message')
        .select('*')
        .eq('chat_id', currentChatId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (loadMore && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        query = query.lt('created_at', lastMessage.created_at);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      const newMessages = data || [];
      if (newMessages.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (loadMore) {
        setMessages(prev => [...prev, ...newMessages]);
      } else {
        setMessages(newMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [currentChatId, messages, hasMore, isLoadingMore]);

  // Keep old name for compatibility if needed, but better to use loadMessages
  const fetchMessages = () => loadMessages(false);

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
        payload => {
          console.log('Real-time message received:', payload);
          const newMessage = payload.new as Message;
          setMessages(prevMessages => {
            // Replace temporary message if it exists
            const tempIndex = prevMessages.findIndex(
              msg => msg.id.startsWith('temp-') && msg.text === newMessage.text && msg.type === newMessage.type
            );
            if (tempIndex !== -1) {
              const updatedMessages = [...prevMessages];
              updatedMessages[tempIndex] = newMessage;
              return updatedMessages;
            }
            return [newMessage, ...prevMessages];
          });
          markAsRead();
        },
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
          setTimeout(() => channel.subscribe(), 5000);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChatId]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!currentChatId) return;
    const loadChatData = async () => {
      // Load initial messages
      await loadMessages(false);
      await fetchAndSetUsernames();
    };
    loadChatData();
  }, [currentChatId, fetchAndSetUsernames]); // Removed fetchMessages dependency to avoid loops

  const markAsRead = async () => {
    if (!currentChatUserId) return;
    try {
      await ChatServiceV2.markAsRead(currentChatUserId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSend = async () => {
    if (!currentChatId || !currentChatUserId) return;
    try {
      if (audioPath) {
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          chat_id: currentChatId,
          created_by: currentChatUserId,
          text: '',
          type: 'audio',
          created_at: new Date().toISOString(),
          media_url: audioPath,
        };
        setMessages(prevMessages => [tempMessage, ...prevMessages]);
        await sendAudio(tempMessage.id);
      } else if (inputText.trim()) {
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          chat_id: currentChatId,
          created_by: currentChatUserId,
          text: inputText.trim(),
          type: 'text',
          created_at: new Date().toISOString(),
          media_url: '',
        };
        setMessages(prevMessages => [tempMessage, ...prevMessages]);
        setInputText('');
        await ChatService.sendTextMessage(currentChatId, currentChatUserId, inputText.trim());
        await ChatServiceV2.markAsRead(currentChatUserId!);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages => prevMessages.filter(msg => !msg.id.startsWith('temp-')));
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await ChatService.deleteMessage(messageId);
      setMessages(prevMessages => prevMessages.filter(message => message.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const handleSendImage = async (imageUri: string, tempId: string) => {
    if (!currentChatId || !currentChatUserId) return;
    try {
      setIsLoading(true);
      await ChatService.sendImageMessage(currentChatId, currentChatUserId, imageUri);
      await ChatServiceV2.markAsRead(currentChatUserId!);
    } catch (error) {
      console.error('Error sending image:', error);
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempId));
      Alert.alert('Error', 'Failed to send image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
          id: tempId,
          chat_id: currentChatId!,
          created_by: currentChatUserId!,
          text: '',
          type: 'image',
          created_at: new Date().toISOString(),
          media_url: result.assets[0].uri,
        };
        setMessages(prevMessages => [tempMessage, ...prevMessages]);
        await handleSendImage(result.assets[0].uri, tempId);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setMessages(prevMessages => prevMessages.filter(msg => !msg.id.startsWith('temp-')));
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const copyMessage = async (message: Message) => {
    console.log('Copying message:', message.type, message.text?.substring(0, 50));
    try {
      if (message.type === 'text' || message.type === 'welcome_text') {
        Clipboard.setString(message.text);
        Alert.alert('Copied', 'Message copied to clipboard');
      } else if (message.type === 'image') {
        Alert.alert('Info', 'Cannot copy image messages');
      } else if (message.type === 'audio') {
        Alert.alert('Info', 'Cannot copy audio messages');
      }
    } catch (error) {
      console.error('Error copying message:', error);
      Alert.alert('Error', 'Failed to copy message');
    }
  };

  const handleLongPress = (itemId: string) => {
    const message = messages.find(msg => msg.id === itemId);
    if (!message) return;

    const baseOptions = [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: 'Copy',
        onPress: () => copyMessage(message),
      },
    ];

    // Create alert options based on user permissions
    if (userContext?.isAdmin) {
      Alert.alert('Message Options', 'Choose an action', [
        ...baseOptions,
        {
          text: 'Delete',
          style: 'destructive' as const,
          onPress: () => deleteMessage(itemId),
        },
      ]);
    } else {
      Alert.alert('Message Options', 'Choose an action', baseOptions);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setShowRecordingControls(true);
      const path = await audioRecorderPlayer.startRecorder();
      setAudioPath(path);
      let counter = 0;
      const interval = setInterval(() => {
        counter += 1;
        setRecordingDuration(
          `${Math.floor(counter / 60)}:${(counter % 60).toString().padStart(2, '0')}`,
        );
      }, 1000);
      setTimeout(() => {
        clearInterval(interval);
        if (isRecording) {
          stopRecording();
        }
      }, 60000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setShowRecordingControls(false);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    try {
      const path = await audioRecorderPlayer.stopRecorder();
      setAudioPath(path);
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const playAudio = async () => {
    if (!audioPath) return;
    try {
      setIsPlaying(true);
      await audioRecorderPlayer.startPlayer(audioPath);
      audioRecorderPlayer.addPlayBackListener(e => {
        setCurrentPosition(e.currentPosition);
        setDuration(e.duration);
        if (e.currentPosition === e.duration) {
          setIsPlaying(false);
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const pauseAudio = async () => {
    if (!audioPath || !isPlaying) return;
    try {
      setIsPlaying(false);
      await audioRecorderPlayer.pausePlayer();
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const resumeAudio = async () => {
    if (!audioPath) return;
    try {
      setIsPlaying(true);
      await audioRecorderPlayer.resumePlayer();
    } catch (error) {
      console.error('Error resuming audio:', error);
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer.removePlayBackListener();
    setAudioPath(null);
    setIsPlaying(false);
    setCurrentPosition(0);
    setDuration(0);
    setShowRecordingControls(false);
  };

  const togglePlayback = async () => {
    if (!audioPath) return;
    if (isPlaying) {
      await pauseAudio();
    } else {
      if (currentPosition > 0 && currentPosition < duration) {
        await resumeAudio();
      } else {
        setCurrentPosition(0);
        await playAudio();
      }
    }
  };

  const sendAudio = async (tempId: string) => {
    if (!audioPath || !currentChatId || !currentChatUserId) return;
    try {
      await ChatService.sendAudioMessage(currentChatId, currentChatUserId, audioPath);
      deleteRecording();
      setShowRecordingControls(false);
    } catch (error) {
      console.error('Error sending audio:', error);
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempId));
      Alert.alert('Error', 'Failed to send audio message');
    }
  };

  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const messageTime = formatMessageTime(item.created_at);
      const isCurrentUser = item.created_by === currentChatUserId;
      return (
        <>
          <TouchableOpacity onLongPress={() => handleLongPress(item.id)} activeOpacity={0.9}>
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
                <TouchableOpacity onPress={() => handleImagePress(item.media_url)}>
                  <Image source={{ uri: item.media_url }} style={styles.imageMessage} />
                </TouchableOpacity>
              ) : item.type === 'audio' ? (
                <AudioPlayer audioUrl={item.media_url} />
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
              <Text
                style={
                  isCurrentUser ? styles.currentUserTimeText : styles.otherUserTimeText
                }
              >
                {messageTime}
              </Text>
            </View>
          </TouchableOpacity>
          <Modal visible={!!expandedImage} transparent={true} animationType="fade">
            <View style={styles.modalContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              {expandedImage && (
                <Image source={{ uri: expandedImage }} style={styles.expandedImage} />
              )}
            </View>
          </Modal>
        </>
      );
    },
    [currentChatUserId, route.params.type, usernames, handleLongPress, messages],
  );

  const renderRecordingUI = () => {
    if (!showRecordingControls) return null;
    return (
      <View style={styles.recordingContainer}>
        {isRecording ? (
          <>
            <Animated.View
              style={[styles.recordingIndicator, { transform: [{ scale: pulseAnimation }] }]}
            />
            <View style={styles.recordingTextContainer}>
              <Text style={styles.recordingText}>Recording {recordingDuration}</Text>
              <Text style={styles.recordingHint}>Tap to stop</Text>
            </View>
            <TouchableOpacity style={styles.stopRecordingButton} onPress={stopRecording}>
              <Stop weight="fill" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.audioPreview}>
            <TouchableOpacity onPress={togglePlayback}>
              {isPlaying ? (
                <Pause weight="fill" size={24} color={theme.colors.primary_400} />
              ) : (
                <Play weight="fill" size={24} color={theme.colors.primary_400} />
              )}
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground} />
              <View
                style={[
                  styles.progressBar,
                  {
                    width: duration ? `${(currentPosition / duration) * 100}%` : '0%',
                  },
                ]}
              />
              <Text style={styles.progressText}>
                {new Date(currentPosition).toISOString().substr(14, 5)} /{' '}
                {new Date(duration).toISOString().substr(14, 5)}
              </Text>
            </View>
            <TouchableOpacity style={styles.deleteRecordingButton} onPress={deleteRecording}>
              <X size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <CaretLeft size={24} color={theme.colors.text_700} weight="bold" />
          </TouchableOpacity>
          <Image source={{ uri: 'https://picsum.photos/200/300' }} style={styles.profileImage} />
          <Text style={styles.appBarText}>{chatUserName}</Text>
          {currentChatId && route.params.type === 'one-to-many' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ChannelDetailsScreen', { id: currentChatId })}
              style={styles.infoButton}
            >
              <Info size={24} color={theme.colors.text_700} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.divider} />

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          inverted
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          extraData={messages}
          onEndReached={() => loadMessages(true)}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary_600} />
              </View>
            ) : null
          }
        />
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          {!showRecordingControls && (
            <TouchableOpacity onPress={handleImagePicker} style={styles.imageButton}>
              <ImageIcon size={24} color={theme.colors.primary_600} />
            </TouchableOpacity>
          )}
          <Animated.View style={[styles.inputWrapper, { flex: showRecordingControls ? 1 : inputWidthAnimation }]}>
            {showRecordingControls ? (
              renderRecordingUI()
            ) : (
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                multiline
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!isRecording}
              />
            )}
          </Animated.View>
          <View style={styles.rightButtons}>
            {!showRecordingControls && (
              <TouchableOpacity onPress={startRecording} style={styles.recordButton}>
                <Microphone size={24} color={theme.colors.primary_600} />
              </TouchableOpacity>
            )}
            {(!isRecording && (inputText.trim() || audioPath)) && (
              <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isLoading}>
                <PaperPlaneTilt
                  weight="fill"
                  size={32}
                  color={isLoading ? theme.colors.grey_400 : theme.colors.primary_600}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary_600} />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey_100,
  },
  backButton: { padding: 8, marginRight: 8 },
  profileImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  appBarText: {
    fontSize: 18,
    fontFamily: theme.fonts.satoshi_bold,
    fontWeight: 'semibold',
    color: theme.colors.text_700,
  },
  divider: { height: 2, backgroundColor: theme.colors.grey_100 },
  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: 10, paddingBottom: 10 },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: theme.colors.grey_100,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: theme.fonts.satoshi_regular,
  },
  currentUserText: { color: '#FFFFFF' },
  otherUserText: { color: theme.colors.text_900 },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary_600,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  imageButton: { justifyContent: 'center', alignItems: 'center', padding: 8 },
  inputWrapper: { flex: 1, marginHorizontal: 10 },
  input: {
    backgroundColor: theme.colors.grey_300,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: theme.fonts.satoshi_regular,
    maxHeight: 100,
  },
  rightButtons: { flexDirection: 'row', alignItems: 'center' },
  recordButton: { justifyContent: 'center', alignItems: 'center', padding: 8, marginRight: 8 },
  sendButton: { justifyContent: 'center', alignItems: 'center', padding: 8 },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.grey_300,
    borderRadius: 20,
    padding: 10,
    height: 56,
  },
  recordingIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.secondary,
    marginRight: 10,
  },
  recordingTextContainer: { flex: 1 },
  recordingText: {
    fontSize: 16,
    fontFamily: theme.fonts.satoshi_medium,
    color: theme.colors.text_700,
  },
  recordingHint: {
    fontSize: 12,
    fontFamily: theme.fonts.satoshi_regular,
    color: theme.colors.text_500,
    marginTop: 2,
  },
  stopRecordingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  progressContainer: {
    flex: 1,
    height: 10,
    backgroundColor: theme.colors.grey_300,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: { height: '100%', backgroundColor: theme.colors.primary_600 },
  progressText: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 12,
    fontFamily: theme.fonts.satoshi_regular,
    color: theme.colors.primary_400,
  },
  deleteRecordingButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.grey_400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  imageMessage: { width: 200, height: 200, borderRadius: 10 },
  currentUserTimeText: {
    fontSize: 10,
    fontFamily: theme.fonts.satoshi_regular,
    color: theme.colors.white,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  otherUserTimeText: {
    fontSize: 10,
    fontFamily: theme.fonts.satoshi_regular,
    color: theme.colors.text_500,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  progressBackground: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor: theme.colors.grey_400,
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedImage: { width: '90%', height: '80%', resizeMode: 'contain' },
  closeButton: { position: 'absolute', top: 40, right: 20, zIndex: 1 },
  closeButtonText: { fontSize: 28, color: 'white' },
  infoButton: { marginLeft: 'auto', paddingHorizontal: 12, justifyContent: 'center' },
});

export default ChatScreen;