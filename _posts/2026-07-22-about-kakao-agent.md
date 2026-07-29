---
title: "About: kakao-agent"
date: 2026-07-22
tags: [kakao-talk, project-overview]
layout: post
---

## What is kakao-agent?

It's a loose collection of automation tools, all orbiting around a friend's content creation needs. It started as an AI chatbot which listens to a KakaoTalk chat room, route messages through pipelines to generate AI responses and send them to KakaoTalk using the `agent-messenger` library. Bit by bit, I started adding unrelated tools to aid in different areas. The fundamental theme around the tools is building materials or workflows for ESL learning content.

This project is **very heavily built and augmented by AI**. The goal for this project was to just build tools that deliver, as fast as possible. My role has been mainly to understand the requirements, sketch the idea, have AI drive the development, and then assess for bugs. I built the initial AI chatbot, with the pipeline architecture and decoupled AI services. After that, I started rapidly iterating over ideas using AI and progressed with the rest of the suite. AI isn't great at more finessed work, especially on brownfield code, so I've refactored parts here and there manually.

- **AI chatbot** - an FAQ assistant chatbot for my friend's brand
- **News Bot** - a workflow that downloads YouTube videos, transcribes and generates a summary given a very specific format and criteria
- **Quick tasks** - a collection of tools with: API interfaces, job caching, individual job handling
- **Post-news API (quicktask)** - an API interface to the `news bot`, with a quicktask browser interface. Provides the ability to configure which YouTube channels to pull videos from, a max number of videos to fetch from each and maximum video length criteria amongst other parameters
- **Post-news-to-github API** - an extension of the post-news API, where instead of sending the summary to KakaoTalk, it's pushed to a github repository
- **Dialogue builder (quicktask)** - Multi-track audio workspace with speech segmentation, per-segment transcription, and ASS subtitle export. Used to automate parts of building a language learning shadowing video series.
- **Video builder (quicktask)** - Takes a background image, subtitle JSON, and audio tracks → generates styled ASS subtitles → encodes final MP4
- **Transcription tool (quicktask)** - YouTube URL or file upload → Whisper → plain text or SRT
- **Grammar post generator (quicktask)** - Takes 3 YouTube URLs at different CEFR levels, transcribes each, analyses grammar patterns, generates a structured language learning post

The project, as named `kakao-agent`, is not very true to its name right now. At present it's a platform housing various tools. The main aspects are:
  - workflows around `agent-messenger` to automate sending / reacting to messages on KakaoTalk
  - workflows around using AI/ollama to enrich data
  - workflows around orchestrating media tools (`ytdlp`, `whisper-cli`, `ffmpeg`) to build media content

## Architecture

The platform has two faces:

**1. Chatbot (Bot Settings)** - A real-time AI agent. The MonitorService listens to chat rooms via `agent-messenger`. When a message arrives, the pipeline host checks which pipelines are assigned to that room, evaluates trigger conditions, runs rate-limit policies, and hands off to the AI provider (Ollama or Gemini). Responses stream back through WebSocket to the React dashboard and are posted to the chat via agent-messenger.

**2. Quick Tasks** - Job-based automation tools. They're interacted through the React UI, and they process in the background with progress tracking. Each task has its own service, config, and job persistence:

```
Quick Tasks (job flows):
  Client POST → Express route → Service.startJob()
    → NewsSummaryService  (YouTube RSS → audio → Whisper → AI summary)
    → GrammarService      (3 YouTube URLs → transcribe → grammar analysis → post)
    → TranscribeService   (audio/video → Whisper → text/SRT)
    → SpeechSegmentsService (multi-track audio workspace → dialogue edit)
    → VideoBuildService   (image + subtitles JSON + audio → ASS → MP4)
```

Both faces share the same Express server, AI providers, config system, and React dashboard - but they serve different purposes. The chatbot is always-on and reactive; quick tasks are on-demand and batch-oriented.

## Components

| Layer | Stack | Purpose |
|-------|-------|---------|
| Server | Node.js + Express 5 + TypeScript (ESM) | HTTP API, WebSocket, pipeline host, all services |
| Client | React 19 + Tailwind CSS + Vite + Zustand | Dashboard: chat monitor, pipeline config, quick-task UIs |
| AI | Ollama (primary, local/cloud) + Google Gemini | Response generation, summarization, grammar analysis |
| STT | Whisper (local) | Speech-to-text for YouTube videos / audio files |
| Protocol | agent-messenger npm (v2.9+) | KakaoTalk integration - handles login, listening, and messaging |
| Pipeline | Custom pipeline host (condition → policies → handler) | Message routing with per-chat pipeline bindings |

## Two Pipelines

**faqBot** - Triggered by `@faq_bot` mentions. Uses the FAQ system prompt to answer questions about the content brand. Response is grounded in a knowledge table of related blog posts with mandatory link references.

**newsBot** - Triggered by `@news_bot` mentions. Runs `NewsSummaryService` to download latest videos from configured YouTube channels, transcribes with Whisper, summarizes with AI, and returns the summaries as KakaoTalk messages.

## Quick Tasks

