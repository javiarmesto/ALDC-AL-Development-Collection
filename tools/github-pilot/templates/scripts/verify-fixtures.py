#!/usr/bin/env python3
"""Check source integrity. This does not compile AL or run Business Central tests."""
import argparse
import hashlib
import json
from pathlib import Path


def verify(root, fixture_lock, cloud_lock, require_acceptance=False):
    errors = []
    activated = {f'Test/src/{Path(p).name}': h for p, h in fixture_lock['fixtures'].items() if p.startswith('acceptance-tests/') and p.endswith('.al')}
    active = require_acceptance or any((root / p).exists() for p in activated)
    groups = [('upstream fixture', fixture_lock['fixtures']), ('generated ALDC file', cloud_lock['outputs'])]
    if active:
        groups.append(('activated acceptance test/helper', activated))
    for category, paths in groups:
        for relative, digest in paths.items():
            path = root / relative
            if (Path(relative).is_absolute() or '..' in Path(relative).parts
                    or not path.resolve().is_relative_to(root.resolve()) or path.is_symlink()):
                errors.append(f'Unsafe {category}: {relative}')
            elif not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != digest:
                errors.append(f'Changed or missing {category}: {relative}')
    if errors:
        raise ValueError('\n'.join(errors))
    print(f'Verified {len(fixture_lock["fixtures"])} upstream fixtures and {len(cloud_lock["outputs"])} generated ALDC files.')
    print('Structural integrity only. AL compilation, runtime tests and manual A14 are separate checks.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument('--lock', type=Path)
    parser.add_argument('--cloud-lock', type=Path)
    parser.add_argument('--require-acceptance', action='store_true', help='Require the complete activated Test/src suite, including when every copy was deleted')
    args = parser.parse_args()
    fixture = json.loads((args.lock or args.root / 'pilot-lock.json').read_text(encoding='utf-8'))
    cloud = json.loads((args.cloud_lock or args.root / '.github/aldc-cloud-lock.json').read_text(encoding='utf-8'))
    if fixture.get('schema') != 1 or cloud.get('schema') != 1:
        raise ValueError('Unsupported provenance schema')
    verify(args.root, fixture, cloud, args.require_acceptance)


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, OSError) as error:
        raise SystemExit(str(error))
