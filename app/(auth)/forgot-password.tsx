import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/hooks/useAuth';
import { spacing, typography } from '@/theme';
import { toUserMessage } from '@/utils/errors';
import { forgotPasswordSchema, validate } from '@/utils/validators';

export default function ForgotPasswordScreen() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const result = validate(forgotPasswordSchema, { email });
    if (!result.ok) {
      setFieldError(result.errors.email);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await sendPasswordReset(result.data.email);
      setSent(true);
    } catch (error) {
      setFormError(toUserMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll edges={['bottom']}>
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>Enter your account email and we’ll send you a link to choose a new password.</Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setFieldError(undefined);
          setSent(false);
        }}
        error={fieldError}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
        maxLength={254}
      />

      <FormMessage message={formError} />
      {/* Same message whether or not the account exists, so the form can't be used to discover emails. */}
      <FormMessage
        tone="success"
        message={sent ? 'If an account exists for that email, a reset link is on its way.' : null}
      />
      <AppButton label={sent ? 'Send again' : 'Send reset link'} onPress={handleSubmit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.sm },
  subtitle: { ...typography.caption, fontSize: 15, marginBottom: spacing.xl },
});
