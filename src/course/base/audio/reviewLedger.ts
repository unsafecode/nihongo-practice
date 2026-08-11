import { deepFreeze } from "../../foundations/deepFreeze";
import {
  BASE_AUDIO_CATALOG,
  type BaseAudioRecord,
} from "./catalog";

export type BaseAudioReviewStatus = "pending" | "accepted";

export interface BaseAudioReviewEntry {
  readonly fingerprint: string;
  readonly status: BaseAudioReviewStatus;
}

export type BaseAudioReviewError =
  | "invalid-ledger-shape"
  | "malformed-review-entry"
  | "duplicate-review-entry"
  | "missing-review-entry"
  | "unknown-review-entry";

export interface BaseAudioReviewValidation {
  readonly ok: boolean;
  readonly errors: readonly BaseAudioReviewError[];
}

const RAW_BASE_AUDIO_REVIEW_LEDGER: readonly BaseAudioReviewEntry[] = [
  {
    "fingerprint": "72ee2f72b8ed6ede47481b55edd262e8546bff3c754b8cdf21efc9b532210942",
    "status": "pending"
  },
  {
    "fingerprint": "b5a42691ec3cff5f8057abcf2ab0ae126054abb6c7534068b0eed58cae6af991",
    "status": "pending"
  },
  {
    "fingerprint": "fa43e07aa9f870ee769849efaed1565a30b83ae6bcb2d3d12fa95c76d90b126f",
    "status": "pending"
  },
  {
    "fingerprint": "889498acd6e99c1b2b0fdfcaca28844bfeb3b12ea805379b3c19103a78cf08b7",
    "status": "pending"
  },
  {
    "fingerprint": "b071e8ef34a6ecd2c960877b9f914dd0f45733305792cb18907def78e2bc4f31",
    "status": "pending"
  },
  {
    "fingerprint": "bf2c21fa8b9a0b271286edbce36da97977491c4ce5882f4ede023347acbfdbbc",
    "status": "pending"
  },
  {
    "fingerprint": "e2bb2c60796a0c277f98b28ddfc71b0f03d974e71d3ca0ab503ec681ed910280",
    "status": "pending"
  },
  {
    "fingerprint": "627570d03a8b9f8c101caa95cd924a14dc6ed99c72c06b30ee404a9e7a2ed8bd",
    "status": "pending"
  },
  {
    "fingerprint": "08268c3a628e737cc397f3811d84b3676009bcee6831d936983d644de5c0cca7",
    "status": "pending"
  },
  {
    "fingerprint": "516086023751818861e76ced340b28e88c123a4728f272ae707383995d4fefd5",
    "status": "pending"
  },
  {
    "fingerprint": "c22860e921bbeb7d97010b21f466403930509bc5890475340f9249357b2c333f",
    "status": "pending"
  },
  {
    "fingerprint": "665256add5b2264e2b9bbd4312161dfa7c6dc3df70ba97d817e11967edf6c2be",
    "status": "pending"
  },
  {
    "fingerprint": "17ac5d84139465ad7307e31c2ceb5641edff0580fc8c649fe2cef1b64a2e103d",
    "status": "pending"
  },
  {
    "fingerprint": "e715aaba69d6cd6db636cc90507795fe6229de6c0a406e402b8daeabd0935592",
    "status": "pending"
  },
  {
    "fingerprint": "019fe7f2523a448ed9c45dab9dbc92405f37b4fd06ea16a9fc7912f1a51c2ebb",
    "status": "pending"
  },
  {
    "fingerprint": "ac236a101f27ce1561b27525658dbe92778306743fe9d06b31d606dc6a78e0f0",
    "status": "pending"
  },
  {
    "fingerprint": "ce47a9668e4b1f919f73b36ee225c09d70e4a30de427f1e96555858714a73cd5",
    "status": "pending"
  },
  {
    "fingerprint": "3b6362ef4f57487fe6097796f80229f509c12328e074e5d819ca0352aa3420e6",
    "status": "pending"
  },
  {
    "fingerprint": "437150c1bc4b0835d081972b3c3e59d2f199da4bd53ca95b1bf03fb3e4c972b3",
    "status": "pending"
  },
  {
    "fingerprint": "2b93b411e8bf3a57f433963c9527ecffee9b44af6a961188b80bc3449493bd03",
    "status": "pending"
  },
  {
    "fingerprint": "62662979c2dda3b39489d7e5b561bffcb25ae546238356e322f6282b89811d57",
    "status": "pending"
  },
  {
    "fingerprint": "c2c78d857dc6a845bbca5c6a20d0451a0336f8a5f693e0bad92c5173bd40071e",
    "status": "pending"
  },
  {
    "fingerprint": "0264184345590d2f57dcdd6fa8f6f1e5aecd81e6233e25f0e19677ebd3287ce2",
    "status": "pending"
  },
  {
    "fingerprint": "a0367d1c2c92fe687776b0a5de2272a17d7db3f454e9b3f6609edae76d53ac8a",
    "status": "pending"
  },
  {
    "fingerprint": "0291318dfbba71076fa7623cb4f03c381a7d7730f9d8136e8ecb31f2a43f1104",
    "status": "pending"
  },
  {
    "fingerprint": "e9af81819df3fd47166729d1e1215bee58acb8e0a5717dc8fcb5b57a8536bfd2",
    "status": "pending"
  },
  {
    "fingerprint": "a17e96d104dc16eea39d74e4f7f75c3545a3c928c93697548bdafd33fe84553a",
    "status": "pending"
  },
  {
    "fingerprint": "dff1ab471f2eec56e0f4071dea53e596d61d4467422df5751d54dd1890a6ff95",
    "status": "pending"
  },
  {
    "fingerprint": "d437e495da3250ec4da71d66bc09845bc40cbd074b92cba6a2f47b141d5a313c",
    "status": "pending"
  },
  {
    "fingerprint": "26c40e02ac6517b38edfe3900bc41cc4600a0eaa8dd3e0703c1a20fb45981ffa",
    "status": "pending"
  },
  {
    "fingerprint": "dc991783ddfaa483424c936e6f4714ee73c19e8e4d183cf504828234cf661331",
    "status": "pending"
  },
  {
    "fingerprint": "72777317d580162733627224921e741b50d02e050d6891849f11060cbf28cbca",
    "status": "pending"
  },
  {
    "fingerprint": "5f91deb2de204462c99afe6acf0539e6fec74a2334c2ed74b0c181f35c5e19a2",
    "status": "pending"
  },
  {
    "fingerprint": "753a99fb0c25904470f6dca45375077d0e52a4365e366e562dd05422fffa7f58",
    "status": "pending"
  },
  {
    "fingerprint": "c42d1965d3b5102ff102f87bc5eb5ff081f79a33f4d6ccdfb2ba8b236b21163c",
    "status": "pending"
  },
  {
    "fingerprint": "715a85a5452f6c70218fbd726b322eadb6033fac31a0c5749768643cf16676a7",
    "status": "pending"
  },
  {
    "fingerprint": "4078c5dc857aa41c3c4a1502fbac01f148e1b7a43b406b2738fdd3542932f04c",
    "status": "pending"
  },
  {
    "fingerprint": "511509b9c1cbf267c29fd9904cdef453ccfc9a53da07127596073e2f9a4ebe1f",
    "status": "pending"
  },
  {
    "fingerprint": "ff321f7a9815710b7bf8f7bc7b983cb54a6ab55dc1a6c4017ccdc3c88b9ebe2e",
    "status": "pending"
  },
  {
    "fingerprint": "ac14e3d02adeebde197248e3a603709cedb9fbb5bed68ce91e6733bce5391c4f",
    "status": "pending"
  },
  {
    "fingerprint": "795c6b3818074067df01a5272432d889aec9c35306c5cc4a436c5f50197ac6a7",
    "status": "pending"
  },
  {
    "fingerprint": "bb48b8a9d7e7d63590e5cbcef159f2c7ef3791ce913c3dd9f5496d75f329c8f7",
    "status": "pending"
  },
  {
    "fingerprint": "96978d8e5031f01c302dfa32129879112ce93a34f9330c3092cadee92edd0b85",
    "status": "pending"
  },
  {
    "fingerprint": "222eb13cbb489b7486f73fce18b897313e50d9ba7f8edb729412ecb603c265bc",
    "status": "pending"
  },
  {
    "fingerprint": "9bb2c45940df2b4f3b64f7bd46966cc5e86db4652e2b6c2450a662cd3688ab68",
    "status": "pending"
  },
  {
    "fingerprint": "0e4665e5b2599d30fc82a56f91e90d14752b23507133b3a77dc8de7a334a7029",
    "status": "pending"
  },
  {
    "fingerprint": "661a2525cf31cd822fa1ed7f30e56fba396036059be00f730e11d388de90df97",
    "status": "pending"
  },
  {
    "fingerprint": "9cf11da101abcbee510d4f8dcf21234517fd343e1153c28b1a9c5fd17b2e3c20",
    "status": "pending"
  },
  {
    "fingerprint": "93dbe797c3503f5c9241062d8d993b59c2016b83255b04815c1bbf58886f67f5",
    "status": "pending"
  },
  {
    "fingerprint": "1bb3cad31271cbe3e7091d6deba484de14d1340fef2ba9f45db2224af6c79fd7",
    "status": "pending"
  }
];

