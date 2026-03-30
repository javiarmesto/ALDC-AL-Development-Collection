---
name: skill-migrate
description: "AL version migration for Business Central. Use when upgrading extensions between BC versions, handling breaking changes, or implementing rollback strategies."
---

# Skill: AL Project Migration

## Purpose

Plan and execute BC platform version upgrades: app.json configuration, breaking-change remediation, deprecated API replacement, event signature updates, upgrade codeunits for data migration, rollback strategy, and manifest regeneration.

## When to Load

This skill should be loaded when:
- Upgrading an AL extension to a newer BC platform version (e.g., BC 23.x → 24.x)
- Fixing compilation errors after updating the runtime or platform property
- Replacing deprecated AL patterns (C/AL legacy, obsolete APIs)
- Updating event subscriber signatures after base-app changes
- Writing upgrade codeunits for schema changes or data migration
- Generating a full deployment package after migration

## Core Patterns

### Pattern 1: App.json Platform Update

Update the three version-sensitive properties in `app.json`:

```json
{
  "platform": "25.0.0.0",
  "runtime": "14.0",
  "application": "25.0.0.0",
  "dependencies": [
    {
      "id": "63ca2fa4-4f03-4f2b-a480-172fef340d3f",
      "name": "System Application",
      "publisher": "Microsoft",
      "version": "25.0.0.0"
    }
  ],
  "features": ["TranslationFile", "GenerateCaptions", "NoImplicitWith"]
}
```

**Rules:**
- `platform` — target BC platform version (major.minor.0.0)
- `runtime` — AL runtime version matching the target (see [runtime matrix](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-choosing-runtime))
- `application` — must match or be compatible with target platform
- Update all `dependencies` versions to match the target release
- Add new `features` flags required by the target runtime (e.g., `NoImplicitWith` from runtime 11.0+)

### Pattern 2: Deprecated Code Replacement

Replace legacy patterns with modern equivalents:

```al
// ❌ Deprecated — C/AL style
Record.FIND('-');
Record.FINDSET(TRUE, TRUE);
IF Record.FINDFIRST THEN;
Record.INIT;
Record.INSERT;

// ✅ Modern — AL patterns
Record.FindSet();
Record.FindSet(true, true);
if Record.FindFirst() then;
Record.Init();
Record.Insert(true);
```

```al
// ❌ Deprecated — WITH statement (removed in NoImplicitWith)
with SalesHeader do begin
    "Document Type" := "Document Type"::Order;
    "Sell-to Customer No." := CustomerNo;
    Insert(true);
end;

// ✅ Modern — explicit record reference
SalesHeader."Document Type" := SalesHeader."Document Type"::Order;
SalesHeader."Sell-to Customer No." := CustomerNo;
SalesHeader.Insert(true);
```

```al
// ❌ Deprecated — TextConst (runtime < 6.0)
CustomerNotFoundErr@1000 : TextConst 'ENU=Customer %1 not found.';

// ✅ Modern — Label
var
    CustomerNotFoundErr: Label 'Customer %1 not found.';
```

### Pattern 3: Event Signature Migration

When base-app events add or change parameters between versions:

```al
// BC 23.x subscriber — 3 parameters
[EventSubscriber(ObjectType::Codeunit, Codeunit::"Sales-Post",
                 OnBeforePostSalesDoc, '', false, false)]
local procedure OnBeforePost(
    var SalesHeader: Record "Sales Header";
    CommitIsSuppressed: Boolean;
    var IsHandled: Boolean)
begin
    // ...
end;

// BC 24.x — same event now has 4 parameters (new PreviewMode added)
[EventSubscriber(ObjectType::Codeunit, Codeunit::"Sales-Post",
                 OnBeforePostSalesDoc, '', false, false)]
local procedure OnBeforePost(
    var SalesHeader: Record "Sales Header";
    CommitIsSuppressed: Boolean;
    PreviewMode: Boolean;
    var IsHandled: Boolean)
begin
    // ...
end;
```

**Migration steps:**
1. Build with `al_build` — signature mismatches produce `AL0482` errors
2. Use `al_get_object_definition` to inspect the new publisher signature
3. Update parameter list to match exactly (name, type, order)
4. Re-verify with `al_build`

### Pattern 4: Obsolete Object Handling

Handle objects marked `ObsoleteState = Removed` in the target version:

```al
// Step 1: Find usage of removed objects
// al_search_objects — search for the obsolete table/page/codeunit

// Step 2: Replace with the designated successor
// Before (removed in BC 24):
// Codeunit 80 "Sales-Post (Yes/No)" — ObsoleteState = Removed
// After:
Codeunit.Run(Codeunit::"Sales-Post", SalesHeader);

// Step 3: Check ObsoleteReason for migration guidance
// ObsoleteReason typically says: "Use codeunit X instead"
```

**Process:**
1. Compile → collect all `AL0503` (removed) and `AL0432` (pending) warnings
2. For `Removed` — must fix before compilation succeeds
3. For `Pending` — fix proactively to avoid future breaks
4. Check release notes for each removed object's replacement

### Pattern 5: Upgrade Codeunit (Data Migration)

Use upgrade codeunits to transform data when schema changes between versions:

