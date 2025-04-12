import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const AboutUsScreen = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleReadMore = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Dr. Pranita Ashok</Text>
        <Text style={styles.subtitle}>MBBS MD (Physiology), PhD in Nutrition and Metabolism</Text>
        
        <Text style={styles.text}>
          ➢ Very few people in India have a PhD medical degree in Nutrition {'\n'}
          ➢ Dr. Pranita runs Obesity and Diet Clinic in K K Market at Balaji Nagar, Pune, and also works as an Associate Professor in the Department of Physiology, Bharati University Medical College. {'\n'}
          ➢ She runs a food awareness campaign called Mission Prevention. You can participate in it by texting your name to WhatsApp number 9545085085 where you are sent daily dietary tips and a free nutrition course. {'\n'}
          ➢ She received Ahmedabad's Dye Care Diabetes Institute's 2018 Young Researcher Award {'\n'}
          ➢ 2020 Super Woman Award {'\n'}
          ➢ 2021 Woman Scientist Award {'\n'}
          ➢ Best Motivational Speaker 2024 - Pratibha Puraskar at नागपूर {'\n'}
        </Text>

        {isExpanded && (
          <Text style={styles.text}>
            ➢ Guest lecture on 25 February 2022 for PRAJAPITA BRAHMA KUMARIS ISHWARIYA VISHWA VIDYALAYA on आहार & आरोग्य for Faraskhana Police Station {'\n'}
            ➢ Faculty at Research Society Conference 2023 at SKNMC Pune {'\n'}
            ➢ Guest Speaker at Atal Bihari Medical College on Nutrition & Health 14 March 2024 {'\n'}
            ➢ Presented research papers from around the world (Korea, London, Oxford, Singapore, China, USA, Japan, Italy, etc.) with Travel Awards from various diabetes organizations in the country. {'\n'}
            ➢ Published around 40 research papers on obesity and diabetes prevention and nutritional value. {'\n'}
            ➢ Asia Specific Medical Excellence Award 2023. {'\n'}
            ➢ Best Motivational Speaker Pratibha Puraskar 2024 {'\n'}
          </Text>
        )}

        <TouchableOpacity onPress={toggleReadMore} style={styles.button}>
          <Text style={styles.buttonText}>{isExpanded ? 'Read Less' : 'Read More'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    padding: 20,
  },
  card: {
    backgroundColor: '#A2CFBF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#096645',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#096645',
    marginBottom: 15,
  },
  text: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 10,
  },
  button: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#096645',
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default AboutUsScreen;