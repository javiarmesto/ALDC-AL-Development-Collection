---
applyTo: "**/*.Codeunit.al"
description: "AL Error handling patterns, debugging techniques, and troubleshooting guidelines for AL development"
---

# AL Error Handling — Micro Rules

Reglas duras de gestión de errores en codeunits. Profundidad, patrones y ejemplos en `skill-debug` y skills relacionadas.

1. **TryFunction obligatoria** cuando la operación puede fallar por causa externa (servicios HTTP, parsing, llamadas a otra app) o necesita rollback. Recupera el texto con `GetLastErrorText()`.
2. **Toda cadena de error/warning/mensaje al usuario va en un `Label`** con `Comment` para traductores. Nada de literales `Error('...')` o `Message('...')` en línea.
3. **Labels técnicos** (telemetría, claves, identificadores no traducibles): `Locked = true`.
4. **Telemetría custom** (`Session.LogMessage`) **solo si el usuario la pide explícitamente**. No la añadas por iniciativa propia.
5. **Nunca silencies un error**. Un `if not TryX() then exit;` sin loggear ni propagar es bug.
