import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CaretDown } from 'phosphor-react-native';
import theme from '@utils/theme';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  options: DropdownOption[];
  placeholder?: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  error?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  placeholder = 'Select an option',
  selectedValue,
  onValueChange,
  error,
}) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setIsDropdownVisible(false);
  };

  const getSelectedLabel = () => {
    const selectedOption = options.find((option) => option.value === selectedValue);
    return selectedOption ? selectedOption.label : placeholder;
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dropdownContainer,
          isDropdownVisible && styles.dropdownFocused,
          error && styles.dropdownError,
        ]}
        onPress={() => setIsDropdownVisible(!isDropdownVisible)}
      >
        <Text
          style={[
            styles.placeholder,
            selectedValue ? styles.selectedText : styles.placeholderText,
          ]}
        >
          {getSelectedLabel()}
        </Text>
        <CaretDown size={20} color={theme.colors.grey_600} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      {isDropdownVisible && (
        <ScrollView
          style={styles.dropdown}
          nestedScrollEnabled={true} // Allows independent scrolling
          keyboardShouldPersistTaps="handled" // Ensures taps are registered
        >
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.option}
              onPress={() => handleSelect(option.value)}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

export default Dropdown;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: theme.colors.text_600,
    fontFamily: theme.fonts.satoshi_bold,
    lineHeight: 21,
    marginBottom: 5,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.grey_300,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  dropdownFocused: {
    borderColor: theme.colors.primary_600,
  },
  dropdownError: {
    borderColor: theme.colors.error_500,
  },
  placeholder: {
    flex: 1,
    fontSize: 16,
  },
  placeholderText: {
    color: theme.colors.grey_400,
    fontFamily: theme.fonts.satoshi_regular,
  },
  selectedText: {
    color: theme.colors.text_900,
    fontFamily: theme.fonts.satoshi_regular,
  },
  error: {
    fontSize: 14,
    color: theme.colors.error_500,
    fontFamily: theme.fonts.satoshi_regular,
    marginTop: 4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.grey_300,
    marginTop: 4,
    maxHeight: 250,
    zIndex: 1000,
    elevation: 5,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey_200,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text_900,
    fontFamily: theme.fonts.satoshi_regular,
  },
});
