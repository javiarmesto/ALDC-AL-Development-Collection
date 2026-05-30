---
applyTo: "**/*Factory.Codeunit.al, **/*Metadata.Codeunit.al, **/*TaskExecution.Codeunit.al, **/*Setup.Codeunit.al"
description: "AL Agent Toolkit / BC Agents Pack — non-negotiable rules for code involving the AI Development Toolkit or Agent SDK"
---

# AL Agent Toolkit — Always-On Rules

Reglas que se aplican siempre que se edite código AL relacionado con el AI Development Toolkit o Agent SDK. Solo reglas. El conocimiento detallado (arquitectura, firmas de interfaces, patterns) vive en skills.

## Knowledge sources

Para contenido detallado, carga el skill correspondiente:

| Skill                          | Cuándo                                                                   |
| ------------------------------ | ------------------------------------------------------------------------ |
| `skill-agent-toolkit`          | Arquitectura SDK, 3 interfaces, Setup Codeunit, ConfigurationDialog, Install/Upgrade, project structure |
| `skill-agent-task-patterns`    | Public API, Agent Task Builder, attachments, multi-turn, session detection, API availability por runtime |
| `skill-agent-instructions`     | Redactar `InstructionsV1.txt` (framework RGI + keywords)                 |

## Non-negotiable rules

1. **Public API es el entry point estándar** — toda creación de tasks pasa por un codeunit `Access = Public`; el resto de patterns (page action, event subscriber, multi-turn) llama por aquí.
2. **TryFunction obligatorio en event-driven task creation** — nunca se bloquea un posting/release/approval por un fallo del agente.
3. **Filtrar antes de crear** — la condición de negocio se evalúa ANTES del `Create()` del task builder, nunca dentro.
4. **Telemetría en cada fallo** — `Session.LogMessage` con categoría y `GetLastErrorText()`. Sin excepción.
5. **ExternalId con convención `{PREFIX}-{No.}`** — `SO-1001`, `LEAD-001`, `INV-103456`, `EMAIL-{threadId}`. Nunca GUID, nunca número correlativo.
6. **Mensaje del task contiene TODO el contexto** — el agente solo sabe lo que se le pasa por el mensaje + adjuntos.
7. **Agent Task Message Builder** se usa para attachments y para controlar sanitización; nunca se manipulan campos del builder por reflexión.
8. **Instrucciones en inglés** — los safeguards del runtime están optimizados para inglés.

## Naming conventions

| Objeto                       | Patrón                                                      |
| ---------------------------- | ----------------------------------------------------------- |
| Copilot Capability EnumExt   | `"{Agent} Copilot Capability"` extends `"Copilot Capability"` |
| Metadata Provider EnumExt    | `"{Agent} Metadata Provider"` extends `"Agent Metadata Provider"` |
| Factory codeunit             | `{Agent}Factory` implements `IAgentFactory`                 |
| Metadata codeunit            | `{Agent}Metadata` implements `IAgentMetadata`               |
| Task Execution codeunit      | `{Agent}TaskExecution` implements `IAgentTaskExecution`     |
| Setup codeunit               | `"{Agent} Setup"` — lógica centralizada                     |
| Install codeunit             | `"{Agent} Install"` (Subtype = Install)                     |
| Upgrade codeunit             | `"{Agent} Upgrade"` (Subtype = Upgrade)                     |
| Public API codeunit          | `"{Agent} Public API"` (Access = Public) + Impl internal    |
| Setup table                  | `"{Agent} Setup"` (PK = `"User Security ID": Guid`)         |
| KPI table / page             | `"{Agent} KPI"` / CardPart                                  |
| Setup page                   | `"{Agent} Setup"` (PageType = ConfigurationDialog)          |
| Profile / RoleCenter         | `"{Agent} Profile"` / `"{Agent} Role Center"`               |
| PermissionSet                | `"{Agent}"` (Assignable, incluye D365 BASIC)                |

## ConfigurationDialog page — invariantes

`PageType = ConfigurationDialog` exige:

- `SourceTableTemporary = true`
- `Extensible = false`
- `InherentEntitlements = X` + `InherentPermissions = X`
- Primer elemento del layout: `part(AgentSetupPart; "Agent Setup Part")`
- `OnOpenPage` comprueba `AzureOpenAI.IsEnabled(<capability>)`
- `OnQueryClosePage` delega en el Setup Codeunit
- System actions: `OK` (gated por `IsUpdated`) + `Cancel`, sin custom triggers

## Project structure (referencia)

```
app/
├── .resources/Instructions/InstructionsV1.txt
├── Example/        (PageExt + PublicAPI + Impl)
├── Integration/    (CopilotCapability EnumExt + Install + Upgrade)
└── Setup/
    ├── {Agent}Setup.{Codeunit,Page,Table}.al
    ├── KPI/
    ├── Metadata/   (Factory + Metadata + MetadataProvider EnumExt)
    ├── Permissions/
    ├── Profile/    (Profile + RoleCenter + PageCustomizations)
    └── TaskExecution/
```

Detalle de cada carpeta y ejemplos completos en `skill-agent-toolkit`.
