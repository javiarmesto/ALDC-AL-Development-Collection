# Catálogo público · Business Central, AL y MCP

Cuenta: [javiarmesto](https://github.com/javiarmesto). Revisión: **6 de octubre de 2026**. Estado de las PR y CI: foto de esta revisión; abre sus enlaces para consultar cambios posteriores.

Se volvieron a enumerar **107 repositorios públicos** y se mantuvo la selección de **35: 22 propios y 13 forks**. Ninguno de los seleccionados está archivado. «Histórico» describe la edición docente, no una decisión de archivar ni una prueba de abandono. El sitio del evento de 2027 es ficticio.

## Cómo elegir

- Desarrollo AL con agentes: [ALDC](https://github.com/javiarmesto/ALDC-AL-Development-Collection). Su release publicada es 5.0.1; el checkout inspeccionado declara 5.0.2. APM-ALDC conserva su baseline 4.2.0 y no representa una migración a 5.x.
- Conectar Cowork mediante lecturas BC: [Ático](https://github.com/javiarmesto/Atico-a-Business-Central-M365-Cowork-plugin-guide).
- Aprender MCP localmente: [Directions Lab](https://github.com/javiarmesto/Workshop-MCP-Server-Directions-Lab), primero con datos simulados; para Copilot Studio, sigue el [workshop BC MCP](https://github.com/javiarmesto/Workshop-Build-BC-mcp-CS-Agent).
- Practicar con código y evidencias: [ALDC Workshop Lab](https://github.com/javiarmesto/aldc-workshop-lab), eligiendo la revisión del recorrido.
- Evaluar agentes: [BC-Bench-Guide](https://github.com/javiarmesto/BC-Bench-Guide) y el [BC-Bench de Microsoft](https://github.com/microsoft/BC-Bench).

## Alcance de la validación

Se inspeccionaron metadatos actuales, instrucciones aplicables, README, manifiestos, estructura y fuentes concretas necesarias para comprobar las afirmaciones. Se verificaron enlaces relativos de las entradas propias, diffs y checks de las PR. GitHub muestra primero un README en `.github/`, después raíz y después `docs/`: por eso SampleDynamicsMinds recibió también una portada corregida en `.github/README.md`. [Regla de GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes).

No se realizó una instalación manual de los proyectos, compilación AL local, publicación en sandbox, despliegue de MCP ni llamadas a BC, Graph o endpoints personales. La CI indicada a continuación sí ejecutó sus jobs automatizados; no se convierte por ello en una validación manual o de todos los escenarios de cada README. La inspección de ZIP y la búsqueda básica de credenciales no son una auditoría de seguridad del historial.

## Correcciones del inventario inicial

- ALDC: distinguir release 5.0.1 de paquete del checkout 5.0.2, y contadores de módulos de los de entradas de rol/workflow.
- Directions Lab: scripts y validadores están en raíz; no hay carpetas raíz `scripts/` y `tests/`.
- Lab3_1: módulos en raíz, variantes FastMCP y ausencia de `http_server:app`; las promesas de REST/despliegue personal no se sostienen con ese árbol.
- MyApp: los mensajes Hello World están comentados y las dependencias Common/Licensing no se incluyen como fuentes del checkout.
- Companial: **Use this template** copia main actual; la edición del 1 de octubre tiene una revisión fijada distinta. No se afirma que el evento se haya ejecutado a partir de su convocatoria.
- graphify-al: parent inmediato ChristianHovenbitzer/graphify-al; licencia Apache-2.0 con NOTICE y texto MIT anterior conservado.

## Herramientas, frameworks y guías propios

| Repositorio | Propósito y cambio | Estado / PR | Licencia y reutilización |
|---|---|---|---|
| [ALDC-AL-Development-Collection](https://github.com/javiarmesto/ALDC-AL-Development-Collection) | Distinguir release 5.0.1 del checkout 5.0.2, neutralizar actualización, alinear contadores por scope y enlazar catálogo | Catálogo y README en #122; consultar estado de la PR · [#122](https://github.com/javiarmesto/ALDC-AL-Development-Collection/pull/122) | MIT |
| [APM-ALDC](https://github.com/javiarmesto/APM-ALDC) | Mantener 4.2.0 y separar baseline APM de canónico; no simular migración | Documentación fusionada · [#12](https://github.com/javiarmesto/APM-ALDC/pull/12) | MIT |
| [CIRCE-Agent-Squad-for-Microsoft-Copilot-Studio](https://github.com/javiarmesto/CIRCE-Agent-Squad-for-Microsoft-Copilot-Studio) | Acceso directo a Order Tracker, requisitos y resultado BC con atribuciones | Documentación fusionada · [#6](https://github.com/javiarmesto/CIRCE-Agent-Squad-for-Microsoft-Copilot-Studio/pull/6) | MIT |
| [BC-Bench-Guide](https://github.com/javiarmesto/BC-Bench-Guide) | Aclarar guía vs evaluador, fijar revisión en cada ejecución sin inventar validación | Documentación fusionada · [#1](https://github.com/javiarmesto/BC-Bench-Guide/pull/1) | Pendiente de aclarar |

## MCP e integraciones propios

| Repositorio | Propósito y cambio | Estado / PR | Licencia y reutilización |
|---|---|---|---|
| [Atico-a-Business-Central-M365-Cowork-plugin-guide](https://github.com/javiarmesto/Atico-a-Business-Central-M365-Cowork-plugin-guide) | Resultado esperado de List, mapa de carpetas y evidencia limitada | Documentación fusionada · [#1](https://github.com/javiarmesto/Atico-a-Business-Central-M365-Cowork-plugin-guide/pull/1) | MIT |
| [Workshop-MCP-Server-Directions-Lab](https://github.com/javiarmesto/Workshop-MCP-Server-Directions-Lab) | Corregir rutas reales de setup/venv/tests y aclarar recorrido mock vs BC; Explicar rutas de validación y límites de evidencia | Documentación fusionada · [#2](https://github.com/javiarmesto/Workshop-MCP-Server-Directions-Lab/pull/2) | Pendiente de aclarar |
| [Workshop-Build-BC-mcp-CS-Agent](https://github.com/javiarmesto/Workshop-Build-BC-mcp-CS-Agent) | Quitar afirmaciones globales GA/preview y conservar referencia de edición BC27; Inicio mínimo de lectura y validación por operación sin prometer despliegue | Documentación fusionada · [#1](https://github.com/javiarmesto/Workshop-Build-BC-mcp-CS-Agent/pull/1) | MIT |
| [Lab3_1_MCP_BusinessCentral](https://github.com/javiarmesto/Lab3_1_MCP_BusinessCentral) | Inicio local reproducible; separar MCP de REST; quitar promesas del despliegue personal; límites de seguridad y empaquetado; Retirada de ZIP generado con configuración sensible; Retirada de logs personales generados | Pendiente: comprobaciones en curso · [#1](https://github.com/javiarmesto/Lab3_1_MCP_BusinessCentral/pull/1) | Pendiente de aclarar |
| [AL_Onedrive](https://github.com/javiarmesto/AL_Onedrive) | Entrada BC26/runtime15; flujo Graph; corregir permisos duplicados; estado bloqueado por secreto en inicialización; retirada de secreto en código pendiente de autorización separada | Documentación fusionada · [#1](https://github.com/javiarmesto/AL_Onedrive/pull/1) | Pendiente de aclarar |

## Ejemplos y plantilla AL propios

| Repositorio | Propósito y cambio | Estado / PR | Licencia y reutilización |
|---|---|---|---|
| [SampleDynamicsMinds](https://github.com/javiarmesto/SampleDynamicsMinds) | Portada propia, manifiesto BC28/runtime17, Hello World e instrucciones de sandbox; Corregir el README que GitHub prioriza | Documentación fusionada · [#1](https://github.com/javiarmesto/SampleDynamicsMinds/pull/1) | Pendiente de aclarar |
| [ItemSubTool](https://github.com/javiarmesto/ItemSubTool) | Entrada setup/datos/validación y distinguir ejemplos de respuestas ejecutadas | Documentación fusionada · [#1](https://github.com/javiarmesto/ItemSubTool/pull/1) | Pendiente de aclarar |
| [aldc-workshop-lab](https://github.com/javiarmesto/aldc-workshop-lab) | Revisión explícita por recorrido y separar tests declarados de ejecución auditada | Documentación fusionada · [#9](https://github.com/javiarmesto/aldc-workshop-lab/pull/9) | MIT; contenidos CC BY 4.0, consultar LICENSE-SCOPE |

## Material docente histórico propio

| Repositorio | Propósito y cambio | Estado / PR | Licencia y reutilización |
|---|---|---|---|
| [ALDC-Workshop-BC-Winter-Fest](https://github.com/javiarmesto/ALDC-Workshop-BC-Winter-Fest) | Actualizar enlace canónico preservando edición; Separar edición histórica de instalación actual y enlazar ejercicios | Documentación fusionada · [#1](https://github.com/javiarmesto/ALDC-Workshop-BC-Winter-Fest/pull/1) | MIT |
| [aldc-workshop-starters](https://github.com/javiarmesto/aldc-workshop-starters) | Conservar clon integrado y ofrecer portal local sin depender de URL anterior; Recorrido por bloques, edición y alcance pendiente de licencia | Documentación fusionada · [#4](https://github.com/javiarmesto/aldc-workshop-starters/pull/4) | Pendiente de aclarar |
| [companial-workshop-2026](https://github.com/javiarmesto/companial-workshop-2026) | Presentar edición pasada; corregir CEST y distinguir plantilla fijada de main actual; Portal de edición y resultado de la copia del participante | Documentación fusionada · [#3](https://github.com/javiarmesto/companial-workshop-2026/pull/3) | MIT; contenidos CC BY 4.0, consultar LICENSE-SCOPE |
| [Lab1_1_Template_Copilot_FrameWork](https://github.com/javiarmesto/Lab1_1_Template_Copilot_FrameWork) | Retirar contacto de plantilla; Inicio rápido completo y explicar autorización sin implementar | Documentación fusionada · [#1](https://github.com/javiarmesto/Lab1_1_Template_Copilot_FrameWork/pull/1) | Pendiente de aclarar |
| [Lab1_2_Simple](https://github.com/javiarmesto/Lab1_2_Simple) | Conservar corrección integrada de clonado; Propósito, manifiesto, sandbox, resultado y colisión con Lab1_1 | Documentación fusionada · [#2](https://github.com/javiarmesto/Lab1_2_Simple/pull/2) | Pendiente de aclarar |
| [Lab1_3_Ejemplo_Explicativo](https://github.com/javiarmesto/Lab1_3_Ejemplo_Explicativo) | Conservar URL integrada y evitar instrucciones de incrustar secretos; Explicar sustituciones, requisitos AI Test Toolkit y resultado | Documentación fusionada · [#2](https://github.com/javiarmesto/Lab1_3_Ejemplo_Explicativo/pull/2) | Pendiente de aclarar |
| [Lab2_0_Primeros_Pasos](https://github.com/javiarmesto/Lab2_0_Primeros_Pasos) | Localizar las instrucciones reales; Enlaces por rol, proyecto independiente y versión no fijada | Documentación fusionada · [#1](https://github.com/javiarmesto/Lab2_0_Primeros_Pasos/pull/1) | Pendiente de aclarar |
| [Lab2_2_0_VibeCoding-Inicial](https://github.com/javiarmesto/Lab2_2_0_VibeCoding-Inicial) | Distinguir requisitos de app instalable e inicio con AL Go | Documentación fusionada · [#1](https://github.com/javiarmesto/Lab2_2_0_VibeCoding-Inicial/pull/1) | Pendiente de aclarar |
| [Lab2_2_Laboratorio-60min](https://github.com/javiarmesto/Lab2_2_Laboratorio-60min) | Contextualizar BC22 y evitar colisiones entre proyectos de comparación | Documentación fusionada · [#1](https://github.com/javiarmesto/Lab2_2_Laboratorio-60min/pull/1) | Pendiente de aclarar |

## Ejemplo ficticio del libro

| Repositorio | Propósito y cambio | Estado / PR | Licencia y reutilización |
|---|---|---|---|
| [bc-tech-summit-2027](https://github.com/javiarmesto/bc-tech-summit-2027) | Explicar evento ficticio, apertura sin build, asistente externo y límites; corregir erratas | Documentación fusionada · [#1](https://github.com/javiarmesto/bc-tech-summit-2027/pull/1) | Pendiente de aclarar |

## Forks — conservar procedencia

| Repositorio | Propósito y cambio | Estado / PR | Licencia y reutilización |
|---|---|---|---|
| [AL-Copilot-Skills-Collection](https://github.com/javiarmesto/AL-Copilot-Skills-Collection) | Parent: [fernandoartalf/AL-Copilot-Skills-Collection](https://github.com/fernandoartalf/AL-Copilot-Skills-Collection). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento | Documentación fusionada · [#2](https://github.com/javiarmesto/AL-Copilot-Skills-Collection/pull/2) | MIT |
| [AL-Go](https://github.com/javiarmesto/AL-Go) | Parent: [microsoft/AL-Go](https://github.com/microsoft/AL-Go). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento | Documentación fusionada · [#1](https://github.com/javiarmesto/AL-Go/pull/1) | MIT |
| [al-lsp-for-agents](https://github.com/javiarmesto/al-lsp-for-agents) | Parent: [SShadowS/al-lsp-for-agents](https://github.com/SShadowS/al-lsp-for-agents). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento; aclarar Darwin/Python ausentes del checkout | Documentación fusionada · [#1](https://github.com/javiarmesto/al-lsp-for-agents/pull/1) | Pendiente de aclarar |
| [alguidelines](https://github.com/javiarmesto/alguidelines) | Parent: [microsoft/alguidelines](https://github.com/microsoft/alguidelines). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento; corregir protocolo duplicado en GitHub Pages | Documentación fusionada · [#1](https://github.com/javiarmesto/alguidelines/pull/1) | MIT |
| [ALTestScribe](https://github.com/javiarmesto/ALTestScribe) | Parent: [cperezsx/ALTestScribe](https://github.com/cperezsx/ALTestScribe). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento | Documentación fusionada · [#1](https://github.com/javiarmesto/ALTestScribe/pull/1) | MIT |
| [BC-Bench](https://github.com/javiarmesto/BC-Bench) | Parent: [microsoft/BC-Bench](https://github.com/microsoft/BC-Bench). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento | Pendiente: CI fallida · [#2](https://github.com/javiarmesto/BC-Bench/pull/2) | MIT |
| [bc-code-atlas](https://github.com/javiarmesto/bc-code-atlas) | Parent: [StefanMaron/bc-code-atlas](https://github.com/StefanMaron/bc-code-atlas). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento | Pendiente: CI fallida · [#1](https://github.com/javiarmesto/bc-code-atlas/pull/1) | MIT |
| [BCApps](https://github.com/javiarmesto/BCApps) | Parent: [microsoft/BCApps](https://github.com/microsoft/BCApps). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento | Pendiente: CI fallida · [#1](https://github.com/javiarmesto/BCApps/pull/1) | MIT |
| [BCQuality](https://github.com/javiarmesto/BCQuality) | Parent: [microsoft/BCQuality](https://github.com/microsoft/BCQuality). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento | Documentación fusionada · [#4](https://github.com/javiarmesto/BCQuality/pull/4) | MIT |
| [BCTech](https://github.com/javiarmesto/BCTech) | Parent: [microsoft/BCTech](https://github.com/microsoft/BCTech). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento | Documentación fusionada · [#1](https://github.com/javiarmesto/BCTech/pull/1) | MIT |
| [bcxman](https://github.com/javiarmesto/bcxman) | Parent: [Theil-IT/bcxman](https://github.com/Theil-IT/bcxman). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento; introducción, manifiesto y primer recorrido de traducción | Documentación fusionada · [#1](https://github.com/javiarmesto/bcxman/pull/1) | Pendiente de aclarar |
| [graphify-al](https://github.com/javiarmesto/graphify-al) | Parent: [ChristianHovenbitzer/graphify-al](https://github.com/ChristianHovenbitzer/graphify-al). Nota breve de fork con parent real, comparación, atribuciones y límites de mantenimiento; distinguir parent inmediato ChristianHovenbitzer de linaje graphify original | Pendiente: comprobaciones en curso · [#1](https://github.com/javiarmesto/graphify-al/pull/1) | Apache-2.0; conservar NOTICE y LICENSE-MIT |
| [MyApp](https://github.com/javiarmesto/MyApp) | Parent: [AL-Go-Workshop/MyApp](https://github.com/AL-Go-Workshop/MyApp). Atribuir fork, variantes BC25, dependencias ausentes y mensajes comentados | Pendiente: comprobaciones en curso · [#1](https://github.com/javiarmesto/MyApp/pull/1) | Pendiente de aclarar |

## Topics antes y después — aplicados y verificados

Se conservó cada topic previo. `bcopensource` figura en **18 repositorios** cuya licencia y relación BC se han comprobado; los otros 17 no reciben esa etiqueta. En aldc-workshop-starters se conserva la declaración MIT del README, pero falta aclarar su alcance mediante un archivo de licencia. BCXMAN contiene permiso de uso/modificación en Warrenty.txt; no se infiere de ello una licencia estándar o un permiso inequívoco de redistribución.

| Repositorio | Antes | Después |
|---|---|---|
| [AL-Copilot-Skills-Collection](https://github.com/javiarmesto/AL-Copilot-Skills-Collection) | — | al, bcopensource, business-central, dynamics365, fork |
| [AL-Go](https://github.com/javiarmesto/AL-Go) | — | al, bcopensource, business-central, dynamics365, fork |
| [al-lsp-for-agents](https://github.com/javiarmesto/al-lsp-for-agents) | — | al, business-central, dynamics365, fork |
| [ALDC-AL-Development-Collection](https://github.com/javiarmesto/ALDC-AL-Development-Collection) | agentic-workflow, al, bcopensource, github-copilot | agentic-workflow, al, aldc, bcopensource, business-central, dynamics365, github-copilot |
| [ALDC-Workshop-BC-Winter-Fest](https://github.com/javiarmesto/ALDC-Workshop-BC-Winter-Fest) | aldc, business-central, community-workshop, github-copilot | al, aldc, bcopensource, business-central, community-workshop, dynamics365, github-copilot, workshop |
| [aldc-workshop-lab](https://github.com/javiarmesto/aldc-workshop-lab) | — | al, aldc, bcopensource, business-central, dynamics365, github-copilot, workshop |
| [aldc-workshop-starters](https://github.com/javiarmesto/aldc-workshop-starters) | — | al, aldc, business-central, dynamics365, github-copilot, workshop |
| [alguidelines](https://github.com/javiarmesto/alguidelines) | — | al, bcopensource, business-central, dynamics365, fork |
| [ALTestScribe](https://github.com/javiarmesto/ALTestScribe) | — | al, bcopensource, business-central, dynamics365, fork |
| [AL_Onedrive](https://github.com/javiarmesto/AL_Onedrive) | — | al, business-central, dynamics365 |
| [APM-ALDC](https://github.com/javiarmesto/APM-ALDC) | — | al, aldc, bcopensource, business-central, dynamics365, github-copilot |
| [Atico-a-Business-Central-M365-Cowork-plugin-guide](https://github.com/javiarmesto/Atico-a-Business-Central-M365-Cowork-plugin-guide) | — | bcopensource, business-central, dynamics365, mcp, model-context-protocol |
| [BC-Bench](https://github.com/javiarmesto/BC-Bench) | — | al, bcopensource, business-central, dynamics365, fork |
| [BC-Bench-Guide](https://github.com/javiarmesto/BC-Bench-Guide) | — | al, business-central, dynamics365 |
| [bc-code-atlas](https://github.com/javiarmesto/bc-code-atlas) | — | al, bcopensource, business-central, dynamics365, fork, mcp, model-context-protocol |
| [bc-tech-summit-2027](https://github.com/javiarmesto/bc-tech-summit-2027) | — | business-central, dynamics365 |
| [BCApps](https://github.com/javiarmesto/BCApps) | — | al, bcopensource, business-central, dynamics365, fork |
| [BCQuality](https://github.com/javiarmesto/BCQuality) | — | al, bcopensource, business-central, dynamics365, fork |
| [BCTech](https://github.com/javiarmesto/BCTech) | — | al, bcopensource, business-central, dynamics365, fork |
| [bcxman](https://github.com/javiarmesto/bcxman) | — | al, business-central, dynamics365, fork |
| [CIRCE-Agent-Squad-for-Microsoft-Copilot-Studio](https://github.com/javiarmesto/CIRCE-Agent-Squad-for-Microsoft-Copilot-Studio) | — | bcopensource, business-central, dynamics365, mcp, model-context-protocol |
| [companial-workshop-2026](https://github.com/javiarmesto/companial-workshop-2026) | — | al, aldc, bcopensource, business-central, dynamics365, github-copilot, workshop |
| [graphify-al](https://github.com/javiarmesto/graphify-al) | — | al, bcopensource, business-central, dynamics365, fork |
| [ItemSubTool](https://github.com/javiarmesto/ItemSubTool) | — | al, business-central, dynamics365 |
| [Lab1_1_Template_Copilot_FrameWork](https://github.com/javiarmesto/Lab1_1_Template_Copilot_FrameWork) | — | al, business-central, dynamics365, workshop |
| [Lab1_2_Simple](https://github.com/javiarmesto/Lab1_2_Simple) | — | al, business-central, dynamics365, workshop |
| [Lab1_3_Ejemplo_Explicativo](https://github.com/javiarmesto/Lab1_3_Ejemplo_Explicativo) | — | al, business-central, dynamics365, workshop |
| [Lab2_0_Primeros_Pasos](https://github.com/javiarmesto/Lab2_0_Primeros_Pasos) | — | al, business-central, dynamics365, workshop |
| [Lab2_2_0_VibeCoding-Inicial](https://github.com/javiarmesto/Lab2_2_0_VibeCoding-Inicial) | — | al, business-central, dynamics365, workshop |
| [Lab2_2_Laboratorio-60min](https://github.com/javiarmesto/Lab2_2_Laboratorio-60min) | — | al, business-central, dynamics365, workshop |
| [Lab3_1_MCP_BusinessCentral](https://github.com/javiarmesto/Lab3_1_MCP_BusinessCentral) | — | business-central, dynamics365, mcp, model-context-protocol, workshop |
| [MyApp](https://github.com/javiarmesto/MyApp) | — | al, business-central, dynamics365, fork |
| [SampleDynamicsMinds](https://github.com/javiarmesto/SampleDynamicsMinds) | — | al, business-central, dynamics365 |
| [Workshop-Build-BC-mcp-CS-Agent](https://github.com/javiarmesto/Workshop-Build-BC-mcp-CS-Agent) | — | bcopensource, business-central, dynamics365, mcp, model-context-protocol, workshop |
| [Workshop-MCP-Server-Directions-Lab](https://github.com/javiarmesto/Workshop-MCP-Server-Directions-Lab) | al, businesscentral, mcp-server, python | al, business-central, businesscentral, dynamics365, mcp, mcp-server, model-context-protocol, python, workshop |

## Comprobaciones por repositorio

| Repositorio / PR | Evidencia |
|---|---|
| [AL-Copilot-Skills-Collection](https://github.com/javiarmesto/AL-Copilot-Skills-Collection) · [#2](https://github.com/javiarmesto/AL-Copilot-Skills-Collection/pull/2) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [AL-Go](https://github.com/javiarmesto/AL-Go) · [#1](https://github.com/javiarmesto/AL-Go/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [al-lsp-for-agents](https://github.com/javiarmesto/al-lsp-for-agents) · [#1](https://github.com/javiarmesto/al-lsp-for-agents/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [ALDC-AL-Development-Collection](https://github.com/javiarmesto/ALDC-AL-Development-Collection) · [#122](https://github.com/javiarmesto/ALDC-AL-Development-Collection/pull/122) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [ALDC-Workshop-BC-Winter-Fest](https://github.com/javiarmesto/ALDC-Workshop-BC-Winter-Fest) · [#1](https://github.com/javiarmesto/ALDC-Workshop-BC-Winter-Fest/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [aldc-workshop-lab](https://github.com/javiarmesto/aldc-workshop-lab) · [#9](https://github.com/javiarmesto/aldc-workshop-lab/pull/9) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [aldc-workshop-starters](https://github.com/javiarmesto/aldc-workshop-starters) · [#4](https://github.com/javiarmesto/aldc-workshop-starters/pull/4) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [alguidelines](https://github.com/javiarmesto/alguidelines) · [#1](https://github.com/javiarmesto/alguidelines/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [ALTestScribe](https://github.com/javiarmesto/ALTestScribe) · [#1](https://github.com/javiarmesto/ALTestScribe/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [AL_Onedrive](https://github.com/javiarmesto/AL_Onedrive) · [#1](https://github.com/javiarmesto/AL_Onedrive/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [APM-ALDC](https://github.com/javiarmesto/APM-ALDC) · [#12](https://github.com/javiarmesto/APM-ALDC/pull/12) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [Atico-a-Business-Central-M365-Cowork-plugin-guide](https://github.com/javiarmesto/Atico-a-Business-Central-M365-Cowork-plugin-guide) · [#1](https://github.com/javiarmesto/Atico-a-Business-Central-M365-Cowork-plugin-guide/pull/1) | [validate](https://github.com/javiarmesto/Atico-a-Business-Central-M365-Cowork-plugin-guide/actions/runs/37434805558/job/112173900497): success |
| [BC-Bench](https://github.com/javiarmesto/BC-Bench) · [#2](https://github.com/javiarmesto/BC-Bench/pull/2) | [summarize-results / Results](https://github.com/javiarmesto/BC-Bench/actions/runs/37435848743/job/112177742275): failure; [Test Run for nl2al__customer-account-manager-field-1](https://github.com/javiarmesto/BC-Bench/actions/runs/37435848743/job/112177608517): success; [Test Run for nl2al__vendor-card-hold-payments-toggle-1](https://github.com/javiarmesto/BC-Bench/actions/runs/37435848743/job/112177608495): success; [Test Run for nl2al__customer-list-salesperson-column-1](https://github.com/javiarmesto/BC-Bench/actions/runs/37435848743/job/112177608401): success; [Test Run for nl2al__login-audit-subscriber-1](https://github.com/javiarmesto/BC-Bench/actions/runs/37435848743/job/112177608373): success; [get-entries / get-entries](https://github.com/javiarmesto/BC-Bench/actions/runs/37435848743/job/112177467609): success; [lint-and-test](https://github.com/javiarmesto/BC-Bench/actions/runs/37435848743/job/112177330571): success; [select-category](https://github.com/javiarmesto/BC-Bench/actions/runs/37435848743/job/112177330365): success **Bloqueo:** summarize-results: Azure login cannot find client-id/tenant-id; no credentials supplied by this audit. |
| [BC-Bench-Guide](https://github.com/javiarmesto/BC-Bench-Guide) · [#1](https://github.com/javiarmesto/BC-Bench-Guide/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [bc-code-atlas](https://github.com/javiarmesto/bc-code-atlas) · [#1](https://github.com/javiarmesto/bc-code-atlas/pull/1) | [test (registry)](https://github.com/javiarmesto/bc-code-atlas/actions/runs/37435870835/job/112177405177): failure; [test (build)](https://github.com/javiarmesto/bc-code-atlas/actions/runs/37435870835/job/112177405071): success; [test (tools/graphify-al)](https://github.com/javiarmesto/bc-code-atlas/actions/runs/37435870835/job/112177405007): success; [test (scripts)](https://github.com/javiarmesto/bc-code-atlas/actions/runs/37435870835/job/112177404984): success; [search daemon survives a restart without reprocessing (constitution Principle VIII)](https://github.com/javiarmesto/bc-code-atlas/actions/runs/37435870835/job/112177404818): success; [smoke-import (aggregator, chunker)](https://github.com/javiarmesto/bc-code-atlas/actions/runs/37435870835/job/112177404591): success **Bloqueo:** registry/tests/test_resolver.py:94 expects upstream commit 42ac68b... but resolves 5b235a3...; 31 tests passed and 1 failed. |
| [bc-tech-summit-2027](https://github.com/javiarmesto/bc-tech-summit-2027) · [#1](https://github.com/javiarmesto/bc-tech-summit-2027/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [BCApps](https://github.com/javiarmesto/BCApps) · [#1](https://github.com/javiarmesto/BCApps/pull/1) | [Code Analysis Processing](https://github.com/javiarmesto/BCApps/actions/runs/37435899134/job/112178420376): skipped; [Build ${{ matrix.projectName }} (${{ matrix.buildMode }})](https://github.com/javiarmesto/BCApps/actions/runs/37435899134/job/112178418616): skipped; [Pull Request Status Check](https://github.com/javiarmesto/BCApps/actions/runs/37435899134/job/112178417898): failure; [Build System Application, Business Foundation and Tools (Clean) / System Application, Business Foundation and Tools (Clean)](https://github.com/javiarmesto/BCApps/actions/runs/37435899134/job/112177963505): failure; [Build Test Stability Tools (Default) / Test Stability Tools (Default)](https://github.com/javiarmesto/BCApps/actions/runs/37435899134/job/112177963416): failure; [Build Test Stability Tools (Clean) / Test Stability Tools (Clean)](https://github.com/javiarmesto/BCApps/actions/runs/37435899134/job/112177963402): failure; [Build System Application, Business Foundation and Tools (Default) / System Application, Business Foundation and Tools (Default)](https://github.com/javiarmesto/BCApps/actions/runs/37435899134/job/112177963356): failure; [PregateCheck](https://github.com/javiarmesto/BCApps/actions/runs/37435899134/job/112177500774): skipped; [Initialization](https://github.com/javiarmesto/BCApps/actions/runs/37435899134/job/112177499385): success; [For Microsoft: Validate link to internal work items](https://github.com/javiarmesto/BCApps/actions/runs/37435898431/job/112177499046): skipped; [Validate link to issues](https://github.com/javiarmesto/BCApps/actions/runs/37435898431/job/112177498712): skipped; [Label](https://github.com/javiarmesto/BCApps/actions/runs/37435898552/job/112177497987): skipped; [Verify App Changes](https://github.com/javiarmesto/BCApps/actions/runs/37435898834/job/112177496515): success **Bloqueo:** AL-Go cannot find configured artifact bcinsider/Sandbox/29.0.49708.0//latest. |
| [BCQuality](https://github.com/javiarmesto/BCQuality) · [#4](https://github.com/javiarmesto/BCQuality/pull/4) | [guard](https://github.com/javiarmesto/BCQuality/actions/runs/37435983917/job/112177779477): skipped; [flag](https://github.com/javiarmesto/BCQuality/actions/runs/37435983940/job/112177779275): skipped; [validate](https://github.com/javiarmesto/BCQuality/actions/runs/37435983457/job/112177774446): success; [validate-index](https://github.com/javiarmesto/BCQuality/actions/runs/37435983413/job/112177774337): success; [validate-contract](https://github.com/javiarmesto/BCQuality/actions/runs/37435983429/job/112177774279): success; [validate-review-fixtures](https://github.com/javiarmesto/BCQuality/actions/runs/37435983417/job/112177773977): success |
| [BCTech](https://github.com/javiarmesto/BCTech) · [#1](https://github.com/javiarmesto/BCTech/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [bcxman](https://github.com/javiarmesto/bcxman) · [#1](https://github.com/javiarmesto/bcxman/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [CIRCE-Agent-Squad-for-Microsoft-Copilot-Studio](https://github.com/javiarmesto/CIRCE-Agent-Squad-for-Microsoft-Copilot-Studio) · [#6](https://github.com/javiarmesto/CIRCE-Agent-Squad-for-Microsoft-Copilot-Studio/pull/6) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [companial-workshop-2026](https://github.com/javiarmesto/companial-workshop-2026) · [#3](https://github.com/javiarmesto/companial-workshop-2026/pull/3) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [graphify-al](https://github.com/javiarmesto/graphify-al) · [#1](https://github.com/javiarmesto/graphify-al/pull/1) | [security-scan](https://github.com/javiarmesto/graphify-al/actions/runs/37436056920/job/112178025478): success; [skillgen-check](https://github.com/javiarmesto/graphify-al/actions/runs/37436056920/job/112178025449): success; [test (3.12)](https://github.com/javiarmesto/graphify-al/actions/runs/37436056920/job/112178025284): success |
| [ItemSubTool](https://github.com/javiarmesto/ItemSubTool) · [#1](https://github.com/javiarmesto/ItemSubTool/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [Lab1_1_Template_Copilot_FrameWork](https://github.com/javiarmesto/Lab1_1_Template_Copilot_FrameWork) · [#1](https://github.com/javiarmesto/Lab1_1_Template_Copilot_FrameWork/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [Lab1_2_Simple](https://github.com/javiarmesto/Lab1_2_Simple) · [#2](https://github.com/javiarmesto/Lab1_2_Simple/pull/2) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [Lab1_3_Ejemplo_Explicativo](https://github.com/javiarmesto/Lab1_3_Ejemplo_Explicativo) · [#2](https://github.com/javiarmesto/Lab1_3_Ejemplo_Explicativo/pull/2) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [Lab2_0_Primeros_Pasos](https://github.com/javiarmesto/Lab2_0_Primeros_Pasos) · [#1](https://github.com/javiarmesto/Lab2_0_Primeros_Pasos/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [Lab2_2_0_VibeCoding-Inicial](https://github.com/javiarmesto/Lab2_2_0_VibeCoding-Inicial) · [#1](https://github.com/javiarmesto/Lab2_2_0_VibeCoding-Inicial/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [Lab2_2_Laboratorio-60min](https://github.com/javiarmesto/Lab2_2_Laboratorio-60min) · [#1](https://github.com/javiarmesto/Lab2_2_Laboratorio-60min/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [Lab3_1_MCP_BusinessCentral](https://github.com/javiarmesto/Lab3_1_MCP_BusinessCentral) · [#1](https://github.com/javiarmesto/Lab3_1_MCP_BusinessCentral/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [MyApp](https://github.com/javiarmesto/MyApp) · [#1](https://github.com/javiarmesto/MyApp/pull/1) | [Build DK (Default) / DK (Default)](https://github.com/javiarmesto/MyApp/actions/runs/37435174880/job/112175345233): in_progress; [Build W1 (Default) / W1 (Default)](https://github.com/javiarmesto/MyApp/actions/runs/37435174880/job/112175345223): in_progress; [Build ES (Default) / ES (Default)](https://github.com/javiarmesto/MyApp/actions/runs/37435174880/job/112175345111): in_progress; [PregateCheck](https://github.com/javiarmesto/MyApp/actions/runs/37435174880/job/112175112169): skipped; [Initialization](https://github.com/javiarmesto/MyApp/actions/runs/37435174880/job/112175111150): success |
| [SampleDynamicsMinds](https://github.com/javiarmesto/SampleDynamicsMinds) · [#1](https://github.com/javiarmesto/SampleDynamicsMinds/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [Workshop-Build-BC-mcp-CS-Agent](https://github.com/javiarmesto/Workshop-Build-BC-mcp-CS-Agent) · [#1](https://github.com/javiarmesto/Workshop-Build-BC-mcp-CS-Agent/pull/1) | Sin checks publicados en la PR; diff y referencias inspeccionados |
| [Workshop-MCP-Server-Directions-Lab](https://github.com/javiarmesto/Workshop-MCP-Server-Directions-Lab) · [#2](https://github.com/javiarmesto/Workshop-MCP-Server-Directions-Lab/pull/2) | Sin checks publicados en la PR; diff y referencias inspeccionados |

## PR existentes reutilizadas

- [ALDC #122](https://github.com/javiarmesto/ALDC-AL-Development-Collection/pull/122): ampliada para corregir estado y contadores e incorporar este catálogo; consultar su estado final en GitHub.
- [aldc-workshop-starters #3](https://github.com/javiarmesto/aldc-workshop-starters/pull/3), [Lab1_2_Simple #1](https://github.com/javiarmesto/Lab1_2_Simple/pull/1) y [Lab1_3_Ejemplo_Explicativo #1](https://github.com/javiarmesto/Lab1_3_Ejemplo_Explicativo/pull/1): fusionadas después de revisar las correcciones de clonado. Las PR posteriores amplían la entrada, no duplican propuestas abiertas.
- Winter Fest: después de #1, el commit [f17a983](https://github.com/javiarmesto/ALDC-Workshop-BC-Winter-Fest/commit/f17a983b23fc5c85f164484bc03a5325275bbad8) sustituye los comandos de instalación obsoletos; solo README.

## Decisiones y actuaciones pendientes

1. **Credenciales:** Lab3_1 contenía un valor de Client Secret sin apariencia de ejemplo en `deploy.zip` → `.env`, línea 2, y un identificador ID_SECRET en línea 7. El ZIP y los logs generados se retiraron del árbol actual. AL_Onedrive conserva un Client Secret en `src/Page50112-OneDriveWebhookSetup.al:101`, dentro de EnsureInit. No se muestran ni se han usado esos valores. Revocar el secreto expuesto en su aplicación de Entra ID, emitir uno nuevo para los despliegues necesarios y revisar inicios de sesión. No se ha reescrito historial; retirar un archivo no neutraliza su exposición anterior.
2. **Cambio funcional separado:** retirar la credencial/inicialización personal de AL_Onedrive, corregir el empaquetado de Lab3 y revisar el banner STDIO de Lab3. No se han modificado esos scripts/objetos en esta auditoría.
3. **Licencias:** decidir el alcance de reutilización en los 17 casos pendientes. No se eligió ni añadió una licencia nueva.
4. **CI de forks:** resolver los bloqueos registrados sin cambiar versiones funcionales, credenciales ni saltarse checks. MyApp/graphify-al pueden seguir en ejecución; la PR enlazada es la autoridad sobre su estado actual.
5. **Artefactos conservados:** `.alpackages/`, el `.app` de Lab1_2 y `bc_server_bkp/` permanecen. No se ha demostrado que todo ese material sea prescindible para ejercicios offline; el backup contiene documentación única.

No se encontró un repositorio de perfil público `javiarmesto/javiarmesto`; la consulta autenticada también devolvió 404. Este catálogo se publica en ALDC y se enlaza desde su README. No se creó un repositorio de perfil ni se cambiaron visibilidades.
