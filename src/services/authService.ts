import * as Linking from 'expo-linking';

import { withTimeout } from '@/utils/errors';

import { supabase } from './supabase';

/*
 * Thin wrapper over Supabase Auth. Passwords go straight to the provider SDK;
 * this app never stores, logs or transmits them itself.
 */

export async function signIn(email: string, password: string) {
  const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }));
  if (error) throw error;
  return data.session;
}

/**
 * Registers a user. If "Confirm email" is on in Supabase (the default),
 * no session is returned until the user clicks the verification link.
 */
export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await withTimeout(
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: Linking.createURL('/login'),
      },
    }),
  );
  if (error) throw error;
  return { session: data.session, needsEmailConfirmation: data.session === null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await withTimeout(
    supabase.auth.resetPasswordForEmail(email, { redirectTo: Linking.createURL('/login') }),
  );
  if (error) throw error;
}

export async function updateDisplayName(displayName: string) {
  const { data, error } = await withTimeout(supabase.auth.updateUser({ data: { display_name: displayName } }));
  if (error) throw error;
  return data.user;
}
