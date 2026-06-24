# Gotchas

Runtime traps and known limitations.

## 1. OpenCode plugin misses bash-generated file changes

**Symptom:** "Files you edited this session" in the idle reminder may omit files changed via bash (`sed -i`, `pnpm format`, `go fmt`, codegen, etc.).
**Root cause:** Plugin only reads `args.filePath` / `args.path` from `write` / `edit` / `bash` tool calls. Bash commands that modify files indirectly don't appear in those args.
**Fix:** Open — at `session.idle`, also run `git diff --name-only` and `git diff --cached --name-only`, merge with `sessionEdits`.
**How to verify:** Run a session that does `sed -i 's/foo/bar/' file.txt` then triggers idle; check whether `file.txt` appears in the reminder.
**Status:** open
**Source:** external review, 2026-06-25

## 2. Codex support is unverified

**Symptom:** README claims Codex works by pasting rules into `~/.codex/AGENTS.md`, but no version / path / behavior has been tested.
**Root cause:** No Codex CLI environment available to validate which file Codex reads at session start, or whether `memory/*.md` references are followed.
**Fix:** Open — create `implementations/codex/README.md` with tested version, install path, known limitations, and manual workflow.
**How to verify:** Install Codex CLI, point at a repo with `memory/` bootstrapped, confirm session start reads `AGENTS.md` and `memory/MEMORY.md`.
**Status:** open
**Source:** external review, 2026-06-25
