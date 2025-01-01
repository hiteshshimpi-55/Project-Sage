import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface WelcomeProps {
  navigation: any;
}

const Welcome: React.FC<WelcomeProps> = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Welcome</Text>
    <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
      <Text>Already have an account? Login</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Signup')}>
      <Text>Don't have an account? Signup</Text>
    </TouchableOpacity>
  </View>
);

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  link: {
    marginVertical: 10,
  },
});
