export function immutableReadonlyMap<K, V>(
  entries: Iterable<readonly [K, V]>,
): ReadonlyMap<K, V> {
  const map = new Map(entries);
  let view: ReadonlyMap<K, V>;
  view = Object.freeze({
    get size() {
      return map.size;
    },
    get: map.get.bind(map),
    has: map.has.bind(map),
    keys: map.keys.bind(map),
    values: map.values.bind(map),
    entries: map.entries.bind(map),
    forEach(
      callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void,
      thisArg?: unknown,
    ) {
      map.forEach((value, key) => callbackfn.call(thisArg, value, key, view));
    },
    [Symbol.iterator]: map[Symbol.iterator].bind(map),
  }) as ReadonlyMap<K, V>;
  return view;
}
