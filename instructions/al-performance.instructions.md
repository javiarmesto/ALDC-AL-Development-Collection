---
applyTo: "**/*.Codeunit.al, **/*.Query.al"
description: "Performance optimization guidelines and best practices for AL development"
---

# AL Performance — Micro Rules

Reglas duras red-de-seguridad. Patrones, triage de AL0896 y ejemplos viven en `skill-performance`.

1. **`SetRange`/`SetFilter` antes de `Find`/`FindSet`/`FindFirst`**. Filtrar pronto, no procesar y filtrar después.
2. **`SetLoadFields` antes de `Get`/`Find`** cuando solo se usan algunas columnas. El orden importa: `SetLoadFields` → `SetRange` → `Find`.
3. **`CalcSums` en lugar de bucles de acumulación**. Si necesitas un total, no itera y suma — usa la agregación de la plataforma.
4. **Nada de llamadas a base de datos dentro de bucles** (`Get`, `FindFirst`, `CalcFields` por registro). Precarga en `Dictionary`/`temporary` o usa `SetAutoCalcFields` antes del bucle.
5. **Una sola escritura por registro modificado**: calcula todos los cambios en memoria y emite un único `Modify(true)`.
