import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

/**
 * The only button in the app. While `loading` is true it is disabled,
 * which also blocks double-taps from submitting a form twice.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accessibilityHint,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const textColor = variant === 'primary' || variant === 'danger' ? colors.textInverse : variantColor[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const variantColor: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.primary,
  danger: colors.danger,
  ghost: colors.primary,
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.55 },
  label: { fontSize: 16, fontWeight: '600' },
});
