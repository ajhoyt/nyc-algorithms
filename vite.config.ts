import { defineConfig } from 'vite';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Every folder in explainers/ with an index.html becomes its own page.
const input: Record<string, string> = { main: resolve(root, 'index.html') };
for (const name of readdirSync(resolve(root, 'explainers'))) {
  const html = resolve(root, 'explainers', name, 'index.html');
  if (existsSync(html)) input[name] = html;
}

export default defineConfig({
  // Relative base so the site works at https://<user>.github.io/<repo>/ regardless of repo name.
  base: './',
  build: { rollupOptions: { input } },
});
