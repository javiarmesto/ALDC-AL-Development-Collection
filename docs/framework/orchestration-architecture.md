# 🎭 Arquitectura de Orquestación Multi-Agente

> Guía completa para entender y configurar el sistema de orquestación de agentes en VS Code con GitHub Copilot.

## Índice

1. [Conceptos Fundamentales](#1-conceptos-fundamentales)
2. [Estructura de Archivos `.agent.md`](#2-estructura-de-archivos-agentmd)
3. [Diseño del Patrón Conductor-Subagentes](#3-diseno-del-patron-conductor-subagentes)
4. [Configuración de Cada Componente](#4-configuracion-de-cada-componente)
5. [Mecanismo de Invocación](#5-mecanismo-de-invocacion-de-subagentes)
6. [Configuración de Herramientas](#6-configuracion-de-herramientas-tools)
7. [Handoffs (Transiciones)](#7-handoffs-transiciones)
8. [Modelos de Lenguaje por Agente](#8-modelo-de-lenguaje-por-agente)
9. [Ejemplo Completo](#9-ejemplo-completo-de-orquestacion)
10. [Guía de Implementación](#10-guia-para-implementar-en-tu-proyecto)

---

## 1. Conceptos Fundamentales

### 1.1 ¿Qué son los Custom Agents?

Los **Custom Agents** (anteriormente "Chat Modes") son archivos Markdown con extensión `.agent.md` que definen "personalidades" especializadas para GitHub Copilot. Cada agente configura:

| Elemento | Descripción |
|----------|-------------|
| **Instrucciones** | Cómo debe comportarse la IA |
| **Herramientas** | Qué acciones puede ejecutar |
| **Modelo LLM** | Qué modelo de lenguaje usar |
| **Handoffs** | Transiciones a otros agentes |

### 1.2 Ubicación Oficial de Archivos

```
📁 tu-proyecto/
└── 📁 .github/
    └── 📁 agents/                    # ← Carpeta oficial para agentes
        ├── 📄 mi-conductor.agent.md
        ├── 📄 mi-subagente-1.agent.md
        └── 📄 mi-subagente-2.agent.md
```

> **Nota**: VS Code detecta automáticamente cualquier archivo `.md` en `.github/agents/` como Custom Agent.

### 1.3 Alternativa: Perfil de Usuario

Para reutilizar agentes en múltiples proyectos, puedes crearlos en tu perfil:

```
📁 %APPDATA%/Code/User/
└── 📁 agents/
    └── 📄 mi-agente-global.agent.md
```

---

## 2. Estructura de Archivos `.agent.md`

### 2.1 Formato Completo

```yaml
---
# ══════════════════════════════════════════════════════════
# FRONTMATTER YAML (Metadatos del Agente)
# ══════════════════════════════════════════════════════════

# Nombre mostrado en el dropdown (opcional, usa nombre de archivo si omite)
name: Mi Agente Personalizado

# Descripción breve (aparece como placeholder en el input)
description: 'Descripción de lo que hace este agente'

# Hint sobre qué tipo de input espera el agente
argument-hint: 'Describe tu problema o tarea aquí'

# Lista de herramientas disponibles para este agente
tools: 
  - 'search'              # Herramienta built-in
  - 'edit'                # Herramienta built-in
  - 'mcp-server/*'        # Todas las tools de un MCP server
  - 'extension/tool-name' # Tool específica de extensión

# Modelo de IA a usar
model: Claude Sonnet 4.5

# Entorno objetivo (vscode o github-copilot)
target: vscode

# Transiciones a otros agentes
handoffs:
  - label: "Siguiente Paso"
    agent: otro-agente
    prompt: "Prompt para el siguiente agente"
    send: false
---

# ══════════════════════════════════════════════════════════
# CUERPO MARKDOWN (Instrucciones del Agente)
# ══════════════════════════════════════════════════════════

# Título del Agente

Eres un **AGENTE ESPECIALIZADO** en...

## Tu Rol
- Qué debe hacer
- Qué NO debe hacer

## Workflow
1. Paso 1
2. Paso 2

## Reglas Importantes
- Regla 1
- Regla 2
```

### 2.2 Campos del Frontmatter

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | No | Nombre del agente en UI |
| `description` | string | Sí | Descripción breve |
| `argument-hint` | string | No | Hint para el usuario |
| `tools` | array | Sí | Lista de herramientas |
| `model` | string | No | Modelo LLM a usar |
| `target` | string | No | `vscode` o `github-copilot` |
| `handoffs` | array | No | Transiciones a otros agentes |

### 2.3 Ejemplo Minimalista

```yaml
---
description: 'Revisa código buscando problemas de seguridad'
tools: ['search', 'problems']
---

# Security Reviewer

Eres un revisor de seguridad. Analiza el código buscando:
- Vulnerabilidades de inyección
- Exposición de credenciales
- Problemas de autenticación

Reporta los problemas encontrados con severidad.
```

---

## 3. Diseño del Patrón Conductor-Subagentes { #3-diseno-del-patron-conductor-subagentes }

### 3.1 Arquitectura Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎭 CONDUCTOR (Orquestador)                   │
│                                                                 │
│  • Coordina el ciclo completo de trabajo                       │
│  • Delega tareas a subagentes via #runSubagent                 │
│  • Mantiene estado y documenta progreso                        │
│  • NO implementa código directamente                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  🔍 PLANNING     │ │  💻 IMPLEMENT    │ │  ✅ REVIEW       │
│     Subagent     │ │     Subagent     │ │     Subagent     │
│                  │ │                  │ │                  │
│ • Solo lectura   │ │ • Edición        │ │ • Solo lectura   │
│ • Investiga      │ │ • Build/Test     │ │ • Valida calidad │
│ • Analiza        │ │ • Implementa     │ │ • Reporta issues │
│ • Retorna datos  │ │ • TDD cycle      │ │ • APPROVED/FAIL  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 3.2 Flujo de Trabajo Típico

```
┌──────────────────────────────────────────────────────────────┐
│ 1. PLANNING PHASE                                            │
│    └─▶ runSubagent(planning) ──▶ Retorna findings            │
├──────────────────────────────────────────────────────────────┤
│ 2. CREATE PLAN                                               │
│    └─▶ Conductor crea plan multi-fase basado en findings     │
├──────────────────────────────────────────────────────────────┤
│ 3. USER APPROVAL                                             │
│    └─▶ ⏸️ PAUSA: Usuario revisa y aprueba plan               │
├──────────────────────────────────────────────────────────────┤
│ 4. FOR EACH PHASE:                                           │
│    ├─▶ runSubagent(implement) ──▶ Implementa con TDD         │
│    ├─▶ runSubagent(review) ────▶ Valida calidad              │
│    │   ├─ APPROVED ───▶ Continuar                            │
│    │   └─ NEEDS_REVISION ──▶ Volver a implement              │
│    └─▶ ⏸️ PAUSA: Usuario hace commit                         │
├──────────────────────────────────────────────────────────────┤
│ 5. COMPLETION                                                │
│    └─▶ Documentar resultado final                            │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Principios de Diseño

| Principio | Descripción |
|-----------|-------------|
| **Separación de responsabilidades** | Cada agente tiene un rol específico y limitado |
| **Tool boundaries** | Limitar herramientas por rol (seguridad) |
| **Flujo unidireccional** | Conductor → Subagentes → Conductor |
| **Checkpoints** | Usuario valida antes de cada commit |
| **Documentación automática** | Todo se registra en archivos `.md` |

---

## 4. Configuración de Cada Componente { #4-configuracion-de-cada-componente }

### 4.1 Conductor (Orquestador)

**Propósito**: Coordinar todo el ciclo de desarrollo.

```yaml
---
description: 'Orchestrates the full development cycle'
tools: 
  - 'agent'          # ← Crítico: permite invocar subagentes
  - 'memory'         # Persistir contexto
  - 'todo'           # Tracking de progreso
  - 'edit'           # Crear documentación
  - 'search'
  - 'read/readFile'
model: Claude Opus 4.5 (Preview)  # Modelo potente para decisiones
---
```

**Características clave**:
- ✅ Tiene tool `agent` para invocar subagentes
- ✅ Puede editar (para documentación)
- ✅ Modelo más potente (decisiones complejas)
- ❌ NO implementa código directamente

### 4.2 Planning Subagent (Investigador)

**Propósito**: Investigar y recopilar contexto.

```yaml
---
description: 'Research and context gathering'
tools:
  - 'search'         # Búsqueda semántica
  - 'usages'         # Referencias de código
  - 'problems'       # Errores actuales
  - 'changes'        # Cambios recientes
  - 'fetch'          # Consultar URLs
  # NO incluir 'edit' - solo lectura
model: Claude Sonnet 4.5  # Modelo rápido para búsqueda
---
```

**Características clave**:
- ✅ Solo herramientas de lectura
- ✅ Retorna findings estructurados
- ❌ NO puede editar archivos
- ❌ NO toma decisiones arquitectónicas

### 4.3 Implement Subagent (Implementador)

**Propósito**: Escribir código siguiendo TDD.

```yaml
---
description: 'TDD-focused implementation'
tools:
  - 'edit'                    # Crear/modificar archivos
  - 'search'
  - 'read/readFile'
  - 'execute/runInTerminal'   # Ejecutar comandos
  - 'extension/build-tool'    # Herramientas de build
  - 'extension/test-tool'     # Herramientas de test
model: Claude Sonnet 4.5
---
```

**Características clave**:
- ✅ Puede editar archivos
- ✅ Puede ejecutar builds y tests
- ✅ Sigue ciclo TDD: RED → GREEN → REFACTOR
- ❌ NO decide la arquitectura (sigue el plan)

### 4.4 Review Subagent (Revisor)

**Propósito**: Validar calidad del código.

```yaml
---
description: 'Code review and quality assurance'
tools:
  - 'search'
  - 'usages'
  - 'problems'
  - 'changes'
  - 'testFailure'    # Analizar tests fallidos
  # NO incluir 'edit' - solo lectura
model: Claude Sonnet 4.5
---
```

**Características clave**:
- ✅ Solo herramientas de lectura
- ✅ Retorna: APPROVED / NEEDS_REVISION / FAILED
- ❌ NO puede corregir código (solo reporta)

---

## 5. Mecanismo de Invocación de Subagentes { #5-mecanismo-de-invocacion-de-subagentes }

### 5.1 La Herramienta `runSubagent`

El Conductor usa `#runSubagent` para delegar tareas:

```markdown
## En las instrucciones del Conductor:

Use `#runSubagent` to invoke the **planning-subagent** with:
- The user's request
- Context about what to investigate
- Instructions to return structured findings
```

### 5.2 Sintaxis de Invocación

```markdown
# Dentro del prompt del Conductor:

I will now delegate research to the planning subagent.

[Invoke #runSubagent with:
  - agentName: "planning-subagent"
  - prompt: "Research the authentication system. 
             Identify existing patterns, dependencies, 
             and potential integration points.
             Return structured findings."
]
```

### 5.3 Flujo de Comunicación

```
CONDUCTOR                              SUBAGENT
    │                                      │
    │──── runSubagent(prompt) ────────────▶│
    │                                      │
    │                              [Ejecuta tarea]
    │                              [Usa sus tools]
    │                                      │
    │◀──── Retorna resultado ──────────────│
    │                                      │
[Procesa resultado]                        │
[Decide siguiente paso]                    │
```

### 5.4 Ejemplo Completo

```markdown
## Conductor invocando Planning Subagent:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 CONDUCTOR ORCHESTRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ Phase 1: Planning ─────────────────────┐
│ 🔍 planning-subagent          [RUNNING] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ...%   │
│ Status: Researching codebase...        │
└─────────────────────────────────────────┘

[runSubagent invocation with detailed prompt]

## Después de completar:

┌─ Phase 1: Planning ─────────────────────┐
│ 🔍 planning-subagent         [COMPLETE] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%   │
│ ✓ Research complete (2.3s)             │
└─────────────────────────────────────────┘

📊 Planning Findings:
  ✓ 5 relevant files identified
  ✓ 2 integration points found
  ✓ No blocking issues detected
```

---

## 6. Configuración de Herramientas (Tools) { #6-configuracion-de-herramientas-tools }

### 6.1 Tipos de Herramientas Disponibles

```yaml
tools:
  # ═══════════════════════════════════════
  # 1. BUILT-IN DE VS CODE
  # ═══════════════════════════════════════
  - 'search'          # Búsqueda semántica en código
  - 'usages'          # Encontrar referencias
  - 'problems'        # Errores y warnings
  - 'changes'         # Cambios git
  - 'edit'            # Editar archivos
  - 'fetch'           # Consultar URLs
  - 'agent'           # Invocar subagentes
  - 'memory'          # Persistir contexto
  - 'todo'            # Lista de tareas
  
  # ═══════════════════════════════════════
  # 2. GRUPOS DE HERRAMIENTAS (Tool Sets)
  # ═══════════════════════════════════════
  - 'read/*'          # Todas las tools de lectura
  - 'execute/*'       # Todas las de ejecución
  
  # ═══════════════════════════════════════
  # 3. MCP SERVERS (Model Context Protocol)
  # ═══════════════════════════════════════
  - 'mcp-server-name/*'           # Todas las tools del server
  - 'mcp-server-name/tool-name'   # Tool específica
  
  # ═══════════════════════════════════════
  # 4. EXTENSIONES DE VS CODE
  # ═══════════════════════════════════════
  - 'extension-id/tool-name'      # Tool de extensión
```

### 6.2 Matriz de Herramientas por Rol

| Herramienta | Conductor | Planning | Implement | Review |
|-------------|:---------:|:--------:|:---------:|:------:|
| `search` | ✅ | ✅ | ✅ | ✅ |
| `usages` | ✅ | ✅ | ✅ | ✅ |
| `problems` | ✅ | ✅ | ✅ | ✅ |
| `changes` | ✅ | ✅ | ✅ | ✅ |
| `edit` | ✅ | ❌ | ✅ | ❌ |
| `execute/*` | ✅ | ❌ | ✅ | ❌ |
| `agent` | ✅ | ❌ | ❌ | ❌ |
| `memory` | ✅ | ❌ | ❌ | ❌ |
| `testFailure` | ❌ | ❌ | ✅ | ✅ |

### 6.3 Principio de Mínimo Privilegio

```yaml
# ❌ MAL: Demasiadas herramientas para un revisor
tools: ['search', 'edit', 'execute/*', 'agent']

# ✅ BIEN: Solo lo necesario para revisar
tools: ['search', 'usages', 'problems', 'changes']
```

---

## 7. Handoffs (Transiciones)

### 7.1 ¿Qué son los Handoffs?

Los handoffs permiten crear **flujos de trabajo guiados** que transicionan entre agentes con un solo clic.

### 7.2 Configuración de Handoffs

```yaml
---
description: 'Planning agent'
tools: ['search', 'fetch']
handoffs:
  - label: "🚀 Start Implementation"    # Texto del botón
    agent: implement-agent              # Agente destino
    prompt: "Implement the plan above." # Prompt a enviar
    send: false                         # false = editable antes de enviar
    
  - label: "📋 Create Tests First"
    agent: test-agent
    prompt: "Create failing tests for the planned features."
    send: true                          # true = envía automáticamente
---
```

### 7.3 Visualización de Handoffs

```
┌─────────────────────────────────────────────────────┐
│              Respuesta del Agente                   │
│                                                     │
│  "He analizado el código y creado un plan de       │
│   implementación con 3 fases..."                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ [🚀 Start Implementation]  [📋 Create Tests] │   │  ← Botones Handoff
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 7.4 Casos de Uso Comunes

| Flujo | Descripción |
|-------|-------------|
| **Planning → Implementation** | Después de planificar, implementar |
| **Implementation → Review** | Después de implementar, revisar |
| **Review → Fix** | Si hay issues, corregir |
| **Tests → Implementation** | TDD: tests primero, luego código |

---

## 8. Modelo de Lenguaje por Agente

### 8.1 Estrategia de Selección de Modelos

```yaml
# ═══════════════════════════════════════════════════════
# CONDUCTOR: Modelo más potente
# Razón: Decisiones complejas, orquestación, análisis
# ═══════════════════════════════════════════════════════
model: Claude Opus 4.5 (Preview)

# ═══════════════════════════════════════════════════════
# SUBAGENTES: Modelos más rápidos/económicos
# Razón: Tareas más acotadas, patrones conocidos
# ═══════════════════════════════════════════════════════
model: Claude Sonnet 4.5
# Alternativas: GPT-4o, Claude Haiku
```

### 8.2 Matriz de Recomendación

| Agente | Modelo Recomendado | Alternativa Económica | Justificación |
|--------|-------------------|----------------------|---------------|
| **Conductor** | Claude Opus 4.5 | GPT-4o | Orquestación compleja |
| **Planning** | Claude Sonnet 4.5 | GPT-4o-mini | Búsqueda y análisis |
| **Implement** | Claude Sonnet 4.5 | GPT-4o | Código TDD |
| **Review** | Claude Sonnet 4.5 | GPT-4o-mini | Validación |

### 8.3 Optimización de Costos

```yaml
# Implementación con modelo económico para tareas repetitivas
---
description: 'Fast implementation subagent'
model: Claude Haiku 4.5  # 10x más barato que Opus
tools: ['edit', 'search']
---
```

---

## 9. Ejemplo Completo de Orquestación { #9-ejemplo-completo-de-orquestacion }

### Escenario: "Añadir autenticación OAuth"

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 USER REQUEST: "Add OAuth authentication to the API"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────┐
│ STEP 1: CONDUCTOR receives request                  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ STEP 2: Invoke planning-subagent                    │
│                                                     │
│ Prompt: "Research existing auth patterns,           │
│          OAuth libraries, integration points..."    │
│                                                     │
│ 🔍 planning-subagent [RUNNING]                      │
│    - Searching for auth-related files...            │
│    - Checking dependencies...                       │
│    - Analyzing API structure...                     │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ STEP 3: Planning returns findings                   │
│                                                     │
│ Findings:                                           │
│ - No existing auth (greenfield)                     │
│ - Express.js API detected                           │
│ - Recommend: passport.js + passport-oauth2          │
│ - Integration points: /routes/api/*                 │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ STEP 4: CONDUCTOR creates plan                      │
│                                                     │
│ Plan: OAuth Implementation                          │
│ ├── Phase 1: Install dependencies                   │
│ ├── Phase 2: Create auth middleware                 │
│ ├── Phase 3: Add OAuth routes                       │
│ └── Phase 4: Protect API endpoints                  │
│                                                     │
│ ⏸️ PAUSE: Waiting for user approval...              │
└─────────────────────────────────────────────────────┘
                         │
            User approves ✅
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ STEP 5: FOR EACH PHASE                              │
│                                                     │
│ ┌─ Phase 1 ───────────────────────────────────────┐ │
│ │ 💻 implement-subagent [RUNNING]                 │ │
│ │    - Creating tests first...                    │ │
│ │    - Installing passport.js...                  │ │
│ │    - Tests passing ✅                           │ │
│ └─────────────────────────────────────────────────┘ │
│                        │                            │
│                        ▼                            │
│ ┌─ Review Phase 1 ────────────────────────────────┐ │
│ │ ✅ review-subagent [COMPLETE]                   │ │
│ │    Status: APPROVED                             │ │
│ │    - Dependencies correctly installed           │ │
│ │    - Tests cover happy path                     │ │
│ └─────────────────────────────────────────────────┘ │
│                        │                            │
│ ⏸️ PAUSE: Ready to commit Phase 1                  │
│                        │                            │
│ [Repeat for Phase 2, 3, 4...]                       │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ STEP 6: COMPLETION                                  │
│                                                     │
│ ✅ All phases complete                              │
│ 📄 Documentation generated                          │
│ 🧪 All tests passing                                │
│                                                     │
│ Files created:                                      │
│ - /src/middleware/auth.js                           │
│ - /src/routes/oauth.js                              │
│ - /tests/auth.test.js                               │
└─────────────────────────────────────────────────────┘
```

---

## 10. Guía para Implementar en Tu Proyecto { #10-guia-para-implementar-en-tu-proyecto }

### 10.1 Paso 1: Crear Estructura de Carpetas

```bash
# Crear carpeta de agentes
mkdir -p .github/agents

# Crear carpeta para documentación de planes
mkdir -p .github/plans
```

### 10.2 Paso 2: Crear el Conductor

Crea `.github/agents/conductor.agent.md`:

```yaml
---
description: 'Orchestrates development workflow'
tools: ['agent', 'memory', 'todo', 'edit', 'search', 'read/readFile']
model: Claude Opus 4.5 (Preview)
---

# Development Conductor

You are a **CONDUCTOR AGENT** that orchestrates development tasks.

## Your Role
- Coordinate subagents for planning, implementation, and review
- Maintain state and document progress
- Enforce quality gates before commits

## Workflow
1. Invoke planning-subagent for research
2. Create implementation plan
3. Get user approval
4. For each phase:
   - Invoke implement-subagent
   - Invoke review-subagent
   - Checkpoint for commit
5. Document completion

## Critical Rules
- NEVER implement code directly
- ALWAYS use subagents for actual work
- ALWAYS pause for user approval at checkpoints
```

### 10.3 Paso 3: Crear Subagentes

**Planning Subagent** (`.github/agents/planning-subagent.agent.md`):

```yaml
---
description: 'Research and context gathering'
tools: ['search', 'usages', 'problems', 'changes', 'fetch']
model: Claude Sonnet 4.5
---

# Planning Subagent

You gather context and return structured findings.

## Your Role
- Research codebase
- Identify patterns and dependencies
- Return findings to Conductor

## Output Format
Return findings as:
- Relevant files
- Existing patterns
- Dependencies
- Recommendations
- Open questions
```

**Implement Subagent** (`.github/agents/implement-subagent.agent.md`):

```yaml
---
description: 'TDD-focused implementation'
tools: ['edit', 'search', 'read/readFile', 'execute/runInTerminal']
model: Claude Sonnet 4.5
---

# Implementation Subagent

You implement code following TDD.

## Workflow
1. Write failing tests (RED)
2. Write minimal code to pass (GREEN)
3. Refactor if needed (REFACTOR)

## Rules
- Tests first, always
- Minimal code to pass tests
- Report completion to Conductor
```

**Review Subagent** (`.github/agents/review-subagent.agent.md`):

```yaml
---
description: 'Code review and quality assurance'
tools: ['search', 'usages', 'problems', 'changes', 'testFailure']
model: Claude Sonnet 4.5
---

# Review Subagent

You review code for quality and standards.

## Review Criteria
- Tests exist and pass
- Code follows project patterns
- No security issues
- No performance issues

## Output
Return one of:
- APPROVED: Ready for commit
- NEEDS_REVISION: List specific issues
- FAILED: Requires user intervention
```

### 10.4 Paso 4: Configurar VS Code

Añade a `.vscode/settings.json`:

```json
{
  "chat.promptFiles": true,
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "chat.useAgentsMdFile": true
}
```

### 10.5 Paso 5: Usar la Orquestación

1. Abre VS Code Chat (Ctrl+Shift+I)
2. Selecciona "conductor" del dropdown de agentes
3. Escribe tu tarea:
   ```
   Add a user authentication system with JWT tokens
   ```
4. El conductor orquestará automáticamente los subagentes

---

## Resumen de Arquitectura

```
┌────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA MULTI-AGENTE                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   📁 .github/agents/                                           │
│   ├── conductor.agent.md      🎭 Orquestador principal         │
│   ├── planning-subagent.md    🔍 Investigación (solo lectura)  │
│   ├── implement-subagent.md   💻 Implementación (TDD)          │
│   └── review-subagent.md      ✅ Revisión (solo lectura)       │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   FLUJO: Planning → Plan → [Implement → Review]* → Complete    │
│                                                                │
│   TOOLS POR ROL:                                               │
│   • Conductor: agent, memory, todo, edit                       │
│   • Planning: search, usages, problems (READ-ONLY)             │
│   • Implement: edit, execute, build tools                      │
│   • Review: search, problems, testFailure (READ-ONLY)          │
│                                                                │
│   MODELOS:                                                     │
│   • Conductor: Opus 4.5 (decisiones complejas)                 │
│   • Subagentes: Sonnet 4.5 (tareas acotadas)                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Referencias

- [VS Code Custom Agents Documentation](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [GitHub Copilot Customization](https://code.visualstudio.com/docs/copilot/customization/overview)
- [MCP Developer Guide](https://code.visualstudio.com/docs/copilot/guides/mcp-developer-guide)
- [Chat Tools Documentation](https://code.visualstudio.com/docs/copilot/chat/chat-tools)

---

*Última actualización: Diciembre 2025*
