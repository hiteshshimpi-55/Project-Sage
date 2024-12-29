import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { signUpWithPhone, loginWithPhone } from '../../core/auth';

// This will render either Signup or Login form depending on the state
const AuthScreen = () => {
  const [isSignup, setIsSignup] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async () => {
    if (isSignup) {
      
      const result = await signUpWithPhone(phone, password, fullName);
      if (result.success) {
        Alert.alert('Success', 'Account created! You can now log in.');
        setIsSignup(false); 
      } else {
        Alert.alert('Error', result.error);
      }
    } else {
      
      const result = await loginWithPhone(phone, password);
      if (result.success) {
        Alert.alert('Success', 'Logged in successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>{isSignup ? 'Sign Up' : 'Log In'}</Text>

      <TextInput
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />

      {isSignup && (
        <TextInput
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          style={{ borderBottomWidth: 1, marginBottom: 10 }}
        />
      )}

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />

      <Button title={isSignup ? 'Sign Up' : 'Log In'} onPress={handleAuth} />
      <Button
        title={isSignup ? 'Already have an account? Log In' : 'Don’t have an account? Sign Up'}
        onPress={() => setIsSignup(!isSignup)}
      />
    </View>
  );
};

export default AuthScreen;
