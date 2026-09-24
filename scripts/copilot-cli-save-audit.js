#!/usr/bin/env node
'use strict';
// Explicit caller/human operation; never granted to the read-only Dredd agent.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function saveAudit({ project, report }) {
  if (!project || typeof report !== 'string') throw Error('project and JSON report are required');
  const data = JSON.parse(report);
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      !data.audit || data.audit.gate !== 'advisory' ||
      !['PASS', 'PASS_WITH_FINDINGS', 'FAIL', 'INCOMPLETE'].includes(data.audit.verdict) ||
      !Array.isArray(data.findings) || !data.summary || typeof data.summary !== 'object') {
    throw Error('Expected an advisory Audit-Report JSON envelope (not a review verdict validator)');
  }
  const root = fs.realpathSync(project);
  if (!fs.statSync(root).isDirectory()) throw Error('project must be a directory');
  let dir = root;
  for (const part of ['.github', 'audits']) {
    dir = path.join(dir, part);
    try { fs.mkdirSync(dir, { mode: 0o700 }); } catch (e) { if (e.code !== 'EEXIST') throw e; }
    const stat = fs.lstatSync(dir);
    if (stat.isSymbolicLink() || !stat.isDirectory() || fs.realpathSync(dir) !== dir) {
      throw Error('Audit destination must be a real directory inside the selected project');
    }
  }
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const file = path.join(dir, `dredd-audit-${stamp}-${crypto.randomUUID()}.json`);
  // Exclusive create: never overwrite an audit or follow a pre-existing file link.
  fs.writeFileSync(file, report, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  return { path: file, sha256: crypto.createHash('sha256').update(report).digest('hex'), persisted: true };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 4 || args[0] !== '--project' || args[2] !== '--input') {
      throw Error('Usage: node save-audit.js --project <directory> --input <report.json|->');
    }
    const bytes = fs.readFileSync(args[3] === '-' ? 0 : args[3]);
    const report = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    console.log(JSON.stringify(saveAudit({ project: args[1], report }), null, 2));
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { saveAudit };
