# AGENTS.md

agent-memory-harness: portable, in-repo memory for AI coding agents (OpenCode, Claude Code, Codex).

## Build & Test

No build step. Files are markdown templates and one ES module plugin.

To validate the plugin loads:

```bash
node -e 'import("./implementations/opencode/plugin/memory.js").then(m => console.log(typeof m.MemoryPlugin))'
```

## Architecture (TL;DR)

- `agents/` — global rules template (`AGENTS.md.tmpl`) + per-repo stub (`CLAUDE.md.tmpl`)
- `bootstrap/SKILL.md` — one-shot skill to seed `memory/` in a new repo
- `implementations/opencode/plugin/memory.js` — proactive reminder plugin (OpenCode-only)
- `methodology.md` — the design doc
- `README.md` — install + overview

## Cross-session Memory

This repo uses its own harness. Memory lives under `memory/`. Both OpenCode and Claude Code read/write the same files.

- @memory/MEMORY.md — index of all notes (read at session start)
- @memory/gotchas.md — known limitations (READ before touching plugin or Codex docs)
- @memory/decisions.md — positioning and design decisions (READ before changing positioning, bootstrap flow, or security rules)

When you discover something durable, append to the right `memory/*.md` file using the entry template. Don't ask the user — just write if it's clearly durable. Never store secrets, tokens, credentials, private URLs, personal data, or raw logs in `memory/*.md`.

## Related Files

- `agents/AGENTS.md.tmpl` — the template users copy to `~/.config/opencode/AGENTS.md` or `~/.claude/CLAUDE.md`
- `bootstrap/SKILL.md` — the skill that bootstraps `memory/` in a new repo
