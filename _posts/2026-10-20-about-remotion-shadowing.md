---
title: "About: remotion-shadowing"
date: 2026-10-20
tags: [remotion, project-overview]
layout: post
---

<div class="ai-summary" markdown="1">
The post describes **remotion-shadowing**, a generator for English shadowing lesson videos.

The key idea is that the video format and the lesson content are kept separate. The format - the section structure, the karaoke word highlight, the repeat-along pause, the key phrase drill - is code. The lesson - the text, the translations, the voices, the imagery - is data and assets. Swapping them produces a different video in the same shape.

It is a **Remotion** project. The lesson lives in a flat `script.json`, one entry per line, and every tunable sits in a single `config.ts` whose type carries per-key documentation. The word-level timings that drive the highlight are derived rather than hand-written, so swapping the voices doesn't mean redoing them by hand.

Around the code sits a harness: a `PROMPTING.md` contract for working with an agent, eight distilled skills, and helper scripts for frame-level inspection and audio probing. A second format, `remotion-shadowing-2`, has since generalised the engine - the cast is data, the background can be a looping clip, and every section is optional.

**In short:** not one video, but a machine for making them - the video is an output, and the reusable part is the engine.
</div>

## What is remotion-shadowing?

a generator for english shadowing lesson videos. the part that matters is that the format and the content are kept apart - the format is code, the lesson is data and assets.

so the video format is fixed. it's a section structure with a karaoke word highlight over each line, a korean translation underneath, a pause at the end of every line so you can repeat along, a card showing the day's key phrase, and a drill where you listen to that phrase and say it back. that structure is what the code knows about.

the lesson inside it is not. the text, the translations, the voices, the imagery, the scenario - all of that is swapped in. the first lesson i made is a cafe scene where people order coffee, but that's just the content i happened to start with. point it at a different script and different assets and you get a different lesson in the same shape.

i built it because making these videos by hand took too much time, and the quality was suffering because of the amount of effort it took. it was a grind where the effort went into the boilerplate instead of the parts that actually mattered. the idea of the video itself is pretty straightforward, so automating it was an option.

the goal was never to make it entirely closed loop. it was more about abstracting away the boilerplate stuff, so that we can focus on more important things like the interface, the audio, the pacing. it exists to automate the video making process - it provides an ai agent interface for editing the video rather than doing things manually.

the first version was a canvas-based html file. after that i tried hyperframes in a couple of different ways, but kept struggling to get things to work the way i wanted - there was too much overhead around how it works. remotion was a lot simpler, so that's what i went with.

## The content

the whole lesson is a flat json array. one entry per line of dialogue.

that's the whole content interface. each entry carries who says it, the english text, the korean translation, which audio file to take it from, the word-level timings that drive the karaoke highlight, and the window to play out of that file.

the voices work the same way. there's one recording per speaker, and a line just says which file and which window to take it from.

imagery is the same. the scene images, the intro clip, the outro still, the logo, the music - they all live in one folder and get referenced by name.

## Deriving the timings

the part that would have killed the whole idea if it had to be done by hand is the word-level timings. they're what drive the karaoke highlight, and they're different for every recording - so they can't live in the script as something you type in.

they're derived instead. there's a script that takes a new per-speaker recording, transcribes it with faster-whisper to get word timestamps, and aligns the script's sentences against that transcript using a window-limited Viterbi-style DP rather than a greedy match. that's the detail that matters - a greedy match lets one mismatched line drag every later boundary with it, and then the whole rest of the video is off.

the comparison is deliberately loose. case, punctuation and digits are ignored, so a script that reads "six fifty" still matches a recording that says "650".

by default it doesn't cut any audio. each line points at the whole source file with a start and an end, and a boundary that landed badly is fixed by editing two numbers rather than re-cutting and re-deriving everything downstream.

each aligned sentence gets a score, and a low one is a real signal - it means the audio genuinely differs from the script there, so the fix is to correct the text rather than widen the window.

then two more scripts check the result. `npm run audit` verifies that every line has words and times, that the counts match, that the times are monotonic, and that every word falls inside its own window. `npm run verify` goes further and checks that each line's words land inside the segment the timeline actually gave it.

## The format

the code knows about the shape of the lesson and nothing about what's in it. it detects where each speaker's section starts from the first line of that section, and the background scene changes with it. the first line's audio is scheduled to start exactly when the intro crossfade completes, and that's enforced structurally rather than by an offset someone typed in and then had to keep adjusting.

