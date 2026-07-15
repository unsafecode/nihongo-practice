import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf-8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');

describe('README.md public documentation', () => {
  it('contains all required v2.1 corrected content and no stale content', () => {
    // Required substrings
    expect(readme).toContain('## Esperienza v2.1 corretta');
    expect(readme).toContain('sette moduli guidati e un capstone');
    expect(readme).toContain('lezioni visitate');
    expect(readme).toContain('npm run test:e2e');
    expect(readme).toContain('## Licenza');
    expect(readme).toContain('MIT');

    // Forbidden substrings
    expect(readme).not.toContain('## Le tre modalità (v2)');
    expect(readme).not.toContain('## Idee per la v3');
    expect(readme).not.toContain('non è un corso strutturato');
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
