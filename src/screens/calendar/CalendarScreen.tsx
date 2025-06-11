import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import supabase from '../../core/supabase';

const CalendarPage: React.FC = () => {
  const [appointmentDates, setAppointmentDates] = useState<string[]>([]);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: { marked: true; dotColor: string } }>({});
  const [loading, setLoading] = useState<boolean>(true);

  const fetchActivationDate = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      const activationDate = data.user?.user_metadata?.activation_date;
      if (activationDate) {
        const appointments = calculateNextAppointments(activationDate);
        setAppointmentDates(appointments);
        markDatesOnCalendar(appointments);
      }
    } catch (err) {
      console.error('Error fetching activation date:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextAppointments = (startDate: string) => {
    const dates = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < 5; i++) {
      currentDate.setDate(currentDate.getDate() + 7);
      dates.push(currentDate.toISOString().split('T')[0]); // Format: YYYY-MM-DD
    }

    return dates;
  };

  const markDatesOnCalendar = (dates: string[]) => {
      const marked: { [key: string]: { marked: true; dotColor: string } } = {};
      dates.forEach((date) => {
        marked[date] = { marked: true, dotColor: 'red' };
      });
      setMarkedDates(marked);
    };

  useEffect(() => {
    fetchActivationDate();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Calendar */}
      <Calendar
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#00adf5',
          todayTextColor: '#00adf5',
          arrowColor: 'orange',
        }}
      />

      {/* Appointment Cards */}
      <View style={styles.cardsContainer}>
        {appointmentDates.map((date, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardText}>Appointment {index + 1}</Text>
            <Text style={styles.cardDate}>{date}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default CalendarPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardDate: {
    fontSize: 14,
    color: '#555',
  },
});
