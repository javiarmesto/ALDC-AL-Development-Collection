# BCQuality design guidance (read path)

Used by AL Architecture & Design Specialist and AL Spec Agent for stages `design`
and `spec`. This is the **read path**: articles are context, not code-review
findings. It may route a knowledge question through Entry to `al-knowledge`; it
never invokes `al-code-review`, review action skills or a findings-report. Nothing
here adds an approval gate or blocks a phase when knowledge is unavailable.

## Where the corpus is

Read `external.bcquality` in the current project's `aldc.yaml`. `enabled: false`
means do not probe or load BCQuality; record `not consulted (disabled)` and continue.
In plugin mode, discover the actual installed plugin and its `al-knowledge` skill;
resolve the corpus from that plugin's manifest/root, not from `home`. Expected
version/revision settings are expectations, never observations.

For multiroot or an explicitly reported manual fallback, resolve
`external.bcquality.home` (default `../bcquality`; `$BCQUALITY_HOME` overrides it).
Knowledge lives in `<home>/<layer>/knowledge/<domain>/`, with `<layer>` one of
`custom`, `community`, `microsoft`. A readable corpus without a knowledge skill
supports manual selection. If no corpus is readable, write
`not consulted (not mounted)` and continue. Never silently substitute a sibling
clone for the plugin: record which corpus actually answered and why fallback was
needed. Respect the loaded provider's enabled layers and skill settings.

## The matching card (READ, reduced to what the corpus uses)

An article's frontmatter has four filters. Common values and their rules:

| Field | Common values | Rule |
|---|---|---|
| `bc-version` | `[all]` or an open range `[N..]` | `[all]` applies always. `[N..]` applies when the project's BC major version ≥ N. Unknown project version → treat `[N..]` as **conditional** and say so. |
| `technologies` | `[al]` | Applies to AL work. |
| `countries` | `[w1]` | Applies to the worldwide base. |
| `application-area` | `[all]` | Applies to every area. |

For a closed range (`[26..28]`), explicit version list, country code or named area,
apply READ's inclusion rules. Exclude definite mismatches; retain conditional
matches with their exact unknown dimensions. Do not invent missing dimensions.
The project's BC major version is the first number of `application` in `app.json`.

## Precedence

Custom > Community > Microsoft. Apply the loaded provider's READ rules and record
displaced paths. In manual selection, articles with the same filename in different
layers are the same rule; keep the highest enabled layer.

## Selection path

1. **House rules first.** List `<home>/custom/knowledge/` recursively when that layer
   is enabled. Read every article there in full; they are policy and are uncapped.
2. **Knowledge questions by domain.** For each domain the role needs, ask one
   question tied to the requirement and stage. Pass `bc-version`, `technologies`,
   `countries` and `application-area` only when the project states them. Plugin:
   invoke the skill with that question. Where the host has no skill-invocation
   tool (a skill is an instruction file you read, as in VS Code Copilot), invoking
   it **is** reading its `SKILL.md` and executing its steps inline through the
   dispatched action skill; the `knowledge-response` that action skill produces
   is the response to persist — producing it that way is not fabrication.
   "No tool to invoke it" is never a reason for the manual path. Multiroot:
   execute `<home>/skills/entry.md` with `inputs-available: [knowledge-query]` and
   bind `knowledge-query` and `goal` to the exact question. Follow Entry, READ, DO
   and only the dispatched knowledge action skill; do not synthesize dispatches.
   Reading `SKILL.md` and Entry alone is not a completed consultation.
3. Persist each actual response unchanged in `responses[]`, including its exact
   question, outcome, references and suppressed paths. Entry's `no-match`/`failed`
   dispatch record is retained as such, never relabelled a `knowledge-response`.
   Select only references whose complete bodies were read and whose matching
   conditions were checked. A no-knowledge result is a consulted domain with no
   selection; partial/failed results retain their limitation.
4. **Manual fallback by affected domain.** Use it when the knowledge skill is
   absent, incompatible, inaccessible or fails to answer the affected domain;
   state the reason and actual corpus. List the enabled platform layers'
   `<layer>/knowledge/<domain>/` directories, choose candidates by descriptive
   filename and read them in full. Do not fabricate a skill response for manual
   selection. Missing terminal/PowerShell alone does not require manual selection:
   the knowledge action skill can use its documented path-based retrieval.
5. Apply the matching card and precedence. Cap platform articles at what the
   document can use — around 30 for design, 40 for spec. Never cap house rules.

## Retrieval

The index is an installation precondition for these roles, not work to perform
while designing/specifying. Never run `Build-KnowledgeIndex.ps1` here, including
Entry's usual preparation build. Reuse a verified index/receipt for the actual
corpus revision or use the provider's path-based discovery fallback. A receipt
for a different corpus or revision is not evidence. Never load or search the raw
one-line `knowledge-index.json` through a file reader.

When an authorized terminal and compatible PowerShell are already exposed,
use the installed provider's read-only retrieval helpers:

