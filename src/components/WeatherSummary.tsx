import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { useWeather } from '@/hooks/useWeather';
import { colors, radius, spacing, typography } from '@/theme';
import type { TemperatureUnit } from '@/types';
import { toUserMessage } from '@/utils/errors';
import { describeWeatherCode, formatTemperature } from '@/utils/formatters';

interface WeatherSummaryProps {
  weather: ReturnType<typeof useWeather>;
  unit: TemperatureUnit;
  onOpen: () => void;
}

/** Compact weather tile for the Today screen, covering every loading/error state. */
export function WeatherSummary({ weather, unit, onOpen }: WeatherSummaryProps) {
  const { location, forecast } = weather;

  let content: React.ReactNode;
  if (location.status === 'locating' || forecast.isPending) {
    content = (
      <View style={styles.row}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.muted}>
          {location.status === 'locating' ? 'Finding your location…' : 'Loading weather…'}
        </Text>
      </View>
    );
  } else if (location.status === 'denied') {
    content = <Text style={styles.muted}>📍 Location is off. Tap to choose a city for weather.</Text>;
  } else if (location.status === 'error' || forecast.isError) {
    const message = location.status === 'error' ? location.message : toUserMessage(forecast.error);
    content = <Text style={styles.muted}>⚠️ Weather unavailable. {message} Tap to open and retry.</Text>;
  } else {
    const report = forecast.data.items;
    const condition = describeWeatherCode(report.current.weatherCode);
    content = (
      <View style={styles.row}>
        <Text style={styles.icon}>{condition.icon}</Text>
        <View style={styles.text}>
          <Text style={styles.temp}>
            {formatTemperature(report.current.temperature, unit)} · {condition.label}
          </Text>
          <Text style={styles.muted} numberOfLines={1}>
            {report.placeName ?? 'Your location'}
            {forecast.data.fromCache ? ' · saved copy' : ''}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Open weather forecast"
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    minHeight: 72,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { fontSize: 34 },
  text: { flex: 1 },
  temp: { ...typography.subheading },
  muted: { ...typography.caption, flexShrink: 1 },
  chevron: { fontSize: 28, color: colors.textMuted },
});
