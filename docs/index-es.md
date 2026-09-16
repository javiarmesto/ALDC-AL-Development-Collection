---
hide:
  - navigation
  - toc
---

# ALDC

<div class="hero">
<a class="hero-banner" href="#novedades">
  <span class="hero-banner__badge">NUEVO</span>
  <span class="hero-banner__text">ALDC 4.3.0 · ya disponible</span>
  <span class="hero-banner__arrow">→</span>
</a>
<div class="hero-eyebrow">ALDC · AL Agentic Engineering System · Business Central · <a href="../">English</a></div>
<h2 class="hero-title">Del requisito de negocio al desarrollo AL.</h2>
<div class="hero-annotation">Sistemas de ingeniería, con razonamiento visible.</div>
<p class="hero-tagline"><strong>Agentes de IA especializados. Revisión humana.</strong> Diseña la arquitectura, define especificaciones conectadas y coordina implementación, pruebas y revisión para Business Central. Tú decides en los puntos clave.</p>
<div class="hero-actions">
  <a class="md-button md-button--primary" href="../start-es/">Instala ALDC</a>
  <a class="md-button" href="#novedades">Explora las novedades</a>
  <a class="md-button" href="https://github.com/javiarmesto/ALDC-AL-Development-Collection">GitHub</a>
</div>
<p class="hero-subnote">La versión 4.3.0 está disponible para VS Code desde el Marketplace y para Copilot CLI, Claude Code y Codex desde el código etiquetado.</p>
<div class="hero-pills">
  <span class="pill">Architect → Spec → Conductor</span>
  <span class="pill pill--accent">Copilot Chat · CLI · Claude Code · Codex</span>
  <span class="pill pill--accent">AL18 · Tools · MCP</span>
  <span class="pill pill--version"><b>4.3.0</b> · MIT</span>
</div>
</div>

## Novedades de 4.3.0 { #novedades .section-title }

<div class="grid cards" markdown="1">

-   **Architect → Spec**

    ---

    Architect define unidades, contratos compartidos y dependencias. Spec desarrolla cada contrato y devuelve las contradicciones para una revisión conjunta.

-   **AL18 · Tools · MCP**

    ---

    Perfil BC29-native opcional para las herramientas AL disponibles en Copilot Chat. BC28 sigue por defecto; seleccionar perfil no instala herramientas ni cambia app.json.

-   **Doctor · BCQuality**

    ---

    Diagnóstico por operación y revisión opcional con BCQuality. Configuración, descubrimiento, carga y ejecución se registran como hechos diferentes.

-   **Actualización recuperable**

    ---

    Revisa colisiones, verifica lo instalado y restaura la transacción anterior cuando las comprobaciones lo permitan. La recuperación protege cambios posteriores.

-   **Project Manager**

    ---

    Un panel en VS Code, también disponible en el Explorador, para instalar, actualizar, verificar, restaurar y ejecutar Doctor sobre el proyecto elegido. Cada cambio se previsualiza y se confirma; los resultados se quedan en el panel.

-   **ALDC Visor**

    ---

    Árbol en el Explorador con los artefactos de cada requisito: requisitos, arquitectura, especificación, plan de pruebas, informes de fase y evidencias de revisión, cada uno con su icono. Solo lectura y siempre al día.

</div>

## Del diseño a una implementación revisable { #que-es .section-title }

Architect determina cuántas especificaciones necesita la solución, qué comparte cada una y cuáles pueden redactarse de forma independiente. Las dependencias de redacción y de implementación se evalúan por separado. El paralelismo real depende del host y de su ejecución; una planificación no demuestra que varios agentes hayan trabajado a la vez.

Spec concreta contratos técnicos y criterios de aceptación dentro del diseño aprobado. La revisión conjunta comprueba las versiones actuales antes de pasar a Conductor o Developer. Conductor coordina planificación, implementación con pruebas y revisión. Las skills aportan conocimiento de dominio cuando la tarea lo necesita.

[Conoce Spec Agent](../spec-agent/) · [Perfiles BC28 / BC29-native](../native-bc29/)

## Revisión con BCQuality { #bcquality .section-title }

BCQuality es opcional y se instala por separado. Elige modo plugin o workspace externo en `aldc.yaml`, con la identidad exacta del proveedor. La revisión distingue descubrimiento, carga, ejecución y generación del índice; mantiene la cobertura nativa cuando no hay resultados externos suficientes.

