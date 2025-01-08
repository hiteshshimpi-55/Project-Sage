import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Modal } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatListUser, ChatService } from './service';
import { RootStackParamList } from '../../App';
import theme from '@utils/theme';

const ChannelListing: React.FC = () => {
    const [users, setUsers] = useState<ChatListUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const currentUserId = await ChatService.getCurrentUserId();
            setCurrentUserId(currentUserId!);
            if (currentUserId) {
                const groups = await ChatService.getGroups(currentUserId);
                setUsers(groups);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const filteredUsers = users.filter(user => {
        const fullName = user.name!.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
    });

    const handleCreateGroup = async () => {
        if (groupName.trim()) {
            try {
                const chatId = await ChatService.createGroupChat(currentUserId, groupName);
                loadUsers();
            } catch (error) {
                console.error('Error creating group:', error);
            }
            setModalVisible(false);
        }
    };

    const renderUser = ({ item }: { item: ChatListUser }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => { navigation.navigate('ChatScreen', { id: item.id!, type: item.type! }); }}
        >
            <Image
                source={{
                    uri: 'https://picsum.photos/200/300', // Dummy profile picture URL
                }}
                style={styles.profilePic}
            />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name!}</Text>
                {item.phone && <Text>{`+${item.phone}`}</Text>}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search channels..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredUsers}
                renderItem={renderUser}
                keyExtractor={(item) => item.id!}
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
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    searchInput: {
      height: 40,
      fontSize: 16,
      fontFamily: theme.fonts.satoshi_regular,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 10,
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
      fontFamily: theme.fonts.satoshi_bold,
      fontWeight: 'bold',
    }
  });  

export default ChannelListing;
