---
applyTo: "**/test/**/*.al"
description: "AL Testing & Project Structure Rules - Ensure proper project organization and test implementation"
---

# AL Testing — Micro Rules

Reglas duras para ficheros de test. Patrones de test (given/when/then, libraries, asserts) y ejemplos en `skill-testing`.

1. **No generes tests salvo que se pidan explícitamente** ("create tests for…", "add test coverage", "write unit tests…"). Por defecto, foco en la App.
2. **Separación AL-Go estricta**: tests solo en el proyecto `Test/`, nunca en `App/`. El `app.json` de Test depende del de App; el de App **no** depende de Test.
3. **Estructura de Test/ refleja la de App/**: si `App/src/Sales/Invoice/...` existe, los tests viven en `Test/src/Sales/Invoice/...`. Helpers compartidos en `Test/src/Common/`.
4. **Codeunit con `Subtype = Test`** y dependencias estándar: `Codeunit Assert`, `Library - <Module>` (Sales, Inventory, ERM, Random). Usa esas libraries para crear datos y postear documentos — no construyas registros a mano.
5. **Nombres de test method en patrón Given/When/Then**: `GivenX_WhenY_ThenZ`. Cada test cierra con uno o más `Assert.*` explícitos.
