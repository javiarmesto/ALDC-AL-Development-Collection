# ALDC Manifesto

ALDC existe para convertir el desarrollo AL con agentes en ingeniería controlada.

En la era de la IA, el riesgo no es "que el agente no sepa programar".
El riesgo es **programar sin contrato**, sin trazabilidad y sin governance.

ALDC Core v1.1 impone:

- **Spec-first** — requisitos normalizados antes de tocar código (`{req_name}.spec.md`)
- **Architecture-first** — diseño aprobado antes de implementación en MEDIUM/HIGH (`{req_name}.architecture.md`)
- **Orquestación multi-agente con TDD** — conductor coordina planning, implementation y review via subagents
- **Gates HITL** — el humano decide en cada punto crítico (complejidad, arquitectura, fase, review, entrega)
- **Memory global** — continuidad de contexto entre sesiones y requerimientos (`memory.md`, append-only)
- **Contratos por requerimiento** — 3-file sets por cada req, no genéricos (`{req_name}.{type}.md`)
- **Plantillas inmutables** — 7 templates que solo el maintainer modifica vía RFC
- **Modularización** — conocimiento especializado en skills composables que agentes cargan bajo demanda, sin perder la rigurosidad de orquestación TDD
- **Extensión-only** — sin romper upgrades, sin modificar objetos base
- **Event-driven y API-first** — integración por eventos y APIs como patrón por defecto

## Modelo de roles

| Herramienta | Rol SE | Produce | Cuándo usar |
| ----------- | ------ | ------- | ----------- |
| `@AL Architecture & Design Specialist` | Software Architect — define solución técnica, patrones de integración, ADRs | `{req_name}.architecture.md` | MEDIUM/HIGH: primer paso |
| `al-spec.create` | Design Doc Generator — traduce arquitectura en spec implementable (IDs, firmas, tests) | `{req_name}.spec.md` | Siempre: LOW y MEDIUM/HIGH |
| `@AL Development Conductor` | TDD Orchestrator — ciclo planning → implementation → review con HITL gates | implementación completa | MEDIUM/HIGH: tras spec y architecture |
| `@AL Implementation Specialist` | AL Developer — implementación directa, debugging, correcciones | código AL | LOW / ajustes puntuales |
| `@AL Pre-Sales & Project Estimation Specialist` | Solution Engineer — estimación, análisis técnico-económico, propuestas | sizing, SWOT, propuesta | Antes del proyecto |

### Flujo canónico

**MEDIUM / HIGH:**

```text
@AL Architecture & Design Specialist → al-spec.create → @AL Development Conductor → entrega
     ↓               ↓                ↓
architecture.md   spec.md     plan → TDD → review
  [GATE]          [GATE]        [GATE por fase]
```

**LOW:**

```text
al-spec.create → @AL Implementation Specialist → entrega
     ↓                ↓
   spec.md      implementación directa
   [GATE]
```

## Modelo modular

4 agentes públicos + 1 workflow de especificación. Una pregunta para elegir:

- ¿Diseñando arquitectura? → `@AL Architecture & Design Specialist`
- ¿Generando spec técnica detallada? → `@workspace use al-spec.create`
- ¿Implementando (LOW)? → `@AL Implementation Specialist`
- ¿Feature TDD completa (MEDIUM/HIGH)? → `@AL Development Conductor`
- ¿Estimando proyecto? → `@AL Pre-Sales & Project Estimation Specialist`

Los agentes cargan skills especializados (api, copilot, debug, performance, events, permissions, testing, migrate, pages, translate, estimation) según lo que necesiten. Menos agentes, más conocimiento disponible.

## Objetivo

Menos "vibe coding"; más entrega predecible, auditable y segura.
