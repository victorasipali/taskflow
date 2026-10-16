import { useCallback, useEffect, useRef, useState } from 'react';

import { clearDraft, loadDraft, saveDraft } from '@/services/storageService';

const SAVE_DELAY_MS = 500;

/**
 * Persists an unsaved form to AsyncStorage as the user types, so leaving the
 * screen or the app being killed does not lose their work.
 * `restored` is the saved draft (if any) found when the form opened.
 */
export function useDraft<T>(key: string | null, enabled: boolean) {
  const [restored, setRestored] = useState<T | null>(null);
  const [isLoaded, setIsLoaded] = useState(!enabled || key === null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || key === null) return;
    loadDraft<T>(key)
      .then(setRestored)
      .finally(() => setIsLoaded(true));
  }, [key, enabled]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const persist = useCallback(
    (draft: T) => {
      if (!enabled || key === null) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void saveDraft(key, draft), SAVE_DELAY_MS);
    },
    [key, enabled],
  );

  const discard = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    if (key !== null) await clearDraft(key);
  }, [key]);

  return { restored, isLoaded, persist, discard };
}
