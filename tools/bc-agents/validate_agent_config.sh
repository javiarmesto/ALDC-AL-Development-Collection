#!/usr/bin/env bash
# validate_agent_config.sh — Validates Agent SDK configuration against official template
# Usage: ./validate_agent_config.sh <project-dir>
set -euo pipefail
PROJECT_DIR="${1:-.}"
ERRORS=0; WARNINGS=0
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'
error() { echo -e "${RED}❌ $1${NC}"; ((ERRORS++)); }
warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; ((WARNINGS++)); }
ok()    { echo -e "${GREEN}✅ $1${NC}"; }

echo "══════════════════════════════════════════════════"
echo " BC Agent SDK Configuration Validator (Template)"
echo "══════════════════════════════════════════════════"

echo -e "\n📋 Registration"
grep -rq 'extends "Agent Metadata Provider"' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "Agent Metadata Provider extended" || error "No Agent Metadata Provider enum extension"
grep -rq 'extends "Copilot Capability"' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "Copilot Capability extended" || error "No Copilot Capability enum extension"
grep -rq 'UnregisterCapability' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "Unregister+Register pattern found" || warn "No UnregisterCapability (template uses Unregister then Register)"
grep -rq 'RegisterCapability' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "RegisterCapability found" || error "No RegisterCapability"
grep -rq 'OnInstallAppPerDatabase' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "OnInstallAppPerDatabase trigger" || error "Missing OnInstallAppPerDatabase (not OnInstallAppPerCompany)"

echo -e "\n📋 Interfaces (correct signatures)"
grep -rq 'implements IAgentFactory' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "IAgentFactory implemented" || error "Missing 'implements IAgentFactory'"
grep -rq 'implements IAgentMetadata' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "IAgentMetadata implemented" || error "Missing 'implements IAgentMetadata'"
grep -rq 'implements IAgentTaskExecution' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "IAgentTaskExecution implemented" || error "Missing 'implements IAgentTaskExecution'"
grep -rq 'GetDefaultInitials' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "GetDefaultInitials found" || warn "Missing GetDefaultInitials in Factory"
grep -rq 'GetCopilotCapability' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "GetCopilotCapability found" || warn "Missing GetCopilotCapability in Factory"
grep -rq 'GetAgentTaskPageContext' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "GetAgentTaskPageContext found" || warn "Missing GetAgentTaskPageContext in TaskExecution"

echo -e "\n📋 Setup Codeunit"
grep -rq 'GetInstructions.*SecretText' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "GetInstructions returns SecretText" || warn "GetInstructions should return SecretText"
grep -rq 'NavApp.GetResourceAsText' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "Instructions loaded from resources" || warn "Instructions should use NavApp.GetResourceAsText"
grep -rq 'PopulateDefaultProfile' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "Agent.PopulateDefaultProfile used" || warn "Should use Agent.PopulateDefaultProfile for profile"

echo -e "\n📋 ConfigurationDialog"
grep -rq 'PageType = ConfigurationDialog' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "ConfigurationDialog page found" || warn "No ConfigurationDialog page"
grep -rq 'SourceTableTemporary = true' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "Temporary source table" || warn "Missing SourceTableTemporary = true"
grep -rq 'Agent Setup Part' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "AgentSetupPart included" || warn "Missing Agent Setup Part"
grep -rq 'AzureOpenAI' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "AzureOpenAI capability check" || warn "Missing AzureOpenAI.IsEnabled check in OnOpenPage"
grep -rq 'InherentEntitlements = X' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "InherentEntitlements = X" || warn "Missing InherentEntitlements = X"

echo -e "\n📋 Task Integration"
if grep -rq "Agent Task Builder" "$PROJECT_DIR" --include="*.al" 2>/dev/null; then
    ok "Agent Task Builder usage found"
    grep -rq "SetExternalId" "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "External IDs set" || warn "No SetExternalId"
    grep -rq "TryFunction\|TryCreate" "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "Error handling present" || warn "No TryFunction for task creation"
