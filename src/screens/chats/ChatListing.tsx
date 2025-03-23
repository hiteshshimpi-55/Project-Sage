import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import {ChatUser} from './service/chat_listing_service';
import {RootStackParamList} from '../../App';
import theme from '@utils/theme';
import {useUser} from '@hooks/UserContext';
import {ChatListingService} from './service/chat_listing_service';


const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatListing: React.FC = () => {
  const {user: currentUser} = useUser();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadUsers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, []),
  );

  const loadUsers = async () => {
    try {
      const data = await ChatListingService.get_chat_listing_page(
        currentUser?.id!,
        currentUser?.isAdmin!,
      );
      console.log('Data:', data);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = user.name!.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });



  const renderUser = ({ item }: { item: ChatUser })=>{

    const getMessagePreview = () => {
      switch (item.last_message_type) {
        case 'image':
          return '📷 Image';
        case 'audio':
          return '🎵 Audio';
        case 'video':
          return '📹 Video';
        case 'file':
          return '📁 File';
        case 'text':
          return item.last_message;
        default:
          return 'No messages yet';
      }
    };

    return (<TouchableOpacity
      style={styles.userItem}
      onPress={() => {
          navigation.navigate('ChatScreen', {
            id: item.user_id!,
            type: item.chat_type!,
            name: item.name!,
          });      }}
    >
      <Image
        source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name ?? "")}&background=random` }}
        style={styles.profilePic}
      />

      <View style={styles.textContainer}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.latestMessage} numberOfLines={1}>
          {getMessagePreview()}
        </Text>
      </View>

      <View style={styles.metaContainer}>
        <Text style={styles.messageTime}>
          {item.last_message_time ? formatTime(item.last_message_time) : ''}
        </Text>
        {item.unread_message_count! > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCountText}>{item.unread_message_count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={theme.colors.grey_400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={item => item.chat_id ?? item.user_id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 40,
    fontSize: 16,
    fontFamily: theme.fonts.satoshi_regular,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: theme.fonts.satoshi_bold,
    fontWeight: 'bold',
  },
  latestMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: 'red',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  unreadCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metaContainer: {
    alignItems: 'flex-end',
  },
  messageTime: {
    fontSize: 12,
    color: '#888',
  },
  textContainer: {
    flex: 1,
  },
});

export default ChatListing;
