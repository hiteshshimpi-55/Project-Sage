import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationProp, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { ChatService } from '../../utils/chat_service';
import theme from '@utils/theme';

interface Props {
  route: RouteProp<RootStackParamList, 'ChannelDetailsScreen'>;
}

const ChannelDetailsScreen: React.FC<Props> = ({ route }) => {
  const { selectedUsers } = route.params;
  const [groupName, setGroupName] = useState('');
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();


  const handleCreateGroup = async () => {
    const currentUser = await ChatService.getCurrentUserId();
    if (currentUser &&groupName.trim() && selectedUsers.length > 0) {
      try {
        const chatId = await ChatService.createGroupWithUsers(currentUser, groupName, selectedUsers);
        if (!chatId){
          console.error('Error creating group with users:');
        }
        navigation.goBack();
        navigation.goBack();
      } catch (error) {
        console.error('Error creating group:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter group name"
        value={groupName}
        onChangeText={setGroupName}
      />
      <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
        <Text style={styles.createButtonText}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChannelDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 40,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: theme.colors.primary_600,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
