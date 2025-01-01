import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import UserCard from '../../components/molecules/UserCard';
import { UserService } from '../../utils/user_service';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await UserService.getAllUsers('');
      console.log('Fetched Users:', fetchedUsers);
      setUsers(fetchedUsers);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await UserService.activateUser(userId);
      Alert.alert('Success', 'User activated successfully.');
      fetchUsers();
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

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {users.map((user) => (
        <UserCard
          key={user.id}
          fullName={user.full_name}
          phone={user.phone}
          age={user.age}
          dob={user.dob}
          gender={user.gender}
          status={user.status}
          onActivate={() => handleActivateUser(user.id)}
          onMakeAdmin={() => handleMakeAdmin(user.id)}
        />
      ))}
    </ScrollView>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
});
