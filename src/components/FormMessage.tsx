import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface FormMessageProps {
  message: string | null;
  tone?: 'error' | 'success';
}

/** Form-level message (e.g. "wrong password", "check your inbox") shown above the submit button. */
export function FormMessage({ message, tone = 'error' }: FormMessageProps) {
  if (!message) return null;
  const isError = tone === 'error';

  return (
    <View
      style={[styles.box, { backgroundColor: isError ? colors.dangerSoft : colors.successSoft }]}
      accessibilityRole="alert"
    >
      <Text style={[styles.text, { color: isError ? colors.danger : colors.success }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  text: { ...typography.body, fontSize: 14 },
});
