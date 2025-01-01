import React from 'react';
import {
  StyleSheet
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import Signup from './screens/auth/Signup';
import Login from './screens/auth/Login';
import Welcome from './screens/auth/Welcome';
import Home from './screens/home/Home';
import ChatScreen from './screens/chats/Chat';
import { UserProvider, useUser} from '@hooks/UserContext';
import ChatListing from './screens/chats/ChatListing';

export type RootStackParamList = {
  Welcome: undefined;
  Signup: undefined;
  Login: undefined;
  Home: undefined;
  ChatScreen: {
    id: string;
  };
  ChatListing: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();



function App(): React.JSX.Element {
  
  return (
    <NavigationContainer>
      <UserProvider>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="ChatListing" component={ChatListing} />
        </Stack.Navigator>
      </UserProvider>
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
});

export default App;
