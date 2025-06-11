import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Users, ChatCircle, Calendar, User } from 'phosphor-react-native';
import { BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs';
import { NavigationHelpers, ParamListBase, TabNavigationState } from '@react-navigation/native';
import { EdgeInsets } from 'react-native-safe-area-context';
import theme from '@utils/theme';

interface BottomBarProps {
  state: TabNavigationState<ParamListBase>;
  navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>;
  insets: EdgeInsets;
}

const BottomBar: React.FC<BottomBarProps> = ({ state, navigation, insets }) => {
  const tabs = [

    {
      name: 'Chats',
      icon: ChatCircle,
      route: 'ChatListing',
    },
    {
      name: 'Channels',
      icon: Users,
      route: 'ChannelsListing',
    },
    {
      name: 'Schedule',
      icon: Calendar,
      route: 'CalendarScreen',
    },
    {
      name: 'Profile',
      icon: User,
      route: 'ProfileScreen',
    },
  ];

  const isActive = (tabRoute: string) => {
    return state.routes[state.index].name === tabRoute;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tab}
          onPress={() => navigation.navigate(tab.route as never)}
        >
          <tab.icon
            size={24}
            weight={isActive(tab.route) ? 'fill' : 'regular'}
            color={isActive(tab.route) ? theme.colors.primary_600 : theme.colors.grey_600}
          />
          <Text
            style={[
              styles.tabLabel,
              isActive(tab.route) && styles.activeTabLabel,
            ]}
          >
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey_100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: theme.colors.grey_600,
    fontFamily: theme.fonts.satoshi_medium,
  },
  activeTabLabel: {
    color: theme.colors.primary_600,
    fontFamily: theme.fonts.satoshi_bold,
  },
});

export default BottomBar;
