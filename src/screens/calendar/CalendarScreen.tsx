import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CalendarScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Calendar Screen</Text>
    </View>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
