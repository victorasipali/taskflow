import type { Project, ProjectInput, ProjectWithCounts, TaskStatus } from '@/types';
import { withTimeout } from '@/utils/errors';

import { supabase } from './supabase';

/*
 * Ownership is enforced by Row Level Security in supabase/schema.sql.
 * user_id defaults to auth.uid() in the database, so the client never sends it,
 * and the policies reject any read or write of another user's rows.
 */

type ProjectRow = Project & { tasks: { status: TaskStatus }[] };

export async function listProjects(): Promise<ProjectWithCounts[]> {
  const { data, error } = await withTimeout(
    supabase.from('projects').select('*, tasks(status)').order('created_at', { ascending: false }),
  );
  if (error) throw error;

  return (data as ProjectRow[]).map(({ tasks, ...project }) => ({
    ...project,
    task_count: tasks.length,
    done_count: tasks.filter((task) => task.status === 'done').length,
  }));
}

export async function getProject(id: string): Promise<Project> {
  const { data, error } = await withTimeout(supabase.from('projects').select('*').eq('id', id).single());
  if (error) throw error;
  return data as Project;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const { data, error } = await withTimeout(supabase.from('projects').insert(input).select().single());
  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, input: ProjectInput): Promise<Project> {
  const { data, error } = await withTimeout(supabase.from('projects').update(input).eq('id', id).select().single());
  if (error) throw error;
  return data as Project;
}

/** Deleting a project cascades to its tasks (ON DELETE CASCADE in the schema). */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await withTimeout(supabase.from('projects').delete().eq('id', id));
  if (error) throw error;
}
