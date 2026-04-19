# :material-test-tube: AL Testing

<div class="agent-card" markdown>

| | |
|---|---|
| **File** | `al-testing.instructions.md` |
| **Applies to** | `**/test/**/*.al` |
| **Activation** | Context-activated (test files) |
| **Role** | Test patterns & project structure |

</div>

---

## Purpose

Test implementation patterns and AL-Go project structure rules. Ensures proper separation of App and Test projects, correct dependency configuration, and test-on-demand behavior.

## Key rules

| Rule | What it enforces |
|---|---|
| **AL-Go structure** | `App/` for logic, `Test/` for tests — never mixed |
| **Test on demand** | Tests generated only when explicitly requested |
| **Dependencies** | Test → App (never reverse); includes Library Assert |
| **Given/When/Then** | Test procedures follow this naming pattern |
| **Mirror structure** | `Test/src/Feature1Tests/` mirrors `App/src/Feature1/` |

## AL-Go workspace layout

```
Repository/
├── App/
│   ├── src/
│   │   ├── Feature1/
│   │   └── Feature2/
│   └── app.json
├── Test/
│   ├── src/
│   │   ├── Feature1Tests/
│   │   └── Feature2Tests/
│   └── app.json           # references App as dependency
└── al.code-workspace
```

## Dependency configuration

```json
// Test/app.json
{
  "dependencies": [
    { "id": "app-id", "name": "App Name",
      "publisher": "Publisher", "version": "1.0.0.0" }
  ]
}
```

!!! warning "Avoid"
    Auto-generating tests without being asked, placing test code in the App project, or having App depend on Test.

---

<small>Source: [`instructions/al-testing.instructions.md`](https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/instructions/al-testing.instructions.md)</small>