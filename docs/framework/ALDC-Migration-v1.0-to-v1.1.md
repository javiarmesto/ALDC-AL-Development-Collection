# Migration Guide: ALDC Core v1.0 → v1.1

## Summary of Changes

v1.1 is a **compatible evolution** of v1.0, not a breaking change. Existing v1.0 repos can migrate incrementally.

### What's New
- **Skills system**: 11 composable knowledge modules in `skills/`
- **Per-requirement contracts**: `{req_name}.{type}.md` naming convention
- **Global memory**: single acumulativo `memory.md` (replaces per-requirement memory)
- **Modular agent model**: 4 public agents + 3 internal subagents (from 11 agents)
- **Skill template**: new immutable template `skill-template.md`

### What Changed
- `aldc.yaml` has new `contracts`, `skills`, and `subagents` sections
- Schema adds skills validation
- Compliance checklist expanded with skills + requirement set checks
- Validator adds skills and requirement set completeness checks

### What's Unchanged
- 9 instructions (identical)
- 4 contracts in `.github/plans/` (same semantics, new naming convention)
- Core principles (extension-only, HITL, TDD, spec-driven)
- Templates (6 existing + 1 new)
- CI workflow structure

## Step-by-Step Migration

### Phase 1: Add skills directory (no breaking changes)

```bash
mkdir -p .github/skills/
# Copy skill-template.md to docs/templates/
# Create required skill files (can be stubs initially)
```

### Phase 2: Update aldc.yaml

Add `contracts`, `subagents`, and `skills` sections per the v1.1 schema.

### Phase 3: Rename plans files (optional, recommended)

```bash
# Rename existing plans to per-requirement convention
mv .github/plans/spec.md .github/plans/{req_name}.spec.md
mv .github/plans/architecture.md .github/plans/{req_name}.architecture.md
mv .github/plans/test-plan.md .github/plans/{req_name}.test-plan.md
# Keep memory.md as-is (it becomes the global memory)
```

### Phase 4: Consolidate agents (if desired)

Remove specialized agents and rely on modular model:
- Delete `al-debugger`, `al-tester`, `al-api`, `al-copilot`
- Create `AL Implementation Subagent` as TDD-only subagent (invoked by conductor)
- Update `al-developer` to reference `skill-debug`, `skill-api`, etc.
- Move `AL Planning Subagent`, `AL Implementation Subagent`, and `AL Code Review Subagent` to `agents/` (or `agents/orchestra/`)
- Update `al-conductor` frontmatter: `agents: ['AL Planning Subagent', 'AL Code Review Subagent', 'AL Implementation Subagent']`

### Phase 5: Validate

```bash
node tools/aldc-validate/index.js --config aldc.yaml
```

## Backwards Compatibility

v1.0 repos that don't migrate continue to work. The v1.1 validator will emit warnings (not errors) for:
- Missing skills directory
- Old-style plans naming (single set vs per-requirement)
- Missing `skill-template.md`

To get full v1.1 compliance, all checks must pass.
