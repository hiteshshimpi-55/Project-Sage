import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/atoms/Button';

interface UserRowProps {
  name: string;
  phone: string;
  role: string;
  status: string;
  onActivate: () => void;
  onMakeAdmin: () => void;
}

const UserRow: React.FC<UserRowProps> = ({
  name,
  phone,
  role,
  status,
  onActivate,
  onMakeAdmin,
}) => {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{phone}</Text>
      <Text style={styles.text}>{name}</Text>
      <Text style={styles.text}>{role}</Text>
      <Text style={styles.text}>{status}</Text>
      <Button
        title="Activate"
        onPress={onActivate}
        style={styles.actionButton}
      />
      <Button
        title="Make Admin"
        onPress={onMakeAdmin}
        style={styles.actionButton}
      />
    </View>
  );
};

export default UserRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  text: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 10,
    marginHorizontal: 5,
  },
});
