import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import { formatDueDate } from '@/utils/formatters';

interface DueDateFieldProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: string;
}

/** Defaults a newly chosen due date to 5 pm tomorrow, a sensible starting point. */
function defaultDueDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(17, 0, 0, 0);
  return date;
}

/**
 * Android has no combined date-time dialog, so the date dialog is followed by
 * the time dialog. iOS shows an inline picker instead.
 */
export function DueDateField({ value, onChange, error }: DueDateFieldProps) {
  const [showIosPicker, setShowIosPicker] = useState(false);

  const openPicker = () => {
    const initial = value ?? defaultDueDate();
    if (Platform.OS !== 'android') {
      if (!value) onChange(initial);
      setShowIosPicker((visible) => !visible);
      return;
    }

    DateTimePickerAndroid.open({
      value: initial,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (dateEvent: DateTimePickerEvent, pickedDate?: Date) => {
        if (dateEvent.type !== 'set' || !pickedDate) return;
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          onChange: (timeEvent: DateTimePickerEvent, pickedTime?: Date) => {
            onChange(timeEvent.type === 'set' && pickedTime ? pickedTime : pickedDate);
          },
        });
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Due date</Text>
      <View style={styles.row}>
        <Pressable
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={`Due date: ${formatDueDate(value?.toISOString() ?? null)}. Tap to change.`}
          style={[styles.field, error ? styles.fieldError : null]}
        >
          <Text style={value ? styles.value : styles.placeholder}>
            {value ? formatDueDate(value.toISOString()) : 'Add a due date'}
          </Text>
        </Pressable>
        {value ? (
          <Pressable
            onPress={() => {
              onChange(null);
              setShowIosPicker(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear due date"
            hitSlop={8}
            style={styles.clear}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {showIosPicker && value ? (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="inline"
          minimumDate={new Date()}
          onChange={(_event, picked) => picked && onChange(picked)}
        />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { ...typography.label, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center' },
  field: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  fieldError: { borderColor: colors.danger },
  value: { ...typography.body },
  placeholder: { ...typography.body, color: colors.textMuted },
  clear: { marginLeft: spacing.md, padding: spacing.sm },
  clearText: { color: colors.danger, fontWeight: '600' },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
});
