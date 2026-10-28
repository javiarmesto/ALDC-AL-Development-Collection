#!/usr/bin/env python3
"""Keep new AL implementation behind contracts present in the reviewed base."""
import argparse
from pathlib import Path
import re
import subprocess

REQUIREMENT = '.github/plans/customer-review/customer-review'


def check(base, root):
    if not re.fullmatch(r'[0-9a-fA-F]{40}', base):
        raise ValueError('Expected a full base commit SHA')
    def git(*args):
        return subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True)
    changed = git('diff', '--name-only', base, 'HEAD', '--', 'App', 'Test')
    changed.check_returncode()
    if not any(p.lower().endswith('.al') for p in changed.stdout.splitlines()):
        print('No AL implementation change; human artifact approval remains required.')
        return
    required = [f'{REQUIREMENT}.{kind}.md' for kind in ['architecture', 'spec', 'test-plan']]
    missing = [p for p in required if git('cat-file', '-e', f'{base}:{p}').returncode != 0]
    if missing:
        raise ValueError('Implementation requires architecture, specification and test plan in the reviewed base. Missing: ' + ', '.join(missing))
    print('Base contracts exist. Their explicit human approval and current revision must still be checked by ALDC.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True)
    parser.add_argument('--root', type=Path, default=Path.cwd())
    args = parser.parse_args()
    try:
        check(args.base, args.root)
    except (ValueError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error))