1. `Search-Knowledge.ps1`: query each required domain across enabled layers, passing
   only known target dimensions. Consume every page with `-Offset` and `-Snapshot`
   from the returned continuation until `complete: true`. Do not sample/top-k the
   catalog. Its rows are discovery metadata, not loaded articles; matching rows
   are the matching card already applied. Read bodies through
   `Get-KnowledgeArticles` (content-hash checked against the index). Its output is
   already bounded (16 KB): never cut it yourself (`Substring`, `Select-Object
   -First`, …). When `complete` is false, call again with `remainingPaths` and
   `-Snapshot <continuation.snapshot>`. Its JSON is one line that file readers
   truncate, so print the bodies instead of reading the raw line.
2. Keep the parsed result to inspect `complete`, `remainingPaths` and
   `continuation`, then display every returned body on separate lines. Use the
   observed corpus root as `$bcqualityRoot` and the selected exact paths as `$paths`:

   ```powershell
   $batch = & "$bcqualityRoot/tools/Get-KnowledgeArticles.ps1" -BCQualityRoot $bcqualityRoot -Paths $paths | ConvertFrom-Json
   $batch.articles | ForEach-Object { "=== $($_.path)"; $_.body }
   # When incomplete, use $batch.remainingPaths and $batch.continuation.snapshot
   # as -Paths and -Snapshot on the next call, preserving the other parameters.
   ```

   If the host still truncates displayed bodies, read the remaining ranges with
   its bounded native-file capability. If a helper cannot fit a complete body,
   use its documented smaller batch/native-file fallback; do not raise its bound
   or truncate the body. An article selected without its body read is not
   `loaded`: read it or drop it.
3. If execution or PowerShell is unavailable, list domain directories and read
   candidate article files completely through native file tools. Report this
   retrieval route accurately; a role gains no execution tool from this guide.

Architect/Spec may use only these read-only retrieval helpers when already
authorized. No builds, tests, provider installation, index regeneration or review
execution is authorized by knowledge consultation.

## What to write

`<plans.root>/<req>/<req>.bcq-selection.json`, by the role itself. `<plans.root>` is
the folder the current installation's `aldc.yaml → plans.root` declares — the same
one the role uses for its requirement documents. Preserve the architect's
selection/constraints as inputs when authoring the spec; record the current stage
and any additional consultations honestly.

Illustrative shape (replace placeholders with actual observations):

```json
{
  "stage": "design",
  "corpus": { "via": "plugin", "home": "<observed root>", "version": null, "sha": null },
  "target": { "bcVersion": 29 },
  "selected": [
    { "path": "custom/knowledge/events/integrations-go-through-hub.md",
      "layer": "custom", "domain": "events", "title": "…",
      "conditional": false, "unknown": [] }
  ],
  "displaced": [ { "path": "…", "supersededBy": "…" } ],
  "selection": "manual",
  "responses": [],
  "domains": [ { "domain": "events", "status": "consulted", "route": "manual", "reason": "Knowledge skill unavailable; article bodies read" } ]
}
```

`al-knowledge` = actual knowledge consultations without manual domain fallback;
`manual` = manual selection without a knowledge consultation;
`mixed` = al-knowledge path with at least one domain that fell back to manual.

A domain counts as **consulted** only if it was actually asked, searched or listed.
A domain the role maps but skipped is reported as `not consulted (<reason>)`, never
under "consulted, nothing selected". Record that distinction in `domains[]` and
the document's consultation summary; an empty selection is not evidence of a query.

Each `responses[]` entry is `{ "domain": "<asked domain>", "response": <actual
unchanged result> }`. An `al-knowledge` selection with empty responses is invalid.
Check actual knowledge responses (not Entry dispatch records) against the answering provider's
`schemas/knowledge-response.schema.json` when validation is available; otherwise
record validation as unverified. Every selected platform path attributed to a
knowledge consultation must be backed by that domain's response references.
House rules read directly are evidenced separately, not invented skill references.

`corpus.sha` comes from the observed corpus revision or a verified receipt for
that corpus; if unreadable, use `null`, never a configured expected revision.
Use `corpus.via: "plugin"` or `"multiroot"` and the observed version when known.
If fallback uses another corpus, record its identity with the affected domain.

## How to use what you read

1. Cite an article by its exact `path`. Never a title or a paraphrased slug.
2. A conditional article applies only if the named unknown dimension matches.
   State that dimension wherever you rely on it.
3. Precedence is not agreement: a custom rule can override a Microsoft rule.
   Record displaced paths so the reader sees what was overridden.
4. Record house-rule deviations and reasons in architecture decisions / spec open
   questions. They go to the existing human gate; this guide adds no block.
5. Spec criteria must resolve in the corpus the downstream reviewer will actually
   use. If the design consultation used another corpus, check every cited path
   there and record differences; do not claim the design corpus proves review
   availability. Unresolved paths must be corrected before spec approval.

## Evidence line

Every document that used the corpus carries, in its header:

    > **BCQuality**: loaded · bcq@<observed version or SHA short or unknown> · <n> articles (<m> house rules) · selection: <al-knowledge|manual|mixed>

`loaded` means the counted article bodies were read completely. Never write
`executed` to imply code review, and never invent a review outcome in these phases.
No corpus read → `not consulted (<reason>)`; partial retrieval states its limits.
