import { deepFreeze } from "../../foundations/deepFreeze";

export interface V4ActivityInventoryRow {
  readonly lessonId: string;
  readonly definitionId: string;
  readonly reviewKey: string;
  readonly practiceFunction: string;
}

export const V4_ACTIVITY_INVENTORY: readonly V4ActivityInventoryRow[] = deepFreeze(
  [
    {
      "lessonId": "sounds-1",
      "definitionId": "snd1-a-ex",
      "reviewKey": "sounds-1:snd1-a-ex",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "sounds-1",
      "definitionId": "snd1-i-ex",
      "reviewKey": "sounds-1:snd1-i-ex",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "sounds-1",
      "definitionId": "snd1-u-ex",
      "reviewKey": "sounds-1:snd1-u-ex",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "sounds-1",
      "definitionId": "snd1-e-ex",
      "reviewKey": "sounds-1:snd1-e-ex",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "sounds-2",
      "definitionId": "snd2-ka-ex",
      "reviewKey": "sounds-2:snd2-ka-ex",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "sounds-2",
      "definitionId": "snd2-ga-ex",
      "reviewKey": "sounds-2:snd2-ga-ex",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "sounds-2",
      "definitionId": "snd2-ki-ex",
      "reviewKey": "sounds-2:snd2-ki-ex",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "sounds-2",
      "definitionId": "snd2-gi-ex",
      "reviewKey": "sounds-2:snd2-gi-ex",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "sounds-3",
      "definitionId": "snd3-kite-ex",
      "reviewKey": "sounds-3:snd3-kite-ex",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "sounds-3",
      "definitionId": "snd3-kitte-ex",
      "reviewKey": "sounds-3:snd3-kitte-ex",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "sounds-3",
      "definitionId": "snd3-obasan-ex",
      "reviewKey": "sounds-3:snd3-obasan-ex",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "sounds-3",
      "definitionId": "snd3-obaasan-ex",
      "reviewKey": "sounds-3:snd3-obaasan-ex",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "sounds-4",
      "definitionId": "snd4-koohii-ex",
      "reviewKey": "sounds-4:snd4-koohii-ex",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "sounds-4",
      "definitionId": "snd4-terebi-ex",
      "reviewKey": "sounds-4:snd4-terebi-ex",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "sounds-4",
      "definitionId": "snd4-pan-ex",
      "reviewKey": "sounds-4:snd4-pan-ex",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "sounds-4",
      "definitionId": "snd4-resutoran-ex",
      "reviewKey": "sounds-4:snd4-resutoran-ex",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "sentence-foundations-1",
      "definitionId": "sentence-foundations-1-round-1::sentence-foundations-1-m1",
      "reviewKey": "sentence-foundations-1:sentence-foundations-1-round-1::sentence-foundations-1-m1",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "sentence-foundations-1",
      "definitionId": "sentence-foundations-1-round-2::sentence-foundations-1-t3",
      "reviewKey": "sentence-foundations-1:sentence-foundations-1-round-2::sentence-foundations-1-t3",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "sentence-foundations-1",
      "definitionId": "sentence-foundations-1-round-1::sentence-foundations-1-m8",
      "reviewKey": "sentence-foundations-1:sentence-foundations-1-round-1::sentence-foundations-1-m8",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "sentence-foundations-1",
      "definitionId": "sentence-foundations-1-round-2::sentence-foundations-1-t2",
      "reviewKey": "sentence-foundations-1:sentence-foundations-1-round-2::sentence-foundations-1-t2",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "sentence-foundations-2",
      "definitionId": "sentence-foundations-2-round-1::sentence-foundations-2-m6",
      "reviewKey": "sentence-foundations-2:sentence-foundations-2-round-1::sentence-foundations-2-m6",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "sentence-foundations-2",
      "definitionId": "sentence-foundations-2-round-2::sentence-foundations-2-t1",
      "reviewKey": "sentence-foundations-2:sentence-foundations-2-round-2::sentence-foundations-2-t1",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "sentence-foundations-2",
      "definitionId": "sentence-foundations-2-round-1::sentence-foundations-2-m8",
      "reviewKey": "sentence-foundations-2:sentence-foundations-2-round-1::sentence-foundations-2-m8",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "sentence-foundations-2",
      "definitionId": "sentence-foundations-2-round-2::sentence-foundations-2-t2",
      "reviewKey": "sentence-foundations-2:sentence-foundations-2-round-2::sentence-foundations-2-t2",
      "practiceFunction": "transformation"
    },
    {
      "lessonId": "sentence-foundations-3",
      "definitionId": "sentence-foundations-3-round-1::sentence-foundations-3-m3",
      "reviewKey": "sentence-foundations-3:sentence-foundations-3-round-1::sentence-foundations-3-m3",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "sentence-foundations-3",
      "definitionId": "sentence-foundations-3-round-2::sentence-foundations-3-t3",
      "reviewKey": "sentence-foundations-3:sentence-foundations-3-round-2::sentence-foundations-3-t3",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "sentence-foundations-3",
      "definitionId": "sentence-foundations-3-round-1::sentence-foundations-3-m8",
      "reviewKey": "sentence-foundations-3:sentence-foundations-3-round-1::sentence-foundations-3-m8",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "sentence-foundations-3",
      "definitionId": "sentence-foundations-3-round-2::sentence-foundations-3-t2",
      "reviewKey": "sentence-foundations-3:sentence-foundations-3-round-2::sentence-foundations-3-t2",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "sentence-foundations-4",
      "definitionId": "sentence-foundations-4-round-1::sentence-foundations-4-m2",
      "reviewKey": "sentence-foundations-4:sentence-foundations-4-round-1::sentence-foundations-4-m2",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "sentence-foundations-4",
      "definitionId": "sentence-foundations-4-round-2::sentence-foundations-4-t2",
      "reviewKey": "sentence-foundations-4:sentence-foundations-4-round-2::sentence-foundations-4-t2",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "sentence-foundations-4",
      "definitionId": "sentence-foundations-4-round-1::sentence-foundations-4-m1",
      "reviewKey": "sentence-foundations-4:sentence-foundations-4-round-1::sentence-foundations-4-m1",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "sentence-foundations-4",
      "definitionId": "sentence-foundations-4-round-2::sentence-foundations-4-t3",
      "reviewKey": "sentence-foundations-4:sentence-foundations-4-round-2::sentence-foundations-4-t3",
      "practiceFunction": "transformation"
    },
    {
      "lessonId": "topic-questions-1",
      "definitionId": "topic-questions-1-round-1::topic-questions-1-m7",
      "reviewKey": "topic-questions-1:topic-questions-1-round-1::topic-questions-1-m7",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "topic-questions-1",
      "definitionId": "topic-questions-1-round-2::topic-questions-1-t5",
      "reviewKey": "topic-questions-1:topic-questions-1-round-2::topic-questions-1-t5",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "topic-questions-1",
      "definitionId": "topic-questions-1-round-1::topic-questions-1-m6",
      "reviewKey": "topic-questions-1:topic-questions-1-round-1::topic-questions-1-m6",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "topic-questions-1",
      "definitionId": "topic-questions-1-round-2::topic-questions-1-t3",
      "reviewKey": "topic-questions-1:topic-questions-1-round-2::topic-questions-1-t3",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "topic-questions-2",
      "definitionId": "topic-questions-2-round-1::topic-questions-2-m6",
      "reviewKey": "topic-questions-2:topic-questions-2-round-1::topic-questions-2-m6",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "topic-questions-2",
      "definitionId": "topic-questions-2-round-2::topic-questions-2-t5",
      "reviewKey": "topic-questions-2:topic-questions-2-round-2::topic-questions-2-t5",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "topic-questions-2",
      "definitionId": "topic-questions-2-round-1::topic-questions-2-m7",
      "reviewKey": "topic-questions-2:topic-questions-2-round-1::topic-questions-2-m7",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "topic-questions-2",
      "definitionId": "topic-questions-2-round-2::topic-questions-2-t4",
      "reviewKey": "topic-questions-2:topic-questions-2-round-2::topic-questions-2-t4",
      "practiceFunction": "transformation"
    },
    {
      "lessonId": "topic-questions-3",
      "definitionId": "topic-questions-3-round-1::topic-questions-3-m2",
      "reviewKey": "topic-questions-3:topic-questions-3-round-1::topic-questions-3-m2",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "topic-questions-3",
      "definitionId": "topic-questions-3-round-2::topic-questions-3-t1",
      "reviewKey": "topic-questions-3:topic-questions-3-round-2::topic-questions-3-t1",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "topic-questions-3",
      "definitionId": "topic-questions-3-round-1::topic-questions-3-m1",
      "reviewKey": "topic-questions-3:topic-questions-3-round-1::topic-questions-3-m1",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "topic-questions-3",
      "definitionId": "topic-questions-3-round-2::topic-questions-3-t3",
      "reviewKey": "topic-questions-3:topic-questions-3-round-2::topic-questions-3-t3",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "topic-questions-4",
      "definitionId": "topic-questions-4-round-1::topic-questions-4-m1",
      "reviewKey": "topic-questions-4:topic-questions-4-round-1::topic-questions-4-m1",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "topic-questions-4",
      "definitionId": "topic-questions-4-round-2::topic-questions-4-t2",
      "reviewKey": "topic-questions-4:topic-questions-4-round-2::topic-questions-4-t2",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "topic-questions-4",
      "definitionId": "topic-questions-4-round-1::topic-questions-4-m8",
      "reviewKey": "topic-questions-4:topic-questions-4-round-1::topic-questions-4-m8",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "topic-questions-4",
      "definitionId": "topic-questions-4-round-2::topic-questions-4-t5",
      "reviewKey": "topic-questions-4:topic-questions-4-round-2::topic-questions-4-t5",
      "practiceFunction": "transformation"
    },
    {
      "lessonId": "polite-verbs-1",
      "definitionId": "polite-verbs-1-round-1::polite-verbs-1-m1",
      "reviewKey": "polite-verbs-1:polite-verbs-1-round-1::polite-verbs-1-m1",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "polite-verbs-1",
      "definitionId": "polite-verbs-1-round-2::polite-verbs-1-t5",
      "reviewKey": "polite-verbs-1:polite-verbs-1-round-2::polite-verbs-1-t5",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "polite-verbs-1",
      "definitionId": "polite-verbs-1-round-1::polite-verbs-1-m8",
      "reviewKey": "polite-verbs-1:polite-verbs-1-round-1::polite-verbs-1-m8",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "polite-verbs-1",
      "definitionId": "polite-verbs-1-round-2::polite-verbs-1-t4",
      "reviewKey": "polite-verbs-1:polite-verbs-1-round-2::polite-verbs-1-t4",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "polite-verbs-2",
      "definitionId": "polite-verbs-2-round-1::polite-verbs-2-m2",
      "reviewKey": "polite-verbs-2:polite-verbs-2-round-1::polite-verbs-2-m2",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "polite-verbs-2",
      "definitionId": "polite-verbs-2-round-2::polite-verbs-2-t1",
      "reviewKey": "polite-verbs-2:polite-verbs-2-round-2::polite-verbs-2-t1",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "polite-verbs-2",
      "definitionId": "polite-verbs-2-round-1::polite-verbs-2-m8",
      "reviewKey": "polite-verbs-2:polite-verbs-2-round-1::polite-verbs-2-m8",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "polite-verbs-2",
      "definitionId": "polite-verbs-2-round-2::polite-verbs-2-t2",
      "reviewKey": "polite-verbs-2:polite-verbs-2-round-2::polite-verbs-2-t2",
      "practiceFunction": "transformation"
    },
    {
      "lessonId": "polite-verbs-3",
      "definitionId": "polite-verbs-3-round-1::polite-verbs-3-m7",
      "reviewKey": "polite-verbs-3:polite-verbs-3-round-1::polite-verbs-3-m7",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "polite-verbs-3",
      "definitionId": "polite-verbs-3-round-2::polite-verbs-3-t1",
      "reviewKey": "polite-verbs-3:polite-verbs-3-round-2::polite-verbs-3-t1",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "polite-verbs-3",
      "definitionId": "polite-verbs-3-round-1::polite-verbs-3-m8",
      "reviewKey": "polite-verbs-3:polite-verbs-3-round-1::polite-verbs-3-m8",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "polite-verbs-3",
      "definitionId": "polite-verbs-3-round-2::polite-verbs-3-t3",
      "reviewKey": "polite-verbs-3:polite-verbs-3-round-2::polite-verbs-3-t3",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "polite-verbs-4",
      "definitionId": "polite-verbs-4-round-1::polite-verbs-4-m2",
      "reviewKey": "polite-verbs-4:polite-verbs-4-round-1::polite-verbs-4-m2",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "polite-verbs-4",
      "definitionId": "polite-verbs-4-round-2::polite-verbs-4-t2",
      "reviewKey": "polite-verbs-4:polite-verbs-4-round-2::polite-verbs-4-t2",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "polite-verbs-4",
      "definitionId": "polite-verbs-4-round-1::polite-verbs-4-m1",
      "reviewKey": "polite-verbs-4:polite-verbs-4-round-1::polite-verbs-4-m1",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "polite-verbs-4",
      "definitionId": "polite-verbs-4-round-2::polite-verbs-4-t3",
      "reviewKey": "polite-verbs-4:polite-verbs-4-round-2::polite-verbs-4-t3",
      "practiceFunction": "transformation"
    },
    {
      "lessonId": "time-movement-1",
      "definitionId": "time-movement-1-round-1::time-movement-1-m1",
      "reviewKey": "time-movement-1:time-movement-1-round-1::time-movement-1-m1",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "time-movement-1",
      "definitionId": "time-movement-1-round-2::time-movement-1-t4",
      "reviewKey": "time-movement-1:time-movement-1-round-2::time-movement-1-t4",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "time-movement-1",
      "definitionId": "time-movement-1-round-1::time-movement-1-m8",
      "reviewKey": "time-movement-1:time-movement-1-round-1::time-movement-1-m8",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "time-movement-1",
      "definitionId": "time-movement-1-round-2::time-movement-1-t5",
      "reviewKey": "time-movement-1:time-movement-1-round-2::time-movement-1-t5",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "time-movement-2",
      "definitionId": "time-movement-2-round-1::time-movement-2-m1",
      "reviewKey": "time-movement-2:time-movement-2-round-1::time-movement-2-m1",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "time-movement-2",
      "definitionId": "time-movement-2-round-2::time-movement-2-t5",
      "reviewKey": "time-movement-2:time-movement-2-round-2::time-movement-2-t5",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "time-movement-2",
      "definitionId": "time-movement-2-round-1::time-movement-2-m8",
      "reviewKey": "time-movement-2:time-movement-2-round-1::time-movement-2-m8",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "time-movement-2",
      "definitionId": "time-movement-2-round-2::time-movement-2-t4",
      "reviewKey": "time-movement-2:time-movement-2-round-2::time-movement-2-t4",
      "practiceFunction": "transformation"
    },
    {
      "lessonId": "time-movement-3",
      "definitionId": "time-movement-3-round-1::time-movement-3-m7",
      "reviewKey": "time-movement-3:time-movement-3-round-1::time-movement-3-m7",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "time-movement-3",
      "definitionId": "time-movement-3-round-2::time-movement-3-t2",
      "reviewKey": "time-movement-3:time-movement-3-round-2::time-movement-3-t2",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "time-movement-3",
      "definitionId": "time-movement-3-round-1::time-movement-3-m6",
      "reviewKey": "time-movement-3:time-movement-3-round-1::time-movement-3-m6",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "time-movement-3",
      "definitionId": "time-movement-3-round-2::time-movement-3-t3",
      "reviewKey": "time-movement-3:time-movement-3-round-2::time-movement-3-t3",
      "practiceFunction": "contextual-response"
    },
    {
      "lessonId": "time-movement-4",
      "definitionId": "time-movement-4-round-1::time-movement-4-m7",
      "reviewKey": "time-movement-4:time-movement-4-round-1::time-movement-4-m7",
      "practiceFunction": "meaning-comprehension"
    },
    {
      "lessonId": "time-movement-4",
      "definitionId": "time-movement-4-round-2::time-movement-4-t3",
      "reviewKey": "time-movement-4:time-movement-4-round-2::time-movement-4-t3",
      "practiceFunction": "form-discrimination"
    },
    {
      "lessonId": "time-movement-4",
      "definitionId": "time-movement-4-round-1::time-movement-4-m8",
      "reviewKey": "time-movement-4:time-movement-4-round-1::time-movement-4-m8",
      "practiceFunction": "controlled-production"
    },
    {
      "lessonId": "time-movement-4",
      "definitionId": "time-movement-4-round-2::time-movement-4-t2",
      "reviewKey": "time-movement-4:time-movement-4-round-2::time-movement-4-t2",
      "practiceFunction": "transformation"
    }
  ]
);
