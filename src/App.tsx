import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import supabase from './core/supabase';

// Screens
import Signup from './screens/auth/Signup';
import Login from './screens/auth/Login';
import Welcome from './screens/auth/Welcome';
import Home from './screens/home/Home';
import ChatScreen from './screens/chats/Chat';
import AdminDashboard from './screens/admin/AdminDashboard';
import { UserProvider } from './hooks/UserContext';
import ChatListing from './screens/chats/ChatListing';
import AdminMeeting from './screens/admin/AdminMeet';
import ChannelScreen from './screens/channels/ChannelScreen';
import CalendarScreen from './screens/calendar/CalendarScreen';
import ProfileScreen from './screens/profile/ProfileScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Signup: undefined;
  Login: undefined;
  Home: undefined;
  AdminDashboard: undefined;
  ChatScreen: {
    id: string;
    type:string;
  };
  ChatListing: undefined;
  MeetLink: undefined;
  ChannelScreen: undefined;
  CalendarScreen: undefined;
  ProfileScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const checkUserSession = async () => {
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (sessionData?.session) {
      setIsAuthenticated(true); // User is logged in
    } else {
      setIsAuthenticated(false); // No active session
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkUserSession();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <UserProvider>
      <NavigationContainer>
        <SafeAreaView style={styles.safeArea}>
          <Stack.Navigator initialRouteName={isAuthenticated ? 'Home' : 'Welcome'}>
            <Stack.Screen name="Welcome" component={Welcome} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
            <Stack.Screen name="Signup" component={Signup} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboard}
              options={{ title: 'Admin Dashboard' }}
            />
            <Stack.Screen name="ChatListing" component={ChatListing} />
            <Stack.Screen name="MeetLink" component={AdminMeeting} />
            <Stack.Screen name="ChannelScreen" component={ChannelScreen} />
            <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
