import { StyleSheet, Text, View } from 'react-native';

import { useIsOffline } from '@/hooks/useNetworkStatus';
import { colors, spacing, typography } from '@/theme';
import { formatRelative } from '@/utils/formatters';

interface OfflineBannerProps {
  /** Set when the data on screen came from the local cache rather than the server. */
  cachedAt?: string | null;
}

/** Explains why data may be stale. Renders nothing when online and showing live data. */
export function OfflineBanner({ cachedAt }: OfflineBannerProps) {
  const isOffline = useIsOffline();
  if (!isOffline && !cachedAt) return null;

  const detail = cachedAt ? `Showing your saved copy from ${formatRelative(cachedAt)}.` : 'Changes need a connection.';

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>
        {isOffline ? "You're offline. " : "Couldn't reach the server. "}
        {detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningSoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  text: { ...typography.caption, color: colors.text },
});
