# BCQuality design guidance (read path)

Used by AL Architecture & Design Specialist and AL Spec Agent. This is the
**read path**: articles are read as context. It never invokes Entry, never runs a
review skill and never produces a findings-report. Nothing here blocks a phase.
Every step below is a directory listing or a file read; no execution is needed.

## Where the corpus is

`external.bcquality.home` in `aldc.yaml` (default `../bcquality`; `$BCQUALITY_HOME`
overrides it). Knowledge lives in `<home>/<layer>/knowledge/<domain>/`, with
`<layer>` one of `custom`, `community`, `microsoft`. If `<home>/skills/entry.md`
cannot be read, BCQuality is not mounted: write `not consulted (not mounted)` in
the evidence line and continue.

## The matching card (READ, reduced to what the corpus uses)

An article's frontmatter has four filters. Today the corpus uses them like this:

| Field | Values you will see | Rule |
|---|---|---|
| `bc-version` | `[all]` or an open range `[N..]` | `[all]` applies always. `[N..]` applies when the project's BC major version ≥ N. Unknown project version → treat `[N..]` as **conditional** and say so. |
| `technologies` | `[al]` | always applies |
| `countries` | `[w1]` | always applies |
| `application-area` | `[all]` | always applies |

If you meet a value outside this card (a closed range `[26..28]`, an explicit list,
a country code, a named area), apply the same idea — inclusion — and mark the
article conditional if the project does not state that dimension. Do not skip it.

The project's BC major version is the first number of `application` in `app.json`.

## Precedence

Custom > Community > Microsoft. Two articles with the same filename in different
layers are the same rule; keep the highest layer and record the displaced path.
(No such pair exists in the corpus today; the rule exists for the fork's future.)

## How to select — without reading the whole index

1. **House rules first.** List `<home>/custom/knowledge/` recursively. Open every
   article there. They are few, they are policy, and they always apply to design.
2. **Platform articles by domain.** For each domain the role needs (the role says
   which), list `<home>/microsoft/knowledge/<domain>/` and
   `<home>/community/knowledge/<domain>/`. **Filenames are the index**: they are
   descriptive kebab-case slugs. Choose candidates by name against the topic of the
   requirement. Open only those; read frontmatter, `## Description`, `## Best
   Practice`, `## Anti Pattern`.
3. If `<home>/knowledge-index.json` exists, you may search it for a domain's rows to
   read one-line descriptions before opening files. Never load the whole file.
4. Apply the matching card. Drop what does not apply; mark what is conditional.
5. Cap platform articles at what the document can use — around 30 for design,
   40 for spec. Never cap house rules.

## What to write

`.github/plans/<req>/<req>.bcq-selection.json`, by the role itself:

    {
      "stage": "design" | "spec",
      "corpus": { "home": "<path>", "sha": "<git rev-parse HEAD if readable, else null>" },
      "target": { "bcVersion": 29 },
      "selected": [
        { "path": "custom/knowledge/events/integrations-go-through-hub.md",
          "layer": "custom", "domain": "events", "title": "…",
          "conditional": false, "unknown": [] }
      ],
      "displaced": [ { "path": "…", "supersededBy": "…" } ],
      "selection": "manual"
    }

`corpus.sha` comes from `<home>/.git/HEAD` → `<home>/.git/refs/heads/<branch>`
(or the receipt `.github/aldc-bcquality-index.json` when present). If unreadable,
`null` — never invent it.

## How to use what you read

1. Cite an article by its exact `path`. Never a title, never a paraphrased slug.
2. A conditional article applies only if the named unknown dimension turns out to
   match. Say which dimension is unknown wherever you rely on it.
3. Precedence is not agreement: a custom article that contradicts a Microsoft one
   wins. Record the displaced path so a reader sees what was overridden.
4. Deviating from a house rule is allowed. Record the deviation and its reason where
   decisions are recorded (architecture decisions / spec open questions). That
   record goes to the human gate that already exists; it is not a block.

## Evidence line

Every document that used the corpus carries, in its header:

    > **BCQuality**: loaded · bcq@<sha short or unknown> · <n> articles (<m> house rules) · selection: manual

`loaded` is the honest stage: articles were read. Never write `executed`, and never
invent a review outcome in these phases. Not mounted → `not consulted (<reason>)`.
