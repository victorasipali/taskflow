/** Thrown when a request exceeds its time budget, so the UI can say "timed out" rather than a raw error. */
export class TimeoutError extends Error {
  constructor(message = 'The request took too long. Check your connection and try again.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/** Thrown when an upstream API rate-limits us (HTTP 429). */
export class RateLimitError extends Error {
  constructor(message = 'Too many requests right now. Please wait a minute and retry.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

const NETWORK_HINTS = ['network request failed', 'failed to fetch', 'network error', 'fetch failed'];

/**
 * Turns any thrown value into a sentence a user can act on.
 * Supabase and fetch errors are often technical, so known cases are rewritten.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof TimeoutError || error instanceof RateLimitError) return error.message;

  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const lower = raw.toLowerCase();

  if (NETWORK_HINTS.some((hint) => lower.includes(hint))) {
    return 'You appear to be offline. Check your connection and try again.';
  }
  if (lower.includes('invalid login credentials')) return 'That email and password do not match.';
  if (lower.includes('email not confirmed')) return 'Please confirm your email first — check your inbox.';
  if (lower.includes('user already registered')) return 'An account with this email already exists.';
  if (lower.includes('jwt') || lower.includes('refresh token')) return 'Your session expired. Please log in again.';

  return raw || 'Something went wrong. Please try again.';
}

/** Runs a promise with a deadline. Slow mobile data must surface as a clear timeout, never a hang. */
export function withTimeout<T>(promise: PromiseLike<T>, ms = 15000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
