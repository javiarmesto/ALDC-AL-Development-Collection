---
name: skill-permissions
description: "AL permission set design for Business Central. Use when creating PermissionSets, implementing least-privilege access, or designing security models for extensions."
---

# Skill: AL Permission Management

## Purpose

Generate and manage permission sets for AL Business Central extensions following the principle of least privilege: role-based permission design, AL vs XML formats, permission set extensions, and security validation.

## When to Load

This skill should be loaded when:
- A new extension needs its permission sets generated
- Permission errors surface at runtime ("You do not have permission to…")
- Role-based access control is being designed for an extension
- A security or compliance review requires permission documentation
- Permission set extensions need to be created for base-app objects

## Core Patterns

### Pattern 1: AL Permission Set Object (Preferred)

Generate with the VS Code permission-set generation command (not an agent tool), then refine:

```al
permissionset 50100 "Contoso Sales"
{
    Assignable = true;
    Caption = 'Contoso Sales Permissions';

    Permissions =
        // Tables — object-level execute
        table "Contoso Sales Setup" = X,
        table "Contoso Discount Rule" = X,
        // Table data — RIMD granularity
        tabledata "Contoso Sales Setup" = R,          // read-only for most users
        tabledata "Contoso Discount Rule" = RIMD,     // full CRUD
        // Executable objects
        codeunit "Contoso Sales Management" = X,
        page "Contoso Sales Setup Card" = X,
        page "Contoso Discount Rules List" = X,
        report "Contoso Sales Summary" = X,
        xmlport "Contoso Sales Import" = X;
}
```

**Permission letters for `tabledata`:**

| Letter | Meaning | Grant when… |
|---|---|---|
| `R` | Read | User needs to view data |
| `I` | Insert | User needs to create records |
| `M` | Modify | User needs to edit existing records |
| `D` | Delete | User needs to remove records (grant sparingly) |

For non-tabledata objects (`table`, `codeunit`, `page`, `report`, `xmlport`, `query`):
- `X` = Execute / Run
- `0` = No permission (omit the line instead)

### Pattern 2: Role-Based Hierarchy (Least Privilege)

Design a layered permission structure — each role includes only what it needs:

```al
// Layer 1: Base — read-only access shared by all roles
permissionset 50100 "Contoso Base"
{
    Assignable = false;                   // not directly assignable to users
    Caption = 'Contoso Base (Read)';

    Permissions =
        tabledata "Contoso Sales Setup" = R,
        tabledata "Contoso Discount Rule" = R,
        page "Contoso Sales Setup Card" = X,
        page "Contoso Discount Rules List" = X;
}

// Layer 2: User — standard operations (includes Base)
permissionset 50101 "Contoso User"
{
    Assignable = true;
    Caption = 'Contoso User';

    IncludedPermissionSets = "Contoso Base";

    Permissions =
        tabledata "Contoso Discount Rule" = IM,      // create + edit (no delete)
        codeunit "Contoso Sales Management" = X,
        report "Contoso Sales Summary" = X;
}

// Layer 3: Admin — full control (includes User)
permissionset 50102 "Contoso Admin"
{
    Assignable = true;
    Caption = 'Contoso Admin';

    IncludedPermissionSets = "Contoso User";

    Permissions =
        tabledata "Contoso Sales Setup" = RIMD,       // full CRUD on setup
        tabledata "Contoso Discount Rule" = D,         // adds Delete
        xmlport "Contoso Sales Import" = X;            // data import only for admin
}
```

**Design rules:**
- `Assignable = false` for base/internal layers — only assign leaf-level sets to users
- `IncludedPermissionSets` builds hierarchy — no need to repeat parent permissions
- Separate functional areas into distinct sets when the extension covers multiple domains

### Pattern 3: Permission Set Extension

Extend existing BC permission sets to include your extension's objects — so users with standard roles automatically get access:

```al
permissionsetextension 50100 "Contoso D365 Sales Ext" extends "D365 SALES"
{
    Permissions =
        tabledata "Contoso Discount Rule" = RIMD,
        codeunit "Contoso Sales Management" = X,
        page "Contoso Discount Rules List" = X;
}

permissionsetextension 50101 "Contoso D365 Read Ext" extends "D365 READ"
{
    Permissions =
        tabledata "Contoso Sales Setup" = R,
        tabledata "Contoso Discount Rule" = R,
        page "Contoso Sales Setup Card" = X;
}
```

**When to use `permissionsetextension`:**
- Your objects should be accessible to users who already have a standard BC role
- Avoids requiring admins to manually assign a new permission set to every user
- Always limit to what that role level logically needs (read-only for D365 READ, full for D365 SALES)

### Pattern 4: XML Permission Set (Legacy Format)

Generate the XML format via the VS Code permission-set command (not an agent tool) when:
- Targeting older BC versions (< BC 20)
- Import via BC admin UI is required
- Customer tooling only supports XML format

