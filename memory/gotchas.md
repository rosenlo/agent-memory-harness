# Gotchas

Runtime traps and known limitations.

## 1. OpenCode plugin misses bash-generated file changes

**Symptom:** "Files you edited this session" in the idle reminder may omit files changed via bash (`sed -i`, `pnpm format`, `go fmt`, codegen, etc.).
**Root cause:** Plugin only reads `args.filePath` / `args.path` from `write` / `edit` / `bash` tool calls. Bash commands that modify files indirectly don't appear in those args.
**Fix:** At `session.idle`, run `git diff --name-only HEAD` (fallback to `--cached` for fresh repos) and merge with the tool-tracked `sessionEdits` list. Filter out `memory/*.md` from the git-detected set. Dedupe.
**How to verify:** Run a session that does `sed -i 's/foo/bar/' file.txt` then triggers idle; check whether `file.txt` appears in the reminder.
**Status:** fixed
**Source:** external review, 2026-06-25; fix applied same day

## 2. Codex support is unverified

**Symptom:** README claims Codex works by pasting rules into `~/.codex/AGENTS.md`, but no version / path / behavior has been tested.
**Root cause:** No Codex CLI environment available to validate which file Codex reads at session start, or whether `memory/*.md` references are followed.
**Fix:** Open — create `implementations/codex/README.md` with tested version, install path, known limitations, and manual workflow. README main table now points there with "currently unverified" label instead of stating `~/.codex/AGENTS.md` as fact.
**How to verify:** Install Codex CLI, point at a repo with `memory/` bootstrapped, confirm session start reads `AGENTS.md` and `memory/MEMORY.md`.
**Status:** open (docs honest, integration unverified)
**Source:** external review, 2026-06-25; consistency pass same day

## 3. OpenCode plugin git diff may include pre-session dirty changes

**Symptom:** Idle reminder's "git-detected entries may include changes from before this session if the working tree was already dirty" — list could be noisy if the user started the session with uncommitted work.
**Root cause:** `gitDiffNames` runs `git diff --name-only HEAD` at `session.idle` with no baseline. It captures the full working-tree state, not just this session's edits.
**Fix:** Open — capture a baseline at session start (`tool.execute.after` first invocation, or a `session.start` hook if available) and subtract it from the idle-time diff. Reminder currently discloses the limitation in-line.
**How to verify:** Start a session in a repo with one pre-existing dirty file, edit a different file in-session, trigger idle; baseline-aware version should list only the in-session file.
**Status:** open (workaround: in-reminder disclosure)
**Source:** external review, 2026-06-25
