# Opportunity Detection Model

This model detects when a request is a strong candidate for a community skill.

## Scoring Dimensions

Rate each dimension 0-2.

1. Repeatability
2. Reusability across projects
3. Workflow complexity (multi-step)
4. Stability of inputs/outputs
5. Anonymization feasibility

## Decision Threshold

- Total score >= 7: suggest skill opportunity once.
- Total score 5-6: optional internal note, do not suggest unless user asks.
- Total score <= 4: do not suggest.

## Suggestion Policy

1. Suggest once per topic.
2. Keep suggestion to 2 lines maximum.
3. Respect rejection and do not insist.
4. Continue primary user task regardless.
