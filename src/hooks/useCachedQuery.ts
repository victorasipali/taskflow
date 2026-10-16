import { useQuery, type QueryKey } from '@tanstack/react-query';

import { readCache, saveCache } from '@/services/storageService';
import type { CachedResult } from '@/types';

/**
 * A query whose successful result is mirrored to AsyncStorage. When the network
 * call fails (offline, timeout), the last saved copy is returned with
 * `fromCache: true` so the screen can show it read-only with a banner.
 * If there is no cached copy, the original error propagates to the error state.
 */
export function useCachedQuery<T>(queryKey: QueryKey, cacheKey: string, fetcher: () => Promise<T>, enabled = true) {
  return useQuery<CachedResult<T>>({
    queryKey,
    enabled,
    queryFn: async () => {
      try {
        const items = await fetcher();
        await saveCache(cacheKey, items);
        return { items, fromCache: false, savedAt: null };
      } catch (error) {
        const cached = await readCache<T>(cacheKey);
        if (cached) return { items: cached.value, fromCache: true, savedAt: cached.savedAt };
        throw error;
      }
    },
  });
}