word boxes are measured with a hidden DOM span rather than canvas `measureText`, because the canvas disagrees with DOM layout for the display font and it was collapsing the boxes.

## The config

`src/config.ts` is the only file that needs editing to tune anything. it's a plain typed object literal - no logic, just data with comments.

the interesting part is the type. each key carries its own documentation as annotations, so hovering it in VS Code tells you the unit, the default, which section of the video it applies to, and what it interacts with.

that means a typo is a compile error with an exact line number, rather than a silent wrong number that only shows up in a render.

and what those keys tune is the format itself - how long the repeat-along pause is, how fast the dialogue plays, how long the gap is between turns, when the chapter card appears, how long the background takes to crossfade.

## Audio

the music bed is a playlist with a volume envelope, expressed as keyframes. volume is percent rather than a 0-1 gain, and the times are absolute video time rather than time within a track, so the whole bed is tuned on one timeline.

fades, swells and ducking are all just keyframes. a keyframe pair straddling a track boundary crossfades.

there's a distinction that took a while to get straight. **inserts** are sequential - they play in their own window after the matched line, and everything downstream shifts. **overlays** are parallel - they mix over the dialogue without extending the timeline at all. room tone is an overlay, pinned to the first line and looped to the end.

an insert is anchored by naming the line it follows, using the exact english text. that means it survives the dialogue being split or reordered, and if the text doesn't match anything, it throws at build time instead of silently skipping.

## The harness

the part that turned out to matter most wasn't the video at all.

`PROMPTING.md` is the contract for working on the project with an agent. it covers the project language, the units - frames are canonical, seconds are conversational - and the collaboration habits. things like "point at frames, not descriptions", and reading a timecode back before acting on it, because one misread already placed a sound in the wrong spot.

`skills/` holds eight procedures distilled from building the video - adding background music, adding an insert, debugging what renders at a frame, exposing a new tunable in the config. each one is self-contained, with the capabilities list kept honest so an agent doesn't have to rediscover what the project can and can't do.

then there are the helper scripts. `npm run timeline` prints the frame numbers, `npm run framestate -- 900` gives the exact computed state at a frame, and `npm run probe` re-measures the audio. the rule of thumb is cheapest proof first - a framestate number, then a still, then a short range render. stills are for eyes, only a range mp4 proves audio.

the thing the harness keeps running into is that this project fails quietly in several places. missing audio throws, but wrong strings, wrong fonts and wrong names all fall back silently. a wrong drill phrase renders line 1 with no error. so any change to words, names or fonts gets verified with a render, and when two renders should differ, the hashes get compared to prove they do.

## Where it is now

one lesson produced successfully, and it's the first one rather than the only one - the point is the engine, not the video it currently produces.

the next step is a second format, which lives in `remotion-shadowing-2`. it's a narration format rather than a dialogue, and getting it to work meant pulling more of the specifics out of the engine:

- the cast is data. there's a speaker roster, one entry per voice, owning the on-screen names. a missing entry throws and so does an extra one, so the roster *is* the cast.
- the background can be a looping clip rather than a set of scene images, and the two aren't mutually exclusive - the clip wins while it's set.
- the room tone and the one-shot effects are generalised into an ambience layer.
- every section of the video is optional now. absent means disabled - no intro clip, no drill reps, no inserts, silent music - and each one falls back to a default rather than the code caring.

that's the direction the whole thing is heading. the format is a template, the lesson is data, and the template should be able to hold a lesson that looks nothing like the first one.

that codebase has diverged from this one, so merging them back together is still a task.

## Screenshots

![script.json](/assets/images/about-remotion-shadowing-script.png)
the whole lesson content. one entry per line, carrying the text, the translation, the voice and the timings.

![config type](/assets/images/about-remotion-shadowing-config.png)
every tunable is a typed key with its own annotations - unit, default, scope, and what it interacts with.

![config values](/assets/images/about-remotion-shadowing-values.png)
what those keys tune is the format - the repeat-along pause, the playback speed, the gap between turns.

![bgm keyframes](/assets/images/about-remotion-shadowing-bgm.png)
the music bed is a volume envelope in percent, keyed on absolute video time.

![inserts](/assets/images/about-remotion-shadowing-inserts.png)
inserts are anchored to a line of dialogue by its exact text, so they survive a reordering.

## Project Posts

- [2026-10-11: BGM fade out clipping](/blog/raw-audio-clipping)
