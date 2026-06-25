---
name: bootstrap-memory
description: 'Set up cross-session memory harness for a repo. Creates memory/ directory with seeded notes plus AGENTS.md/CLAUDE.md/opencode.json entries that reference them. Use when user says "bootstrap memory", "set up memory", "init memory harness", or when starting fresh in a repo that has no memory/ directory. Tool-agnostic: OpenCode, Claude Code, and Codex all read the same files. Optional: pair with the OpenCode memory.js plugin (one implementation in implementations/opencode/).'
---

# Bootstrap Memory Harness

Set up persistent cross-session memory for the current repo. Memory lives in-repo (version-controlled, team-shared) so it survives across sessions, machines, and tools.

## When to use

Trigger when ANY of these are true:
- User says "bootstrap memory", "set up memory", "init memory harness"
- Repo has no `memory/` directory (check at session start in repos you'll work in)
- User asks "how do I persist learnings across sessions?"

Don't bootstrap if `memory/MEMORY.md` already exists — instead, read it and follow the maintenance workflow described in it. Offer to add new entries only if the user explicitly asks.

## What gets created

```
<repo>/
├── AGENTS.md          ← (create or update) primary entry, references @memory/*.md
├── CLAUDE.md          ← (create or update) 3-line stub pointing to AGENTS.md
├── opencode.json      ← (create or update, optional) cross-repo references
└── memory/
    ├── MEMORY.md      ← index + workflow
    ├── gotchas.md     ← runtime traps
    ├── decisions.md   ← architectural decisions
    ├── topology.md    ← repo layout, remotes, deployment
    ├── ops.md         ← operational commands and verification queries
    └── pr-workflow.md ← branch/PR workflow, host routing
```

## Workflow

### 1. Analyze the repo

Before writing anything, gather material for seeding the notes:

- `git remote -v` — fork model? canonical upstream?
- `git log --oneline -30` — recent activity, what people work on
- `ls` and `find . -maxdepth 2 -type d` — layout, sibling repos
- Read `README*`, existing `AGENTS.md`/`CLAUDE.md`, `CONTRIBUTING*`, `Makefile`/`Justfile`, CI config
- Check for open PRs that hint at WIP conventions
- Look for `HANDOFF*.md`, `TODO*.md`, scratch notes — capture durable insights from them
- Check for existing `memory/` directory (different format) — may contain findings to curate
- Check `~/.claude/projects/` for Claude Code auto memory — may have project-level findings worth curating
- Identify build/test/lint commands
- Identify host routing quirks (e.g., GHE hosts need `GH_HOST=<your-ghe-host>`)

### 2. Check for existing memory to migrate

Before creating fresh files, check two sources that may already contain durable findings worth curating:

**a) Existing repo `memory/` (different format):**

```bash
ls memory/ 2>/dev/null
```

If `memory/` already exists with files that don't match the 6-category taxonomy (`gotchas.md`, `decisions.md`, `topology.md`, `ops.md`, `pr-workflow.md`), don't overwrite them. Instead, read each file and route findings into the right category:

- Traps / quirks / "don't do X" → `gotchas.md`
- "Why we chose Y over Z" → `decisions.md`
- Repo layout / remotes / deployment → `topology.md`
- Build / test / verify commands → `ops.md`
- Branch / PR / merge conventions → `pr-workflow.md`

Keep the original files in place — they're still useful as detailed references. The new taxonomy files become the indexed entry points. Add cross-references from the new files back to the originals where useful.

**b) Claude Code auto memory (`~/.claude/projects/<project>/memory/`):**

```bash
ls ~/.claude/projects/ 2>/dev/null
```

If Claude Code has been used in this repo, it may have auto-saved findings there. Read them, extract durable **project-level** facts, and curate into the new taxonomy. Leave behind:

- Personal / tool-local habits (output style, preferred commands)
- Temporary session state
- Anything that looks like a raw transcript

