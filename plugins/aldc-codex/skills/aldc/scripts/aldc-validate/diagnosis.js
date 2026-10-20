'use strict';
// Checks report structure and internal consistency, never runtime truth or causality.
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function validateDiagnosis(text) {
  const blocks = [...text.replace(/\r\n/g, '\n').matchAll(/^```aldc-triage-evidence[ \t]*\n([\s\S]*?)^```[ \t]*$/gm)];
  if (blocks.length !== 1) return { errors: ['Expected exactly one aldc-triage-evidence block'] };
  let data;
  try { data = JSON.parse(blocks[0][1]); } catch { return { errors: ['Evidence block must contain valid JSON'] }; }
  if (!object(data)) return { errors: ['Evidence must be an object'] };
  const errors = [];
  const need = (condition, message) => { if (!condition) errors.push(message); };
  need(data.version === 1, 'Evidence version must be 1');
  for (const key of ['incident', 'baseline', 'target']) need(nonempty(data[key]), `${key} is required`);
  const milestones = object(data.milestones) ? data.milestones : {};
  const states = { capture: ['captured', 'not-captured'], inspection: ['inspected', 'insufficient'],
    diagnosis: ['supported', 'insufficient'], validation: ['pending', 'passed', 'failed', 'unavailable'] };
  for (const [name, allowed] of Object.entries(states)) {
    const item = milestones[name];
    need(object(item) && allowed.includes(item.status), `Invalid or missing ${name} milestone`);
    if (!object(item)) continue;
    if (['captured', 'inspected', 'passed', 'failed'].includes(item.status)) need(nonempty(item.reference), `${name} requires an evidence reference`);
    if (['not-captured', 'insufficient', 'pending', 'unavailable'].includes(item.status)) need(nonempty(item.reason), `${name} requires a reason`);
  }
  if (milestones.inspection?.status === 'inspected') need(milestones.capture?.status === 'captured', 'inspection requires a captured recording');
  const claims = Array.isArray(data.claims) ? data.claims : [];
  need(claims.length > 0, 'At least one claim or explicit uncertainty is required');
  for (const [i, claim] of claims.entries()) {
    if (!object(claim)) { errors.push(`claim ${i + 1} must be an object`); continue; }
    need(nonempty(claim.statement), `claim ${i + 1} requires a statement`);
    need(['supported', 'insufficient', 'not-captured'].includes(claim.status), `claim ${i + 1} has an invalid status`);
    if (claim.status === 'supported') {
      need(milestones.inspection?.status === 'inspected', `claim ${i + 1} requires inspection`);
      const evidence = Array.isArray(claim.evidence) ? claim.evidence : [];
      need(evidence.length > 0, `claim ${i + 1} requires cited observations`);
      for (const item of evidence) need(object(item) && nonempty(item.reference) && nonempty(item.observation), `claim ${i + 1} requires an evidence reference and observation`);
    } else need(nonempty(claim.nextObservation), `claim ${i + 1} requires the next observation`);
  }
  if (milestones.diagnosis?.status === 'supported') need(claims.length > 0 && claims.every(c => c?.status === 'supported'), 'Supported diagnosis requires supported claims');
  if (['passed', 'failed'].includes(milestones.validation?.status)) need(milestones.diagnosis?.status === 'supported', 'Fix validation requires a supported diagnosis');
  return { errors, data };
}
module.exports = { validateDiagnosis };
