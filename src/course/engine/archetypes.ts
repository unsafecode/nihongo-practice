import type { Archetype, ArchetypeId } from './types';

export const ARCHETYPES: readonly Archetype[] = [
  {
    id: 'new-block',
    layout: 'editorial',
    minSteps: 8,
    maxSteps: 16,
    phases: [
      {
        name: 'open',
        label: { it: 'Apertura', en: 'Warm-up' },
        kinds: ['hook'],
        min: 1,
        max: 1,
      },
      {
        name: 'teach',
        label: { it: 'Studio', en: 'Study' },
        kinds: ['rule', 'lexBatch'],
        min: 3,
        max: 7,
      },
      {
        name: 'apply',
        label: { it: 'Pratica', en: 'Practice' },
        kinds: ['guidedBuild', 'examples'],
        min: 2,
        max: 5,
      },
      {
        name: 'check',
        label: { it: 'Verifica', en: 'Check' },
        kinds: ['quiz'],
        min: 1,
        max: 4,
      },
      {
        name: 'close',
        label: { it: 'Chiusura', en: 'Wrap-up' },
        kinds: ['recap', 'reference'],
        min: 1,
        max: 2,
      },
    ],
  },
  {
    id: 'immersion',
    layout: 'stage',
    minSteps: 7,
    maxSteps: 14,
    phases: [
      {
        name: 'scene',
        label: { it: 'Scena', en: 'Scene' },
        kinds: ['dialogueScene'],
        min: 1,
        max: 2,
      },
      {
        name: 'grasp',
        label: { it: 'Capire', en: 'Grasp' },
        kinds: ['comprehension'],
        min: 2,
        max: 4,
      },
      {
        name: 'dismantle',
        label: { it: 'Smontare', en: 'Take apart' },
        kinds: ['breakdown'],
        min: 2,
        max: 5,
      },
      {
        name: 'reuse',
        label: { it: 'Riusare', en: 'Reuse' },
        kinds: ['guidedBuild'],
        min: 1,
        max: 3,
      },
      {
        name: 'close',
        label: { it: 'Chiusura', en: 'Wrap-up' },
        kinds: ['recap'],
        min: 1,
        max: 1,
      },
    ],
  },
  {
    id: 'workshop',
    layout: 'workbench',
    minSteps: 8,
    maxSteps: 16,
    phases: [
      {
        name: 'open',
        label: { it: 'Apertura', en: 'Warm-up' },
        kinds: ['hook'],
        min: 1,
        max: 1,
      },
      {
        name: 'drill',
        label: { it: 'Esercizio', en: 'Drill' },
        kinds: ['transform'],
        min: 4,
        max: 10,
      },
      {
        name: 'build',
        label: { it: 'Costruire', en: 'Build' },
        kinds: ['guidedBuild'],
        min: 2,
        max: 4,
      },
      {
        name: 'check',
        label: { it: 'Verifica', en: 'Check' },
        kinds: ['quiz'],
        min: 1,
        max: 3,
      },
    ],
  },
  {
    id: 'listening',
    layout: 'stage',
    minSteps: 8,
    maxSteps: 15,
    phases: [
      {
        name: 'blind',
        label: { it: 'Solo ascolto', en: 'Listen only' },
        kinds: ['listen'],
        min: 2,
        max: 3,
      },
      {
        name: 'shadow',
        label: { it: 'Ripetere', en: 'Shadow' },
        kinds: ['shadow'],
        min: 3,
        max: 6,
      },
      {
        name: 'write',
        label: { it: 'Scrivere', en: 'Write' },
        kinds: ['dictation'],
        min: 2,
        max: 4,
      },
      {
        name: 'close',
        label: { it: 'Chiusura', en: 'Wrap-up' },
        kinds: ['recap'],
        min: 1,
        max: 1,
      },
    ],
  },
  {
    id: 'roleplay',
    layout: 'workbench',
    minSteps: 7,
    maxSteps: 14,
    phases: [
      {
        name: 'brief',
        label: { it: 'Istruzioni', en: 'Brief' },
        kinds: ['hook'],
        min: 1,
        max: 1,
      },
      {
        name: 'converse',
        label: { it: 'Conversazione', en: 'Conversation' },
        kinds: ['roleplayTurn'],
        min: 4,
        max: 10,
      },
      {
        name: 'review',
        label: { it: 'Bilancio', en: 'Debrief' },
        kinds: ['debrief'],
        min: 1,
        max: 2,
      },
      {
        name: 'close',
        label: { it: 'Chiusura', en: 'Wrap-up' },
        kinds: ['recap'],
        min: 1,
        max: 1,
      },
    ],
  },
  {
    id: 'checkpoint',
    layout: 'stage',
    minSteps: 10,
    maxSteps: 20,
    phases: [
      {
        name: 'retrieve',
        label: { it: 'Richiamo', en: 'Recall' },
        kinds: ['quiz', 'listen', 'guidedBuild'],
        min: 9,
        max: 19,
      },
      {
        name: 'close',
        label: { it: 'Chiusura', en: 'Wrap-up' },
        kinds: ['recap'],
        min: 1,
        max: 1,
      },
    ],
  },
];

export function archetypeById(id: ArchetypeId): Archetype {
  const found = ARCHETYPES.find((a) => a.id === id);
  if (found === undefined) throw new Error(`Unknown archetype: ${String(id)}`);
  return found;
}
