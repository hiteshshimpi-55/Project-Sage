import React, {useEffect, useState} from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import {
  useNavigation,
  NavigationProp,
  RouteProp,
} from '@react-navigation/native';
import {RootStackParamList} from '../../App';
import {ChannelListingService} from './service/channel_service';
import {useUser} from '@hooks/UserContext';
import {User} from '@supabase/supabase-js';
import {ChatService} from '../../utils/chat_service';
import theme from '@utils/theme';

interface Props {
  route: RouteProp<RootStackParamList, 'ChannelDetailsScreen'>;
}

const ChannelDetailsScreen: React.FC<Props> = ({route}) => {
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const {user: currentUser} = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (route.params?.id) {
      const chatId = route.params.id;
      getChannelDetails(chatId);
    }
    loadUsers();
  }, []);

  const getChannelDetails = async (id: string) => {
    try {
      const {name,userIds} = await ChannelListingService.get_channel_details(id);
      setGroupName(name);
      setSelectedUsers(userIds);
    } catch (error) {
      console.error('Error fetching channel details:', error);
    }
  };
  const loadUsers = async () => {
    try {
      const currentUserId = currentUser?.id;
      const userList = await ChannelListingService.get_all_users(
        currentUserId!,
      );
      const filteredUsers = userList.filter(
        (user: any) => user.id !== currentUserId,
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };
  
  const handleGroupUpdate = async () => {
    const trimmedGroupName = groupName.trim();
    if (!trimmedGroupName) {
      Alert.alert('Group name should not be empty');
      return;
    }
    if (selectedUsers.length === 0) {
      Alert.alert('Please select at least one user');
      return;
    }

    try {
      const currentUserId = await ChatService.getCurrentUserId();
      const chatId = await ChatService.updateGroup(
        route.params.id!,
        currentUserId!,
        trimmedGroupName,
        selectedUsers,
      );
      if (!chatId) {
        Alert.alert('Error creating group with users');
        return;
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        'Error creating group',
        error?.message || 'An error occurred',
      );
    }
  };

  const handleOnPress = async () => {
    if (route.params?.id) {
      await handleGroupUpdate();
    } else {
      await handleCreateGroup();
    }
  }
  const handleCreateGroup = async () => {
    const trimmedGroupName = groupName.trim();
    if (!trimmedGroupName) {
      Alert.alert('Group name should not be empty');
      return;
    }
    if (selectedUsers.length === 0) {
      Alert.alert('Please select at least one user');
      return;
    }

    try {
      const currentUserId = await ChatService.getCurrentUserId();
      const chatId = await ChatService.createGroupWithUsers(
        currentUserId!,
        trimmedGroupName,
        selectedUsers,
      );
      if (!chatId) {
        Alert.alert('Error creating group with users');
        return;
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        'Error creating group',
        error?.message || 'An error occurred',
      );
    }
  };

  const renderUser = ({item}: {item: User}) => {
    const isSelected = selectedUsers.includes(item.id!);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => toggleUserSelection(item.id!)}>
        <Image
          source={{
            uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              item?.user_metadata?.full_name ?? '',
            )}&background=random`,
          }}
          style={styles.userImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user_metadata.full_name}</Text>
          {item.phone && <Text>{`+${item.phone}`}</Text>}
        </View>
        {isSelected && (
          <View style={styles.selectedCircle}>
            <Text style={styles.selectedCheck}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter group name"
        value={groupName}
        onChangeText={setGroupName}
      />

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={item => item.id!}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity style={styles.createButton} onPress={handleOnPress}>
        <Text style={styles.createButtonText}>{
          route.params?.id ? 'Update Group' : 'Create Group'  
        }</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChannelDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 16,
    height: 40,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  selectedCheck: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.primary_600,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
