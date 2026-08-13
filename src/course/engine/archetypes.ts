import type { Archetype, ArchetypeId } from './types';

export const ARCHETYPES: readonly Archetype[] = [
  {
    id: 'new-block',
    layout: 'editorial',
    minSteps: 8,
    maxSteps: 16,
    phases: [
      { name: 'open',     kinds: ['hook'],                    min: 1, max: 1 },
      { name: 'teach',    kinds: ['rule', 'lexBatch'],        min: 3, max: 7 },
      { name: 'apply',    kinds: ['guidedBuild', 'examples'], min: 2, max: 5 },
      { name: 'check',    kinds: ['quiz'],                    min: 1, max: 4 },
      { name: 'close',    kinds: ['recap', 'reference'],      min: 1, max: 2 },
    ],
  },
  {
    id: 'immersion',
    layout: 'stage',
    minSteps: 7,
    maxSteps: 14,
    phases: [
      { name: 'scene',    kinds: ['dialogueScene'],           min: 1, max: 2 },
      { name: 'grasp',    kinds: ['comprehension'],           min: 2, max: 4 },
      { name: 'dismantle',kinds: ['breakdown'],               min: 2, max: 5 },
      { name: 'reuse',    kinds: ['guidedBuild'],             min: 1, max: 3 },
      { name: 'close',    kinds: ['recap'],                   min: 1, max: 1 },
    ],
  },
  {
    id: 'workshop',
    layout: 'workbench',
    minSteps: 8,
    maxSteps: 16,
    phases: [
      { name: 'open',     kinds: ['hook'],                    min: 1, max: 1 },
      { name: 'drill',    kinds: ['transform'],               min: 4, max: 10 },
      { name: 'build',    kinds: ['guidedBuild'],             min: 2, max: 4 },
      { name: 'check',    kinds: ['quiz'],                    min: 1, max: 3 },
    ],
  },
  {
    id: 'listening',
    layout: 'stage',
    minSteps: 8,
    maxSteps: 15,
    phases: [
      { name: 'blind',    kinds: ['listen'],                  min: 2, max: 3 },
      { name: 'shadow',   kinds: ['shadow'],                  min: 3, max: 6 },
      { name: 'write',    kinds: ['dictation'],               min: 2, max: 4 },
      { name: 'close',    kinds: ['recap'],                   min: 1, max: 1 },
    ],
  },
  {
    id: 'roleplay',
    layout: 'workbench',
    minSteps: 7,
    maxSteps: 14,
    phases: [
      { name: 'brief',    kinds: ['hook'],                    min: 1, max: 1 },
      { name: 'converse', kinds: ['roleplayTurn'],            min: 4, max: 10 },
      { name: 'review',   kinds: ['debrief'],                 min: 1, max: 2 },
      { name: 'close',    kinds: ['recap'],                   min: 1, max: 1 },
    ],
  },
  {
    id: 'checkpoint',
    layout: 'stage',
    minSteps: 10,
    maxSteps: 20,
    phases: [
      { name: 'retrieve', kinds: ['quiz', 'listen', 'guidedBuild'], min: 9, max: 19 },
      { name: 'close',    kinds: ['recap'],                         min: 1, max: 1 },
    ],
  },
];

export function archetypeById(id: ArchetypeId): Archetype {
  const found = ARCHETYPES.find((a) => a.id === id);
  if (found === undefined) throw new Error(`Unknown archetype: ${String(id)}`);
  return found;
}
