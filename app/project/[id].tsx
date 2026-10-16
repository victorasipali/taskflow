import { Stack, router, useLocalSearchParams } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { FloatingButton } from '@/components/FloatingButton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { TaskRow } from '@/components/TaskRow';
import { useDeleteProject, useProject } from '@/hooks/useProjects';
import { useProjectTasks, useToggleTaskDone } from '@/hooks/useTasks';
import { colors, radius, spacing, typography } from '@/theme';
import { confirmDestructive, showError } from '@/utils/alerts';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectQuery = useProject(id);
  const tasksQuery = useProjectTasks(id);
  const deleteProject = useDeleteProject();
  const { toggle, pendingId } = useToggleTaskDone();

  if (projectQuery.isPending) return <LoadingState message="Loading project…" />;
  if (projectQuery.isError) {
    return (
      <ErrorState
        error={projectQuery.error}
        onRetry={() => projectQuery.refetch()}
        retrying={projectQuery.isFetching}
        title="Couldn't open this project"
      />
    );
  }

  const project = projectQuery.data;
  const tasks = tasksQuery.data?.items ?? [];
  const doneCount = tasks.filter((task) => task.status === 'done').length;
  const fromCache = tasksQuery.data?.fromCache ?? false;

  const handleDelete = () =>
    confirmDestructive({
      title: `Delete “${project.name}”?`,
      message:
        tasks.length > 0
          ? `This also permanently deletes its ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}. This can't be undone.`
          : "This can't be undone.",
      onConfirm: () =>
        deleteProject.mutate(project.id, {
          onSuccess: () => router.back(),
          onError: (error) => showError(error, "Couldn't delete project"),
        }),
    });

  const header = (
    <View>
      <View style={styles.headerCard}>
        <View style={[styles.colorBar, { backgroundColor: project.color }]} />
        <Text style={styles.name}>{project.name}</Text>
        {project.description ? <Text style={styles.description}>{project.description}</Text> : null}
        <Text style={styles.progress}>
          {tasks.length === 0 ? 'No tasks yet' : `${doneCount} of ${tasks.length} tasks done`}
        </Text>
        <View style={styles.actions}>
          <AppButton
            label="Edit"
            variant="secondary"
            style={styles.actionButton}
            onPress={() => router.push({ pathname: '/project/form', params: { id: project.id } })}
          />
          <AppButton
            label="Delete"
            variant="danger"
            style={styles.actionButton}
            loading={deleteProject.isPending}
            onPress={handleDelete}
          />
        </View>
      </View>
      {tasks.length > 0 ? <Text style={styles.sectionTitle}>Tasks</Text> : null}
    </View>
  );

  let emptyComponent: React.ReactElement;
  if (tasksQuery.isPending) {
    emptyComponent = <LoadingState message="Loading tasks…" />;
  } else if (tasksQuery.isError) {
    emptyComponent = (
      <ErrorState error={tasksQuery.error} onRetry={() => tasksQuery.refetch()} retrying={tasksQuery.isFetching} />
    );
  } else {
    emptyComponent = (
      <EmptyState
        icon="🗒️"
        title="No tasks in this project"
        message="Break the project into small steps you can tick off."
        actionLabel="Add the first task"
        onAction={() => router.push({ pathname: '/task/form', params: { projectId: project.id } })}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: project.name }} />
      <OfflineBanner cachedAt={fromCache ? tasksQuery.data?.savedAt : null} />
      <FlatList
        data={tasks}
        keyExtractor={(task) => task.id}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyComponent}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            showProject={false}
            onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
            onToggleDone={() => toggle(item, (error) => showError(error))}
            toggleDisabled={pendingId === item.id || fromCache}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={tasksQuery.isRefetching}
            onRefresh={() => {
              void projectQuery.refetch();
              void tasksQuery.refetch();
            }}
          />
        }
      />
      {tasks.length > 0 ? (
        <FloatingButton
          label="Add task to this project"
          onPress={() => router.push({ pathname: '/task/form', params: { projectId: project.id } })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flexGrow: 1, padding: spacing.lg, paddingBottom: 96 },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  colorBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 },
  name: { ...typography.title, fontSize: 22, marginTop: spacing.xs },
  description: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  progress: { ...typography.caption, marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionButton: { flex: 1 },
  sectionTitle: { ...typography.heading, marginBottom: spacing.md },
});
