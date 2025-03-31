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
import Home from './screens/home/Home';
import UserSelectionScreen from './screens/channels/UserSelectionScreen';
import ChannelDetailsScreen from './screens/channels/ChannelDetail';


// 
import { setUserContext, UserProvider, useUser } from './hooks/UserContext';
import theme from '@utils/theme';
import { User, UserMetadata, UserResponse } from '@supabase/supabase-js';
import UserHoveringScreen from './screens/static/UserHoveringScreen';
import { UserService } from '@utils/user_service';

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
  UserSelectionScreen: undefined;
  ChannelDetailsScreen: {
    selectedUsers: string[];
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const {user,setUser} = useUser();

  const checkUserSession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      await getCurrentUser();
      setIsAuthenticated(true); 
    } else {
      setIsAuthenticated(false); 
    }
    setIsLoading(false);
  };


  const getCurrentUser = async () => {
    console.log("Getting current user");
    const user:UserResponse = await supabase.auth.getUser();
    if (!user.error) {
      console.log("User data", user.data);
      const transformedUser = UserService.transformUserContext(user.data!.user);
      console.log("Transformed user", transformedUser);
      setUser(transformedUser);
    }
  }

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
      <NavigationContainer>
        <SafeAreaView style={styles.safeArea}>
          <Stack.Navigator initialRouteName={isAuthenticated ? 'Home' : 'Login'}>
            {/* Auth and Other Screens */}
            <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }}/>
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }}/>
            <Stack.Screen name="AdminDashboard" component={AdminDashboard}/>
            <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="ChannelDetailsScreen" component={ChannelDetailsScreen} options={{ headerShown: true }}/>
            <Stack.Screen name="UserSelectionScreen" component={UserSelectionScreen} options={{ headerShown: true }}/>
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


function App(): React.JSX.Element {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
export default App;
