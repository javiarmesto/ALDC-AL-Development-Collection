# ADR-0003 — APM Phase 2: Resolución de inconsistencias de estructura de paquetes

- **Status:** Proposed
- **Date:** 2026-05-30
- **Branch:** `feat/apm-phase-2-manifests`
- **Author:** al-architect (pending invocation) / facilitado por GitHub Copilot

---

## Contexto

La Fase 2 de la migración APM debe introducir manifiestos `apm.yml` para convertir ALDC en un paquete APM instalable. Durante la recogida de contexto previa a la implementación se han identificado **tres inconsistencias bloqueantes** entre el prompt de Fase 2 y la realidad actual del repositorio. Según la restricción #4 del prompt:

> *"Si encuentras inconsistencias entre la estructura actual de `packages/` y lo que APM necesita declarar como exports, párate y abre un decision record antes de modificar nada."*

Este ADR documenta las inconsistencias y las opciones de resolución para que el arquitecto decida y el usuario las apruebe (HITL) antes de cualquier implementación.

---

## Inconsistencia 1: "Cinco subpaquetes" vs. un único paquete existente

### Descripción
El prompt de Fase 2 dice: *"convertir ALDC en un metapaquete APM con cinco subpaquetes instalables"* y pide *"Seis manifiestos `apm.yml`: uno raíz y cinco en cada subpaquete"*.

### Realidad actual
`packages/` contiene únicamente `packages/foundation/`. Los otros candidatos a subpaquetes están en la raíz del repo, NO dentro de `packages/`:
- `bcagentpack/` — BC Agents Pack (agentes SDK de BC, workflows)
- `claude-plugin/` — Claude Code plugin (reglas, comandos, skills propios)
- Posibles: `collections/`, `toolbox/` (este último gitignoreado)

### Opciones de resolución

| Opción | Descripción | Impacto | Riesgo |
|--------|-------------|---------|--------|
| **A** | Phase 2 crea SOLO `apm.yml` raíz + `packages/foundation/apm.yml` (2 manifiestos, no 6). El resto son trabajo futuro. | Mínimo. Sin `git mv`. | Bajo |
| **B** | Mover `bcagentpack/` → `packages/bc-agents-pack/` y `claude-plugin/` → `packages/claude-plugin/` en esta fase, creando 3+ paquetes reales. | Medio. Requiere renombrado + actualizar referencias. | Medio |
| **C** | Crear `packages/bc-agents-pack/`, `packages/claude-plugin/`, etc. con `apm.yml` y `.apm/` stub (sin mover contenido todavía). | Mínimo por ahora, pero crea stubs vacíos. | Bajo-Medio |
| **D** | Confirmar con el usuario cuáles son exactamente los cinco subpaquetes antes de decidir. | Ninguno. Bloqueo hasta aclaración. | Ninguno |

**Recomendación preliminar:** Opción A (scope mínimo) o Opción D (confirmación usuario). La opción B requiere un restructure adicional no especificado en Fase 2 y puede afectar al VSIX build (aunque el script es gitignoreado).

---

## Inconsistencia 2: Layout `packages/foundation/` vs. convención `.apm/` de APM

### Descripción
El schema oficial de APM (v0.1, 2026-03-06, `https://microsoft.github.io/apm/reference/manifest-schema/`) define que los primitivos de un paquete con múltiples artefactos deben residir en un directorio `.apm/` relativo a la raíz del paquete:

```
package-root/
  apm.yml
  .apm/
    agents/
    skills/
    instructions/
    prompts/
```

### Realidad actual
Los primitivos de `packages/foundation/` están en:
```
packages/foundation/
  agents/     ← falta .apm/ wrapper
  instructions/
  prompts/
  skills/
  .gitkeep
```

Sin `.apm/` directory, `apm install javiarmesto/aldc` no desplegará ningún primitivo en el cliente. Los manifiestos serían sintácticamente válidos pero funcionalmente inertes.

### Impacto en el VSIX build
El script `toolbox/al-coding-agent-collection/prepare-package.js` (gitignoreado, parchado localmente en Fase 1) ya apunta a `packages/foundation/agents`, `packages/foundation/skills`, etc. Si en Fase 2 movemos el contenido a `packages/foundation/.apm/agents/` etc., el script local necesitará un parche adicional para seguir produciendo el VSIX.

### Opciones de resolución

