export function immutableReadonlySet<T>(values: Iterable<T>): ReadonlySet<T> {
  const set = new Set(values);
  let view: ReadonlySet<T>;
  view = Object.freeze({
    get size() {
      return set.size;
    },
    has: set.has.bind(set),
    keys: set.keys.bind(set),
    values: set.values.bind(set),
    entries: set.entries.bind(set),
    forEach(
      callbackfn: (value: T, key: T, set: ReadonlySet<T>) => void,
      thisArg?: unknown,
    ) {
      set.forEach((value) => callbackfn.call(thisArg, value, value, view));
    },
    [Symbol.iterator]: set[Symbol.iterator].bind(set),
  }) as ReadonlySet<T>;
  return view;
}
