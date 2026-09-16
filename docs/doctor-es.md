# ALDC Doctor — manual de campo

Doctor responde a una sola pregunta: **qué hay configurado de verdad en este
espacio de trabajo ahora mismo**. Lee ficheros y cuenta lo que encuentra. No
compila, no ejecuta pruebas, no arranca ningún proveedor y no instala nada.

Ese límite es justo lo valioso. Que Doctor salga limpio no significa que tu
extensión compile: significa que nada de la configuración local está bloqueando
el intento.

---

## Cómo se ejecuta

| Dónde | Cómo |
| --- | --- |
| Panel Project Manager | Botón **Run Doctor**. El informe se dibuja en el panel y **Export JSON** guarda el informe en bruto. |
| Paleta de comandos | `AL Collection: Run Doctor` |
| Terminal | `python3 .github/tools/context-doctor/aldc_context_doctor.py --workspace . --host chat --toolkit .github` |

Doctor necesita Python 3.9 o superior ya instalado y usa solo la biblioteca
estándar. La extensión busca `python3`, `python` y `py -3`; si el tuyo está en
otro sitio, indícalo en `al-collection.pythonPath`.

Opciones útiles:

| Opción | Para qué sirve |
| --- | --- |
| `--json` | Informe en formato máquina. Es el que consume el panel. |
| `--operation <nombre>` | Revisa solo una operación. Se puede repetir. |
| `--host chat\|claude\|cli\|codex` | Qué distribución de ficheros esperar. La extensión usa siempre `chat`. |
| `--toolkit <dir>` | Dónde está instalado el toolkit. Por defecto, el propio proyecto. |
| `--bcquality-config <fichero>` | Instantánea de configuración generada por `tools/bcquality/config.js`. Sin ella, BCQuality no se revisa. |
| `--runtime <fichero>` | Observaciones del host aportadas por quien llama. Nunca se generan solas. |

---

## Qué revisa

- **Proyectos AL.** `appFolders` y `testFolders` de `.AL-Go/settings.json` si
  existe; si no, recorre como mucho tres niveles de carpetas, saltando ocultas,
  dependencias, salida de compilación y enlaces simbólicos. Las carpetas `Test`,
  `Tests` o `test-*` cuentan como proyecto de pruebas. Cada manifiesto informa de
  su propio destino de aplicación, aparte del perfil instalado.
- **Fuentes de los flujos.** Si existen los ficheros de agentes y workflows bajo el
  directorio del toolkit, y si un punto de entrada nuevo enlaza a un rol que falta
  (señal de actualización incompleta).
- **Marcador de perfil.** `aldc-profile.json` y si contiene `bc28` o `bc29-native`.
- **Configuración del host.** `.vscode/settings.json`, `tasks.json`, `launch.json` y
  `mcp.json` se analizan como JSON. Un fichero roto se reporta contra las
  operaciones a las que afecta.
- **Configuración de BCQuality**, cuando se aporta la instantánea. Doctor la
  contrasta con los bytes de `aldc.yaml` y rechaza una instantánea caducada.

Que un fichero exista es configuración. Nunca es prueba de que tu host lo haya
cargado.

---

## Las cuatro operaciones

| Operación | Qué abarca |
| --- | --- |
| `specify` | Redactar una especificación: fuentes de workflows, roles de agente, proyectos detectados. |
| `compile-app` | Compilar el proyecto App. |
| `compile-test` | Compilar el proyecto Test. |
| `execute-tests` | Ejecutar pruebas contra un entorno BC. Compilar no basta. |

---

## Valores de estado de cada operación

La clave en bruto es la que viaja en el JSON; la etiqueta es la que ves en el panel.

| Estado | Etiqueta en el panel | Qué significa | Qué hacer |
| --- | --- | --- | --- |
| `unobserved` | Execution not observed | El estado por defecto. Nadie aportó una observación de ejecución, así que no es ni éxito ni fallo. | No pasa nada. Ejecuta la operación en tu host cuando toque. |
| `available-reported` | Availability reported | Alguien informó de que existe la capacidad. | Úsala. Cargarla, ejecutarla y su resultado siguen necesitando cada uno su propia observación. |
| `executed-reported` | Execution reported, result pending | Algo se ejecutó, pero sin evidencia del resultado. | Revisa tú el resultado. No des el éxito por hecho. |
| `verified-reported` | Successful result reported | Alguien informó de un resultado correcto para un alcance concreto. | Consérvalo. Repite solo si cambió el origen o el entorno. |
| `failed-reported` | Failure reported | Alguien informó de un fallo. | Corrige la causa y repite solo esa operación. |
| `unavailable` | Capability not available | Se informó de que el descubrimiento o la carga no están disponibles. Afecta solo a esta operación. | Instala o habilita lo que falta. |
| `configuration-blocked` | Configuration pending | Un problema de configuración bloquea el intento. Los ficheros implicados aparecen en la lista. | Repara exactamente lo listado y repite. |
| `not-applicable` | Not applicable | La operación no tiene destino, normalmente porque no hay proyecto de pruebas. | Configura `testFolders` si tus pruebas viven en otro sitio. |

