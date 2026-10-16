import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { FloatingButton } from '@/components/FloatingButton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ProjectCard } from '@/components/ProjectCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { useProjects } from '@/hooks/useProjects';
import { colors, spacing } from '@/theme';

export default function ProjectsScreen() {
  const projectsQuery = useProjects();
  const openNewProject = () => router.push('/project/form');

  if (projectsQuery.isPending) return <LoadingState message="Loading projects…" />;
  if (projectsQuery.isError) {
    return (
      <ErrorState
        error={projectsQuery.error}
        onRetry={() => projectsQuery.refetch()}
        retrying={projectsQuery.isFetching}
      />
    );
  }

  const { items, fromCache, savedAt } = projectsQuery.data;

  return (
    <View style={styles.container}>
      <OfflineBanner cachedAt={fromCache ? savedAt : null} />
      <FlatList
        data={items}
        keyExtractor={(project) => project.id}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => router.push({ pathname: '/project/[id]', params: { id: item.id } })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={projectsQuery.isRefetching} onRefresh={() => projectsQuery.refetch()} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="📁"
            title="No projects yet"
            message="Projects group related tasks — try “Assignments”, “Work” or “Home”."
            actionLabel="Create a project"
            onAction={openNewProject}
          />
        }
      />
      {items.length > 0 ? <FloatingButton label="New project" onPress={openNewProject} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flexGrow: 1, padding: spacing.lg, paddingBottom: 96 },
});
