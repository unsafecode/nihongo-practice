import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";

export interface BaseAudioRecord {
  readonly id: string;
  readonly src: string;
  readonly sha256: string;
  readonly kana: string;
  readonly morae: readonly string[];
  readonly meaning: Readonly<{ readonly en: string; readonly it: string }>;
  readonly sourceNote: string;
  readonly fingerprint: string;
  readonly failureStateIds: Readonly<{
    readonly failed: string;
    readonly unavailable: string;
    readonly retryControl: string;
  }>;
  readonly canonicalPlayback: "asset-only-no-tts-fallback";
}

export type BaseAudioCatalogError =
  | "invalid-catalog-shape"
  | "invalid-record-shape"
  | "duplicate-id"
  | "duplicate-src"
  | "malformed-sha256"
  | "malformed-fingerprint"
  | "invalid-local-path"
  | "mismatched-mora-linkage"
  | "invalid-localized-context"
  | "invalid-source-note"
  | "invalid-failure-metadata"
  | "invalid-playback-policy";

export interface BaseAudioCatalogValidation {
  readonly ok: boolean;
  readonly errors: readonly BaseAudioCatalogError[];
}

export const BASE_AUDIO_COPY: Readonly<
  Record<"en" | "it", Readonly<Record<string, string>>>
> = deepFreeze({
  en: {
    "base-audio-failed":
      "The canonical recording could not play. The kana, mora breaks, and meaning remain visible.",
    "base-audio-unavailable":
      "The canonical recording is unavailable. No browser voice is substituted.",
    "base-audio-retry": "Retry the canonical recording",
  },
  it: {
    "base-audio-failed":
      "La registrazione canonica non è stata riprodotta. Kana, divisione in more e significato restano visibili.",
    "base-audio-unavailable":
      "La registrazione canonica non è disponibile. Non viene sostituita da una voce del browser.",
    "base-audio-retry": "Riprova la registrazione canonica",
  },
});

const EXPECTED_RECORD_KEYS = [
  "id",
  "src",
  "sha256",
  "kana",
  "morae",
  "meaning",
  "sourceNote",
  "fingerprint",
  "failureStateIds",
  "canonicalPlayback",
] as const;

function densePlainArray(value: unknown): readonly unknown[] | undefined {
  if (!Array.isArray(value)) return undefined;
  try {
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return undefined;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.keys(descriptors).length !== value.length + 1) return undefined;
    const result: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
        return undefined;
      }
      result.push(descriptor.value);
    }
    return result;
  } catch {
    return undefined;
  }
}

function plainDataRecord(
  value: unknown,
  exactKeys?: readonly string[],
): Readonly<Record<string, unknown>> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (
      (prototype !== Object.prototype && prototype !== null) ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return undefined;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const names = Object.getOwnPropertyNames(value);
    if (
      names.some((name) => {
        const descriptor = descriptors[name];
        return !descriptor || !("value" in descriptor) || !descriptor.enumerable;
      })
    ) {
      return undefined;
    }
    if (
      exactKeys &&
      (names.length !== exactKeys.length ||
        exactKeys.some((key) => !Object.prototype.hasOwnProperty.call(descriptors, key)))
    ) {
      return undefined;
    }
    return value as Readonly<Record<string, unknown>>;
  } catch {
    return undefined;
  }
}

function ownValue(record: Readonly<Record<string, unknown>>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}

function localizedPair(value: unknown): value is Readonly<{ en: string; it: string }> {
  const record = plainDataRecord(value, ["en", "it"]);
  return (
    record !== undefined &&
    typeof ownValue(record, "en") === "string" &&
    (ownValue(record, "en") as string).trim().length > 0 &&
    typeof ownValue(record, "it") === "string" &&
    (ownValue(record, "it") as string).trim().length > 0
  );
}

const HASH = /^[a-f0-9]{64}$/;
const LOCAL_WAV = /^\/audio\/base\/[a-z0-9-]+\.wav$/;

