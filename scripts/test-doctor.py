#!/usr/bin/env python3
"""Behavioral acceptance of canonical Doctor and its packaged/installable copies."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools/context-doctor/aldc_context_doctor.py"
spec = importlib.util.spec_from_file_location("doctor", SCRIPT)
doctor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(doctor)


class DoctorTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.put(".github/agents/al-architect.agent.md", "Architect contract")
        self.put(".github/prompts/al-spec.create.prompt.md", "Existing specification workflow")

    def put(self, rel, content):
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content if isinstance(content, str) else json.dumps(content))
        return path

    def app(self, rel="app.json", version="28.0.0.0"):
        return self.put(rel, {"application": version, "runtime": "17.0"})

    def report(self, **kwargs):
        return doctor.diagnose(self.root, **kwargs)

    def runtime(self, operations, host="chat"):
        return self.put("observations.json", {"workspace": str(self.root), "host": host, "operations": operations})

    def cli(self, *args, script=SCRIPT):
        return subprocess.run([sys.executable, "-B", str(script), "--workspace", str(self.root), "--json", *args], capture_output=True, text=True)

    def test_new_workflow_requires_linked_role_while_legacy_remains_valid(self):
        self.app()
        self.assertFalse(self.report()['layout']['spec_agent']['required_by_workflow'])
        self.put('.github/prompts/al-spec.create.prompt.md', '[the canonical specification contract](../agents/al-spec-agent.agent.md)')
        self.assertEqual(self.report()['operations']['specify']['status'], 'configuration-blocked')
        self.put('.github/agents/al-spec-agent.agent.md', 'Spec contract')
        report = self.report()
        self.assertTrue(report['layout']['spec_agent']['configured'])
        self.assertIsNone(report['layout']['spec_agent']['loaded'])
        self.assertEqual(report['operations']['specify']['status'], 'unobserved')

    def test_previous_canonical_without_spec_agent_or_profile(self):
        self.app()
        r = self.report()
        self.assertTrue(r["layout"]["configured"])
        self.assertEqual(r["projects"][0]["target"], "BC28")
        self.assertEqual(r["operations"]["specify"]["status"], "unobserved")
        self.assertEqual(self.cli().returncode, 0)

    def test_bc29_native_without_community_provider_is_unknown_not_blocked_or_passed(self):
        self.app(version="29.0.0.0")
        self.put(".github/aldc-profile.json", {"profile": "bc29-native"})
        r = self.report()
        self.assertEqual(r["profile"], "bc29-native")
        self.assertEqual(r["projects"][0]["target"], "BC29")
        op = r["operations"]["compile-app"]
        self.assertTrue(op["configured"])
        self.assertTrue(all(v is None for v in op["observations"].values()))
        runtime = self.runtime({"compile-app": {"discovered": True, "loaded": True, "provider": "native", "detail": "Compiler exposed in this session"}})
        self.assertEqual(self.report(runtime=runtime)["operations"]["compile-app"]["status"], "available-reported")

    def test_optional_mcp_parse_error_does_not_block_native_capability(self):
        self.app(version="29.0.0.0")
        self.put(".vscode/mcp.json", "{broken")
        runtime = self.runtime({"specify": {"discovered": True, "loaded": True, "provider": "native", "detail": "Relevant native tools available"}})
        report = self.report(runtime=runtime)
        self.assertEqual(report["operations"]["specify"]["status"], "available-reported")
        self.assertFalse(report["configuration_errors"][0]["blocking"])
        self.assertEqual(self.cli("--runtime", str(runtime)).returncode, 0)

    def test_missing_runner_is_local_and_compile_does_not_prove_tests(self):
        self.app("App/app.json")
        self.app("Test/app.json")
        runtime = self.runtime({"compile-app": {"executed": True, "verified": True, "targets": ["App/app.json"], "detail": "Compiler succeeded"},
                                "execute-tests": {"discovered": False, "detail": "No runner available"}})
        ops = self.report(runtime=runtime)["operations"]
        self.assertEqual(ops["compile-app"]["status"], "verified-reported")
        self.assertEqual(ops["compile-test"]["status"], "unobserved")
        self.assertEqual(ops["execute-tests"]["status"], "unavailable")
        self.assertEqual(ops["specify"]["status"], "unobserved")
        self.assertEqual(self.cli("--runtime", str(runtime)).returncode, 1)
        self.assertEqual(self.cli("--runtime", str(runtime), "--operation", "compile-app").returncode, 0)

    def test_failed_execution_distinct_from_not_executed(self):
        self.app()
        runtime = self.runtime({"compile-app": {"executed": True, "verified": False, "targets": ["app.json"], "detail": "Compiler diagnostics"}})
        self.assertEqual(self.report(runtime=runtime)["operations"]["compile-app"]["status"], "failed-reported")
        self.assertEqual(self.cli("--runtime", str(runtime)).returncode, 1)

    def test_broken_test_manifest_does_not_block_app_compilation(self):
        self.app("App/app.json")
        self.put("Tests/app.json", "{broken")
        ops = self.report()["operations"]
        self.assertEqual(ops["compile-app"]["status"], "unobserved")
        self.assertEqual(ops["compile-test"]["status"], "configuration-blocked")
        self.assertEqual(self.cli("--operation", "compile-app").returncode, 0)

    def test_invalid_profile_type_returns_diagnostic_without_traceback(self):
        self.app()
        for profile in ([], {}, None, "unsupported"):
            self.put(".github/aldc-profile.json", {"profile": profile})
            r = self.cli()
            self.assertEqual(r.returncode, 2)
            self.assertNotIn("Traceback", r.stderr)
            self.assertTrue(json.loads(r.stdout)["configuration_errors"])

    def test_broken_launch_configuration_only_affects_execution(self):
        self.app("App/app.json")
        self.app("Test/app.json")
        self.put(".vscode/launch.json", {"configurations": "bad"})
        ops = self.report()["operations"]
        self.assertEqual(ops["compile-app"]["status"], "unobserved")
        self.assertEqual(ops["execute-tests"]["status"], "configuration-blocked")
        self.assertEqual(self.cli("--operation", "compile-app").returncode, 0)
        self.assertEqual(self.cli("--operation", "execute-tests").returncode, 2)

    def test_al_go_explicit_folders_and_depth_boundary(self):
        self.app("src/a/b/c/App/app.json")
        self.app("qa/suite/app.json")
        self.app("Ignored/app.json")
        self.put(".AL-Go/settings.json", {"appFolders": ["src/a/b/c/App"], "testFolders": ["qa/suite"]})
        projects = self.report()["projects"]
        self.assertEqual([(p["role"], p["manifest"]) for p in projects], [("app", "src/a/b/c/App/app.json"), ("test", "qa/suite/app.json")])

    def test_al_go_invalid_types_conflicts_and_escape_are_errors(self):
        self.app("App/app.json")
        for config in ({"appFolders": "App"}, {"appFolders": False}, {"appFolders": ["../outside"]},
                       {"appFolders": ["C:\\outside"]}, {"appFolders": ["App"], "testFolders": ["App"]}):
            with self.subTest(config=config):
                self.put(".AL-Go/settings.json", config)
                self.assertEqual(self.report()["operations"]["compile-app"]["status"], "configuration-blocked")

    def test_jsonc_bom_urls_strings_and_trailing_commas(self):
        self.put("app.json", '\ufeff{ // comment\n"application":"29.0.0.0", "url":"https://example/a/*b*/", "description":"comma, }", /* x */ }')
        self.assertTrue(self.report()["projects"][0]["configured"])

    def test_non_al_and_bad_versions_do_not_claim_valid_project(self):
        for data in ({"name": "web app"}, {"application": []}, {"application": "broken", "runtime": "17.0"}, []):
            self.put("app.json", data)
            self.assertEqual(self.cli().returncode, 2)

    def test_new_project_can_specify_before_manifest_exists(self):
        r = self.report(operations=["specify"])
        self.assertEqual(r["operations"]["specify"]["status"], "unobserved")
        self.assertEqual(self.cli("--operation", "specify").returncode, 0)

    def test_symlink_and_dependencies_not_traversed(self):
        self.app()
        self.put("node_modules/unrelated/app.json", "broken")
        with tempfile.TemporaryDirectory() as outside:
            Path(outside, "app.json").write_text('{"application":"29.0.0.0"}')
            (self.root / "external").symlink_to(outside, target_is_directory=True)
            self.assertEqual(len(self.report()["projects"]), 1)
            self.put(".AL-Go/settings.json", {"appFolders": ["external"]})
            self.assertEqual(self.cli().returncode, 2)

    def test_invalid_observations_never_upgrade_configuration(self):
        self.app()
        for op in ({"verified": True}, {"executed": False, "verified": True},
                   {"discovered": False, "loaded": True}, {"executed": "true"},
                   {"executed": True, "verified": True, "targets": ["wrong/app.json"]}):
            runtime = self.runtime({"compile-app": {**op, "detail": "test observation"}})
            self.assertEqual(self.cli("--runtime", str(runtime)).returncode, 2)
        runtime = self.runtime({"compile-app": {"discovered": True, "detail": "observed"}}, "codex")
        self.assertEqual(self.cli("--runtime", str(runtime)).returncode, 2)

    def test_report_is_read_only_and_never_executes_commands(self):
        self.app()
        self.put(".vscode/tasks.json", {"tasks": [{"label": "compile", "command": "touch must-not-exist"}]})
        before = {p.relative_to(self.root): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        with patch('subprocess.run', side_effect=AssertionError('must not execute')):
            self.report()
        after = {p.relative_to(self.root): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        self.assertEqual(before, after)

    def test_real_packaged_surfaces_and_codex_bootstrap(self):
        self.app()
        for host, plugin, script in (
            ("chat", ".", "tools/context-doctor/aldc_context_doctor.py"),
            ("claude", "claude-plugin", "tools/context-doctor/aldc_context_doctor.py"),
            ("cli", "copilot-cli-plugin", "tools/context-doctor/aldc_context_doctor.py"),
            ("codex", "plugins/aldc-codex", "skills/aldc/scripts/aldc_context_doctor.py")):
            with self.subTest(host=host):
                package = ROOT / plugin
                r = self.cli("--host", host, "--toolkit", str(package), script=package / script)
                self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
                self.assertTrue(json.loads(r.stdout)["layout"]["configured"])
                self.assertEqual((package / script).read_bytes(), SCRIPT.read_bytes())
        subprocess.run(['node', str(ROOT / 'plugins/aldc-codex/scripts/init.js'), '--project', str(self.root), '--apply'], check=True, capture_output=True)
        r = self.cli('--host', 'codex', script=self.root / '.agents/skills/aldc/scripts/aldc_context_doctor.py')
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_custom_chat_install_profile_and_invalid_marker(self):
        self.app(version="29.0.0.0")
        install = ['node', str(ROOT / 'scripts/install.js'), 'install', '--yes', '--target-dir', '.copilot', '--profile', 'bc29-native']
        subprocess.run(install, cwd=self.root, env={**os.environ, 'ALDC_PACKAGE_DIR': str(ROOT)}, check=True, capture_output=True)
        script = self.root / '.copilot/tools/context-doctor/aldc_context_doctor.py'
        args = ('--toolkit', str(self.root / '.copilot'))
        report = json.loads(self.cli(*args, script=script).stdout)
        self.assertEqual(report['profile'], 'bc29-native')
        self.assertIn('.copilot/aldc-profile.json', report['configuration'])
        self.put('.copilot/aldc-profile.json', {'profile': []})
        r = self.cli(*args, script=script)
        self.assertEqual(r.returncode, 2)
        self.assertEqual(json.loads(r.stdout)['configuration_errors'][0]['path'], '.copilot/aldc-profile.json')

    def test_bcquality_snapshot_binds_by_resolved_path_not_text(self):
        self.app()
        self.put("aldc.yaml", "external:\n  bcquality:\n    mode: plugin\n")
        export = subprocess.run(['node', str(ROOT / 'tools/bcquality/config.js'), str(self.root)], capture_output=True, text=True, check=True)
        snapshot = json.loads(export.stdout)
        # An exporter may spell the same workspace differently (short names, case, symlinks).
        alias = Path(self.temp.name).parent / ("alias-" + Path(self.temp.name).name)
        alias.symlink_to(self.root, target_is_directory=True)
        self.addCleanup(alias.unlink)
        snapshot["workspace"] = str(alias)
        snapshot["configPath"] = str(alias / "aldc.yaml")
        path = self.put("snapshot.json", snapshot)
        report = self.report(bcquality_config=path)
        self.assertEqual(report["bcquality"]["status"], "configured")
        self.assertEqual(report["bcquality"]["configuration"]["mode"], "plugin")
        snapshot["workspace"] = str(alias.parent)
        with self.assertRaises(ValueError):
            self.report(bcquality_config=self.put("snapshot.json", snapshot))
        snapshot["workspace"] = "relative"
        with self.assertRaises(ValueError):
            self.report(bcquality_config=self.put("snapshot.json", snapshot))

    def test_real_chat_install_contains_doctor_and_rollback_removes_it(self):
        self.app()
        env = {**os.environ, 'ALDC_PACKAGE_DIR': str(ROOT)}
        install = ['node', str(ROOT / 'scripts/install.js')]
        subprocess.run([*install, 'install', '--yes'], cwd=self.root, env=env, check=True, capture_output=True)
        installed = self.root / '.github/tools/context-doctor/aldc_context_doctor.py'
        self.assertTrue(installed.is_file())
        r = self.cli(script=installed)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        subprocess.run([*install, 'rollback'], cwd=self.root, env=env, check=True, capture_output=True)
        self.assertFalse(installed.exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
