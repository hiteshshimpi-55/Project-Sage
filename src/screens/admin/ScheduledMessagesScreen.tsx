import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MessageSchedulerService, ScheduledMessage } from '../../utils/message_scheduler_service';
import { ScheduledMessageProcessor } from '../../utils/scheduled_message_processor';
import { UserService } from '../../utils/user_service';
import Button from '../../components/atoms/Button/Button';
import theme from '../../utils/theme';

const { colors, fonts } = theme;

interface ScheduledMessageWithUser extends ScheduledMessage {
  user?: {
    id: string;
    raw_user_meta_data: {
      full_name: string;
      phone?: string;
    };
  };
}

const ScheduledMessagesScreen: React.FC = () => {
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessageWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    messagesSentToday: 0,
    upcomingToday: 0,
  });

  const fetchScheduledMessages = async () => {
    try {
      const messages = await MessageSchedulerService.getAllScheduledMessages();
      
      // Fetch user details for each message
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          try {
            // Get user details from UserService
            const allUsers = await UserService.getAllUsers('');
            const user = allUsers.find(u => u.id === message.user_id);
            
            return {
              ...message,
              user: user ? {
                id: user.id,
                raw_user_meta_data: {
                  full_name: user.full_name,
                  phone: user.phone
                }
              } : null
            };
          } catch (error) {
            console.error('Error fetching user details:', error);
            return {
              ...message,
              user: null
            };
          }
        })
      );
      
      setScheduledMessages(messagesWithUsers);
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
      Alert.alert('Error', 'Failed to fetch scheduled messages.');
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await MessageSchedulerService.getSchedulingStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchScheduledMessages(), fetchStats()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleProcessMessages = async () => {
    Alert.alert(
      'Process Due Messages',
      'This will manually trigger processing of all due messages. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await ScheduledMessageProcessor.triggerEdgeFunction();
              
              if (result.success) {
                Alert.alert(
                  'Success',
                  `Processed ${result.processed} messages successfully.${
                    result.errors && result.errors.length > 0
                      ? `\n\nErrors: ${result.errors.length}`
                      : ''
                  }`
                );
              } else {
                Alert.alert('Error', 'Failed to process messages.');
              }
              
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to process messages.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeactivateSchedule = async (userId: string, userName: string) => {
    Alert.alert(
      'Deactivate Schedule',
      `Are you sure you want to stop scheduled messages for ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await MessageSchedulerService.deactivateScheduledMessage(userId);
              Alert.alert('Success', 'Scheduled messages deactivated.');
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate scheduled messages.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderScheduledMessage = ({ item }: { item: ScheduledMessageWithUser }) => {
    const userName = item.user?.raw_user_meta_data?.full_name || 'Unknown User';
    const phone = item.user?.raw_user_meta_data?.phone || 'N/A';
    const nextMessageDate = new Date(item.next_scheduled_at);
    const isOverdue = nextMessageDate < new Date();

    return (
      <View style={[styles.messageCard, isOverdue && styles.overdueCard]}>
        <View style={styles.messageHeader}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.phone}>{phone}</Text>
          {isOverdue && <Text style={styles.overdueLabel}>OVERDUE</Text>}
        </View>
        
        <Text style={styles.messageContent} numberOfLines={2}>
          "{item.message_content}"
        </Text>
        
        <View style={styles.messageStats}>
          <Text style={styles.statText}>Messages sent: {item.message_count}</Text>
          <Text style={styles.statText}>
            Next: {formatDate(item.next_scheduled_at)}
          </Text>
          {item.last_sent_at && (
            <Text style={styles.statText}>
              Last sent: {formatDate(item.last_sent_at)}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.deactivateButton}
          onPress={() => handleDeactivateSchedule(item.user_id, userName)}
        >
          <Text style={styles.deactivateButtonText}>Stop Scheduling</Text>
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary_500} />
        <Text style={styles.loadingText}>Loading scheduled messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active Schedules</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.messagesSentToday}</Text>
          <Text style={styles.statLabel}>Sent Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.upcomingToday}</Text>
          <Text style={styles.statLabel}>Due Today</Text>
        </View>
      </View>

      {/* Process Messages Button */}
      <View style={styles.actionContainer}>
        <Button
          title="Process Due Messages"
          onPress={handleProcessMessages}
          style={styles.processButton}
        />
      </View>

      {/* Scheduled Messages List */}
      {scheduledMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No scheduled messages found</Text>
        </View>
      ) : (
        <FlatList
          data={scheduledMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderScheduledMessage}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text_600,
    fontFamily: fonts.satoshi_regular,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: fonts.satoshi_bold,
    color: colors.primary_600,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.satoshi_medium,
    color: colors.text_600,
    marginTop: 4,
    textAlign: 'center',
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  processButton: {
    backgroundColor: colors.primary_500,
    paddingVertical: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error_main,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontFamily: fonts.satoshi_medium,
    color: colors.text_900,
    flex: 1,
  },
  phone: {
    fontSize: 14,
    fontFamily: fonts.satoshi_regular,
    color: colors.text_600,
    marginLeft: 8,
  },
  overdueLabel: {
    fontSize: 10,
    fontFamily: fonts.satoshi_bold,
    color: colors.error_main,
    backgroundColor: colors.error_100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  messageContent: {
    fontSize: 14,
    fontFamily: fonts.satoshi_regular,
    color: colors.text_700,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  messageStats: {
    marginBottom: 12,
  },
  statText: {
    fontSize: 12,
    fontFamily: fonts.satoshi_regular,
    color: colors.text_600,
    marginBottom: 2,
  },
  deactivateButton: {
    backgroundColor: colors.error_500,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  deactivateButtonText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.satoshi_medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.satoshi_regular,
    color: colors.text_600,
  },
});

export default ScheduledMessagesScreen;