| Task | What It Does |
|------|-------------|
| **Post News** | Fetches YouTube channels via RSS → downloads audio → transcribes → summarizes → posts to KakaoTalk |
| **Post News (git)** | Same pipeline but pushes summaries to a git repo instead of KakaoTalk |
| **Post Grammar** | Takes 3 YouTube URLs (B1, B2, C1 CEFR levels) → transcribes each → sends to AI for grammar pattern analysis → generates structured grammar post |
| **Transcribe** | YouTube URL or file upload → audio download → Whisper → plain text or SRT |
| **Speech Segments** | Multi-track audio workspace: upload audio, silence-based segmentation, per-segment transcription, ASS subtitle export, timeline export |
| **Video Build** | Background image + subtitles JSON + audio tracks → ASS subtitle file → MP4 with optional soft subtitles |

## AI Providers

**OllamaService** - Communicates with local or cloud Ollama. Default model: `minimax-m2.7:cloud`. Configurable host, API key, temperature, timeout. Automatic fallback to Ollama Cloud when local unreachable. Parallel chat queue management. Anti-poison system prompt.

**GeminiService** - Uses `@google/genai`. Default model: `gemini-2.0-flash`. Same anti-poison prompt as Ollama.

## The Relay Server Dead End

Built a relay server (Bun, port 3000) + Kotlin/JVM relay client to run the post-news task on a mobile device. The idea: the relay server runs agent-messenger's KakaoTalk protocol logic (auth, LOCO state machines) without doing network I/O - it emits JSON commands (`Http`, `TcpConnect`, `TcpSend`) for the Kotlin client to execute against real Kakao servers.

This was eventually abandoned because agent-messenger turned out to work directly on Android. The relay server still exists in `agent-messenger/src/relay/` but the post-news quick task runs natively on the phone via Termux.

## Mock System

Every service has a mock counterpart for development - `MockOllamaService`, `MockAuthService`, `MockChatService`, `MockMonitorService`, `MockPostNewsAppFeedProvider`, etc. Enabled via `config.json` → `env.mock = true`. MockOllamaService can use real Ollama or return canned responses.

## Config System (WIP)

Single `config.json` (Zod-validated) with sections for environment (API keys, ports), pipeline-specific configs (`faqBot`, `newsBot`), services (`news`, `grammar`), and quick-tasks (`postNews`, `grammar`). Pipeline-to-chatroom bindings in `pipeline-config.json`. Config resolution: `quick_tasks.*` → `services.*` → root keys.

## Snapshots

![login screen](/assets/images/about-kakao-agent-login.png)
initially presented with a login screen which does the `agent-messenger` auth.
since the initial usecase was for this to be just a chatbot, the login process is heavily coupled with kakaotalk/agent-messenger.
adding a "skip" was a quick and dirty way to access the homescreen, without requiring auth for kakaotalk.

![homescreen](/assets/images/about-kakao-agent-homescreen.png)
the UI evolved to draw a separation between the chatbot and the "quicktasks".
initially coined quicktask, as you can reach for the tool right from the homescreen.

![chatbot control panel](/assets/images/about-kakao-agent-chatbot.png)
that chatbot interface running in mock mode. options to select which chatrooms to work on, and which pipelines are enabled for each.

![chatbot running (mock) - AI generated responses](/assets/images/about-kakao-agent-chatbot-running.png)
the generated responses appear on the right panel - the faqBot generates AI responses whilst the newsBot generates AI summarised video summaries

![post news quicktask ui](/assets/images/about-kakao-agent-post-news.png)
the interface for the "post-news" quick task. exposing only the most necessary parameters.

![dialogue builder - parse audio](/assets/images/about-kakao-agent-dialogue-parse.png)
the dialogue is used to build shadowing videos.
the inputs are audio files of conversation dialogues.
the tool uses ffmpeg + whisper to parse the speech into segments/bubbles.

![dialogue builder - edit segment bubble](/assets/images/about-kakao-agent-dialogue-edit.png)
there is a basic level of modification supported for the bubbles.
it's necessary to be able to manually change the text as whisper can transcribe things incorrectly.

![dialogue builder - split segment](/assets/images/about-kakao-agent-dialogue-split.png)
the bubbles can be manually split into individual segments.

![dialouge builder - export audio by speaker](/assets/images/about-kakao-agent-dialogue-export.png)
it's important to be able to export the artifacts separately, so they can be edited in a video editor.


## Project Posts

- [2026-07-05: Relay server dead-end, broken tests, timer saga](/blog/2026-07-05)
- [2026-07-10: Whisper crash fix, post-news pipeline, metadata fix](/blog/2026-07-10)
- [2026-07-11: NewsSummaryService refactor, generic type struggles](/blog/2026-07-11)
- [2026-07-13: Generics breakthrough, android git clone (whitespace PAT)](/blog/2026-07-13)
- [2026-07-14: Android app debugging, login flow, termux-chroot](/blog/2026-07-14)
- [2026-07-15: GUI app (Fyne fail → Tauri win), frame-splitter tool](/blog/2026-07-15)
- [2026-07-16: Wiring Tauri to server, architecture written down](/blog/2026-07-16)
- [2026-07-17: Tauri as mini-browser, build succeeds](/blog/2026-07-17)
- [2026-07-19: Friend's Mac setup, termux-chroot, everything crashing](/blog/2026-07-19)
- [2026-07-20: Folder structure, exit code 127, yt-dlp 403 fix](/blog/2026-07-20)
- [2026-07-21: Pipeline working end-to-end, Chrome extension, fraud feeling](/blog/2026-07-21)

Repository: not yet public. Will link here when available.
