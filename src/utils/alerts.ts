import { Alert } from 'react-native';

import { toUserMessage } from './errors';

export function showError(error: unknown, title = "That didn't work") {
  Alert.alert(title, toUserMessage(error));
}

/** Confirmation dialog guarding every destructive action. */
export function confirmDestructive({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
