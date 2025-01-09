import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import supabase from './core/supabase';

// Screens
import Signup from './screens/auth/Signup';
import Login from './screens/auth/Login';
import ChatScreen from './screens/chats/Chat';
import AdminDashboard from './screens/admin/AdminDashboard';
import AdminMeeting from './screens/admin/AdminMeet';
import { UserProvider } from './hooks/UserContext';
import Home from './screens/home/Home';
import theme from '@utils/theme';

export type RootStackParamList = {
  Signup: undefined;
  Login: undefined;
  AdminDashboard: undefined;
  ChatScreen: {
    id: string;
    type: string;
    name: string;
  };
  Home: undefined;
  MeetLink: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const checkUserSession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      setIsAuthenticated(true); 
    } else {
      setIsAuthenticated(false); 
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkUserSession();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary_500} />
      </View>
    );
  }

  return (
    <UserProvider>
      <NavigationContainer>
        <SafeAreaView style={styles.safeArea}>
          <Stack.Navigator initialRouteName={isAuthenticated ? 'Home' : 'Login'}>
            {/* Auth and Other Screens */}
            <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }}/>
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }}/>
            <Stack.Screen name="AdminDashboard" component={AdminDashboard}/>
            <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="MeetLink" component={AdminMeeting} />

            {/* Main App with Tabs */}
            <Stack.Screen
              name="Home"
              component={Home}
              options={{ headerShown: false }}
            />
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
