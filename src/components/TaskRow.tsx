import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { TaskWithProject } from '@/types';
import { PRIORITY_COLORS, PRIORITY_LABELS, formatDueDate, isOverdue } from '@/utils/formatters';

interface TaskRowProps {
  task: TaskWithProject;
  onPress: () => void;
  onToggleDone: () => void;
  toggleDisabled?: boolean;
  showProject?: boolean;
}

export function TaskRow({ task, onPress, onToggleDone, toggleDisabled = false, showProject = true }: TaskRowProps) {
  const done = task.status === 'done';
  const overdue = isOverdue(task.due_at, task.status);
  const priority = PRIORITY_COLORS[task.priority];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${done ? 'done' : 'not done'}`}
    >
      <Pressable
        onPress={onToggleDone}
        disabled={toggleDisabled}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: toggleDisabled }}
        accessibilityLabel={done ? 'Mark as not done' : 'Mark as done'}
        style={[styles.checkbox, done && styles.checkboxDone, toggleDisabled && styles.checkboxBusy]}
      >
        {done ? <Text style={styles.check}>✓</Text> : null}
      </Pressable>

      <View style={styles.body}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.due, overdue && styles.overdue]} numberOfLines={1}>
            {overdue ? 'Overdue · ' : ''}
            {formatDueDate(task.due_at)}
          </Text>
          {showProject && task.project ? (
            <View style={styles.projectTag}>
              <View style={[styles.dot, { backgroundColor: task.project.color }]} />
              <Text style={styles.projectName} numberOfLines={1}>
                {task.project.name}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.priority, { backgroundColor: priority.bg }]}>
        <Text style={[styles.priorityText, { color: priority.fg }]}>{PRIORITY_LABELS[task.priority]}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.8 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxDone: { backgroundColor: colors.primary },
  checkboxBusy: { opacity: 0.4 },
  check: { color: colors.textInverse, fontWeight: '700' },
  body: { flex: 1, marginRight: spacing.sm },
  title: { ...typography.subheading, fontSize: 15 },
  titleDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: spacing.xs, gap: spacing.sm },
  due: { ...typography.caption },
  overdue: { color: colors.danger, fontWeight: '600' },
  projectTag: { flexDirection: 'row', alignItems: 'center', maxWidth: 140 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
  projectName: { ...typography.caption },
  priority: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  priorityText: { fontSize: 12, fontWeight: '600' },
});
