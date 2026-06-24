// Cross-session memory harness for OpenCode.
//
// Design: plugin injects REMINDER at session.idle and a CONTEXT note at
// compaction time. The agent (driven by AGENTS.md rules) decides what to
// actually write to memory/*.md. This keeps memory quality high (curated by
// the agent) while removing the "I forgot to write it down" failure mode.
//
// Mid-session: tracks files the agent edited (excluding memory/*.md itself)
// in a per-session list. At session.idle the list is merged with
// `git diff --name-only HEAD` to also catch bash-generated changes
// (sed -i, pnpm format, go fmt, codegen) that don't surface through tool
// args. The merged list is injected alongside the reminder so the agent
// can review what it actually changed and decide if any of those changes
// surface a durable finding worth recording.
//
// Memory layout (in-repo, version-controlled):
//   <repo>/memory/MEMORY.md       — index
//   <repo>/memory/gotchas.md      — runtime traps
//   <repo>/memory/decisions.md    — architectural decisions
//   <repo>/memory/topology.md     — repo layout, remotes, deployment
//   <repo>/memory/ops.md          — operational commands
//   <repo>/memory/pr-workflow.md  — branch/PR workflow
//
// Both OpenCode and Claude Code read/write the same files. Nothing lives
// in tool-private paths (~/.claude/projects/...).

import { stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

const IDLE_REMINDER_HEADER = `## Memory check (auto-injected by memory plugin)

Before this session ends, decide if anything durable was learned that the
next session should know. If yes, append it to the appropriate file under
\`memory/\` (see AGENTS.md for the file taxonomy and entry template).`;

const IDLE_REMINDER_TRIGGERS = `Triggers worth recording:
- A non-obvious failure mode or config trap → memory/gotchas.md
- An architectural decision with a "why" → memory/decisions.md
- A repo layout / remote / deployment quirk → memory/topology.md
- A useful verification command or query → memory/ops.md
- A PR workflow gotcha (host routing, fork model, ...) → memory/pr-workflow.md

Capacity rule: each memory/*.md file should stay ≤150 lines. When a file
would exceed that, consolidate existing entries instead of appending. See
global AGENTS.md for the consolidation workflow.

If nothing durable happened this session, do nothing — don't write empty
entries. Don't duplicate existing entries; update them in place.

Don't ask the user whether to write — just write if it's clearly durable,
skip if not. Quiet unless surfacing a real finding.`;

const COMPACTION_INJECTION = `## Memory continuity (auto-injected by memory plugin)

This session was compacted. Before continuing, ensure durable context is
preserved:

1. If \`memory/MEMORY.md\` exists in the repo, its index is still valid.
2. If you discovered something durable earlier in this session and haven't
   written it to \`memory/*.md\` yet, do so now before older context is lost.
3. When resuming work, re-read \`memory/gotchas.md\` if touching config,
   parsers, or deployment — past sessions have logged non-obvious traps.`;

async function repoHasMemory(cwd) {
  if (!cwd) return false;
  try {
    await stat(join(cwd, "memory", "MEMORY.md"));
    return true;
  } catch {
    return false;
  }
}

async function repoHasAgentsMd(cwd) {
  if (!cwd) return false;
  try {
    await stat(join(cwd, "AGENTS.md"));
    return true;
  } catch {
    return false;
  }
}

function isMemoryFile(filePath, cwd) {
  if (!filePath) return false;
  const rel = relative(cwd, filePath);
  return rel.startsWith("memory/") || rel.startsWith("memory\\");
}

// Tools that modify files we want to track. We only care about real
// content edits — not reads, searches, or memory/*.md writes (which
// are the agent already writing memory, no need to nudge).
const EDIT_TOOLS = new Set(["write", "edit", "bash"]);
const MEMORY_EDIT_PATTERN = /(^|[\\/])memory[\\/]/;

// Per-session accumulator of files the agent edited. Keyed by sessionID.
// We deliberately don't persist this — it's a per-session scratchpad to
// feed into the idle reminder. If the plugin reloads, the list resets,
// which is fine (the agent still has its own conversation context).
const sessionEdits = new Map();

function recordEdit(sessionID, filePath, cwd) {
  if (!sessionID || !filePath) return;
  // Normalize relative path for cleaner output
  const rel = cwd ? relative(cwd, filePath) : filePath;
  // Skip memory/*.md edits — those ARE the memory writes
  if (MEMORY_EDIT_PATTERN.test(rel) || MEMORY_EDIT_PATTERN.test(filePath)) return;
  // Skip edits outside the repo (e.g. /tmp/handoff-*.md)
  if (rel.startsWith("..") || rel.startsWith("/")) return;
  const list = sessionEdits.get(sessionID) || [];
  // Dedupe — same file edited multiple times counts once
  if (!list.includes(rel)) list.push(rel);
  // Cap at 50 entries to avoid runaway memory if agent edits hundreds
  // of files in a single session
  if (list.length > 50) list.length = 50;
  sessionEdits.set(sessionID, list);
}

function getEditsList(sessionID) {
  return sessionEdits.get(sessionID) || [];
}

function clearEdits(sessionID) {
  sessionEdits.delete(sessionID);
}

// Returns files with uncommitted changes (staged + unstaged) vs HEAD.
// Captures bash-generated changes (sed -i, pnpm format, go fmt, codegen)
// that don't surface through tool args. Returns [] if git is unavailable
// or the repo has no HEAD yet (fresh repo with no commits).
async function gitDiffNames(cwd) {
  if (!cwd) return [];
  try {
    const { stdout } = await execFileP("git", ["diff", "--name-only", "HEAD"], { cwd });
    return stdout.split("\n").map((s) => s.trim()).filter(Boolean);
  } catch {
    // No HEAD (fresh repo) or git not installed — fall back to
    // staged-only diff which works without HEAD.
    try {
      const { stdout } = await execFileP("git", ["diff", "--name-only", "--cached"], { cwd });
      return stdout.split("\n").map((s) => s.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
}

export const MemoryPlugin = async ({ client, directory, worktree }) => {
  const cwd = worktree || directory;

  return {
    // Track file edits during a session — but DON'T inject any mid-
    // session prompt. The list is surfaced at session.idle so the agent
    // can review what it actually changed. This avoids per-tool noise
    // while giving the agent a concrete changelog to jog its memory.
    "tool.execute.after": async (input, output) => {
      if (!output?.sessionID) return;
      const tool = input?.tool || output?.tool;
      if (!EDIT_TOOLS.has(tool)) return;
      const filePath = output?.args?.filePath || output?.args?.path;
      if (!filePath) return;
      recordEdit(output.sessionID, filePath, cwd);
    },

    // Fires when a session becomes idle. Inject a memory reminder as
    // context-only (noReply: true) — agent will see it on next turn.
    "session.idle": async (event) => {
      if (!event?.properties?.sessionID) return;
      const sessionID = event.properties.sessionID;
      const hasMemory = await repoHasMemory(cwd);
      const hasAgents = await repoHasAgentsMd(cwd);

      // Skip repos that haven't bootstrapped the memory harness yet.
      if (!hasMemory && !hasAgents) {
        clearEdits(sessionID);
        return;
      }

      const edits = getEditsList(sessionID);
      const gitChanged = (await gitDiffNames(cwd)).filter(
        (p) => !MEMORY_EDIT_PATTERN.test(p)
      );
      // Merge and dedupe: tool-tracked edits + git-detected changes.
      const allEdits = [...new Set([...edits, ...gitChanged])];
      let reminder = IDLE_REMINDER_HEADER;

      if (allEdits.length > 0) {
        reminder += `\n\nFiles you edited this session (tool-tracked + git-detected):\n`;
        reminder += allEdits.map((p) => `- \`${p}\``).join("\n");
        reminder += `\n\nReview the list above — any non-obvious finding from
this work belongs in \`memory/*.md\`. Skip if the edits were routine.
Note: git-detected entries may include changes from before this session
if the working tree was already dirty.`;
      }

      reminder += `\n\n` + IDLE_REMINDER_TRIGGERS;

      try {
        await client.session.prompt({
          path: { id: sessionID },
          body: {
            noReply: true,
            parts: [{ type: "text", text: reminder }],
          },
        });
      } catch (err) {
        await client.app.log({
          body: {
            service: "memory-plugin",
            level: "debug",
            message: `idle reminder injection skipped: ${err?.message || err}`,
          },
        });
      }
      clearEdits(sessionID);
    },

    // Fires before compaction generates a continuation summary. Inject
    // memory awareness so the compacted context doesn't lose track of
    // durable findings.
    "experimental.session.compacting": async (input, output) => {
      const hasMemory = await repoHasMemory(cwd);
      if (!hasMemory) return;
      output.context = output.context || [];
      output.context.push(COMPACTION_INJECTION);
    },
  };
};
