import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, projectColors, spacing, typography } from '@/theme';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Colour</Text>
      <View style={styles.row} accessibilityRole="radiogroup">
        {projectColors.map((color) => {
          const selected = color.toLowerCase() === value.toLowerCase();
          return (
            <Pressable
              key={color}
              onPress={() => onChange(color)}
              accessibilityRole="radio"
              accessibilityLabel={`Colour ${color}`}
              accessibilityState={{ selected }}
              style={[styles.swatch, { backgroundColor: color }, selected && styles.selected]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { ...typography.label, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  swatch: { width: 40, height: 40, borderRadius: 20 },
  selected: { borderWidth: 3, borderColor: colors.text },
});
