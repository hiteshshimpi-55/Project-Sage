import React from 'react';
import { TextInput, StyleSheet, KeyboardTypeOptions, StyleProp, TextStyle, Text } from 'react-native';

interface InputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  style?: StyleProp<TextStyle>;
}

const Input: React.FC<InputProps> = ({ placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default', style }) => (
  <>
    <Text style={styles.label}>{placeholder}</Text>
    <TextInput
      style={[styles.input, style]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  </>
);

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    color: '#000',
  },
});

export default Input;
