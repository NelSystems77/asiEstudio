# asiEstudio

PWA mobile-first que diagnostica tu estilo de estudio (canales visual / auditivo / lectoescritura / kinestésico, atención, organización y ansiedad ante exámenes) y genera un **plan de estudio con fechas** para tu examen. Sin cuentas ni servidor: todo corre en el navegador y funciona offline.

## Funcionalidades
- Cuestionario de 17 preguntas + 2 mini-retos (omitibles sin penalizar el puntaje), con barra de progreso.
- Perfil con radar y barras, arquetipo y estrategias; consejos extra según atención, organización y ansiedad.
- Plan día a día hasta la fecha del examen (fases: mapeo → aprendizaje activo → recuperación → simulacro → repaso final), con checklist de progreso persistente e impresión/PDF.
- Historial de diagnósticos, exportar/importar JSON (validado y saneado).
- Tema claro/oscuro/automático, instalable (PWA), offline.

## Desarrollo
```bash
npm ci
npm run dev        # servidor local
npm run lint && npm run typecheck && npm test
npm run e2e        # Playwright; construye con base /asiEstudio/ (igual que Pages). 1ª vez: npx playwright install chromium
npm run build      # genera dist/
```

## Despliegue en GitHub Pages
1. En el repositorio: **Settings → Pages → Build and deployment → Source: _GitHub Actions_**.
2. Haz push/merge a `main` (o `master`): `.github/workflows/deploy.yml` ejecuta lint, tests y build, y publica en `https://<usuario>.github.io/<repo>/`.
3. También puede lanzarse a mano (**Actions → Deploy to GitHub Pages → Run workflow**).

El *base path* se obtiene automáticamente de `actions/configure-pages` (`/<repo>/`, o `/` con dominio propio). Localmente puedes simularlo con `BASE_PATH=/asiEstudio/ npm run build && npm run preview`.
`.github/workflows/ci.yml` valida cada PR (lint, tipos, tests, build y E2E).

## Arquitectura
| Ruta | Rol |
|---|---|
| `src/data/matrix.json` | **Matriz de ponderación**: preguntas, pesos, umbrales, arquetipos y recetas. Única fuente de las reglas psicopedagógicas. Ver [docs/MATRIZ.md](docs/MATRIZ.md). |
| `src/engine/` | Lógica pura y determinista (scoring, plan, fechas, import/export). Sin React. |
| `src/store.ts` | Estado (Zustand) persistido en `localStorage`: borrador, historial, progreso. |
| `src/components`, `src/games` | UI y mini-retos. |
| `public/sw.js` | Service Worker: navegación network-first, assets cache-first; caché versionada por build. |
| `prisma/schema.prisma` | Esquema PostgreSQL para una futura fase con backend (no usado por la app actual). |

## Privacidad y alcance
Los datos no salen del dispositivo. La herramienta es orientativa: no es una prueba clínica. **Los pesos de la matriz son una propuesta inicial pendiente de validación por especialistas.**
