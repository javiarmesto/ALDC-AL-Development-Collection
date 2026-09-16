#!/usr/bin/env python3
"""Parse Codex TOML with stdlib; check complete bodies and unique skill discovery.
Python 3.11+ is a CI test prerequisite, not a bootstrap/runtime dependency.
"""
import pathlib
import tomllib
root = pathlib.Path(__file__).resolve().parents[1] / 'plugins/aldc-codex'
roles = list((root / 'agents').glob('*.toml'))
assert len(roles) == 12
assert list((root / 'skills').rglob('SKILL.md')) == [root / 'skills/aldc/SKILL.md']
names = set()
for path in roles:
    data = tomllib.loads(path.read_text())
    assert set(data) == {'name', 'description', 'developer_instructions'}, path
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
