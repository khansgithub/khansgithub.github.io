---
title: "About: end-word"
date: 2026-07-22
tags: [word-game, project-overview]
layout: post
---

## What is end-word?

A multiplayer word-chain game (끝말잇기) that doubles as a vocabulary trainer. Players take turns submitting words — each word must start with the last letter of the previous word. A timer counts down per turn; when it expires, you die and the game ends. Every word played displays its definition in both English and Korean, turning each round into a micro-lesson.

Built for Korean learners practicing English, English speakers learning Korean, or friends playing together across skill levels.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + daisyUI
- **Backend:** Next.js API routes + Supabase (Postgres, Auth, Realtime)
- **Dictionary:** Python FastAPI + marisa-trie on Vercel serverless
- **State:** Zustand (userStore, InputBox store) + React useReducer (game state)
- **Realtime:** Supabase Realtime channels (one per room)
- **Testing:** Playwright (E2E) + Vitest (unit) + MSW (API mocking)
- **Logging:** LogLayer (`loglayer` package)
- **Auth:** Two-tier — site lock (global password) + room invite bypass
- **Deploy:** Vercel

## Architecture

```
Server (roomService.ts)
  → persistRoomState() writes to Supabase Postgres
  → broadcastRoomGameState() sends via Supabase Realtime channel
    → useRoomChannel.ts receives via onUpdateRef
      → GameV2.tsx applyRemote callback
        → dispatch(gameStateUpdateClient) to reducer
          → GameState.ts merges into local state
```

## Game Loop

1. **Lobby** — Create a room (name, language, timer duration) or join by invite code. No accounts — just a name.
2. **Waiting** — Host waits as players join. Invite link with copy button. Host starts when ready.
3. **Playing** — Timer ticks. Submit a word starting with the match letter. Invalid words show feedback (no penalty, timer pauses). Correct words update the shared definitions panel. Turn passes.
4. **Timer Death** — Timer expires → player dies. 2-player game: game over. 3+ players: turn skips to next alive player.
5. **Game Over** — Winner declared. "Back to lobby."

## Features

- Korean + English word chains with dictionary definitions (English meaning + Korean translation)
- Configurable timer per room (lobby slider)
- Spectator mode — watch without playing, see definitions accumulate
- Emote reactions (8 options, 1500ms throttle, framer-motion animated)
- Real-time typing draft broadcast (opponents see partial words forming)
- Timer sync protocol (host broadcasts + client requests sync)
- Hangul input validation FSM (Korean syllable composition)
- Site-wide password gate + room invite bypass
- Mock Supabase infrastructure for offline development
- Player exit orchestrator (LEAVE, DISCONNECT, TIMEOUT, DISSOLVE, SPECTATOR)
- Host auto-removes disconnected players (presence tracking)

## Key Lessons

- **E2E tests are a trap.** They feel like coverage but are brittle, slow, and miss edge cases. The game reducer is a pure function and should have been unit-tested from day one.
- **Reach for the library first.** Two weeks building a custom timer hook. `react-timer-hook` did it in 15 lines covering every edge case.
- **Single source of truth for time.** Timer drift happened because the animation value and server value came from different sources. Letting the hook own the value fixed it.
- **Atomic state transitions.** Two `dispatch` calls in one handler created non-deterministic state. Merging kill + turn-advance into a single reducer action (`killPlayerAndNextTurn`) fixed race conditions.
- **Understanding the code is the real bottleneck.** AI wrote most of it — Supabase refactor, spectator mode, realtime channels. Not having a strong mental model makes debugging and testing harder than it needs to be.

## Project Posts

- [2026-06-27: Host > spectator switch, player flow debugging](/blog/2026-06-27)
- [2026-07-05: Broken tests, timer implementation, custom test runner](/blog/2026-07-05)
- [2026-07-07: E2e test attempt, visible state indicators](/blog/2026-07-07)
- [2026-07-10: user_metadata.display_name fix](/blog/2026-07-10)

Repository: not yet public. Will link here when available.
