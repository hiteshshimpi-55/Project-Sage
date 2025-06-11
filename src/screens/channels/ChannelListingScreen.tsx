import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import theme from '@utils/theme';
import { Plus } from 'phosphor-react-native';
import { Channel, ChannelListingService } from './service/channel_service';
import { useUser } from '@hooks/UserContext';
import { ServiceFunctions } from '../../utils/service';

const PAGE_LIMIT = 20;

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChannelListing: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user: current_user } = useUser();

  useFocusEffect(
    useCallback(() => {
      resetAndLoad();
    }, [])
  );

  const resetAndLoad = async () => {
    setPage(0);
    setHasMore(true);
    setChannels([]);
    await loadUsers(0);
  };

  const loadUsers = async (pageNumber: number) => {
    if (!current_user) return;

    const offset = pageNumber * PAGE_LIMIT;

    if (pageNumber === 0) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const data = await ChannelListingService.get_user_channels(
        current_user.id,
        PAGE_LIMIT,
        offset
      );

      if (data.length < PAGE_LIMIT) {
        setHasMore(false);
      }

      setChannels((prev) =>
        pageNumber === 0 ? data : [...prev, ...data]
      );
      setPage(pageNumber);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load channels');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore && !isLoading) {
      loadUsers(page + 1);
    }
  };

  const filteredUsers = channels.filter((user) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUser = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        navigation.navigate('ChatScreen', {
          id: item.id!,
          type: item.type!,
          name: item.name!,
        });
      }}
    >
      <Image
        source={{ uri: `https://picsum.photos/seed/${item.id}200/300` }}
        style={styles.channelImage}
      />
      <View style={styles.textContainer}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.latestMessage} numberOfLines={1}>
          {ServiceFunctions.getMessagePreview(
            item.last_message_type!,
            item.last_message!
          )}
        </Text>
      </View>
      <View style={styles.metaContainer}>
        <Text style={styles.messageTime}>
          {item.last_message_time ? formatTime(item.last_message_time) : ''}
        </Text>
        {item.unread_message_count! > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCountText}>
              {item.unread_message_count}
            </Text>
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

      {isLoading && page === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary_600} />
        </View>
      ) : filteredUsers.length > 0 ? (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingMore ? (
              <View style={{ padding: 16 }}>
                <ActivityIndicator color={theme.colors.primary_600} />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.noUsersContainer}>
          <Text style={styles.noUsersText}>No channels found</Text>
        </View>
      )}

      {current_user?.isAdmin && (
        <TouchableOpacity
          style={[
            styles.floatingButton,
            (isLoading || isFetchingMore) && styles.disabledButton,
          ]}
          onPress={() => navigation.navigate('ChannelDetailsScreen', { id: null })}
          disabled={isLoading || isFetchingMore}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}
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
    fontSize: 26,
    color: theme.colors.primary_400,
  },
});
