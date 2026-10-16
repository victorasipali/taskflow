import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Scrollable screens wrap content in a ScrollView that handles the keyboard. */
  scroll?: boolean;
  /** Screens without a navigation header need the top inset. */
  edges?: Edge[];
  refreshControl?: React.ReactElement<RefreshControlProps>;
  padded?: boolean;
  /** Content pinned above the scroll area, e.g. an offline banner. */
  header?: ReactNode;
}

/** Page wrapper: safe areas, background colour, keyboard avoidance and scrolling in one place. */
export function Screen({ children, scroll = false, edges = [], refreshControl, padded = true, header }: ScreenProps) {
  const contentStyle = padded ? styles.padded : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {header}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, contentStyle]}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contentStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  padded: { padding: spacing.lg },
});
