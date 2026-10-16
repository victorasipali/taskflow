import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { DueDateField } from '@/components/DueDateField';
import { FormMessage } from '@/components/FormMessage';
import { OptionChips } from '@/components/OptionChips';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import { useDraft } from '@/hooks/useDraft';
import { useProjects } from '@/hooks/useProjects';
import { useCreateTask, useTask, useUpdateTask } from '@/hooks/useTasks';
import { remindersSupported } from '@/services/notificationService';
import { colors, radius, spacing, typography } from '@/theme';
import type { TaskInput, TaskPriority, TaskStatus } from '@/types';
import { toUserMessage } from '@/utils/errors';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/utils/formatters';
import {
  MAX_NOTES_LENGTH,
  MAX_TITLE_LENGTH,
  taskSchema,
  validate,
  type FieldErrors,
  type TaskFormValues,
} from '@/utils/validators';

/** Draft as stored in AsyncStorage — dates are kept as ISO strings. */
type TaskDraft = Omit<TaskFormValues, 'dueAt'> & { dueAt: string | null };

const DRAFT_KEY = 'new-task';

const STATUS_OPTIONS = (Object.keys(STATUS_LABELS) as TaskStatus[]).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));
const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}));

function emptyValues(projectId: string): TaskFormValues {
  return { title: '', notes: '', projectId, status: 'todo', priority: 'medium', dueAt: null, remind: true };
}

/**
 * Create a task, or edit one when an `id` param is passed. `projectId` preselects the project.
 * This outer component loads everything the form needs (projects, the stored task or an
 * unsaved draft) and hands the form its starting values once.
 */
export default function TaskFormScreen() {
  const params = useLocalSearchParams<{ id?: string; projectId?: string }>();
  const isEditing = Boolean(params.id);

  const projectsQuery = useProjects();
  const existing = useTask(params.id);
  // Drafts are only kept for new tasks; edits start from the saved record.
  const draft = useDraft<TaskDraft>(isEditing ? null : DRAFT_KEY, !isEditing);

  const projectOptions = useMemo(
    () => (projectsQuery.data?.items ?? []).map((project) => ({ value: project.id, label: project.name })),
    [projectsQuery.data],
  );

  if (projectsQuery.isPending || (isEditing && existing.isPending) || !draft.isLoaded) {
    return <LoadingState message="Loading…" />;
  }
  if (isEditing && existing.isError) {
    return <ErrorState error={existing.error} onRetry={() => existing.refetch()} retrying={existing.isFetching} />;
  }
  if (projectsQuery.isError) {
    return (
      <ErrorState
        error={projectsQuery.error}
        onRetry={() => projectsQuery.refetch()}
        retrying={projectsQuery.isFetching}
      />
    );
  }
  if (projectOptions.length === 0) {
    return (
      <EmptyState
        icon="📁"
        title="Create a project first"
        message="Every task belongs to a project. Make one, then come back to add tasks."
        actionLabel="Create a project"
        onAction={() => router.replace('/project/form')}
      />
    );
  }

  // Preselect the only project so a one-project user isn't asked to choose.
  const fallbackProjectId = params.projectId ?? (projectOptions.length === 1 ? projectOptions[0].value : '');

  let initialValues = emptyValues(fallbackProjectId);
  let fromDraft = false;
  if (isEditing && existing.data) {
    const task = existing.data;
    initialValues = {
      title: task.title,
      notes: task.notes ?? '',
      projectId: task.project_id,
      status: task.status,
      priority: task.priority,
      dueAt: task.due_at ? new Date(task.due_at) : null,
      remind: task.remind,
    };
  } else if (draft.restored && draft.restored.title.trim()) {
    const saved = draft.restored;
    initialValues = {
      ...saved,
      projectId: params.projectId ?? saved.projectId,
      dueAt: saved.dueAt ? new Date(saved.dueAt) : null,
    };
    fromDraft = true;
  }

  return (
    <TaskForm
      taskId={params.id ?? null}
      initialValues={initialValues}
      restoredFromDraft={fromDraft}
      emptyProjectId={fallbackProjectId}
      projectOptions={projectOptions}
      draft={draft}
    />
  );
}

