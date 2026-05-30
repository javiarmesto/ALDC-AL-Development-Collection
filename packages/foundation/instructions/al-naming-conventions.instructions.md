---
applyTo: "**/*.al"
description: "Comprehensive naming conventions for AL files, objects, variables, and functions"
---

# AL Naming Conventions — Micro Rules

Reglas duras de naming. La nomenclatura de ficheros es **infraestructura del framework**: los globs estrechos de otras instructions dependen de ella.

1. **PascalCase** en todo: nombres de objeto (table, page, codeunit, report…), variables, parámetros y procedures.
2. **Límite 30 caracteres** en el nombre del objeto; reservar 4 para prefijo/sufijo → **el nombre propio no excede 26 caracteres**. Nada de abreviaturas crípticas (`CustLE`, `SIPoster`).
3. **Nombre de fichero**: `<ObjectName>.<ObjectType>.al` (p.ej. `NoSeries.Table.al`, `SalesPosting.Codeunit.al`, `Customer.PageExt.al`). **Requisito**, no estilo: si el fichero no sigue el patrón, no carga sus instructions específicas de tipo.
4. **Interfaces** con prefijo `I` (`INoSeries`). **Implementaciones** con sufijo `Impl` (`NoSeriesImpl`). Mismo nombre raíz que la interfaz.
5. **Parámetros de event subscribers** descriptivos (`SalesHeader`, `Customer`), nunca genéricos (`Rec`, `xRec` salvo cuando la firma del evento lo exija).
