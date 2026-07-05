# Plan — ALDC Multi-Harness: Copilot CLI + Orquestación Optimizada

> Plan unificado que integra dos líneas de trabajo analizadas en julio 2026:
> **(A)** llevar los agentes ALDC a GitHub Copilot CLI
> (análisis: [`docs/copilot-cli-agents.md`](../copilot-cli-agents.md), PR #86) y
> **(B)** optimizar el consumo de tokens de la orquestación del Conductor e introducir
> paralelismo de subagentes (análisis del
> [issue #72, comentario de @pgarcia-orisha](https://github.com/javiarmesto/ALDC-AL-Development-Collection/issues/72#issuecomment-4780928850)).
>
> **Estado**: planificación — ningún agente ni primitivo ha sido modificado todavía.
> **Idioma**: ES (documento de trabajo; los primitivos siguen en EN).

## Objetivo

Que la misma colección ALDC funcione con paridad razonable en los tres harnesses
donde ya la usan los usuarios (VS Code Copilot Chat, GitHub Copilot CLI, Claude Code),
reduciendo a la vez el coste de contexto de la orquestación TDD del Conductor —
que es hoy el cuello de botella común a los tres.

Las dos líneas convergen: el recorte del cuerpo de `al-conductor` (bloqueante del CLI
por el límite de 30.000 caracteres) y el journal cumulativo (mayor ahorro de tokens
del issue #72) son el mismo tipo de cambio: sacar contexto del prompt y moverlo a
artefactos en `.github/plans/` que se leen bajo demanda.

## Contexto: qué es factible hoy (julio 2026)

| Capacidad | Copilot Chat (VS Code) | Copilot CLI | Claude Code |
|---|---|---|---|
| Agentes `.agent.md` | ✅ nativo | ✅ `.github/agents/` (el installer ya los coloca ahí) | ✅ como custom subagents |
| Subagentes en paralelo | ✅ desde 14-ene-2026 (`runSubagent`) | ✅ tool `task` + `/fleet` (oleadas por dependencias) | ✅ background por defecto, worktrees, teams |
| Aislamiento de escrituras | ❌ | ❌ | ✅ `isolation: worktree` |
| Compactación de contexto | Automática | `/compact` + gestión de contexto (ene-2026) | `/compact` + resumen automático |
| Modelo de coste | Premium requests por prompt | AI credits (cada subagente consume) | Tokens API |

Consecuencia clave para priorizar: **ahorrar tokens ahorra dinero real en Claude Code,
ahorra credits en CLI, y en Chat ahorra sobre todo latencia y ventana de contexto.**
El paralelismo ahorra tiempo de pared en los tres, pero **no** ahorra tokens (suele
costar más); su valor es latencia y cobertura (p. ej. panel de review multi-dimensión).

## Workstream A — Agentes ALDC en GitHub Copilot CLI

Base: análisis completo en [`docs/copilot-cli-agents.md`](../copilot-cli-agents.md).
Los 10 agentes ya son descubiertos por el CLI (formato y ubicación correctos); los
huecos son identificadores de tools de VS Code, el límite de 30k del Conductor, y la
configuración MCP.

| Fase | Entregable | Esfuerzo | Criterio de aceptación |
|------|-----------|----------|------------------------|
| **A0 — Probar tal cual** | Sesión de humo: `copilot` → `/agent` con al-developer y dredd en un repo consumidor; anotar qué tools se pierden en silencio | Bajo (1 sesión) | Lista real de capacidades perdidas por agente |
| **A1 — Perfiles dual-target** | `tools:` neutras (`read`, `edit`, `search`, `execute`, `agent`, `web` + MCC `al-symbols-mcp/*`, `microsoft-learn/*`); mantener `handoffs`/`argument-hint` (se ignoran fuera de VS Code); documentar `~/.copilot/mcp-config.json` global (evita bug copilot-cli#2630 en subagentes) | Bajo | 7/10 agentes verdes en CLI sin perder nada en VS Code |
| **A2 — Recorte del Conductor** | Externalizar plantillas embebidas del cuerpo de `al-conductor` a `docs/templates/` y leerlas en runtime → cuerpo < 30.000 chars. **Compartido con B1** | Medio | `al-conductor` invocable en CLI; validador sigue en verde |
| **A3 — Flavor de instalación** (opcional) | `install.js --flavor copilot-cli`: remapeo determinista de tools, strip de campos VS Code-only, `target: github-copilot` / `target: vscode` en variantes | Medio | Instalación limpia dual sin entradas duplicadas en `/agent` |
| **A4 — Workflows como agentes** | Los 6 prompts core (`al-spec.create`, `al-build`, `al-pr-prepare`…) como agentes finos → pipeline completo ejecutable desde terminal | Medio | `copilot --agent al-spec --prompt "..."` produce spec válida |

## Workstream B — Orquestación optimizada + paralelismo (issue #72)

Base: los 4 puntos del comentario, depurados. Valoración: el punto 2 (journal) es el
de mayor ROI; el punto 1 (batching) es correcto en intención pero su mecanismo real es
"prompts de tarea destilados + invocación en un turno", no continuidad conversacional
(los subagentes siempre arrancan con contexto aislado); los puntos 3 y 4 son higiene
de contexto de bajo riesgo. La afirmación del 30–40% de ahorro es plausible pero no
verificable sin baseline → la medición va primero.

| Fase | Entregable | Esfuerzo | Criterio de aceptación |
|------|-----------|----------|------------------------|
| **B0 — Medir** | Eval harness con 2-3 golden tasks BC (ya comprometido en #72 para el A/B de personas) instrumentado con tokens in/out, nº de turnos y wall-clock por fase; baseline del Conductor actual | Medio | Baseline reproducible publicado en el repo |
| **B1 — Journal cumulativo** | `IMPLEMENTATION-JOURNAL.md` como artefacto del contrato en `.github/plans/{req}/` (o evolución de `phase-complete.md`): hecho / bloqueos / dependencias. El Conductor lo inyecta en fases ≥2 **en lugar de** spec+architecture completos. **Compartido con A2** | Bajo | Fases ≥2 no releen la spec completa; Δtokens medido vs B0 |
| **B2 — Higiene de contexto** | (a) al-planning-subagent devuelve estructura, nunca fuentes AL completas; (b) regla en el Conductor: "persistir decisión en el plan → compactar/cerrar sesión" tras cada review de fase | Bajo | Prompts actualizados; Δtokens medido vs B0 |
| **B3 — Paralelismo de lectura** | Fan-out en planning (objetos/eventos/BCQuality/docs simultáneos) y review como panel (performance, security, style, cobertura — los pilot skills de BCQuality en paralelo). Solo lecturas: sin riesgo de colisión. Por harness: `runSubagent` paralelo (Chat), `task`/`@agente` en `/fleet` (CLI), Task background (Claude Code) | Medio | Wall-clock de planning/review ↓ sin regresión de calidad en B0 |
| **B4 — Paralelismo de escritura** (experimental) | Solo specs descompuestas (§Spec Decomposition): particionado previo de rangos de object IDs por workstream + worktrees (Claude Code) o sesiones separadas (Chat/CLI). Gate: no arrancar sin B0 y sin regla de particionado de IDs en el Conductor | Alto | Dos sub-specs implementadas en paralelo compilan e integran sin colisión de IDs |

## Secuencia integrada

```
        A0 (humo CLI)          B0 (baseline eval)
              \                     /
               ├── A1 (dual-target tools)
               │
        A2 ═══ B1 (recorte Conductor + journal — mismo cambio de fondo)
               │
               ├── B2 (higiene de contexto)
               ├── B3 (paralelismo de lectura)      ← primera mejora visible de latencia
               │
               ├── A3 (flavor install)   [opcional]
               ├── A4 (workflows→agentes)
               └── B4 (paralelismo de escritura)    [experimental, gated por B0]
```

Hitos de decisión (HITL, como manda ALDC):

1. **Tras A0+B0**: confirmar prioridades con datos (qué tools se pierden de verdad,
   cuánto cuesta de verdad una orquestación completa).
2. **Tras A2/B1**: decidir si `phase-complete.md` evoluciona a journal o se añade
   artefacto nuevo (afecta al spec normativo → versión v1.3 del Core Spec).
3. **Antes de B4**: go/no-go explícito — el desarrollo AL es mayormente secuencial y
   este es el único punto donde el escepticismo sigue justificado hasta tener números.

## Riesgos y salvaguardas

| Riesgo | Salvaguarda |
|--------|-------------|
| Colisión de object IDs / app.json en paralelo de escritura | Particionado de rangos de IDs por workstream ANTES de despachar (regla del Conductor); B4 gated |
| Compactar antes de persistir decisiones → pérdida irrecuperable | Regla de orden explícita en el prompt: journal primero, `/compact` después |
| `mcp-servers` por agente no conecta en subagentes del CLI (copilot-cli#2630) | Config MCP **global** (`~/.copilot/mcp-config.json`) documentada en A1 |
| Los gates HITL serializan y anulan el paralelismo | Paralelizar solo entre gates (research, review); las decisiones siguen siendo secuenciales por diseño |
| Cambios de contrato rompen conformance (spec v1.2, validador, sync-foundation) | A2/B1 pasan por actualización del spec (v1.3) y `npm run validate` en cada fase |
| Divergencia dual-target (mantener 2 sabores de agente) | Preferir A1 (un solo fichero neutro); A3 solo si A1 resulta ruidoso |

## Métricas de éxito

- **Tokens**: −25% o más de tokens de entrada acumulados en una orquestación de 3 fases
  vs baseline B0 (objetivo conservador frente al 30–40% reclamado).
- **Latencia**: −40% de wall-clock en planning+review con B3.
- **Cobertura CLI**: 9/10 agentes utilizables en Copilot CLI (excepción asumida:
  depuración interactiva de al-triage, que permanece VS Code-only).
- **Sin regresión**: mismos veredictos de review y misma tasa de éxito de golden tasks
  que el baseline.

## Referencias

- [`docs/copilot-cli-agents.md`](../copilot-cli-agents.md) — análisis de compatibilidad CLI (Workstream A)
- [Issue #72 — comentario origen del Workstream B](https://github.com/javiarmesto/ALDC-AL-Development-Collection/issues/72#issuecomment-4780928850)
- [/fleet en Copilot CLI](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/fleet) · [blog /fleet](https://github.blog/ai-and-ml/github-copilot/run-multiple-agents-at-once-with-fleet-in-copilot-cli/)
- [Subagentes en VS Code](https://code.visualstudio.com/docs/copilot/agents/subagents) · [VS Code multi-agent (feb-2026)](https://code.visualstudio.com/blogs/2026/02/05/multi-agent-development)
- [Subagentes en Claude Code](https://code.claude.com/docs/en/sub-agents)
- [Custom agents configuration (GitHub Docs)](https://docs.github.com/en/copilot/reference/custom-agents-configuration)

---

**Framework**: ALDC Core v1.2 → propuesta v1.3 en hito 2 | **Fecha**: 2026-07-05
