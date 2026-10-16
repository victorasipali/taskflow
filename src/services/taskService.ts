import type { Task, TaskInput, TaskStatus, TaskWithProject } from '@/types';
import { withTimeout } from '@/utils/errors';

import { supabase } from './supabase';

const TASK_WITH_PROJECT = '*, project:projects(id, name, color)';

export interface TaskFilter {
  projectId?: string;
  status?: TaskStatus;
}

export async function listTasks(filter: TaskFilter = {}): Promise<TaskWithProject[]> {
  let query = supabase
    .from('tasks')
    .select(TASK_WITH_PROJECT)
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (filter.projectId) query = query.eq('project_id', filter.projectId);
  if (filter.status) query = query.eq('status', filter.status);

  const { data, error } = await withTimeout(query);
  if (error) throw error;
  return data as TaskWithProject[];
}

export async function getTask(id: string): Promise<TaskWithProject> {
  const { data, error } = await withTimeout(supabase.from('tasks').select(TASK_WITH_PROJECT).eq('id', id).single());
  if (error) throw error;
  return data as TaskWithProject;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data, error } = await withTimeout(supabase.from('tasks').insert(input).select().single());
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const { data, error } = await withTimeout(supabase.from('tasks').update(input).eq('id', id).select().single());
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await withTimeout(supabase.from('tasks').delete().eq('id', id));
  if (error) throw error;
}
