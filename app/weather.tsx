import { RefreshControl, StyleSheet, Text } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingState } from '@/components/StateView';
import { CityPicker, CurrentWeatherCard, ForecastList } from '@/components/Weather';
import { usePreferences } from '@/hooks/usePreferences';
import { useWeather } from '@/hooks/useWeather';
import { spacing, typography } from '@/theme';
import { formatRelative } from '@/utils/formatters';

/** Full forecast from Open-Meteo, driven by device coordinates or a user-chosen city. */
export default function WeatherScreen() {
  const { location, forecast, relocate, chooseCity } = useWeather();
  const { preferences } = usePreferences();
  const unit = preferences.temperatureUnit;

  if (location.status === 'locating') return <LoadingState message="Finding your location…" />;

  if (location.status === 'denied') {
    return (
      <Screen scroll edges={['bottom']}>
        <CityPicker onSubmit={chooseCity} onUseLocation={relocate} />
      </Screen>
    );
  }

  if (location.status === 'error') {
    return <ErrorState error={location.message} onRetry={relocate} title="Couldn't get your location" />;
  }

  if (forecast.isPending) return <LoadingState message="Loading forecast…" />;

  if (forecast.isError) {
    return (
      <ErrorState
        error={forecast.error}
        onRetry={() => forecast.refetch()}
        retrying={forecast.isFetching}
        title="Weather unavailable"
      />
    );
  }

  const { items: report, fromCache, savedAt } = forecast.data;

  return (
    <Screen
      scroll
      edges={['bottom']}
      header={<OfflineBanner cachedAt={fromCache ? savedAt : null} />}
      refreshControl={<RefreshControl refreshing={forecast.isRefetching} onRefresh={() => forecast.refetch()} />}
    >
      <CurrentWeatherCard report={report} unit={unit} />
      {report.daily.length > 0 ? (
        <ForecastList days={report.daily} unit={unit} />
      ) : (
        <Text style={styles.muted}>No forecast days were returned for this location.</Text>
      )}

      <Text style={styles.muted}>
        Updated {formatRelative(report.fetchedAt)} · Data: Open-Meteo.com
        {location.source === 'manual' ? ` · City set manually` : ''}
      </Text>
      {location.source === 'manual' ? (
        <AppButton label="Use my current location" variant="ghost" onPress={relocate} style={styles.button} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
  button: { marginTop: spacing.md },
});
