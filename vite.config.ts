/// <reference types="vitest" />
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** GitHub Pages sirve el sitio bajo /<repo>/; en dominio propio o local la base es '/'. */
const normalizeBase = (b = '/') => `/${b.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');

/** Post-build: versiona la caché del SW con el id del build y genera 404.html (copia del index). */
function pagesPostBuild(): Plugin {
  const buildId = (process.env.GITHUB_SHA ?? String(Date.now())).slice(0, 12);
  let outDir = 'dist';
  return {
    name: 'pages-post-build',
    apply: 'build',
    configResolved: (c) => { outDir = resolve(c.root, c.build.outDir); },
    closeBundle() {
      const sw = resolve(outDir, 'sw.js');
      writeFileSync(sw, readFileSync(sw, 'utf8').replace('__BUILD_ID__', buildId));
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    },
  };
}

export default defineConfig({
  base: normalizeBase(process.env.BASE_PATH),
  plugins: [react(), pagesPostBuild()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
