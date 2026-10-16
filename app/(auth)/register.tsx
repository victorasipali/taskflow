import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, type TextInput } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/hooks/useAuth';
import { spacing, typography } from '@/theme';
import { toUserMessage } from '@/utils/errors';
import { registerSchema, validate, type FieldErrors, type RegisterValues } from '@/utils/validators';

const EMPTY: RegisterValues = { displayName: '', email: '', password: '', confirmPassword: '' };

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [values, setValues] = useState<RegisterValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<RegisterValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof RegisterValues) => (text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const result = validate(registerSchema, values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const { needsEmailConfirmation } = await signUp(result.data.email, result.data.password, result.data.displayName);
      // With email verification on, Supabase returns no session until the link is clicked.
      if (needsEmailConfirmation) {
        setConfirmationSentTo(result.data.email);
        setValues(EMPTY);
      }
    } catch (error) {
      setFormError(toUserMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationSentTo) {
    return (
      <Screen scroll edges={['bottom']}>
        <Text style={styles.title}>Check your inbox</Text>
        <FormMessage
          tone="success"
          message={`We sent a verification link to ${confirmationSentTo}. Open it, then come back and log in.`}
        />
        <AppButton label="Back to log in" onPress={() => router.replace('/login')} />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['bottom']}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Your projects and tasks sync to every device you sign in on.</Text>

      <TextField
        label="Your name"
        value={values.displayName}
        onChangeText={update('displayName')}
        error={errors.displayName}
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        maxLength={50}
      />
      <TextField
        ref={emailRef}
        label="Email"
        value={values.email}
        onChangeText={update('email')}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        maxLength={254}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        value={values.password}
        onChangeText={update('password')}
        error={errors.password}
        hint="At least 8 characters, with a letter and a number."
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        maxLength={128}
      />
      <TextField
        ref={confirmRef}
        label="Confirm password"
        value={values.confirmPassword}
        onChangeText={update('confirmPassword')}
        error={errors.confirmPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        maxLength={128}
      />

      <FormMessage message={formError} />
      <AppButton label="Create account" onPress={handleSubmit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.sm },
  subtitle: { ...typography.caption, fontSize: 15, marginBottom: spacing.xl },
});
