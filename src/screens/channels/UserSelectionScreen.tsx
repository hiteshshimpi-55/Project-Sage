import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatListUser, ChatService } from '../../utils/chat_service';
import { RootStackParamList } from '../../App';
import theme from '@utils/theme';
import { ChannelListingService } from './service/channel_service';
import { useUser } from '@hooks/UserContext';
import { User } from '@supabase/supabase-js';

const UserSelectionScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const {user:currentUser} = useUser();

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const currentUserId = currentUser?.id;
      const userList = await ChannelListingService.get_all_users(currentUserId!);
      // Filter out the signed-in user
      const filteredUsers = userList.filter((user:any) => user.id !== currentUserId);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleContinue = () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Please select at least one user');
      return;
    }
    navigation.navigate('ChannelDetailsScreen', { selectedUsers });
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => toggleUserSelection(item.id!)}
    >
      <Image
        source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.user_metadata?.full_name??"")}&background=random` }}
        style={styles.userImage}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.user_metadata.full_name!}</Text>
        {item.phone && <Text>{`+${item.phone}`}</Text>}
      </View>
      {selectedUsers.includes(item.id!) && <Text style={styles.selectedText}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UserSelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  userName: {
    fontSize: 16,
    flex: 1,
  },
  userInfo: {
    flex: 1,
  },
  selectedText: {
    color: theme.colors.primary_600,
  },
  continueButton: {
    backgroundColor: theme.colors.primary_600,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 16,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});