export interface StoredValue {
  value: string | null;
  available: boolean;
}

export function readSetting(storage: Storage | null, key: string): StoredValue {
  if (!storage) return { value: null, available: false };
  try {
    return { value: storage.getItem(key), available: true };
  } catch {
    return { value: null, available: false };
  }
}

export function writeSetting(
  storage: Storage | null,
  key: string,
  value: string,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeSetting(storage: Storage | null, key: string): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
