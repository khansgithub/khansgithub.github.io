---
title: "About: end-word"
date: 2026-07-22
tags: [word-game, project-overview]
layout: post
---

## What is end-word?

A solo/multiplayer web game, where the players take turns submitting words which begin with the last letter of the previous word. There is a timer for how long a player has to submit a word, failing to submit a word or submitting an incorrect word costs a life. When all lives are gone, the player is out of the game. Supports both Korean and English.

Primarily built for English/Korean language learners to practise, in a fun and competitive way.

Still in active development. Currently:
- refactoring out the hiding of the user ID in client-server communication
- implementing the ability for the host to switch to a spectator when creating a game

## Stack

- **Frontend:** React, TypeScript, Tailwind, daisyUI, Zustand
- **Backend:** Next.js, Supabase (Postgres, Auth, Realtime)
- **Dictionary:** Korean: Python FastAPI + marisa-trie, English: WordNet dictionary
- **Testing:** Playwright, Vitest, MSW
- **Deploy:** Vercel

## Features

- Multiplayer (up to 4 players) and solo game support
- Support for spectating games
- Korean definitions for submitted words when playing in English mode
- Configurable timer per room
- In-game emote interactions
- Real-time typing mirroring
- Responsive UI, works on mobile displays

## Screenshots

![lobby](/assets/images/about-end-word-lobby.png)
lobby for creating or joining rooms. language and timer are configurable per room.

![wait screen](/assets/images/about-end-word-wait-screen.png)
waiting to start. players join via invite link before the host starts the game.

![game screen](/assets/images/about-end-word-game-screen.png)
core gameplay - submit a word starting with the match letter before the timer runs out.

![submitting word](/assets/images/about-end-word-submitting.png)
word validation on submit, checked against the dictionary.

![word definition](/assets/images/about-end-word-submit-definition.png)
definitions are shown for submitted words, with Korean explanations in English mode.

![korean mode](/assets/images/about-end-word-kor.png)
the same loop running in Korean mode.

![emote picker](/assets/images/about-end-word-emojis.png)
emotes for some light in-game interaction.

![emote displayed](/assets/images/about-end-word-emoji2.png)
emotes pop up over the game screen for all players to see.

## Project Posts

- [2026-06-27: Host > spectator switch, player flow debugging](/blog/2026-06-27)
- [2026-07-05: Broken tests, timer implementation, custom test runner](/blog/2026-07-05)
- [2026-07-07: E2E test attempt, visible state indicators](/blog/2026-07-07)
- [2026-07-10: user_metadata.display_name fix](/blog/2026-07-10)
