# ALDC — Revisión crítica del framework (junio 2026)

> **Alcance**: auditoría independiente del repositorio completo en `main` (v4.1.0, commit `debe516`),
> el sitio público (fuente MkDocs), el changelog y el roadmap 2026.
> **Método**: lectura de la spec normativa, los 10 agentes, muestreo de skills (api, testing,
> performance), CI/workflows, scripts de validación, plugin de Claude Code y manifiestos de
> distribución. Toda afirmación cuantitativa fue verificada contra el árbol de ficheros.

---

## Veredicto general

ALDC tiene un diseño conceptual muy por encima de la media del ecosistema BC — la separación
architect/conductor/developer/presales, el ciclo TDD con subagentes y la capa BCQuality citable
son ideas serias — pero su **disciplina operativa no está a la altura de su propia propuesta de
valor**. El framework vende "spec-driven development" y no cumple su propia spec. Esa es la
crítica central, y es reparable.

| Categoría | Nota | Resumen |
|---|---|---|
| Conocimiento de dominio (skills) | **A-** | Patrones BC genuinos y correctos; cobertura selectiva |
| Diseño de orquestación (agentes) | **B** | Separación de responsabilidades clara; spec incompleta; agentes pesados |
| Conformidad con la spec | **D** | Spec v1.1 declara 4+3 agentes; el repo tiene 10. CLAUDE.md se contradice |
| Estructura / duplicación | **D** | 3-4 árboles paralelos sin sincronización automática |
| Tooling / CI | **C** | Valida existencia, no conformidad ni referencias cruzadas |
| Paridad multi-plataforma | **D** | Port manual Copilot↔Claude Code; conductor divergido 38%; modelo degradado a `haiku` |
| Distribución | **B-** | npm/manifest bien definidos; sin publicación en registry ni marketplace |
| Evidencia de eficacia | **F** | Ninguna eval; la afirmación "passes review the first time" no tiene respaldo |

---

## 1. Puntos fuertes

1. **Conocimiento de dominio real, no relleno.** `skill-api`, `skill-testing` y
   `skill-performance` contienen patrones BC genuinos con ejemplos concretos y pares
   anti-patrón/correcto: orden de `SetLoadFields` antes de `FindSet`, `CalcSums` vs acumulación
   en bucle, `ODataKeyFields = SystemId`, builders fluidos de datos de test. Es lo más difícil
   de falsificar de un framework y ALDC lo tiene.

2. **Arquitectura de orquestación sólida.** El conductor con 3 subagentes
   (planning → implement con tests-first → review), gates HITL por fase y artefactos trazables
   en `.github/plans/{req}/` es el modelo correcto para AL, donde el coste de un error en
   producción es alto. La separación `al-triage` (reactivo) vs `dredd` (auditor estático,
   read-only) está bien delimitada por disparador.

3. **BCQuality como capa de evidencia citable** — findings que citan ficheros reales, fallback
   nativo cuando está ausente, y validación de coherencia de pin en CI
   (`bcquality-evidence.yaml`). Es la idea más original del proyecto y la más diferenciadora:
   nadie más en el ecosistema BC hace reviews con citas verificables.

4. **Conciencia de tokens.** El trabajo de 4.1.0 (entrypoint −31%, globs `applyTo` estrechos por
   tipo de objeto, contexto curado a subagentes en lugar de ficheros completos) demuestra
   comprensión del coste real de operar agentes. La mayoría de frameworks lo ignoran.

5. **Gobernanza inusualmente madura para un proyecto personal**: spec normativa con RFC 2119,
   ADRs (`docs/decisions/`), manifiesto, modelo de compliance, roadmap público, changelog
   disciplinado y sitio MkDocs bilingüe cuidado.

---

## 2. Puntos débiles (con evidencia)

### 2.1 El framework viola su propia spec — crítico para la credibilidad

- `docs/framework/ALDC-Core-Spec-v1.1.md` declara **4 agentes públicos + 3 subagentes**.
  El repo contiene **10** ficheros `*.agent.md` en `agents/`: los 7 declarados más `al-triage`,
  `dredd` y `al-agent-builder`, que **no existen en el documento normativo**.
- `aldc.yaml` lista `dredd` como *required* — un agente requerido que la norma no define.
- `CLAUDE.md` se contradice a sí mismo: la cabecera dice "**9** instructions" y el pie de página
  dice "**7** instructions" (el conteo real es 9).
- Hay **16** directorios de skill en `skills/` frente a las **11** declaradas en spec, CLAUDE.md
  y la web; y **11** prompts frente a los **6** workflows declarados (los 5 extra son del pack
  agent-builder, no normalizados).

Para un framework cuyo eslogan es *"less vibe coding, more traceable implementation"*, esta es
la grieta más visible ante cualquier evaluador escéptico.

### 2.2 Duplicación de árboles sin sincronización automática

| Árbol | Estado | Evidencia |
|---|---|---|
| `agents/` ↔ `packages/foundation/agents/` | Idénticos **hoy**, por disciplina manual | `diff` sin diferencias (conductor: 705 líneas en ambos) |
| `agents/` ↔ `claude-plugin/agents/` | **Divergidos** | conductor 705 → 972 líneas (+38%), herramientas reescritas a mano (VS Code → genéricas), `model: haiku` |
| `instructions/` ↔ `docs/instructions/` | Formato distinto | operacional (frontmatter `applyTo`) vs artefacto de documentación (3-5× más largo) |

