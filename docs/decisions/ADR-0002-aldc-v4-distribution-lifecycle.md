# ADR-0002 — ALDC v4: Distribution Lifecycle Review

**Date**: TBD (placeholder — out of Phase 1 scope)
**Status**: Placeholder
**Author**: al-architect
**Branch**: to be determined

---

## Context

ALDC is currently at v3.2.3 distributed via VS Code Marketplace VSIX.
The Phase 1 restructure (ADR-0001) moves artefacts to `packages/foundation/` in preparation for a future APM channel.

When ALDC reaches v4, the following questions must be revisited:

## Open Questions

1. **Install mechanics** — Should v4 use APM-native install (`apm install aldc`) or continue supporting `npx aldc`? Can both coexist?
2. **Update mechanics** — VSIX auto-updates via Marketplace. APM channel update flow TBD.
3. **Subpackage versioning** — Does `packages/foundation/` carry its own semver independent of the extension?
4. **3.x → 4.x migration** — Can existing `.github/` consumer installations be upgraded in-place, or does v4 require a fresh install?
5. **Channel parity** — Which features are VSIX-only vs APM-only vs both?

## Tracking

- Prerequisite: APM Phase 2 (apm.yml manifests) must be complete first
- Related: ADR-0001 (Phase 1 restructure)
- Owner: al-architect + al-presales (estimation required)

---

> ⚠️ This file is gitignored (`docs/decisions/` excluded from main). It is a working document on the feature branch only.
