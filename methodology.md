# Methodology

The design behind `agent-memory-harness`: why in-repo memory, how it's structured, and how agents use it.

## The problem

AI coding agents lose context between sessions. By default:

- Discoveries from one session (gotchas, decisions, ops tricks) are lost
- Different agents (OpenCode, Claude Code, Codex) don't share notes
- Onboarding a new repo means re-deriving the same traps every time

Tool-home memory (e.g., Hermes Agent's `~/.hermes/memories/`) addresses the first problem but not the others — it's personal, tool-bound, and not versioned.

## The core idea

Put memory **in the repo**, under `memory/`. Every agent that reads `AGENTS.md` (or `CLAUDE.md`) at session start inherits the same durable notes. The notes travel with the code: through git, through PRs, across machines, across tools.

Three pieces make it work:

1. **In-repo `memory/` directory** — the actual notes, version-controlled
2. **Global rules template** — copied to `~/.config/opencode/AGENTS.md` (or `~/.claude/CLAUDE.md`); tells every agent the harness exists, how to read it, and when to write
3. **Optional per-tool plugin** — proactive reminders (e.g., OpenCode's `memory.js` triggers on `session.idle` and `session.compacting`)

The first two are tool-agnostic. The third is per-tool.

## The file types

| File | Holds | Read before |
|------|-------|-------------|
| `MEMORY.md` | Index of all files + workflow | Session start |
| `gotchas.md` | Runtime traps, config caveats, footguns | Touching config, parsers, deployment |
| `decisions.md` | Architectural and design decisions | Touching build/CI, refactors |
| `topology.md` | Repo layout, remotes, deployment targets | Touching PR workflow, cross-repo refs |
| `ops.md` | Operational commands, verification queries | Running / debugging |
| `pr-workflow.md` | Branch/PR workflow, host routing | Opening PRs |

Files are added or merged as needed. The six above cover most repos.

## Entry templates

Each entry is a section in the relevant `memory/*.md` file. Two shapes:

**Problem entry** (gotchas / topology / ops / pr-workflow):

```markdown
## N. <short title>

**Symptom:** <what user/system observed>
**Root cause:** <why it happened>
**Fix:** <what was done, or "open">
**How to verify:** <command or query>
**Status:** fixed | workaround | open
**Source:** <PR#/commit/session date>
```

**Decision entry** (decisions.md):

```markdown
## N. <decision title>

**Context:** <what problem demanded a decision>
**Decision:** <what was chosen>
**Alternatives considered:** <brief>
**Consequences:** <what changes downstream>
**Source:** <PR#/commit/session date>
```

The fixed shape makes entries scannable, diffable, and easy to consolidate when they go stale.

## When to write

Three triggers, in order of how proactive they are:

1. **Plugin reminder** (OpenCode only): fires on `session.idle` and `session.compacting`. Agent decides if anything durable was learned; if yes, appends to the right `memory/*.md` file without asking the user.
2. **Session end**: agent applies the rules from `AGENTS.md`; if no plugin, this is the only trigger.
3. **Compaction**: if older context is about to be lost, the agent writes any unrecorded durable finding first.

The agent should never narrate "I'm writing to memory..." unless surfacing a real finding the user should know about.

## Capacity rules

Each `memory/*.md` file has a **soft ceiling of 150 lines** (~8–12 entries, depending on length). When a file approaches the ceiling:

1. Read the full file.
2. Identify entries that are obsolete (no longer reflect current state), redundant (two entries cover the same finding), or verbose (can be tightened).
3. Consolidate: replace N entries with 1 shorter entry, or delete obsolete ones outright. When deleting, leave a one-line note: "See git history for the original N entries on this topic."
4. Then append the new entry.

If a file genuinely needs more than 150 lines (rare), split it: e.g., `gotchas.md` → `gotchas-config.md` + `gotchas-runtime.md`. Update `MEMORY.md` to point at both.

The ceiling forces consolidation over accumulation — a memory file that grows forever is one nobody reads.

## How agents discover the harness

At session start, the agent reads the repo's `AGENTS.md` (OpenCode) or `CLAUDE.md` (Claude Code). That file tells them: "If `memory/MEMORY.md` exists, read it to load the index of durable notes." The agent then reads the relevant `memory/*.md` files based on the task at hand (see "Read before" column above).

If the repo doesn't have memory yet, the global rules say: "Offer to bootstrap it." The `bootstrap-memory` skill (in `bootstrap/SKILL.md`) handles the setup.

## Why in-repo, not agent-home

| Aspect | In-repo (this) | Agent-home (e.g. Hermes) |
|--------|----------------|--------------------------|
| Shared with team | Yes | No |
| Version-controlled | Yes | No |
| Tool-portable | Yes (any agent reads md) | No (per-tool format) |
| Survives machine wipe | Yes (in git) | No |
| Scope | Project | User / environment |

Agent-home memory still has a place — user preferences, environment quirks, cross-project patterns. This harness complements it, doesn't replace it.

## Tool support

| Tool | Reads | Writes | Plugin? |
|------|-------|--------|---------|
| OpenCode | `AGENTS.md` at session start | yes | Yes (`implementations/opencode/plugin/memory.js`) |
| Claude Code | `CLAUDE.md` at session start | yes | No (relies on session-end rule) |
| Codex | global instructions at session start | yes | No (relies on session-end rule) |

The methodology works without a plugin. The plugin just adds proactive reminders.

## Anti-patterns

- **Tool-private paths.** Never write to `~/.claude/projects/...` or other agent-private paths. Memory goes in `<repo>/memory/`.
- **Forking by tool.** Don't keep separate `memory-opencode/` and `memory-claude/`. One `memory/`, read by all.
- **Empty placeholders.** If a category genuinely has no content, write "No entries yet. Append discoveries here." — but try harder to seed something real from git log, README, or recent commits.
- **Silent drops.** Don't delete entries without a trace. Either consolidate (preserving the durable core) or leave a one-line note in the kept entry.
- **Narrating every write.** Don't say "I'm writing to memory..." unless surfacing a real finding worth the user's attention.
