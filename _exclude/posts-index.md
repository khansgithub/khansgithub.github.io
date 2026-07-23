---
title: Posts Index
---

## 2026-06-27 — june 27
`word-game, debugging` — Fixed host-to-spectator transition by removing a premature seat check and adding an `isHost` filter. Found the user ID was already being passed.

## 2026-07-05 — july 5
`word-game, kakao-talk, dev-log, frustration, learning` — Three topics: (1) Broken e2e tests and the struggle of testing AI-written code; (2) Wasted weeks building a relay server before realizing agent-messenger already runs on Android via Bun; (3) Two weeks trying to build a timer countdown bar before switching to a library.

## 2026-07-07 — july 7
`word-game, debugging` — Attempted e2e test for host-to-spectator switch. Derailed by IDE issues and wrong test commands. Key takeaway: reliable e2e tests need visible DOM hooks.

## 2026-07-10 — july 10
`kakao-talk, word-game, frustration, learning` — Two things: (1) Fixed whisper crashes by adding a concurrency queue and singleton pattern; (2) Found `user_metadata.display_name` was never set in the room service — quick fix once diagnosed.

## 2026-07-11 — july 11
`kakao-talk, frustration, typescript` — Refactoring NewsSummaryService to separate concerns. Struggled with TypeScript generics when extending the base class. Side-quest into Go + Fyne GUI. Exhausted without progress.

## 2026-07-13 — july 13
`kakao-talk, android, typescript` — Two struggles: finally understood TypeScript generics (StoredJob itself should be generic); Android jgit clone broken for hours by a trailing whitespace in a PAT token.

## 2026-07-14 — july 14
`kakao-talk, android, frustration` — Got Android app running (downgraded jgit for older API). Set up Termux login script for agent-messenger auth. Blocked by a `%SCRIPT_DIR` vs `$SCRIPT_DIR` typo.

## 2026-07-15 — july 15
`kakao-talk, frustration, side-quest` — Failed attempt at Go + Fyne GUI (GCC/mingw64 nightmare). Abandoned for Tauri. Also built a Python tool for splitting YouTube videos into timestamped frames.

## 2026-07-16 — july 16
`kakao-talk, goal` — Wired the Tauri client to the server. Documented the full three-part architecture: Tauri desktop app → git repo → Android app → agent-messenger.

## 2026-07-17 — july 17
`kakao-talk, shipping` — Realized Tauri could just be a mini-browser redirecting to existing UI. Refactored Routes.tsx to fix circular dependency. Got Tauri building on Mac CI.

## 2026-07-19 — july 19
`kakao-talk, frustration, debugging` — Setting up kakao-agent on a friend's Mac. PAT issues with private repos (fine-grained tokens don't work for collaborators), missing whisper-cli binary, repo cloning bug. Also Termux/phone setup.

## 2026-07-20 — july 20
`kakao-talk, frustration, debugging` — Fixed branch checkout (branch didn't exist yet), added `x-access-token` username for PAT auth, found exit code 127 meant agent-messenger not in PATH. Investigating yt-dlp 403 errors.

## 2026-07-21 — july 21
`kakao-talk, shipping, learning` — Full pipeline works end-to-end. Built a Chrome extension using WASM git client to pull files from repos. Reflected on impostor syndrome: does it feel fulfilling when AI did most of the work?
