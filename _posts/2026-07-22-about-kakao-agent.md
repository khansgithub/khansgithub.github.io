---
title: "About: kakao-agent"
date: 2026-07-22
tags: [kakao-talk, project-overview]
layout: post
---

<div class="ai-summary" markdown="1">
The post describes **kakao-agent**, a growing automation platform originally built around a KakaoTalk FAQ chatbot but now covering a much broader set of content-creation workflows.

 Its main capabilities include:

 - **AI chatbot pipelines** for FAQs and news summaries.
- **YouTube/news processing**, including transcription, summarisation, translation, and grammar-learning material.
- **Audio tools** using Whisper and FFmpeg to turn dialogue recordings into editable, timed speech segments and subtitles.
- **Naver blog automation**, transforming rough text into structured posts and publishing them.
- **Quick tasks** that expose these workflows through a web interface/API, including generating news posts and social-media copy.

 Technically, it uses **Node.js/Express/TypeScript** on the server and **React/Tailwind/Vite/Zustand** for the UI, with **Ollama** for AI and tools such as Whisper, yt-dlp and FFmpeg for media processing. 

 A notable theme is **AI-assisted development**: the author estimates AI produces about 90% of implementations, with manual work still needed for debugging, refactoring and edge cases. Mock services and an AI-oriented documentation/harness system are highlighted as particularly useful for rapid development.

 **In short:** it has evolved from a KakaoTalk bot into a general-purpose, AI-powered content automation platform.
</div>

## What is kakao-agent?

A collection of various automation tools, built for a friend's content creation efforts. The general purpose these serve is to automate manual processes around: creating content, publishing content, and engaging the community.

Initially the project was focused on making an FAQ chatbot, building around built around the incredible `agent-messenger` project. It provides an interface to configure the chatbot, and an architecture that allows for different response pipelines - one of which being an AI response reply pipeline. Over time, it became convenient to use it as a platform to house other tools.

This project is **very heavily built and augmented by AI**. The goal is to build tools that are useful, as fast as possible. My role has been mainly to understand the requirements, build a plan for automation, and have AI drive the development. On average the AI implementation is 90% correct, and the remaining 10% requires manual development, refactoring and debugging.

