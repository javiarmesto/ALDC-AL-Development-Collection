# ALDC Core Specification v1.1

## Estado

- Versión: 1.1.0
- Fecha: 2026-03-01
- Alcance: repositorios AL (Business Central) que adopten ALDC Core como backbone operativo.
- Cambio respecto a v1.0: modularización skills-based, contratos por requerimiento, memory global.

## Lenguaje normativo

Las palabras **MUST**, **SHOULD**, **MAY** y sus negaciones se interpretan como requisitos normativos.

## Objetivo

ALDC Core define el mínimo común verificable para convertir el trabajo con agentes en un flujo:
- repetible (siempre los mismos artefactos y gates),
- auditable (decisiones y cambios rastreables),
- gobernable (con validación automática y HITL).

ALDC Core v1.1 reorganiza las capacidades en módulos composables (skills) manteniendo la rigurosidad de orquestación TDD. La reducción de agentes públicos (11→4) simplifica la decisión del usuario, pero la orquestación interna (conductor + 3 subagents) preserva el ciclo completo: Plan → TDD Implementation → Review → Commit con gates HITL por fase.

ALDC Core está diseñado para el enfoque:

**MEDIUM/HIGH:** `@AL Architecture & Design Specialist` (diseño) → `al-spec.create` (spec técnica) → `@AL Development Conductor` (TDD orquestado: planning → implement → review) → gates HITL → entrega

**LOW:** `al-spec.create` (spec técnica) → `@AL Implementation Specialist` (implementación directa) → entrega

## Definiciones

- **Toolkit**: conjunto de agentes / instrucciones / prompts / skills instalados en el repo.
- **toolkitRoot**: ruta raíz del toolkit en el repo (configurable en `aldc.yaml`).
- **Plans folder**: carpeta canónica para contratos compartidos: `.github/plans/`.
- **Entrypoint de Copilot**: fichero repo-wide que Copilot lee por convención: `.github/copilot-instructions.md`.
- **Skill**: módulo de conocimiento composable que agentes cargan bajo demanda. Vive en `skills/` bajo `toolkitRoot`.
- **Requirement set**: conjunto de 3 artefactos contractuales por requerimiento (`{req_name}.spec.md`, `{req_name}.architecture.md`, `{req_name}.test-plan.md`).
- **Memory global**: fichero único acumulativo (`.github/plans/memory.md`) que registra decisiones transversales, contexto inter-sesión y estado del proyecto.
- **Template**: fichero inmutable en `docs/templates/`, solo modificable por maintainer vía RFC.

## Estructura de repositorio obligatoria

Un repositorio ALDC Core **MUST** contener:

- `aldc.yaml` en la raíz.
- `.github/plans/` con:
  - `memory.md` global obligatorio
  - Requirement sets: `{req_name}.spec.md`, `{req_name}.architecture.md`, `{req_name}.test-plan.md` por cada requerimiento activo
- Un entrypoint repo-wide de Copilot en `.github/copilot-instructions.md`.
- Un toolkit (en `toolkitRoot`) con:
  - `agents/` (agentes invocables por el usuario + subagents internos con `user-invocable: false`)
  - `instructions/`
  - `prompts/`
  - `skills/` (módulos de conocimiento composables)
  - `docs/templates/` (plantillas inmutables)

Nota: `toolkitRoot` **MAY** ser `.` en repos de framework y `.github` en repos consumidores.

## Agentes Core requeridos

ALDC Core v1.1 adopta un modelo simplificado de **4 agentes públicos + 3 subagents internos**.

### Agentes públicos (`user-invocable: true`)

- **al-architect** — Diseño, arquitectura, decisiones estratégicas. Carga skills según dominio (API, Copilot, performance).
- **al-conductor** — Orquestador TDD principal. Coordina subagents via `runSubagent`. Ciclo: Plan → Implement → Review → Commit.
- **al-developer** — Implementación táctica + debugging. Carga skills según tarea (debug, events, permissions, etc.). Invocable directamente por el usuario.
- **al-presales** — Estimación y planificación de proyectos. Vive fuera del ciclo de desarrollo.

