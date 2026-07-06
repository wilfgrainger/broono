# BRIEFING — 2026-07-04T16:38:33Z

## Mission
Plan, dispatch, and manage subagents to build the beta version of a Tamagotchi-style mobile pet simulation game named 'broono.app'.

## 🔒 My Identity
- Archetype: teamwork_preview_orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: c:\Users\wilf6\dev\broono\.agents\orchestrator
- Original parent: main agent
- Original parent conversation ID: bcf69c5c-50e7-4637-b97d-a139074b313c

## 🔒 My Workflow
- **Pattern**: Project Pattern
- **Scope document**: c:\Users\wilf6\dev\broono\PROJECT.md
1. **Decompose**: Decompose the project into Milestones following the Dual-Track Project Pattern (Implementation Track and E2E Testing Track).
2. **Dispatch & Execute**:
   - **Delegate (sub-orchestrator)**: Spawn sub-orchestrators for milestones that are complex.
   - **Direct (iteration loop)**: For specific subtasks, run Explorer -> Worker -> Reviewer -> Challenger -> Auditor cycle.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed when cumulative subagent spawn count >= 16.
- **Work items**:
  1. Initialization and Planning [pending]
  2. Setup and Exploration [pending]
  3. E2E Testing Infrastructure Track [pending]
  4. Implementation Track: Vital Decay & Local Game Loop [pending]
  5. Implementation Track: Backend API & Auth [pending]
  6. Implementation Track: Verification & E2E Integration [pending]
- **Current phase**: 1
- **Current focus**: Planning

## 🔒 Key Constraints
- Next.js (Static Export) optimized for GitLab Pages.
- Cloudflare Workers backend.
- Cloudflare D1 for SQL, Cloudflare KV for key-value state.
- NVIDIA NIM for DeepSeek V4 flash/pro.
- Supabase Auth for Apple compliance.
- Playwright E2E tests.
- Free tier budget enforcement.
- strict CORS on Worker, allowing GitLab Pages domain only.
- Never reuse a subagent after it has delivered its handoff.
- DO NOT CHEAT. All implementations must be genuine.

## Current Parent
- Conversation ID: bcf69c5c-50e7-4637-b97d-a139074b313c
- Updated: not yet

## Key Decisions Made
- [TBD]

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| c52af8c0-c5f6-4257-bfc7-7d4aeb2a20bf | teamwork_preview_explorer | Setup and Exploration | completed | c52af8c0-c5f6-4257-bfc7-7d4aeb2a20bf |
| bbd65bd1-9a1f-43c8-a3f3-dd4632538f0c | self | E2E Testing Track | in-progress | bbd65bd1-9a1f-43c8-a3f3-dd4632538f0c |
| 1fb39607-c654-4c0c-8223-c844dc586449 | self | Project Setup | in-progress | 1fb39607-c654-4c0c-8223-c844dc586449 |

## Succession Status
- Succession required: no
- Spawn count: 3 / 16
- Pending subagents: bbd65bd1-9a1f-43c8-a3f3-dd4632538f0c, 1fb39607-c654-4c0c-8223-c844dc586449
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: aefd53ec-3fd8-4287-882b-29ac0c29cb3c/task-35
- Safety timer: aefd53ec-3fd8-4287-882b-29ac0c29cb3c/task-137

## Artifact Index
- c:\Users\wilf6\dev\broono\PROJECT.md — Global index, architecture, milestones
- c:\Users\wilf6\dev\broono\.agents\orchestrator\plan.md — Detailed orchestration plan
- c:\Users\wilf6\dev\broono\.agents\orchestrator\progress.md — Internal heartbeat progress tracking
