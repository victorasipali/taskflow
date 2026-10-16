import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { OptionChips } from '@/components/OptionChips';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingState } from '@/components/StateView';
import { useDeleteTask, useTask, useUpdateTask } from '@/hooks/useTasks';
import { colors, radius, spacing, typography } from '@/theme';
import type { TaskStatus } from '@/types';
import { confirmDestructive, showError } from '@/utils/alerts';
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  formatDueDate,
  formatRelative,
  isOverdue,
} from '@/utils/formatters';

const STATUS_OPTIONS = (Object.keys(STATUS_LABELS) as TaskStatus[]).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskQuery = useTask(id);
  const updateTask = useUpdateTask(id);
  const deleteTask = useDeleteTask();

  if (taskQuery.isPending) return <LoadingState message="Loading task…" />;
  if (taskQuery.isError) {
    return (
      <ErrorState
        error={taskQuery.error}
        onRetry={() => taskQuery.refetch()}
        retrying={taskQuery.isFetching}
        title="Couldn't open this task"
      />
    );
  }

  const task = taskQuery.data;
  const overdue = isOverdue(task.due_at, task.status);
  const priority = PRIORITY_COLORS[task.priority];

  const changeStatus = (status: TaskStatus) => {
    if (status === task.status || updateTask.isPending) return;
    updateTask.mutate({ status }, { onError: (error) => showError(error, "Couldn't update status") });
  };

  const handleDelete = () =>
    confirmDestructive({
      title: 'Delete this task?',
      message: `“${task.title}” will be permanently deleted.`,
      onConfirm: () =>
        deleteTask.mutate(task.id, {
          onSuccess: () => router.back(),
          onError: (error) => showError(error, "Couldn't delete task"),
        }),
    });

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.card}>
        {task.project ? (
          <View style={styles.projectRow}>
            <View style={[styles.dot, { backgroundColor: task.project.color }]} />
            <Text style={styles.projectName}>{task.project.name}</Text>
          </View>
        ) : null}
        <Text style={[styles.title, task.status === 'done' && styles.titleDone]}>{task.title}</Text>

        <View style={styles.metaRow}>
          <View style={[styles.pill, { backgroundColor: priority.bg }]}>
            <Text style={[styles.pillText, { color: priority.fg }]}>{PRIORITY_LABELS[task.priority]} priority</Text>
          </View>
          {task.remind && task.due_at ? (
            <View style={[styles.pill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.pillText, { color: colors.primary }]}>🔔 Reminder on</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.label}>Due</Text>
        <Text style={[styles.value, overdue && styles.overdue]}>
          {formatDueDate(task.due_at)}
          {overdue ? ' — overdue' : ''}
        </Text>

        <Text style={styles.label}>Notes</Text>
        <Text style={[styles.value, !task.notes && styles.muted]}>{task.notes || 'No notes'}</Text>

        <Text style={styles.updated}>Updated {formatRelative(task.updated_at)}</Text>
      </View>

      <OptionChips label="Status" options={STATUS_OPTIONS} value={task.status} onChange={changeStatus} />

      <View style={styles.actions}>
        <AppButton
          label="Edit task"
          variant="secondary"
          style={styles.actionButton}
          onPress={() => router.push({ pathname: '/task/form', params: { id: task.id } })}
        />
        <AppButton
          label="Delete"
          variant="danger"
          style={styles.actionButton}
          loading={deleteTask.isPending}
          onPress={handleDelete}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  projectName: { ...typography.caption },
  title: { ...typography.title, fontSize: 22 },
  titleDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  pillText: { fontSize: 13, fontWeight: '600' },
  label: { ...typography.label, marginTop: spacing.lg },
  value: { ...typography.body, marginTop: spacing.xs },
  overdue: { color: colors.danger, fontWeight: '600' },
  muted: { color: colors.textMuted },
  updated: { ...typography.caption, marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionButton: { flex: 1 },
});
