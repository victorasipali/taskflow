import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { DailyForecast, TemperatureUnit, WeatherReport } from '@/types';
import { describeWeatherCode, formatDayName, formatTemperature } from '@/utils/formatters';

import { AppButton } from './AppButton';
import { TextField } from './TextField';

interface CurrentWeatherCardProps {
  report: WeatherReport;
  unit: TemperatureUnit;
}

export function CurrentWeatherCard({ report, unit }: CurrentWeatherCardProps) {
  const { current } = report;
  const condition = describeWeatherCode(current.weatherCode);

  return (
    <View style={styles.card}>
      <View style={styles.currentRow}>
        <Text style={styles.bigIcon}>{condition.icon}</Text>
        <View style={styles.currentText}>
          <Text style={styles.temperature}>{formatTemperature(current.temperature, unit)}</Text>
          <Text style={styles.condition}>{condition.label}</Text>
        </View>
      </View>
      {report.placeName ? <Text style={styles.place}>📍 {report.placeName}</Text> : null}
      <View style={styles.statsRow}>
        <Stat label="Feels like" value={formatTemperature(current.apparentTemperature, unit)} />
        <Stat label="Wind" value={`${Math.round(current.windSpeed)} km/h`} />
        <Stat label="Rain now" value={`${current.precipitation.toFixed(1)} mm`} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ForecastList({ days, unit }: { days: DailyForecast[]; unit: TemperatureUnit }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>7-day forecast</Text>
      {days.map((day) => {
        const condition = describeWeatherCode(day.weatherCode);
        return (
          <View
            key={day.date}
            style={styles.dayRow}
            accessibilityLabel={`${formatDayName(day.date)}: ${condition.label}`}
          >
            <Text style={styles.dayName}>{formatDayName(day.date)}</Text>
            <Text style={styles.dayIcon}>{condition.icon}</Text>
            <Text style={styles.rainChance}>💧 {day.precipitationProbability}%</Text>
            <Text style={styles.dayTemps}>
              {formatTemperature(day.maxTemp, unit)} / {formatTemperature(day.minTemp, unit)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

interface CityPickerProps {
  onSubmit: (city: string) => Promise<string | null>;
  onUseLocation: () => void;
}

/** Shown when location permission is denied: weather still works from a typed city. */
export function CityPicker({ onSubmit, onUseLocation }: CityPickerProps) {
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [searching, setSearching] = useState(false);

  const handleSubmit = async () => {
    setSearching(true);
    const message = await onSubmit(city);
    setSearching(false);
    setError(message ?? undefined);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Location is off</Text>
      <Text style={styles.helper}>
        Weather needs a place. Allow location access, or type the town you want the forecast for.
      </Text>
      <TextField
        label="City or town"
        placeholder="e.g. Lae"
        value={city}
        onChangeText={setCity}
        error={error}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
        maxLength={80}
      />
      <AppButton label="Show weather" onPress={handleSubmit} loading={searching} />
      <AppButton label="Try my location again" variant="ghost" onPress={onUseLocation} style={styles.secondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentRow: { flexDirection: 'row', alignItems: 'center' },
  bigIcon: { fontSize: 52, marginRight: spacing.lg },
  currentText: { flex: 1 },
  temperature: { ...typography.title, fontSize: 38 },
  condition: { ...typography.body, color: colors.textMuted },
  place: { ...typography.caption, marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', marginTop: spacing.lg, justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { ...typography.subheading },
  statLabel: { ...typography.caption },
  sectionTitle: { ...typography.heading, marginBottom: spacing.md },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dayName: { ...typography.body, width: 72 },
  dayIcon: { fontSize: 22, width: 40 },
  rainChance: { ...typography.caption, flex: 1 },
  dayTemps: { ...typography.body, fontWeight: '600' },
  helper: { ...typography.caption, fontSize: 15, marginBottom: spacing.lg },
  secondary: { marginTop: spacing.sm },
});
