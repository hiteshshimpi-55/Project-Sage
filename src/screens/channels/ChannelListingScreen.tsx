import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatListUser, ChatService } from '../../utils/chat_service';
import { RootStackParamList } from '../../App';
import theme from '@utils/theme';
import { Plus } from 'phosphor-react-native';

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChannelListing: React.FC = () => {
  const [users, setUsers] = useState<ChatListUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadUsers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const currentUserId = await ChatService.getCurrentUserId();
      if (currentUserId) {
        const groups = await ChatService.getGroups(currentUserId);
        setUsers(groups);
      }
    } catch (error:any) {
      Alert.alert(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = user.name!.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const renderUser = ({ item }: { item: ChatListUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        navigation.navigate('ChatScreen', { id: item.id!, type: item.type!, name: item.name! });
      }}
    >
      <Image
        source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name ?? "")}&background=random` }}
        style={styles.channelImage}
      />

      <View style={styles.textContainer}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.latestMessage} numberOfLines={1}>
          {item.latest_message || 'No messages yet'}
        </Text>
      </View>

      <View style={styles.metaContainer}>
        <Text style={styles.messageTime}>
          {item.latest_message_time ? formatTime(item.latest_message_time) : ''}
        </Text>
        {item.unread_count! > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCountText}>{item.unread_count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search channels..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary_600} />
        </View>
      ) : filteredUsers.length > 0 ? (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.noUsersContainer}>
          <Text style={styles.noUsersText}>No channels found</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.floatingButton, isLoading && styles.disabledButton]}
        onPress={() => navigation.navigate('UserSelectionScreen')}
        disabled={isLoading}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ChannelListing;

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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  channelImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  userName: {
    fontSize: 16,
    color: '#333',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary_600,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  latestMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  metaContainer: {
    alignItems: 'flex-end',
  },
  messageTime: {
    fontSize: 12,
    color: '#888',
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
  textContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noUsersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noUsersText: {
    fontSize: 16,
    color: '#888',
  },
});
