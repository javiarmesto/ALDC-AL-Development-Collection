# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.11.x  | :white_check_mark: |
| 2.10.x  | :white_check_mark: |
| < 2.10  | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within the AL Development Collection, please follow these steps:

### 1. Do Not Publicly Disclose

Please **do not** create a public GitHub issue for security vulnerabilities.

### 2. Report Privately

Send a detailed report via [GitHub Security Advisory](https://github.com/javiarmesto/AL-Development-Collection-for-GitHub-Copilot/security/advisories/new) or email to **javiarmesto [at] gmail.com**

Include in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (if available)

### 3. Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: Within 7 days
  - High: Within 30 days
  - Medium/Low: Next scheduled release

### 4. Disclosure Process

1. We will confirm receipt of your report
2. We will investigate and validate the issue
3. We will develop and test a fix
4. We will release a security patch
5. We will publicly acknowledge your contribution (if desired)

## Security Best Practices

When using this collection:

1. **Review Instructions**: Always review auto-applied instructions before accepting generated code
2. **Validate Prompts**: Verify that prompts match your security requirements
3. **Sensitive Data**: Never include credentials, tokens, or sensitive data in instruction files
4. **Access Control**: Use GitHub's access controls for private repositories
5. **Dependencies**: Keep dependencies updated (run `npm audit` regularly)

## Scope

This security policy applies to:
- All instruction files (`.instructions.md`)
- All agentic workflows and skills (`skills/*/SKILL.md`)
- All agents (`.agent.md`)
- Collection manifest files
- Validation scripts

## Out of Scope

- Issues with GitHub Copilot itself (report to GitHub)
- Issues with VS Code (report to Microsoft)
- Microsoft Dynamics 365 Business Central vulnerabilities (report to Microsoft)
- General AL development questions (use Discussions instead)

## Attribution

We appreciate responsible disclosure and will acknowledge security researchers who help improve the security of this project.

Thank you for helping keep the AL Development Collection and our users safe!