else
    warn "No Agent Task Builder usage — add task integration"
fi

echo -e "\n📋 Message Processing"
grep -rq 'AgentMessage.GetText\|"Agent Message"' "$PROJECT_DIR" --include="*.al" 2>/dev/null && ok "AgentMessage.GetText used" || warn "Use AgentMessage.GetText/UpdateText for message processing"

echo -e "\n📋 Anti-Patterns (should NOT appear)"
if grep -rq 'Agent Task Message Analysis' "$PROJECT_DIR" --include="*.al" 2>/dev/null; then
    error "Found 'Agent Task Message Analysis' — this record does NOT exist in SDK"
fi
if grep -rq 'MessageAnalysis\.SetValid\|MessageAnalysis\.AddAnnotation' "$PROJECT_DIR" --include="*.al" 2>/dev/null; then
    error "Found invented MessageAnalysis methods — use Agent Annotation record instead"
fi
if grep -rq 'AgentTaskMessage\.GetMessageContent\|AgentTaskMessage\.IsAgentOutput' "$PROJECT_DIR" --include="*.al" 2>/dev/null; then
    error "Found invented AgentTaskMessage methods — use AgentMessage.GetText() and AgentTaskMessage.Type"
fi
if grep -rq 'GetAgentInstance\|GetUserProfileCode\|GetUserPermissionSets' "$PROJECT_DIR" --include="*.al" 2>/dev/null; then
    error "Found invented Factory methods — use correct IAgentFactory signatures"
fi
if grep -rq 'OnInstallAppPerCompany' "$PROJECT_DIR" --include="*.al" 2>/dev/null; then
    error "Found OnInstallAppPerCompany — template uses OnInstallAppPerDatabase"
fi
if grep -rq 'Custom Agent\b' "$PROJECT_DIR" --include="*.al" 2>/dev/null; then
    warn "Found 'Custom Agent' record reference — this does not exist in standard SDK"
fi

echo -e "\n📋 Project Structure"
[[ -d "$PROJECT_DIR/Integration" ]] && ok "Integration/ directory" || warn "Missing Integration/ directory"
[[ -d "$PROJECT_DIR/Setup" ]] && ok "Setup/ directory" || warn "Missing Setup/ directory"
[[ -d "$PROJECT_DIR/Setup/Metadata" ]] && ok "Setup/Metadata/ directory" || warn "Missing Setup/Metadata/"
[[ -d "$PROJECT_DIR/Setup/TaskExecution" ]] && ok "Setup/TaskExecution/ directory" || warn "Missing Setup/TaskExecution/"
[[ -d "$PROJECT_DIR/Setup/KPI" ]] && ok "Setup/KPI/ directory" || warn "Missing Setup/KPI/"
[[ -d "$PROJECT_DIR/Setup/Permissions" ]] && ok "Setup/Permissions/ directory" || warn "Missing Setup/Permissions/"
[[ -d "$PROJECT_DIR/Setup/Profile" ]] && ok "Setup/Profile/ directory" || warn "Missing Setup/Profile/"
[[ -d "$PROJECT_DIR/Example" || -d "$PROJECT_DIR/example" ]] && ok "Example/ directory" || warn "Missing Example/"
[[ -f "$PROJECT_DIR/.resources/Instructions/InstructionsV1.txt" ]] && ok "Instructions resource file" || warn "Missing .resources/Instructions/InstructionsV1.txt"

echo ""
echo "══════════════════════════════════════════════════"
echo " Results: $ERRORS errors, $WARNINGS warnings"
echo "══════════════════════════════════════════════════"
[[ $ERRORS -eq 0 ]] && echo -e "${GREEN}Agent configuration is valid!${NC}" || echo -e "${RED}Fix $ERRORS errors above.${NC}"
exit $ERRORS