interface TaskFormProps {
  taskId: string | null;
  initialValues: TaskFormValues;
  restoredFromDraft: boolean;
  emptyProjectId: string;
  projectOptions: { value: string; label: string }[];
  draft: ReturnType<typeof useDraft<TaskDraft>>;
}

function TaskForm({ taskId, initialValues, restoredFromDraft, emptyProjectId, projectOptions, draft }: TaskFormProps) {
  const isEditing = taskId !== null;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask(taskId ?? '');
  const saving = createTask.isPending || updateTask.isPending;

  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<TaskFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [restoredDraft, setRestoredDraft] = useState(restoredFromDraft);

  const update = <K extends keyof TaskFormValues>(field: K, value: TaskFormValues[K]) => {
    setValues((current) => {
      const next = { ...current, [field]: value };
      draft.persist({ ...next, dueAt: next.dueAt?.toISOString() ?? null });
      return next;
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const discardDraft = async () => {
    await draft.discard();
    setValues(emptyValues(emptyProjectId));
    setRestoredDraft(false);
  };

  const handleSave = () => {
    const result = validate(taskSchema, values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    const data = result.data;
    const input: TaskInput = {
      project_id: data.projectId,
      title: data.title,
      notes: data.notes || null,
      status: data.status,
      priority: data.priority,
      due_at: data.dueAt?.toISOString() ?? null,
      remind: data.remind && data.dueAt !== null,
    };

    setFormError(null);
    const callbacks = {
      onSuccess: async ({ reminderScheduled }: { reminderScheduled: boolean }) => {
        if (!isEditing) await draft.discard();
        if (input.remind && !reminderScheduled && input.status !== 'done') {
          Alert.alert(
            'Task saved, reminder not set',
            remindersSupported
              ? 'Either the reminder time has already passed or notifications are turned off for TaskFlow.'
              : 'Reminders only work in the installed app (APK), not in Expo Go.',
          );
        }
        router.back();
      },
      onError: (error: unknown) => setFormError(toUserMessage(error)),
    };

    if (isEditing) updateTask.mutate(input, callbacks);
    else createTask.mutate(input, callbacks);
  };

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: isEditing ? 'Edit task' : 'New task' }} />

      {restoredDraft ? (
        <View style={styles.draftBanner}>
          <Text style={styles.draftText}>Restored your unsaved draft.</Text>
          <AppButton label="Discard" variant="ghost" onPress={discardDraft} />
        </View>
      ) : null}

      <TextField
        label="Title"
        placeholder="What needs doing?"
        value={values.title}
        onChangeText={(text) => update('title', text)}
        error={errors.title}
        maxLength={MAX_TITLE_LENGTH + 10}
      />
      <OptionChips
        label="Project"
        options={projectOptions}
        value={values.projectId || null}
        onChange={(projectId) => update('projectId', projectId)}
        error={errors.projectId}
      />
      <OptionChips
        label="Priority"
        options={PRIORITY_OPTIONS}
        value={values.priority}
        onChange={(priority) => update('priority', priority)}
      />
      <OptionChips
        label="Status"
        options={STATUS_OPTIONS}
        value={values.status}
        onChange={(status) => update('status', status)}
      />
      <DueDateField value={values.dueAt} onChange={(dueAt) => update('dueAt', dueAt)} error={errors.dueAt} />

      {values.dueAt ? (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Remind me on this phone</Text>
          <Switch
            value={values.remind}
            onValueChange={(remind) => update('remind', remind)}
            trackColor={{ true: colors.primary, false: colors.border }}
            accessibilityLabel="Remind me on this phone"
          />
        </View>
      ) : null}

      <TextField
        label="Notes (optional)"
        placeholder="Links, details, sub-steps…"
        value={values.notes}
        onChangeText={(text) => update('notes', text)}
        error={errors.notes}
        multiline
        maxLength={MAX_NOTES_LENGTH + 50}
      />

      <FormMessage message={formError} />
      <AppButton label={isEditing ? 'Save changes' : 'Add task'} onPress={handleSave} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    marginBottom: spacing.lg,
  },
  draftText: { ...typography.body, fontSize: 14 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  switchLabel: { ...typography.body },
});
