import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf-8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');

describe('README.md public documentation', () => {
  it('contains all required complete A0→A1 course content and no stale content', () => {
    // Required substrings
    expect(readme).toContain('## Percorso completo A0→A1');
    expect(readme).toContain('12 moduli in quattro fasi');
    expect(readme).toContain('40 lezioni');
    expect(readme).toContain('42 verbi');
    expect(readme).toContain('270 vocaboli contestuali');
    expect(readme).toContain('hiragana-first con katakana assistita');
    expect(readme).toContain('Sintesi pratica');
    expect(readme).toContain('lezioni visitate');
    expect(readme).toContain('Non ancora disponibili');
    expect(readme).toContain('Slice C');
    expect(readme).toContain('Slice D');
    expect(readme).toContain('non è riconoscimento vocale');
    expect(readme).toContain('npm run test:e2e');
    expect(readme).toContain('## Licenza');
    expect(readme).toContain('MIT');

    // Forbidden substrings
    expect(readme).not.toContain('## Le tre modalità (v2)');
    expect(readme).not.toContain('## Idee per la v3');
    expect(readme).not.toContain('non è un corso strutturato');
    expect(readme).not.toContain('## Esperienza v2.1 corretta');
    expect(readme).not.toContain('sette moduli guidati e un capstone');
    expect(readme).not.toContain('prossima estensione A0→A1');
    expect(readme).not.toContain('questa versione eseguibile mantiene ancora il percorso v2.1');
  });
});

describe('index.html metadata', () => {
  it('contains correct v2.1 title and description and no stale content', () => {
    // Required substrings
    expect(indexHtml).toContain('Percorso bilingue di giapponese pratico');
    expect(indexHtml).toContain('<title>Hanasō · Impara il giapponese</title>');

    // Forbidden substrings
    expect(indexHtml).not.toContain('frasi parlate, solo hiragana, con audio');
  });
});
