# Continuación de ALDC canónico

Entrega activa: handoff 02, entrega 1 de empaquetado. Fecha: 2026-09-14.
Handoff 01 integrado: PR #97, merge `2f7f31a42ba8fe93eaeb8309ba582745a5ccb527`.
Su rama se retiró tras comprobar integración; main y sus checks quedaron correctos.
El usuario autorizó continuar handoff 02. Doctor y Spec corresponden a las siguientes
entregas y no se implementan en este incremento.

## Base y revisión

- Canónico: `javiarmesto/ALDC-AL-Development-Collection`.
- Main inicial: `c8cb3c078f10a993194c0807329faecadfc60466`.
- Head inicial #97: `3a35dc5c2940d14f3113bdf02f22db1e9f86d791`.
- Se comprobó que #97 estaba abierta, draft y era la única PR abierta del
  canónico. Sin revisiones ni hilos bloqueantes. Se leyeron cuerpo y comentarios,
  los 122 archivos de la lista completa (páginas de 100 y 22), diff de fuentes,
  instalador, proyector, generadores y workflows. No hay AGENTS.md en este árbol.
- Se conserva la misma rama, sin rebase ni restauración de snapshots.
- El commit de integración, checks finales y estado de la rama se consultan en
  [PR #97](https://github.com/javiarmesto/ALDC-AL-Development-Collection/pull/97).
  La integración queda condicionada a los checks del head corregido; la rama
  solo se retira tras comprobar que ese head es ancestro de main.

## Correcciones de esta revisión

1. `scripts/native-profile.js` rechazaba frontmatter CRLF. Se reprodujo el fallo
   con el Conductor y se corrigió normalizando solo para la proyección y
   restaurando el final de línea original. Se conserva el cuerpo completo.
2. El generador CLI dejaba `TodoWrite` sin traducir cuando no llevaba backticks.
   Se corrigió en el generador y se regeneró el comando de memoria.
3. Las instrucciones instaladas y la ayuda mezclaban recuentos antiguos; se
   ajustaron al inventario, al orden arquitectura → spec para MEDIUM/HIGH y al
   carácter opcional de BCQuality. Foundation se regeneró desde la fuente.
4. La revisión automática Copilot revisó 126/126 archivos. Se corrigieron sus
   hallazgos de payload npm, mínimo Node, ramas de despliegue del build nativo,
   operaciones ficticias de setup/contexto/perfilado y enlaces de reglas CLI.
   `test:package` valida el archivo npm local extraído con dependencias del
   lockfile, sin publicación; se añadió este gate al workflow de validación.
5. Las guías separan main canónico de la rama de la extensión y explican las
   sobrescrituras reales. No se presenta vuelta de perfil como restauración.

## Comprobaciones ejecutadas y límites

Linux, Node `v24.19.0`. `npm ci --no-audit --no-fund` terminó correctamente con el
lockfile existente; el intento offline previo falló por falta de caché js-yaml.
No se cambiaron versiones de dependencias. Se alineó `engines.node` a `>=20.0.0`
en package.json y lockfile, junto al README; Node 14 deja de ser un mínimo anunciado.

| Comprobación | Resultado local |
| --- | --- |
| `npm run validate` | 0 errores de colección, 77 avisos preexistentes; 214 comprobaciones de perfil y 210 de empaquetado CLI |
| `node scripts/check-conformance.js` | 57 comprobaciones superadas |
| `node scripts/sync-foundation.js --check` | 71 archivos consistentes |
| `node scripts/sync-claude-workspace.js --check` | 40 archivos consistentes |
| `node scripts/sync-copilot-cli.js --check` | 52 archivos consistentes, sin drift |
| `git diff --check` | Correcto |
| `npm run test:package` | Archivo npm local extraído y validado offline: 214 checks de perfil y 210 CLI; dependencias instaladas desde lockfile |

Las instalaciones se ejecutaron únicamente en fixtures temporales: BC28 por
omisión, BC29 nuevo, rechazo de mezcla sin force, actualización sin perfil,
retorno a BC28, destino alternativo e instalación desde fuentes CRLF. Se verificó
la conservación de memoria, manifest de App/Test, fuentes AL y settings de VS Code.

| Operación | Personalizaciones de toolkit/configuración |
| --- | --- |
| `install --yes` sin force, mismo perfil | Conserva archivos existentes porque los omite; no es una actualización completa |
| `install --force --yes` | Sobrescribe `aldc.yaml`, `aldc.code-workspace`, entrada Copilot e instrucciones; requiere copia/revisión previa |
| Cambio/retorno de perfil con force | Cambia contratos; conserva memoria y proyecto AL, pero no restaura personalizaciones sobrescritas |

CRLF se probó sobre Linux, no en una sesión Windows. No están disponibles Claude,
Copilot CLI ni VS Code ejecutable; el comando `code` es un wrapper que indica que
no está instalado. No se verificaron descubrimiento/carga real de roles, lectura
por el modelo, compilación App/Test ni runner BC. Architect y Conductor largos
siguen pendientes de carga completa por host; no se han recortado. Se comprobaron
permisos/referencias estáticamente, sin afirmar operación nativa observada.

La observación sobre `Write` → `edit` se evaluó contra la
[tabla oficial de alias](https://docs.github.com/en/copilot/reference/custom-agents-configuration#tool-aliases):
Write es alias de edit. Claude Write y Bash ya permiten sobrescribir archivos;
no existía una barrera de rutas que la conversión pudiera conservar. Se mantiene
la responsabilidad de Dredd/Triage de escribir solo sus informes y se documenta
que los permisos del host son necesarios: no se promete sandbox por rol. No se
rediseñan sus responsabilidades ni se introducen herramientas ficticias.

No se ejecutó `test-local-install.js`: depende del checkout de la extensión y
prepara su paquete. La PR externa
[aldc-vscode-extension #1](https://github.com/javiarmesto/aldc-vscode-extension/pull/1)
seguía abierta en `adb0f26a5008d127c14c05938fb8723a244900b2` al consultar; queda
fuera de esta autorización. No hay release, tag, publicación ni despliegue BC.

Automatizaciones: el workflow de documentación está activo y un merge a main
activa su publicación habitual en GitHub Pages. El linter versionado usa fix y
puede escribir en PRs no draft, pero su estado remoto consultado fue
`disabled_manually`; no se reactivó ni modificó esa configuración. Release solo
se dispara por tag o ejecución manual. Branch main figura sin protección y no
hay rulesets; el endpoint administrativo de protección devuelve 403, sin intentar
cambiar protecciones. Los validadores aplicables se respetan igualmente.

## Delta concreto para la siguiente entrega de empaquetado

Fuente de consulta: [EXTRACTION.md](https://github.com/javiarmesto/ALDC-Research-Lab/blob/0f49d44a99f626a5e8a88d316b7041bfbc6860fb/research/canonical-reuse-001/EXTRACTION.md)
y `donors.json` en el mismo SHA. Lab se consultó, no se modificó.

Ya existe: selección BC28/BC29 en Chat, contratos terminales, plugin Claude,
CLI separado con diez agentes/diez comandos, modelos por superficie, traducción
de reglas, referencias empaquetadas y los tres generadores con checks de drift.
No hace falta copiar otros generadores ni las primitivas de Graph para repetirlo.

1. **Procedencia e inicialización:** comparar `scripts/sync.mjs`,
   `provenance.json`, `scripts/init.mjs` y `hooks/session-context.mjs` de
   `plugins/claude-code/aldc-graph/` en Lab `b2ce9d9f137fc92574261317294ca2d585beb74b`.
   Añadir solo procedencia/hash y contexto inicial útil a los mecanismos actuales.
   Contrastar `build_copilot_commands.py` con el generador CLI existente sin
   introducir uno paralelo.
2. **Instalación segura y recuperación:** adaptar lo necesario del motor y tests
   `experiments/chat-install-001/` en `0c2a14731507c24782718cc739c74676b3528f17`.
   Faltan detección de colisiones/drift del consumidor y backup/restauración cuando
   se prometan. La escritura atómica por archivo no garantiza rollback global.
3. **Codex canónico:** adaptar `plugins/codex/aldc-graph/skills/aldc-graph/`
   (`install_runtime.py`, locks y bloque gestionado) del mismo donante `b2ce9d9`.
   Regenerar roles desde canónico y excluir overlay/runtime Graph. Recuperar
   `run_python.ps1` solo si este adaptador necesita Python, sin instalarlo ni
   cambiar PATH. #97 no añade compatibilidad Codex.
4. **Prueba por host:** verificar carga completa y procedencia de roles/comandos,
   actualización con memoria/personalizaciones y ausencia de duplicados en
   proyectos aislados. Revisar después la PR externa del VSIX si se autoriza;
   regenerar sus plantillas desde el main integrado. No publicar como parte de
   estas pruebas ni certificar hosts por contar archivos.

No copiar DAG, Evidence Store, Context Envelope, fingerprints por transición,
Run Health Graph ni runtime completo. Doctor y Spec Agent siguen fuera de #97.


## Handoff 02 — entrega 1 implementada

Base: main `2f7f31a42ba8fe93eaeb8309ba582745a5ccb527`, sin PR abiertas al comenzar.
Rama única: `feat/canonical-plugin-packaging`, [PR #100](https://github.com/javiarmesto/ALDC-AL-Development-Collection/pull/100). Se preserva el main integrado y no
se reabre #97. Lab y PR externa del VSIX se mantienen sin cambios.

- Motor común de planificación, recibos/hash, colisiones visibles y backup/rollback
  usado por el instalador Chat existente y la inicialización de los tres terminales.
  Los archivos gestionados intactos se actualizan. La memoria y las personalizaciones
  se conservan; force reemplaza con respaldo. No se instalan dependencias como
  efecto del inicializador. Verificación de drift y recuperación tienen comandos.
- Procedencia de fuentes y payload en los paquetes Claude, CLI y Codex, con SHA-256
  y normalización LF/CRLF limitada. Se amplía el generador CLI existente. Plantillas
  usadas por workflows incluidas; no se copia otro generador Python.
- Claude inicializa reglas y bloque propio en CLAUDE.md; SessionStart aporta contexto
  de ruta solo en proyectos AL y no escribe. No se copian hooks a otros hosts.
- Codex regenera diez perfiles TOML y un skill ALDC con referencias de roles,
  workflows, reglas y dominio. Bootstrap con AGENTS.override.md/AGENTS.md y memoria;
  conserva modelo, razonamiento, permisos, sandbox y MCP del padre. Sin overlay,
  runtime ni identidad Graph. Las referencias de dominio no se registran como
  skills duplicados. La conversión a GUIDE.md se limita a referencias empaquetadas;
la creación de nuevas skills sigue usando SKILL.md. No se registra Marketplace ni se instala en esta sesión.

Comprobaciones locales: 214 checks de perfil, 226 de empaquetado CLI, 15 pruebas
conductuales de instalación/recuperación, 57 de conformance y 71 archivos Foundation.
Se probó fallo parcial con restauración de archivos y recibo, incluida interrupción
durante el propio rollback y recuperación posterior; rollback encadenado,
memoria editada, colisiones persistentes, backup corrupto, lock activo, symlink,
contenido manipulado y fuentes CRLF. TOML analizado con Python stdlib: diez perfiles
con cuerpo completo y un único SKILL.md descubrible. Validadores plugin/skill pasan.
El archivo npm se extrajo y pasó validate offline con sus propios contenidos.
Claude mirror y los generadores quedan sincronizados. CI y revisión remota se
consultan en la PR de esta rama antes de integrar.

Límites: sin ejecutables utilizables VS Code, Claude, Copilot CLI o Codex. Sin
carga real certificada ni compilación App/Test, ejecución funcional o despliegue BC.
Conductor/Architect completos permanecen por encima de 29k caracteres; no se
recortan para pasar una comprobación estática. Recuperación comprobada en Linux;
Windows y los hosts reales quedan pendientes. No se promete durabilidad ante
apagón ni protección contra edición concurrente adversaria.

Procedencia exacta y transformaciones: [plugin-packaging.md](../plugin-packaging.md).
Se leyeron el motor y ambas suites del donante Chat antes de adaptarlo. Las suites
Graph del donante se analizaron como evidencia, no se ejecutaron ni trasladaron.

**Delta de empaquetado restante:** comprobar descubrimiento/carga completa de
roles y reglas por host, recarga de caché sin duplicados y actualización/rollback
real en Windows. Resolver solo fallos observados en cada superficie. Coordinar el
VSIX externo para regenerar desde main cuando proceda. El siguiente incremento
implementable es Doctor canónico; después Spec Agent y sus adaptadores.


Revisión remota #100: Copilot revisó 120/157 archivos del head inicial y emitió
COMMENTED con cambios recomendados (tres hilos y dos comentarios suprimidos).
Se corrigen los cinco: comparación de rutas Windows sin distinción de mayúsculas,
verbos legibles en Codex, memoria Core v1.2 desde la plantilla raíz, hook silencioso
en proyectos con solo .github/plans o app.json ajeno a AL, y ejemplos de instrucciones
recuperados de la fuente canónica. Pruebas de rutas Windows son análisis de rutas
sobre Linux, no ejecución Windows. Las correcciones y sus derivados se validan
antes de resolver hilos; no se presenta la revisión del head inicial como una
aprobación automática del head corregido.

## Handoff 02 — entrega 2: Doctor canónico

Base integrada comprobada: main `ee4cd420ba0a2aba84fd3b826cd127382a2ea070`
(#100), sin PR abiertas al empezar. Rama única `feat/canonical-doctor`,
[PR #101](https://github.com/javiarmesto/ALDC-AL-Development-Collection/pull/101).

- Doctor local stdlib Python 3.9+, de solo lectura: especificar, compilar App,
  compilar Test y ejecutar tests tienen estado, rutas, problema y acción propios.
  Configuración válida con runtime desconocido no bloquea globalmente ni pasa
  pruebas. Proveedor nativo suficiente no exige servidor comunitario redundante.
- Descubrimiento App/Test acotado y configuración AL-Go explícita; reconoce BC28
  y BC29 sin inferir el runtime del perfil instalado. Fuentes anteriores sin
  Spec Agent siguen válidas. Cada host selecciona su layout canónico/plugin.
- Observaciones opcionales del host conservan descubierto/cargado/ejecutado/
  verificado por separado y se etiquetan como reportadas. Validación de alcance
  workspace/host/manifiestos; no autentica ni certifica frescura. No se crea otro
  sistema de estado. Compilar no demuestra tests ni cobertura funcional.
- Instalador Chat incorpora Doctor en su transacción y rollback. Generadores
  existentes empaquetan las mismas fuentes en Claude, CLI y Codex; bootstrap
  Codex incluye el script en el skill local. Guía de uso, hashes y archivo npm
  actualizados conjuntamente. Sin instalación automática de Python ni comandos
  ejecutados por Doctor.

Procedencia y transformaciones en [README de Doctor](../../tools/context-doctor/README.md):
Doctor v0.1.6 y solo descubrimiento de workspace_fingerprint del Lab
`b2ce9d9f137fc92574261317294ca2d585beb74b`; semántica práctica candidata de
`7c8ec39e37c0eb1fc8f8e9ad0cf0a08b6aa8421d`. Excluidos Graph, hashes de transición,
Run Health y probes que ejecutan comandos.

Verificación: 19 fixtures conductuales (anterior/nuevo, BC29 sin comunitario,
App/Test, runner ausente, fallos de ejecución, configuración rota y aislamiento,
MCP opcional roto con alternativa nativa suficiente,
AL-Go, JSONC/BOM, rutas/symlinks, observaciones contradictorias y lectura sin
efectos). Se ejecutan los paquetes reales de las cuatro superficies, instalación
Chat/rollback y bootstrap Codex en directorios aislados. CI incorpora la suite.
Además pasan validate, perfiles, recuperación, generación y archivo npm offline.
La revisión remota y las comprobaciones del head se consultan antes del merge.

Límites: inspección básica de configuración JSON/manifiestos, sin validar el
esquema completo AL ni configuraciones arbitrarias de proveedores, YAML o TOML
del host. Sin carga real de hosts ni compilación/ejecución BC observadas. Las
pruebas son Linux; Windows/Python fuera de PATH siguen pendientes en host real.

**Siguiente entrega:** Spec Agent y contrato compartido con al-spec.create;
actualizar Doctor y adaptadores en esa misma PR. **Delta de empaquetado:** carga
completa y recarga sin duplicados en los cuatro hosts, recuperación Windows real
y regeneración del VSIX externo desde main cuando proceda. No hay release,
paquete publicado, Marketplace ni despliegue Business Central en esta entrega.

Revisión remota #101: Copilot revisa 24/24 archivos del head inicial y emite
COMMENTED con cambios recomendados. Se atienden el hilo de detección del perfil
Chat en destino personalizado y los dos comentarios suprimidos de documentación:
ejemplos Chat acotados al checkout y suite de aceptación marcada solo checkout/CI.
La regresión usa el instalador real con .copilot y perfil bc29-native, después
corrompe el tipo del perfil y exige diagnóstico de esa ruta sin traceback.
También se corrige MCP opcional para no bloquear una alternativa nativa suficiente
y se ajustan acciones para no repetir descubrimiento o ejecución ya observados.
Fuentes y derivados se validan juntos antes de resolver el hilo. La revisión del
head inicial no se presenta como aprobación automática del head corregido.


## Handoff 02 — entrega 3: Spec Agent canónico

Base main `29fb7b989df050ed356f5847c53e06fe14d4fb56` (#101), limpio y sin PR
abiertas al comenzar. Rama única `feat/canonical-spec-agent`,
[PR #102](https://github.com/javiarmesto/ALDC-AL-Development-Collection/pull/102).

- `agents/al-spec-agent.agent.md` es el contrato de comportamiento único; el prompt
  al-spec.create selecciona ese rol y remite a él. Spec conserva arquitectura y
  alcance aprobados; investiga contratos ordinarios y devuelve solo contradicciones
  materiales. MEDIUM completo en contratos, sin cuerpos AL; HIGH profundiza por
  riesgo concreto. Firma conocida, comportamiento observado y prueba pendiente
  permanecen separados. Aprobación humana antes de Conductor/Developer.
- Instrucciones y skills aplicables se leen selectivamente y sus rutas se conservan
  en el mismo .spec.md para reanudar. No se introducen pares JSON, DAG, fingerprints,
  revisión BCQuality pre-código ni edición AL. Sin terminal/rename en el rol nuevo;
  modelos canónicos preservados. Architect incorpora el handoff a Spec sin cambiar
  sus responsabilidades; Conductor se conserva.
- Fuente raíz → Foundation y, para este rol/entrada, proyección Claude en el
  generador de soporte existente → CLI/Codex. Se elimina la implementación AL
  anticipada del prompt y de la plantilla, y se regeneran todos sus derivados.
  Foundation incluye ahora las plantillas referenciadas. CLI resuelve .agent.md;
  Codex registra once perfiles y mantiene un único skill descubrible.
- Doctor 1.1 distingue instalaciones anteriores válidas de un workflow nuevo al
  que le falte el Spec Agent enlazado; presencia y carga siguen separadas.

Donante leído: Lab `b2ce9d9f137fc92574261317294ca2d585beb74b`,
`.github/agents/al-spec-agent.agent.md`. Transformaciones y ensayo pendiente en
[spec-agent.md](../spec-agent.md). El Lab permanece de consulta.

Comprobaciones: 78 de integración/rutas/permisos, 20 fixtures Doctor, 222 de perfil,
237 de CLI, 15 de recuperación, 58 de conformance, 86 archivos Foundation y 43
Claude sincronizados; once perfiles TOML y validador del skill Codex correctos.
El paquete npm se valida extraído con sus propios contenidos. Son comprobaciones
estáticas/de instalación; no se presenta una simulación como conducta observada.
Revisión remota y CI del head se consultan antes de fusionar.

**Pendiente concreto:** ejecutar en hosts reales el caso acotado de dos unidades
secuenciales, por prompt y por agente, observar carga de reglas/skills y aprobación,
introducir una corrección material y reanudar. Faltan ejecutables utilizables de
los cuatro hosts y un entorno AL/BC de ensayo en este workspace. No se ejecutó AL.
**Delta de empaquetado:** comprobar carga/recarga completa sin duplicados, recuperación
Windows real y regenerar el VSIX externo con los roles/plantillas actualizados.
La entrega 4 solo procede si ese ensayo demuestra fricción; no se abre preventivamente.
Sin releases, publicaciones de paquetes/Marketplace ni despliegue Business Central.

Comprobación de contrato con documentación VS Code actual: el campo agent admite
el nombre de un custom agent y los enlaces relativos se resuelven desde el prompt.
La superficie Local todavía carga prompts; las sesiones Agent Host no los cargan.
Se documenta ese límite concreto para el ensayo y la futura adaptación por host;
no se anuncia compatibilidad Agent Host por la existencia del prompt. Codex recibe
el argumento de la petición actual, sin depender del marcador Claude $ARGUMENTS.

Comprobación de la copia de trabajo Claude: el espejo de Spec adapta las rutas
relativas a .claude/rules y a docs/templates de la raíz; se comprueban además
esas referencias, sin mantener otro contrato. Se actualizan el índice y los
contadores actuales para incluir el nuevo rol; las notas históricas se conservan.

Revisión remota #102: Copilot revisa 71/71 archivos del head inicial y devuelve
COMMENTED con recomendaciones. Se corrigen las rutas antiguas de Architect que
permitían saltar de aprobación de arquitectura a implementación: Spec es el
siguiente paso; Conductor/Developer reciben solo la especificación vigente aprobada.
Se alinean inventarios y tablas actuales en Core Spec, entrada Copilot instalada y
fuente, colección, CLAUDE.md, README y plugin/tabla Codex. Las notas históricas de
4.2.0 quedan explícitamente históricas y remiten al incremento actual.
Se atienden los cuatro hilos y los cinco comentarios suprimidos en fuentes y
copias; la revisión inicial no se presenta como aprobación del head corregido.


## Follow-up — Architect-owned spec decomposition

User requested recovery of multi-spec design and justified parallel authoring
before the next host acceptance run. Base main `5bb47a8cf1dba39e9fa7e09c8a95c1bebd676d18`;
no open PRs at start. One branch: `feat/canonical-spec-decomposition`. Keep this
increment unmerged pending real host acceptance; no release, VSIX or BC deployment.

- Architect explicitly chooses single/multi-spec, assigns IDs/paths and bounded
  capabilities, distinguishes generation/implementation dependencies and checks
  shared contracts, cycles and resource collisions before declaring authoring groups.
- Spec consumes the assigned approved contract revisions, writes one isolated file,
  waits on genuine generation prerequisites and retains implementation dependencies.
  Architect performs joint consistency review; changed shared contracts reopen only
  affected consumers and their approval/readiness, without replacing Conductor gates.
- Section 14 of the existing architecture template is the common decomposition rule
  source. Root and Claude Architect reference it; Spec and its prompt carry the same
  assignment. All existing adapters are regenerated with actual template links.
- Scoped stale references claiming no Spec Agent or AL bodies in the spec are fixed.
  BC28/BC29 projection and AL18 references remain; Conductor content is untouched.

Donors and excluded runtime in docs/spec-agent.md. The revised host acceptance now
covers two independently authored specs, genuine generation blocking, shared
resource conflicts, joint review and correction/resume. Validation: 109 Spec routing/reference/permission checks, 222 BC28/BC29 profile
checks, 237 CLI checks, 15 recovery tests, 20 Doctor fixtures, 58 conformance checks,
11 Codex TOML profiles, Foundation/Claude drift and offline extracted npm package
all pass. No Conductor file or AL18 capability/projection source changed. Collection
validation reports zero errors with 78 existing advisory warnings. The additional
checks resolve the common decomposition template from each actual host layout;
they do not simulate dependency decisions or parallel model execution.

No real host concurrency or BC test result is claimed from artifact validation.
