---
applyTo: "**/*.al"
description: "AL Code structure, formatting, and folder organization guidelines for AL development"
---

# AL Code Style — Micro Rules

Hard style rules. Depth and examples in `skill-pages` and other domain skills.

1. **Indentation**: 2 spaces. No tabs. No mixing.
2. **PascalCase** for variables, procedures and AL object names.
3. **Feature-based organization**, not by object type: `src/<Feature>/<SubFeature>/...`. Shared code in `Common/` or `Shared/`. Never `Tables/`, `Pages/`, `Codeunits/` folders.
4. **Focused procedures**: one procedure does one thing. If it exceeds ~40 lines or mixes validation + calculation + persistence, split it.
5. **Comments only when the why is not obvious**. XML doc (`/// <summary>`) is mandatory only on `public` procedures of codeunits exposed as APIs.
