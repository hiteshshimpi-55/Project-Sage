import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { login } from '../../core/auth';
import {Input, Button} from '../../components/atoms'
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import supabase from '../../core/supabase';
import theme from '@utils/theme';

const Login: React.FC = () => {
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter both phone number and password.');
      return;
    }

    setLoading(true);
    const { data, error } = await login(phone, password);

    if (error) {
      Alert.alert('Error', error.message || 'Login failed.');
    } else {
      Alert.alert('Success', 'Login successful!');
      navigation.replace('Home');
    }

    setLoading(false);
  };

  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('Current user:', user);
    if (user) {
      navigation.navigate('Home');
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <Input
        label="Phone Number"
        variant="phone"
        placeholder="Enter your phone number"
        value={phone}
        onChangeText={setPhone}
      />
      <Input
        label="Password"
        variant="password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
      />

      <Button disabled={!password || !phone} title="Log In" onPress={handleLogin} loading={loading}/>

      <Text style={styles.footerText}>
        Don’t have an account?{' '}
        <Text style={styles.signupText} onPress={() => navigation.navigate('Signup')}>
          Sign Up
        </Text>
      </Text>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: theme.fonts.satoshi_bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: theme.fonts.satoshi_regular,
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    marginBottom: 15,
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontFamily: theme.fonts.satoshi_regular,
  },
  signupText: {
    color: theme.colors.primary_600,
    fontWeight: 'semibold',
  },
});
