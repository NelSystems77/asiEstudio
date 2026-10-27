# asiEstudio

PWA mobile-first que diagnostica el estilo de estudio (canales VAK+lectoescritura, atención, organización, ansiedad ante exámenes) y genera un plan de estudio personalizado.

## Arquitectura
- `src/data/matrix.json` — **Matriz de ponderación** (preguntas, pesos, umbrales, arquetipos, playbook). Es el único lugar donde viven las reglas psicopedagógicas; el código no las contiene.
- `src/engine/scoring.ts` — algoritmo determinista: suma ponderada → % por dimensión → arquetipo (canal dominante; `multimodal` si los dos primeros difieren ≤ 8 pts; desempate por orden fijo) + modificadores (atención, organización, ansiedad).
- `src/engine/plan.ts` — generador del plan por fases (mapeo → aprendizaje activo → recuperación → simulacro → repaso final), con bloques según atención y rituales de calma si ansiedad alta.
- `src/store.ts` — Zustand con persistencia local (modo invitado).
- `public/sw.js` — Service Worker (offline).
- `prisma/schema.prisma` — esquema PostgreSQL para la fase con backend/Auth.

## Scripts
`npm run dev` · `npm run build` · `npm test`

## Pendiente (fuera del MVP)
API + Auth.js, migración de resultados de invitado a cuenta, validación de la matriz por los especialistas (los pesos actuales son una propuesta inicial).