```xml
<?xml version="1.0" encoding="utf-8"?>
<PermissionSets>
  <PermissionSet RoleID="CONTOSO-SALES" RoleName="Contoso Sales Permissions">
    <Permission>
      <ObjectType>0</ObjectType>         <!-- TableData -->
      <ObjectID>50100</ObjectID>
      <ReadPermission>1</ReadPermission>
      <InsertPermission>1</InsertPermission>
      <ModifyPermission>1</ModifyPermission>
      <DeletePermission>0</DeletePermission>
    </Permission>
    <Permission>
      <ObjectType>5</ObjectType>         <!-- Codeunit -->
      <ObjectID>50100</ObjectID>
      <ExecutePermission>1</ExecutePermission>
    </Permission>
  </PermissionSet>
</PermissionSets>
```

XML `ObjectType` codes: `0` = TableData, `1` = Table, `3` = Report, `5` = Codeunit, `6` = XMLport, `8` = Page, `9` = Query.

**Prefer AL format** for new development — it lives in source control, participates in build, and supports `IncludedPermissionSets`.

### Pattern 5: Indirect Permissions and TestPermissions

Some objects are accessed indirectly (via codeunit calls) and need indirect permission:

```al
// In the codeunit that accesses data on behalf of the user
codeunit 50100 "Contoso Sales Management"
{
    Permissions =
        tabledata "Contoso Internal Log" = RIMD;   // indirect — user doesn't access directly
}
```

For test codeunits, set the permission level to validate security:

```al
codeunit 50200 "Contoso Sales Test"
{
    Subtype = Test;
    TestPermissions = Restrictive;   // NonRestrictive | Restrictive | Disabled

    [Test]
    procedure TestUserCanCreateDiscount()
    var
        PermissionsMock: Codeunit "Library - Lower Permissions";
    begin
        // Simulate a user with only "Contoso User" permissions
        PermissionsMock.SetOutsidePermissionSet("Contoso User");

        // Test that user CAN create discount rule
        // ...
    end;
}
```

## Workflow

### Step 1: Analyze Required Permissions

1. List all custom objects in the extension (tables, pages, codeunits, reports, xmlports)
2. For each object, determine the minimum access level needed per role
3. Identify base-app objects accessed indirectly (need `Permissions` property on codeunit)
4. Map roles to permission layers: Base (read) → User (operate) → Admin (configure + delete)

### Step 2: HITL Security Gate (MANDATORY)

**STOP — present the permission matrix to the user before generating:**

```markdown
| Object | Type | Base (R) | User | Admin |
|---|---|---|---|---|
| Contoso Sales Setup | tabledata | R | R | RIMD |
| Contoso Discount Rule | tabledata | R | RIM | RIMD |
| Contoso Sales Mgmt | codeunit | — | X | X |
| Contoso Sales Import | xmlport | — | — | X |
```

Justify each permission and confirm the principle of least privilege is respected.
**Wait for explicit approval before generating permission sets.**

### Step 3: Generate and Refine

1. Generate the initial full set via the VS Code permission-set command (not an agent tool)
2. Split into role-based layers (Pattern 2)
3. Create `permissionsetextension` for standard BC roles if needed (Pattern 3)
4. Add indirect permissions to codeunits (Pattern 5)
5. Build: `al_build` — verify no errors

### Step 4: Test with Restrictive Permissions

1. Set `TestPermissions = Restrictive` on test codeunits
2. Run tests simulating each role
3. Verify: users with "Base" CANNOT create/modify/delete
4. Verify: users with "User" CAN operate but NOT delete setup data
5. Verify: users with "Admin" have full access
6. Document any runtime permission errors and adjust sets

### Step 5: Document Permission Model

Include in the extension's documentation or architecture file:
- Role matrix (object × role × RIMD)
- Rationale for elevated permissions (Delete, setup tables)
- Permission set extension mappings to standard BC roles
- Indirect permissions declared on codeunits

## References

- [Permission Set Object — Microsoft Docs](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-permissionset-object)
- [Permission Set Extension Object](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-permissionset-ext-object)
- [Permissions on AL Objects](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/properties/devenv-permissions-property)
- [TestPermissions Property](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/properties/devenv-testpermissions-property)
- [Assign Permissions to Users](https://learn.microsoft.com/en-us/dynamics365/business-central/ui-define-granular-permissions)

## Constraints

- **NEVER** generate permission sets without HITL security gate approval (Step 2)
- **NEVER** grant `D` (Delete) on setup/configuration tables unless explicitly justified
- **NEVER** grant permissions on system tables — use appropriate APIs instead
- **NEVER** set `Assignable = true` on intermediate/base layers (only leaf-level sets)
- Permission errors at runtime → load `skill-debug.md` for investigation
- Data sensitivity classification and GDPR → outside this skill scope
