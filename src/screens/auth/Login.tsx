import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { login } from '../../core/auth';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import supabase from '../../core/supabase';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';


const Login: React.FC = () => {
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
// Add useNavigation hook to get access to the navigation object
const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter both phone number and password.');
      return;
    }

    setLoading(true);
    const { error } = await login(phone, password);

    if (error) {
      Alert.alert('Error', error.message || 'Login failed.');
    } else {
      Alert.alert('Success', 'Login successful!');
      navigation.navigate('Home');
    }
    setLoading(false);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: sessionData } = await supabase.auth.getSession();
    console.log(user);
    console.log(sessionData);
  };

  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Input placeholder="Phone (include country code)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Log In" onPress={handleLogin} loading={loading} />
    </View>
  );
};

export default Login;

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
});
