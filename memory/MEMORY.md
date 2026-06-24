# Memory Index

Cross-session memory for agent-memory-harness. The harness dogfoods itself.

## Files

- [decisions.md](decisions.md) — positioning, security rules location, bootstrap mode, onboarding roadmap
- [gotchas.md](gotchas.md) — OpenCode plugin bash-diff miss, Codex support unverified

## Workflow

### At session start

1. Read this file (index).
2. Read [gotchas.md](gotchas.md) before touching the OpenCode plugin or claiming Codex support.
3. Read [decisions.md](decisions.md) before changing positioning, bootstrap flow, or security rules.

### During session

When you discover something durable (gotcha, decision, pattern):

1. Pick the right file (gotchas / decisions).
2. Append a new section using the entry template (see global AGENTS.md).
3. Update this index if you created a new file.

### At session end (or when work is merged)

- Convert session-specific handoff notes into durable memory entries.
- Remove obsolete entries that no longer reflect current state.
- If you created scratch notes outside `memory/`, move durable insights in.