**Migration rule:** curation, not copy. The goal is durable, indexed, scannable entries — not a bulk import of everything that existed before.

### 3. Create memory/ files

Write each file with at least one concrete entry from your analysis (and curation, if step 2 applied). Empty placeholder files are useless — if there's genuinely nothing to write for a category, write:

```
No entries yet. Append discoveries here.
```

…but try harder. There's almost always something to seed from git log, README, or recent commits.

### 4. Update AGENTS.md

If `AGENTS.md` doesn't exist, create it (≤80 lines, see template below).
If it exists, add a `## Cross-session Memory` section with `@memory/*.md` references, keeping the existing content.

### 5. Update CLAUDE.md

If `CLAUDE.md` doesn't exist or is just a stub, ensure it points to `AGENTS.md`. If it has substantial original content (e.g., a long pre-existing CLAUDE.md), leave it alone but add one line at the top: `See @AGENTS.md for primary instructions including memory harness.`

### 6. Optional: Commit or PR

By default, stop after creating/updating files and summarize what changed for the user. Many users want to try the harness locally before committing — don't auto-stage or auto-commit unless they ask.

If the user asks for a commit or PR, stage the memory harness files (`AGENTS.md`, `CLAUDE.md`, `memory/`, optionally `opencode.json`) and commit with a message like:

```
docs: bootstrap cross-session memory harness

Adds memory/ directory with seeded notes (gotchas, decisions, topology,
ops, pr-workflow) plus AGENTS.md references. Shared by OpenCode and
Claude Code. Designed to work with the OpenCode memory.js plugin.
```

If opening a PR, follow the repo's standard workflow (fork model? worktree? see existing commits for convention).

## File templates

### memory/MEMORY.md

```markdown
# Memory Index

Cross-session memory for this repo. Shared by OpenCode and Claude Code.
Version-controlled with the repo. Both tools read/write here.

## Files

- [gotchas.md](gotchas.md) — runtime traps and config caveats
- [decisions.md](decisions.md) — architectural and design decisions
- [topology.md](topology.md) — repo layout, remotes, deployment targets
- [ops.md](ops.md) — operational commands and verification queries
- [pr-workflow.md](pr-workflow.md) — branch/PR workflow, host routing

## Workflow

### At session start
1. Read this file (index).
2. Read `gotchas.md` if touching config, parsers, or deployment.
3. Read `topology.md` if touching PR workflow or deployment.
4. Read any file the user references or that matches your task.

### During session
When you discover something durable (gotcha, decision, pattern):
1. Pick the right file (gotchas / decisions / topology / ops / pr-workflow).
2. Append a new section using the entry template (see global AGENTS.md).
3. Update this index if you created a new file.

### At session end (or when work is merged)
- Convert session-specific handoff notes into durable memory entries.
- Remove obsolete entries that no longer reflect current state.
- If you created scratch notes outside `memory/`, move durable insights in.
```

### memory/gotchas.md, decisions.md, topology.md, ops.md, pr-workflow.md

Use the entry templates below. Seed each file with at least one concrete entry.

**Gotchas / topology / ops / pr-workflow entry:**
```markdown
## N. <short title>

**Symptom:** <what user/system observed>

**Root cause:** <why it happened>

**Fix:** <what was done, or "open">

**How to verify:** <command or query>

**Status:** fixed | workaround | open

**Source:** <PR#/commit/session date>
```

**Decisions entry:**
```markdown
## N. <decision title>

**Context:** <what problem demanded a decision>

**Decision:** <what was chosen>

**Alternatives considered:** <brief>

**Consequences:** <what changes downstream>

**Source:** <PR#/commit/session date>
```

### AGENTS.md (if creating new)

