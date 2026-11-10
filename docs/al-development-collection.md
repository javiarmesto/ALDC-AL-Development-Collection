---
title: "AL Development Collection"
linkTitle: "AL Development Collection"
weight: 1
description: >
  AI Native AL Development toolkit with specialist agents, knowledge skills, workflow commands and scoped instructions for systematic Business Central development
---

## Overview

The AL Development Collection provides a complete AI-native development toolkit for Microsoft Dynamics 365 Business Central. Instead of ad-hoc AI usage, you get systematic engineering through 13 agents, 16 knowledge skills, 10 workflows and 9 scoped instruction files, organized across 3 framework layers implementing the AI Native-Instructions Architecture.

**Created by**: [Javier Armesto](https://github.com/javiarmesto)

---

## Key Features

**9 User-Invocable Agents**:
- al-architect 🏗️ (solution design), al-spec-agent 📐 (technical specification), al-developer 💻 (implementation)
- al-conductor 🎭 (TDD orchestration), al-presales 💼 (project planning & cost estimation)
- On demand, read-only on code: al-triage 🩺 (diagnosis), dredd ⚖️ (audit), al-developer-reviewer ✅ (independent review)
- Optional: al-agent-builder 🤖 (Business Central agents with the Agent SDK)

**4 Internal Subagents** (launched by Architect, Spec Agent or Conductor):
- AL Planning Subagent 🔍 (research), AL Implementation Subagent 💻 (TDD implementation)
- AL Code Review Subagent ✅ (validation), AL Knowledge Consultant 📚 (BCQuality knowledge consultation)

**9 Scoped Instructions**:
- Code style, naming conventions, performance patterns
- Error handling, events, testing and security standards
- Context-aware loading via `applyTo` patterns

**10 Agentic Workflows** (skills run as slash commands):
- Environment setup (`/al-initialize`, `/al-build`)
- Development (`/al-spec-create`, `/al-pr-prepare`, `/al-context-create`, `/al-memory-create`)
- BC Agent Builder, optional (`/al-agent-create`, `/al-agent-task`, `/al-agent-instructions`, `/al-agent-test`)

**16 Knowledge Skills** (loaded by agents on demand):
- API, Copilot, debugging, performance, events, permissions, testing, pages, migration, translation and estimation
- Shared review pipeline, contribution assistant and three BC Agent SDK skills

**Complexity Routing**:
- 🟢 LOW → `/al-spec-create` → al-developer (direct implementation)
- 🟡 MEDIUM / 🔴 HIGH → al-architect → `/al-spec-create` → al-conductor (design + TDD)

---

## Links

- **GitHub**: https://github.com/javiarmesto/ALDC-AL-Development-Collection
- **Quick Start**: https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/docs/quick-start-en.md
- **Complete Development Flow**: https://github.com/javiarmesto/ALDC-AL-Development-Collection/blob/main/docs/workflows/complete-development-flow.md
