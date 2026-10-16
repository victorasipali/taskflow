import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, type TextInput } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/services/supabase';
import { colors, spacing, typography } from '@/theme';
import { toUserMessage } from '@/utils/errors';
import { loginSchema, validate, type FieldErrors, type LoginValues } from '@/utils/validators';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<LoginValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof LoginValues) => (text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const result = validate(loginSchema, values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      // On success the auth listener updates the session and the router swaps to the app.
      await signIn(result.data.email, result.data.password);
    } catch (error) {
      setFormError(toUserMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Text style={styles.logo}>✓</Text>
        <Text style={styles.title}>TaskFlow</Text>
        <Text style={styles.subtitle}>Plan your projects. Finish your tasks.</Text>
      </View>

      {!isSupabaseConfigured ? (
        <FormMessage message="Supabase is not configured. Copy .env.example to .env and add your project URL and anon key." />
      ) : null}

      <TextField
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
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        maxLength={128}
      />

      <Link href="/forgot-password" style={styles.forgot}>
        Forgot password?
      </Link>

      <FormMessage message={formError} />
      <AppButton label="Log in" onPress={handleSubmit} loading={submitting} />

      <View style={styles.footer}>
        <Text style={typography.caption}>New to TaskFlow? </Text>
        <Link href="/register" style={styles.link}>
          Create an account
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xxl },
  logo: {
    fontSize: 36,
    color: colors.textInverse,
    backgroundColor: colors.primary,
    width: 72,
    height: 72,
    borderRadius: 20,
    textAlign: 'center',
    lineHeight: 72,
    overflow: 'hidden',
    fontWeight: '700',
  },
  title: { ...typography.title, marginTop: spacing.lg },
  subtitle: { ...typography.caption, fontSize: 15, marginTop: spacing.xs },
  forgot: { color: colors.primary, fontWeight: '600', alignSelf: 'flex-end', marginBottom: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, flexWrap: 'wrap' },
  link: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});
