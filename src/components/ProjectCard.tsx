import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { ProjectWithCounts } from '@/types';

interface ProjectCardProps {
  project: ProjectWithCounts;
  onPress: () => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const progress = project.task_count === 0 ? 0 : project.done_count / project.task_count;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${project.name}, ${project.done_count} of ${project.task_count} tasks done`}
    >
      <View style={[styles.stripe, { backgroundColor: project.color }]} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {project.name}
        </Text>
        {project.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {project.description}
          </Text>
        ) : null}
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: project.color }]} />
        </View>
        <Text style={styles.count}>
          {project.task_count === 0 ? 'No tasks yet' : `${project.done_count} of ${project.task_count} done`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  stripe: { width: 6 },
  body: { flex: 1, padding: spacing.lg },
  name: { ...typography.subheading, fontSize: 17 },
  description: { ...typography.caption, marginTop: spacing.xs },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  fill: { height: '100%' },
  count: { ...typography.caption, marginTop: spacing.sm },
});
