import { useSyncExternalStore } from "react";

export function useClientValue<T>(getValue: () => T, serverValue: T): T {
  return useSyncExternalStore(
    () => () => {},
    getValue,
    () => serverValue,
  );
}
