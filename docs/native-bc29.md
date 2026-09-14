# BC28 and BC29 native profiles

ALDC provides two installation profiles for GitHub Copilot Chat in VS Code.

| Profile | Behavior |
| --- | --- |
| `bc28` | Default for a new installation; retains the compatible canonical tool contracts. |
| `bc29-native` | Projects agent permissions and guidance onto native AL tools for the target host. |

Selecting a profile does not install or upgrade BC, AL Language, project runtime
or dependencies. Keep the manifest and symbols aligned with the actual target.

## Installation and updates

From the consumer project's root, use an existing canonical checkout:

```sh
node /path/to/aldc/scripts/install.js install --profile bc29-native --dry-run
node /path/to/aldc/scripts/install.js install --profile bc29-native --yes
node /path/to/aldc/scripts/install.js verify-install
```

The installer operates on the current project directory. A profile switch over
existing toolkit files requires reviewed replacement with `--force`; it can replace
customizations and shared toolkit configuration. Updates without an explicit
profile preserve the installed choice. Unknown or customized files remain visible
collisions unless replacement is authorized. Existing memory is preserved.

`rollback` restores the preceding installation transaction if subsequent edits
would not be lost. Selecting BC28 again changes contracts; it is not a restoration
of earlier bytes. See [installation and recovery](plugin-packaging.md).

## Native tools and agent responsibilities

Native search and diagnostics support design, specification and review. Developer
and Implementation Subagent additionally use approved dependency downloads and
builds; debugging belongs to authorized implementation/diagnosis roles. Conductor
coordinates the workflow without acquiring every specialist's tools.

Spec Agent owns specification and technical research before implementation.
Architecture, specification approval and Conductor's existing gates remain in force.
Consult the [native tool contract](framework/native-al-tools.md) for exact identifiers,
argument boundaries and discovery requirements. A declared permission is not evidence
that a tool is available or has run.

A sufficient native capability does not require an equivalent community MCP server.
BCQuality remains an optional knowledge provider. When a native tool is unavailable,
identify the missing capability and use an appropriate available source or task;
do not invent tools or treat a fallback as equivalent without evidence.

## Plugins de Claude Code y Copilot CLI

Terminal distributions use their own tool contracts and do not consume VS Code
language-model tool names. Install the dedicated Claude or Copilot CLI package;
Codex has a separate generated adapter. The Chat profile flag does not configure
these hosts. See [plugin distribution](plugin-packaging.md).

Reload the host after updating, verify the loaded definition and avoid duplicate
roles from simultaneous project and plugin installations. Marketplace packages and
cached plugins follow their own update lifecycle.
