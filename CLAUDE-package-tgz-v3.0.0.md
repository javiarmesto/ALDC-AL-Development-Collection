# Empaquetado ALDC Core v3.0.0 — Generar .tgz instalable

## OBJETIVO

Crear `aldc-core-3.0.0.tgz` que se pueda instalar en cualquier repo AL destino.
El tgz contiene todo el toolkit listo para copiar.

## CONTEXTO

- Este repo ES el framework (toolkitRoot = `.`)
- Todos los directorios (agents/, instructions/, prompts/, skills/, docs/, tools/) están en la RAÍZ
- El repo destino tendrá toolkitRoot = `.github` (convención AL repos)
- Al instalar, el script `install.js` copia TODO a `.github/` en destino:
  - `skills/` → `.github/skills/`
  - `agents/` → `.github/agents/`
  - etc.

## QUÉ INCLUIR EN EL TGZ

```
aldc-core-3.0.0/
├── agents/                          ← 7 ficheros .agent.md
│   ├── al-architect.agent.md
│   ├── al-conductor.agent.md
│   ├── al-developer.agent.md
│   ├── al-presales.agent.md
│   ├── al-planning-subagent.agent.md
│   ├── al-implement-subagent.agent.md
│   ├── al-review-subagent.agent.md
│   ├── al-agent-builder.agent.md     ← si pack bc-agents integrado
│   └── index.md
├── instructions/                    ← 9 ficheros
│   ├── copilot-instructions.md
│   ├── al-guidelines.instructions.md
│   ├── al-code-style.instructions.md
│   ├── al-naming-conventions.instructions.md
│   ├── al-performance.instructions.md
│   ├── al-error-handling.instructions.md
│   ├── al-events.instructions.md
│   ├── al-testing.instructions.md
│   ├── al-agent-toolkit.instructions.md  ← si pack bc-agents
│   └── index.md
├── prompts/                         ← 6 core + bc-agents prompts
│   ├── al-spec.create.prompt.md
│   ├── al-build.prompt.md
│   ├── al-pr-prepare.prompt.md
│   ├── al-memory.create.prompt.md
│   ├── al-context.create.prompt.md
│   ├── al-initialize.prompt.md
│   ├── al-agent.create.prompt.md     ← si pack bc-agents
│   ├── al-agent.task.prompt.md       ← si pack bc-agents
│   ├── al-agent.instructions.prompt.md ← si pack bc-agents
│   ├── al-agent.test.prompt.md       ← si pack bc-agents
│   ├── index.md
│   └── README.md
├── skills/                          ← 11 skills (ficheros sueltos aquí)
│   ├── skill-api.md
│   ├── skill-copilot.md
│   ├── skill-debug.md
│   ├── skill-performance.md
│   ├── skill-events.md
│   ├── skill-permissions.md
│   ├── skill-testing.md
│   ├── skill-migrate.md
│   ├── skill-pages.md
│   ├── skill-translate.md
│   ├── skill-estimation.md
│   ├── skill-agent-instructions.md   ← si pack bc-agents
│   ├── skill-agent-task-patterns.md  ← si pack bc-agents
│   ├── skill-agent-toolkit.md        ← si pack bc-agents
│   └── index.md
├── docs/
│   ├── templates/                   ← 7 plantillas inmutables
│   │   ├── spec-template.md
│   │   ├── architecture-template.md
│   │   ├── test-plan-template.md
│   │   ├── memory-template.md
│   │   ├── technical-spec-template.md
│   │   ├── delivery-template.md
│   │   └── skill-template.md
│   ├── schema/
│   │   └── aldc.schema.json
│   └── framework/                   ← documentación del framework
│       ├── ALDC-Core-Spec-v1.1.md
│       ├── ALDC-Manifesto.md
│       ├── ALDC-Compliance-Model.md
│       ├── ALDC-Governance.md
│       ├── ALDC-Architecture-Diagrams.md
│       ├── ALDC-Migration-v1.0-to-v1.1.md
│       ├── QUICKSTART.md
│       ├── ROADMAP-2026.md
│       ├── orchestration-architecture.md
│       ├── ai-native-concepts.md
│       ├── ai-native-instructions-architecture.md
│       ├── ai-native-structure.md
│       ├── architecture.md
│       └── overview.md
├── tools/
│   └── aldc-validate/               ← validador (index.js + dependencias)
│       ├── index.js
│       └── package.json
├── aldc.yaml                        ← configuración Core
├── package.json                     ← metadata extensión (version 3.0.0)
├── CHANGELOG.md
├── README.md
└── install.js                       ← script de instalación en repo destino
```

