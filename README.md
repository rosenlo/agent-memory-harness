# agent-memory-harness

Cross-session, in-repo memory for AI coding agents. Works with OpenCode, Claude Code, and Codex.

> **Not an agent runtime.** This is a portable, repo-local memory layer that those runtimes read via `AGENTS.md` / `CLAUDE.md`. It does not replace Claude Code, OpenCode, or Codex.

## Why

Agents lose context between sessions. Tool-home memory (like Hermes Agent's `~/.hermes/memories/`) helps, but it's:

- **Personal** — only you benefit, not your team
- **Tool-bound** — locked to one agent's storage format
- **Not versioned** — no commit history, no PR review

This harness puts memory **in the repo** under `memory/`. Every agent that reads `AGENTS.md` (or `CLAUDE.md`) gets the same durable notes — gotchas, decisions, topology, ops, PR workflow — version-controlled alongside the code.

## Quick start

### 1. Install global rules

Copy the template to your agent's global instructions location:

| Tool | Location |
|------|----------|
| OpenCode | `~/.config/opencode/AGENTS.md` |
| Claude Code | `~/.claude/CLAUDE.md` |
| Codex | see [implementations/codex/README.md](implementations/codex/README.md) — partially verified on `codex-cli 0.140.0` |

```bash
# OpenCode
cp agents/AGENTS.md.tmpl ~/.config/opencode/AGENTS.md

# Claude Code
cp agents/AGENTS.md.tmpl ~/.claude/CLAUDE.md
```

### 2. (Optional) Install the OpenCode plugin

The plugin proactively reminds the agent to write findings at session idle and context compaction. Other tools rely on the session-end rule in the global AGENTS.md.

```bash
mkdir -p ~/.config/opencode/plugins
cp implementations/opencode/plugin/memory.js ~/.config/opencode/plugins/
```

### 3. Bootstrap memory in a repo

Use the `bootstrap-memory` skill (or follow `bootstrap/SKILL.md` manually) in any repo where you want persistent memory:

> "bootstrap memory in this repo"

This creates:

```
<repo>/
├── AGENTS.md              ← primary entry, references @memory/*.md
├── CLAUDE.md              ← stub pointing to AGENTS.md
└── memory/
    ├── MEMORY.md          ← index + workflow
    ├── gotchas.md         ← runtime traps
    ├── decisions.md       ← architectural decisions
    ├── topology.md        ← repo layout, remotes, deployment
    ├── ops.md             ← operational commands and verification queries
    └── pr-workflow.md     ← branch/PR workflow, host routing
```

## Already have AGENTS.md?

If your repo already has an `AGENTS.md`, the bootstrap skill does **not** overwrite it. It only:

- Appends a `## Cross-session Memory` section pointing at `memory/*.md`
- Leaves your existing rules, build commands, and architecture notes untouched
- Creates `CLAUDE.md` as a 3-line stub pointing back to `AGENTS.md` (or adds one pointer line if `CLAUDE.md` already has substantial content)

If your `AGENTS.md` already has its own memory conventions, you can either adopt this harness's structure or keep yours — the methodology works either way as long as the entries are durable and indexed.

## Tool integration

### Claude Code

Claude Code has its own auto memory at `~/.claude/projects/<project>/memory/` that records build commands, debug insights, architecture notes, and personal workflow habits. This harness does **not** replace it by default — the two memories serve different scopes:

| Layer | Scope | Where |
|-------|-------|-------|
| Claude Code auto memory | personal, machine-local, tool-private | `~/.claude/projects/...` |
| Repo `memory/` | project, portable, version-controlled, shared across agents | `<repo>/memory/` |
| Session transcript | temporary task context | not persisted |

**Default: coexist and route.** Keep Claude Code auto memory enabled. Use `CLAUDE.md` to tell Claude where to write what:

```markdown
# CLAUDE.md

This repo uses `AGENTS.md` as the primary instruction file. Read **@AGENTS.md** at session start.

Durable project findings (gotchas, decisions, topology, ops, PR workflow)
go into `memory/*.md` — not Claude Code auto memory.
Personal habits and tool-local preferences stay in auto memory.
```

**Optional: strict single-source-of-truth.** If you want `memory/` to be the only durable project memory (e.g., for CI / SDK / automation / multi-tenant isolation), disable Claude Code auto memory:

```json
// .claude/settings.json
{
  "autoMemoryEnabled": false
}
```

Or via environment variable: `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.

**Experimental: redirect `autoMemoryDirectory`.** Claude Code supports pointing auto memory at a custom path, but it uses its own `MEMORY.md` + topic-file schema that may conflict with this harness's taxonomy. Not recommended as the default integration.

### Migrating existing Claude Code auto memory

Do not copy tool-private memory wholesale into `memory/`. Migrate by curation:

- **Durable project facts** (gotchas, decisions, topology, ops, PR workflow) → repo `memory/`
- **Personal / tool-local habits** (output style, preferred commands, environment quirks) → keep in Claude Code auto memory
- **Temporary session state** → discard
- **Secrets, private URLs, raw logs, customer data** → never migrate, never store

Prompt Claude Code to do a one-time curated migration:

```text
Review your existing Claude Code auto memory for this repository.
Migrate only durable project-level findings into repo-local `memory/`.
Do not copy raw logs, secrets, private URLs, personal preferences, or
temporary session notes. Classify entries into gotchas / decisions /
topology / ops / pr-workflow. Keep each entry concise and structured.
After migration, summarize what was migrated and what was left out.
```

## How it works

See [methodology.md](methodology.md) for the design and rules.

TL;DR:

- Each `memory/*.md` file holds a category of durable notes
- Entries use a fixed template (Symptom / Root cause / Fix / Verify / Status / Source)
- 150-line soft ceiling per file forces consolidation over accumulation
- Agents discover the harness by reading `AGENTS.md` at session start; `MEMORY.md` indexes the files
- The OpenCode plugin adds proactive reminders at `session.idle` and `session.compacting`

## Safety

`memory/*.md` is committed to git and may land on a public remote. Treat it like any other source file:

- **Never store** secrets, tokens, credentials, private URLs, customer data, personal data, raw production logs, or incident details in `memory/`.
- If a durable finding depends on sensitive information, record only the generalized lesson and cite a safe source (PR number, commit hash, or local date).
- This rule is baked into `agents/AGENTS.md.tmpl` so every bootstrapped repo inherits it.

## Repo layout

```
agents/                              # Templates any tool can use
├── AGENTS.md.tmpl                  # Global rules template
└── CLAUDE.md.tmpl                  # Per-repo stub (3 lines, points to AGENTS.md)

bootstrap/
└── SKILL.md                        # One-shot skill to bootstrap memory/ in a new repo

implementations/
└── opencode/
    ├── plugin/memory.js            # OpenCode plugin (one possible implementation)
    └── package.json                # type: module

examples/                           # Sanitized examples (future)
```

## Compared to Hermes Agent memory

| Aspect | Hermes | This harness |
|--------|--------|--------------|
| Location | `~/.hermes/memories/` (user-home) | `<repo>/memory/` (in-repo) |
| Scope | Agent-level (user prefs, env) | Project-level (repo gotchas, decisions) |
| Shared with team | No | Yes (version-controlled) |
| Tool-portable | No (Hermes-only) | Yes (any agent reading `AGENTS.md`/`CLAUDE.md`) |
| Capacity | Hard char limit (~1300 tokens) | 150-line soft ceiling per file |
| Write trigger | Background review loop | Plugin reminder (OpenCode) or session-end rule |

Complementary, not competing. Same person could use both.

## License

MIT
