import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getCourseCopy } from "../../i18n/catalog";
import {
  BASE_AUDIO_CATALOG,
  resolveBaseAudioAssetUrl,
  validateBaseAudioCatalog,
} from "./catalog";
import {
  BASE_AUDIO_REVIEW_LEDGER,
  BASE_AUDIO_REVIEW_LEDGER_VALIDATION,
  validateBaseAudioReviewLedger,
} from "./reviewLedger";

function cloneCatalog() {
  return BASE_AUDIO_CATALOG.map((record) => ({
    ...record,
    morae: [...record.morae],
    meaning: { ...record.meaning },
    failureStateIds: { ...record.failureStateIds },
  }));
}

function assertDeepFrozen(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) assertDeepFrozen(child, seen);
}

describe("Base canonical audio catalog", () => {
  it("resolves logical asset paths for root and GitHub Pages bases", () => {
    const logicalPath = BASE_AUDIO_CATALOG[0].src;
    expect(resolveBaseAudioAssetUrl(logicalPath, "/")).toBe(logicalPath);
    expect(resolveBaseAudioAssetUrl(logicalPath, "/nihongo-practice/")).toBe(
      `/nihongo-practice${logicalPath}`,
    );
    expect(resolveBaseAudioAssetUrl(logicalPath, "/nihongo-practice")).toBe(
      `/nihongo-practice${logicalPath}`,
    );
    expect(
      resolveBaseAudioAssetUrl(
        "/nihongo-practice/audio/base/already-prefixed.wav",
        "/nihongo-practice/",
      ),
    ).toBeNull();
  });

  it("rejects external, traversal, malformed, and double-prefixed asset paths", () => {
    for (const unsafe of [
      "https://example.com/audio.wav",
      "//example.com/audio.wav",
      "/audio/base/../secret.wav",
      "/audio/base/%2e%2e/secret.wav",
      "/nihongo-practice/audio/base/file.wav",
      "audio/base/file.wav",
    ]) {
      expect(
        resolveBaseAudioAssetUrl(unsafe, "/nihongo-practice/"),
        unsafe,
      ).toBeNull();
    }
  });

  it("resolves every local asset with exact bytes and a pending review entry", () => {
    expect(BASE_AUDIO_CATALOG.length).toBeGreaterThanOrEqual(40);
    expect(BASE_AUDIO_REVIEW_LEDGER).toHaveLength(BASE_AUDIO_CATALOG.length);

    const ledgerByFingerprint = new Map(
      BASE_AUDIO_REVIEW_LEDGER.map((entry) => [entry.fingerprint, entry]),
    );
    for (const record of BASE_AUDIO_CATALOG) {
      expect(record.src).toMatch(/^\/audio\/base\/[a-z0-9-]+\.wav$/);
      expect(record.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(record.fingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect(record.morae.length).toBeGreaterThan(0);
      expect(record.canonicalPlayback).toBe("asset-only-no-tts-fallback");
      expect(record.sourceNote).toContain("locally generated");
      expect(record.sourceNote).toContain(
        "operating-system Japanese speech synthesizer",
      );
      expect(ledgerByFingerprint.get(record.fingerprint)?.status).toBe("pending");

      const bytes = readFileSync(resolve("public", record.src.slice(1)));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(record.sha256);
      expect(
        createHash("sha256")
          .update(
            [
              record.id,
              record.src,
              record.sha256,
              record.kana,
              ...record.morae,
            ].join("\0"),
          )
          .digest("hex"),
      ).toBe(record.fingerprint);
    }
  });

  it("ships mono 44.1 kHz little-endian PCM WAV below -1 dBFS", () => {
    const peakLimit = 10 ** (-1 / 20);
    for (const record of BASE_AUDIO_CATALOG) {
      const bytes = readFileSync(resolve("public", record.src.slice(1)));
      expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
      expect(bytes.toString("ascii", 8, 12)).toBe("WAVE");
      expect(bytes.toString("ascii", 12, 16)).toBe("fmt ");
      expect(bytes.readUInt16LE(20)).toBe(1);
      expect(bytes.readUInt16LE(22)).toBe(1);
      expect(bytes.readUInt32LE(24)).toBe(44_100);
      expect(bytes.readUInt16LE(34)).toBe(16);
      expect(bytes.toString("ascii", 36, 40)).toBe("data");

      let peak = 0;
      for (let offset = 44; offset < bytes.length; offset += 2) {
        peak = Math.max(peak, Math.abs(bytes.readInt16LE(offset)) / 32_768);
      }
      expect(peak).toBeLessThan(peakLimit);
    }
  });

  it("uses identical canonical audio for merged じ/ぢ and ず/づ pronunciation", () => {
    const byId = new Map(BASE_AUDIO_CATALOG.map((record) => [record.id, record]));
    for (const [left, right] of [
      ["snd2-ji", "snd2-di"],
      ["snd2-zu", "snd2-dzu"],
    ] as const) {
      expect(byId.get(left)?.sha256).toBe(byId.get(right)?.sha256);
      expect(
        readFileSync(resolve("public", byId.get(left)!.src.slice(1))),
      ).toEqual(
        readFileSync(resolve("public", byId.get(right)!.src.slice(1))),
      );
    }
  });

  it("localizes retained failure context and never declares a TTS fallback", () => {
    for (const record of BASE_AUDIO_CATALOG) {
      expect(record.kana).not.toBe("");
      expect(record.meaning.en).not.toBe("");
      expect(record.meaning.it).not.toBe("");
      expect(record.failureStateIds).toEqual({
        failed: "base-audio-failed",
        unavailable: "base-audio-unavailable",
        retryControl: "base-audio-retry",
      });
      for (const locale of ["en", "it"] as const) {
        for (const id of Object.values(record.failureStateIds)) {
          expect(getCourseCopy(locale).baseContent[id]).not.toBe("");
        }
      }
      expect(JSON.stringify(record).toLowerCase()).not.toContain("speechsynthesis");
      expect(JSON.stringify(record).toLowerCase()).not.toContain("browser-tts");
    }
  });

  it("deep-freezes the runtime catalog and review ledger without reviewer attribution", () => {
    assertDeepFrozen(BASE_AUDIO_CATALOG);
    assertDeepFrozen(BASE_AUDIO_REVIEW_LEDGER);
    for (const entry of BASE_AUDIO_REVIEW_LEDGER) {
      expect(Object.keys(entry).sort()).toEqual(["fingerprint", "status"]);
      expect(entry.status).toBe("pending");
    }
  });

  it("fails closed on duplicate IDs, malformed hashes, invalid paths, and unsafe inputs", () => {
    const duplicate = cloneCatalog();
    duplicate[1].id = duplicate[0].id;
    expect(validateBaseAudioCatalog(duplicate).errors).toContain("duplicate-id");

    const malformedHash = cloneCatalog();
    malformedHash[0].sha256 = "ABC";
    expect(validateBaseAudioCatalog(malformedHash).errors).toContain("malformed-sha256");

    const remotePath = cloneCatalog();
    (remotePath[0] as { src: string }).src =
      "https://example.com/audio.wav";
    expect(validateBaseAudioCatalog(remotePath).errors).toContain("invalid-local-path");

    const missingSource = cloneCatalog();
    missingSource[0].sourceNote = "";
    expect(validateBaseAudioCatalog(missingSource).errors).toContain(
      "invalid-source-note",
    );

    const mismatchedMorae = cloneCatalog();
    mismatchedMorae[0].morae = ["wrong"];
    expect(validateBaseAudioCatalog(mismatchedMorae).errors).toContain("mismatched-mora-linkage");

    const conflictingSharedBytes = cloneCatalog();
    conflictingSharedBytes[1].sha256 = conflictingSharedBytes[0].sha256;
    expect(validateBaseAudioCatalog(conflictingSharedBytes).errors).toContain(
      "conflicting-shared-audio",
    );

    const equivalentScriptBytes = cloneCatalog();
    const hiraganaA = equivalentScriptBytes.find((record) => record.kana === "あ")!;
    const katakanaA = equivalentScriptBytes.find((record) => record.kana === "ア")!;
    katakanaA.sha256 = hiraganaA.sha256;
    expect(validateBaseAudioCatalog(equivalentScriptBytes).errors).not.toContain(
      "conflicting-shared-audio",
    );

    const sparse = cloneCatalog();
    delete sparse[0];
    expect(validateBaseAudioCatalog(sparse).errors).toContain("invalid-catalog-shape");

    const inherited = Object.setPrototypeOf(cloneCatalog(), { hidden: true });
    expect(validateBaseAudioCatalog(inherited).errors).toContain("invalid-catalog-shape");

    const getterRecord = { ...cloneCatalog()[0] };
    Object.defineProperty(getterRecord, "sha256", { get: () => BASE_AUDIO_CATALOG[0].sha256 });
    expect(validateBaseAudioCatalog([getterRecord]).errors).toContain("invalid-record-shape");
  });

  it("fails release review closed on missing, duplicate, malformed, or invented ledger entries", () => {
    expect(BASE_AUDIO_REVIEW_LEDGER_VALIDATION).toEqual({ ok: true, errors: [] });
    expect(
      validateBaseAudioReviewLedger(BASE_AUDIO_REVIEW_LEDGER, BASE_AUDIO_CATALOG),
    ).toEqual({ ok: true, errors: [] });

    expect(
      validateBaseAudioReviewLedger(BASE_AUDIO_REVIEW_LEDGER.slice(1), BASE_AUDIO_CATALOG).errors,
    ).toContain("missing-review-entry");

    expect(
      validateBaseAudioReviewLedger(
        [...BASE_AUDIO_REVIEW_LEDGER, BASE_AUDIO_REVIEW_LEDGER[0]],
        BASE_AUDIO_CATALOG,
      ).errors,
    ).toContain("duplicate-review-entry");

    expect(
      validateBaseAudioReviewLedger(
        [{ fingerprint: "not-a-hash", status: "accepted" }],
        BASE_AUDIO_CATALOG,
      ).errors,
    ).toContain("malformed-review-entry");

    expect(
      validateBaseAudioReviewLedger(
        [{ fingerprint: BASE_AUDIO_CATALOG[0].fingerprint, status: "reviewed" }],
        BASE_AUDIO_CATALOG,
      ).errors,
    ).toContain("malformed-review-entry");

    expect(
      validateBaseAudioReviewLedger(
        [{ fingerprint: "f".repeat(64), status: "pending" }],
        BASE_AUDIO_CATALOG,
      ).errors,
    ).toContain("unknown-review-entry");
  });
});
