# GitHub-native ALDC pilot tooling

This experimental surface prepares a fresh private consumer from Directions lab
v18. It does not release another ALDC host package or alter canonical roles.

## Reproduce

From a clean ALDC checkout, install its existing dependencies with `npm ci`.
Download the participant archive to a temporary file:

`https://directions-workshop.vercel.app/materials/Directions-Lab-60min-v18.zip`

Expected SHA-256:
`afb54fad6ee7d1bf0fd775fc744354ac4f7b54c6ea167d12507af366fe8409b2`

```sh
python tools/github-pilot/prepare.py --archive /path/to/v18.zip --destination /new/consumer
```

The destination must not exist. The importer validates original ZIP header names,
rejects traversal, symlinks and case-insensitive duplicate paths, builds in an owned
temporary sibling, verifies hashes and renames the completed consumer into place.
App/Test manifests, contracts, supplied AL test sources and licenses retain their
original bytes. The participant README is retained as workshop/README.v18.md.
The generated .gitattributes prevents Git from changing frozen bytes on checkout.

## Cloud projection

`project.js` reads root agents, skills, instructions, prompts and supporting
templates/tools directly. It never reads another host's generated distribution.
Short `.github/agents/*.agent.md` entries target `github-copilot`, inherit the host
model and require complete `.github/agent-contracts/*.md` reads. Native tool grants
are role-specific; read-only reviewers and Spec do not receive shell/delegation
grants. Workflow prompts are reference documents, not claimed GitHub commands.
Microsoft Learn MCP is declared per profile; observed loading/execution still needs
session evidence. BCQuality starts explicitly disabled with full native review.

The standalone projector previews by default:

```sh
node tools/github-pilot/project.js --destination /new/consumer
node tools/github-pilot/project.js --destination /new/consumer --apply
```

It preflights every file before writing, refuses unknown differing destination
content and never deletes files. This first pilot supports fresh installs and
identical re-runs; managed upgrades require a later reviewed transaction design.

## Verification

```sh
node --test tools/github-pilot/test-project.js
python -B tools/github-pilot/test_prepare.py
npm test
```

The consumer CI validates frozen fixtures and generated ALDC outputs. On PRs it
uses the base branch's checker and locks. Its phase check prevents AL implementation
before architecture/specification/test plan exist on the reviewed base; explicit
human approval must still be verified separately. The initial issue authorizes
architecture only and ends at its human approval gate.

Copilot setup installs pinned AL Development Tools 18.1.43.24897 and the pinned YAML
reader. Compatible BC28 symbols, authenticated sandbox/company and a real runtime
runner remain separate prerequisites. Structural CI and setup success are not AL
compilation, test execution or A14 acceptance. No automatic merge or BC publication
is included.
