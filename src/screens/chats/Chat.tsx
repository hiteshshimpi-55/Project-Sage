import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import supabase from '../../core/supabase';
import {ChatService, Message} from '../../utils/chat_service';
import {ChatServiceV2} from './service/chat_service';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from 'src/App';
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
} from 'phosphor-react-native';
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import AudioPlayer from '@components/molecules/Chat/AudioPlayer';
import {useUser} from '@hooks/UserContext';

// Types
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

const audioRecorderPlayer = new AudioRecorderPlayer();

interface ChatScreenProps {
  route: ChatScreenRouteProp;
}

const ChatScreen: React.FC<ChatScreenProps> = ({route}) => {
  const navigation = useNavigation();
  const {user: userContext} = useUser();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatUserId, setCurrentChatUserId] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<{[key: string]: string}>({});
  const [chatUserName, setChatUserName] = useState<string>(route.params.name || '');
  const [isLoading, setIsLoading] = useState(false);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState('0:00');
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  


  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const handleImagePress = (imageUrl: string) => {
    setExpandedImage(imageUrl);
  };

  const closeModal = () => {
    setExpandedImage(null);
  };

  // Initialize chat
  const initialize = useCallback(async () => {
    if (!userContext?.id) return;    
    try {

      let chat_id:any = null;
      if (route.params.type === 'one-to-many') {
        chat_id = route.params.id;
      }else{
        chat_id = await ChatServiceV2.get_or_create_chat(
          userContext.id,
          route.params.id
        );
      }
      const chat_user_id = await ChatService.getChatUserId(
        userContext.id,
        chat_id,
      );

      if (chat_user_id === null ){
        throw new Error('Chat User ID not found');
      }
      console.log("Chat ID",chat_id,chat_user_id);
      setCurrentChatId(chat_id);
      setCurrentChatUserId(chat_user_id);
      await ChatServiceV2.markAsRead(chat_user_id!);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  }, [userContext?.id, route.params.id]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!currentChatId) return;

    try {
      const {data, error} = await supabase
        .from('message')
        .select('*')
        .eq('chat_id', currentChatId)
        .order('created_at', {ascending: false})
        .limit(20);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [currentChatId]);

  // Fetch usernames
  const fetchAndSetUsernames = useCallback(async () => {
    if (!currentChatId) return;

    try {
      const userMap = await ChatService.getAllUsersFromSystemWithChatUserId(
        currentChatId,
      );
      setUsernames(userMap);
    } catch (error) {
      console.error('Error fetching usernames:', error);
    }
  }, [currentChatId]);

  // Setup real-time subscription
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
          const newMessage = payload.new as Message;
          console.log('New message received:', newMessage);
          setMessages(prevMessages => [newMessage, ...prevMessages]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChatId]);

  // Initialize effects
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!currentChatId) return;
  
    const loadChatData = async () => {
      await Promise.all([
        fetchMessages(),
        fetchAndSetUsernames(),
      ]);
    };
  
    loadChatData();
  }, [currentChatId, fetchMessages, fetchAndSetUsernames]);

  // Message functions
  const handleSend = async () => {

    console.log("handleSend",currentChatId,currentChatUserId,inputText.trim());

    if (!currentChatId || !currentChatUserId) return;
    try {
      setIsLoading(true);
      
      if (audioPath) {
        await sendAudio();
      } else if (inputText.trim()) {
        await ChatService.sendTextMessage(
          currentChatId,
          currentChatUserId,
          inputText.trim(),
        );
        setInputText('');
      }

      await ChatServiceV2.markAsRead(currentChatUserId!);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsLoading(false);
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

  const handleSendImage = async (imageUri: string) => {
    if (!currentChatId || !currentChatUserId) return;
    
    try {
      setIsLoading(true);
      await ChatService.sendImageMessage(
        currentChatId,
        currentChatUserId,
        imageUri,
      );

      await ChatServiceV2.markAsRead(currentChatUserId!);
    } catch (error) {
      console.error('Error sending image:', error);
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
        await handleSendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleLongPress = (itemId: string) => {
    if (!userContext?.isAdmin) return;

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMessage(itemId),
        },
      ],
    );
  };

  // Audio recording functions
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record audio.',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const permission = PERMISSIONS.IOS.MICROPHONE;
      const status = await check(permission);

      if (status === RESULTS.GRANTED) {
        return true;
      } else {
        const newStatus = await request(permission);
        return newStatus === RESULTS.GRANTED;
      }
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Microphone permission is required for recording audio.');
        return;
      }

      setIsRecording(true);
      const path = await audioRecorderPlayer.startRecorder();
      setAudioPath(path);
      
      let counter = 0;
      const interval = setInterval(() => {
        counter += 1;
        setRecordingDuration(
          `${Math.floor(counter / 60)}:${(counter % 60)
            .toString()
            .padStart(2, '0')}`,
        );
      }, 1000);

      // Auto-stop after 60 seconds
      setTimeout(() => {
        clearInterval(interval);
        if (isRecording) {
          stopRecording();
        }
      }, 60000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
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

  const sendAudio = async () => {
    if (!audioPath || !currentChatId || !currentChatUserId) return;
    
    try {
      await ChatService.sendAudioMessage(
        currentChatId,
        currentChatUserId,
        audioPath,
      );
      deleteRecording();
    } catch (error) {
      console.error('Error sending audio:', error);
      Alert.alert('Error', 'Failed to send audio message');
    }
  };

  // Cleanup audio resources when component unmounts
  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  // Memoized components
  const renderMessage = useCallback(({item}: {item: Message}) => {

    const messageTime = new Date(item.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  
    const isCurrentUser = item.created_by === currentChatUserId;
  
    return (
      <>
        <TouchableOpacity
          onLongPress={() => handleLongPress(item.id)}
          activeOpacity={0.9}
        >
          <View
            style={[
              styles.messageBubble,
              isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            ]}
          >
            {route.params.type === 'one-to-many' &&
              !isCurrentUser &&
              usernames[item.created_by] && (
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
                isCurrentUser
                  ? styles.currentUserTimeText
                  : styles.otherUserTimeText
              }
            >
              {messageTime}
            </Text>
          </View>
        </TouchableOpacity>
  
        {/* Modal for Expanded Image */}
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
  }, [currentChatUserId, route.params.type, usernames, handleLongPress]);

  // Input area rendering based on state
  const renderInputArea = useMemo(() => {
    if (isRecording) {
      return (
        <Text style={styles.recordingText}>
          🎙️ Recording... {recordingDuration}
        </Text>
      );
    } else if (audioPath) {
      return (
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
                  width: duration
                    ? `${(currentPosition / duration) * 100}%`
                    : '0%',
                },
              ]}
            />
            <Text style={styles.progressText}>
              {new Date(currentPosition).toISOString().substr(14, 5)} /{' '}
              {new Date(duration).toISOString().substr(14, 5)}
            </Text>
          </View>

          <TouchableOpacity onPress={deleteRecording}>
            <Trash size={24} color={theme.colors.secondary} />
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
      );
    }
  }, [
    isRecording, 
    recordingDuration, 
    audioPath, 
    togglePlayback, 
    isPlaying, 
    currentPosition, 
    duration, 
    deleteRecording, 
    inputText
  ]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <CaretLeft size={24} color={theme.colors.text_700} weight="bold" />
        </TouchableOpacity>
        <Image
          source={{uri: 'https://picsum.photos/200/300'}}
          style={styles.profileImage}
        />
        <Text style={styles.appBarText}>{chatUserName}</Text>
      </View>
      <View style={styles.divider} />
      
      {/* Chat area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          inverted
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
        />
        
        {/* Input area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            onPress={handleImagePicker}
            style={styles.imageButton}>
            <ImageIcon size={24} color={theme.colors.primary_600} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            {renderInputArea}
          </View>

          <View style={styles.rightButtons}>
            {!audioPath && !isPlaying && (
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                style={styles.recordButton}>
                {isRecording ? (
                  <Stop size={24} weight="fill" color={theme.colors.primary_600} />
                ) : (
                  <Microphone size={24} color={theme.colors.primary_600} />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.sendButton} 
              onPress={handleSend}
              disabled={(!inputText.trim() && !audioPath) || isLoading}>
              <PaperPlaneTilt
                weight="fill"
                size={32}
                color={(!inputText.trim() && !audioPath) || isLoading 
                  ? theme.colors.grey_400 
                  : theme.colors.primary_600}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      {/* Loading overlay */}
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
    backgroundColor: theme.colors.grey_100,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
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
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  imageButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: 10,
  },
  input: {
    backgroundColor: theme.colors.grey_300,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: theme.fonts.satoshi_regular,
    maxHeight: 100,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginRight: 8,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.grey_300,
    borderRadius: 20,
  },
  progressContainer: {
    flex: 1,
    height: 10,
    backgroundColor: theme.colors.grey_300,
    borderRadius: 5,
    marginTop: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary_600,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 12,
    fontFamily: theme.fonts.satoshi_regular,
    color: theme.colors.primary_400,
  },
  recordingText: {
    fontSize: 18,
    fontFamily: theme.fonts.satoshi_bold,
    color: theme.colors.text_700,
    textAlign: 'center',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
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
  expandedImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 28,
    color: 'white',
  },
});

export default ChatScreen;