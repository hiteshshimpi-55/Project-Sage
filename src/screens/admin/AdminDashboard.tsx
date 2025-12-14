import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TextInput,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import UserCard from '../../components/molecules/UserCard';
import {UserService} from '../../utils/user_service';
import {ChatService} from '../../utils/chat_service';
import {ChatServiceV2} from '../chats/service/chat_service';
import {MessageSchedulerService} from '../../utils/message_scheduler_service';
import Button from '../../components/atoms/Button/Button';
import theme from '../../utils/theme';

// Constants
const PAGE_SIZE = 10;
const FOLLOW_UP_TEMPLATE = `
Dr. Pranita's Diet Consulting Follow-Up Record

Please fill in the following details:

- Name:
- Age:
- Height (in cm):
- Weight (in kg):
- कंबरेचा घेर / Waist Circumference (in cm):
- कंबरेखालचा घेर / Hip Circumference (in cm):
- Disease / इतर आजार (e.g., Diabetes / BP / Thyroid, etc.):
- Recent HBA1C (if tested, please mention):
- Medicine Taking (if any):
- Daily Exercise (e.g., walk):
- Place: Mumbai
- Occupation: Journalist
- Reference:
- Mobile Number:
- Alternative Mobile Number:
- Package (per month):
- Date of Joining:

Follow-Up Weights:

- Follow-Up 1: Weight (in kg) - Date:
- Follow-Up 2: Weight (in kg) - Date:
- Follow-Up 3: Weight (in kg) - Date:
- Follow-Up 4: Weight (in kg) - Date:
- Follow-Up 5: Weight (in kg) - Date:
- Follow-Up 6: Weight (in kg) - Date:
- Follow-Up 7: Weight (in kg) - Date:
- Follow-Up 8: Weight (in kg):
`;

// Types
interface User {
  id: string;
  full_name: string;
  phone: string;
  age?: number;
  dob?: string;
  gender?: string;
  status: 'active' | 'inactive';
  hasActiveSchedule?: boolean;
}

