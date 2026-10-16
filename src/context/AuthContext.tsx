import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as authService from '@/services/authService';
import { removeAllReminders } from '@/services/notificationService';
import { queryClient } from '@/services/queryClient';
import { clearUserData } from '@/services/storageService';
import { supabase } from '@/services/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  displayName: string;
  /** True until the stored session has been restored on app launch. */
  isRestoring: boolean;
  signIn: typeof authService.signIn;
  signUp: typeof authService.signUp;
  signOut: () => Promise<void>;
  sendPasswordReset: typeof authService.sendPasswordReset;
  updateDisplayName: typeof authService.updateDisplayName;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    // Restores a persisted session from AsyncStorage so users stay logged in across restarts.
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setIsRestoring(false));

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const metadataName = user?.user_metadata?.display_name;

    return {
      session,
      user,
      displayName: typeof metadataName === 'string' && metadataName ? metadataName : (user?.email ?? ''),
      isRestoring,
      signIn: authService.signIn,
      signUp: authService.signUp,
      sendPasswordReset: authService.sendPasswordReset,
      updateDisplayName: authService.updateDisplayName,
      signOut: async () => {
        await authService.signOut();
        // Leave nothing behind for the next person who signs in on this device.
        queryClient.clear();
        await Promise.all([clearUserData(), removeAllReminders()]);
      },
    };
  }, [session, isRestoring]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