```al
codeunit 50100 "Contoso Data Upgrade"
{
    Subtype = Upgrade;

    trigger OnUpgradePerCompany()
    var
        Module: Info;
    begin
        Module.DataVersion(1);      // check data version tracking
        MigrateCustomerLoyaltyData();
        SplitAddressFields();
    end;

    trigger OnValidateUpgradePerCompany()
    begin
        // Pre-upgrade validation — runs before OnUpgradePerCompany
        VerifyDataIntegrity();
    end;

    local procedure MigrateCustomerLoyaltyData()
    var
        Customer: Record Customer;
        ContosoLoyalty: Record "Contoso Loyalty Entry";
        UpgradeTag: Codeunit "Upgrade Tag";
    begin
        if UpgradeTag.HasUpgradeTag(GetLoyaltyMigrationTag()) then
            exit;

        // Migrate data from old field to new table
        Customer.SetFilter("Contoso Legacy Points", '>0');
        if Customer.FindSet() then
            repeat
                ContosoLoyalty.Init();
                ContosoLoyalty."Customer No." := Customer."No.";
                ContosoLoyalty.Points := Customer."Contoso Legacy Points";
                ContosoLoyalty."Entry Date" := WorkDate();
                ContosoLoyalty.Insert();
            until Customer.Next() = 0;

        UpgradeTag.SetUpgradeTag(GetLoyaltyMigrationTag());
    end;

    local procedure GetLoyaltyMigrationTag(): Code[250]
    begin
        exit('CONTOSO-LOYALTY-MIGRATION-20260301');
    end;
}
```

**Upgrade codeunit rules:**

- `Subtype = Upgrade` — BC runs these automatically during app upgrade
- Use `UpgradeTag` to ensure idempotency — never run migration twice
- `OnValidateUpgradePerCompany` runs first — validate data before transforming
- `OnUpgradePerCompany` runs per company — do the actual migration
- Always test with a copy of production data before deploying
- For large datasets, use `SelectLatestVersion()` and batch processing

### Pattern 6: Rollback Strategy

Document and prepare rollback before executing migration:

```markdown
## Rollback Plan — {Project} Migration v{X} → v{Y}

### Pre-Migration Checklist
- [ ] Git branch created from stable tag: `git checkout -b migration/vX-to-vY vX.0.0`
- [ ] Database backup taken and verified
- [ ] Extension .app file of current version archived
- [ ] Rollback tested in sandbox environment

### Rollback Procedure
1. **Code rollback**: `git checkout vX.0.0` — restore previous version
2. **Extension rollback**: Uninstall new version, install archived .app
3. **Data rollback** (if upgrade codeunit ran):
   - Restore database from pre-migration backup
   - OR run compensating downgrade codeunit (if written)
4. **Verify**: Run smoke tests on restored environment

### Point of No Return
⚠️ After these actions, rollback requires database restore:
- Upgrade codeunits that DELETE data
- Schema changes that DROP columns
- External system notifications sent
```

**Rollback rules:**

- Always create a rollback plan BEFORE starting migration
- Tag the pre-migration commit: `git tag vX.0.0-pre-migration`
- Archive the current .app file alongside the plan
- Test rollback in sandbox — never assume it works
- If upgrade codeunit is destructive (deletes data), document the point of no return

## Workflow

### Step 1: Pre-Migration Assessment

1. **Backup**: Ensure source control is up to date (`git status` clean)
2. **Download current symbols**: `al_download_source`
3. **Document dependencies**: `al_get_package_dependencies` — list all with current versions
4. **Review release notes**: Check BC target version breaking changes
5. **Create migration plan** in `.github/plans/{project}-migration.md`

**PAUSE — wait for user approval before modifying files.**

### Step 2: Update Configuration

1. Update `app.json` (Pattern 1) — platform, runtime, application, dependencies, features
2. Download new symbols for target version
3. Build: `al_build` — collect all errors

### Step 3: Fix Compilation Errors

Prioritize by error type:
1. **AL0503** (Removed objects) → Pattern 4
2. **AL0482** (Event signature mismatch) → Pattern 3
3. **AL0432** (Deprecated usage) → Pattern 2
4. **Other errors** → case-by-case analysis

For each fix, verify with incremental build.

### Step 4: Regenerate and Validate

1. Generate manifest: `al_generate_manifest`
2. Full build: `al_build` — zero errors, zero new warnings
3. Create package: `al_full_package`
4. Run existing tests to verify no regressions

### Step 5: Post-Migration

1. Update CHANGELOG with migration notes
2. Tag the commit with new version
3. Test in sandbox environment before production

## Version-Specific Notes

| Upgrade Path | Key Breaking Changes |
|---|---|
| BC 20 → 21 | New permission model, page layout changes |
| BC 21 → 22 | Namespace support, `NoImplicitWith` enforcement |
| BC 22 → 23 | Async patterns, isolated events, security hardening |
| BC 23 → 24 | New AL capabilities, event parameter additions |
| BC 24 → 25 | Enhanced debugging, agent integration, new runtime features |

## References

- [Choosing the Runtime Version](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-choosing-runtime)
- [Breaking Changes per Release](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/upgrade/deprecated-features-w1)
- [ObsoleteState Property](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/properties/devenv-obsoletestate-property)
- [App.json Properties](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-json-files)
- [NoImplicitWith Feature](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-deprecating-with-statements-overview)
- [Upgrade Codeunits](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-upgrading-extensions)
- [Upgrade Tags](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-upgrading-extensions#upgrade-tags)

## Constraints

- This skill covers **version migration planning, breaking-change remediation, and configuration updates**
- Do NOT modify base BC objects — extension-only changes
- Do NOT skip the pre-migration backup and assessment step
- Do NOT combine migration with feature development — migrate first, then develop
- Always create a migration plan and obtain approval before modifying files
- Event debugging → `skill-debug.md` | Performance after migration → `skill-performance.md` | Test verification → `skill-testing.md`
