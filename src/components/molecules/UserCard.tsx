import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Button from '../atoms/Button/Button';

interface UserCardProps {
  fullName: string;
  phone: string;
  age: number;
  dob: string;
  gender: string;
  status: string;
  onActivate: () => void;
  onMakeAdmin: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
  fullName,
  phone,
  age,
  dob,
  gender,
  status,
  onActivate,
  onMakeAdmin,
}) => {
  const confirmAction = (action: string, callback: () => void) => {
    Alert.alert(
      `Confirm ${action}`,
      `Are you sure you want to ${action.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: callback },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.circle}>
        <Text style={styles.circleText}>{fullName[0].toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.details}>Phone: {phone}</Text>
        <Text style={styles.details}>Age: {age}</Text>
        <Text style={styles.details}>DOB: {dob}</Text>
        <Text style={styles.details}>Gender: {gender}</Text>
        <Text style={styles.details}>Status: {status}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          title="Activate"
          onPress={() => confirmAction('Activate User', onActivate)}
          style={styles.activateButton}
        />
        <Button
          title="Make Admin"
          onPress={() => confirmAction('Make Admin', onMakeAdmin)}
          style={styles.adminButton}
        />
      </View>
    </View>
  );
};

export default UserCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  details: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  activateButton: {
    backgroundColor: '#28A745',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  adminButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});
