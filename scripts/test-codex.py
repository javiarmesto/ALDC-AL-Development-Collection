#!/usr/bin/env python3
"""Parse Codex TOML with stdlib; check complete bodies and unique skill discovery.
Python 3.11+ is a CI test prerequisite, not a bootstrap/runtime dependency.
"""
import pathlib
import re
import tomllib
repo = pathlib.Path(__file__).resolve().parents[1]
root = repo / 'plugins/aldc-codex'
roles = list((root / 'agents').glob('*.toml'))
assert len(roles) == 12
assert list((root / 'skills').rglob('SKILL.md')) == [root / 'skills/aldc/SKILL.md']
# Codex's own legal set (codex-rs/protocol/src/config_types.rs). danger-full-access is
# legal but no ALDC role needs it, so a value outside this pair is a permission bug.
SANDBOX_MODES = {'read-only', 'workspace-write'}
# The canonical `tools` grant is what decides the mode, so a role that gains or loses
# `edit`/`execute` upstream must not move a permission without this test noticing.
WRITE_TOOLS = ('edit', 'execute')


def canonical_tools(name):
    text = (repo / f'agents/{name}.agent.md').read_text(encoding='utf-8')
    match = re.search(r'^tools:\s*\[(.*?)\]\s*$', text, re.MULTILINE | re.DOTALL)
    assert match, f'{name}: canonical tools grant not found'
    return [tool.strip().strip('\'"') for tool in match.group(1).split(',')]


names = set()
for path in roles:
    data = tomllib.loads(path.read_text())
    assert set(data) == {'name', 'description', 'sandbox_mode', 'developer_instructions'}, path
    assert data['sandbox_mode'] in SANDBOX_MODES, path
    tools = canonical_tools(path.stem)
    writes = any(tool == write or tool.startswith(f'{write}/')
                 for tool in tools for write in WRITE_TOOLS)
    expected = 'workspace-write' if writes else 'read-only'
    assert data['sandbox_mode'] == expected, f'{path}: {data["sandbox_mode"]} but canonical tools imply {expected}'
    assert data['name'] not in names
    names.add(data['name'])
    body = (root / f"skills/aldc/references/agents/{path.stem}.md").read_text()
    assert data['developer_instructions'].endswith(body), path
    assert '../skills/skill-migrate/references/cli-al-tools.md' in body, path
contribution = (root / 'skills/aldc/references/skills/skill-contribution-assistant/GUIDE.md').read_text()
assert 'skills/<skill-name>/SKILL.md' in contribution
assert 'Step 3: Author SKILL.md' in contribution
spec = (root / 'skills/aldc/references/commands/al-spec-create.md').read_text()
assert '../agents/al-spec-agent.md' in spec
assert (root / 'skills/aldc/references/agents/al-spec-agent.md').is_file()
for file in ['agent-simple-instructions.txt', 'agent-advanced-instructions.txt']:
    assert (root / 'skills/aldc/references/skills/skill-agent-instructions/examples' / file).is_file()
print('Codex: 12 valid TOML profiles, full role bodies, one discoverable skill; host loading unverified.')
