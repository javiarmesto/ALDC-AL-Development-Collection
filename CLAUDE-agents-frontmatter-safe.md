# Actualización SEGURA de frontmatter de agentes ALDC

Referencia: https://code.visualstudio.com/docs/copilot/customization/custom-agents

## REGLAS DE SEGURIDAD

- SOLO modificar los campos indicados en cada fix
- NO tocar: tools, model, description, name, handoffs (ya están correctos)
- NO modificar el body (contenido después del frontmatter ---)
- Si un campo no se menciona → NO TOCARLO
- Leer el fichero ANTES de editar, confirmar que el campo existe o no

## FIX 1 — Corregir typo: user-invokable → user-invocable

### En agents/

Buscar en TODOS los ficheros agents/*.agent.md la cadena:
```
user-invokable
```
Reemplazar por:
```
user-invocable
```

Resultado esperado:
- agents/al-implement-subagent.agent.md → CAMBIA (tiene el typo)
- agents/al-agent-builder.agent.md → CAMBIA (tiene el typo)
- agents/al-planning-subagent.agent.md → ya correcto, no cambia
- agents/al-review-subagent.agent.md → ya correcto, no cambia

### En docs/ e instructions/ (propagación del typo)

Los siguientes ficheros contienen `user-invokable` en texto descriptivo.
Buscar y reemplazar en CADA UNO:

- docs/framework/ALDC-Architecture-Diagrams.md → texto Mermaid `"Public Agents (user-invokable)"`
  reemplazar por `"Public Agents (user-invocable)"`
  
- docs/framework/ALDC-Core-Spec-v1.1.md → todas las apariciones de `user-invokable`
  reemplazar por `user-invocable`

- instructions/copilot-instructions.md → apariciones de `user-invokable`
  reemplazar por `user-invocable`

Solo cambiar esa palabra exacta. No tocar el valor (true/false) ni nada más.

## FIX 2 — Añadir disable-model-invocation en subagents

SOLO en estos 3 ficheros, AÑADIR una línea nueva en el frontmatter.
Ubicar la línea DESPUÉS de `user-invocable: false` (ya existente o recién corregido),
ANTES de `tools:`.

agents/al-implement-subagent.agent.md → añadir:
```yaml
disable-model-invocation: true
```

agents/al-planning-subagent.agent.md → añadir:
```yaml
disable-model-invocation: true
```

agents/al-review-subagent.agent.md → añadir:
```yaml
disable-model-invocation: true
```

NO añadir este campo en ningún otro agente.

## FIX 3 — agents: en al-conductor → YA EXISTE, NO TOCAR

El conductor ya tiene:
```yaml
agents: ['al-planning-subagent', 'al-review-subagent', 'al-implement-subagent']
```
No hacer nada aquí.

## FIX 4 — Handoffs → YA EXISTEN, NO TOCAR

Todos los agentes ya tienen handoffs correctos que referencian agentes reales:
- al-architect → 2 handoffs (al-conductor, al-developer) ✅
- al-conductor → 2 handoffs (al-architect, al-developer) ✅
- al-developer → 2 handoffs (al-architect, al-conductor) ✅
- al-presales → 3 handoffs (al-architect, al-spec.create, al-conductor) ✅
- al-planning-subagent → 1 handoff (al-conductor) ✅
- al-review-subagent → 1 handoff (al-conductor) ✅

No modificar ningún handoff.

## VERIFICACIÓN

1. grep -r "user-invokable" agents/ → DEBE ser 0 (typo eliminado en agents)
2. grep -r "user-invokable" docs/ instructions/ → DEBE ser 0 (typo eliminado en docs)
3. grep -r "user-invocable" agents/ → DEBE existir en subagents + agent-builder
4. grep -r "disable-model-invocation: true" agents/ → DEBE ser 3 (solo los 3 subagents)
5. grep -r "^agents:" agents/al-conductor.agent.md → DEBE existir (ya estaba)
6. Comparar ANTES y DESPUÉS de cada fichero — solo deben haber cambiado las líneas indicadas
7. NO debe haber cambiado nada en tools, model, description, name, handoffs

NO hagas commit. Muéstrame el diff de cada fichero.