const HASH = /^[a-f0-9]{64}$/;

function densePlainArray(value: unknown): readonly unknown[] | undefined {
  if (!Array.isArray(value)) return undefined;
  try {
    if (Object.getPrototypeOf(value) !== Array.prototype || Object.getOwnPropertySymbols(value).length > 0) return undefined;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.keys(descriptors).length !== value.length + 1) return undefined;
    const result: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) return undefined;
      result.push(descriptor.value);
    }
    return result;
  } catch { return undefined; }
}

function reviewEntry(value: unknown): BaseAudioReviewEntry | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  try {
    const prototype = Object.getPrototypeOf(value);
    if ((prototype !== Object.prototype && prototype !== null) || Object.getOwnPropertySymbols(value).length > 0) return undefined;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const names = Object.getOwnPropertyNames(value);
    if (names.length !== 2 || !descriptors.fingerprint || !descriptors.status || !("value" in descriptors.fingerprint) || !("value" in descriptors.status) || names.some((name) => !descriptors[name].enumerable)) return undefined;
    const fingerprint = descriptors.fingerprint.value;
    const status = descriptors.status.value;
    return typeof fingerprint === "string" && HASH.test(fingerprint) && (status === "pending" || status === "accepted") ? { fingerprint, status } : undefined;
  } catch { return undefined; }
}

