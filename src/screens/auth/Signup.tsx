import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { signUp } from '../../core/auth';
import supabase from '../../core/supabase';
import { Input, Button, Dropdown } from '../../components/atoms';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import theme from '@utils/theme';

const Signup: React.FC = () => {
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSignup = async () => {
    try {
      if (!fullName || !phone || !password || !gender || !age || !dob) {
        Alert.alert('Error', 'Please fill all the required fields.');
        return;
      }

      setLoading(true);
      const { data, error } = await signUp({
        phone,
        password,
        fullName,
        gender: gender || undefined,
        age: age ? parseInt(age, 10) : undefined,
        dob: dob || undefined,
      });
      setLoading(false);

      if (error) {
        console.error('Error inserting into custom_users:', error);
        Alert.alert('Error', 'Failed to save user details.');
      } else {
        Alert.alert('Success', 'User details saved successfully!');
        navigation.navigate('Home');

      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'Something went wrong.');
      setLoading(false);

    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Full Name"
            variant="text"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
          />
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
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
          />
          {/* Gender Dropdown */}
          <Dropdown
            label="Gender"
            options={[
              { label: 'Male', value: 'Male' },
              { label: 'Female', value: 'Female' },
            ]}
            placeholder="Select your gender (optional)"
            selectedValue={gender}
            onValueChange={setGender}
          />
          {/* Age Input as number */}
          <Input
            label="Age"
            variant='number'
            placeholder="Enter your age (optional)"
            value={age}
            onChangeText={setAge}
          />
          {/* Date of Birth */}
          <Input
            label="Date of Birth"
            variant="number"
            placeholder="DD/MM/YY"
            value={dob}
            onChangeText={(text) => {
              // Remove any non-numeric characters
              let formattedText = text.replace(/[^0-9]/g, '');
              // Automatically insert slashes as needed
              if (formattedText.length > 2) {
                formattedText = `${formattedText.slice(0, 2)}/${formattedText.slice(2)}`;
              }
              if (formattedText.length > 5) {
                formattedText = `${formattedText.slice(0, 5)}/${formattedText.slice(5, 7)}`;
              }
              // Limit to DD/MM/YY format
              if (formattedText.length > 8) {
                formattedText = formattedText.slice(0, 8);
              }
              setDob(formattedText);
            }}
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            disabled={!fullName || !phone || !password}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.text_900,
    fontFamily: theme.fonts.satoshi_bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text_600,
    fontFamily: theme.fonts.satoshi_regular,
    textAlign: 'center',
    marginTop: 8,
  },
  formContainer: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: {
    color: theme.colors.text_600,
    fontFamily: theme.fonts.satoshi_regular,
  },
  loginText: {
    color: theme.colors.primary_600,
    fontWeight: 'semibold',
    marginLeft: 4,
    fontFamily: theme.fonts.satoshi_medium,
  },
});
