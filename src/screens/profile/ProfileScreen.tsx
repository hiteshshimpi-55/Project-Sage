import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import supabase from '../../core/supabase';
import { CommonActions, NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import theme from '../../utils/theme';
import { SignOut } from 'phosphor-react-native';
import { useUser } from '@hooks/UserContext';

const ProfileScreen = () => {
  const [user, setUser] = useState<any>(null);
  const {setUser:setUserContext} = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUserContext(null);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary_500} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image
          source={{ uri: `https://picsum.photos/seed/${user?.phone_number}/200/300` }}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{user.user_metadata?.full_name || 'User'}</Text>
      </View>

      <View style={styles.content}>
        <Section title="Profile Details">
          <InfoItem label="Full Name" value={user.user_metadata?.full_name || 'Not set'} />
          <InfoItem label="Phone" value={user.phone || 'Not set'} />
        </Section>

        <Section title="Account Information">
          <InfoItem label="Member Since" value={new Date(user.created_at).toLocaleDateString()} />
          <InfoItem label="Age" value={user.user_metadata?.age ?? 'N/A'} />
          <InfoItem label="Gender" value={user.user_metadata?.gender ?? 'N/A'} />
          <InfoItem label="Date of Birth" value={user.user_metadata?.dob ?? 'N/A'} />
          <InfoItem label="Disease" value={user.user_metadata?.disease ?? 'N/A'} />
          <InfoItem label="Place" value={user.user_metadata?.place ?? 'N/A'} />
        </Section>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <SignOut size={24} color={theme.colors.text_500} weight="bold" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    {children}
  </View>
);

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoItem}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: theme.colors.primary_50,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: theme.fonts.satoshi_medium,
    color: theme.colors.primary_900,
    marginTop: 16,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: theme.fonts.satoshi_medium,
    color: theme.colors.primary_900,
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: theme.fonts.satoshi_medium,
    color: theme.colors.text_500,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontFamily: theme.fonts.satoshi_medium,
    color: theme.colors.primary_900,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 'auto',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: theme.fonts.satoshi_medium,
    color: theme.colors.text_500,
    fontWeight: '500',
  },
});

export default ProfileScreen;
