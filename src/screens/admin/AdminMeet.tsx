import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Button, TouchableOpacity, Linking } from 'react-native';
import { MeetService } from '../../utils/meet_service';

const AdminMeeting: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);

  const handleGetMeetingLink = async () => {
    setLoading(true);

    try {
      const link = await MeetService.getRandomMeetingLink();

      if (link) {
        setMeetingLink(link);
      } else {
        Alert.alert('No Links Available', 'Please add more meeting links to the database.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch a meeting link.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = async (link: string) => {
    try {
      const supported = await Linking.canOpenURL(link);

      if (supported) {
        await Linking.openURL(link);
      } else {
        Alert.alert('Error', 'Unable to open the link.');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'An error occurred while opening the link.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generate Meeting Link</Text>

      <Button
        title={loading ? 'Loading...' : 'Get Meeting Link'}
        onPress={handleGetMeetingLink}
        disabled={loading}
      />

      {meetingLink && (
        <View style={styles.linkContainer}>
          <Text style={styles.linkTitle}>Your Meeting Link:</Text>
          <TouchableOpacity onPress={() => handleOpenLink(meetingLink)}>
            <Text style={styles.link}>{meetingLink}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AdminMeeting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  linkContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  link: {
    fontSize: 16,
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
});