```markdown
# AGENTS.md

<one-paragraph project description>

## Build & Test

<commands>

## Architecture (TL;DR)

<5-10 line summary or simple diagram>

## Safety

Never store secrets, tokens, credentials, private URLs, customer data, personal data, raw logs, or production incident details in `memory/*.md`.

If a durable finding depends on sensitive information, record only the generalized lesson and cite a safe source such as a PR number, commit hash, or local date.

## Cross-session Memory

This repo uses a cross-session memory system under `memory/`. Both
OpenCode and Claude Code read/write the same files.

- @memory/MEMORY.md — index of all notes (read at session start)
- @memory/gotchas.md — runtime traps (READ before config/parser changes)
- @memory/decisions.md — architectural decisions
- @memory/topology.md — repo layout, remotes, deployment
- @memory/ops.md — operational commands and verification queries
- @memory/pr-workflow.md — branch/PR workflow, host routing

When you discover something durable, append to the right `memory/*.md`
file using the entry template. Don't ask the user — just write if it's
clearly durable. The OpenCode `memory.js` plugin reminds you at
`session.idle` and `session.compacting`.

## Related Repos

<list, also configured as opencode.json references if cross-repo>
```

If `AGENTS.md` already exists, just add the `## Cross-session Memory` block above.

### CLAUDE.md (stub)

```markdown
# CLAUDE.md

This repo uses `AGENTS.md` as the primary instruction file. Read **@AGENTS.md** at session start.
```

If `CLAUDE.md` has substantial original content, leave it but add at top:
```markdown
> See @AGENTS.md for primary instructions including the cross-session memory harness.
```

### opencode.json (optional, for cross-repo references)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "references": {
    "<alias>": {
      "repository": "<owner/repo>",
      "description": "<when to consult this>"
    }
  }
}
```

Skip if no cross-repo references. Use `path` for local sibling dirs (but `repository` is more portable across machines).

## Rules

1. **In-repo only.** All memory under `<repo>/memory/`. Never write to `~/.claude/projects/...` or other tool-private paths.
2. **Cite sources.** Each entry should reference PR#, commit, or date.
3. **Update in place.** Don't duplicate. If a note exists, edit it.
4. **Quiet by default.** Don't narrate "I'm writing to memory..." unless surfacing a real finding worth the user's attention.
5. **Don't fork by tool.** Both OpenCode and Claude Code read/write the same `memory/*.md` files.
6. **Keep AGENTS.md lean.** ≤80 lines. Details go in `memory/*.md`, indexed from `MEMORY.md`.
7. **No empty placeholders.** If a file genuinely has no content yet, write "No entries yet. Append discoveries here." — but try harder to seed something real.
8. **Capacity ceiling per file.** Each `memory/*.md` file ≤150 lines. When a file would exceed that, consolidate existing entries instead of appending (see below).

## Capacity management

Each `memory/*.md` file has a soft ceiling of 150 lines (roughly 8–12 entries, depending on length). When a file approaches the ceiling:

1. Read the full file.
2. Identify entries that are:
   - Obsolete (no longer reflect current state — fix was reverted, decision was overturned)
   - Redundant (two entries cover the same finding)
   - Verbose (can be tightened without losing signal)
3. Consolidate them: replace N entries with 1 shorter entry, or delete the obsolete ones outright.
4. Then append the new entry.

Don't silently drop entries — either consolidate (preserving the durable core) or delete (only if truly obsolete). When deleting, add a one-line note in the entry you kept: "See git history for the original N entries on this topic."

If a file genuinely needs more than 150 lines (rare), split it: e.g., `gotchas.md` → `gotchas-config.md` + `gotchas-runtime.md`. Update `MEMORY.md` index to point at both.

## After bootstrap

- Tell the user: "Memory harness bootstrapped. Files created locally — nothing committed. Future sessions will read these via AGENTS.md/CLAUDE.md references. The OpenCode plugin (`implementations/opencode/plugin/memory.js`, if installed) will proactively remind you to write findings here. Claude Code and Codex read the same files via AGENTS.md references. Tell me when you want to commit or open a PR."
- Offer to walk through the seeded entries if the user wants to review.
- Don't auto-bootstrap in other repos — wait for the user to ask or trigger this skill again.