export function validateBaseAudioReviewLedger(value: unknown, catalog: readonly BaseAudioRecord[]): BaseAudioReviewValidation {
  const values = densePlainArray(value);
  if (!values) return { ok: false, errors: ["invalid-ledger-shape"] };
  const errors = new Set<BaseAudioReviewError>();
  const expected = new Set(catalog.map((record) => record.fingerprint));
  const seen = new Set<string>();
  for (const value of values) {
    const entry = reviewEntry(value);
    if (!entry) { errors.add("malformed-review-entry"); continue; }
    if (seen.has(entry.fingerprint)) errors.add("duplicate-review-entry");
    seen.add(entry.fingerprint);
    if (!expected.has(entry.fingerprint)) errors.add("unknown-review-entry");
  }
  for (const fingerprint of expected) if (!seen.has(fingerprint)) errors.add("missing-review-entry");
  return { ok: errors.size === 0, errors: [...errors] };
}

export const BASE_AUDIO_REVIEW_LEDGER: readonly BaseAudioReviewEntry[] = deepFreeze(RAW_BASE_AUDIO_REVIEW_LEDGER);

export const BASE_AUDIO_REVIEW_LEDGER_VALIDATION =
  validateBaseAudioReviewLedger(
    BASE_AUDIO_REVIEW_LEDGER,
    BASE_AUDIO_CATALOG,
  );

if (!BASE_AUDIO_REVIEW_LEDGER_VALIDATION.ok) {
  throw new Error(
    `Invalid Base audio review ledger: ${BASE_AUDIO_REVIEW_LEDGER_VALIDATION.errors.join(", ")}`,
  );
}
