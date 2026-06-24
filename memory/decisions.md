# Decisions

Architectural and design decisions for agent-memory-harness.

## 1. Positioning: memory layer, not agent runtime

**Context:** Project name says "harness"; easy to misread as a replacement for Claude Code / OpenCode / Codex.
**Decision:** Position as a repo-local memory layer that those runtimes read via `AGENTS.md` / `CLAUDE.md`. State this explicitly in README.
**Alternatives considered:** "Full harness" framing (rejected — competes with runtimes instead of complementing them).
**Consequences:** README must lead with "not an agent runtime" disclaimer. Avoid promising features runtimes provide.
**Source:** external review, 2026-06-25

## 2. Security rules live in AGENTS.md.tmpl, not memory/security.md

**Context:** Public repos risk users committing secrets / tokens / private data into `memory/`.
**Decision:** Add a Safety section to `agents/AGENTS.md.tmpl` and `README.md`. Do not create a separate `memory/security.md` file.
**Alternatives considered:** `memory/security.md` (rejected — security rules are global, not project findings; belong in the template).
**Consequences:** Safety rules apply to every repo bootstrapped with this harness, not just this one.
**Source:** external review, 2026-06-25

## 3. Bootstrap defaults to local-only, PR is optional

**Context:** `bootstrap/SKILL.md` currently has "Commit and PR" as a required step. Too heavy for personal / public users who just want to try it.
**Decision:** Rewrite `SKILL.md` so commit / PR is an optional next step, not part of the main flow. Default is create files only.
**Alternatives considered:** Quick mode vs PR mode flag (rejected — adds `SKILL.md` complexity for little gain).
**Consequences:** PR workflow moves to a brief mention, not a numbered step.
**Source:** external review, 2026-06-25

## 4. Onboarding roadmap: examples + AGENTS.md coexistence first

**Context:** Public users need an example repo and "Already have AGENTS.md?" guidance before more tool adapters.
**Decision:** Prioritize `examples/tiny-node-app` and AGENTS.md coexistence section over new tool plugins.
**Alternatives considered:** Build more tool plugins first (rejected — without examples, users can't evaluate the methodology).
**Consequences:** Codex and other tool adapters wait until examples land.
**Source:** external review, 2026-06-25
