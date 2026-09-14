# ALDC canónico: perfil nativo BC29 / AL18

Adaptación optativa para **GitHub Copilot Chat en VS Code**, con contratos propios
para los plugins de **Claude Code y Copilot CLI**. Mantiene los diez
agentes, los documentos, las aprobaciones y el Conductor completo. No incorpora
la orquestación de ALDC Graph. No es una release ni una certificación de BC29.

## Base y distribución

Revisión del 11 de septiembre de 2026. Base inicial inspeccionada:
`de21a8a1e6704f6dca273b1637475367b28aa58b` (`main`, PR #96), posterior a
`4f3371f69c3013edb508540673f60e5e8a0b64b6` del handoff. Antes de entregar,
`main` avanzó a `c8cb3c078f10a993194c0807329faecadfc60466` (PR #89,
correcciones independientes de vocabulario Claude y su espejo). Se incorporó
esa base sin alterar sus cambios; la propuesta parte de `c8cb3c0`.
Referencia consultada: [NATIVE29-001, PR #81](https://github.com/javiarmesto/ALDC-Research-Lab/pull/81),
todavía abierta al revisarla, en `7d06c607677188477994b4b1c0db50bc0b75ed7b`.
Se reutilizan decisiones de herramientas, no sus agentes, Doctor ni contratos de ejecución.

| Fuente | Copia o consumidor | Tratamiento |
| --- | --- | --- |
| `agents/`, `prompts/`, `instructions/`, `skills/` | `packages/foundation/` | Editar raíz; ejecutar `sync-foundation.js`. Nunca editar el espejo a mano. |
| Agentes y prompts de raíz | Instalador npm/local | BC28 copia original; BC29 proyecta permisos y contratos al instalar. |
| `claude-plugin/` | `.claude/` | Fuente Claude actualizada; espejo regenerado con `sync-claude-workspace.js`. |
| `claude-plugin/` + modelos de `agents/` | `copilot-cli-plugin/` | Proyección específica y reproducible con `sync-copilot-cli.js`; entrada `aldc-cli` en el catálogo Copilot. |
| `agents/` y `skills/` | Plugin Copilot de raíz | Conserva su superficie actual; el nuevo perfil se selecciona con el instalador. |
| `docs/agents/`, `docs/prompts/` | Documentación histórica | No son la fuente de instalación; la matriz de este documento describe el perfil nuevo. |

`scripts/native-profile.js` transforma la fuente canónica, sin guardar otra copia
completa de los agentes. La proyección falla si aparece un agente sin asignación
de permisos o cambia la sección del Developer que necesita adaptación.
Las skills existentes incorporan conocimiento condicionado a la versión; su
espejo `foundation` se regenera. Claude incorpora las mismas referencias AL18 y un contrato propio de terminal;
Copilot CLI se genera desde esa fuente con adaptación explícita del host.

Los workflows versionados publican documentación con push a `main` y releases con
tags `v*.*.*` o ejecución manual. Crear esta rama no activa esos destinos. La PR
sí activa validaciones. El linter existente usa `--fix`; se añade una condición
para que no haga commit/push en PRs **draft**. El trabajo queda revisable sin
reescrituras automáticas masivas. Al convertirla a lista para revisión volverá
a aplicarse su comportamiento previo. No se han inspeccionado webhooks externos
de administración ni se garantiza el comportamiento de servicios no versionados.

## Selección e instalación

Trabaja sobre una copia de prueba del proyecto. No ejecutes el instalador desde
la raíz del repositorio canónico: su destino es el directorio de trabajo actual.
Obtén un checkout independiente de `main` tras integrar la PR #97 y anota su commit:

```powershell
git clone --branch main https://github.com/javiarmesto/ALDC-AL-Development-Collection.git ALDC-native29
git -C ALDC-native29 rev-parse HEAD
$aldcInstaller = (Resolve-Path .\ALDC-native29\scripts\install.js).Path
# Cambia a TU copia de prueba antes de instalar:
Set-Location C:\src\MiProyecto-Prueba
node $aldcInstaller install --profile bc29-native --yes
```

Si ya contiene una instalación BC28, revisa y conserva tus personalizaciones;
para sustituir los archivos administrados usa:

```powershell
node $aldcInstaller install --profile bc29-native --force --yes
```

La selección no modifica `app.json`, runtime, GUID, dependencias, entorno ni
fuentes AL. El instalador mantiene sus operaciones habituales sobre el toolkit
y `aldc.yaml`; `--force` reemplaza también `aldc.yaml`, `aldc.code-workspace`,
la entrada `.github/copilot-instructions.md` y las instrucciones personalizadas.
Los archivos gestionados intactos se actualizan; las personalizaciones se muestran
como colisiones y se conservan sin `--force`. Ahora se crean respaldos antes de
sustituir archivos. `verify-install` detecta drift y `rollback` restaura la operación
anterior si no pisa ediciones posteriores. Volver a BC28 cambia contratos; usa
rollback para restaurar las preimágenes. La memoria existente se conserva. Consulta
[empaquetado y recuperación](plugin-packaging.md). No hay publicación.
El marcador `<target-dir>/aldc-profile.json` registra solo la selección, nunca
capacidad verificada. Actualizar sin `--profile` conserva la selección registrada.

Para volver a la superficie BC28:

```powershell
node $aldcInstaller install --profile bc28 --force --yes
```

Esto revierte contratos de herramientas, no cambios del proyecto que hayas hecho
durante la prueba. Las instalaciones nuevas sin `--profile` siguen usando BC28.
Se admite `--target-dir`; en VS Code debes configurar el descubrimiento de agentes
y skills si eliges una ubicación diferente de `.github`.

Recarga VS Code y comprueba qué definición de cada agente ha cargado. Evita tener
simultáneamente el plugin canónico y la instalación local con los mismos nombres.
Instalar el plugin Marketplace actual **no selecciona BC29**. Copilot CLI, Claude
Code disponen ahora de la adaptación descrita más abajo; no usan este perfil
VS Code. Codex queda fuera de esta propuesta.
No se exige BC Atlas ni el puente comunitario de símbolos/LSP. Las operaciones
no cubiertas por lo nativo se anotan como limitación; no se presupone equivalencia.
BCQuality sigue siendo opcional mediante el proveedor/plugin que tengas disponible.

Para revisar los agentes generados sin instalar en ningún proyecto:

```powershell
node .\ALDC-native29\scripts\native-profile.js C:\temp\ALDC-native29-review
```

El destino debe ser nuevo y externo al checkout. Esta exportación contiene
agentes/prompts y su contrato; la instalación completa se realiza con el instalador.

Para crear y comprobar un VSIX local desde esta rama, consulta
[la guía de empaquetado de la extensión](vsix-packaging.md). La extensión local
debe incorporar el proyector BC29 antes de que su comando de instalación pueda
ofrecer este perfil.

## Inventario por agente y flujo

La especificación corresponde a **AL Spec Agent**, invocable mediante **`al-spec.create`**.
El reparto aprobado por Architect distingue dependencias de redacción e implementación.
Todos los contratos proyectados indican cuándo leer y aplicar
[el contrato nativo](framework/native-al-tools.md).

| Agente o función | Cambio y motivo | Flujo conservado |
| --- | --- | --- |
| Architect | Búsqueda/diagnósticos nativos para viabilidad y dependencias; consume grafo si aporta. | Diseña arquitectura; no convierte declaraciones de implementación en un bloqueo general. |
| `al-spec.create` | Búsqueda/diagnósticos, propuesta de dependencias; dudas de librerías quedan en Open Questions. | Escribe `.spec.md` desde arquitectura; no modifica manifiestos ni implementa. |
| Planning Subagent | Búsqueda/diagnósticos para lagunas concretas. | Devuelve hallazgos al Conductor reutilizando decisiones aprobadas. |
| Developer | Corrige `al_getdiagnostics`, habilita `al_build`; conserva descarga y depuración. | Implementación táctica, compilación, tests y grafo opcional por terminal. |
| Implementation Subagent | Búsqueda, diagnóstico, descarga y compilación nativa. | RED → GREEN → REFACTOR; ejecuta consultas acotadas del grafo cuando sirven. |
| Review Subagent | Búsqueda/diagnósticos; retira depuración de su perfil nativo de revisión. | Contrasta fuentes, compilación y tests reales; devuelve el veredicto existente. |
| Dredd | Búsqueda/diagnósticos; examina evidencia bruta con su propio criterio. | Auditoría independiente, sin sustituir aprobaciones ni ejecutar grafo. |
| Triage | Búsqueda/diagnósticos/descarga y depuración autorizada. | Diagnostica; entrega la corrección al Developer. |
| Presales | Solo búsqueda nativa para cuestiones de viabilidad pertinentes. | Estimación y propuesta; sin compilar ni ejecutar grafo. |
| Agent Builder | Búsqueda/diagnósticos para SDK y objetos relevantes. | Mantiene diseño/creación; delega ejecución técnica correspondiente. |
| Conductor | Añade alcance y referencias; sin herramientas nativas de ejecución. | Conserva íntegro su cuerpo, coordinación, agentes, modelos y aprobaciones. |

También se proyectan los prompts: se eliminan permisos obsoletos, se limita la
compilación a `al-build`, se mantiene descarga en `al-initialize` y no se añade
publicación. Un permiso amplio de editor no cambia las responsabilidades del rol.

## Guion local en Copilot Chat

Registra cada paso en los documentos existentes de la prueba, con referencia a
la traza. No basta que el agente afirme que tiene una herramienta o una skill.

1. **Entorno de prueba.** Abre App/Test, registra versiones de VS Code, Copilot,
   AL Language/ALTool, BC y paquetes. Confirma target/entorno antes de conectar.
   Lee el contrato nativo; conserva la traza de lectura y el esquema instalado.
2. **Búsqueda local, Architect.** «Localiza el objeto Customer con búsqueda nativa,
   identifica su procedencia y explica qué parte está verificada. No implementes».
   Debe ejecutar `al_symbolsearch`, con los parámetros reales del esquema.
3. **Entorno, si procede.** Elige un objeto de una app instalada que todavía no sea
   dependencia. Comprueba soporte de `filters.source = "environment"`; busca y
   conserva identidad del propietario. Architect/spec propone la dependencia.
   Developer aplica solo el cambio autorizado, descarga y repite búsqueda local.
   Si no hay soporte/conexión/objeto adecuado, registra «no ejecutado» y el motivo.
4. **Especificación.** Ejecuta `al-spec.create` con librerías de tests cuya versión
   difiera de la app. Debe evaluar semántica de dependencia, escribir lo conocido
   y anotar la incertidumbre; no exigir igualdad numérica ni inventar compatibilidad.
5. **Compilación, Developer.** «Compila App y Test con las herramientas nativas,
   conservando el resultado de cada proyecto. No publiques». Usa `scope: current`
   por proyecto o `all` solo si todos están autorizados. Conserva salidas y `.app`.
6. **Tests.** Ejecuta el runner habitual únicamente cuando esté autorizado y
   disponible. Separa escritos, compilados y ejecutados; conserva passed/failed/skipped.
   No declares tests superados por ausencia de errores en Problems.
7. **Grafo opcional, Developer/Implementer.** Comprueba versión/help como indica el
   contrato. Elige una entrada pública hacia una implementación interna o un cruce
   de aplicación. Extrae solo las fuentes pertinentes, ejecuta la consulta y
   conserva comando, versión, corpus, resultado y limitaciones. Exporta solo si
   interesa navegar el resultado y el formato está disponible.
8. **Review y Dredd.** Entrega referencias a evidencia bruta. Deben distinguir
   resultados de compilación, tests y alcance estático; Dredd mantiene su revisión
   independiente. Una ruta no prueba ejecución, fuga ni vulnerabilidad.
9. **Conductor.** Recorre planificación, implementación y revisión con los gates
   actuales. Comprueba que pasa referencias, no ejecuta herramientas por los otros
   roles y no exige Doctor ni un grafo para terminar un requisito que no lo necesita.

Para una novedad de lenguaje concreta, sigue solo su sección en las skills de
migración, rendimiento, testing, traducción o depuración. No añadas las seis por defecto.

## Estado de validación

| Estado | Evidencia |
| --- | --- |
| Verificado localmente | Instalación real en directorios temporales BC28/BC29, cambio/retorno de perfil, destino alternativo, preservación de memoria y `app.json`, permisos y referencias; 177 comprobaciones automatizadas. |
| Verificado estáticamente | Diez agentes; Conductor original completo en la proyección; modelos y handoffs conservados; nombres nativos contrastados con catálogo; sin nuevos permisos de publicación. |
| Verificado en fuentes | Catálogo LM desde AL17 y anuncios BC29; no equivalen a ejecución en el equipo del usuario. |
| Declarado, pendiente de confirmar | Esquemas instalados, opciones exactas del grafo y algunas declaraciones AL18. `publicResourceFolders`/recursos públicos NavApp no se localizaron en las páginas oficiales consultadas. |
| Pendiente local | Lectura real de referencias por Copilot, búsqueda en entorno, compilación App/Test BC29, runner y consultas/exportaciones reales de `al graph`; Windows y versión mínima de Node. |

Comandos reproducibles desde este checkout (Node 20+ como mínimo del paquete y la validación):

```bash
npm ci
npm run validate
npm run test:package
node scripts/check-conformance.js
node scripts/sync-foundation.js --check
node scripts/sync-claude-workspace.js --check
node scripts/sync-copilot-cli.js --check
git diff --check
```

`npm run validate` incluye las pruebas nuevas. Las pruebas de instalación usan
directorios temporales y el modo offline de npm; no ejecutan AL ni conectan a BC.
El validador de colección conserva 77 avisos preexistentes y 0 errores; la prueba
de esta adaptación no declara esos avisos como capacidades verificadas.


## Plugins de Claude Code y Copilot CLI

Los cambios están en la misma rama, sin release, publicación ni cambio de versión.
Los catálogos de `main` no adquieren esta adaptación hasta que se integre y publique
según el proceso del mantenedor. Para revisar ahora, carga el checkout de la rama.
El VSIX y el plugin Copilot de raíz conservan sus primitivas originales; esta
adaptación de terminal no activa el perfil nativo dentro de la extensión VS Code.

| Superficie | Fuente / distribución | Selección |
| --- | --- | --- |
| Claude Code | `claude-plugin/` y espejo `.claude/` | BC28 sigue válido; aplicar AL18 solo ante requisito/target BC29. |
| Copilot CLI | `copilot-cli-plugin/`, generado; plugin `aldc-cli` | Mismo alcance condicional; herramientas terminal/MCP, sin nombres LM de VS Code. |
| Copilot Chat | Instalador `--profile bc29-native` | Mantiene selección explícita BC28/BC29 descrita arriba. |

Se mantienen diez agentes y diez comandos. Las quince skills Claude se conservan;
cinco incorporan las referencias nuevas. El cuerpo original del Conductor Claude
se preserva byte a byte tras añadir el contrato; CLI conserva el cuerpo completo
con traducciones de vocabulario del host. Claude conserva sus modelos y Copilot CLI
usa `claude-sonnet-4.6`, equivalente al modelo actual de los agentes Copilot de raíz.
No se seleccionan modelos a partir de novedades de agentes integrados en BC.

Los agentes y comandos enlazan directamente el contrato dentro de la skill de
migración; no dependen de cargar el `CLAUDE.md` del plugin. Se corrigen los permisos
MCP de Claude para los servidores ya declarados y se traducen explícitamente a
permisos CLI. Los alias `Task` de Claude se conservan por compatibilidad (`Agent`
en versiones nuevas). Los nombres MCP deben verificarse en la sesión activa.

Architect/spec/Planning consumen diagnósticos y proponen dependencias; la ejecución
AL y el grafo corresponden a Developer/Implementer. Review/Dredd contrastan la
prueba bruta. Conductor mantiene coordinación y gates. Build/setup solo ejecutan
su trabajo propio. La búsqueda de entorno no se atribuye al puente comunitario:
requiere un proveedor realmente disponible y su esquema, o se declara pendiente.
El test runner y otras capacidades AL18 requieren comprobación de versión/help.
No se añaden servicios MCP, permisos automáticos de despliegue ni hooks Claude a CLI.
BCQuality sigue opcional con el backstop nativo existente.

### Prueba local exacta

Usa una copia de proyecto separada, con el checkout de esta rama en otra carpeta.
Confirma el commit con `git rev-parse HEAD`. Registra también las versiones de
`claude --version` / `copilot --version`, ALTool y BC.

Claude Code, desde tu copia de proyecto:

```powershell
claude --plugin-dir C:\src\ALDC-native29\claude-plugin
```

Comprueba `/plugin`, `/context` o `/agents`, los comandos `/aldc:` y `/mcp`. Pide a
`aldc:al-architect` leer el contrato de terminal y localizar un objeto conocido.
Conserva la traza de lectura, el nombre MCP expuesto, sus argumentos y el resultado.
Para actualizar la prueba, vuelve a iniciar con `--plugin-dir` (o usa la recarga
que soporte tu versión). No presupongas que el número de versión 4.2.0 renueva una
instalación Marketplace en caché.

Copilot CLI:

```powershell
copilot plugin install C:\src\ALDC-native29\copilot-cli-plugin
copilot plugin list
```

Reinicia, revisa `/agent`, `/skills list` y `/mcp`. Comprueba diez agentes, las skills
y los diez comandos mediante la ayuda del host; invoca los flujos por su nombre
si tu versión usa otro prefijo de comandos. Reinstala la ruta tras cada cambio para
renovar la caché. Evita duplicados del plugin `aldc` y definiciones de usuario/proyecto
que oculten `aldc-cli`. `al-initialize` adapta las reglas a `.github/instructions`
y `applyTo`, preservando archivos existentes; ejecútalo solo en la copia de prueba.

En ambos hosts, pide a Developer comprobar ALTool/version/help y compilar App y Test
sin publicar. Solicita una consulta de grafo útil solo si está disponible. Haz pasar
las salidas reales a Review/Dredd y una fase completa por Conductor. Separa siempre
herramienta declarada, referencia leída y operación ejecutada. La ausencia de un
runner, grafo o proveedor de entorno no se convierte en un resultado satisfactorio.

**Límite pendiente de carga:** Architect y Conductor completos superan los 30.000
caracteres de la referencia genérica de custom agents. No se han reducido ni
externalizado. La referencia específica de CLI no aclara ese límite: comprueba
que tu versión los carga enteros y no los rechaza/trunca. Si no los admite, ese
flujo queda pendiente de una decisión de compatibilidad, no validado por estas pruebas.

### Validación de las distribuciones

153 comprobaciones estáticas adicionales cubren manifiesto/catálogo, permisos,
referencias incluidas, preservación completa del Conductor, modelos, instrucciones
de CLI y rechazo de herramientas desconocidas en el generador. `npm run validate`
incluye estas pruebas y la comprobación de drift de los 52 archivos de Copilot CLI.
El espejo Claude contiene 40 archivos comprobados. No se dispuso de los ejecutables
Claude/Copilot ni de un entorno BC: la instalación/carga en esos hosts y las
operaciones AL quedan pendientes del guion anterior.

Para regenerar tras editar las fuentes:

```bash
node scripts/sync-claude-workspace.js
node scripts/sync-copilot-cli.js
npm run validate
```

Fuentes: [plugins CLI](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference),
[agentes CLI](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#custom-agents-reference),
[límite genérico](https://docs.github.com/en/copilot/reference/custom-agents-configuration),
[prueba de plugins Claude](https://code.claude.com/docs/en/plugins),
[permisos Claude](https://code.claude.com/docs/en/sub-agents).

## Revisión de cierre de la PR #97

El [registro de continuación](worklogs/canonical-reuse.md) recoge las correcciones,
las pruebas actuales y el delta de empaquetado posterior. Se corrigió el rechazo
de fuentes CRLF y se probó su instalación en fixture Linux; esto no certifica
la ejecución completa en Windows. El perfil conserva el cuerpo del Conductor
también con CRLF. El registro distingue preservación, omisión y sobrescritura.

El build nativo termina en compilación/empaquetado y un handoff de publicación
con aprobación explícita. No conserva llamadas a operaciones de publicación
no concedidas. Los nombres antiguos de setup, contexto y perfilado se sustituyen
por operaciones verificables o handoffs al propietario correspondiente.

`npm run test:package` es el gate de desarrollo tras `npm ci`: necesita `tar`,
extrae un archivo local y reutiliza dependencias del lockfile. No publica.
Los permisos de Dredd/Triage expresan responsabilidades y filtros de herramientas;
no garantizan aislamiento de rutas. Ver la explicación de la revisión en el registro.