No existe ningún script de build ni check de CI que detecte drift entre árboles. Un cambio en un
agente requiere 3-4 ediciones manuales.

### 2.3 El CI valida existencia, no conformidad

`scripts/validate-al-collection.js` comprueba que los ficheros del manifest existen y que el
frontmatter YAML parsea. **No** comprueba: contadores spec↔realidad, referencias cruzadas
agente→skill, `@import` y enlaces internos rotos, sincronía entre árboles, ni esquema de
frontmatter. Los problemas de 2.1 y 2.2 son exactamente los que ese CI debería cazar.

### 2.4 Fuga de nombres de proyectos cliente

`skills/skill-manifest/examples/extension-manifest/` contiene `sample-manifest-circe-only.md` y
`sample-manifest-delfos-only.md` con contenido que proviene de proyectos reales (CIRCE, DELFOS),
duplicados además en `packages/foundation/.../examples/` y `.../samples/`. En un repo MIT
público es poco profesional y conviene genericizarlo de inmediato.

### 2.5 Versionado confuso

Conviven "ALDC **4.1.0**" (producto, package.json y web), "Core Spec **v1.1**" (norma) y un
roadmap con el hito "zero-drift" prometido para **2026-04** que sigue pendiente en junio. Un
recién llegado no puede saber qué versión significa qué.

### 2.6 Sin evidencia medible de eficacia

No existe ningún harness de evaluación: ninguna tarea dorada que demuestre que conductor+spec
produce mejor AL que un prompt directo. La web afirma *"AL code that passes review the first
time"* — la afirmación más fuerte del sitio y la menos respaldada.

### 2.7 Peso de los agentes estrella

Conductor 705-972 líneas, presales 878. Para un framework que presume de eficiencia de tokens,
los dos agentes más usados son muy pesados; plantillas y tablas de formato podrían moverse a
referencias cargadas JIT (el patrón que ya usan las skills con `references/`).

### 2.8 Degradación de modelo sin explicación

Los agentes del plugin de Claude Code declaran `model: haiku` mientras sus equivalentes Copilot
declaran Claude Sonnet 4.6. Si es una decisión de coste, debe documentarse; si es un descuido,
penaliza gravemente al usuario del plugin en el agente más complejo (el conductor).

---

## 3. Mejoras concretas (por prioridad)

1. **Una sola fuente de verdad + build.** Elegir el árbol canónico (sugerencia:
   `packages/foundation/`) y **generar** el resto — plugin de Claude incluido — con un script de
   build que use una tabla de mapeo de herramientas VS Code ↔ Claude Code. Eliminar las copias
   del control de versiones o marcarlas como generadas.
2. **CI de conformidad** (≈1 día de trabajo, elimina categorías enteras de problemas):
   contadores spec/CLAUDE.md/aldc.yaml/web coinciden; referencias agente→skill resuelven;
   `@import` y enlaces internos válidos; frontmatter contra esquema JSON; árboles generados sin
   drift.
3. **Spec v1.2** que normalice `dredd`, `al-triage` y `al-agent-builder` (p. ej. como tiers
   "on-demand" y "extensión") y corrección del `CLAUDE.md`.
4. **Limpiar CIRCE/DELFOS** de todos los ejemplos (4+ ubicaciones por la duplicación de árboles).
5. **Evals**: 3-5 requerimientos de ejemplo (LOW/MEDIUM) con resultado esperado, ejecutados
   periódicamente, con métricas publicadas (¿compila?, ¿pasan los tests?, ¿tokens consumidos?).
   El "reproducible example" de la web es el embrión.
6. **Explicar o corregir** el `model: haiku` del plugin.

---

## 4. Roadmap sugerido

El `ROADMAP-2026.md` existente apunta bien pero va con retraso sobre sí mismo (zero-drift era
abril). Reordenación propuesta:

- **Q3 2026 — Consolidación (bloquea todo lo demás):** fuente única + build, CI de conformidad,
  spec v1.2, limpieza de ejemplos, unificación de versionado. Es el hito "zero-drift" pendiente.
- **Q3-Q4 2026 — Evidencia:** harness de evals con métricas publicadas; un caso de estudio E2E
  real (MEDIUM) con números de tokens y tiempo. Para Directions EMEA esto vale más que cualquier
  feature nueva.
- **Q4 2026 — Distribución:** publicación real en npm registry y en el marketplace de plugins de
  Claude Code (hoy la instalación es esencialmente "clona el repo"). El split core/extensions ya
  planificado encaja aquí.
- **2027 — Cerrar el bucle con el compilador:** que el ciclo TDD del conductor compile y ejecute
  tests AL de verdad (contenedor BC o compilador AL en CI), de modo que "review passed"
  signifique "compila y los tests pasan", no "un LLM lo leyó". Ahí ALDC dejaría de ser una
  colección de prompts y sería una plataforma.

---

## Conclusión

Diseño y conocimiento de dominio: **nivel A**. Ejecución operativa (sincronía, conformidad,
evidencia): **nivel C-D**, y es lo primero que verá un evaluador escéptico. La buena noticia:
todo lo débil es automatizable y barato de arreglar, y lo fuerte — el conocimiento BC y la
arquitectura de orquestación — es justo lo difícil de copiar.
