# Codex integration

**Status: partially verified.** The repo-local memory model is compatible with
Codex's documented `AGENTS.md` discovery, and I confirmed a local Codex CLI
install on `codex-cli 0.140.0` can inspect its own config/state with
`codex doctor`. I also confirmed `codex login --with-api-key` works against a
temporary `CODEX_HOME`. Full end-to-end instruction echo is still blocked in
this environment by account quota (`Quota exceeded`) when `codex exec` talks to
the API, so the `AGENTS.md`/`@memory/*.md` path is not fully exercised here yet.

See [memory/gotchas.md](../../memory/gotchas.md) entry #2 for the tracking
note.

## What is confirmed

- `codex --version` reports `codex-cli 0.140.0` here.
- `codex doctor` recognizes a writable `CODEX_HOME` and reports project
  discovery from this repo root.
- `codex login --with-api-key` succeeds with a writable temp home.
- Codex docs describe `~/.codex/AGENTS.md` as the global instruction file and
  `AGENTS.md` discovery as the durable repo guidance surface.
- Codex docs describe memories as separate Codex-home state under
  `~/.codex/memories/`, not as this repo's portable `memory/` files.

## Install location

Codex CLI's documented global instruction file is:

```text
~/.codex/AGENTS.md
```

Copy the template:

```bash
mkdir -p ~/.codex
cp agents/AGENTS.md.tmpl ~/.codex/AGENTS.md
```

If Codex home is redirected with `CODEX_HOME`, place the global file there
instead.

## How memory is supposed to flow

```text
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

- **No plugin.** Codex has no equivalent of OpenCode's `memory.js` plugin, so
  there is no proactive `session.idle` or `session.compacting` reminder.
  Memory writes rely on the session-end rule in the global `AGENTS.md`.
- **No verified auto-read.** The docs support the `AGENTS.md` chain, but this
  repo has not yet completed a full Codex session that proves `@memory/*.md`
  references are honored end-to-end in this environment.
- **No repo-memory auto-update.** Codex has its own optional `~/.codex/memories/`
  layer, but it does not provide an OpenCode-style plugin that proactively
  writes this repo's `memory/*.md` files for you.
- **Account quota blocked.** `codex exec` currently fails with `Quota exceeded`
  on the logged-in API-key account used here, so the final instruction-echo
  check cannot complete without different billing / quota state.
- **No tool-call tracking.** Without a plugin, Codex won't know which files you
  edited this session unless you tell it or it infers from the conversation.
- **Interactive entrypoint is TTY-driven.** Plain `codex` opens the TUI; use
  `codex exec` for non-interactive runs.
- **Local OSS fallback is heavy.** `codex exec --oss --local-provider ollama`
  tries to pull `gpt-oss:20b` here, which is a 12.85 GB download and not a
  practical verification path for this repo.

## Manual workflow

If you want to force the memory workflow during Codex sessions, prompt it
explicitly at session start:

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

## Memory layers

| Layer | Scope | Location |
|-------|-------|----------|
| Codex memories | local recall for Codex sessions | `~/.codex/memories/` |
| Repo memory | portable project findings shared across tools | `<repo>/memory/` |
| Session transcript | temporary working context | not persisted |

Codex memories are useful for local recall, but they are not a substitute for
the repo memory harness. Durable project findings still belong in
`memory/*.md`.

## What still needs verification

To flip this page to fully verified, confirm a real Codex session can:

1. Start from `~/.codex/AGENTS.md` or an equivalent `CODEX_HOME` override.
2. Follow `@memory/*.md` references in `AGENTS.md`.
3. Follow the `@AGENTS.md` pointer from `CLAUDE.md` when both exist.
4. Run with a known-good auth setup, so the CLI can actually complete a session
   and echo the loaded instructions.