export function validateBaseAudioCatalog(value: unknown): BaseAudioCatalogValidation {
  const entries = densePlainArray(value);
  if (!entries) return { ok: false, errors: ["invalid-catalog-shape"] };

  const errors = new Set<BaseAudioCatalogError>();
  const ids = new Set<string>();
  const sources = new Set<string>();
  for (const entry of entries) {
    const record = plainDataRecord(entry, EXPECTED_RECORD_KEYS);
    if (!record) {
      errors.add("invalid-record-shape");
      continue;
    }
    const id = ownValue(record, "id");
    const src = ownValue(record, "src");
    const sha256 = ownValue(record, "sha256");
    const fingerprint = ownValue(record, "fingerprint");
    const kana = ownValue(record, "kana");
    const morae = densePlainArray(ownValue(record, "morae"));

    if (typeof id !== "string" || id.trim().length === 0 || ids.has(id)) {
      errors.add("duplicate-id");
    } else {
      ids.add(id);
    }
    if (typeof src !== "string" || !LOCAL_WAV.test(src)) {
      errors.add("invalid-local-path");
    } else if (sources.has(src)) {
      errors.add("duplicate-src");
    } else {
      sources.add(src);
    }
    if (typeof sha256 !== "string" || !HASH.test(sha256)) {
      errors.add("malformed-sha256");
    }
    if (typeof fingerprint !== "string" || !HASH.test(fingerprint)) {
      errors.add("malformed-fingerprint");
    }
    if (
      typeof kana !== "string" ||
      kana.length === 0 ||
      !morae ||
      morae.length === 0 ||
      morae.some((mora) => typeof mora !== "string" || mora.length === 0) ||
      morae.join("") !== kana
    ) {
      errors.add("mismatched-mora-linkage");
    }
    if (!localizedPair(ownValue(record, "meaning"))) {
      errors.add("invalid-localized-context");
    }
    const sourceNote = ownValue(record, "sourceNote");
    if (typeof sourceNote !== "string" || sourceNote.trim().length === 0) {
      errors.add("invalid-source-note");
    }
    const failure = plainDataRecord(ownValue(record, "failureStateIds"), [
      "failed",
      "unavailable",
      "retryControl",
    ]);
    if (
      !failure ||
      ownValue(failure, "failed") !== "base-audio-failed" ||
      ownValue(failure, "unavailable") !== "base-audio-unavailable" ||
      ownValue(failure, "retryControl") !== "base-audio-retry"
    ) {
      errors.add("invalid-failure-metadata");
    }
    if (ownValue(record, "canonicalPlayback") !== "asset-only-no-tts-fallback") {
      errors.add("invalid-playback-policy");
    }
  }
  return { ok: errors.size === 0, errors: [...errors] };
}

