# aldc-verify: evidencia de compilación y analizadores para ALDC

[English](aldc-verify.md)

El plugin de ALDC para Claude Code no compila AL por sí mismo. Para la evidencia
de compilación y de analizadores se apoya en **aldc-verify**, un plugin de Claude
Code aparte:
[javiarmesto/aldc-verify-plugin](https://github.com/javiarmesto/aldc-verify-plugin).
Esta página explica qué obtiene ALDC de él, cómo instalarlo y qué pasa si no está.
Describe aldc-verify 0.3.0.

---

## Por qué un plugin aparte

Compilar AL bien da trabajo: encontrar el compilador en cada máquina, instalarlo
en las sesiones en la nube, filtrar la caché de símbolos por versión de Business
Central, compilar la App antes que el Test, poner en fila las compilaciones que
coinciden y decidir si un turno ha tocado AL o no. aldc-verify ya hace todo eso y
se prueba por su cuenta.

ALDC lo usa en lugar de duplicarlo. ALDC pone el método (roles, planes, revisión,
puntos de control); aldc-verify pone el resultado del compilador. Cada plugin se
puede actualizar sin tocar el otro.

## Qué obtiene ALDC

| Pieza | Qué aporta a una ejecución de ALDC |
| --- | --- |
| **L1, compilar** | Compila todos los proyectos AL del repo con el compilador real, en orden de dependencias (la App antes que el Test). |
| **L2, analizadores** | Pasa CodeCop, UICop y PerTenantExtensionCop por defecto, o los analizadores y el ruleset que configure el proyecto. Los warnings nunca bloquean; una regla subida a `Error`, sí. |
| **Gate de Stop / SubagentStop** | Cuando Claude, o un subagente que escribe código (`implement`, `developer`, `builder`), va a terminar un turno en el que ha cambiado AL, el gate compila. Si hay errores, lo devuelve a corregirlos, como mucho 3 veces, y después le deja parar con un resumen. Un turno que no ha tocado AL no se bloquea, aunque el árbol ya estuviera en rojo. |
| **Agente `al-build-validator`** | `aldc-verify:al-build-validator` compila y devuelve solo los diagnósticos, agrupados por causa y marcados como introducidos o previos. Es de solo lectura. El conductor de ALDC lo lanza tras cada fase de implementación y cita su resultado en el fichero phase-complete. |
| **`.claude/.aldc-verify/last-report.json`** | El detalle de la última compilación y de los analizadores. Es la evidencia de build que el conductor pasa al revisor. Los revisores de ALDC nunca compilan: citan los errores y warnings reales de este informe junto a BCQuality. Si el informe no existe o es anterior a los cambios, la revisión dice `build: not-run`. |
| **`/aldc-verify:al-go`** | La entrega: verifica, revisa con BCQuality si está instalado, hace el commit fichero a fichero, el push de una rama `claude/` y abre una pull request **en borrador**. Se para si el build es `not-run`. Nunca hace merge ni marca la PR como lista: eso lo hace una persona. |
| **Guard** | Un hook PreToolUse sobre Bash y PowerShell, activo en repos AL. Deniega `gh pr merge`, los push forzados y de borrado, el push a la rama por defecto (`main`, `master`, `dev`, `develop`), el `git add` masivo (`-A`, `.`, `--all`), `git commit -a` y el `git add` de las rutas de `guard.protectedPaths`. |
| **Overlay de SubagentStart** | Cuando arranca un subagente `aldc:*` en un repo AL, aldc-verify le añade unas líneas de contexto según su rol, sin cambiar el plugin de ALDC (ver abajo). |

### Qué se le dice a cada rol de ALDC

| Rol | Subagentes | Qué añade el overlay |
| --- | --- | --- |
| Escribir código | implement, developer, agent-builder | "Compila" se comprueba con `/aldc-verify:al-verify --l1` (o con `al-build-validator`) y se cita el resultado; nunca se afirma sin él. En TDD, RED es "el test compila y describe el comportamiento". Ejecutar tests necesita un sandbox de Business Central v28 o superior; sin él, los tests son `not-run`. |
| Revisar | review, dredd, triage | Citan los errores y warnings reales de `last-report.json` junto a BCQuality. Si no existe o es antiguo, escriben `build: not-run` y piden `al-build-validator`. La revisión sigue siendo de solo lectura. |
| Conductor | conductor | Valida cada fase con `al-build-validator`, pega el resultado en el fichero phase-complete y pasa `last-report.json` al revisor. Entrega con `/aldc-verify:al-go`. |
| Planificar | planning, architect, spec, presales | Incluyen en cada fase del plan la comprobación de "compila" con `/aldc-verify:al-verify`. |

## Instalar y actualizar

En tu máquina, una vez:

```bash
claude plugin marketplace add javiarmesto/aldc-verify-plugin
claude plugin install aldc-verify@aldc-verify-dev
```

Para pasar a una versión nueva, actualiza el marketplace y el plugin, y reinicia
Claude Code:

```bash
claude plugin marketplace update aldc-verify-dev
claude plugin update aldc-verify@aldc-verify-dev
```

`claude plugin list` muestra `aldc-verify@aldc-verify-dev` y su versión. Para las
sesiones en la nube, la configuración por repo y el workflow de CI, consulta el
[README de aldc-verify](https://github.com/javiarmesto/aldc-verify-plugin#readme).

## Si no está instalado

- **ALDC avisa al empezar la sesión.** En un proyecto AL o ALDC, el hook de inicio
  de sesión de ALDC muestra: *aldc-verify is not installed: ALDC has no
  compile/analyzer evidence for its phases.*
- **Las fases quedan como no verificadas.** El conductor registra el build de cada
  fase como `not-run` y los revisores escriben `build: not-run`. Nunca se da una
  fase por compilada sin un resultado del compilador.
- **No se bloquea nada.** ALDC funciona igual, con el build marcado como no
  verificado. No hay gate de compilación ni guard: son de aldc-verify.

Lo mismo pasa cuando aldc-verify está instalado pero no puede compilar (no hay
compilador o faltan símbolos): informa `not-run` y no bloquea.

## Quién hace qué

Cada plugin registra sus propios hooks y ninguno pisa al otro. Actúan en eventos
distintos o sobre herramientas distintas, así que no se solapan.

| Evento | ALDC (`aldc`) | aldc-verify |
| --- | --- | --- |
| SessionStart | Guía del proyecto, modo de autonomía, runner de tests, avisos (reglas sin inicializar, falta BCQuality o aldc-verify); precondición de BCQuality | Detecta el compilador AL en Windows y macOS; lo instala en Linux y en la nube |
| UserPromptSubmit | — | Guarda la huella del árbol al empezar cada turno |
| PreToolUse | `Agent`/`Task`: `agent-brief` (reglas AL, modo de autonomía, selección de BCQuality). Herramientas de lectura, búsqueda, edición y MCP: `flow-scout`. `SendMessage`: `send-guard` | `Bash`/`PowerShell`: el guard (merge, push forzado, rama por defecto, `git add` masivo, rutas protegidas) |
| PostToolUse | `Write`/`Edit`: `artifact-gate` (informes de revisión completos, suscriptores de eventos comentados) | — |
| SubagentStart | — | Overlay para los subagentes `aldc:*`: cómo verificar, según el rol |
| SubagentStop | — | Gate de compilación para los subagentes que escriben código |
| Stop | `stop-guard`: no se para con un plan sin terminar en modo pre-approved | Gate de compilación: no se para con errores AL introducidos en el turno |

Los dos plugins usan el evento Stop para preguntas distintas: ALDC pregunta si el
plan está terminado; aldc-verify, si el AL compila.

## Alcance

aldc-verify es un plugin de Claude Code, así que hoy solo da servicio a la
superficie de Claude Code de ALDC. Las demás superficies (GitHub Copilot en VS
Code, Copilot CLI y Codex) todavía no lo usan; su evidencia de build sale de sus
propias herramientas AL o queda como `not-run`.