### Subagents internos (`user-invocable: false`)

- **AL Planning Subagent** — Research AL-aware y context gathering. Devuelve findings estructurados al conductor.
- **AL Implementation Subagent** — Implementación TDD-only. Crea tests PRIMERO, luego código. Carga skills por dominio. No interactúa con el usuario.
- **AL Code Review Subagent** — Code review contra spec + architecture + test-plan. Devuelve veredicto APPROVED/NEEDS_REVISION/FAILED.

### Flujo de orquestación del conductor

```
al-conductor (orquestador)
  ├── runSubagent → AL Planning Subagent (research, devuelve findings)
  ├── runSubagent → AL Implementation Subagent (TDD implementation, devuelve objetos + tests)
  └── runSubagent → AL Code Review Subagent (review, devuelve veredicto)
```

Frontmatter del conductor:
```yaml
tools: ['runSubagent', ...]
agents: ['AL Planning Subagent', 'AL Code Review Subagent', 'AL Implementation Subagent']
```

Nota: `AL Implementation Subagent` es TDD-only y no interactúa con el usuario. `al-developer` sigue siendo invocable directamente por el usuario para tareas tácticas.

### Agentes eliminados respecto a v1.0

Los siguientes agentes se absorben en el modelo simplificado:

| Eliminado | Absorbido en |
|-----------|-------------|
| `al-debugger` | `al-developer` + `skill-debug` |
| `al-tester` | `al-conductor` (TDD inherente) + `skill-testing` |
| `al-api` | `al-architect` + `skill-api` (diseño) / `al-developer` + `skill-api` (impl) |
| `al-copilot` | `al-architect` + `skill-copilot` (diseño) / `al-developer` + `skill-copilot` (impl) |

## Workflows Core requeridos

Para ejecutar el flujo Core, el toolkit **MUST** incluir:

- **al-spec.create** — Normalizar requerimientos → `{req_name}.spec.md`
- **al-build** — Verificación/compilación/packaging
- **al-pr-prepare** — Documentación y entrega en PR
- **al-context.create** — Generar/actualizar contexto del proyecto
- **al-memory.create** — Actualizar `memory.md` global
- **al-initialize** — Setup inicial del entorno (baja frecuencia)

### Workflows eliminados respecto a v1.0

| Eliminado | Absorbido en |
|-----------|-------------|
| `al-diagnose` | `al-developer` + `skill-debug` |
| `al-events` (prompt) | `skill-events` |
| `al-performance` + `al-performance.triage` | `skill-performance` |
| `al-permissions` | `skill-permissions` |
| `al-migrate` | `skill-migrate` |
| `al-pages` | `skill-pages` |
| `al-translate` | `skill-translate` |
| `al-copilot-capability` | `skill-copilot` (fase 1) |
| `al-copilot-promptdialog` | `skill-copilot` (fase 2) |
| `al-copilot-generate` | `skill-copilot` (fase 3) |
| `al-copilot-test` | `skill-copilot` (fase 4) |

## Skills Core

### Definición

Un **skill** es un módulo de conocimiento composable en formato markdown que reside en `skills/` bajo `toolkitRoot`. Los agentes cargan skills bajo demanda según el contexto de la tarea.

### Características

- Los skills **MUST NOT** tener frontmatter de agente (no son invocables directamente).
- Los skills **MUST** ser autocontenidos: incluyen patrones, ejemplos, workflows y referencias.
- Los skills **SHOULD** mantenerse bajo 500 líneas para optimizar context window.
- Los skills **MUST** seguir la convención de nombre `skill-{domain}.md`.

### Skills Core requeridos

El toolkit **MUST** incluir estos skills mínimos para cubrir las capacidades absorbidas:

