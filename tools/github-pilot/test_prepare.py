import hashlib
import importlib.util
import io
import json
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest
import zipfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent


def api():
    path = HERE / 'prepare.py'
    assert path.is_file(), 'Directions pilot preparation is not implemented'
    spec = importlib.util.spec_from_file_location('pilot_prepare', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def archive_bytes(entries):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, 'w') as archive:
        for name, value in entries:
            archive.writestr(name, value)
    data = stream.getvalue()
    # ZipInfo normalizes os.sep on Windows. Restore malicious header bytes so
    # this fixture exercises the reader rather than the writer's sanitization.
    for name, _ in entries:
        if isinstance(name, str) and '\\' in name:
            data = data.replace(name.replace('\\', '/').encode(), name.encode())
    return data


class PreparationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='aldc-pilot-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def inspect(self, entries):
        data = archive_bytes(entries)
        source = self.root / 'lab.zip'
        source.write_bytes(data)
        return api().inspect_archive(source, hashlib.sha256(data).hexdigest())

    def test_hash_mismatch_rejects_an_archive_before_import(self):
        source = self.root / 'lab.zip'
        source.write_bytes(b'not the pinned lab')
        with self.assertRaisesRegex(ValueError, 'SHA-256'):
            api().inspect_archive(source, '0' * 64)

    def test_normal_members_preserve_bytes_and_top_level_licenses(self):
        files = self.inspect([('LICENSE', b'license\r\n'), ('directions-60/contract.md', b'contract\r\n')])
        self.assertEqual(files, {'LICENSE': b'license\r\n', 'contract.md': b'contract\r\n'})

    def test_traversal_absolute_and_windows_paths_are_rejected(self):
        for name in ['../escape', '/directions-60/escape', 'directions-60/../escape', 'directions-60/a\\b', 'directions-60/.git/config', 'directions-60/C:/escape']:
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, 'Unsafe|Unexpected'):
                self.inspect([(name, b'bad')])

    def test_case_insensitive_duplicate_targets_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            self.inspect([('directions-60/contract.md', b'one'), ('directions-60/Contract.md', b'two')])

    def test_symlink_entries_are_rejected(self):
        link = zipfile.ZipInfo('directions-60/link')
        link.create_system = 3
        link.external_attr = (stat.S_IFLNK | 0o777) << 16
        with self.assertRaisesRegex(ValueError, 'symlink'):
            self.inspect([(link, b'../../elsewhere')])

    def test_existing_consumer_is_never_overwritten(self):
        destination = self.root / 'consumer'
        destination.mkdir()
        (destination / 'mine.txt').write_text('preserve')
        with self.assertRaisesRegex(ValueError, 'exist'):
            api().build_consumer({}, destination, ROOT, '0' * 64)
        self.assertEqual((destination / 'mine.txt').read_text(), 'preserve')

    def fixture(self):
        return {
            'README.md': b'Upstream participant instructions\r\n',
            'contract.md': b'Fixed business contract\r\n',
            'api-contract.md': b'Fixed interfaces\r\n',
            'App/app.json': b'{"application":"28.0.0.0","runtime":"16.0"}\n',
            'App/src/README.md': b'Implement here',
            'Test/app.json': b'{"application":"28.0.0.0","runtime":"16.0"}\n',
            'Test/src/DRControlTest.Codeunit.al': b'[Test]\nprocedure Control()',
            'acceptance-tests/DRAcceptanceTests.Codeunit.al': b'\n'.join(f'[Test]\nprocedure A{n:02}()'.encode() for n in range(16)),
            'acceptance-tests/DRReviewWorker.Codeunit.al': b'codeunit 71303 Worker {}',
            'LICENSE': b'License',
        }

    def test_prepared_consumer_preserves_fixtures_and_detects_tampering(self):
        destination = self.root / 'consumer'
        upstream = self.fixture()
        api().build_consumer(upstream, destination, ROOT, '1' * 64)
        self.assertEqual((destination / 'contract.md').read_bytes(), upstream['contract.md'])
        self.assertEqual((destination / 'workshop/README.v18.md').read_bytes(), upstream['README.md'])
        self.assertTrue((destination / '.github/agents/al-architect.agent.md').is_file())
        self.assertTrue((destination / '.config/dotnet-tools.json').is_file())
        self.assertTrue((destination / '.github/workflows/pilot-validation.yml').is_file())
        command = [sys.executable, str(destination / 'scripts/verify-fixtures.py'), '--root', str(destination)]
        good = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(good.returncode, 0, good.stdout + good.stderr)
        (destination / 'acceptance-tests/DRAcceptanceTests.Codeunit.al').write_text('test modified')
        bad = subprocess.run(command, capture_output=True, text=True)
        self.assertNotEqual(bad.returncode, 0)
        self.assertIn('DRAcceptanceTests', bad.stdout + bad.stderr)

    def test_activated_tests_and_helpers_must_match_originals_and_activation_is_complete(self):
        destination = self.root / 'consumer'
        upstream = self.fixture()
        api().build_consumer(upstream, destination, ROOT, '1' * 64)
        command = [sys.executable, str(destination / 'scripts/verify-fixtures.py'), '--root', str(destination)]
        acceptance = destination / 'Test/src/DRAcceptanceTests.Codeunit.al'
        helper = destination / 'Test/src/DRReviewWorker.Codeunit.al'
        acceptance.write_bytes(upstream['acceptance-tests/DRAcceptanceTests.Codeunit.al'])
        partial = subprocess.run(command, capture_output=True, text=True)
        self.assertNotEqual(partial.returncode, 0, 'partial activation must fail')
        helper.write_bytes(upstream['acceptance-tests/DRReviewWorker.Codeunit.al'])
        self.assertEqual(subprocess.run(command, capture_output=True).returncode, 0)
        acceptance.write_text('// bypass compiled tests')
        modified = subprocess.run(command, capture_output=True, text=True)
        self.assertNotEqual(modified.returncode, 0)
        self.assertIn('Test/src/DRAcceptanceTests', modified.stdout + modified.stderr)
        acceptance.write_bytes(upstream['acceptance-tests/DRAcceptanceTests.Codeunit.al'])
        helper.unlink()
        self.assertNotEqual(subprocess.run(command, capture_output=True).returncode, 0)
        acceptance.unlink()
        self.assertNotEqual(subprocess.run(command + ['--require-acceptance'], capture_output=True).returncode, 0, 'deleting every activated copy cannot bypass an implementation PR check')

    def test_phase_gate_rejects_implementation_without_base_specification(self):
        destination = self.root / 'consumer'
        api().build_consumer(self.fixture(), destination, ROOT, '1' * 64)
        def git(*args):
            return subprocess.check_output(['git', '-C', str(destination), *args], text=True).strip()
        git('init', '--initial-branch=main')
        git('config', 'user.email', 'pilot-test@example.invalid')
        git('config', 'user.name', 'Pilot test')
        git('add', '.')
        git('commit', '-m', 'baseline')
        base = git('rev-parse', 'HEAD')
        (destination / 'App/src/Feature.al').write_text('codeunit 71200 Feature {}')
        git('add', '.')
        git('commit', '-m', 'attempt implementation')
        result = subprocess.run([sys.executable, str(destination / 'scripts/check-phase.py'), '--base', base], cwd=destination, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('specification', result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
