#!/usr/bin/env python3
"""Canonical ALDC Doctor: local, read-only, Python 3.9+ stdlib diagnostics.

No commands, network, installations, compilation, or implicit runtime evidence.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

VERSION = "1.1.0"
OPERATIONS = ("specify", "compile-app", "compile-test", "execute-tests")
STAGES = ("discovered", "loaded", "executed", "verified")
IGNORED = {"node_modules", "bin", "obj", "build", "dist", "out", "output", "temp", "tmp", "__pycache__"}


def load_json(path):
    """Accept UTF-8/BOM and VS Code JSONC comments/trailing commas, not YAML."""
    text = path.read_text(encoding="utf-8-sig")
    # Match complete strings first, so URLs and comment-like text stay intact.
    token = r'"(?:\\.|[^"\\])*"|/\*[\s\S]*?\*/|//[^\r\n]*'
    text = re.sub(token, lambda m: m[0] if m[0].startswith('"') else ' ', text)
    text = re.sub(r'"(?:\\.|[^"\\])*"|,\s*(?=[}\]])',
                  lambda m: m[0] if m[0].startswith('"') else '', text)
    value = json.loads(text)
    if not isinstance(value, dict):
        raise ValueError(f"{path}: expected a JSON object")
    return value


def inside(root, relative):
    if not isinstance(relative, str) or not relative.strip() or "${" in relative:
        raise ValueError("expected a non-empty relative folder path")
    # Reject Windows absolute paths even when diagnostics run on Linux.
    if Path(relative).is_absolute() or re.match(r"^[A-Za-z]:|^\\", relative):
        raise ValueError(f"absolute project path: {relative}")
    path = root / relative
    path.resolve().relative_to(root.resolve())
    if any(p.is_symlink() for p in (path, *path.parents) if p != root and root in p.parents):
        raise ValueError(f"symlink project path: {relative}")
    return path.resolve()


def discover_projects(root):
    """Bounded/pruned discovery; AL-Go non-empty folders override each role."""
    projects, errors, explicit, seen = [], [], set(), {}
    settings = root / ".AL-Go/settings.json"
    if settings.exists():
        try:
            config = load_json(settings)
            for role, key in (("app", "appFolders"), ("test", "testFolders")):
                folders = config.get(key, [])
                if folders is None:
                    folders = []
                if not isinstance(folders, list):
                    raise ValueError(f"{key}: expected an array of relative folders")
                if folders:
                    explicit.add(role)
                for folder in folders:
                    manifest = inside(root, folder) / "app.json"
                    if manifest.is_symlink() or not manifest.is_file():
                        raise ValueError(f"{key}: missing or symlink app.json in {folder}")
                    relative = manifest.relative_to(root).as_posix()
                    if relative in seen and seen[relative] != role:
                        raise ValueError(f"{relative}: configured as both App and Test")
                    if relative not in seen:
                        projects.append({"role": role, "manifest": relative, "source": ".AL-Go/settings.json"})
                        seen[relative] = role
        except (OSError, ValueError) as exc:
            errors.append(f".AL-Go/settings.json: {exc}")
    def walk_error(exc):
        errors.append(f"project discovery: {exc}")
    for directory, dirs, files in os.walk(root, followlinks=False, onerror=walk_error):
        base = Path(directory)
        depth = len(base.relative_to(root).parts)
        dirs[:] = sorted(d for d in dirs if depth < 3 and not d.startswith('.')
                         and d.casefold() not in IGNORED and not (base / d).is_symlink())
        if "app.json" not in files:
            continue
        manifest = base / "app.json"
        relative = manifest.relative_to(root).as_posix()
        parts = [p.casefold() for p in base.relative_to(root).parts]
        role = "test" if any(p in {"test", "tests"} or p.startswith("test-") for p in parts) else "app"
        if relative not in seen and role not in explicit:
            projects.append({"role": role, "manifest": relative, "source": "workspace-discovery"})
    for project in projects:
        try:
            manifest = root / project["manifest"]
            if manifest.is_symlink():
                raise ValueError("symlink manifest is not inspected")
            data = load_json(manifest)
            application = data.get("application")
            runtime = data.get("runtime")
            if not any(isinstance(v, str) and re.fullmatch(r"\d+(?:\.\d+){1,3}", v) for v in (application, runtime)):
                raise ValueError("expected an AL application or runtime version")
            if application is not None and (not isinstance(application, str) or not re.fullmatch(r"\d+(?:\.\d+){1,3}", application)):
                raise ValueError("invalid application version")
            if runtime is not None and (not isinstance(runtime, str) or not re.fullmatch(r"\d+(?:\.\d+){1,3}", runtime)):
                raise ValueError("invalid runtime version")
            project.update(application=application, runtime=runtime,
                           target=("BC" + application.split('.')[0]) if application else "unknown",
                           configured=True)
        except (OSError, ValueError) as exc:
            project.update(configured=False, problem=f"{project['manifest']}: {exc}")
    return sorted(projects, key=lambda p: (p["role"], p["manifest"])), errors


def inspect_layout(root, host):
    """One selected host; presence is configuration, never host loading."""
    layouts = {
        "chat": [("agents/al-architect.agent.md", "prompts/al-spec.create.prompt.md"),
                 (".github/agents/al-architect.agent.md", ".github/prompts/al-spec.create.prompt.md")],
        "claude": [("agents/al-architect.md", "commands/al-spec-create.md"),
                   (".claude/agents/al-architect.md", ".claude/commands/al-spec-create.md")],
        "cli": [("agents/al-architect.agent.md", "commands/al-spec-create.md")],
        "codex": [("skills/aldc/references/agents/al-architect.md", "skills/aldc/references/commands/al-spec-create.md"),
                  (".agents/skills/aldc/references/agents/al-architect.md", ".agents/skills/aldc/references/commands/al-spec-create.md")],
    }
    candidates = []
    for paths in layouts[host]:
        present = [str(root / p) for p in paths if (root / p).is_file() and (root / p).stat().st_size > 0]
        candidates.append((len(present), present, [str(root / p) for p in paths if str(root / p) not in present], str((root / paths[0]).parent.parent), paths))
    count, present, missing, directory, selected = max(candidates, key=lambda c: c[0])
    spec_path = root / selected[0].replace("al-architect", "al-spec-agent")
    workflow = root / selected[1]
    required = workflow.is_file() and bool(re.search(r"\]\(\.\./agents/al-spec-agent(?:\.agent)?\.md\)", workflow.read_text(encoding="utf-8-sig")))
    available = spec_path.is_file() and spec_path.stat().st_size > 0
    if required and not available:
        missing.append(str(spec_path))
    return {"configured": count == 2 and (not required or available), "paths": present, "missing": missing, "directory": directory,
            "spec_agent": {"path": str(spec_path), "required_by_workflow": required, "configured": available, "loaded": None},
            "loaded": None, "note": "File presence only. Legacy workflows do not require Spec Agent; a workflow linking to it requires that role file. Loading remains unobserved."}


def runtime_observations(path, root, host, projects, selected):
    if path is None:
        return {}
    data = load_json(path)
    if data.get("host") != host or not isinstance(data.get("workspace"), str) or not Path(data["workspace"]).is_absolute() or Path(data["workspace"]).resolve() != root:
        raise ValueError("runtime observations must name the current absolute workspace and selected host")
    operations = data.get("operations")
    if not isinstance(operations, dict) or set(operations) - set(OPERATIONS):
        raise ValueError("runtime observations: expected known operation IDs")
    result = {}
    for name in selected:
        if name not in operations:
            continue
        value = operations[name]
        if not isinstance(value, dict) or any(k not in (*STAGES, "detail", "targets", "provider") for k in value):
            raise ValueError(f"{name}: invalid observation fields")
        if any(value.get(s) is not None and not isinstance(value[s], bool) for s in STAGES):
            raise ValueError(f"{name}: stages must be boolean or null")
        if not isinstance(value.get("detail"), str) or not value["detail"].strip():
            raise ValueError(f"{name}: explain the observation in detail")
        if "provider" in value and not isinstance(value["provider"], str):
            raise ValueError(f"{name}: provider must be a descriptive string")
        for index, stage in enumerate(STAGES):
            if value.get(stage) is True and any(value.get(s) is False for s in STAGES[:index]):
                raise ValueError(f"{name}: contradictory stages")
        if value.get("verified") is not None and value.get("executed") is not True:
            raise ValueError(f"{name}: verification requires an executed operation")
        if name != "specify" and (value.get("executed") is True or value.get("verified") is not None):
            role = "app" if name == "compile-app" else "test"
            expected = sorted(p["manifest"] for p in projects if p["role"] == role)
            targets = value.get("targets")
            if not isinstance(targets, list) or any(not isinstance(t, str) for t in targets) or sorted(targets) != expected or not expected:
                raise ValueError(f"{name}: targets must cover current {role} manifests: {expected}")
        result[name] = value
    return result


def same_path(value, expected):
    """Compare a caller-supplied absolute path with a resolved one. Windows 8.3 short
    names, drive-letter case and symlinked temp folders differ between exporters
    (Node, PowerShell) and Python; resolved paths compare equal, plain text does not."""
    if not isinstance(value, str) or not value or not Path(value).is_absolute():
        return False
    try:
        return Path(value).resolve() == Path(expected).resolve()
    except OSError:
        return False


def bcquality_observations(snapshot, runtime, root, host):
    """Bind explicit YAML export to source bytes; runtime is reported, not proven."""
    result = {"configured": None, "status": "configuration-uninspected",
              "discovered": None, "loaded": None, "executed": None,
              "index": {"status": "unobserved"}, "native_fallback": True,
              "note": "Supply --bcquality-config from the YAML exporter. No provider was probed."}
    if not snapshot:
        return result
    data = load_json(Path(snapshot))
    source = root / "aldc.yaml"
    digest = hashlib.sha256(source.read_bytes()).hexdigest() if source.is_file() else None
    if (data.get("contractVersion") != 1 or not same_path(data.get("workspace"), root)
            or not same_path(data.get("configPath"), source) or data.get("configSha256") != digest):
        raise ValueError("BCQuality configuration snapshot is stale or belongs to another workspace")
    config = data.get("bcquality", {})
    if (not isinstance(config, dict) or config.get("mode") not in {"plugin", "external-multiroot"}
            or not (isinstance(config.get("enabled"), bool) or config.get("enabled") == "auto")):
        raise ValueError("BCQuality configuration snapshot has an invalid mode/enabled value")
    result.update(configured=True, configuration=config, status="configured",
                  note="Explicit configuration export checked against source bytes; runtime stages remain caller reports.")
    if config["enabled"] is False:
        result.update(status="disabled", note="Disabled by configuration; no provider observations consumed.")
        return result
    if not runtime:
        return result
    envelope = load_json(Path(runtime))
    if not same_path(envelope.get("workspace"), root) or envelope.get("host") != host:
        raise ValueError("BCQuality observations must name the current workspace and host")
    obs = envelope.get("bcquality")
    if obs is None:
        return result
    if not isinstance(obs, dict) or not isinstance(obs.get("detail"), str) or not obs["detail"].strip():
        raise ValueError("BCQuality observations require detail")
    if obs.get("mode") != config["mode"]:
        raise ValueError("BCQuality observed mode differs from configuration")
    plugin = config.get("plugin", {})
    if not isinstance(plugin, dict):
        raise ValueError("BCQuality plugin identity must be an object")
    if config["mode"] == "plugin" and (obs.get("id") != plugin.get("id") or obs.get("skill") != plugin.get("skill")):
        raise ValueError("BCQuality observed plugin/skill differs from configuration")
    stages = ("discovered", "loaded", "executed")
    for i, stage in enumerate(stages):
        value = obs.get(stage)
        if value is not None and not isinstance(value, bool):
            raise ValueError("BCQuality stages must be boolean or null")
        if value is True and any(obs.get(s) is not True for s in stages[:i]):
            raise ValueError("BCQuality later stages require explicit earlier-stage observations")
        result[stage] = value
    if obs.get("executed") is True and (not isinstance(obs.get("outcome"), str) or not obs["outcome"].strip()):
        raise ValueError("BCQuality execution requires the actual reported outcome")
    expected = {"observedVersion": plugin.get("expectedVersion"),
                "observedSourceRef": plugin.get("sourceRef")} if config["mode"] == "plugin" else {"observedSourceRef": config.get("pinnedCommit")}
    mismatch = [key for key, value in expected.items() if value and obs.get(key) and obs[key] != value]
    unverified = [key for key, value in expected.items() if value and not obs.get(key)]
    index = obs.get("index", {"status": "unobserved"})
    if not isinstance(index, dict) or index.get("status") not in {"unobserved", "not-attempted", "failed", "generated"}:
        raise ValueError("BCQuality index status is invalid")
    if index["status"] != "unobserved" and (not isinstance(index.get("detail"), str) or not index["detail"].strip()):
        raise ValueError("BCQuality index observation needs detail")
    if index["status"] == "generated":
        if (index.get("exitCode") != 0 or isinstance(index.get("exitCode"), bool)
                or not all(isinstance(index.get(k), str) and index[k].strip() for k in ("command", "path", "freshness"))
                or not re.fullmatch(r"[0-9a-f]{64}", str(index.get("sha256", "")))):
            raise ValueError("BCQuality generated index requires command, exitCode 0, path, SHA-256 and freshness evidence")
        index_path = Path(index["path"])
        if not index_path.is_absolute() or not index_path.is_file():
            raise ValueError("BCQuality generated index must identify a readable absolute file")
        load_json(index_path)
        if hashlib.sha256(index_path.read_bytes()).hexdigest() != index["sha256"]:
            raise ValueError("BCQuality index SHA-256 differs from the observed file")
    status = next((s + "-reported" for s in reversed(stages) if obs.get(s) is True), "unavailable-reported")
    if mismatch:
        status = "incompatible-reported"
    elif unverified:
        status = "identity-unverified"
    result.update(status=status, index=index, detail=obs["detail"],
                  expected_identity_unverified=unverified, identity_mismatches=mismatch,
                  observedVersion=obs.get("observedVersion"), observedSourceRef=obs.get("observedSourceRef"),
                  outcome=obs.get("outcome"))
    # Doctor does not adjudicate domain coverage from a reported invocation.
    result["note"] = "Stages and generator execution are caller reports. Index bytes/hash checked when supplied; freshness and domain coverage require review evidence. Native checks remain required."
    return result


def diagnose(workspace, host="chat", toolkit=None, runtime=None, operations=None, bcquality_config=None):
    root = Path(workspace).resolve()
    if not root.is_dir():
        raise ValueError(f"workspace directory missing: {root}")
    toolkit = Path(toolkit).resolve() if toolkit else root
    selected = list(operations or OPERATIONS)
    projects, discovery_errors = discover_projects(root)
    layout = inspect_layout(toolkit, host)
    config, config_errors = {}, []
    # Report host declarations separately; a launch profile is not a test runner.
    paths = {"chat": [".vscode/settings.json", ".vscode/tasks.json", ".vscode/launch.json", ".vscode/mcp.json"],
             "claude": [".claude/settings.json", ".mcp.json"], "cli": [".mcp.json"], "codex": []}[host]
    if host == "chat":
        marker = Path(layout["directory"]) / "aldc-profile.json"
        # Retain diagnosis of a default marker even if its source layout is broken.
        if not layout["configured"] and toolkit == root and not marker.exists():
            marker = root / ".github/aldc-profile.json"
        paths.append(str(marker.relative_to(root)) if marker.is_relative_to(root) else str(marker))
    profile = None
    for rel in paths:
        p = root / rel
        affected = (['compile-app', 'compile-test'] if rel.endswith('tasks.json') else
                    ['execute-tests'] if rel.endswith('launch.json') else
                    ['specify'] if rel.endswith('mcp.json') else list(OPERATIONS))
        if p.exists() and set(selected) & set(affected):
            try:
                value = load_json(p)
                for key in ('tasks', 'configurations'):
                    if key in value and (not isinstance(value[key], list) or any(not isinstance(item, dict) for item in value[key])):
                        raise ValueError(f"{key}: expected an array of objects")
                config[rel] = "JSON configuration readable; runtime unobserved"
                if rel.endswith("aldc-profile.json"):
                    profile = value.get("profile")
                    if not isinstance(profile, str) or profile not in {"bc28", "bc29-native"}:
                        raise ValueError("expected bc28 or bc29-native profile")
            except (OSError, ValueError) as exc:
                config_errors.append({"path": rel, "problem": str(exc), "operations": affected,
                                      "blocking": not rel.endswith("mcp.json")})
    # Manifests that declare different BC application targets cannot be built and
    # deployed as one solution. Report it; the compiler, not Doctor, adjudicates.
    if set(selected) & {"compile-app", "compile-test", "execute-tests"}:
        declared = sorted((p["manifest"], p["target"]) for p in projects
                          if p.get("configured") and isinstance(p.get("target"), str) and p["target"] != "unknown")
        if len({target for _, target in declared}) > 1:
            config_errors.append({"path": declared[0][0], "blocking": False,
                                  "problem": "manifests declare different application targets ("
                                             + ", ".join(f"{m}={t}" for m, t in declared)
                                             + "); align them or confirm the split is intended",
                                  "operations": ["compile-app", "compile-test", "execute-tests"]})
    observed = runtime_observations(Path(runtime) if runtime else None, root, host, projects, selected)
    result = {}
    for name in selected:
        role = "app" if name == "compile-app" else "test"
        targets = projects if name == "specify" else [p for p in projects if p["role"] == role]
        problems = list(discovery_errors) + [p["problem"] for p in targets if not p["configured"]]
        problems.extend(f"{e['path']}: {e['problem']}" for e in config_errors if e["blocking"] and name in e["operations"])
        if name == "specify" and not layout["configured"]:
            problems.extend(f"missing workflow source: {p}" for p in layout["missing"])
        if name == "compile-app" and not targets:
            problems.append("no App app.json found (depth <= 3); configure .AL-Go/settings.json for other folders")
        applicable = name in {"specify", "compile-app"} or bool(targets) or bool(discovery_errors)
        state = "unobserved"
        action = "Discover a compiler in this host, resolve target symbols, then compile the listed projects when authorized."
        if name == "specify":
            action = "Load the specification workflow and relevant rules/skills; consult target-version sources for unresolved contracts."
        elif name == "execute-tests":
            action = "Discover a test runner and reachable BC test environment; execute tests when authorized. Compilation alone is insufficient."
        obs = observed.get(name, {})
        if obs.get("discovered") is False or obs.get("loaded") is False:
            state = "unavailable"
        elif obs.get("executed") is True:
            state = "verified-reported" if obs.get("verified") is True else "failed-reported" if obs.get("verified") is False else "executed-reported"
        elif obs.get("loaded") is True or obs.get("discovered") is True:
            state = "available-reported"
        if state == "available-reported":
            action = "Use the reported capability for this operation when authorized; loading/execution/result still require their own observations."
        elif state == "verified-reported":
            action = "Retain the scoped result and its limits; repeat only if the affected source or environment changed."
        elif state == "failed-reported":
            action = "Inspect the reported failure, correct its cause, then repeat only the affected operation when authorized."
        elif state == "executed-reported":
            action = "Inspect the result of this execution before reporting verification; do not infer success."
        if problems:
            state, action = "configuration-blocked", "Repair only the listed project/workflow configuration, then repeat this operation."
        elif not applicable:
            state, action = "not-applicable", "No Test project discovered; configure testFolders if tests exist elsewhere."
        result[name] = {"configured": not problems if applicable else None, "status": state,
                        "paths": [p["manifest"] for p in targets], "problems": problems,
                        "observations": {s: obs.get(s) for s in STAGES},
                        "reported_detail": obs.get("detail"), "provider": obs.get("provider"), "action": action}
    return {"version": VERSION, "workspace": str(root), "host": host, "toolkit": str(toolkit),
            "profile": profile, "projects": projects, "layout": layout, "configuration": config,
            "configuration_errors": config_errors, "operations": result,
            "bcquality": bcquality_observations(bcquality_config, runtime, root, host),
            "runtime_source": str(runtime) if runtime else None,
            "note": "Local configuration inspection only. Runtime observations are caller reports, not independently verified or freshness-checked. No global functional success is inferred. Native capabilities need no duplicate community provider."}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", default=".")
    parser.add_argument("--host", choices=("chat", "claude", "cli", "codex"), default="chat")
    parser.add_argument("--toolkit", help="Installed toolkit/plugin root; defaults to workspace")
    parser.add_argument("--runtime", help="Optional current host observations JSON; never generated implicitly")
    parser.add_argument("--bcquality-config", help="Explicit JSON export from tools/bcquality/config.js")
    parser.add_argument("--operation", action="append", choices=OPERATIONS)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    try:
        report = diagnose(args.workspace, args.host, args.toolkit, args.runtime, args.operation, args.bcquality_config)
        if args.json:
            print(json.dumps(report, indent=2))
        else:
            print(f"ALDC Doctor {VERSION} | {args.host} | {report['workspace']}")
            print("Targets: " + (", ".join(f"{p['manifest']}={p.get('target', 'invalid')}" for p in report['projects']) or "no AL manifests"))
            for name, op in report["operations"].items():
                print(f"{name}: {op['status']} | {', '.join(op['paths']) or report['toolkit']}")
                for problem in op["problems"]:
                    print(f"  Problem: {problem}")
                if op["reported_detail"]:
                    print(f"  Reported: {op['reported_detail']}")
                print(f"  Action: {op['action']}")
            for problem in report["configuration_errors"]:
                impact = "repair the affected host setting" if problem["blocking"] else "optional provider; use a sufficient native capability if available, or repair this provider"
                print(f"Configuration problem: {problem['path']}: {problem['problem']}; {impact}.")
            print(report["note"])
            print("BCQuality: " + report["bcquality"]["status"] + " | " + report["bcquality"]["note"])
        states = {op["status"] for op in report["operations"].values()}
        return 2 if "configuration-blocked" in states or any(e["blocking"] for e in report["configuration_errors"]) else 1 if states & {"unavailable", "failed-reported"} else 0
    except (OSError, ValueError) as exc:
        print(json.dumps({"error": str(exc)}) if args.json else f"Doctor input error: {exc}")
        return 2


if __name__ == "__main__":
    sys.exit(main())
