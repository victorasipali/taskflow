import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { removeTaskReminder } from '@/services/notificationService';
import * as projectService from '@/services/projectService';
import { queryKeys } from '@/services/queryClient';
import * as taskService from '@/services/taskService';
import type { ProjectInput } from '@/types';

import { useCachedQuery } from './useCachedQuery';

export function useProjects() {
  return useCachedQuery(queryKeys.projects, 'projects', projectService.listProjects);
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.project(id ?? ''),
    queryFn: () => projectService.getProject(id as string),
    enabled: Boolean(id),
  });
}

/** Invalidates everything that shows project data (projects list and task lists showing project names). */
function useInvalidateProjects() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['projects'] }),
      client.invalidateQueries({ queryKey: ['tasks'] }),
    ]);
}

export function useCreateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (input: ProjectInput) => projectService.createProject(input),
    onSuccess: invalidate,
  });
}

export function useUpdateProject(id: string) {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (input: ProjectInput) => projectService.updateProject(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // The database cascades the delete to the project's tasks, so cancel their reminders too.
      const tasks = await taskService.listTasks({ projectId: id });
      await projectService.deleteProject(id);
      await Promise.all(tasks.map((task) => removeTaskReminder(task.id)));
    },
    // Skip refetching the deleted project itself — it would only 404 while the screen closes.
    onSuccess: (_result, id) =>
      Promise.all([
        client.invalidateQueries({ queryKey: ['projects'], predicate: (query) => query.queryKey[1] !== id }),
        client.invalidateQueries({ queryKey: ['tasks'] }),
      ]),
  });
}