const AdminDashboard: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Methods
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await UserService.getAllUsers('');

      // Check which users have active scheduled messages
      const usersWithScheduleStatus = await Promise.all(
        allUsers.map(async (user: User) => {
          try {
            const activeSchedule = await MessageSchedulerService.getActiveScheduleForUser(user.id);
            return {
              ...user,
              hasActiveSchedule: !!activeSchedule,
            };
          } catch (error) {
            console.error(`Error checking schedule for user ${user.id}:`, error);
            // Return user without schedule info if there's an error
            return {
              ...user,
              hasActiveSchedule: false,
            };
          }
        })
      );

      // Filter users based on search query
      const filtered = usersWithScheduleStatus.filter(
        (user: User) =>
          user.full_name.toLowerCase().includes(search.toLowerCase()) ||
          user.phone.includes(search),
      );

      // Calculate statistics
      const activeUsers = filtered.filter(
        (user: User) => user.status === 'active',
      );
      const inactiveUsers = filtered.filter(
        (user: User) => user.status === 'inactive',
      );

      // Update state
      setUsers(filtered);
      setFilteredUsers(filtered.slice(0, PAGE_SIZE));
      setStats({
        total: filtered.length,
        active: activeUsers.length,
        inactive: inactiveUsers.length,
      });
      setPage(1);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreUsers = () => {
    const nextPage = page + 1;
    const newUsers = users.slice(0, nextPage * PAGE_SIZE);
    setFilteredUsers(newUsers);
    setPage(nextPage);
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const activationTimestamp = new Date().toISOString();
      await UserService.activateUser(userId, activationTimestamp);
      Alert.alert('Success', 'User activated successfully.');

      await sendWelcomeMessage(userId);
      fetchUsers();
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to activate user. ${(error as Error).message}`,
      );
    }
  };

  const sendWelcomeMessage = async (userId: string) => {
    try {
      const currentUserId = await ChatService.getCurrentUserId();
      if (!currentUserId) throw new Error('Failed to fetch current user ID');

      // Check if chat exists or create one
      const chatResponse = await ChatService.checkIfChatExists(
        currentUserId,
        userId,
      );

      let chatId = chatResponse?.chat_id;
      if (!chatId) {
        chatId = await ChatServiceV2.get_or_create_chat(currentUserId, userId);
      }

      if (!chatId) throw new Error('Failed to create or retrieve chat');

      // Get the chat user ID and send welcome message
      const chat_user_id = await ChatService.getChatUserId(
        currentUserId,
        chatId,
      );

      if (typeof chat_user_id === 'string') {
        await ChatService.sendTextMessage(
          chatId,
          chat_user_id,
          FOLLOW_UP_TEMPLATE,
          'welcome_text'
        );
      } else {
        console.log('Chat user ID is not a string:', chat_user_id);
        throw new Error('Invalid chat user ID');
      }
    } catch (error) {
      console.error('Failed to send welcome message:', error);
      throw error;
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      await UserService.makeAdmin(userId);
      Alert.alert('Success', 'User role updated to admin.');
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update user role.');
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await UserService.deactivateUser(userId);
      // Also deactivate any scheduled messages for this user
      await MessageSchedulerService.deactivateScheduledMessage(userId);
      Alert.alert('Success', 'User deactivated successfully.');
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to deactivate user.');
    }
  };

  const handleScheduleMessages = async (userId: string) => {
    try {
      const currentUserId = await ChatService.getCurrentUserId();
      if (!currentUserId) throw new Error('Failed to fetch current user ID');

      // Check if user already has an active schedule
      const existingSchedule = await MessageSchedulerService.getActiveScheduleForUser(userId);
      
      if (existingSchedule) {
        Alert.alert(
          'Manage Scheduled Messages',
          'This user already has scheduled messages. What would you like to do?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Stop Scheduling',
              style: 'destructive',
              onPress: async () => {
                try {
                  await MessageSchedulerService.deactivateScheduledMessage(userId);
                  Alert.alert('Success', 'Scheduled messages stopped.');
                  fetchUsers();
                } catch (error) {
                  Alert.alert('Error', 'Failed to stop scheduled messages.');
                }
              },
            },
            {
              text: 'Update Message',
              onPress: () => {
                Alert.prompt(
                  'Update Message',
                  'Enter new message content:',
                  async (newMessage) => {
                    if (newMessage && newMessage.trim()) {
                      try {
                        await MessageSchedulerService.updateMessageContent(userId, newMessage.trim());
                        Alert.alert('Success', 'Message content updated.');
                      } catch (error) {
                        Alert.alert('Error', 'Failed to update message.');
                      }
                    }
                  },
                  'plain-text',
                  existingSchedule.message_content
                );
              },
            },
          ]
        );
      } else {
        Alert.prompt(
          'Schedule Messages',
          'Enter custom message (or leave empty for default appointment reminder):',
          async (customMessage) => {
            try {
              await MessageSchedulerService.createScheduledMessage(
                userId,
                currentUserId,
                customMessage?.trim() || undefined
              );
              Alert.alert(
                'Success',
                'Messages scheduled successfully!\n\nSchedule:\n• 1st message: Today\n• 2nd message: After 7 days\n• 3rd message: After 14 days\n• Subsequent messages: Every 15 days'
              );
              fetchUsers();
            } catch (error) {
              Alert.alert('Error', `Failed to schedule messages: ${(error as Error).message}`);
            }
          },
          'plain-text',
          'You have an appointment tomorrow'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to handle scheduled messages.');
    }
  };
  const renderUserItem = ({item}: {item: User}) => (
    <UserCard
      key={item.id}
      fullName={item.full_name}
      phone={item.phone}
      status={item.status}
      onDeactivate={() => handleDeactivateUser(item.id)}
      onActivate={() => handleActivateUser(item.id)}
      onMakeAdmin={() => handleMakeAdmin(item.id)}
      onScheduleMessages={() => handleScheduleMessages(item.id)}
      hasActiveSchedule={item.hasActiveSchedule}
    />
  );

  // Effects
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [search]);

  // Render
  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone"
          value={search}
          onChangeText={text => setSearch(text)}
        />
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.stat}>Total Users: {stats.total}</Text>
        <Text style={styles.stat}>Active: {stats.active}</Text>
        <Text style={styles.stat}>Inactive: {stats.inactive}</Text>
      </View>

      {/* Scheduled Messages Button */}
      <View style={styles.actionButtonContainer}>
        <Button
          title="Manage Scheduled Messages"
          onPress={() => navigation.navigate('ScheduledMessages')}
          style={styles.scheduledMessagesButton}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      ) : filteredUsers.length === 0 ? (
        <Text style={styles.noDataText}>No users found.</Text>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.scrollContainer}
          renderItem={renderUserItem}
          onEndReached={loadMoreUsers}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  stat: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  scheduledMessagesButton: {
    backgroundColor: theme.colors.primary_600,
    paddingVertical: 12,
  },
  scrollContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  loader: {
    marginTop: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    color: '#666',
  },
});

export default AdminDashboard;
