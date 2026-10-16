import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import { toUserMessage } from '@/utils/errors';

import { AppButton } from './AppButton';

/*
 * The three non-success states every data screen must show.
 * Kept together so loading, empty and error look identical app-wide.
 */

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <AppButton label={actionLabel} onPress={onAction} style={styles.action} /> : null}
    </View>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
  title?: string;
}

export function ErrorState({ error, onRetry, retrying = false, title = "Couldn't load this" }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{toUserMessage(error)}</Text>
      <AppButton label="Try again" onPress={onRetry} loading={retrying} style={styles.action} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 260,
  },
  icon: { fontSize: 44, marginBottom: spacing.md },
  title: { ...typography.heading, textAlign: 'center', marginBottom: spacing.sm },
  message: { ...typography.caption, fontSize: 15, textAlign: 'center', marginTop: spacing.sm, maxWidth: 320 },
  action: { marginTop: spacing.xl, minWidth: 180 },
});
