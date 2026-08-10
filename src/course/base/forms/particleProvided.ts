import { deepFreeze } from "../../foundations/deepFreeze";

export type ParticleProvidedEntry = readonly [
  role: string,
  particleSense: string,
];

export interface InvalidParticleProvidedEntry {
  readonly code: "invalid-particle-frame";
  readonly role?: string;
}

export interface ParticleProvidedEntries {
  readonly ok: boolean;
  readonly entries: readonly ParticleProvidedEntry[];
  readonly errors: readonly InvalidParticleProvidedEntry[];
}

const OBJECT_PROTOTYPE_PROPERTY_NAMES = new Set(
  Object.getOwnPropertyNames(Object.prototype),
);

function result(
  entries: readonly ParticleProvidedEntry[],
  errors: readonly InvalidParticleProvidedEntry[],
): ParticleProvidedEntries {
  return deepFreeze({
    ok: errors.length === 0,
    entries: [...entries],
    errors: [...errors],
  });
}

/**
 * Extracts particle roles exclusively from own enumerable data descriptors.
 * Malformed records still retain descriptor-backed string entries so every
 * validation boundary can report the same authored particle senses.
 */
export function particleProvidedEntries(value: unknown): ParticleProvidedEntries {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return result([], [{ code: "invalid-particle-frame" }]);
  }
  const record = value as Record<string, unknown>;
  const prototype = Object.getPrototypeOf(record);
  if (prototype !== Object.prototype && prototype !== null) {
    return result([], [{ code: "invalid-particle-frame" }]);
  }

  const errors: InvalidParticleProvidedEntry[] = [];
  const entries: ParticleProvidedEntry[] = [];
  const invalidRoles = new Set<string>();
  const addInvalid = (role?: string): void => {
    if (role === undefined) {
      if (!errors.some((error) => error.role === undefined)) {
        errors.push({ code: "invalid-particle-frame" });
      }
      return;
    }
    if (!invalidRoles.has(role)) {
      invalidRoles.add(role);
      errors.push({ code: "invalid-particle-frame", role });
    }
  };

  if (Object.getOwnPropertySymbols(record).length > 0) {
    addInvalid();
  }
  const descriptors = Object.getOwnPropertyDescriptors(record);
  for (const role of Object.getOwnPropertyNames(record)) {
    const descriptorEntry = Object.getOwnPropertyDescriptor(descriptors, role);
    const descriptor =
      descriptorEntry && "value" in descriptorEntry
        ? (descriptorEntry.value as PropertyDescriptor)
        : undefined;
    if (!descriptor || !("value" in descriptor)) {
      addInvalid(role);
      continue;
    }
    if (!descriptor.enumerable || OBJECT_PROTOTYPE_PROPERTY_NAMES.has(role)) {
      addInvalid(role);
    }
    if (typeof descriptor.value !== "string") {
      addInvalid(role);
      continue;
    }
    entries.push([role, descriptor.value]);
  }

  return result(entries, errors);
}
