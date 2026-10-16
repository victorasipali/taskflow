import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePreferences } from '@/context/PreferencesContext';
import { removeTaskReminder, syncTaskReminder } from '@/services/notificationService';
import { queryKeys } from '@/services/queryClient';
import * as taskService from '@/services/taskService';
import type { Task, TaskInput, TaskStatus } from '@/types';

import { useCachedQuery } from './useCachedQuery';

/** All of the user's tasks (cached for offline viewing). */
export function useAllTasks() {
  return useCachedQuery(queryKeys.tasks('all'), 'tasks-all', () => taskService.listTasks());
}

export function useProjectTasks(projectId: string | undefined) {
  return useCachedQuery(
    queryKeys.tasks(`project:${projectId ?? ''}`),
    `tasks-project-${projectId ?? ''}`,
    () => taskService.listTasks({ projectId }),
    Boolean(projectId),
  );
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.task(id ?? ''),
    queryFn: () => taskService.getTask(id as string),
    enabled: Boolean(id),
  });
}

/** After any task write: refresh lists and project counts, and resync this device's reminder. */
function useAfterTaskWrite() {
  const client = useQueryClient();
  const { preferences } = usePreferences();

  return async (task: Task): Promise<{ reminderScheduled: boolean }> => {
    const reminderScheduled = await syncTaskReminder(task, preferences.defaultReminderMinutes).catch(() => false);
    await Promise.all([
      client.invalidateQueries({ queryKey: ['tasks'] }),
      client.invalidateQueries({ queryKey: ['projects'] }),
      client.invalidateQueries({ queryKey: queryKeys.task(task.id) }),
    ]);
    return { reminderScheduled };
  };
}

export function useCreateTask() {
  const afterWrite = useAfterTaskWrite();
  return useMutation({
    mutationFn: async (input: TaskInput) => afterWrite(await taskService.createTask(input)),
  });
}

export function useUpdateTask(id: string) {
  const afterWrite = useAfterTaskWrite();
  return useMutation({
    mutationFn: async (input: Partial<TaskInput>) => afterWrite(await taskService.updateTask(id, input)),
  });
}

/** One-tap status change used by checkboxes in the lists. */
export function useSetTaskStatus() {
  const afterWrite = useAfterTaskWrite();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) =>
      afterWrite(await taskService.updateTask(id, { status })),
  });
}

/**
 * Checkbox handler shared by every task list. Returns the id currently being
 * saved so only that row's checkbox is disabled (prevents rapid double-taps).
 */
export function useToggleTaskDone() {
  const mutation = useSetTaskStatus();

  const toggle = (task: Task, onError: (error: unknown) => void) => {
    if (mutation.isPending) return;
    mutation.mutate({ id: task.id, status: task.status === 'done' ? 'todo' : 'done' }, { onError });
  };

  return { toggle, pendingId: mutation.isPending ? mutation.variables?.id : undefined };
}

export function useDeleteTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await taskService.deleteTask(id);
      await removeTaskReminder(id);
    },
    // The task's own detail query is deliberately not refetched; the screen closes on success.
    onSuccess: () => {
      return Promise.all([
        client.invalidateQueries({ queryKey: ['tasks'] }),
        client.invalidateQueries({ queryKey: ['projects'] }),
      ]);
    },
  });
}
