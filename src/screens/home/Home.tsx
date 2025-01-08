import BottomBar from "../../components/molecules/BottomBar";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ChatListing from "../chats/ChatListing";
import CalendarScreen from "../calendar/CalendarScreen";
import ProfileScreen from "../profile/ProfileScreen";
import ChannelListing from "../chats/ChannelListing";

export type BottomTabParamList = {
  ChatListing: undefined;
  ChannelsListing: undefined;
  CalendarScreen: undefined;
  ProfileScreen: undefined;
};
const Tab = createBottomTabNavigator<BottomTabParamList>();

const Home = () => (
  <Tab.Navigator
    tabBar={(props) => <BottomBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="ChatListing" component={ChatListing} />
    <Tab.Screen name="ChannelsListing" component={ChannelListing} />
    <Tab.Screen name="CalendarScreen" component={CalendarScreen} />
    <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
  </Tab.Navigator>
);

export default Home;