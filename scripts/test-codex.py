#!/usr/bin/env python3
"""Parse Codex TOML with stdlib; check complete bodies and unique skill discovery.
Python 3.11+ is a CI test prerequisite, not a bootstrap/runtime dependency.
"""
import pathlib
import re
import json
import subprocess
import tempfile
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
    # Every surface points at the terminal-host contract it ships, at its own path;
    # the relative form this used to assert was retired when paths became rooted.
    assert '.agents/skills/aldc/references/skills/skill-migrate/references/cli-al-tools.md' in body, path
contribution = (root / 'skills/aldc/references/skills/skill-contribution-assistant/GUIDE.md').read_text()
assert 'skills/<skill-name>/SKILL.md' in contribution
assert 'Step 3: Author SKILL.md' in contribution
spec = (root / 'skills/aldc/references/commands/al-spec-create.md').read_text()
assert '.agents/skills/aldc/references/agents/al-spec-agent.md' in spec
assert (root / 'skills/aldc/references/agents/al-spec-agent.md').is_file()
for file in ['agent-simple-instructions.txt', 'agent-advanced-instructions.txt']:
    assert (root / 'skills/aldc/references/skills/skill-agent-instructions/examples' / file).is_file()

# Parse the runnable configuration, not just the prose surrounding it. Codex must
# not silently start inheriting another host's broken declarations on regeneration.
manifest = json.loads((root / '.codex-plugin/plugin.json').read_text())
assert 'mcpServers' not in manifest
assert not (root / '.mcp.json').exists()
guide = (root / 'skills/aldc/references/mcp-setup.md').read_text()
config = tomllib.loads(re.search(r'```toml\n(.*?)\n```', guide, re.DOTALL).group(1))
servers = config['mcp_servers']
assert servers['al-symbols-mcp']['command'] == 'npx'
assert servers['al-symbols-mcp']['args'] == ['-y', 'al-mcp-server@2.5.0']
assert servers['microsoft-docs']['url'] == 'https://learn.microsoft.com/api/mcp'
assert servers['context7']['url'] == 'https://mcp.context7.com/mcp'
presales = (root / 'skills/aldc/references/agents/al-presales.md').read_text()
assert 'references/mcp-setup.md' in presales
assert '@anthropic-ai/context7-mcp' not in presales
assert 'Instala Microsoft Learn MCP desde VS Code extensions' not in presales
assert 'query executed' in presales

# Installing, verifying and rolling back the new guide must preserve the user's
# MCP configuration byte-for-byte, and must not install another host's config.
with tempfile.TemporaryDirectory(prefix='aldc-codex-mcp-') as fixture:
    project = pathlib.Path(fixture)
    (project / '.codex').mkdir()
    existing = b'# My configured provider\r\n[mcp_servers.existing]\r\nurl = "https://example.invalid/mcp"\r\n'
    config_path = project / '.codex/config.toml'
    config_path.write_bytes(existing)
    for flags in [[], ['--apply'], ['--verify'], ['--rollback']]:
        subprocess.run(['node', str(root / 'scripts/init.js'), '--project', fixture, *flags],
                       check=True, capture_output=True, text=True)
        assert config_path.read_bytes() == existing
        assert not (project / '.mcp.json').exists()
        assert not (project / '.vscode').exists()
        assert not (project / '.claude').exists()
        installed = project / '.agents/skills/aldc/references/mcp-setup.md'
        if flags in (['--apply'], ['--verify']):
            assert installed.read_text() == guide
        else:
            assert not installed.exists()
print('Codex: 12 valid TOML profiles, full role bodies, one discoverable skill; MCP examples parsed; existing MCP config preserved through install/verify/rollback. Host loading unverified.')
