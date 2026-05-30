---
applyTo: "**/*.Codeunit.al"
description: "Guidelines for implementing event-driven patterns and extensibility in AL development"
---

# AL Events — Micro Rules

Reglas duras de eventos en codeunits. Patrones (integration events, handled, OnBefore/OnAfter) y ejemplos viven en `skill-events`.

1. **Nunca modificar objetos base de Business Central**. Toda extensión va por event subscriber o table/page extension.
2. **Event subscribers `local`**, con la **firma exacta** del evento publicado (tipos, `var`, orden). Una firma desalineada compila pero no engancha.
3. **Par OnBefore/OnAfter** alrededor de operaciones extensibles (`OnBeforeCreateX`/`OnAfterCreateX`), con `IsHandled` cuando el subscriber debe poder cortar el flujo por defecto.
4. **Prohibido `Commit` dentro de un event subscriber**. Rompe la transacción del publicador y deja datos inconsistentes.
5. **Codeunits que solo subscriben terminan en `Handler`** (`SalesPostingHandler`) y solo contienen subscribers — sin lógica de negocio propia.
