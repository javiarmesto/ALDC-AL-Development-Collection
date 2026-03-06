# Revisión de Coherencia Final — ALDC Core v3.0.0

## OBJETIVO

Verificar que TODO el framework es coherente entre sí antes de empaquetar.
NO mover ficheros. NO cambiar estructura. Solo detectar inconsistencias y corregir texto.

## REGLAS DE SEGURIDAD

- NO modificar tools, model, handoffs en agentes (ya verificados)
- NO mover skills/ a ningún sitio — skills/ VIVE EN LA RAÍZ de este repo
- NO modificar el body funcional de agentes/skills/prompts
- Solo corregir: texto descriptivo, contadores, referencias cruzadas, versiones
- Cada cambio debe ser mínimo y quirúrgico

## CONTEXTO CRÍTICO — ESTRUCTURA DE DIRECTORIOS

Este repo es el **framework ALDC** (toolkitRoot = `.`).

TODOS los directorios del toolkit están en la RAÍZ:
```
/                          ← raíz del repo framework
├── agents/                ← aquí
├── instructions/          ← aquí
├── prompts/               ← aquí
├── skills/                ← AQUÍ (raíz, NO en .github/skills/)
├── docs/
│   ├── templates/
│   ├── schema/
│   └── framework/
├── tools/
├── aldc.yaml
└── package.json
```

**Cuando se instale en un repo AL destino**, el install.js copia TODO a `.github/`:
```
repo-destino/.github/
├── agents/
├── instructions/
├── prompts/
├── skills/               ← se copia aquí en destino
├── docs/
├── tools/
└── copilot-instructions.md
```

Por tanto:
- En ESTE repo: `skills/skill-api.md` ✅
- En ESTE repo: `.github/skills/skill-api.md` ❌ NO EXISTE
- Las referencias `@file skills/skill-api.md` en agents son CORRECTAS para este repo
- El `aldc.yaml` debe referenciar `skills/` (relativo a toolkitRoot que es `.`)

Si algún documento dice que skills está en `.github/skills/` → CORREGIR a `skills/`
(excepto cuando habla explícitamente del repo destino o de la spec GitHub Agent Skills)

## CHECKS DE COHERENCIA

### CHECK 1 — Contadores en documentos

Verificar que estos contadores son consistentes en TODOS los ficheros que los mencionan:

| Concepto | Valor correcto |
|----------|---------------|
| Agentes públicos | 4 (architect, conductor, developer, presales) |
| Subagents internos | 3 (planning, implement, review) |
| Workflows Core | 6 (spec.create, build, pr-prepare, memory.create, context.create, initialize) |
| Skills requeridos | 7 (api, copilot, debug, performance, events, permissions, testing) |
| Skills recomendados | 4 (migrate, pages, translate, estimation) |
| Skills total | 11 |
| Instructions | 9 (incluyendo copilot-instructions e index) |
| Templates | 7 |
| Total primitives | 40 |

Ficheros a verificar:
- docs/framework/ALDC-Core-Spec-v1.1.md → sección "Resumen de primitives"
- docs/framework/ALDC-Manifesto.md → modelo modular
- docs/framework/ALDC-Architecture-Diagrams.md → diagrama 1
- docs/framework/ALDC-Compliance-Model.md → checklist
- docs/framework/QUICKSTART.md → checklist de onboarding
- instructions/copilot-instructions.md → overview + workspace structure
- agents/index.md → tablas de agentes
- docs/framework/overview.md → statistics table
- prompts/index.md → contadores de workflows
- prompts/README.md → workflow reference table

Si algún fichero dice "4 agents + 2 subagents" → corregir a "4 agents + 3 subagents"
Si algún fichero dice "38 primitives" → corregir a "40"
Si algún fichero dice "11 agents" → corregir a "4 agents + 3 subagents"

### CHECK 2 — Typo user-invokable (post-fix)

Después de aplicar CLAUDE-agents-frontmatter-safe.md, verificar:
```bash
grep -rn "user-invokable" agents/ docs/ instructions/ skills/ prompts/
```
Resultado esperado: 0 ocurrencias.

Si queda alguna → corregir a `user-invocable`.

### CHECK 3 — Referencias a agentes eliminados

Buscar referencias a agentes que ya NO existen en v1.1:
```bash
grep -rn "al-debugger\|al-tester\|al-api\b\|al-copilot\b" agents/ docs/ instructions/ prompts/ skills/
```

- Si aparecen en tablas de "eliminados" / "absorbidos" → OK (contexto histórico)
- Si aparecen como si fueran agentes activos → CORREGIR

### CHECK 4 — Referencias a skills: paths correctos

#### 4A — En agents/*.agent.md

Las referencias a skills DEBEN ser:
```markdown
@file skills/skill-api.md
```
NO:
```markdown
@file .github/skills/skill-api.md
@file .github/skills/skill-api/SKILL.md
```

Verificar:
```bash
grep -h "@file" agents/*.agent.md | sort -u
```

Cada `@file skills/skill-*.md` debe apuntar a un fichero que EXISTE:
```bash
ls skills/skill-*.md
```

Si hay mismatch → reportar.

#### 4B — En aldc.yaml

La sección skills debe referenciar paths relativos a toolkitRoot (que es `.`):
```yaml
skills:
  path: "skills"
```
NO:
```yaml
skills:
  path: ".github/skills"
```