| Skill | Contenido | Cargado por |
|-------|-----------|-------------|
| `skill-api.md` | API design, OData/REST, versionado, BC API pages | architect (diseño), developer (impl) |
| `skill-copilot.md` | Copilot capability, PromptDialog, AI generation, AI testing — lifecycle completo | architect (diseño), developer (impl) |
| `skill-debug.md` | Debugging workflow, snapshot, CPU profiling, root cause analysis | developer |
| `skill-performance.md` | Profiling, triage, SetLoadFields, FlowField, perf patterns | architect (análisis), developer (fix) |
| `skill-events.md` | Event discovery, subscriber/publisher patterns, event recorder | developer, architect |
| `skill-permissions.md` | Permission set generation, security patterns, least-privilege | developer |
| `skill-testing.md` | Test strategy design, Given/When/Then, AI Test Toolkit | conductor (strategy), developer (impl) |

### Skills recomendados (SHOULD)

| Skill | Contenido | Cargado por |
|-------|-----------|-------------|
| `skill-migrate.md` | Version migration, breaking changes, rollback | developer |
| `skill-pages.md` | Page Designer, page types, UX patterns | developer |
| `skill-translate.md` | XLF workflow, NAB tools, multi-language | developer |
| `skill-estimation.md` | Cost models, SWOT, project structure | presales |

### Mecanismo de carga

En GitHub Copilot, los agentes referencian skills condicionalmente:

```markdown
## Domain Skills

This agent works with the following skills from skills/.
Copilot loads them automatically when relevant to the task:

- **skill-api** — When designing or implementing API pages, OData endpoints
- **skill-debug** — When performing debugging, CPU profiling, diagnostics
```

### Creación de nuevos skills

Los skills siguen la plantilla `docs/templates/skill-template.md`. Cualquier contributor **MAY** proponer nuevos skills via PR. Skills que alteren el comportamiento Core **MUST** seguir el proceso RFC.

## Instructions (sin cambios)

Las 9 instructions files se mantienen sin cambios. Son reglas pasivas auto-aplicadas por `applyTo` patterns:

- `al-guidelines.instructions.md` — Master hub (`**/*.{al,json}`)
- `al-code-style.instructions.md` — Code formatting (`**/*.al`)
- `al-naming-conventions.instructions.md` — Naming rules (`**/*.al`)
- `al-performance.instructions.md` — Performance patterns (`**/*.al`)
- `al-error-handling.instructions.md` — Error handling (`**/*.al`)
- `al-events.instructions.md` — Event patterns (`**/*.al`)
- `al-testing.instructions.md` — Testing rules (`**/test/**/*.al`)
- `copilot-instructions.md` — Master coordination (repo-wide)
- `index.md` — Catalog

## Contratos por requerimiento en `.github/plans/`

### Estructura

```
.github/plans/
  memory.md                              ← GLOBAL (único, acumulativo)
  {req_name}/                            ← un directorio por requerimiento
    {req_name}.spec.md
    {req_name}.architecture.md
    {req_name}.test-plan.md
    {req_name}-phase-<N>-complete.md     ← generado por al-conductor
    {req_name}-complete.md               ← generado por al-conductor
  archive/                               ← requerimientos completados
```

### Convención de nombres

- `{req_name}` **MUST** ser kebab-case (ej: `customer-discount`, `api-integration`)
- `{req_name}` **MUST** ser consistente en todos los ficheros del set y en el nombre del directorio
- Los tipos de contrato son: `spec`, `architecture`, `test-plan`
- El patrón completo es: `.github/plans/{req_name}/{req_name}.{type}.md`

### Contrato `{req_name}.spec.md`

**MUST** contener:
- Contexto y objetivo
- Alcance / no alcance
- Requisitos normalizados (R1…Rn)
- Criterios de aceptación (AC-F, AC-T, AC-Q)
- Restricciones (incl. extensión-only)
- Especificación técnica (MUST para MEDIUM/HIGH)

### Contrato `{req_name}.architecture.md`

**MUST** contener:
- Diseño de alto nivel
- Mapa de objetos AL
- Arquitectura de eventos
- Seguridad/permisos
- Rendimiento
- Decisiones (rationale + alternativas)

