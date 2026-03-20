import { useRef } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, Animated, StyleProp } from 'react-native';
import { COLORS } from '@/constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function PrimaryButton({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  variant = 'primary'
}: PrimaryButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 12,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 12,
      bounciness: 4,
    }).start();
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.button, styles.secondaryButton, style];
      case 'outline':
        return [styles.button, styles.outlineButton, style];
      default:
        return [styles.button, styles.primaryButton, style];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.text, styles.secondaryText, textStyle];
      case 'outline':
        return [styles.text, styles.outlineText, textStyle];
      default:
        return [styles.text, styles.primaryText, textStyle];
    }
  };

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        disabled && styles.disabled,
        // We handle animation via Animated.View, so no need for opacity change on press here if we scale
      ]}
    >
      <Animated.View style={[
        getButtonStyle(),
        { transform: [{ scale: scaleValue }] }
      ]}>
        <Text style={getTextStyle()}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: COLORS.primary, // Dark Green
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary, // Maroon
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary, // Dark Green border
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary, // Dark Green text
  },
  disabled: {
    opacity: 0.5,
  },
});