#### 4C — En documentación

Buscar referencias incorrectas a `.github/skills/` en documentación de este repo:
```bash
grep -rn "\.github/skills" docs/ instructions/ prompts/
```

- Si habla de "repo destino" o "GitHub Agent Skills spec" → OK
- Si habla de la estructura de ESTE repo → CORREGIR a `skills/`

#### 4D — En validador

```bash
grep -n "skills" tools/aldc-validate/index.js
```

El validador debe buscar skills en el path definido en aldc.yaml (normalmente `skills/`),
NO hardcodeado a `.github/skills/`.

### CHECK 5 — Versiones consistentes

| Campo | Valor correcto |
|-------|---------------|
| package.json version | 3.0.0 |
| aldc.yaml core.version | 1.1.0 |
| CHANGELOG último entry | v3.0.0 |
| ALDC-Core-Spec title | v1.1 |
| copilot-instructions.md footer | v1.1.0 |
| agents/index.md Version | 1.1.0 |

Ficheros a verificar:
- package.json → `"version": "3.0.0"`
- aldc.yaml → `core: { version: "1.1.0" }`
- CHANGELOG.md → primera entrada = v3.0.0
- docs/framework/ALDC-Core-Spec-v1.1.md → título y estado
- instructions/copilot-instructions.md → version al final
- agents/index.md → version al final

### CHECK 6 — Subagents: user-invocable + disable-model-invocation

Después de aplicar el fix de frontmatter:
```bash
grep -A2 "user-invocable" agents/al-implement-subagent.agent.md
grep -A2 "user-invocable" agents/al-planning-subagent.agent.md
grep -A2 "user-invocable" agents/al-review-subagent.agent.md
```

Cada uno DEBE tener:
```yaml
user-invocable: false
disable-model-invocation: true
```

### CHECK 7 — Conductor agents: field

```bash
grep "^agents:" agents/al-conductor.agent.md
```

DEBE contener los 3 subagents:
```yaml
agents: ['al-planning-subagent', 'al-review-subagent', 'al-implement-subagent']
```

### CHECK 8 — BC Agents Pack referencias

Si el pack bc-agents está integrado (v3.1.0), verificar:
- agents/al-agent-builder.agent.md → `pack: "bc-agents"` en frontmatter
- aldc.yaml → sección `packs:` con bc-agents
- skills/ → skill-agent-instructions.md, skill-agent-task-patterns.md, skill-agent-toolkit.md existen
- prompts/ → al-agent.create, al-agent.task, al-agent.instructions, al-agent.test existen

Si el pack NO está integrado aún → marcar como pendiente, no error.

### CHECK 9 — Templates inmutables (7)

```bash
ls docs/templates/
```

DEBE contener exactamente 7:
1. spec-template.md
2. architecture-template.md
3. test-plan-template.md
4. memory-template.md
5. technical-spec-template.md
6. delivery-template.md
7. skill-template.md

### CHECK 10 — Validador funciona

```bash
cd tools/aldc-validate
npm install js-yaml 2>/dev/null
cd ../..
node tools/aldc-validate/index.js --config aldc.yaml
```

Resultado esperado: `✅ ALDC Core v1.1 COMPLIANT`

Si falla → reportar qué check falla, pero NO modificar el validador.
Si falla por path de skills → CHECK 4D ya lo cubre.

### CHECK 11 — README.md marketplace

El README.md raíz debe reflejar v3.0.0:
- Título/badge con versión correcta
- Tabla de agentes: 4 públicos + 3 subagents
- Skills: 11
- Workflows: 6
- Breaking changes desde v2.x documentados

### CHECK 12 — copilot-instructions.md workspace structure

La sección "Workspace Structure" al final de `instructions/copilot-instructions.md`
debe reflejar la estructura real de ESTE repo:

```
ALDC-Core/
├── instructions/          ← en raíz
├── agents/                ← en raíz
├── skills/                ← EN RAÍZ (no en .github/)
├── prompts/               ← en raíz
├── docs/
│   ├── framework/
│   └── templates/
├── tools/
├── .github/plans/         ← plans sí va en .github (es convención GitHub)
├── aldc.yaml
└── package.json
```

Verificar que NO diga que skills está dentro de `.github/`.

### CHECK 13 — Estructura de skills/ correcta

```bash
ls -la skills/
```

Verificar que los 11 skills existen como ficheros sueltos `skill-*.md` en `skills/`.
NO deben estar en subdirectorios tipo `skills/skill-api/SKILL.md`.

La reestructuración a formato GitHub Agent Skills (`.github/skills/{name}/SKILL.md`)
se aplica SOLO en el repo destino al instalar, NO en este repo fuente.

## ENTREGABLE

Genera un informe de coherencia:

```markdown
# Informe de Coherencia — ALDC v3.0.0

## Resumen
- Checks pasados: X/13
- Checks con issues: X/13

## Detalle por check

### CHECK 1 — Contadores
- ✅ / ❌ {detalle}

### CHECK 2 — Typo
- ✅ / ❌ {detalle}

[... para cada check ...]

## Correcciones aplicadas
1. {fichero}: {qué se cambió}
2. ...

## Pendientes (no corregidos)
1. {qué falta y por qué}
```

NO hagas commit. Muéstrame el informe y los diffs.