[Configurar BCQuality](../bcquality/)

## Tu entorno. Tu punto de partida. { #install .section-title }

<p class="section-lead">Elige dónde trabajas. Accede a los pasos de instalación, las comprobaciones y una primera petición para esa superficie.</p>
<div class="aldc-install-grid">
<a class="aldc-install-card" href="../start-es/?surface=vscode"><span class="resource-kicker">Extensión publicada</span><h3>GitHub Copilot</h3><p>VS Code</p><span class="resource-arrow">→</span></a>
<a class="aldc-install-card" href="../start-es/?surface=copilot-cli"><span class="resource-kicker">Desde código</span><h3>GitHub Copilot</h3><p>CLI</p><span class="resource-arrow">→</span></a>
<a class="aldc-install-card" href="../start-es/?surface=claude"><span class="resource-kicker">Desde código</span><h3>Claude Code</h3><p>Plugin</p><span class="resource-arrow">→</span></a>
<a class="aldc-install-card" href="../start-es/?surface=codex"><span class="resource-kicker">Desde código</span><h3>Codex</h3><p>Proyecto local</p><span class="resource-arrow">→</span></a>
</div>
<p class="hero-subnote">El VSIX actualiza la extensión de VS Code. El toolkit de cada proyecto y cada plugin de terminal tienen su propio paso de actualización.</p>

---

## Recursos { #recursos .section-title }

Todo lo de ALDC está aquí. Elige tu camino.

<div class="resource-grid">

  <a class="resource-card" href="../getting-started/">
    <span class="resource-kicker">Empieza aquí</span>
    <h3>Getting Started</h3>
    <p>Instala el toolkit y prepara tu primer requisito.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="../al-development/">
    <span class="resource-kicker">Guía</span>
    <h3>Guía de la colección</h3>
    <p>La guía pública de ALDC: arquitectura, primitivas, flujo, validación y adopción.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="../bcquality/">
    <span class="resource-kicker">Calidad</span>
    <h3>BCQuality</h3>
    <p>Reviews y auditorías citadas con conocimiento BC. Opcional y configurable.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="../agents/">
    <span class="resource-kicker">Roles</span>
    <h3>Agentes</h3>
    <p>Architect, Spec, Developer, Conductor, Pre-Sales — y bajo demanda Triage y Dredd.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="../prompts/">
    <span class="resource-kicker">Automatización</span>
    <h3>Workflows</h3>
    <p>6 workflows, de initialize a PR prepare. Invocables desde el chat.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="../instructions/">
    <span class="resource-kicker">Estándares</span>
    <h3>Instrucciones</h3>
    <p>9 estándares de AL siempre activos. Estilo, rendimiento, naming, errores, eventos.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="https://github.com/javiarmesto/ALDC-AL-Development-Collection">
    <span class="resource-kicker">Open source</span>
    <h3>Código fuente</h3>
    <p>Cada agente, skill y workflow. Licencia MIT. Star y fork bienvenidos.</p>
    <span class="resource-arrow">→</span>
  </a>

  <a class="resource-card" href="../CHANGELOG/">
    <span class="resource-kicker">Historial</span>
    <h3>Changelog</h3>
    <p>Releases, fixes y la evolución de la colección en el tiempo.</p>
    <span class="resource-arrow">→</span>
  </a>

</div>

---

<div class="footer-cta" markdown="1">

### ¿Listo para entregar features de BC con confianza? { .footer-cta-title }

[Instalar ALDC :material-download:](../getting-started/){ .md-button .md-button--primary }
[Abrir la guía de la colección :material-book-open-page-variant:](../al-development/){ .md-button }
[:material-star: &nbsp; Star en GitHub](https://github.com/javiarmesto/ALDC-AL-Development-Collection){ .md-button }

</div>

<div class="status-footer" markdown="1">

`✓ ALDC Core v1.1 COMPLIANT` &nbsp;·&nbsp; `v4.1.0` &nbsp;·&nbsp; `MIT` &nbsp;·&nbsp; Hecho por [Javier Armesto](https://www.linkedin.com/in/javiarmesto) &nbsp;·&nbsp; [English](../)

</div>
