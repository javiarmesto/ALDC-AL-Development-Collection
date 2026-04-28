# ALDC × APM — Prompts de migración

Este directorio contiene los prompts versionados que orquestan la migración de ALDC a APM (Agent Package Manager) durante el Roadmap 2026. Cada prompt corresponde a una fase de la migración y está diseñado para ejecutarse en una sesión independiente de Claude Code.

## Filosofía

Los prompts viven en el repo, no en chats sueltos. Esto garantiza trazabilidad, reproducibilidad y permite retomar la migración tras un parón sin pérdida de contexto. Es coherente con los principios spec-driven y de decision records que defiende el propio framework.

## Estructura

- `phase-1-restructure.md` — Reestructuración interna del repo a `packages/*/`, sin tocar APM. Mantiene el VSIX intacto.
- `phase-2-manifests.md` — Introducción de manifiestos `apm.yml` en raíz y subpaquetes. Sin publicación pública.
- `phase-3-validation.md` — Validación end-to-end con instalación real vía `apm install` en entorno limpio.

## Cómo ejecutar cada fase

Cada prompt declara explícitamente desde qué rama debe lanzarse y qué entregables produce. La regla general es:

1. Asegurarse de que la fase anterior está mergeada en `main`.
2. Crear la rama indicada en el prompt partiendo de `main` fresca.
3. Abrir Claude Code en la raíz del repo, en esa rama.
4. Pegar el contenido del prompt correspondiente.
5. Validar los entregables antes de abrir PR.

## Principios aplicados en cada fase

Los tres prompts comparten cuatro principios no negociables, alineados con el decálogo de ALDC:

- **HITL gates**: pausas explícitas para validación humana antes de cambios estructurales.
- **Skills Evidencing**: cada output declara qué skills cargó y qué patrones aplicó.
- **Decision records**: las decisiones arquitectónicas relevantes quedan documentadas en `docs/decisions/`.
- **Coexistencia con VSIX**: el canal VSIX nunca se rompe; APM se añade como canal paralelo.

## Referencias

- Documentación oficial APM: https://microsoft.github.io/apm/
- Repositorio APM: https://github.com/microsoft/apm
- ROADMAP-2026.md