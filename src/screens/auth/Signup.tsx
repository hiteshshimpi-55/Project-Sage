import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import supabase from '../../core/supabase';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // Validation
    if (!fullName || !phone || !password) {
      Alert.alert('Error', 'Please fill all the fields.');
      return;
    }

    setLoading(true);

    try {

      console.log('Attempting signup with:', { phone, password, fullName });
      const { data, error } = await supabase.auth.signUp({
        phone: `+${phone}`, // Ensure the phone number includes a country code
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Error signing up:', error);
        Alert.alert('Error', error.message || 'Failed to sign up.');
      } else if (data) {
        Alert.alert('Success', 'Signup successful!');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signup</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone (include country code)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
