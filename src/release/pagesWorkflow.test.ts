import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const workflow = fs.readFileSync(
  path.join(root, '.github/workflows/deploy-pages.yml'),
  'utf-8',
);
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf-8');

describe('deploy-pages.yml', () => {
  it('is manual-only, master-guarded, and uses current action majors', () => {
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toMatch(/^  push:/m);
    expect(workflow).not.toMatch(/^  pull_request:/m);
    expect(workflow).toContain(
      'if [[ "$GITHUB_REF" != "refs/heads/master" ]]; then',
    );
    expect(workflow).toContain('needs: validate-ref');
    expect(workflow).toContain('actions/configure-pages@v5');
    expect(workflow).toContain('actions/upload-pages-artifact@v4');
    expect(workflow).toContain('actions/deploy-pages@v4');
    expect(workflow).toContain('pages: write');
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('name: github-pages');
  });
});

describe('.gitignore', () => {
  it('contains all required local-secrets patterns', () => {
    const lines = new Set(
      gitignore
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    );
    const required = [
      '.env',
      '.env.*',
      '!.env.example',
      '!.env.*.example',
      '.npmrc',
      '.netrc',
      '.aws/',
      '.azure/',
      '*.pem',
      '*.key',
      '*.p12',
      '*.pfx',
      '*.crt',
      '*.cer',
      'credentials.json',
      'secrets.json',
      'auth-cache*',
      'cookies*.txt',
    ];
    for (const entry of required) {
      expect(lines, `missing gitignore entry: ${entry}`).toContain(entry);
    }
  });
});
