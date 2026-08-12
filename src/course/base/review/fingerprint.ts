import { createHash } from "node:crypto";

function canonicalValue(value: unknown, seen: WeakSet<object>): string {
  if (value === null) return "null:";
  if (typeof value === "string") return `string:${JSON.stringify(value)}`;
  if (typeof value === "boolean") return value ? "boolean:true" : "boolean:false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Non-finite review value.");
    return `number:${Object.is(value, -0) ? "-0" : String(value)}`;
  }
  if (typeof value === "undefined") return "undefined:";
  if (typeof value !== "object") {
    throw new TypeError("Unsupported review fingerprint value.");
  }
  if (seen.has(value)) throw new TypeError("Cyclic review fingerprint value.");
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const length = descriptors["length"] as PropertyDescriptor | undefined;
      if (
        Object.getPrototypeOf(value) !== Array.prototype ||
        !length ||
        !("value" in length) ||
        typeof length.value !== "number" ||
        Object.getOwnPropertyNames(value).length !== length.value + 1
      ) {
        throw new TypeError("Review arrays must be plain and dense.");
      }
      const parts: string[] = [];
      for (let index = 0; index < length.value; index += 1) {
        const descriptor = descriptors[String(index)];
        if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
          throw new TypeError("Review arrays must contain data properties.");
        }
        parts.push(canonicalValue(descriptor.value, seen));
      }
      return `array:[${parts.join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Review values must be plain records.");
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new TypeError("Review values cannot contain symbols.");
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const names = Object.getOwnPropertyNames(value).sort();
    const parts: string[] = [];
    for (const name of names) {
      const descriptor = descriptors[name];
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
        throw new TypeError("Review records must contain enumerable data.");
      }
      parts.push(
        `${JSON.stringify(name)}:${canonicalValue(descriptor.value, seen)}`,
      );
    }
    return `record:{${parts.join(",")}}`;
  } finally {
    seen.delete(value);
  }
}

export function canonicalReviewFingerprint(value: unknown): string {
  return createHash("sha256")
    .update(canonicalValue(value, new WeakSet()), "utf8")
    .digest("hex");
}
