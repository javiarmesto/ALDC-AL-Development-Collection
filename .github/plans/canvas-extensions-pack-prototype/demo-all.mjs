// Loads multiple ALDC methodology canvases over ONE plan dir — proving the catalog pattern
// generalizes across artifacts on a shared markdown core (read path only):
//   C1 Spec Studio · C3 Test-Plan Checklist · C4 Conductor Pipeline.
// Run: node demo-all.mjs [planDir] [reqName]   (defaults: fixture sample-req)

import createConductorCanvas from './extension.mjs';
import createSpecStudioCanvas from './spec-studio.mjs';
import createTestPlanCanvas from './test-plan.mjs';

const [planDir = 'fixture', reqName = 'sample-req'] = process.argv.slice(2);
const opts = { planDir };

const canvases = {
  'C1 Spec Studio': createSpecStudioCanvas(null, opts),
  'C3 Test-Plan Checklist': createTestPlanCanvas(null, opts),
  'C4 Conductor Pipeline': createConductorCanvas(null, opts),
};

for (const [name, canvas] of Object.entries(canvases)) {
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(await canvas.view(reqName), null, 2));
}
