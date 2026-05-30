---
applyTo: "**/*.al"
description: "AL Core principles — transversal rules for Microsoft Dynamics 365 Business Central development"
---

# AL Core Principles

Principios transversales del framework. Las reglas concretas de estilo, naming, performance, errores, eventos y testing viven en sus propias micro-instructions.

1. **Modelo event-driven**. Nunca modificar objetos base de Business Central; extender vía event subscribers o table/page extensions.
2. **Foco en la App por defecto**. Implementación principal en `App/`; los tests **solo se generan si el usuario los pide explícitamente**.
3. **Separación AL-Go App/Test**. El proyecto `Test/` depende de `App/`; nunca al revés. No mezclar lógica de aplicación con tests.
4. **Naming es infraestructura**. El patrón `<ObjectName>.<ObjectType>.al` no es estético: los globs estrechos de otras instructions dependen de él. Un fichero mal nombrado queda sin sus reglas.
