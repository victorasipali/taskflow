import Constants from 'expo-constants';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { OptionChips } from '@/components/OptionChips';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { colors, radius, spacing, typography } from '@/theme';
import type { TemperatureUnit } from '@/types';
import { confirmDestructive, showError } from '@/utils/alerts';

const UNIT_OPTIONS: { value: TemperatureUnit; label: string }[] = [
  { value: 'celsius', label: '°C' },
  { value: 'fahrenheit', label: '°F' },
];

const REMINDER_OPTIONS = [
  { value: '0', label: 'At due time' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hour' },
  { value: '1440', label: '1 day' },
];

export default function SettingsScreen() {
  const { user, displayName, updateDisplayName, signOut } = useAuth();
  const { preferences, updatePreferences } = usePreferences();

  const [name, setName] = useState(displayName);
  const [nameError, setNameError] = useState<string | undefined>();
  const [savingName, setSavingName] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const nameChanged = name.trim() !== displayName;

  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    setSavingName(true);
    try {
      await updateDisplayName(trimmed);
    } catch (error) {
      showError(error, "Couldn't update your name");
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = () =>
    confirmDestructive({
      title: 'Log out?',
      message: 'Reminders and saved offline copies on this device will be cleared.',
      confirmLabel: 'Log out',
      onConfirm: async () => {
        setSigningOut(true);
        try {
          await signOut();
        } catch (error) {
          showError(error, "Couldn't log out");
          setSigningOut(false);
        }
      },
    });

  return (
    <Screen scroll>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TextField
          label="Display name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError(undefined);
          }}
          error={nameError}
          maxLength={50}
        />
        {nameChanged ? <AppButton label="Save name" onPress={saveName} loading={savingName} /> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferences</Text>
        <Text style={styles.note}>Saved on this device.</Text>
        <OptionChips
          label="Temperature unit"
          options={UNIT_OPTIONS}
          value={preferences.temperatureUnit}
          onChange={(temperatureUnit) => updatePreferences({ temperatureUnit })}
        />
        <OptionChips
          label="Remind me before a task is due"
          options={REMINDER_OPTIONS}
          value={String(preferences.defaultReminderMinutes)}
          onChange={(value) => updatePreferences({ defaultReminderMinutes: Number(value) })}
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Hide completed tasks in “All tasks”</Text>
          <Switch
            value={preferences.hideCompleted}
            onValueChange={(hideCompleted) => updatePreferences({ hideCompleted })}
            trackColor={{ true: colors.primary, false: colors.border }}
            accessibilityLabel="Hide completed tasks"
          />
        </View>
      </View>

      <AppButton label="Log out" variant="danger" onPress={handleSignOut} loading={signingOut} />
      <Text style={styles.version}>TaskFlow v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.heading, marginBottom: spacing.xs },
  email: { ...typography.caption, marginBottom: spacing.lg },
  note: { ...typography.caption, marginBottom: spacing.lg },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { ...typography.body, flex: 1, marginRight: spacing.md },
  version: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl },
});
