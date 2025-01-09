import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ChatListing from "../chats/ChatListing";
import CalendarScreen from "../calendar/CalendarScreen";
import ProfileScreen from "../profile/ProfileScreen";
import ChannelListing from "../chats/ChannelListing";
import BottomBar from "../../components/molecules/BottomBar";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { Bell, LinkSimpleHorizontal } from "phosphor-react-native";
import theme from "@utils/theme";
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "src/App";

export type BottomTabParamList = {
  ChatListing: undefined;
  ChannelsListing: undefined;
  CalendarScreen: undefined;
  ProfileScreen: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const AppBar = () => {

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const onNotificationPressed = () => {
    console.log("Notification pressed");
    navigation.navigate("AdminDashboard");
  }

  const onLinkPressed = () => {
    console.log("Link pressed");
    navigation.navigate("MeetLink");
  }
  return (
    <View style={styles.appBar}>
      <Text style={styles.appBarText}>SAGE</Text>

      <View style={styles.rightButtons}>
        <TouchableOpacity style={styles.appBarButton} onPress={onNotificationPressed}>
          <Bell size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.appBarButton} onPress={onLinkPressed}>
          <LinkSimpleHorizontal size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Home = () => (
  <View style={{ flex: 1 }}>
    {/* Render the custom AppBar */}
    <AppBar />
    <Tab.Navigator
      tabBar={(props) => <BottomBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="ChatListing" component={ChatListing} />
      <Tab.Screen name="ChannelsListing" component={ChannelListing} />
      <Tab.Screen name="CalendarScreen" component={CalendarScreen} />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
    </Tab.Navigator>
  </View>
);

export default Home;

const styles = StyleSheet.create({
  appBar: {
    height: 60,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  appBarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary_600,
    fontFamily: theme.fonts.satoshi_bold,
  },
  rightButtons: { 
    flexDirection: "row",
    alignItems: "center",
  },
  appBarButton: {
    marginLeft: 16,
  },
});
