import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import UserCard from '../../components/molecules/UserCard';
import { UserService } from '../../utils/user_service';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalActiveUsers, setTotalActiveUsers] = useState<number>(0);
  const [totalInactiveUsers, setTotalInactiveUsers] = useState<number>(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await UserService.getAllUsers('');
      console.log('Fetched Users:', fetchedUsers);

      // Filter users based on search query
      const filteredUsers = fetchedUsers.filter(
        (user) =>
          user.full_name.toLowerCase().includes(search.toLowerCase()) ||
          user.phone.includes(search)
      );

      // Update the statistics
      const activeUsers = filteredUsers.filter((user) => user.status === 'active');
      const inactiveUsers = filteredUsers.filter((user) => user.status === 'inactive');

      setTotalUsers(filteredUsers.length);
      setTotalActiveUsers(activeUsers.length);
      setTotalInactiveUsers(inactiveUsers.length);

      setUsers(filteredUsers);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const activationTimestamp = new Date().toISOString(); // Current timestamp
      await UserService.activateUser(userId, activationTimestamp);
      Alert.alert('Success', 'User activated successfully.');
      fetchUsers(); // Refresh the users list
    } catch (error) {
      Alert.alert('Error', 'Failed to activate user.');
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

  const handleSearch = () => {
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.stat}>Total Users: {totalUsers}</Text>
        <Text style={styles.stat}>Active Users: {totalActiveUsers}</Text>
        <Text style={styles.stat}>Inactive Users: {totalInactiveUsers}</Text>
      </View>

      {/* User Cards */}
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      ) : users.length === 0 ? (
        <Text style={styles.noDataText}>No users found.</Text>
      ) : (
        <ScrollView style={styles.scrollContainer}>
  {users.map((user) => (
    <UserCard
      key={user.id}
      fullName={user.full_name}
      phone={user.phone}
      age={user.age}
      dob={user.dob}
      gender={user.gender}
      status={user.status}
      onActivate={
        
        user.status === 'active' ? undefined : () => handleActivateUser(user.id)
      }
      onMakeAdmin={() => handleMakeAdmin(user.id)}
    />
  ))}
</ScrollView>
      )}
    </View>
  );
};

export default AdminDashboard;

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