const RAW_AUDIO_CATALOG: readonly BaseAudioRecord[] = [
  {
    "id": "snd1-vowel-a",
    "src": "/audio/base/snd1-vowel-a.wav",
    "sha256": "93ce21f438a062df62860e7c05121064f577bf7f262112c1737833c03818b579",
    "kana": "あ",
    "morae": [
      "あ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for あ.",
      "it": "Esempio sonoro canonico per あ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "72ee2f72b8ed6ede47481b55edd262e8546bff3c754b8cdf21efc9b532210942",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd1-vowel-i",
    "src": "/audio/base/snd1-vowel-i.wav",
    "sha256": "de3271cd643e202592eb6ae901ed7d79830c0f61cc98a4046e34a6f186de741d",
    "kana": "い",
    "morae": [
      "い"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for い.",
      "it": "Esempio sonoro canonico per い."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "b5a42691ec3cff5f8057abcf2ab0ae126054abb6c7534068b0eed58cae6af991",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd1-vowel-u",
    "src": "/audio/base/snd1-vowel-u.wav",
    "sha256": "6837e9f6d308d2eac1616d12c0ab59cd7d03049a90ca5c5598032c9e12b705b3",
    "kana": "う",
    "morae": [
      "う"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for う.",
      "it": "Esempio sonoro canonico per う."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "fa43e07aa9f870ee769849efaed1565a30b83ae6bcb2d3d12fa95c76d90b126f",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd1-vowel-e",
    "src": "/audio/base/snd1-vowel-e.wav",
    "sha256": "67417bc4850a4a22e283e59fe30f1fc3377c928be3ec3bb3ca94787ec18840ab",
    "kana": "え",
    "morae": [
      "え"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for え.",
      "it": "Esempio sonoro canonico per え."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "889498acd6e99c1b2b0fdfcaca28844bfeb3b12ea805379b3c19103a78cf08b7",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd1-vowel-o",
    "src": "/audio/base/snd1-vowel-o.wav",
    "sha256": "e0f4a2cc67394619d570b72113c33cffd41121f26cfea5ffad4282f97cf49a7f",
    "kana": "お",
    "morae": [
      "お"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for お.",
      "it": "Esempio sonoro canonico per お."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "b071e8ef34a6ecd2c960877b9f914dd0f45733305792cb18907def78e2bc4f31",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd1-k-row",
    "src": "/audio/base/snd1-k-row.wav",
    "sha256": "2c1da19a1f7507340d4ae456e850e1d17aa82984237616d6800221b6a97a34cd",
    "kana": "かきくけこ",
    "morae": [
      "か",
      "き",
      "く",
      "け",
      "こ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for かきくけこ.",
      "it": "Esempio sonoro canonico per かきくけこ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "bf2c21fa8b9a0b271286edbce36da97977491c4ce5882f4ede023347acbfdbbc",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd1-s-row",
    "src": "/audio/base/snd1-s-row.wav",
    "sha256": "78895a5257d10f6719ef84585116f767e20b0f1d33dcd1b5e47d72d767a9463c",
    "kana": "さしすせそ",
    "morae": [
      "さ",
      "し",
      "す",
      "せ",
      "そ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for さしすせそ.",
      "it": "Esempio sonoro canonico per さしすせそ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "e2bb2c60796a0c277f98b28ddfc71b0f03d974e71d3ca0ab503ec681ed910280",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd1-t-row",
    "src": "/audio/base/snd1-t-row.wav",
    "sha256": "08dcd8d25b76362bde8a0c6bb75c448765460111d6c30a2ad4b1256e8565a226",
    "kana": "たちつてと",
    "morae": [
      "た",
      "ち",
      "つ",
      "て",
      "と"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for たちつてと.",
      "it": "Esempio sonoro canonico per たちつてと."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "627570d03a8b9f8c101caa95cd924a14dc6ed99c72c06b30ee404a9e7a2ed8bd",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd1-n-row",
    "src": "/audio/base/snd1-n-row.wav",
    "sha256": "da1afee486f5e709803f61248ccf7ea809d3bf9355994c451dc75c39c1573793",
    "kana": "なにぬねの",
    "morae": [
      "な",
      "に",
      "ぬ",
      "ね",
      "の"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for なにぬねの.",
      "it": "Esempio sonoro canonico per なにぬねの."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "08268c3a628e737cc397f3811d84b3676009bcee6831d936983d644de5c0cca7",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd1-h-row",
    "src": "/audio/base/snd1-h-row.wav",
    "sha256": "298eb970d6a7c92ef3d257c1ef37bb49ff57e31d4e7d33e8567dbd1910b60762",
    "kana": "はひふへほ",
    "morae": [
      "は",
      "ひ",
      "ふ",
      "へ",
      "ほ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for はひふへほ.",
      "it": "Esempio sonoro canonico per はひふへほ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "516086023751818861e76ced340b28e88c123a4728f272ae707383995d4fefd5",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd1-m-row",
    "src": "/audio/base/snd1-m-row.wav",
    "sha256": "6d95bad99eb62577b7aed4c690b9f5e83d6bc8af888a07e5745886c72bf71062",
    "kana": "まみむめも",
    "morae": [
      "ま",
      "み",
      "む",
      "め",
      "も"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for まみむめも.",
      "it": "Esempio sonoro canonico per まみむめも."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "c22860e921bbeb7d97010b21f466403930509bc5890475340f9249357b2c333f",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd1-glides-liquid-w-n",
    "src": "/audio/base/snd1-glides-liquid-w-n.wav",
    "sha256": "c139305e7f804b72e84754018a878c98410fc22d42541eef3302b94b2e7f159b",
    "kana": "やゆよらりるれろわをん",
    "morae": [
      "や",
      "ゆ",
      "よ",
      "ら",
      "り",
      "る",
      "れ",
      "ろ",
      "わ",
      "を",
      "ん"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for やゆよらりるれろわをん.",
      "it": "Esempio sonoro canonico per やゆよらりるれろわをん."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "665256add5b2264e2b9bbd4312161dfa7c6dc3df70ba97d817e11967edf6c2be",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-ka",
    "src": "/audio/base/snd2-ka.wav",
    "sha256": "7abfd5d9158e79e3fc269339932d593bd197eaeabd6c4fb26f2b8265f3f31d15",
    "kana": "か",
    "morae": [
      "か"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for か.",
      "it": "Esempio sonoro canonico per か."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "17ac5d84139465ad7307e31c2ceb5641edff0580fc8c649fe2cef1b64a2e103d",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-ga",
    "src": "/audio/base/snd2-ga.wav",
    "sha256": "9c0c17b4b90dbb0088c056f50cf37686d63277a1d589cf62723c8b99fb667156",
    "kana": "が",
    "morae": [
      "が"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for が.",
      "it": "Esempio sonoro canonico per が."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "e715aaba69d6cd6db636cc90507795fe6229de6c0a406e402b8daeabd0935592",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-sa",
    "src": "/audio/base/snd2-sa.wav",
    "sha256": "4d5634bdb8f905e10bb65b8657ae7765108ab2f6a8a2c88fb940ab7576e85777",
    "kana": "さ",
    "morae": [
      "さ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for さ.",
      "it": "Esempio sonoro canonico per さ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "019fe7f2523a448ed9c45dab9dbc92405f37b4fd06ea16a9fc7912f1a51c2ebb",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-za",
    "src": "/audio/base/snd2-za.wav",
    "sha256": "e3a5eed7a0fd0d90b78726fdc8b10354f4fc00ac771a49eb0645cc0879c2a470",
    "kana": "ざ",
    "morae": [
      "ざ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ざ.",
      "it": "Esempio sonoro canonico per ざ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "ac236a101f27ce1561b27525658dbe92778306743fe9d06b31d606dc6a78e0f0",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-ta",
    "src": "/audio/base/snd2-ta.wav",
    "sha256": "1a6c4726b24bccea09b56656a82b3813af45539efd13a34d0149953c76f6efdf",
    "kana": "た",
    "morae": [
      "た"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for た.",
      "it": "Esempio sonoro canonico per た."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "ce47a9668e4b1f919f73b36ee225c09d70e4a30de427f1e96555858714a73cd5",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-da",
    "src": "/audio/base/snd2-da.wav",
    "sha256": "0be26357fd75aca9dda2df686a643dc8a41e510f62312099d4768c5fe522d56b",
    "kana": "だ",
    "morae": [
      "だ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for だ.",
      "it": "Esempio sonoro canonico per だ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "3b6362ef4f57487fe6097796f80229f509c12328e074e5d819ca0352aa3420e6",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-ha",
    "src": "/audio/base/snd2-ha.wav",
    "sha256": "913ee0b4e79796776b2843ee197dcbfd568ed39b922131d853454fb72f238551",
    "kana": "は",
    "morae": [
      "は"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for は.",
      "it": "Esempio sonoro canonico per は."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "437150c1bc4b0835d081972b3c3e59d2f199da4bd53ca95b1bf03fb3e4c972b3",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-ba",
    "src": "/audio/base/snd2-ba.wav",
    "sha256": "4de7e1f401666250396306fe8386297f785dd85921ae511a7802debe2f87b525",
    "kana": "ば",
    "morae": [
      "ば"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ば.",
      "it": "Esempio sonoro canonico per ば."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "2b93b411e8bf3a57f433963c9527ecffee9b44af6a961188b80bc3449493bd03",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-pa",
    "src": "/audio/base/snd2-pa.wav",
    "sha256": "cc944d3a4ff11e1db4d22d33707d49e23266ee6389f6771066df9613f892d6d1",
    "kana": "ぱ",
    "morae": [
      "ぱ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ぱ.",
      "it": "Esempio sonoro canonico per ぱ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "62662979c2dda3b39489d7e5b561bffcb25ae546238356e322f6282b89811d57",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-ji",
    "src": "/audio/base/snd2-ji.wav",
    "sha256": "4eaafa6d5f4582ad43eecb154bdfd6563c02569d392743df9f3e74633a682eb7",
    "kana": "じ",
    "morae": [
      "じ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for じ.",
      "it": "Esempio sonoro canonico per じ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "c2c78d857dc6a845bbca5c6a20d0451a0336f8a5f693e0bad92c5173bd40071e",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-di",
    "src": "/audio/base/snd2-di.wav",
    "sha256": "1d5cea0e3e48f85b99e6098fd51278b89631c22c72c3a62e4e7ca19733ee06a5",
    "kana": "ぢ",
    "morae": [
      "ぢ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ぢ.",
      "it": "Esempio sonoro canonico per ぢ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "fe4b66b23a058d37d8b0bc3bd043cd226c45785941ebc5aeaf40c99f079ca7a8",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-zu",
    "src": "/audio/base/snd2-zu.wav",
    "sha256": "fe1bd1f02c362eea92357b3007753a96bd94e50e78c13fb15b6d4e258ae05c75",
    "kana": "ず",
    "morae": [
      "ず"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ず.",
      "it": "Esempio sonoro canonico per ず."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "a0367d1c2c92fe687776b0a5de2272a17d7db3f454e9b3f6609edae76d53ac8a",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-dzu",
    "src": "/audio/base/snd2-dzu.wav",
    "sha256": "fe1bd1f02c362eea92357b3007753a96bd94e50e78c13fb15b6d4e258ae05c75",
    "kana": "づ",
    "morae": [
      "づ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for づ.",
      "it": "Esempio sonoro canonico per づ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "0291318dfbba71076fa7623cb4f03c381a7d7730f9d8136e8ecb31f2a43f1104",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd2-pu",
    "src": "/audio/base/snd2-pu.wav",
    "sha256": "5572838f80331994b1e4c1c44ef88f481a8fbc9bbc4017c190855bdf48f5461c",
    "kana": "ぷ",
    "morae": [
      "ぷ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ぷ.",
      "it": "Esempio sonoro canonico per ぷ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "e9af81819df3fd47166729d1e1215bee58acb8e0a5717dc8fcb5b57a8536bfd2",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-obasan",
    "src": "/audio/base/snd3-obasan.wav",
    "sha256": "8be8497557913e8f49e2340e056badcc8f77e0effc06a8f40e96499d7c6df909",
    "kana": "おばさん",
    "morae": [
      "お",
      "ば",
      "さ",
      "ん"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for おばさん.",
      "it": "Esempio sonoro canonico per おばさん."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "a17e96d104dc16eea39d74e4f7f75c3545a3c928c93697548bdafd33fe84553a",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-obasan-obaasan",
    "src": "/audio/base/snd3-obasan-obaasan.wav",
    "sha256": "cd50f4b449d438a340b66a98902694dcb2dff7c91195c802521b5787b302b660",
    "kana": "おばあさん",
    "morae": [
      "お",
      "ば",
      "あ",
      "さ",
      "ん"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for おばあさん.",
      "it": "Esempio sonoro canonico per おばあさん."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "dff1ab471f2eec56e0f4071dea53e596d61d4467422df5751d54dd1890a6ff95",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-koko",
    "src": "/audio/base/snd3-koko.wav",
    "sha256": "a2eef3c883043b81dddbcdab5b2e3258094569d6ac2b7679712fa28c1cdc0f04",
    "kana": "ここ",
    "morae": [
      "こ",
      "こ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ここ.",
      "it": "Esempio sonoro canonico per ここ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "d437e495da3250ec4da71d66bc09845bc40cbd074b92cba6a2f47b141d5a313c",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-koukou",
    "src": "/audio/base/snd3-koukou.wav",
    "sha256": "be52fb7a54a3c0dd1458532a2ac459934bef57b269d23d7b987f4927ec22ae07",
    "kana": "こうこう",
    "morae": [
      "こ",
      "う",
      "こ",
      "う"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for こうこう.",
      "it": "Esempio sonoro canonico per こうこう."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "26c40e02ac6517b38edfe3900bc41cc4600a0eaa8dd3e0703c1a20fb45981ffa",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-kite",
    "src": "/audio/base/snd3-kite.wav",
    "sha256": "c325212d859aeecf9c3bfa17f433ba776647a2ce1d883f1cde6c9af8728f81b1",
    "kana": "きて",
    "morae": [
      "き",
      "て"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for きて.",
      "it": "Esempio sonoro canonico per きて."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "dc991783ddfaa483424c936e6f4714ee73c19e8e4d183cf504828234cf661331",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-kite-kitte",
    "src": "/audio/base/snd3-kite-kitte.wav",
    "sha256": "0fef0d85eb5b8dd4f70b17bddee0934d82f71bde513db2d97860dedb044fe653",
    "kana": "きって",
    "morae": [
      "き",
      "っ",
      "て"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for きって.",
      "it": "Esempio sonoro canonico per きって."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "72777317d580162733627224921e741b50d02e050d6891849f11060cbf28cbca",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-saka",
    "src": "/audio/base/snd3-saka.wav",
    "sha256": "1a2da69fd4b857342e87669590c0e7d9cec84f42764682ca8a4955f4eb4199a8",
    "kana": "さか",
    "morae": [
      "さ",
      "か"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for さか.",
      "it": "Esempio sonoro canonico per さか."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "5f91deb2de204462c99afe6acf0539e6fec74a2334c2ed74b0c181f35c5e19a2",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-sakka",
    "src": "/audio/base/snd3-sakka.wav",
    "sha256": "346dc5f52a8477aaedd91f66471dc8f165e8e550beb16cf38d3cbc5f53564091",
    "kana": "さっか",
    "morae": [
      "さ",
      "っ",
      "か"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for さっか.",
      "it": "Esempio sonoro canonico per さっか."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "753a99fb0c25904470f6dca45375077d0e52a4365e366e562dd05422fffa7f58",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-ka",
    "src": "/audio/base/snd3-ka.wav",
    "sha256": "7abfd5d9158e79e3fc269339932d593bd197eaeabd6c4fb26f2b8265f3f31d15",
    "kana": "か",
    "morae": [
      "か"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for か.",
      "it": "Esempio sonoro canonico per か."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "c42d1965d3b5102ff102f87bc5eb5ff081f79a33f4d6ccdfb2ba8b236b21163c",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-ka-kan",
    "src": "/audio/base/snd3-ka-kan.wav",
    "sha256": "1bb60bdc03a85619970a72842163a9104bb9096579d7ac525152995ae50d1fe2",
    "kana": "かん",
    "morae": [
      "か",
      "ん"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for かん.",
      "it": "Esempio sonoro canonico per かん."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "715a85a5452f6c70218fbd726b322eadb6033fac31a0c5749768643cf16676a7",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-ho",
    "src": "/audio/base/snd3-ho.wav",
    "sha256": "c184849bdebe35f851c56c1b695fa1f98aca0d09bf7958ee8f0bfc07d228e551",
    "kana": "ほ",
    "morae": [
      "ほ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ほ.",
      "it": "Esempio sonoro canonico per ほ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "4078c5dc857aa41c3c4a1502fbac01f148e1b7a43b406b2738fdd3542932f04c",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd3-hoon",
    "src": "/audio/base/snd3-hoon.wav",
    "sha256": "0f4d81055165cccb156deb262a393e1e257cde1bfdffad1352b9be4353c993e6",
    "kana": "ほおん",
    "morae": [
      "ほ",
      "お",
      "ん"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ほおん.",
      "it": "Esempio sonoro canonico per ほおん."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "511509b9c1cbf267c29fd9904cdef453ccfc9a53da07127596073e2f9a4ebe1f",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-kya",
    "src": "/audio/base/snd4-kya.wav",
    "sha256": "5a4d189b9a4eea7563800280ddb9d4c0b9bde6976c8093ab310e9ee72c33251a",
    "kana": "きゃ",
    "morae": [
      "きゃ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for きゃ.",
      "it": "Esempio sonoro canonico per きゃ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "ff321f7a9815710b7bf8f7bc7b983cb54a6ab55dc1a6c4017ccdc3c88b9ebe2e",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-sha",
    "src": "/audio/base/snd4-sha.wav",
    "sha256": "8096e0fbb9ad9c68edfb083693edff1302b76cd64a19349b65d8b60b53ab7e15",
    "kana": "しゃ",
    "morae": [
      "しゃ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for しゃ.",
      "it": "Esempio sonoro canonico per しゃ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "ac14e3d02adeebde197248e3a603709cedb9fbb5bed68ce91e6733bce5391c4f",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-cha",
    "src": "/audio/base/snd4-cha.wav",
    "sha256": "74770bfaaaedf8fc1a6397736e3d9bad792a240b4eeabd3f5713b1f0e81043b3",
    "kana": "ちゃ",
    "morae": [
      "ちゃ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ちゃ.",
      "it": "Esempio sonoro canonico per ちゃ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "795c6b3818074067df01a5272432d889aec9c35306c5cc4a436c5f50197ac6a7",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-nyu",
    "src": "/audio/base/snd4-nyu.wav",
    "sha256": "27df18d8a61ceaef19b60f763abd837a0c2942741d59cb9e8519afdba6e95d0d",
    "kana": "にゅ",
    "morae": [
      "にゅ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for にゅ.",
      "it": "Esempio sonoro canonico per にゅ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "bb48b8a9d7e7d63590e5cbcef159f2c7ef3791ce913c3dd9f5496d75f329c8f7",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-ryo",
    "src": "/audio/base/snd4-ryo.wav",
    "sha256": "f4184f5bc56e825d7ebd94686170186ac75ce447f6febf3d43b62cf6aacb86bf",
    "kana": "りょ",
    "morae": [
      "りょ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for りょ.",
      "it": "Esempio sonoro canonico per りょ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "96978d8e5031f01c302dfa32129879112ce93a34f9330c3092cadee92edd0b85",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-gyu",
    "src": "/audio/base/snd4-gyu.wav",
    "sha256": "ef209a0b72a0151d8fdada1a4e8d55bff893ec335a44c769d2ff9f3078067536",
    "kana": "ぎゅ",
    "morae": [
      "ぎゅ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ぎゅ.",
      "it": "Esempio sonoro canonico per ぎゅ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "222eb13cbb489b7486f73fce18b897313e50d9ba7f8edb729412ecb603c265bc",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-ja",
    "src": "/audio/base/snd4-ja.wav",
    "sha256": "928e32287e12826bf64034d8a7c6e2025ef793da099475cd6ea94ff6eb163957",
    "kana": "じゃ",
    "morae": [
      "じゃ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for じゃ.",
      "it": "Esempio sonoro canonico per じゃ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "9bb2c45940df2b4f3b64f7bd46966cc5e86db4652e2b6c2450a662cd3688ab68",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-byo",
    "src": "/audio/base/snd4-byo.wav",
    "sha256": "6e7f020bfa04ea3bde9ffba237723ba4de0667bd79ad228009a6c0c3233eb474",
    "kana": "びょ",
    "morae": [
      "びょ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for びょ.",
      "it": "Esempio sonoro canonico per びょ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "0e4665e5b2599d30fc82a56f91e90d14752b23507133b3a77dc8de7a334a7029",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-pyo",
    "src": "/audio/base/snd4-pyo.wav",
    "sha256": "9a9d39d5c18b333f0d67a9b11d01e6883e9307f3aee1264ecdbf2b7188ffd678",
    "kana": "ぴょ",
    "morae": [
      "ぴょ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ぴょ.",
      "it": "Esempio sonoro canonico per ぴょ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "661a2525cf31cd822fa1ed7f30e56fba396036059be00f730e11d388de90df97",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-katakana-a",
    "src": "/audio/base/snd4-katakana-a.wav",
    "sha256": "93ce21f438a062df62860e7c05121064f577bf7f262112c1737833c03818b579",
    "kana": "ア",
    "morae": [
      "ア"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for ア.",
      "it": "Esempio sonoro canonico per ア."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "9cf11da101abcbee510d4f8dcf21234517fd343e1153c28b1a9c5fd17b2e3c20",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-katakana-ka",
    "src": "/audio/base/snd4-katakana-ka.wav",
    "sha256": "7abfd5d9158e79e3fc269339932d593bd197eaeabd6c4fb26f2b8265f3f31d15",
    "kana": "カ",
    "morae": [
      "カ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for カ.",
      "it": "Esempio sonoro canonico per カ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "93dbe797c3503f5c9241062d8d993b59c2016b83255b04815c1bbf58886f67f5",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  },
  {
    "id": "snd4-katakana-ko",
    "src": "/audio/base/snd4-katakana-ko.wav",
    "sha256": "ff52f8775389fc68e15f098e5a77bb13838e10424ac959c656470062cbb0b60d",
    "kana": "コ",
    "morae": [
      "コ"
    ],
    "meaning": {
      "en": "Canonical sound exemplar for コ.",
      "it": "Esempio sonoro canonico per コ."
    },
    "sourceNote": "Original locally generated with the operating-system Japanese speech synthesizer (Kyoko); no human speaker and pending independent listening review.",
    "fingerprint": "1bb3cad31271cbe3e7091d6deba484de14d1340fef2ba9f45db2224af6c79fd7",
    "failureStateIds": {
      "failed": "base-audio-failed",
      "unavailable": "base-audio-unavailable",
      "retryControl": "base-audio-retry"
    },
    "canonicalPlayback": "asset-only-no-tts-fallback"
  }
];

const catalogValidation = validateBaseAudioCatalog(RAW_AUDIO_CATALOG);
if (!catalogValidation.ok) {
  throw new Error(`Invalid Base audio catalog: ${catalogValidation.errors.join(", ")}`);
}

export const BASE_AUDIO_CATALOG: readonly BaseAudioRecord[] =
  deepFreeze(RAW_AUDIO_CATALOG);

const BASE_AUDIO_BY_ID = immutableReadonlyMap(
  BASE_AUDIO_CATALOG.map((record) => [record.id, record] as const),
);

export function baseAudioRecordById(id: unknown): BaseAudioRecord | null {
  return typeof id === "string" ? BASE_AUDIO_BY_ID.get(id) ?? null : null;
}
