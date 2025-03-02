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
  PermissionsAndroid,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import supabase from '../../core/supabase';
import { ChatService, Message } from '../../utils/chat_service';
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
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import AudioPlayer from '@components/molecules/Chat/AudioPlayer';

// Types
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

const audioRecorderPlayer = new AudioRecorderPlayer();
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
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState('0:00');
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);

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
    if (!currentChatId || !currentUserId) return;
    if (audioPath) {
      console.log('Sending audio:', audioPath);
      await sendAudio();
    } else {
      if (!inputText.trim()) return;
      await ChatService.sendTextMessage(currentChatId, currentChatUserId!, inputText.trim())
        .then(() => {
          setInputText('');
        })
        .catch((error) => {
        console.error('Error sending message:', error);
        Alert.alert('Error', error.message);
      });
    }
  };

  const handleSendImage = async (imageUri: string) => {
    if (!currentChatId || !currentChatUserId || !currentUserId) return;
    setIsLoading(true);
    await ChatService.sendImageMessage(currentChatId, currentChatUserId, imageUri)
      .then(() => {
        setIsLoading(false);
      })
      .catch((error) => {
        setIsLoading(false);
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
        ) :
        item.type === 'audio' ? (
          <AudioPlayer audioUrl={item.media_url} />
        ) :
        (
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

  // Voice Recording

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record audio.',
          buttonPositive: 'OK',
        }
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

      // const hasPermission = await requestPermission();
      // if (!hasPermission) {
      //   console.warn('Microphone permission denied');
      //   return;
      // }

      setIsRecording(true);
      const path = await audioRecorderPlayer.startRecorder();
      console.log('Recording started:', path);
      let counter = 0;
      const interval = setInterval(() => {
        counter += 1;
        setRecordingDuration(
          `${Math.floor(counter / 60)}:${(counter % 60).toString().padStart(2, '0')}`
        );
      }, 1000);

      setTimeout(() => clearInterval(interval), 60000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      const path = await audioRecorderPlayer.stopRecorder();
      setAudioPath(path);
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const playAudio = async () => {
    if (!audioPath) return;
    setIsPlaying(true);
    await audioRecorderPlayer.startPlayer(audioPath);
    audioRecorderPlayer.addPlayBackListener((e) => {
      setCurrentPosition(e.currentPosition);
      setDuration(e.duration);
      if (e.currentPosition === e.duration) {
        setIsPlaying(false);
        audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
      }
      return;
    });
  };

  const pauseAudio = async () => {
    if (!audioPath) return;
    setIsPlaying(false);
    await audioRecorderPlayer.pausePlayer();
  };

  const resumeAudio = async () => {
    if (!audioPath) return;
    setIsPlaying(true);
    await audioRecorderPlayer.resumePlayer();
  };

  const deleteRecording = () => {
    setAudioPath(null);
    setIsPlaying(false);
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
    if (!audioPath || !currentChatId) return;
    setIsLoading(true);
    await ChatService.sendAudioMessage(currentChatId, currentChatUserId!, audioPath);
    setIsLoading(false);
    setAudioPath(null);
    deleteRecording();
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
          {/* Left static image picker button */}
          <TouchableOpacity onPress={handleImagePicker} style={styles.imageButton}>
            <ImageIcon size={24} color={theme.colors.primary_600} />
          </TouchableOpacity>

          {/* Middle area: text input, recording status, or audio preview */}
          <View style={styles.inputWrapper}>
            {isRecording ? (
              <Text style={styles.recordingText}>
                🎙️ Recording... {recordingDuration}
              </Text>
            ) : audioPath && !isRecording ? (
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
                        { width: duration ? `${(currentPosition / duration) * 100}%` : '0%' },
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
            ) : (
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                multiline
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
            )}
          </View>

          <View style={styles.rightButtons}>
            {!audioPath && !isPlaying && (<TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              style={styles.recordButton}
            >
              {isRecording ? (
                <Stop size={24} weight="fill" color={theme.colors.primary_600} />
              ) : (
                <Microphone size={24} color={theme.colors.primary_600} />
              )}
            </TouchableOpacity>)}
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <PaperPlaneTilt weight="fill" size={32} color={theme.colors.primary_600} />
            </TouchableOpacity>
          </View>
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
    backgroundColor: theme.colors.grey_100,
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
    flex:1,
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
    height: 10,
    width:"auto",
    backgroundColor: theme.colors.grey_300,
    borderRadius: 5,
    marginTop: 8,
    overflow: 'hidden',
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
  },
  otherUserTimeText: {
    fontSize: 10,
    fontFamily: theme.fonts.satoshi_regular,
    color: theme.colors.text_500,
  },
  progressBackground: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor: theme.colors.grey_400,
    borderRadius: 4,
  },
});

export default ChatScreen;
