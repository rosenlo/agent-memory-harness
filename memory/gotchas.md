# Gotchas

Runtime traps and known limitations.

## 1. OpenCode plugin misses bash-generated file changes

**Symptom:** "Files you edited this session" in the idle reminder may omit files changed via bash (`sed -i`, `pnpm format`, `go fmt`, codegen, etc.).

**Root cause:** Plugin only reads `args.filePath` / `args.path` from `write` / `edit` / `bash` tool calls. Bash commands that modify files indirectly don't appear in those args.

**Fix:** At `session.idle`, run `git diff --name-only HEAD` (fallback to `--cached` for fresh repos) and merge with the tool-tracked `sessionEdits` list. Filter out `memory/*.md` from the git-detected set. Dedupe.

**How to verify:** Run a session that does `sed -i 's/foo/bar/' file.txt` then triggers idle; check whether `file.txt` appears in the reminder.

**Status:** fixed

**Source:** external review, 2026-06-25; fix applied same day

## 2. Codex support is partially verified

**Symptom:** README claimed Codex would work by pasting rules into `~/.codex/AGENTS.md`, but the repo had no real Codex CLI verification.

**Root cause:** Earlier docs were written before a real Codex install was checked.

**Fix:** Document the current state in `implementations/codex/README.md` with the tested CLI version, the documented `~/.codex/AGENTS.md` path, and the remaining auth / end-to-end gap. README now points at that page as partially verified.

**How to verify:** On `codex-cli 0.140.0`, `codex doctor` confirms a writable `CODEX_HOME` and repo discovery. A full `codex exec` session still needs working auth before we can confirm the loaded instructions end-to-end.

**Status:** open (docs honest, partial verification only)

**Source:** external review, 2026-06-25; local verification pass, 2026-06-28

## 3. OpenCode plugin git diff may include pre-session dirty changes

**Symptom:** Idle reminder's "git-detected entries may include changes from before this session if the working tree was already dirty" — list could be noisy if the user started the session with uncommitted work.

**Root cause:** `gitDiffNames` runs `git diff --name-only HEAD` at `session.idle` with no baseline. It captures the full working-tree state, not just this session's edits.

**Fix:** Open — capture a baseline at session start (`tool.execute.after` first invocation, or a `session.start` hook if available) and subtract it from the idle-time diff. Reminder currently discloses the limitation in-line.

**How to verify:** Start a session in a repo with one pre-existing dirty file, edit a different file in-session, trigger idle; baseline-aware version should list only the in-session file.

**Status:** open (workaround: in-reminder disclosure)

**Source:** external review, 2026-06-25

## 4. Codex CLI verification is blocked by current account quota

**Symptom:** `codex login --with-api-key` succeeds, but `codex exec --json "Summarize the current instructions."` fails with `Quota exceeded. Check your plan and billing details.`

**Root cause:** The API-key account available in this environment has no usable quota for Codex exec runs, so the instruction-echo test cannot complete even after login succeeds.

**Fix:** Use a Codex account / API key with available quota, or a separate verification path that does not depend on the hosted Codex service. A local OSS fallback exists, but here it starts pulling `gpt-oss:20b` and is not practical for quick verification.

**How to verify:** Run `codex login --with-api-key` against a writable `CODEX_HOME`, then rerun `codex exec --json "Summarize the current instructions."`. If quota is available, the session should proceed past `turn.started` instead of failing immediately.

**Status:** open

**Source:** local verification pass, 2026-06-28
