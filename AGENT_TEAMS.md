# Agent Teams Orchestration Guide

This document outlines the strategy and coordination patterns for using Agent Teams within the SoapBuddy workspace.

## 🤝 Team Strategy
When faced with complex, parallelizable tasks, we use an Agent Team approach to increase efficiency and quality.

### When to Form a Team
- **Cross-Layer Refactors**: When changes affect frontend, backend, and database simultaneously.
- **Competing Hypotheses**: When debugging a complex issue with multiple potential root causes.
- **Large-Scale Research**: When evaluating multiple libraries or architectural patterns.
- **Simultaneous Feature Development**: When building independent features that don't depend on each other's code.

## 👑 Role Architecture

### 1. Lead Agent
- **Responsibilities**:
    - Defines the high-level goal and breakdown.
    - Assigns specific, isolated sub-tasks to teammates.
    - Performs final integration and quality review.
    - Maintains the "Core Truth" of the mission.
- **Workflow**:
    - Uses `run_command` to delegate.
    - Monitors progress via `command_status`.

### 2. Teammate Agents
- **Responsibilities**:
    - Executes isolated tasks within a defined scope.
    - Reports success/failure and novel insights back to the Lead.
    - Follows established coding standards and patterns.
- **Scope**:
    - Teammates should ideally work in separate files or directories to avoid merge conflicts.

## 🚦 Communication & Permissions
- **Pre-Approval**: The Lead Agent should ensure permission prompts are pre-approved or minimized for teammates to allow for smooth parallel execution.
- **Handoffs**: Teammates write their results to a specific directory or document identified in the task assignment.

## 🛠 Tools
- **CLI**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` must be enabled.
- **Parallelism**: Launch up to 10 agents simultaneously using supported skills (e.g., `loki-mode`).
