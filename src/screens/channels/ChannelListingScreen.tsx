import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatListUser, ChatService } from '../../utils/chat_service';
import { RootStackParamList } from '../../App';
import theme from '@utils/theme';
import { Plus } from 'phosphor-react-native';

const ChannelListing: React.FC = () => {
  const [users, setUsers] = useState<ChatListUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const currentUserId = await ChatService.getCurrentUserId();
      if (currentUserId) {
        const groups = await ChatService.getGroups(currentUserId);
        setUsers(groups);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = user.name!.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const renderUser = ({ item }: { item: ChatListUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() =>
        navigation.navigate('ChatScreen', { id: item.id!, type: item.type!, name: item.name! })
      }
    >
      <Text style={styles.userName}>{item.name!}</Text>
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

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('UserSelectionScreen')}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: {
    fontSize: 16,
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
});
