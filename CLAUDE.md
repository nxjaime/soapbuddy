# SoapBuddy — Claude Code Project Instructions

## Project Overview

This is a JavaScript/TypeScript SaaS project (SoapBuddy/Soapmaker App) using Supabase, Stripe, and Playwright. Always use these technologies when implementing features.

- **Stack**: React + Vite (frontend) · Supabase (PostgreSQL + Auth + Edge Functions) · Stripe (billing) · Playwright (testing)
- **Repo**: nxjaime/soapbuddy (branch: main)
- **Git root**: `/home/nickj/Documents/Soapmaker_App/SoapManager/`
- **Frontend root**: `web/frontend/src/`
- **Build command**: `npm run build` (run from `web/frontend/`)

## Session Management

When hitting usage limits, immediately create a detailed handoff document (`HANDOFF.md`) with exact next steps, commands to run, and current state so the next session can resume without re-exploration.

A good `HANDOFF.md` includes:
- What was completed this session (with file paths)
- The exact next task to start (not a vague description — a concrete action)
- Any commands that need to be run (migrations, builds, git push)
- Current git state (branch, uncommitted files)

## Work Style

Prioritize execution over exploration. Limit planning/recon to 20% of session effort. Start implementing as soon as a workable plan exists rather than perfecting the plan.

- Read only the files needed to make the current change — do not explore broadly
- Commit working increments early and often so progress is never lost to a limit
- If a task has clear acceptance criteria, implement and verify it before moving to the next

## MCP & Integrations

MCP servers (especially NotebookLM) require auth setup before use. Do not spend extended time debugging MCP auth mid-session — if it fails after one attempt, document the issue and move on to core work.

- **NotebookLM auth**: run `notebooklm-mcp-auth --file /tmp/notebooklm_cookies.txt`, then restart Claude Code
- **Project MCPs** (Supabase, Vercel, mcp-builder) are configured in `.mcp.json` and only load on session start
- If an MCP call fails: log the error, skip that step, and continue with the session's primary goal

## Known Limitations

Never attempt to install or activate plugins/skills mid-session. Skills are only indexed at session startup. Note needed skills for next session instead.

- Plugin activation mid-session does not work — skills load only at startup from `~/.claude/mcp.json`
- If a skill is needed but not loaded, note it in `HANDOFF.md` and restart Claude Code before the next session
- Do not spend session time troubleshooting missing skills — work around them or defer
