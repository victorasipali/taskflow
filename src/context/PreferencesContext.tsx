import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '@/services/storageService';
import type { Preferences } from '@/types';

interface PreferencesContextValue {
  preferences: Preferences;
  updatePreferences: (changes: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/** Device-local user preferences, persisted in AsyncStorage. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    loadPreferences().then(setPreferences);
  }, []);

  const updatePreferences = useCallback((changes: Partial<Preferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...changes };
      void savePreferences(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ preferences, updatePreferences }), [preferences, updatePreferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return context;
}
