#!/usr/bin/env node
'use strict';
/**
 * BCQuality knowledge-index state and (explicit) build.
 *
 * status : observe only — does the index exist, is it fresh for the pinned corpus?
 * build  : run the provider's generator, then write the ALDC receipt.
 *
 * Never probes the provider for review purposes and never fabricates evidence:
 * `prebuilt` requires a receipt whose corpusSha matches the observed corpus.
 *
 * The generator needs PowerShell 7 (`pwsh`): it dot-sources Knowledge-Retrieval.ps1,
 * which uses `ConvertFrom-Json -AsHashtable`. Windows PowerShell 5 cannot run it.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { readConfig } = require('./config');

const RECEIPT = '.github/aldc-bcquality-index.json';
const OK_STATES = new Set(['prebuilt', 'generated', 'unobserved']); // unobserved = not applicable, not a failure

// Exit 0 when there is nothing for the caller to do: a usable index, a mode that has
// none, or a machine that cannot run the generator at all. A missing or stale index on
// a machine that COULD build one is the single actionable case, and keeps exit 1 so a
// script can branch on it (`aldc bcq-index || aldc bcq-index --build`).
const ok = result => OK_STATES.has(result.status) || result.attemptable === false;

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function readJson(file) {
  // Tolerate a UTF-8 BOM: a receipt written by Windows PowerShell may carry one.
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
}

function corpusRevision(home) {
  const r = spawnSync('git', ['-C', home, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

function resolveHome(workspace, b) {
  return path.resolve(workspace, process.env.BCQUALITY_HOME || b.home);
}

function status(workspace = '.') {
  const b = readConfig(workspace).bcquality;
  if (b.mode !== 'external-multiroot' || b.enabled === false) {
    return { status: 'unobserved', detail: `index state is not applicable in mode=${b.mode}, enabled=${b.enabled}` };
  }
  const home = resolveHome(workspace, b);
  const indexPath = path.join(home, 'knowledge-index.json');
  const receiptPath = path.resolve(workspace, RECEIPT);

  if (!fs.existsSync(home)) return { status: 'not-attempted', home, detail: 'corpus not installed' };
  const corpus = corpusRevision(home);
  if (!fs.existsSync(indexPath)) return { status: 'not-attempted', home, corpus, detail: 'no knowledge-index.json' };

  let receipt = null;
  try { receipt = readJson(receiptPath); } catch { /* absent or unreadable */ }
  const hash = sha256(indexPath);
  const fresh = Boolean(receipt && corpus && receipt.corpusSha === corpus && receipt.indexSha256 === hash);

  return {
    status: fresh ? 'prebuilt' : 'not-attempted',
    home, indexPath, corpus, indexSha256: hash,
    generatedAt: receipt?.generatedAt ?? null,
    detail: fresh ? 'receipt matches the observed corpus revision'
                  : receipt ? 'receipt is stale or does not match this corpus' : 'no receipt'
  };
}

function build(workspace = '.') {
  const b = readConfig(workspace).bcquality;
  if (b.mode !== 'external-multiroot' || b.enabled === false) {
    return { status: 'unobserved', detail: `build is not applicable in mode=${b.mode}, enabled=${b.enabled}` };
  }
  const home = resolveHome(workspace, b);
  const generator = path.join(home, 'tools', 'Build-KnowledgeIndex.ps1');
  if (!fs.existsSync(generator)) return { status: 'failed', detail: `generator not found: ${generator}` };

  // Only pwsh (PowerShell 7). `powershell.exe` (5.x) cannot run the generator.
  const probe = spawnSync('pwsh', ['-NoProfile', '-Command', 'exit 0'], { encoding: 'utf8' });
  if (probe.error || probe.status !== 0) {
    // Not a failure and not fixable here: without PowerShell 7 no run of this command
    // could ever build the index, so it must not fail the build that asked for it.
    return { status: 'not-attempted', attemptable: false,
             detail: 'PowerShell 7 (pwsh) unavailable; reviewers use path-based discovery' };
  }

  const indexPath = path.join(home, 'knowledge-index.json');
  try { fs.unlinkSync(indexPath); } catch { /* no stale index */ }

  const run = spawnSync('pwsh', ['-NoProfile', '-File', generator, '-BCQualityRoot', home], { encoding: 'utf8' });
  if (run.error || run.status !== 0 || !fs.existsSync(indexPath)) {
    const why = run.error?.message || run.stderr || run.stdout || 'generator failed';
    return { status: 'failed', detail: why.trim().slice(0, 500) };
  }
  const receipt = {
    status: 'prebuilt',
    indexPath,
    indexSha256: sha256(indexPath),
    corpusSha: corpusRevision(home),
    generatedAt: new Date().toISOString(),
    generator: 'tools/Build-KnowledgeIndex.ps1'
  };
  const receiptPath = path.resolve(workspace, RECEIPT);
  fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
  return { ...receipt, status: 'generated', detail: 'built in this invocation; recorded as prebuilt for later runs' };
}

if (require.main === module) {
  const positional = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const [cmd = 'status', ws = '.'] = positional;
  const result = cmd === 'build' ? build(ws) : status(ws);
  if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  else console.log(`BCQuality index: ${result.status} — ${result.detail}`);
  process.exitCode = ok(result) ? 0 : 1;
}
module.exports = { status, build, ok, OK_STATES };
