# Validation-Report contract (scope `validate`, 6.0.0)

The validation checks that what was delivered matches **what the requester asked for**, not only what the spec says. The review checks the code against the spec; the validation checks the spec, the criteria and the code against the original request. The rules were adapted from an eval on 28 Nov 2026, in which this check found a requirement point with no criterion and a delivered name that contradicted the request. Neither the review nor `trace.js` had found them.

## Inputs (paths come in the brief)
- **The original request:** the issue text saved as `<plans.root>/<req>/request.md`, the DRF, or the requirement document. It is the source of truth. If the brief names none, use the documents that the *Source* column of the spec's Requirement points cites.
- **The spec's Requirement points table:** each `REQ-NN`, what was asked, its source and the acceptance criteria that should prove it.
- **`tickets/criteria.md`:** the text of each criterion.
- **`<req>-review-final.json`:** `review.criteria` (met, unmet, not-evaluated).
- **`traceability.md`,** when present.
- **The code under the app and test folders.**

## What to check, for every REQ-NN
1. **Fidelity of the point.** Does the row say everything the source says, with the same limits, defaults, values, names and error cases? Quote the source.
2. **Coverage.** Read the text of each criterion the point names. Does that set test every part of the point? A criterion that tests only part of the point leaves it **partial**: name the part that no criterion checks.
3. **Evidence.** For each part, name what proves it: a test, the review verdict, or only a manual check. Then check that the part exists in the code, and cite the file and the object.
4. **Contradictions.** Flag every place where the spec, a criterion or the code differs from the source. That includes exact names the request fixes, such as object, permission set, field and caption names.

Then check the reverse direction once: is there anything in the source that no REQ row captures?

Facts come from the files, never from assumption. If you cannot tell, write `unknown` and say why. You are read-only: never edit a file and never run a command.

## Verdict per REQ
- `covered`: every part has a criterion, and the review or a test checks it.
- `partial`: some part has no criterion, or its criterion does not test it.
- `contradicted`: the spec, a criterion or the code disagrees with the source. Give the file and the line to change.
- `not covered`: no criterion checks the point.
- `manual only`: the only proof is a manual check that has not been run.

## Answer
A short paragraph, then one fenced block under the heading `### Validation-Report (JSON)`:

```json
{
  "requirements": [
    { "req": "REQ-07", "verdict": "partial",
      "parts": [ { "part": "Rating Note up to 100 characters", "criteria": [], "evidence": "field 71203; no test, no criterion", "status": "missing" } ],
      "missing": "No criterion checks the Rating Note",
      "fix": null },
    { "req": "REQ-10", "verdict": "contradicted",
      "parts": [ { "part": "Permission set named DR Follow-Up", "criteria": ["AC-09"], "evidence": "permissionset 71211 \"DR FollowUp\"", "status": "contradicted" } ],
      "missing": null,
      "fix": { "file": "App/src/Permissions/DRFollowUp.PermissionSet.al", "change": "rename the permission set to \"DR Follow-Up\"" } }
  ],
  "uncaptured": [ { "source": "quote from the request", "why": "no REQ row captures it" } ],
  "summary": { "covered": 0, "partial": 0, "contradicted": 0, "not covered": 0, "manual only": 0 }
}
```

## What the caller does with it
- The caller persists it verbatim as `<req>-validation.json`.
- `contradicted`: one correction implementer applies the `fix`. Then the build runs, and the validation runs once more. If the point is still `contradicted`, the run is blocked.
- `partial`, `not covered` and `manual only` do not block. The final report lists them under *Not verified*, each with its missing part.
- Every row goes into the final report's *Requirement coverage* table, next to the `trace.js` verdict.
