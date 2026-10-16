import { isToday } from 'date-fns';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { FloatingButton } from '@/components/FloatingButton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { TaskRow } from '@/components/TaskRow';
import { WeatherSummary } from '@/components/WeatherSummary';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useAllTasks, useToggleTaskDone } from '@/hooks/useTasks';
import { useWeather } from '@/hooks/useWeather';
import { colors, radius, spacing, typography } from '@/theme';
import type { TaskWithProject } from '@/types';
import { showError } from '@/utils/alerts';
import { isOverdue, isWetWeather } from '@/utils/formatters';

const RAIN_ALERT_PROBABILITY = 50;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayScreen() {
  const { displayName } = useAuth();
  const { preferences } = usePreferences();
  const tasksQuery = useAllTasks();
  const weather = useWeather();
  const { toggle, pendingId } = useToggleTaskDone();

  const { overdue, dueToday } = useMemo(() => {
    const tasks: TaskWithProject[] = tasksQuery.data?.items ?? [];
    return {
      overdue: tasks.filter((task) => isOverdue(task.due_at, task.status)),
      dueToday: tasks.filter(
        (task) => task.due_at !== null && isToday(new Date(task.due_at)) && !isOverdue(task.due_at, task.status),
      ),
    };
  }, [tasksQuery.data]);

  // Weather is load-bearing: a wet forecast today flags today's open tasks so the user can plan around it.
  const todayForecast = weather.forecast.data?.items.daily[0];
  const openTodayCount = dueToday.filter((task) => task.status !== 'done').length;
  const showRainAlert =
    todayForecast !== undefined &&
    openTodayCount > 0 &&
    (todayForecast.precipitationProbability >= RAIN_ALERT_PROBABILITY || isWetWeather(todayForecast.weatherCode));

  const refresh = () => {
    void tasksQuery.refetch();
    void weather.forecast.refetch();
  };

  const renderTaskList = (title: string, tasks: TaskWithProject[]) =>
    tasks.length === 0 ? null : (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {title} <Text style={styles.count}>({tasks.length})</Text>
        </Text>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
            onToggleDone={() => toggle(task, (error) => showError(error))}
            toggleDisabled={pendingId === task.id || tasksQuery.data?.fromCache}
          />
        ))}
      </View>
    );

  let body: React.ReactNode;
  if (tasksQuery.isPending) {
    body = <LoadingState message="Loading your tasks…" />;
  } else if (tasksQuery.isError) {
    body = (
      <ErrorState error={tasksQuery.error} onRetry={() => tasksQuery.refetch()} retrying={tasksQuery.isFetching} />
    );
  } else if (overdue.length === 0 && dueToday.length === 0) {
    body = (
      <EmptyState
        icon="🎉"
        title="Nothing due today"
        message="You're all caught up. Add a task with a due date and it will show up here."
        actionLabel="Add a task"
        onAction={() => router.push('/task/form')}
      />
    );
  } else {
    body = (
      <>
        {renderTaskList('Overdue', overdue)}
        {renderTaskList('Due today', dueToday)}
      </>
    );
  }

  return (
    <View style={styles.flex}>
      <Screen
        scroll
        header={<OfflineBanner cachedAt={tasksQuery.data?.fromCache ? tasksQuery.data.savedAt : null} />}
        refreshControl={<RefreshControl refreshing={tasksQuery.isRefetching} onRefresh={refresh} />}
      >
        <Text style={styles.greeting} numberOfLines={1}>
          {greeting()}, {displayName.split(' ')[0]}
        </Text>

        <WeatherSummary weather={weather} unit={preferences.temperatureUnit} onOpen={() => router.push('/weather')} />

        {showRainAlert ? (
          <View style={styles.alert} accessibilityRole="alert">
            <Text style={styles.alertText}>
              🌧️ {todayForecast.precipitationProbability}% chance of rain today and you have {openTodayCount} open{' '}
              {openTodayCount === 1 ? 'task' : 'tasks'} due. Plan any trips outside early.
            </Text>
          </View>
        ) : null}

        {body}
        <View style={styles.fabSpacer} />
      </Screen>
      <FloatingButton label="Add task" onPress={() => router.push('/task/form')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  greeting: { ...typography.title, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.heading, marginBottom: spacing.md },
  count: { ...typography.caption, fontSize: 16 },
  alert: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  alertText: { ...typography.body, fontSize: 14 },
  fabSpacer: { height: 72 },
});
