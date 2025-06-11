import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons'; // For icons
import supabase from '../../core/supabase';
import { RootStackParamList } from 'src/App';

interface TopBarProps {
  isAdmin: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ isAdmin }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SAGE</Text>
      {isAdmin && (
        <View style={styles.icons}>
          <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')} style={styles.icon}>
            <Icon name="settings-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MeetLink')} style={styles.icon}>
            <Icon name="videocam-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  icons: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 15,
  },
});
