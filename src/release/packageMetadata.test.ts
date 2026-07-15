import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
const license = fs.readFileSync(path.join(root, 'LICENSE'), 'utf-8');

describe('package.json metadata', () => {
  it('has name nihongo-practice', () => {
    expect(pkg.name).toBe('nihongo-practice');
  });

  it('has version 2.1.0', () => {
    expect(pkg.version).toBe('2.1.0');
  });

  it('has private true', () => {
    expect(pkg.private).toBe(true);
  });

  it('has author Riccardo Chiodaroli without email', () => {
    expect(pkg.author).toBe('Riccardo Chiodaroli');
  });

  it('has license MIT', () => {
    expect(pkg.license).toBe('MIT');
  });

  it('has correct homepage', () => {
    expect(pkg.homepage).toBe('https://unsafecode.github.io/nihongo-practice/');
  });

  it('has repository object with type git', () => {
    expect(pkg.repository).toBeDefined();
    expect(pkg.repository.type).toBe('git');
  });

  it('has repository url git+https://github.com/unsafecode/nihongo-practice.git', () => {
    expect(pkg.repository.url).toBe('git+https://github.com/unsafecode/nihongo-practice.git');
  });

  it('has engines.node >=22', () => {
    expect(pkg.engines?.node).toBe('>=22');
  });

  it('depends on react-router ^7.18.1', () => {
    expect(pkg.dependencies['react-router']).toBe('^7.18.1');
  });
});

describe('LICENSE file', () => {
  it('contains MIT License header', () => {
    expect(license).toContain('MIT License');
  });

  it('contains copyright 2026 Riccardo Chiodaroli', () => {
    expect(license).toContain('Copyright (c) 2026 Riccardo Chiodaroli');
  });

  it('contains permission grant sentence', () => {
    expect(license).toContain('Permission is hereby granted, free of charge');
  });

  it('contains AS-IS warranty disclaimer', () => {
    expect(license).toContain('THE SOFTWARE IS PROVIDED "AS IS"');
  });
});
