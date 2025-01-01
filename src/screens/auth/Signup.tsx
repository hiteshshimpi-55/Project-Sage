import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { signUp } from '../../core/auth';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

const Signup: React.FC = () => {
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [age, setAge] = useState<string>(''); // Use string for input
  const [dob, setDob] = useState<string>(''); // YYYY-MM-DD
  const [loading, setLoading] = useState<boolean>(false);

const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const handleSignup = async () => {
    if (!fullName || !phone || !password) {
      Alert.alert('Error', 'Please fill all the required fields.');
      return;
    }

    setLoading(true);
    const { error } = await signUp({
      phone,
      password,
      fullName,
      gender: gender || undefined,
      age: age ? parseInt(age, 10) : undefined,
      dob: dob || undefined,
    });

    if (error) {
      Alert.alert('Error', error.message || 'Failed to sign up.');
    } else {
      Alert.alert('Success', 'Signup successful!');
      navigation.navigate('Home');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signup</Text>
      <Input placeholder="Full Name" value={fullName} onChangeText={setFullName} />
      <Input placeholder="Phone (include country code)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Input placeholder="Gender (optional)" value={gender} onChangeText={setGender} />
      <Input placeholder="Age (optional)" keyboardType="numeric" value={age} onChangeText={setAge} />
      <Input placeholder="Date of Birth (optional, YYYY-MM-DD)" value={dob} onChangeText={setDob} />
      <Button title="Sign Up" onPress={handleSignup} loading={loading} />
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
});
