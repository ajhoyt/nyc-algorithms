import { defineConfig } from 'vite';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const SKIP = new Set(['node_modules', 'dist', 'src', 'public', 'docs', '.git', '.github', '.claude']);

// Every folder with an index.html becomes a page at the same path, e.g. boids/ → /boids/.
// Searched two levels deep so old addresses (explainers/boids/) can keep redirect pages.
const input: Record<string, string> = { main: resolve(root, 'index.html') };
function scan(dir: string, depth: number) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (!statSync(path).isDirectory()) continue;
    const html = join(path, 'index.html');
    if (existsSync(html)) input[path.slice(root.length).replace(/\//g, '-')] = html;
    if (depth > 1) scan(path, depth - 1);
  }
}
scan(root, 2);

export default defineConfig({
  // Relative base so the site works at https://<user>.github.io/<repo>/ regardless of repo name.
  base: './',
  build: { rollupOptions: { input } },
});
