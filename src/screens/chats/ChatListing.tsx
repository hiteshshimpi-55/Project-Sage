import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatService } from './service';
import { useUser } from '../../hooks/UserContext';
import { RootStackParamList } from '../../App';
import supabase from '../../core/supabase';
import { User } from '@supabase/supabase-js';

const ChatListing: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (user) {
        const fetchedUsers = await ChatService.getAllUsers(user.data.user?.id!);
        console.log('Fetched users:', fetchedUsers);
        setUsers(fetchedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {navigation.navigate('ChatScreen', { id: item.id });}}
    >
      <Image
        source={{
          uri: 'https://picsum.photos/200/300', // Dummy profile picture URL
        }}
        style={styles.profilePic}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{`+${item.phone}`}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatListing;
