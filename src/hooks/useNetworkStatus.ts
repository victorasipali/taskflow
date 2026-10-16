import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** True when the device reports no usable connection. */
export function useIsOffline(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setIsOffline(state.isConnected === false || state.isInternetReachable === false);
      }),
    [],
  );

  return isOffline;
}
