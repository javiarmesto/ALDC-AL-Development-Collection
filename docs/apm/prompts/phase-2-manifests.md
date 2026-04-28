# Fase 2 — Introducción de manifiestos apm.yml

## Metadatos de ejecución

- **Rama de origen:** `main` (con la fase 1 ya mergeada)
- **Rama a crear:** `feat/apm-phase-2-manifests`
- **Repositorio:** repo principal de ALDC en GitHub bajo TechSphere Dynamics
- **Directorio de trabajo:** raíz del repo
- **Sesión esperada:** 1
- **Pre-requisitos:** fase 1 mergeada y validada en `main`

## Comando previo a la sesión

Desde la raíz del repo, en una terminal:

\`\`\`bash
git checkout main
git pull origin main
git checkout -b feat/apm-phase-2-manifests
\`\`\`

A continuación, abrir Claude Code en la raíz del repo y pegar el prompt de abajo.

## Prompt

Contexto: la fase 1 de la migración a APM está completa y mergeada. El repo de ALDC ya tiene la estructura `packages/foundation/`, `packages/conductor/`, `packages/developer/`, `packages/implement-subagent/` y `packages/review-subagent/`. El VSIX sigue funcionando exactamente igual que antes.

Esta sesión cubre la fase 2: introducción de los manifiestos `apm.yml` para convertir ALDC en un metapaquete APM con cinco subpaquetes instalables. Documentación oficial de referencia: https://microsoft.github.io/apm/

Quiero que invoques a al-architect para diseñar primero, y a al-conductor para orquestar la implementación después. El diseño debe seguir esta lógica:

1. Manifiesto raíz `apm.yml` en la raíz del repo. Es un metapaquete que solo declara dependencias internas a los cinco subpaquetes con la versión actual de ALDC (consulta `version.json` o el equivalente). Debe declarar también la sección `compatibility.harnesses` con `claude-code`, `github-copilot`, `cursor` y `codex`.
2. Manifiesto `apm.yml` dentro de cada `packages/*/`, con la sección `exports` correctamente declarada. Para cada export de tipo skills o instructions, especifica `source` y `target`. Para los hooks de `packages/foundation/`, declara su `event` correspondiente (SessionStart, PreToolUse, PostToolUse). Para las instructions transversales de foundation, usa `mode: append` en lugar de overwrite, para no destruir `CLAUDE.md` preexistentes en proyectos cliente.
3. Crea un schema de validación o un test que valide cada `apm.yml` contra el schema oficial de APM. Si APM no expone schema público todavía, escribe al menos un test ad-hoc que verifique las claves obligatorias.
4. Añade documentación nueva en `docs/apm/` que explique a un cliente cómo consumir ALDC vía APM. Incluye al menos un ejemplo de `apm.yml` de cliente típico que declare `techspheredynamics/aldc@<versión>` y un MCP server de BC.

Restricciones:

1. NO toques el script de build del VSIX. El VSIX sigue intocable.
2. NO publiques tags ni hagas push de versiones. Esta fase es solo local, deja todo listo para que yo decida cuándo publicar.
3. Aplica Skills Evidencing en cada output del agente.
4. Si encuentras inconsistencias entre la estructura actual de `packages/` y lo que APM necesita declarar como exports, párate y abre un decision record antes de modificar nada.

Entregables al final de la sesión:

- Seis manifiestos `apm.yml`: uno raíz y cinco en cada subpaquete.
- Test o schema de validación funcionando.
- Documentación en `docs/apm/` con ejemplo de uso para cliente.
- Rama `feat/apm-phase-2-manifests` lista para review.
- Resumen final del decision record con cualquier decisión arquitectónica relevante que hayas tomado durante la sesión.

Para antes de cerrar la sesión, ejecuta una "instalación simulada" donde resuelvas mentalmente qué pasaría si un cliente ejecuta `apm install techspheredynamics/aldc@<versión>` y describe el resultado esperado fichero a fichero, para que yo valide que la lógica es correcta antes de probarlo de verdad.

## Validación post-sesión

Antes de abrir PR, verificar manualmente:

1. Los seis manifiestos existen y pasan el schema de validación.
2. La documentación en `docs/apm/` incluye un ejemplo claro de `apm.yml` de cliente.
3. La "instalación simulada" descrita por el agente al final de la sesión coincide con lo que esperarías ver en un cliente real.
4. El VSIX sigue construyéndose sin cambios.

## Salida esperada

PR contra `main` con título `feat(apm): phase 2 — introduce apm.yml manifests`.