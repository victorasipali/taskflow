import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { AppButton } from '@/components/AppButton';
import { ColorPicker } from '@/components/ColorPicker';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import { useCreateProject, useProject, useUpdateProject } from '@/hooks/useProjects';
import { projectColors } from '@/theme';
import type { Project } from '@/types';
import { toUserMessage } from '@/utils/errors';
import {
  MAX_PROJECT_NAME_LENGTH,
  projectSchema,
  validate,
  type FieldErrors,
  type ProjectFormValues,
} from '@/utils/validators';

/**
 * Create a project, or edit one when an `id` param is passed.
 * This outer component only loads the record; the form below receives
 * its starting values once, so editing pre-populates the stored data.
 */
export default function ProjectFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useProject(id);

  if (!id) return <ProjectForm project={null} />;
  if (existing.isPending) return <LoadingState message="Loading project…" />;
  if (existing.isError) {
    return <ErrorState error={existing.error} onRetry={() => existing.refetch()} retrying={existing.isFetching} />;
  }
  return <ProjectForm project={existing.data} />;
}

function ProjectForm({ project }: { project: Project | null }) {
  const isEditing = project !== null;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(project?.id ?? '');
  const saving = createProject.isPending || updateProject.isPending;

  const [values, setValues] = useState<ProjectFormValues>(() => ({
    name: project?.name ?? '',
    description: project?.description ?? '',
    color: project?.color ?? projectColors[0],
  }));
  const [errors, setErrors] = useState<FieldErrors<ProjectFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const update = <K extends keyof ProjectFormValues>(field: K, value: ProjectFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = () => {
    const result = validate(projectSchema, values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setFormError(null);
    const input = {
      name: result.data.name,
      description: result.data.description || null,
      color: result.data.color,
    };
    const callbacks = {
      onSuccess: () => router.back(),
      onError: (error: unknown) => setFormError(toUserMessage(error)),
    };

    if (isEditing) updateProject.mutate(input, callbacks);
    else createProject.mutate(input, callbacks);
  };

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: isEditing ? 'Edit project' : 'New project' }} />
      <TextField
        label="Project name"
        placeholder="e.g. IS323 assignment"
        value={values.name}
        onChangeText={(text) => update('name', text)}
        error={errors.name}
        // Slightly above the limit so an over-long name gets a clear message instead of silently stopping.
        maxLength={MAX_PROJECT_NAME_LENGTH + 10}
        returnKeyType="next"
      />
      <TextField
        label="Description (optional)"
        placeholder="What is this project for?"
        value={values.description}
        onChangeText={(text) => update('description', text)}
        error={errors.description}
        multiline
        maxLength={320}
      />
      <ColorPicker value={values.color} onChange={(color) => update('color', color)} />

      <FormMessage message={formError} />
      <AppButton label={isEditing ? 'Save changes' : 'Create project'} onPress={handleSave} loading={saving} />
    </Screen>
  );
}
