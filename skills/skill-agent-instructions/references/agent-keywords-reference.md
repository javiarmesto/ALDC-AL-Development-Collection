# Instruction Keywords Quick Reference

Official keywords that activate tools in the BC agent runtime.

## Navigation & Search

| Instruction                          | What it does                     |
| ------------------------------------ | -------------------------------- |
| `Navigate to "Sales Order List"`     | Opens the specified page         |
| `Open "Customer Card"`              | Opens a card page                |
| `Search for "ACME" in "Name"`       | Filters a list by field value    |
| `Find the target lead by "No."`     | Searches for a record by field   |

## Reading & Memorizing

| Instruction                                                          | What it does                                    |
| -------------------------------------------------------------------- | ----------------------------------------------- |
| `Read "Credit Limit (LCY)"`                                         | Reads the current field value                   |
| `**Memorize**: "Customer: ACME \| Limit: 50,000"`                   | Stores key-value for later steps                |
| `**Memorize** the external document reference: ABCD1234`             | Stores with explicit example format             |

## Writing & Setting

| Instruction                                        | What it does                    |
| -------------------------------------------------- | ------------------------------- |
| `Set field "Status" to "Approved"`                 | Sets a field value              |
| `Set field "Qualification Score" to 85`            | Sets a numeric field            |
| `Use lookup to select the payment terms`           | Opens lookup on current field   |

## Actions

| Instruction                                    | What it does              |
| ---------------------------------------------- | ------------------------- |
| `Invoke action "Post"`                         | Triggers a page action    |
| `Invoke action "Send to Agent Quote Builder"`  | Triggers custom action    |
| `Confirm the action when prompted`             | Handles confirmation dialog|

## Communication

| Instruction                                                    | What it does                            |
| -------------------------------------------------------------- | --------------------------------------- |
| `**Reply**: "task complete \| Order: 1001 \| Status: Posted"`  | Agent responds to the task              |
| `Write an email to the customer with the confirmation`         | Composes email (requires user review)   |
| `Add comment: "Agent - [Date] \| Result: OK"`                 | Adds a comment line                     |

## Human-in-the-Loop

| Instruction                                                        | What it does                          |
| ------------------------------------------------------------------ | ------------------------------------- |
| `Request user intervention with details: {reason}`                 | Pauses agent, asks user for input     |
| `Request a review before posting`                                  | User must confirm before continue     |
| `Ask for assistance`                                               | Agent seeks help when stuck           |

## Emphasis & Constraints

| Instruction                                    | What it does                          |
| ---------------------------------------------- | ------------------------------------- |
| `**ALWAYS** verify before posting`             | Mandatory rule (bold)                 |
| `**DO NOT** modify Customer records`           | Prohibited action (bold)              |
| `**DO NOT** proceed until date is entered`     | Blocks progress on condition          |

## Rules

1. Page names, field names, and action names MUST match the agent's profile exactly
2. **MEMORIZE** MUST appear BEFORE the value is referenced in later steps
3. **MEMORIZE** SHOULD include an example format for accuracy
4. Agents cannot use "Tell Me" — navigate explicitly via page names
5. All outgoing messages (Reply, email) require user review by default
6. The agent retains action history but NOT page state — use MEMORIZE
