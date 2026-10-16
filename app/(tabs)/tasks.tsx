import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { FloatingButton } from '@/components/FloatingButton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { OptionChips } from '@/components/OptionChips';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { TaskRow } from '@/components/TaskRow';
import { usePreferences } from '@/hooks/usePreferences';
import { useAllTasks, useToggleTaskDone } from '@/hooks/useTasks';
import { colors, spacing } from '@/theme';
import type { TaskStatus } from '@/types';
import { showError } from '@/utils/alerts';

type Filter = 'all' | TaskStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export default function AllTasksScreen() {
  const tasksQuery = useAllTasks();
  const { preferences } = usePreferences();
  const { toggle, pendingId } = useToggleTaskDone();
  const [filter, setFilter] = useState<Filter>('all');

  const visibleTasks = useMemo(() => {
    const tasks = tasksQuery.data?.items ?? [];
    if (filter !== 'all') return tasks.filter((task) => task.status === filter);
    return preferences.hideCompleted ? tasks.filter((task) => task.status !== 'done') : tasks;
  }, [tasksQuery.data, filter, preferences.hideCompleted]);

  if (tasksQuery.isPending) return <LoadingState message="Loading tasks…" />;
  if (tasksQuery.isError) {
    return (
      <ErrorState error={tasksQuery.error} onRetry={() => tasksQuery.refetch()} retrying={tasksQuery.isFetching} />
    );
  }

  const { fromCache, savedAt, items } = tasksQuery.data;
  const hasAnyTasks = items.length > 0;

  return (
    <View style={styles.container}>
      <OfflineBanner cachedAt={fromCache ? savedAt : null} />
      <FlatList
        data={visibleTasks}
        keyExtractor={(task) => task.id}
        ListHeaderComponent={hasAnyTasks ? <OptionChips options={FILTERS} value={filter} onChange={setFilter} /> : null}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
            onToggleDone={() => toggle(item, (error) => showError(error))}
            toggleDisabled={pendingId === item.id || fromCache}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={tasksQuery.isRefetching} onRefresh={() => tasksQuery.refetch()} />}
        ListEmptyComponent={
          hasAnyTasks ? (
            <EmptyState icon="🔍" title="No matching tasks" message="Nothing has this status right now." />
          ) : (
            <EmptyState
              icon="📝"
              title="No tasks yet"
              message="Add your first task. You'll need a project to put it in — we'll help you create one."
              actionLabel="Add a task"
              onAction={() => router.push('/task/form')}
            />
          )
        }
      />
      {hasAnyTasks ? <FloatingButton label="Add task" onPress={() => router.push('/task/form')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flexGrow: 1, padding: spacing.lg, paddingBottom: 96 },
});
