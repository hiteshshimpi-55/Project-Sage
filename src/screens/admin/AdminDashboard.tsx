import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  TextInputSubmitEditingEventData,
  NativeSyntheticEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { UserService } from '../../utils/user_service';

interface User {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  gender: string;
  status: 'active' | 'inactive';
  dob: string;
}

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  searchContainer: ViewStyle;
  searchInput: ViewStyle & TextStyle;
  statsContainer: ViewStyle;
  statCard: ViewStyle;
  statValue: TextStyle;
  statValueLight: TextStyle;
  statLabel: TextStyle;
  statLabelLight: TextStyle;
  scrollContainer: ViewStyle;
  userCard: ViewStyle;
  userCardContent: ViewStyle;
  userCardQuadrant: ViewStyle;
  userCardLabel: TextStyle;
  userCardText: TextStyle;
  userCardSubtext: TextStyle;
  statusBadge: ViewStyle;
  statusText: TextStyle;
  actionButtonContainer: ViewStyle;
  actionButton: ViewStyle;
  actionButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
  loader: ViewStyle;
  emptyState: ViewStyle;
  emptyStateText: TextStyle;
}

const COLORS = {
  primary: '#2563eb',
  secondary: '#e2e8f0',
  white: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  success: '#22c55e',
  error: '#ef4444',
};

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalActiveUsers, setTotalActiveUsers] = useState<number>(0);
  const [totalInactiveUsers, setTotalInactiveUsers] = useState<number>(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const currentUserId = 'someUserId'; // Replace with actual user ID
      const fetchedUsers = await UserService.getAllUsers(currentUserId);
      
      const filteredUsers = fetchedUsers.filter(
        (user: User) =>
          user.full_name.toLowerCase().includes(search.toLowerCase()) ||
          user.phone.includes(search)
      );

      const activeUsers = filteredUsers.filter((user: User) => user.status === 'active');
      const inactiveUsers = filteredUsers.filter((user: User) => user.status === 'inactive');

      setUsers(filteredUsers);
      setTotalUsers(filteredUsers.length);
      setTotalActiveUsers(activeUsers.length);
      setTotalInactiveUsers(inactiveUsers.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await UserService.activateUser(userId, new Date().toISOString());
      Alert.alert('Success', 'User activated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error activating user:', error);
      Alert.alert('Error', 'Failed to activate user. Please try again.');
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      await UserService.makeAdmin(userId);
      Alert.alert('Success', 'User role updated to admin successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error making user admin:', error);
      Alert.alert('Error', 'Failed to update user role. Please try again.');
    }
  };

  const handleSearch = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone"
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.success }]}>
          <Text style={[styles.statValue, styles.statValueLight]}>{totalActiveUsers}</Text>
          <Text style={[styles.statLabel, styles.statLabelLight]}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.error }]}>
          <Text style={[styles.statValue, styles.statValueLight]}>{totalInactiveUsers}</Text>
          <Text style={[styles.statLabel, styles.statLabelLight]}>Inactive</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No users found</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userCardContent}>
                <View style={styles.userCardQuadrant}>
                  <Text style={styles.userCardLabel}>Personal Info</Text>
                  <Text style={styles.userCardText}>{user.full_name}</Text>
                  <Text style={styles.userCardSubtext}>{user.phone}</Text>
                </View>
                <View style={styles.userCardQuadrant}>
                  <Text style={styles.userCardLabel}>Demographics</Text>
                  <Text style={styles.userCardText}>{user.age} years</Text>
                  <Text style={styles.userCardSubtext}>{user.gender}</Text>
                  <Text style={styles.userCardLabel}>Status</Text>
                  <View style={[styles.statusBadge, 
                    { backgroundColor: user.status === 'active' ? COLORS.success : COLORS.error }]}>
                    <Text style={styles.statusText}>{user.status}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionButtonContainer}>
                {user.status !== 'active' && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleActivateUser(user.id)}>
                    <Text style={styles.actionButtonText}>Activate</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => handleMakeAdmin(user.id)}>
                  <Text style={styles.secondaryButtonText}>Make Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statValueLight: {
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  statLabelLight: {
    color: COLORS.white,
  },
  scrollContainer: {
    padding: 16,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userCardQuadrant: {
    width: '48%', // Adjust to use half the card
    marginBottom: 8,
  },
  userCardLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  userCardText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  userCardSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  secondaryButtonText: {
    color: COLORS.text,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
});

export default AdminDashboard;