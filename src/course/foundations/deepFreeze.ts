/**
 * Cycle-safe recursive freeze for arrays/objects/records, shared across the
 * foundation fixtures and the A1 release authoring layer.
 *
 * A shallow `Object.freeze` only locks the outermost container, leaving nested
 * values (`slotValues`, `discourse`, `form`, `tokenFragments`, `practice`,
 * lesson recipes, ...) mutable. `deepFreeze` walks the full structure and
 * freezes it in place — no cloning, so references stay stable and types are
 * preserved — while a `seen` set guards against infinite recursion on shared or
 * cyclic references (freezing a value that is already frozen, or one already
 * visited in this call, is a no-op).
 */
export function deepFreeze<T>(value: T, seen: WeakSet<object> = new WeakSet()): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  const asObject = value as unknown as object;
  if (seen.has(asObject) || Object.isFrozen(asObject)) {
    return value;
  }
  seen.add(asObject);

  if (Array.isArray(value)) {
    for (const item of value) {
      deepFreeze(item, seen);
    }
  } else {
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key], seen);
    }
  }

  return Object.freeze(value);
}
