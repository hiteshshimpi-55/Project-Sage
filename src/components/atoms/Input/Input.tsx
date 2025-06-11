import theme from '@utils/theme';
import React, { useState } from 'react';
import { TextInput, StyleSheet, KeyboardTypeOptions, StyleProp, TextStyle, Text, View, TouchableOpacity } from 'react-native';
import { Envelope, Eye, EyeSlash, Phone } from 'phosphor-react-native';
type InputVariant = 'text' | 'email' | 'password' | 'phone' | 'number';

interface InputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  variant?: InputVariant;
  style?: StyleProp<TextStyle>;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  variant = 'text',
  style,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const getKeyboardType = (): KeyboardTypeOptions => {
    switch (variant) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      case 'number':
        return 'numeric';
      default:
        return 'default';
    }
  };

  const validateInput = (text: string) => {
    switch (variant) {
      case 'phone':
        const numericValue = text.replace(/[^0-9]/g, '');
        return numericValue.slice(0, 10);
      case 'email':
        return text.toLowerCase();
      default:
        return text;
    }
  };

  const handleChangeText = (text: string) => {
    const validatedText = validateInput(text);
    onChangeText(validatedText);
  };

  const getIcon = () => {
    switch (variant) {
      case 'email':
        return <Envelope size={20} color={theme.colors.grey_600} />;
      case 'phone':
        return <Phone size={20} color={theme.colors.grey_600} />;
      case 'password':
        return !showPassword ?
          <EyeSlash size={20} color={theme.colors.grey_600} /> :
          <Eye size={20} color={theme.colors.grey_600} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError
      ]}>
        <TextInput
          style={[styles.input, style]}
          placeholder={placeholder}
          value={value}
          placeholderTextColor={theme.colors.grey_400}
          onChangeText={handleChangeText}
          keyboardType={getKeyboardType()}
          secureTextEntry={variant === 'password' && !showPassword}
          autoCapitalize={variant === 'email' ? 'none' : 'sentences'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {getIcon() && (
          <TouchableOpacity
            onPress={() => variant === 'password' && setShowPassword(!showPassword)}
            style={styles.iconContainer}
          >
            {getIcon()}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.grey_300,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary_600,
  },
  inputContainerError: {
    borderColor: theme.colors.error_500,
  },
  input: {
    flex: 1,
    fontFamily: theme.fonts.satoshi_regular,
    color: theme.colors.text_900,
    fontSize: 16,
    padding: 12,
  },
  label: {
    fontSize: 16,
    color: theme.colors.text_600,
    fontFamily: theme.fonts.satoshi_bold,
    lineHeight: 21,
    marginBottom: 5,
  },
  error: {
    fontSize: 14,
    color: theme.colors.error_500,
    fontFamily: theme.fonts.satoshi_regular,
    marginTop: 4,
  },
  iconContainer: {
    padding: 12,
  },
});

export default Input;
