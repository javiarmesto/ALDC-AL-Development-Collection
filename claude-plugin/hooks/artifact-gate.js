#!/usr/bin/env node
'use strict';
// aldc-claude: PostToolUse on Write/Edit. Mechanical checks the conductor's process gate
// relied on the model to remember (M17, October 2026: a phase review without its BCQuality
// article list was accepted, and 1 of 5 subscribers had no comment).
// 1. <task>-review-phase-N.json: must parse and carry review.security (5 checks) and, when
//    BCQuality articles were selected, review.bcquality.articles with a valid disposition each.
// 2. .al files: every [EventSubscriber] needs a one-line comment above its attributes.
// Returns decision "block" with the reason, which Claude Code feeds back to the model.
const runtime = require('./aldc-runtime');

const SECURITY = ['write-scope', 'permission-sets', 'secrets', 'event-bypass', 'table-validation'];
const BAD_REASON = /not requested|out of scope|future work/i;

function reviewProblems(text) {
  let r;
  try { r = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); } catch { return ['the file is not valid JSON: write the reviewer\'s Review-Report JSON verbatim']; }
  const review = r.review || {};
  const out = [];
  const checks = (review.security?.checks || []).map((c) => c.check);
  const missing = SECURITY.filter((c) => !checks.includes(c));
  if (missing.length) out.push(`review.security lacks ${missing.join(', ')}`);
  const bcq = review.bcquality || {};
  if (bcq.outcome !== 'not-applicable') {
    const arts = bcq.articles;
    if (!Array.isArray(arts) || !arts.length) out.push('review.bcquality.articles is missing: every article of the BCQuality selection needs a disposition, also when the provider flow completed');
    else {
      const bad = arts.filter((a) => !['applied', 'not-applicable', 'dismissed'].includes(a.status) || (a.status !== 'applied' && (!a.reason || BAD_REASON.test(a.reason))));
      if (bad.length) out.push(`${bad.length} BCQuality article(s) without a valid disposition (status applied | not-applicable | dismissed, with a technical reason; "not requested" is not one): ${bad.slice(0, 3).map((a) => a.path).join(', ')}`);
    }
  }
  return out;
}

function subscriberProblems(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  lines.forEach((l, i) => {
    if (!/\[EventSubscriber\(/.test(l)) return;
    let j = i - 1; while (j >= 0 && /^\s*\[/.test(lines[j])) j--;
    if (!/^\s*\/\//.test(lines[j] || '')) out.push(`line ${i + 1}`);
  });
  return out;
}

function gate(payload) {
  if (!/^(Write|Edit|MultiEdit)$/.test(payload?.tool_name || '')) return null;
  const file = String(payload.tool_input?.file_path || '');
  const text = runtime.read(file);
  if (text == null) return null;
  if (/-review-phase-\d+(-r\d+)?\.json$/i.test(file)) {
    const p = reviewProblems(text);
    if (p.length) return { decision: 'block', reason: `ALDC process gate (${file.split(/[\\/]/).pop()}): ${p.join('; ')}. ` +
      'Send the reviewer back for just the missing part (a new foreground aldc:al-review-subagent call) and persist its JSON verbatim; do not fill it in yourself.' };
  } else if (/\.al$/i.test(file)) {
    const p = subscriberProblems(text);
    if (p.length) return { decision: 'block', reason: `ALDC: ${file.split(/[\\/]/).pop()} has [EventSubscriber] without a one-line comment above it (${p.join(', ')}). ` +
      'Add a comment saying why that event is the right point in the standard flow.' };
  }
  return null;
}

if (require.main === module) {
  try { const out = gate(runtime.readStdin()); if (out) console.log(JSON.stringify(out)); }
  catch { /* never block work because of the hook itself */ }
}
module.exports = { gate, reviewProblems, subscriberProblems };
