# Codex integration

**Status: unverified.** The paths below are presumed based on Codex CLI's published behavior but have not been tested end-to-end. Treat this as a starting point, not a verified install guide. Update this file once you've confirmed what Codex actually reads at session start.

See [memory/gotchas.md](../../memory/gotchas.md) entry #2 for the tracking note.

## Install location

Codex CLI is expected to read global instructions from:

```
~/.codex/AGENTS.md
```

Copy the template:

```bash
mkdir -p ~/.codex
cp agents/AGENTS.md.tmpl ~/.codex/AGENTS.md
```

If Codex uses a different default path, override it here and update this doc.

## How memory is supposed to flow

```
Codex session starts
  ↓
Reads ~/.codex/AGENTS.md (global rules + memory harness rules)
  ↓
Reads <repo>/AGENTS.md (repo-level, references @memory/*.md)
  ↓
Reads <repo>/memory/MEMORY.md (index of durable notes)
  ↓
Reads <repo>/memory/gotchas.md, decisions.md, etc. as task dictates
```

## Known limitations

- **No plugin.** Codex has no equivalent of opencode's `memory.js` plugin, so there is no proactive `session.idle` or `session.compacting` reminder. Memory writes rely on the session-end rule in the global `AGENTS.md`.
- **No verified auto-read.** Codex CLI may or may not follow `@memory/*.md` references the same way opencode and Claude Code do. This is the primary unverified assumption.
- **No tool-call tracking.** Without a plugin, Codex won't know which files you edited this session unless you tell it or it infers from the conversation.

## Manual workflow (works regardless of auto-read)

If Codex doesn't auto-read `memory/`, prompt it explicitly at session start:

```text
Read AGENTS.md and memory/MEMORY.md at the start of this session.
Before touching config, parsers, or deployment, also read memory/gotchas.md.
Before changing architecture, also read memory/decisions.md.
```

At session end, prompt it to write any durable findings:

```text
Before ending, check if anything durable was learned this session.
If yes, append to the right memory/*.md file using the entry template
from AGENTS.md. Don't write secrets, tokens, or private data.
```

## What needs verification

Before this README can be marked verified, the following must be confirmed against a real Codex CLI install:

1. Which file does Codex read at session start? (`~/.codex/AGENTS.md`? other?)
2. Does Codex follow `@memory/*.md` references in `AGENTS.md`?
3. Does Codex follow `@AGENTS.md` pointer from `CLAUDE.md` if both exist?
4. Tested Codex CLI version and date.

Update this file and flip the status in [memory/gotchas.md](../../memory/gotchas.md) entry #2 once verified.