Un valor desconocido se muestra como **Unrecognised state** conservando debajo el
dato original: eso indica que el informe es más nuevo que la extensión.

---

## Códigos de salida

| Código | Significado |
| --- | --- |
| `0` | Ningún problema de configuración bloqueante y nada reportado como no disponible o fallido. **No** afirma que algo funcione. |
| `1` | Alguna operación seleccionada se reportó como no disponible o fallida. |
| `2` | Entrada malformada, o problema de configuración bloqueante. |

Todo en `unobserved` da salida 0. Es el estado normal de una instalación limpia en
la que todavía no se ha ejecutado nada.

---

## Valores de estado de BCQuality

Hay que aportar `--bcquality-config` (el panel lo hace solo) o BCQuality se queda
sin revisar.

| Estado | Etiqueta en el panel | Qué significa |
| --- | --- | --- |
| `configuration-uninspected` | Configuration not inspected | No se aportó instantánea; no se sondeó ningún proveedor. |
| `configured` | Configured | La instantánea coincide con `aldc.yaml`. Descubrimiento, carga y ejecución siguen sin observar. |
| `disabled` | Disabled | Desactivado por configuración. Se aplica la lista nativa A–G. |
| `discovered-reported` | Discovery reported | Se informó de una entrada de catálogo. Ni cargada ni ejecutada. |
| `loaded-reported` | Loading reported | Se informó de la carga. La ejecución y el resultado van aparte. |
| `executed-reported` | Execution reported | Se informó de una ejecución con su resultado. La frescura y la cobertura siguen necesitando evidencia de revisión. |
| `unavailable-reported` | Unavailable reported | Se informó de que el proveedor no está disponible. La revisión nativa sigue siendo obligatoria. |
| `incompatible-reported` | Identity mismatch reported | La versión u origen observados no coinciden con lo configurado. |
| `identity-unverified` | Identity unverified | Hay una expectativa configurada, pero no se informó de la identidad observada. |

### Las tres etapas

Las observaciones de BCQuality avanzan `discovered` → `loaded` → `executed`, en ese
orden. Una etapa posterior sin sus previas se rechaza como entrada inválida, no se
acepta en silencio. Una ejecución debe traer el texto real de su resultado.

### Índice

| Valor | Significado |
| --- | --- |
| `unobserved` | No se informó nada sobre el índice. |
| `not-attempted` | Se informó de que no se intentó, con detalle. |
| `failed` | Se informó de un fallo, con detalle. |
| `generated` | Exige comando, código de salida 0, ruta absoluta legible, un SHA-256 que coincida con el fichero en disco y evidencia de frescura. Doctor vuelve a calcular el hash. |

---

## Cómo leer el informe en el panel

- **Stale.** Después de instalar, actualizar o restaurar, el informe mostrado se
  marca como caducado: describe el proyecto tal como estaba antes de ese cambio.
  Vuelve a ejecutar Doctor.
- **Problemas de configuración.** Aparecen con las operaciones a las que afectan. Un
  problema en `mcp.json` es informativo; el resto son bloqueantes.
- **Instantánea de configuración.** Si no se pudo generar la de BCQuality, el panel
  lo dice y el resto del informe sigue siendo válido.
- **Export JSON.** El informe en bruto, sin retocar. Es lo que conviene adjuntar al
  reportar una incidencia.

---

## Problemas habituales

| Síntoma | Causa y solución |
| --- | --- |
| "No Python 3.9+ interpreter was found" | Instala Python o apunta `al-collection.pythonPath` a un intérprete. ALDC nunca instala Python. |
| "Doctor did not finish within the time limit" | Espacio de trabajo grande. Sube `al-collection.doctorTimeoutSeconds` o acota el proyecto. |
| "configuration snapshot is stale or belongs to another workspace" | `aldc.yaml` cambió después de tomar la instantánea, o la instantánea es de otra carpeta. Ejecuta Doctor otra vez. |
| "no App app.json found (depth <= 3)" | Tu proyecto App está más de tres niveles abajo. Decláralo en `.AL-Go/settings.json`, en `appFolders`. |
| `compile-app` y `compile-test` bloqueados a la vez | `.vscode/tasks.json` no se puede analizar. Repara el JSON. |
| Perfil reportado como inválido | `aldc-profile.json` contiene algo distinto de `bc28` o `bc29-native`. Reinstala o restaura el toolkit. |

---

## Lo que Doctor nunca afirma

No afirma que tu host haya cargado un agente, que el compilador AL se haya
ejecutado, que las pruebas pasaran ni que un proveedor se ejecutara. Todo lo que
informa quien llama queda etiquetado como reportado, nunca como verificado. Salida
0 significa "nada local lo está bloqueando", y nada más.
