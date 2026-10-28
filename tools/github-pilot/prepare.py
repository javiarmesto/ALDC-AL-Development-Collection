#!/usr/bin/env python3
"""Prepare a fresh private pilot from the exact published Directions v18 archive."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import tempfile
import zipfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
V18_URL = 'https://directions-workshop.vercel.app/materials/Directions-Lab-60min-v18.zip'
V18_SHA = 'afb54fad6ee7d1bf0fd775fc744354ac4f7b54c6ea167d12507af366fe8409b2'
LICENSES = {'LICENSE', 'LICENSE-CONTENT.md', 'LICENSE-SCOPE.md'}
REQUIRED = {'contract.md', 'api-contract.md', 'App/app.json', 'Test/app.json',
            'Test/src/DRControlTest.Codeunit.al', 'acceptance-tests/DRAcceptanceTests.Codeunit.al'}


def safe_path(name):
    parts = name.split('/')
    if (not name or name.startswith('/') or re.search(r'[\\:\x00-\x1f]', name)
            or any(p in ('', '.', '..') or p.lower() == '.git' or p.endswith(('.', ' '))
                   or re.fullmatch(r'(?i)(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?', p) for p in parts)):
        raise ValueError(f'Unsafe archive path: {name!r}')
    return PurePosixPath(name)


def inspect_archive(archive, expected_sha=V18_SHA):
    data = Path(archive).read_bytes()
    if hashlib.sha256(data).hexdigest() != expected_sha.lower():
        raise ValueError('Archive SHA-256 does not match the pinned source')
    result, seen, total = {}, set(), 0
    with zipfile.ZipFile(archive) as package:
        for entry in package.infolist():
            # ZipInfo.filename silently normalizes backslashes on Windows and
            # truncates NULs. Validate the original header name before using it.
            name = entry.orig_filename.rstrip('/')
            safe_path(name)
            if stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError(f'Archive symlink is forbidden: {name}')
            if name in LICENSES:
                relative = name
            elif name == 'directions-60' and entry.is_dir():
                continue
            elif name.startswith('directions-60/'):
                relative = name[len('directions-60/'):]
            else:
                raise ValueError(f'Unexpected archive entry: {name}')
            safe_path(relative)
            folded = relative.casefold()
            if folded in seen:
                raise ValueError(f'Duplicate archive destination: {relative}')
            seen.add(folded)
            total += entry.file_size
            if total > 20 * 1024 * 1024:
                raise ValueError('Archive exceeds the pilot size limit')
            if not entry.is_dir():
                result[relative] = package.read(entry)
    return result


def check_parent(path):
    for parent in (path, *path.parents):
        if parent.is_symlink() or (hasattr(parent, 'is_junction') and parent.is_junction()):
            raise ValueError(f'Unsafe symlink/junction destination: {parent}')


def build_consumer(entries, destination, source_root=ROOT, archive_sha=V18_SHA):
    destination, source_root = Path(destination).absolute(), Path(source_root).absolute()
    check_parent(destination)
    if destination.exists():
        raise ValueError(f'Destination already exists: {destination}')
    missing = REQUIRED - entries.keys()
    if missing:
        raise ValueError(f'Incomplete starter: {sorted(missing)}')
    if len(re.findall(rb'\[Test\]', entries['acceptance-tests/DRAcceptanceTests.Codeunit.al'])) != 16:
        raise ValueError('Expected the sixteen supplied functional test methods')
    if any(p.startswith('App/') and p.lower().endswith('.al') for p in entries):
        raise ValueError('The participant starter must not contain an App implementation')
    destination.parent.mkdir(parents=True, exist_ok=True)
    # A verified, owned sibling staging directory makes import all-or-nothing.
    with tempfile.TemporaryDirectory(prefix='.aldc-pilot-', dir=destination.parent) as scratch:
        staging = Path(scratch)
        if staging.resolve().parent != destination.parent.resolve():
            raise ValueError('Staging directory escaped the destination parent')
        imported, locked = {}, {}
        for original, data in sorted(entries.items()):
            safe_path(original)
            relative = 'workshop/README.v18.md' if original == 'README.md' else original
            target = staging / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            digest = hashlib.sha256(data).hexdigest()
            imported[original] = {'path': relative, 'sha256': digest}
            if (original in REQUIRED or original.startswith('acceptance-tests/')
                    or original in {'tools/Enable-AcceptanceTests.ps1', 'LICENSE', 'LICENSE-CONTENT.md', 'LICENSE-SCOPE.md'}):
                locked[relative] = digest
        for template in sorted((HERE / 'templates').rglob('*')):
            if template.is_symlink():
                raise ValueError(f'Template symlink: {template}')
            if template.is_file():
                relative = template.relative_to(HERE / 'templates')
                target = staging / relative
                if target.exists():
                    raise ValueError(f'Template destination collision: {relative}')
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(template.read_bytes())
        subprocess.run(['node', str(source_root / 'tools/github-pilot/project.js'), '--destination', str(staging), '--apply'], check=True, capture_output=True, text=True)
        revision = subprocess.run(['git', '-C', str(source_root), 'rev-parse', 'HEAD'], capture_output=True, text=True, check=True).stdout.strip()
        lock = {'schema': 1, 'lab': 'Directions Customer Review with History', 'version': 18,
                'archive': {'url': V18_URL, 'sha256': archive_sha},
                'aldc': {'repository': 'https://github.com/javiarmesto/ALDC-AL-Development-Collection', 'sourceCommit': revision},
                'imported': imported, 'fixtures': locked,
                'declaredTests': {'functional': 16, 'control': 1, 'manual': ['A14']}}
        (staging / 'pilot-lock.json').write_text(json.dumps(lock, indent=2) + '\n', encoding='utf-8')
        subprocess.run([os.sys.executable, str(staging / 'scripts/verify-fixtures.py'), '--root', str(staging)], check=True, capture_output=True, text=True)
        os.rename(staging, destination)
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True, type=Path)
    parser.add_argument('--destination', required=True, type=Path)
    args = parser.parse_args()
    result = build_consumer(inspect_archive(args.archive), args.destination)
    print(f'Prepared {result}; AL compilation, BC runtime tests and A14 remain unexecuted.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.CalledProcessError, zipfile.BadZipFile) as error:
        raise SystemExit(str(error))
