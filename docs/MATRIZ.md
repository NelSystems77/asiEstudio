# Matriz de ponderación

Todo el comportamiento psicopedagógico está en `src/data/matrix.json`; el código solo lo ejecuta. Para cambiar reglas no hace falta tocar componentes.

## Estructura
- `dimensions`: 7 dimensiones (4 canales + atención, organización, ansiedad).
- `questions[]`: `options[].weights` suma puntos a una o más dimensiones (0–3).
- `games`: puntos máximos y dimensiones a las que aporta cada mini-reto.
- `thresholds`: umbrales de arquetipo multimodal (`multimodalGap`) y de modificadores.
- `flow`: orden del cuestionario (`qN` o `game:<id>`).
- `archetypes`, `modifiers`, `playbook`, `calming`: textos y recetas.

## Cálculo
1. `raw[dim]` = suma de pesos de las opciones elegidas + puntos de mini-retos no omitidos.
2. `max[dim]` = suma del peso máximo posible por pregunta (+ mini-retos no omitidos).
3. `pct[dim] = round(raw / max × 100)`.
4. Arquetipo: canal con mayor `pct`; si el 1.º y 2.º difieren ≤ `multimodalGap` → `multimodal`; empates por `tieBreakOrder`.
5. Modificadores: atención baja/alta, organización baja, ansiedad alta según `thresholds`.

## Al editar la matriz
- Sube `version` (se guarda en cada diagnóstico y en las exportaciones).
- Los diagnósticos guardados se **recalculan** con la matriz vigente a partir de sus respuestas.
- `npm test` verifica que el flujo cubra todas las preguntas y que todo peso apunte a una dimensión válida.
