import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

const BottomBar: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('ChatListing')}>
        <Icon name="chatbubble-ellipses-outline" size={24} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ChannelScreen')}>
        <Icon name="people-outline" size={24} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('CalendarScreen')}>
        <Icon name="calendar-outline" size={24} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')}>
        <Icon name="person-outline" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

export default BottomBar;

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
});
