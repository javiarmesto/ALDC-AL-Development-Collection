# Fase 3 — Validación end-to-end

## Metadatos de ejecución

- **Rama de origen:** `main` (con las fases 1 y 2 mergeadas)
- **Rama a crear:** `feat/apm-phase-3-validation`
- **Repositorio:** repo principal de ALDC en GitHub bajo TechSphere Dynamics
- **Directorio de trabajo:** raíz del repo, más un directorio temporal externo simulando un proyecto cliente
- **Sesión esperada:** 1 (corta)
- **Pre-requisitos:** fases 1 y 2 mergeadas y validadas en `main`. APM instalado en el sistema (https://microsoft.github.io/apm/getting-started/quick-start/).

## Comando previo a la sesión

Desde la raíz del repo, en una terminal:

\`\`\`bash
git checkout main
git pull origin main
git checkout -b feat/apm-phase-3-validation
\`\`\`

A continuación, abrir Claude Code en la raíz del repo y pegar el prompt de abajo.

## Prompt

Contexto: las fases 1 y 2 están completas y mergeadas. El repo de ALDC tiene los manifiestos `apm.yml` listos pero todavía no se ha publicado ningún tag oficial.

Esta sesión cubre la fase 3: validación end-to-end de la instalación vía APM en un entorno limpio.

Pasos a ejecutar:

1. Crea un tag temporal `v3.2.1-apm-rc1` en una rama dedicada para no contaminar el versionado oficial. Este tag servirá solo para esta validación.
2. Crea un directorio temporal fuera del repo simulando un proyecto cliente BC AL nuevo. Inicializa ahí un `apm.yml` mínimo que declare como única dependencia `techspheredynamics/aldc@3.2.1-apm-rc1` apuntando al repo local mediante `git:` con ruta de fichero, para no depender de GitHub todavía.
3. Ejecuta `apm install` y captura la salida completa. Si APM no está instalado en el entorno, instálalo siguiendo las instrucciones oficiales de https://microsoft.github.io/apm/getting-started/quick-start/.
4. Una vez instalado, verifica que en el directorio del proyecto cliente simulado aparecen las skills, hooks e instructions en sus targets correctos, conforme a los exports declarados en cada subpaquete.
5. Ejecuta `apm audit` y captura la salida. Documenta cualquier warning o error.
6. Abre Claude Code en el directorio del proyecto cliente simulado y verifica que las skills de ALDC están disponibles y que los hooks se registran correctamente.

Si algo falla, NO intentes arreglarlo automáticamente. Documenta el fallo en un informe estructurado con: comando ejecutado, salida obtenida, salida esperada, hipótesis de causa raíz. Yo decidiré qué fase de las anteriores hay que retocar.

Si todo funciona, prepara un informe de validación con captura de la estructura de ficheros instalada y la salida limpia de `apm audit`.

Aplica Skills Evidencing en el informe final.

Entregable único: `docs/apm/validation-report-rc1.md` con todo el detalle de la sesión, sin tocar código del repo principal.

## Validación post-sesión

Antes de abrir PR, verificar manualmente:

1. El informe `validation-report-rc1.md` documenta el resultado completo.
2. Si hubo fallos, están descritos sin parches reactivos.
3. Si todo pasó, el informe muestra estructura instalada y `apm audit` limpio.
4. El tag temporal `v3.2.1-apm-rc1` está correctamente etiquetado y no contamina la rama main.

## Salida esperada

PR contra `main` con título `docs(apm): phase 3 — end-to-end validation report`. Solo añade el informe; no toca código del repo.