import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import supabase from '../../core/supabase';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App'; // Import your navigation types
import Button from '../../components/atoms/Button'; // Import your custom Button component

const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } else {
      Alert.alert('Success', 'You have been logged out.');
      navigation.navigate('Welcome'); // Navigate to Welcome screen
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello!</Text>
      <Text style={styles.subtitle}>This is my app.</Text>
      <Button
        title="Log Out"
        onPress={handleLogout}
        style={styles.logoutButton}
      />
      <Button
        title="Chat"
        onPress={() => navigation.navigate('ChatScreen')}
        style={styles.chatButton}
      />
      <Button
        title="Admin Dashboard"
        onPress={() => navigation.navigate('AdminDashboard')}
        style={styles.chatButton}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#FF0000', // Customize the button color for logout
  },
  chatButton: {
    marginTop: 10,
    backgroundColor: '#007BFF', // Customize the button color for logout
  },
});