| Opción | Descripción | Impacto en VSIX | Riesgo |
|--------|-------------|-----------------|--------|
| **A** | Crear `packages/foundation/.apm/` con subdirectorios y **mover** el contenido actual (`agents/` → `.apm/agents/`, etc.). Actualizar script VSIX local. | Parche local mínimo | Bajo-Medio |
| **B** | Mantener `packages/foundation/agents/` etc. y crear `packages/foundation/.apm/` con **symlinks** al contenido real. | Sin cambio de VSIX | Windows symlinks complicados |
| **C** | El paquete raíz (repo root) ES el paquete APM. Crear `.apm/` en la raíz del repo copiando/referenciando `packages/foundation/`. El script VSIX no cambia. | Sin cambio | Duplicación |
| **D** | Fase 2 = SOLO manifiestos (sin `.apm/`). El paquete APM es técnicamente inerte hasta Fase 3 que crea `.apm/`. Documenta la limitación explícitamente. | Sin cambio | Paquete no funcional |

**Recomendación preliminar:** Opción A (mover a `.apm/`, parchar VSIX script localmente) si la Fase 2 debe producir un paquete APM funcional. Opción D si la Fase 2 es una "declaración de intenciones" para revisión arquitectónica.

---

## Inconsistencia 3: Campos del prompt vs. schema oficial APM

### Descripción
El prompt de Fase 2 menciona dos construcciones que **no existen** en el schema oficial de APM v0.1:

1. **`compatibility.harnesses`** con valores `claude-code`, `github-copilot`, `cursor`, `codex`
   - El campo real en APM se llama **`target`** (§3.6 del Manifest Schema)
   - Valores permitidos: `vscode | agents | copilot | claude | cursor | opencode | codex | gemini | windsurf | all`

2. **`exports` section** con campos `source`, `target`, `mode`
   - APM **no tiene campo `exports`** en `apm.yml`. El "export" de primitivos se hace por convención de directorio: todo lo que está en `.apm/` se instala automáticamente.
   - `mode: append` para instructions transversales tampoco es un campo APM estándar.

### Opciones de resolución

| Campo | Mapeo real en APM |
|-------|-------------------|
| `compatibility.harnesses: [claude-code, copilot]` | `target: [claude, copilot]` o `target: all` |
| `exports: [source: X, target: Y]` | Estructura de directorios en `.apm/X/` → deployed to harness dirs |
| `mode: append` en instructions transversales | No existe en APM. Requiere documentar limitación o proponer extensión. |

**Recomendación preliminar:** Usar `target: all` en el `apm.yml` raíz. Documentar que APM no soporta `mode: append` (la no-destrucción de `CLAUDE.md` del cliente es responsabilidad del runtime, no de APM). El arquitecto debe confirmar si esto es aceptable o si hay workaround.

---

## Decisiones requeridas (input para al-architect)

El arquitecto debe responder estas cuatro preguntas antes de implementar:

1. **¿Cuántos paquetes en Fase 2?** ¿Solo `packages/foundation/` (1 paquete) o también `bcagentpack/` y `claude-plugin/`? Si son más, ¿requieren `git mv` a `packages/`?

2. **¿Crea `.apm/` en Fase 2?** ¿Movemos el contenido de `packages/foundation/` a `packages/foundation/.apm/` para que el paquete APM sea funcional? ¿O Fase 2 es solo manifiestos (con Fase 3 creando `.apm/`)?

3. **¿Cuál es el paquete raíz APM?** ¿El repo root es `javiarmesto/aldc` (package root = repo root, con `.apm/` en la raíz)? ¿O es un virtual package `javiarmesto/aldc/packages/foundation`?

4. **¿Cómo manejar `mode: append` para CLAUDE.md?** El prompt pide proteger `CLAUDE.md` preexistente en proyectos cliente. APM no tiene este mecanismo. ¿Documentar limitación? ¿Añadir instrucciones en el SKILL.md del paquete?

---

## APM Manifest Schema (resumen para referencia)

```yaml
# Campos reales del schema oficial APM v0.1
name: string          # REQUIRED
version: string       # REQUIRED (semver)
description: string   # OPTIONAL
author: string        # OPTIONAL
license: string       # OPTIONAL (SPDX)
target: string|list   # OPTIONAL — vscode|copilot|claude|cursor|opencode|codex|gemini|windsurf|all
type: enum            # OPTIONAL — instructions|skill|hybrid|prompts
scripts: map          # OPTIONAL
includes: auto|list   # OPTIONAL — qué contenido local se despliega
dependencies:
  apm: list           # OPTIONAL — otras dependencias APM
  mcp: list           # OPTIONAL — MCP servers
devDependencies:
  apm: list
compilation:
  target: ...
  strategy: distributed|single-file
  exclude: list
```

**Los primitivos se declaran por convención de directorio en `.apm/`, NO por un campo `exports`.**

---

## Versión a usar

- `package.json` → `"version": "3.2.0"` ✅ (usar en `apm.yml`)
- `aldc.yaml` → `version: "1.1.0"` (es la versión del spec interno de ALDC Core, NO del paquete APM)

---

*ADR creado por GitHub Copilot — 2026-05-30 — pendiente de aprobación por al-architect y usuario (HITL)*