### Contrato `{req_name}.test-plan.md`

**MUST** contener:
- Estrategia de test
- Matriz de escenarios (Given/When/Then)
- Datos de prueba
- Quality gates

### Memory global (`memory.md`)

Fichero único y acumulativo. **MUST NOT** borrarse ni sobrescribirse.

**MUST** contener:
- Estado actual del proyecto
- Requerimientos activos (tabla)
- Decisiones tomadas (transversales y por requerimiento)
- Cambios de alcance
- Lecciones aprendidas
- Contexto inter-sesión
- Próximos pasos

Los agentes y humanos **SHOULD** actualizar `memory.md` en cada handoff significativo.

### Roles de los agentes y artefactos

| Agente / Workflow | Rol | Produce |
|-------------------|-----|---------|
| `@AL Architecture & Design Specialist` | Solution Architect — diseña la solución, flujos de datos, decisiones estratégicas | `.github/plans/{req_name}/{req_name}.architecture.md` |
| `al-spec.create` | Spec técnica detallada — lee `architecture.md`, genera blueprint implementable con IDs, firmas, código AL | `.github/plans/{req_name}/{req_name}.spec.md` |
| `@AL Development Conductor` | Orquestador TDD — lee spec + architecture, coordina planning → implement → review | implementación + `.github/plans/{req_name}/{req_name}.test-plan.md` |
| `@AL Implementation Specialist` | Implementación táctica directa — lee spec, sin TDD orquestado | implementación |

### Flujo de creación de artefactos

#### MEDIUM / HIGH (con arquitectura + TDD)

1. Asignar `{req_name}` (kebab-case)
2. `@AL Architecture & Design Specialist` → genera `.github/plans/{req_name}/{req_name}.architecture.md` con diseño aprobado
   - ⚠️ **GATE**: aprobar arquitectura antes de continuar
3. `@workspace use al-spec.create` → lee `architecture.md` y codebase → genera `.github/plans/{req_name}/{req_name}.spec.md`
   - Spec técnica: object IDs, field types, procedure signatures, tests Given/When/Then
   - ⚠️ **GATE**: aprobar spec antes de implementar
4. Actualizar `memory.md` global con contexto del requerimiento
5. `@AL Development Conductor` → orquesta ciclo TDD desde `.github/plans/{req_name}/`:
   - planning-subagent (research) → implement-subagent (TDD) → review-subagent (review)
   - ⚠️ **GATE**: validación humana por fase
6. Entrega → `@workspace use al-pr-prepare` → actualizar `memory.md`
7. Archivar set completado en `archive/` (opcional)

#### LOW (sin arquitectura formal)

1. Asignar `{req_name}` (kebab-case)
2. `@workspace use al-spec.create` → genera `.github/plans/{req_name}/{req_name}.spec.md` directamente desde codebase
   - ⚠️ **GATE**: aprobar spec antes de implementar
3. Actualizar `memory.md` global
4. `@AL Implementation Specialist` → implementa directamente usando spec como blueprint
5. Entrega → actualizar `memory.md`

## Templates inmutables

Los templates viven en `docs/templates/` y **MUST NOT** ser modificados por agentes/workflows. Solo el maintainer puede modificarlos vía RFC.

Templates requeridos (7):
- `spec-template.md`
- `architecture-template.md`
- `test-plan-template.md`
- `memory-template.md` (para inicializar memory global)
- `technical-spec-template.md`
- `delivery-template.md`
- `skill-template.md` (NUEVO en v1.1)

Los agentes **MUST** copiar template → rellenar → escribir en plans (nunca editar template directamente).

## Principios Core

El repositorio y los agentes **MUST** operar respetando:

- **Extensión-only**: **MUST NOT** modificar objetos base directamente.
- **Event-driven**: **SHOULD** usar subscribers/publishers.
- **Spec-driven**: **MUST** existir contrato de comportamiento antes de implementar.
- **Architecture-first** (MEDIUM/HIGH): **MUST** existir `{req_name}.architecture.md` aprobado.
- **HITL**: el humano sigue siendo decisor; gates obligatorios.
- **TDD**: en MEDIUM/HIGH, **SHOULD** aplicarse RED → GREEN → REFACTOR.
- **Immutable templates**: templates solo modificables por maintainer vía RFC.
- **Global memory**: `memory.md` es acumulativo, nunca se borra.
- **Skills-based**: capacidades especializadas se encapsulan en skills composables.
- **Skills evidencing**: los agentes **MUST** declarar qué skills cargaron y qué patrones aplicaron. El implement-subagent declara `### Skills Loaded` en cada Phase Summary; el review-subagent verifica con `Skills Compliance Check`; el conductor consolida en `Skills Applied in This Phase` (phase-complete) y `Skills Utilization Summary` (plan-complete); el architect declara `> **Skills applied**:` en architecture.md.

## Gates HITL (obligatorios)

- **Gate de complejidad**: sistema **MUST** esperar confirmación humana antes de rutear.
- **Gate de arquitectura** (MEDIUM/HIGH): `{req_name}.architecture.md` **MUST** ser aprobado.
- **Gate por fase** (MEDIUM/HIGH): `al-conductor` **MUST** solicitar validación humana.
- **Gate de review**: implementación **MUST** pasar revisión contra spec + architecture + test-plan.
- **Gate de entrega**: **MUST** entregar sin errores conocidos + documentación actualizada.

## Criterios de conformidad (ALDC Core v1.1 Compliant)

Un repositorio es **ALDC Core v1.1 compliant** si:

1. Existe `aldc.yaml` válido contra el schema.
2. Existe `.github/plans/memory.md` (global).
3. Cada requerimiento activo tiene set completo: `{req_name}.spec.md`, `.architecture.md`, `.test-plan.md`.
4. Las 7 plantillas inmutables existen en `docs/templates/` sin alteración.
5. Los 4 agentes Core + 3 subagents internos existen bajo `toolkitRoot`.
6. Los 6 workflows Core existen bajo `toolkitRoot`.
7. Los 7 skills Core requeridos existen en `skills/` bajo toolkitRoot.
8. Las 9 instructions existen.
9. El entrypoint `.github/copilot-instructions.md` es coherente.
10. En MEDIUM/HIGH: flujo spec → architecture → conductor(subagents) → review → entrega con gates HITL.

## Extensibilidad

Extensiones **MAY** añadir:
- Skills adicionales por dominio.
- Agentes especializados (como extensiones, no Core).
- Workflows adicionales.

Pero **MUST NOT**:
- Romper contratos de `.github/plans/`.
- Redefinir nombres de agentes/workflows/skills Core.
- Debilitar gates o reglas de extensión-only.
- Modificar plantillas inmutables.
- Borrar o sobrescribir contenido de `memory.md`.

## Optional Components

Optional components add domain-specific capabilities without altering Core.

Available optional components:

- **BC Agent Builder**: @AL Agent Builder agent, 3 skills, 4 workflows for AI Development Toolkit / Agent SDK development

Optional components MUST NOT:

- Override Core agents or workflows
- Modify Core contract structure
- Weaken HITL gates

Optional components MAY:

- Add new agents (user-invocable: true)
- Add new skills loadable by Core agents
- Add new workflows
- Add domain-specific tools and validators

## Resumen de primitives v1.1

| Tipo | Cantidad | Detalles |
|------|----------|---------|
| Agentes públicos | 4 | architect, conductor, developer, presales |
| Subagents internos | 3 | planning-subagent, implement-subagent, review-subagent |
| Workflows | 6 | spec.create, build, pr-prepare, memory.create, context.create, initialize |
| Skills requeridos | 7 | api, copilot, debug, performance, events, permissions, testing |
| Skills recomendados | 4 | migrate, pages, translate, estimation |
| Instructions | 9 | Sin cambios |
| Templates | 7 | +1 skill-template.md |
| **Total** | **40** | (vs 38 en v1.0, +1 implement-subagent, menor complejidad cognitiva) |
