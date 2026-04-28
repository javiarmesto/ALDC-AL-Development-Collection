# Fase 1 — Reestructuración interna del repo

## Metadatos de ejecución

- **Rama de origen:** `main` (en estado actualizado y limpio)
- **Rama a crear:** `feat/apm-phase-1-restructure`
- **Repositorio:** repo principal de ALDC en GitHub bajo TechSphere Dynamics
- **Directorio de trabajo:** raíz del repo
- **Sesión esperada:** 1 (puede dividirse en dos si la validación intermedia lo aconseja)
- **Pre-requisitos:** ninguno (es la primera fase)

## Comando previo a la sesión

Desde la raíz del repo, en una terminal:

\`\`\`bash
git checkout main
git pull origin main
git checkout -b feat/apm-phase-1-restructure
\`\`\`

A continuación, abrir Claude Code en la raíz del repo y pegar el prompt de abajo.

## Prompt

Contexto: estoy preparando el repo de ALDC (AL Development Collection) para soportar distribución dual en dos canales: el VSIX actual de VS Code Marketplace, que NO debe romperse bajo ningún concepto, y un canal nuevo basado en Microsoft APM (Agent Package Manager, https://microsoft.github.io/apm/) que añadiré en una fase posterior.

Esta sesión cubre solo la fase 1: reestructuración interna. El objetivo es mover los artefactos actuales del repo a una estructura por subpaquetes bajo `packages/`, alineada con la arquitectura Core v1.1 de ALDC, sin todavía tocar APM ni añadir manifiestos `apm.yml`.

Quiero que invoques a al-architect para que primero analice el repo actual y produzca un decision record con el plan de movimientos exacto. El plan debe respetar esta descomposición:

- `packages/foundation/` contiene el decálogo (12 norms), el sistema Skills Evidencing, los hooks SessionStart/PreToolUse/PostToolUse, y las instructions transversales.
- `packages/conductor/` contiene al-architect, al-spec.create y al-conductor con su pipeline de fases.
- `packages/developer/` contiene al-developer.
- `packages/implement-subagent/` contiene el subagente de implementación.
- `packages/review-subagent/` contiene el subagente de revisión.

Restricciones críticas:

1. El build del VSIX debe seguir produciendo exactamente el mismo artefacto que produce hoy. Para ello, ajusta el script de build del VSIX para que recolecte ficheros desde los nuevos subdirectorios `packages/*/` y los ensamble en la estructura plana que la extensión espera. La salida del VSIX no cambia, solo cambia de dónde lee.
2. Ningún test existente debe romperse. Si algún test referencia rutas absolutas, ajústalo en el mismo commit.
3. Aprovecha esta sesión para corregir la errata del `ROADMAP-2026.md` que menciona "2 subagents" cuando la spec define 3.
4. Aplica Skills Evidencing en cada output: declara qué skills cargaste y qué patrones aplicaste, conforme al estándar de ALDC.

Entregables esperados al final de la sesión:

- Decision record en `docs/decisions/` con el plan ejecutado y la justificación.
- Reorganización completada en la rama `feat/apm-phase-1-restructure`.
- Script de build del VSIX adaptado y verificado.
- `ROADMAP-2026.md` corregido.
- Confirmación de que el VSIX se construye y produce el artefacto esperado.

Procede paso a paso y para antes de cada bloque de cambios estructurales para que yo valide. No abras un PR todavía, lo haré yo manualmente al revisar.

## Validación post-sesión

Antes de abrir PR, verificar manualmente:

1. El build del VSIX se ejecuta sin errores y produce un artefacto comparable al anterior.
2. Existe un decision record nuevo en `docs/decisions/`.
3. Los tests pasan en local.
4. El `ROADMAP-2026.md` ya no contiene la errata de "2 subagents".

## Salida esperada

PR contra `main` con título `feat(apm): phase 1 — restructure repo to packages/`.