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

**Context:** `bootstrap/SKILL.md` originally had "Commit and PR" as a required step. Too heavy for personal / public users who just want to try it.

**Decision:** Rewrite `SKILL.md` so commit / PR is an optional next step, not part of the main flow. Default is create files only.

**Alternatives considered:** Quick mode vs PR mode flag (rejected — adds `SKILL.md` complexity for little gain).

**Consequences:** PR workflow moves to a brief mention, not a numbered step. After-bootstrap message tells the user nothing was committed and to ask when ready.

**Status:** applied (2026-06-25)

**Source:** external review, 2026-06-25

## 4. Onboarding roadmap: examples + AGENTS.md coexistence first

**Context:** Public users need an example repo and "Already have AGENTS.md?" guidance before more tool adapters.

**Decision:** Prioritize `examples/tiny-node-app` and AGENTS.md coexistence section over new tool plugins.

**Alternatives considered:** Build more tool plugins first (rejected — without examples, users can't evaluate the methodology).

**Consequences:** Codex and other tool adapters wait until examples land.

**Source:** external review, 2026-06-25

## 5. Claude Code integration: coexist with auto memory, do not disable by default

**Context:** Claude Code has its own auto memory (`~/.claude/projects/<project>/memory/`) that records build commands, debug insights, architecture notes, code style preferences, and workflow habits. Initial recommendation was to disable it so `memory/` is the single source of truth, but that conflates two different memory scopes.

**Decision:** Default mode is **coexist and route** — keep Claude Code auto memory enabled; `CLAUDE.md` tells Claude to write durable project findings to repo `memory/` and keep personal/tool-local habits in auto memory. Disabling auto memory (`autoMemoryEnabled: false` in `.claude/settings.json` or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`) is an **optional strict mode** for users who want single-source-of-truth. Redirecting `autoMemoryDirectory` into repo `memory/` is **experimental** — Claude Code uses its own `MEMORY.md` + topic-file schema that conflicts with this harness's `gotchas/decisions/topology/ops/pr-workflow` taxonomy.

**Alternatives considered:** Default to disabling auto memory (rejected — too opinionated; loses personal/tool-local habits that aren't project facts). Redirect `autoMemoryDirectory` to repo `memory/` as default (rejected — schema collision; Claude may reorganize files).

**Consequences:** Three memory layers, not two: (1) Claude Code auto memory = personal/machine-local/tool-private; (2) repo `memory/` = project/portable/version-controlled; (3) session transcript = temporary task state, do not persist. README's Tool integration section documents all three modes. Migration from existing Claude Code auto memory is by **curation** (durable project facts only), not bulk copy.

**Source:** external review, 2026-06-25; corrected same day after pushback on "disable by default" stance
