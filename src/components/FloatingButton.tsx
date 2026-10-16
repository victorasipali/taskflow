import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '@/theme';

interface FloatingButtonProps {
  label: string;
  onPress: () => void;
}

/** Circular "+" action pinned to the bottom-right of list screens. */
export function FloatingButton({ label, onPress }: FloatingButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Text style={styles.plus}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  pressed: { backgroundColor: colors.primaryDark },
  plus: { color: colors.textInverse, fontSize: 30, lineHeight: 32, fontWeight: '400' },
});
