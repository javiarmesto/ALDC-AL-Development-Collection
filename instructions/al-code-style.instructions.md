---
applyTo: "**/*.al"
description: "AL Code structure, formatting, and folder organization guidelines for AL development"
---

# AL Code Style — Micro Rules

Reglas duras de estilo. Profundidad y ejemplos en `skill-pages` y demás skills de dominio.

1. **Indentación**: 2 espacios. Sin tabuladores. Sin mezcla.
2. **PascalCase** para variables, procedures y nombres de objeto AL.
3. **Organización por feature**, no por tipo de objeto: `src/<Feature>/<SubFeature>/...`. Compartido en `Common/` o `Shared/`. Nunca carpetas `Tables/`, `Pages/`, `Codeunits/`.
4. **Procedures focalizadas**: una procedure hace una cosa. Si supera ~40 líneas o mezcla validación + cálculo + persistencia, divídela.
5. **Comentarios solo cuando el porqué no es obvio**. XML doc (`/// <summary>`) es obligatoria solo en procedures `public` de codeunits expuestos como API.
