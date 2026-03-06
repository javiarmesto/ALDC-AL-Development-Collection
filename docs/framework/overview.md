# Framework Overview

The **AI Native-Instructions Architecture** is a systematic framework for building AI-powered development tools using three fundamental layers.

## Three-Layer Architecture

```mermaid
graph TB
    Dev[👤 Developer] --> Layer1[Layer 1: Markdown Prompt Engineering]
    Layer1 --> |Structured Instructions| Layer2[Layer 2: Agent Primitives]
    Layer2 --> |Context Optimization| Layer3[Layer 3: Context Engineering]
    
    Layer2 --> Instructions["📋 Instructions Files (Auto-applied guidelines)"]
    Layer2 --> Agents["💬 Agents (Role-based specialists)"]
    Layer2 --> Prompts["🎯 Prompts-Agentic Workflows (Task execution)"]
    
    Layer3 --> Modular["Modular Loading (applyTo patterns)"]
    Layer3 --> AGENTSMD["AGENTS.md Standard (Universal portability)"]
    
    style Layer1 fill:#9C27B0
    style Layer2 fill:#2196F3
    style Layer3 fill:#4CAF50
```

## Layer 1: Markdown Prompt Engineering

Human-readable structured instructions in Markdown format with YAML frontmatter.

**Key Features:**

- Universal format (works across all AI assistants)
- Version controlled
- Easy to maintain and update
- Self-documenting

## Layer 2: Agent Primitives

Three types of reusable components:

### 📋 Instructions (9 primitives)

Auto-applied persistent rules via `applyTo` patterns.

### 🎯 Agentic Workflows (6 primitives)

Complete task execution processes as `.prompt.md` files.

### 💬 Agents (7 primitives — 4 public + 3 subagents)

Role-based specialists with defined tool boundaries.

## Layer 3: Context Engineering

Optimization strategies:

- **Modular Loading**: Only load relevant context
- **Pattern Matching**: `applyTo` patterns for automatic application
- **AGENTS.md Standard**: Universal portability across platforms

## Benefits

!!! success "Key Advantages"
    - ✅ **Portable**: Works with any AI assistant
    - ✅ **Maintainable**: Plain text, version controlled
    - ✅ **Modular**: Load only what you need
    - ✅ **Scalable**: Easy to extend
    - ✅ **Standard**: Follows AI Native conventions

## Statistics

| Metric | Value |
|:-------|:------|
| **Total Primitives** | 40 |
| **Instructions** | 9 |
| **Skills** | 11 |
| **Agentic Workflows** | 6 |
| **Agents** | 7 (4 public + 3 subagents) |
| **Templates** | 7 |
| **Framework Version** | 1.1.0 |

## Learn More

- [Architecture Details](architecture.md)
- [Getting Started](../getting-started.md)
- [Contributing Guide](../CONTRIBUTING.md)