## QUÉ NO INCLUIR

- node_modules/
- .git/
- .vscode/ (es local)
- *.vsix (se genera aparte)
- /mnt/user-data/outputs/ (ficheros de trabajo)
- Ficheros CLAUDE-*.md (prompts de trabajo)
- Transcripts

## COMANDO DE EMPAQUETADO

```bash
# Desde la raíz del repo
# 1. Crear directorio temporal
mkdir -p /tmp/aldc-pack/aldc-core-3.0.0

# 2. Copiar solo lo necesario
cp -r agents/ /tmp/aldc-pack/aldc-core-3.0.0/
cp -r instructions/ /tmp/aldc-pack/aldc-core-3.0.0/
cp -r prompts/ /tmp/aldc-pack/aldc-core-3.0.0/
cp -r skills/ /tmp/aldc-pack/aldc-core-3.0.0/
cp -r docs/ /tmp/aldc-pack/aldc-core-3.0.0/
cp -r tools/ /tmp/aldc-pack/aldc-core-3.0.0/
cp aldc.yaml package.json CHANGELOG.md README.md /tmp/aldc-pack/aldc-core-3.0.0/
cp install.js /tmp/aldc-pack/aldc-core-3.0.0/ 2>/dev/null || true

# 3. Limpiar basura del temporal
find /tmp/aldc-pack -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null
find /tmp/aldc-pack -name ".git" -type d -exec rm -rf {} + 2>/dev/null
find /tmp/aldc-pack -name "*.vsix" -delete 2>/dev/null
find /tmp/aldc-pack -name "CLAUDE-*" -delete 2>/dev/null

# 4. Empaquetar
cd /tmp/aldc-pack
tar czf aldc-core-3.0.0.tgz aldc-core-3.0.0/

# 5. Copiar al output
cp aldc-core-3.0.0.tgz /ruta/output/

# 6. Limpiar
rm -rf /tmp/aldc-pack
```

## INSTALL.JS (script de instalación para repo destino)

El install.js debe:
1. Leer `aldc.yaml` para saber el `toolkitRoot` destino (default: `.github`)
2. Copiar agents/ → `{toolkitRoot}/agents/`
3. Copiar instructions/ → `{toolkitRoot}/instructions/`
4. Copiar prompts/ → `{toolkitRoot}/prompts/`
5. Copiar skills/ → `{toolkitRoot}/skills/`
6. Copiar docs/templates/ → `{toolkitRoot}/docs/templates/`
7. Copiar docs/schema/ → `{toolkitRoot}/docs/schema/`
8. Copiar tools/ → `{toolkitRoot}/tools/`
9. Copiar aldc.yaml → raíz del repo destino
10. Crear `.github/plans/memory.md` desde template (si no existe)
11. Crear `.github/copilot-instructions.md` desde instructions/copilot-instructions.md (si no existe)

**NO sobrescribir** ficheros que ya existan en el destino (modo safe).
Usar flag `--force` para sobrescribir.

## VERIFICACIÓN POST-EMPAQUETADO

```bash
# Verificar contenido del tgz
tar tzf aldc-core-3.0.0.tgz | head -50

# Verificar tamaño razonable (debería ser <2MB)
ls -lh aldc-core-3.0.0.tgz

# Verificar que no incluye basura
tar tzf aldc-core-3.0.0.tgz | grep -E "node_modules|\.git/|\.vsix|CLAUDE-"
# Resultado esperado: 0 líneas
```

## INSTALACIÓN EN REPO DESTINO (mañana)

```bash
# En el repo AL destino:
cd mi-repo-al

# Extraer
tar xzf aldc-core-3.0.0.tgz

# Instalar
node aldc-core-3.0.0/install.js --target .github

# Validar
node .github/tools/aldc-validate/index.js --config aldc.yaml

# Limpiar
rm -rf aldc-core-3.0.0/
```