## Tools and features
- **Chatbot** - essentially a wrapper around `agent-messenger`, with modular pipelines:
	- **FAQ chatbot** - an AI response pipeline; uses a system prompt trained on brand information to produce AI responses, to questions asked in the chatroom (tagged at the bot's name, for example `@FAQ`)
	- **News Bot** - a response pipeline that posts news cards using the `post-news` service, when prompted
- **Services** - workflows are modelled as services which. They are internal but provide a module level API to interact with.
	- **News Service** - a workflow which creates short AI summaries of English news channel YouTube videos, focusing on translating them and extracting key English keywords for studying.
	- **Grammar Service** - a workflow which produces an AI generated worksheet, focused on grammar points which appear in referenced YouTube videos, with sections focused on different CEFR language levels 
	- **Speech Segments** - a workflow to build the audio for roleplay practice videos. The input is audio files, which contain the dialogue of each character. These are then transcribed and broken down into segments, which the user then re-arranges into a back and forth dialogue. The output is separate  audio files with sentences positioned in time for a two-way conversation, and subtitles for the transcription.
	- **Naver Post Automation** - a workflow to build and publish educational posts to the Naver blog platform. The input is loosely structured text which is then transformed by AI to fit a specific structure depending on the type of post to produce. Uses a chrome extenstion Chrome extension> to extract the necessary cookies.
- **Quick tasks** - user-facing collection of all the various tools, exposes them on the `/quick-task` API endpoint, and wraps each tool in a `job` to provide lifecycle tracking.
	- **Post News** - built around `news-service`, the quick task provides an API + browser interface to the workflow , to be able to configure the parameters. Also importantly provides 3 post-creation actions:
		- push generated news to github repository
		- push generated news to kakao chatroom
		- generate social media text from generated news
	- **Speech Segments** - interface for the `Speech Segments` server; provides interface for uploading audio, editing + splicing transcribed speech blocks, rearrange blocks and export of rearranging blocks and exporting> the assets.
	- **Video Build** - a tool made whilst trying to build a plan to automate the creation of shadowing videos; the tool takes assets and uses ffmpeg to output a video in a certain template. Not used as it didn't cover all the required use cases - currently experimenting with `hyperframes` instead
	- **Transcribe** - tool to transcribe audio using `whisper`; YouTube URL or file upload → Whisper → plain text or SRT
	- **Grammar Post** - interface for `Grammar Service`; takes YouTube URLs at different CEFR levels, transcribes each, analyses grammar patterns, generates a structured language learning post
	- **Naver Post** - interface for the `Naver Post Automation` service; provides interface to pass in the initial text for the post and the necessary credentials for the blog. The tool uses AI to build a structured blog post from the data, and publishes the post. 

The project being called `kakao-agent` is not very true to its name right now. It's a platform housing various tools. The main aspects are:
  - workflows around `agent-messenger` to automate sending / reacting to messages on KakaoTalk
  - workflows around using AI to enrich and transform data
  - workflows around orchestrating media tools (`ytdlp`, `whisper-cli`, `ffmpeg`) to build content

## Components

| Layer       | Stack                                                   | Purpose                                                  |
| ----------- | ------------------------------------------------------- | -------------------------------------------------------- |
| Server      | Node.js + Express 5 + TypeScript (ESM)                  | HTTP API, WebSocket, pipeline host, all services         |
| Client      | React 19 + Tailwind CSS + Vite + Zustand                | Dashboard: chat monitor, pipeline config, quick-task UIs |
| AI          | Ollama (cloud models) + Google Gemini (not really used) | Response generation, summarization, grammar analysis     |
| Media tools | Whisper, yt-dlp, ffmpeg                                 | Transcription, download, video/audio editing             |

## Mock System
This is the single biggest win for me in this project - implementing a mocking system early (thank you AI) made development faster and more agile. Every service has a mock counterpart for development - `MockOllamaService`, `MockAuthService`, `MockChatService`, `MockMonitorService`, mock feed/media/publisher.

## Config System
The configuration system isn't perfect, however it is working in its current state. 
A single `config.json` contains all user-level parameters, with sections for environment (API keys, ports), pipeline configs, services, and quick-tasks.

There isn't great type safety for the configuration file, however it is mid-refactor, implementing Zod to generate config schemas.

## Harness
I've shoved all AI conversation derived information into `docs/`. `rules.md` is quite important as I use it to patch common trip-ups that I face when working with agents on this codebase.
I also use [lemma](https://github.com/xenitV1/lemma) to provide persistent memory storage when using OpenCode.

## Snapshots

![login screen](/assets/images/about-kakao-agent-login.png)
initially presented with a login screen which does the `agent-messenger` auth.
since the initial use case was for this to be just a chatbot, the login process is heavily coupled with kakaotalk/agent-messenger.
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

![dialogue builder - export audio by speaker](/assets/images/about-kakao-agent-dialogue-export.png)
it's important to be able to export the artifacts separately, so they can be edited in a video editor.

![naver post automation](/assets/images/about-kakao-agent-naver-post.png)
interface for the naver post automation.


## Project Posts

- [2026-07-05: Relay server and tests](/blog/2026-07-05)
- [2026-07-10: Whisper, post-news pipeline, and metadata](/blog/2026-07-10)
- [2026-07-11: NewsSummaryService refactor](/blog/2026-07-11)
- [2026-07-13: Generics and Android Git setup](/blog/2026-07-13)
- [2026-07-14: Android debugging and login flow](/blog/2026-07-14)
- [2026-07-15: Tauri app and frame-splitter](/blog/2026-07-15)
- [2026-07-16: Tauri and server integration](/blog/2026-07-16)
- [2026-07-17: Tauri browser and build](/blog/2026-07-17)
- [2026-07-19: Mac setup and Termux](/blog/2026-07-19)
- [2026-07-20: Project structure and yt-dlp](/blog/2026-07-20)
- [2026-07-21: End-to-end pipeline and Chrome extension](/blog/2026-07-21)

Repository: not yet public. Will link here when available.
