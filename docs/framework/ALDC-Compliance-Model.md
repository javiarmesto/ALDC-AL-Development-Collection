# ALDC Compliance Model v1.1

## Niveles de compliance

### ALDC Core v1.1

Cumple el backbone mínimo:
- Contratos por requerimiento en `.github/plans/` (3-file sets)
- Memory global (`memory.md`) acumulativo
- Flujo MEDIUM/HIGH: @AL Architecture & Design Specialist → al-spec.create → @AL Development Conductor(subagents) → HITL → entrega
- Flujo LOW: al-spec.create → @AL Implementation Specialist → entrega
- 4 agentes públicos + 3 subagents internos + 6 workflows + 7 skills requeridos + 9 instructions
- Templates inmutables (7)
- `aldc-validate` en verde

### ALDC Core + Tests

Incluye Core v1.1 + evidencia consistente de testing:
- `{req_name}.test-plan.md` ejecutable y mantenido
- Suite de tests alineada con escenarios mínimos
- TDD aplicado donde corresponda

### ALDC Core + Autónomo

Incluye Core v1.1 + operación multi-sesión/autónoma:
- `memory.md` actualizado sistemáticamente
- Interrupciones y gates HITL claros
- Seguridad operacional

### ALDC Core + Extensions

Incluye Core v1.1 + componentes opcionales, sin alterar contratos Core.

## Checklist Core v1.1

Requerido (todo debe cumplirse):

- [ ] Existe `aldc.yaml` y valida contra `docs/schema/aldc.schema.json`
- [ ] Existe `.github/plans/memory.md` (global)
- [ ] Cada requerimiento activo tiene set completo: `{req_name}.spec.md`, `.architecture.md`, `.test-plan.md`
- [ ] `memory.md` se actualiza en cada handoff significativo
- [ ] Existen las 7 plantillas inmutables en `docs/templates/` sin alteración
- [ ] Existen los 4 agentes Core bajo `toolkitRoot/agents/`
- [ ] Existen los 3 subagents en `toolkitRoot/agents/` (planning, implement, review — `user-invocable: false`)
- [ ] Existen los 6 workflows Core bajo `toolkitRoot/prompts/`
- [ ] Existen los 7 skills requeridos en `toolkitRoot/skills/`
- [ ] Existen las 9 instructions
- [ ] `.github/copilot-instructions.md` es coherente con source
- [ ] En MEDIUM/HIGH: se usa `al-conductor` con subagentes y gates HITL
- [ ] No se modifican objetos base (extensión-only)

## Qué rompe la conformidad

- Ausencia de `memory.md` global
- Modificar plantillas desde agentes/workflows
- Requirement set incompleto (falta 1-2 de 3 tipos en MEDIUM/HIGH)
- Nombres inconsistentes en requirement set
- Borrar o sobrescribir contenido de `memory.md`
- Falta de agentes/workflows/skills Core
- Implementar MEDIUM/HIGH sin arquitectura aprobada
- Saltarse gates HITL
- Modificar objetos base directamente
- Drift en copilot entrypoint (si política = error)

## Cómo se valida

- Local/CI: `node tools/aldc-validate/index.js --config aldc.yaml`
- Recomendado: GitHub Action `aldc-validate` en PR/push
